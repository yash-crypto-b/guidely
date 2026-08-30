import prisma from '../../db';
import { NotFoundError, ForbiddenError, ValidationError } from '../../common/errors';
import {
  UpdateMentorProfileInput,
  CreateServiceInput,
  SearchMentorsInput,
  CreateBookingRequestInput,
} from './schemas';
import { Role, AttributionSource, BookingStatus } from '@prisma/client';

// ─── Mentor Profile ────────────────────────────────────────────────────

export async function updateMentorProfile(userId: string, input: UpdateMentorProfileInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User');

  // Auto-promote to CREATOR role on first mentor profile update
  const needsPromotion = user.role === Role.STUDENT;
  const data: Record<string, any> = {};
  if (needsPromotion) {
    data.role = Role.CREATOR;
  }

  if (input.company !== undefined) data.company = input.company;
  if (input.industry !== undefined) data.industry = input.industry;
  if (input.location !== undefined) data.location = input.location;
  if (input.yearsExperience !== undefined) data.yearsExperience = input.yearsExperience;
  if (input.languages !== undefined) data.languages = input.languages;
  if (input.linkedInUrl !== undefined) data.linkedInUrl = input.linkedInUrl;
  if (input.portfolioUrl !== undefined) data.portfolioUrl = input.portfolioUrl;
  if (input.resumeUrl !== undefined) data.resumeUrl = input.resumeUrl;
  if (input.hourlyRate !== undefined) data.hourlyRate = input.hourlyRate;
  if (input.headline !== undefined) data.headline = input.headline;
  if (input.bio !== undefined) data.bio = input.bio;

  if (input.expertiseTags) {
    const tags = await Promise.all(
      input.expertiseTags.map(async (name) => {
        return prisma.tag.upsert({
          where: { name },
          create: { name },
          update: {},
        });
      })
    );
    await prisma.creatorTag.deleteMany({ where: { creatorId: userId } });
    await prisma.creatorTag.createMany({
      data: tags.map((tag) => ({ creatorId: userId, tagId: tag.id })),
    });
  }

  if (input.socialLinks) {
    await prisma.socialLink.deleteMany({ where: { userId } });
    await prisma.socialLink.createMany({
      data: input.socialLinks.map((link) => ({ userId, ...link })),
    });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    include: {
      creatorTags: { include: { tag: true } },
      socialLinks: true,
    },
  });

  return sanitizeUser(updated);
}

