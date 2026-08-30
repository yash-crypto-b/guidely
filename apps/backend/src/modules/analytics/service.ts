import prisma from '../../db';

export interface TrackEventInput {
  eventType: string;
  userId?: string;
  sessionId?: string;
  data?: Record<string, any>;
  source?: string;
  page?: string;
}

// ─── Track Events ──────────────────────────────────────────────────────

export async function trackEvent(input: TrackEventInput) {
  return prisma.analyticsEvent.create({
    data: {
      eventType: input.eventType,
      userId: input.userId,
      sessionId: input.sessionId,
      data: input.data || {},
      source: input.source,
      page: input.page,
    },
  });
}

// ─── Marketplace Analytics ─────────────────────────────────────────────

export async function getMarketplaceAnalytics(startDate?: string, endDate?: string) {
  const where: any = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  // Get event counts by type
  const events = await prisma.analyticsEvent.groupBy({
    by: ['eventType'],
    where,
    _count: true,
  });

  // Get bookings by attribution source
  const bookings = await prisma.booking.groupBy({
    by: ['attributionSource'],
    where: {
      createdAt: where.createdAt || undefined,
    },
    _count: true,
    _sum: {
      totalAmount: true,
      platformFee: true,
      creatorEarnings: true,
    },
  });

  // Get conversion funnel
  const funnel = await getConversionFunnel(where);

  // Get daily trends
  const dailyTrends = await getDailyTrends(where);

  return {
    events: events.reduce((acc, e) => {
      acc[e.eventType] = e._count;
      return acc;
    }, {} as Record<string, number>),
    bookings: bookings.map(b => ({
      source: b.attributionSource,
      count: b._count,
      revenue: b._sum.totalAmount || 0,
      platformFees: b._sum.platformFee || 0,
      creatorEarnings: b._sum.creatorEarnings || 0,
    })),
    funnel,
    dailyTrends,
  };
}

async function getConversionFunnel(where: any) {
  // Simplified funnel: page_view -> search -> profile_view -> booking_start -> booking_complete
  const eventTypes = [
    'marketplace_visit',
    'mentor_search',
    'mentor_profile_view',
    'booking_started',
    'booking_completed',
  ];

  const counts = await Promise.all(
    eventTypes.map(type =>
      prisma.analyticsEvent.count({
        where: { ...where, eventType: type },
      })
    )
  );

  return eventTypes.map((type, i) => ({
    step: type,
    count: counts[i],
    conversionRate: i > 0 && counts[i - 1] > 0
      ? Math.round((counts[i] / counts[i - 1]) * 100 * 10) / 10
      : 100,
  }));
}

async function getDailyTrends(where: any) {
  const events = await prisma.analyticsEvent.findMany({
    where,
    select: {
      eventType: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Group by date
  const byDate: Record<string, Record<string, number>> = {};
  for (const event of events) {
    const date = event.createdAt.toISOString().split('T')[0];
    if (!byDate[date]) byDate[date] = {};
    byDate[date][event.eventType] = (byDate[date][event.eventType] || 0) + 1;
  }

  return Object.entries(byDate).map(([date, counts]) => ({
    date,
    ...counts,
  }));
}

// ─── Mentor Performance ────────────────────────────────────────────────

export async function getMentorPerformance(mentorId: string) {
  const [bookings, reviews, views] = await Promise.all([
    prisma.booking.findMany({
      where: { creatorId: mentorId },
      select: {
        attributionSource: true,
        totalAmount: true,
        platformFee: true,
        creatorEarnings: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.review.findMany({
      where: { creatorId: mentorId },
      select: {
        rating: true,
        createdAt: true,
      },
    }),
    prisma.analyticsEvent.count({
      where: {
        eventType: 'mentor_profile_view',
      },
    }),
  ]);

  const totalBookings = bookings.length;
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const directBookings = bookings.filter(b => b.attributionSource === 'DIRECT').length;
  const marketplaceBookings = bookings.filter(b => b.attributionSource === 'MARKETPLACE').length;
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return {
    totalBookings,
    completedBookings,
    completionRate: totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0,
    totalRevenue,
    directBookings,
    marketplaceBookings,
    avgRating: Math.round(avgRating * 10) / 10,
    totalReviews: reviews.length,
    profileViews: views,
    conversionRate: views > 0 ? Math.round((totalBookings / views) * 100 * 10) / 10 : 0,
  };
}