export async function getMentorProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      creatorTags: { include: { tag: true } },
      socialLinks: true,
      sessionTypes: { where: { isActive: true } },
      availability: { where: { isActive: true } },
      _count: {
        select: {
          creatorBookings: { where: { status: 'COMPLETED' } },
          reviewsReceived: true,
        },
      },
      reviewsReceived: {
        include: { reviewer: { select: { id: true, name: true, photoUrl: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });
  if (!user) throw new NotFoundError('User');
  return sanitizeUser(user);
}

// ─── Public Mentor Profile ─────────────────────────────────────────────

export async function getPublicMentorProfile(handle: string) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { displayName: handle },
        { id: handle },
      ],
      role: { in: [Role.CREATOR, Role.ADMIN, Role.SUPERADMIN] },
      isActive: true,
    },
    include: {
      creatorTags: { include: { tag: true } },
      socialLinks: true,
      sessionTypes: {
        where: { isActive: true },
        orderBy: { price: 'asc' },
      },
      availability: { where: { isActive: true } },
      _count: {
        select: {
          creatorBookings: { where: { status: 'COMPLETED' } },
          reviewsReceived: true,
        },
      },
      reviewsReceived: {
        include: { reviewer: { select: { id: true, name: true, photoUrl: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!user) throw new NotFoundError('Mentor');

  const avgRating = user.reviewsReceived.length > 0
    ? user.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / user.reviewsReceived.length
    : null;

  return {
    ...sanitizeUser(user),
    rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
    reviewCount: user._count.reviewsReceived,
    completedSessions: user._count.creatorBookings,
  };
}

// ─── Marketplace Search ────────────────────────────────────────────────

export async function searchMentors(query: SearchMentorsInput) {
  const page = query.page || 1;
  const limit = Math.min(query.limit || 20, 50);
  const skip = (page - 1) * limit;

  const where: any = {
    role: { in: [Role.CREATOR, Role.ADMIN, Role.SUPERADMIN] },
    isActive: true,
    sessionTypes: { some: { isActive: true } },
  };

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { headline: { contains: query.search, mode: 'insensitive' } },
      { bio: { contains: query.search, mode: 'insensitive' } },
      { company: { contains: query.search, mode: 'insensitive' } },
      { creatorTags: { some: { tag: { name: { contains: query.search, mode: 'insensitive' } } } } },
    ];
  }

  if (query.industry) {
    where.industry = { contains: query.industry, mode: 'insensitive' };
  }

  if (query.role) {
    where.headline = { contains: query.role, mode: 'insensitive' };
  }

  if (query.skills && query.skills.length > 0) {
    where.creatorTags = {
      some: { tag: { name: { in: query.skills } } },
    };
  }

  if (query.experienceLevel) {
    const levels: Record<string, [number, number]> = {
      junior: [0, 3],
      mid: [3, 7],
      senior: [7, 15],
      lead: [15, 60],
    };
    const range = levels[query.experienceLevel.toLowerCase()];
    if (range) {
      where.yearsExperience = { gte: range[0], lte: range[1] };
    }
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.sessionTypes = {
      some: {
        isActive: true,
        price: {
          ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
          ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
        },
      },
    };
  }

  if (query.language) {
    where.languages = { has: query.language };
  }

  if (query.deliveryType) {
    where.sessionTypes = {
      some: {
        isActive: true,
        deliveryType: query.deliveryType as any,
      },
    };
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        creatorTags: { include: { tag: true } },
        sessionTypes: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
          take: 3,
        },
        _count: {
          select: {
            creatorBookings: { where: { status: 'COMPLETED' } },
            reviewsReceived: true,
          },
        },
        reviewsReceived: { select: { rating: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const mentors = users.map((u) => {
    const avgRating = u.reviewsReceived.length > 0
      ? u.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / u.reviewsReceived.length
      : null;
    return {
      id: u.id,
      name: u.name,
      displayName: u.displayName,
      photoUrl: u.photoUrl,
      headline: u.headline,
      bio: u.bio,
      company: u.company,
      industry: u.industry,
      location: u.location,
      yearsExperience: u.yearsExperience,
      languages: u.languages,
      expertiseTags: u.creatorTags.map((ct) => ct.tag.name),
      services: u.sessionTypes.map((st) => ({
        id: st.id,
        title: st.title,
        price: st.price,
        isFree: st.isFree,
        duration: st.duration,
        deliveryType: st.deliveryType,
      })),
      rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      reviewCount: u._count.reviewsReceived,
      completedSessions: u._count.creatorBookings,
      startingPrice: u.sessionTypes.length > 0
        ? Math.min(...u.sessionTypes.filter(s => !s.isFree && s.price).map(s => s.price!))
        : null,
    };
  });

  return {
    mentors,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ─── Services ──────────────────────────────────────────────────────────

export async function createService(userId: string, input: CreateServiceInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User');
  if (user.role !== Role.CREATOR && user.role !== Role.ADMIN && user.role !== Role.SUPERADMIN) {
    throw new ForbiddenError('Only creators can create services');
  }

  return prisma.sessionTypeDefinition.create({
    data: {
      creatorId: userId,
      title: input.title,
      description: input.description,
      duration: input.duration,
      price: input.isFree ? 0 : (input.price || 0),
      isFree: input.isFree || false,
      type: 'ONE_ON_ONE',
      deliveryType: input.deliveryType || 'VIDEO_CALL',
      maxBookingsPerDay: input.maxBookingsPerDay,
      availableDays: input.availableDays || [1, 2, 3, 4, 5],
    },
  });
}

export async function updateService(userId: string, serviceId: string, input: Partial<CreateServiceInput>) {
  const service = await prisma.sessionTypeDefinition.findFirst({
    where: { id: serviceId, creatorId: userId },
  });
  if (!service) throw new NotFoundError('Service');

  const updateData: Record<string, any> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.duration !== undefined) updateData.duration = input.duration;
  if (input.isFree !== undefined) {
    updateData.isFree = input.isFree;
    if (input.isFree) updateData.price = 0;
  }
  if (input.price !== undefined && !input.isFree) updateData.price = input.price;
  if (input.deliveryType !== undefined) updateData.deliveryType = input.deliveryType;
  if (input.maxBookingsPerDay !== undefined) updateData.maxBookingsPerDay = input.maxBookingsPerDay;
  if (input.availableDays !== undefined) updateData.availableDays = input.availableDays;

  return prisma.sessionTypeDefinition.update({
    where: { id: serviceId },
    data: updateData,
  });
}

export async function deleteService(userId: string, serviceId: string) {
  const service = await prisma.sessionTypeDefinition.findFirst({
    where: { id: serviceId, creatorId: userId },
  });
  if (!service) throw new NotFoundError('Service');

  return prisma.sessionTypeDefinition.update({
    where: { id: serviceId },
    data: { isActive: false },
  });
}

export async function getMentorServices(userId: string) {
  return prisma.sessionTypeDefinition.findMany({
    where: { creatorId: userId, isActive: true },
    orderBy: { createdAt: 'desc' },
  });
}

// ─── Bookings with Attribution ─────────────────────────────────────────

export async function createConnectionBooking(userId: string, mentorHandle: string, input: CreateBookingRequestInput) {
  // Find the mentor
  const mentor = await prisma.user.findFirst({
    where: {
      OR: [
        { displayName: mentorHandle },
        { id: mentorHandle },
      ],
      role: { in: [Role.CREATOR, Role.ADMIN, Role.SUPERADMIN] },
      isActive: true,
    },
    include: { sessionTypes: true },
  });
  if (!mentor) throw new NotFoundError('Mentor');

  const service = mentor.sessionTypes.find(
    (s) => s.id === input.serviceId && s.isActive
  );
  if (!service) throw new NotFoundError('Service');

  // Determine attribution source
  const attributionSource: AttributionSource =
    input.referralSource === 'direct' ? AttributionSource.DIRECT : AttributionSource.MARKETPLACE;

  // Apply commission rate
  const commissionRate = attributionSource === AttributionSource.DIRECT ? 5 : 20;
  const platformFee = service.price
    ? Math.round(service.price * (commissionRate / 100))
    : 0;
  const creatorEarnings = (service.price || 0) - platformFee;

  // Parse start time
  const startTime = new Date(input.startTime);
  const endTime = new Date(startTime.getTime() + service.duration * 60000);

  if (startTime <= new Date()) {
    throw new ValidationError({ startTime: ['Cannot book a session in the past'] });
  }

  // Check for conflicts
  const conflicting = await prisma.booking.findFirst({
    where: {
      creatorId: mentor.id,
      status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });

  if (conflicting) {
    throw new ValidationError({ startTime: ['This time slot is no longer available'] });
  }

  // Check max bookings per day
  if (service.maxBookingsPerDay) {
    const dayStart = new Date(startTime);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(startTime);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const dayBookings = await prisma.booking.count({
      where: {
        creatorId: mentor.id,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        startTime: { gte: dayStart, lte: dayEnd },
      },
    });

    if (dayBookings >= service.maxBookingsPerDay) {
      throw new ValidationError({ startTime: ['Mentor has reached maximum bookings for this day'] });
    }
  }

  const booking = await prisma.booking.create({
    data: {
      creatorId: mentor.id,
      studentId: userId,
      sessionTypeId: service.id,
      startTime,
      endTime,
      totalAmount: service.price || 0,
      platformFee,
      creatorEarnings,
      attributionSource,
      commissionRate,
      bookingMetadata: input.bookingMetadata,
      studentNotes: input.bookingMetadata,
      meetingProvider: 'jitsi',
      meetingLink: `meet.jit.si/${mentor.id}-${Date.now()}`,
    },
    include: {
      creator: { select: { id: true, name: true, email: true, photoUrl: true } },
      student: { select: { id: true, name: true, email: true } },
      sessionType: true,
    },
  });

  // Send booking confirmation emails
  try {
    const { sendBookingConfirmation } = require('../notifications/service');
    await sendBookingConfirmation(booking.id);
  } catch (emailError) {
    console.error('Failed to send booking confirmation:', emailError);
    // Don't fail the booking if email fails
  }

  return booking;
}

// ─── Mentor Dashboard: Earnings ────────────────────────────────────────

export async function getMentorEarnings(userId: string) {
  const bookings = await prisma.booking.findMany({
    where: {
      creatorId: userId,
      status: { in: ['CONFIRMED', 'COMPLETED'] },
    },
    include: {
      student: { select: { id: true, name: true, photoUrl: true } },
      sessionType: { select: { title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalEarnings = bookings.reduce((sum, b) => sum + (b.creatorEarnings || 0), 0);
  const totalPlatformFees = bookings.reduce((sum, b) => sum + (b.platformFee || 0), 0);
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const directBookings = bookings.filter(b => b.attributionSource === 'DIRECT');
  const marketplaceBookings = bookings.filter(b => b.attributionSource === 'MARKETPLACE');

  const directEarnings = directBookings.reduce((sum, b) => sum + (b.creatorEarnings || 0), 0);
  const marketplaceEarnings = marketplaceBookings.reduce((sum, b) => sum + (b.creatorEarnings || 0), 0);
  const directFees = directBookings.reduce((sum, b) => sum + (b.platformFee || 0), 0);
  const marketplaceFees = marketplaceBookings.reduce((sum, b) => sum + (b.platformFee || 0), 0);

  return {
    totalEarnings,
    totalPlatformFees,
    totalRevenue,
    totalBookings: bookings.length,
    direct: {
      bookings: directBookings.length,
      earnings: directEarnings,
      fees: directFees,
      commissionRate: 5,
    },
    marketplace: {
      bookings: marketplaceBookings.length,
      earnings: marketplaceEarnings,
      fees: marketplaceFees,
      commissionRate: 20,
    },
    recentBookings: bookings.slice(0, 10).map(b => ({
      id: b.id,
      mentee: b.student.name,
      menteePhoto: b.student.photoUrl,
      service: b.sessionType.title,
      amount: b.totalAmount,
      earnings: b.creatorEarnings,
      platformFee: b.platformFee,
      attributionSource: b.attributionSource,
      commissionRate: b.commissionRate,
      startTime: b.startTime,
      status: b.status,
    })),
  };
}

// ─── Saved Mentors ─────────────────────────────────────────────────────

export async function saveMentor(userId: string, mentorId: string) {
  const existing = await prisma.savedMentor.findUnique({
    where: { userId_mentorId: { userId, mentorId } },
  });

  if (existing) {
    await prisma.savedMentor.delete({ where: { id: existing.id } });
    return { saved: false };
  }

  await prisma.savedMentor.create({
    data: { userId, mentorId },
  });
  return { saved: true };
}

export async function getSavedMentors(userId: string) {
  const saved = await prisma.savedMentor.findMany({
    where: { userId },
    include: {
      mentor: {
        include: {
          creatorTags: { include: { tag: true } },
          sessionTypes: {
            where: { isActive: true },
            take: 1,
          },
          _count: {
            select: { reviewsReceived: true },
          },
          reviewsReceived: { select: { rating: true } },
        },
      },
    },
    orderBy: { savedAt: 'desc' },
  });

  return saved.map(s => {
    const avgRating = s.mentor.reviewsReceived.length > 0
      ? s.mentor.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / s.mentor.reviewsReceived.length
      : null;

    return {
      id: s.mentor.id,
      name: s.mentor.name,
      displayName: s.mentor.displayName,
      photoUrl: s.mentor.photoUrl,
      headline: s.mentor.headline,
      expertiseTags: s.mentor.creatorTags.map(ct => ct.tag.name),
      startingPrice: s.mentor.sessionTypes[0]?.price || null,
      rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      reviewCount: s.mentor._count.reviewsReceived,
      savedAt: s.savedAt,
    };
  });
}

// ─── Mentee Bookings ──────────────────────────────────────────────────

export async function getMenteeBookings(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where: { studentId: userId },
      skip,
      take: limit,
      orderBy: { startTime: 'desc' },
      include: {
        creator: { select: { id: true, name: true, photoUrl: true, displayName: true, headline: true } },
        sessionType: { select: { title: true, duration: true, deliveryType: true } },
        review: true,
      },
    }),
    prisma.booking.count({ where: { studentId: userId } }),
  ]);

  return { bookings, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ─── Reviews ─────────────────────────────────────────────────────────

export async function createConnectionReview(
  bookingId: string,
  reviewerId: string,
  input: { rating: number; comment?: string }
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { review: true },
  });

  if (!booking) throw new NotFoundError('Booking');
  if (booking.studentId !== reviewerId) throw new ForbiddenError('Only the mentee can leave a review');
  if (booking.status !== 'COMPLETED') throw new ValidationError({ booking: ['Can only review completed sessions'] });
  if (booking.review) throw new ValidationError({ booking: ['Already reviewed'] });

  const review = await prisma.review.create({
    data: {
      bookingId,
      reviewerId,
      creatorId: booking.creatorId,
      rating: input.rating,
      comment: input.comment,
    },
    include: {
      reviewer: { select: { id: true, name: true, photoUrl: true } },
    },
  });

  // Send review notification to mentor
  try {
    const { sendNotification } = require('../notifications/service');
    await sendNotification({
      userId: booking.creatorId,
      type: 'review_received',
      title: 'New Review',
      body: `You received a ${input.rating}-star review`,
      data: { bookingId, reviewId: review.id },
    });
  } catch (error) {
    console.error('Failed to send review notification:', error);
  }

  return review;
}

// ─── Recommendations (placeholder) ────────────────────────────────────

export async function getRecommendedMentors(userId: string, limit = 6) {
  // For now, return popular mentors based on rating and reviews
  const mentors = await prisma.user.findMany({
    where: {
      role: { in: [Role.CREATOR, Role.ADMIN, Role.SUPERADMIN] },
      isActive: true,
      sessionTypes: { some: { isActive: true } },
    },
    take: limit,
    include: {
      creatorTags: { include: { tag: true } },
      sessionTypes: {
        where: { isActive: true },
        take: 1,
      },
      _count: {
        select: {
          reviewsReceived: true,
          creatorBookings: { where: { status: 'COMPLETED' } },
        },
      },
      reviewsReceived: { select: { rating: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return mentors.map(u => {
    const avgRating = u.reviewsReceived.length > 0
      ? u.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / u.reviewsReceived.length
      : null;

    return {
      id: u.id,
      name: u.name,
      displayName: u.displayName,
      photoUrl: u.photoUrl,
      headline: u.headline,
      company: u.company,
      expertiseTags: u.creatorTags.map(ct => ct.tag.name),
      startingPrice: u.sessionTypes[0]?.price || null,
      rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      reviewCount: u._count.reviewsReceived,
      completedSessions: u._count.creatorBookings,
    };
  });
}

// ─── Available Slots (enhanced) ───────────────────────────────────────

export async function getServiceSlots(mentorHandle: string, serviceId: string, date: string) {
  const mentor = await prisma.user.findFirst({
    where: {
      OR: [
        { displayName: mentorHandle },
        { id: mentorHandle },
      ],
      role: { in: [Role.CREATOR, Role.ADMIN, Role.SUPERADMIN] },
      isActive: true,
    },
    include: {
      availability: { where: { isActive: true } },
      sessionTypes: { where: { id: serviceId, isActive: true } },
    },
  });

  if (!mentor) throw new NotFoundError('Mentor');
  if (mentor.sessionTypes.length === 0) throw new NotFoundError('Service');

  const service = mentor.sessionTypes[0];
  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getUTCDay();

  // Check if service is available on this day
  if (!service.availableDays.includes(dayOfWeek)) return [];

  const dayAvailability = mentor.availability.filter(a => a.dayOfWeek === dayOfWeek);
  if (dayAvailability.length === 0) return [];

  const dayStart = new Date(targetDate);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(targetDate);
  dayEnd.setUTCHours(23, 59, 59, 999);

  const [existingBookings, blackoutDates] = await Promise.all([
    prisma.booking.findMany({
      where: {
        creatorId: mentor.id,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
        startTime: { gte: dayStart, lt: dayEnd },
      },
    }),
    prisma.blackoutDate.findMany({
      where: {
        userId: mentor.id,
        date: { gte: dayStart, lt: dayEnd },
      },
    }),
  ]);

  if (blackoutDates.length > 0) return [];

  const slots: { start: string; end: string }[] = [];

  for (const avail of dayAvailability) {
    const [startH, startM] = avail.startTime.split(':').map(Number);
    const [endH, endM] = avail.endTime.split(':').map(Number);
    let current = new Date(date);
    current.setUTCHours(startH, startM, 0, 0);
    const slotEnd = new Date(date);
    slotEnd.setUTCHours(endH, endM, 0, 0);

    while (current.getTime() + service.duration * 60000 <= slotEnd.getTime()) {
      const slotStart = new Date(current);
      const slotEndTime = new Date(current.getTime() + service.duration * 60000);

      const isBooked = existingBookings.some(b => {
        return slotStart.getTime() < b.endTime.getTime() && slotEndTime.getTime() > b.startTime.getTime();
      });

      if (!isBooked && slotStart > new Date()) {
        slots.push({
          start: slotStart.toISOString(),
          end: slotEndTime.toISOString(),
        });
      }

      current = new Date(current.getTime() + 30 * 60000);
    }
  }

  return slots;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function sanitizeUser(user: any) {
  const { passwordHash, refreshToken, ...safe } = user;
  return safe;
}
