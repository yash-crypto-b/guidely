import prisma from '../../db';
import { NotFoundError, ForbiddenError, ValidationError } from '../../common/errors';
import { CreateBookingInput, UpdateBookingStatusInput, CreateReviewInput } from './schemas';
import { BookingStatus } from '@prisma/client';
import { getRedis } from '../../db/redis';
import { config } from '../../config';

export async function getAvailableSlots(creatorId: string, sessionTypeId: string, date: string) {
  const creator = await prisma.user.findFirst({
    where: { id: creatorId, role: 'CREATOR', isActive: true },
    include: {
      availability: { where: { isActive: true } },
      sessionTypes: { where: { id: sessionTypeId, isActive: true } },
    },
  });

  if (!creator) throw new NotFoundError('Creator');
  if (creator.sessionTypes.length === 0) throw new NotFoundError('Session type');

  const sessionType = creator.sessionTypes[0];
  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getUTCDay();

  const dayAvailability = creator.availability.filter((a) => a.dayOfWeek === dayOfWeek);
  if (dayAvailability.length === 0) return [];

  const existingBookings = await prisma.booking.findMany({
    where: {
      creatorId,
      status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
      startTime: {
        gte: new Date(targetDate.setUTCHours(0, 0, 0, 0)),
        lt: new Date(targetDate.setUTCHours(23, 59, 59, 999)),
      },
    },
  });

  const blackoutDates = await prisma.blackoutDate.findMany({
    where: {
      userId: creatorId,
      date: {
        gte: new Date(targetDate.setUTCHours(0, 0, 0, 0)),
        lt: new Date(targetDate.setUTCHours(23, 59, 59, 999)),
      },
    },
  });

  if (blackoutDates.length > 0) return [];

  const slots: { start: string; end: string }[] = [];

  for (const avail of dayAvailability) {
    const [startH, startM] = avail.startTime.split(':').map(Number);
    const [endH, endM] = avail.endTime.split(':').map(Number);
    let current = new Date(date);
    current.setUTCHours(startH, startM, 0, 0);
    const slotEnd = new Date(date);
    slotEnd.setUTCHours(endH, endM, 0, 0);

    while (current.getTime() + sessionType.duration * 60000 <= slotEnd.getTime()) {
      const slotStart = new Date(current);
      const slotEndTime = new Date(current.getTime() + sessionType.duration * 60000);

      const isBooked = existingBookings.some((b) => {
        const bStart = b.startTime.getTime();
        const bEnd = b.endTime.getTime();
        return (slotStart.getTime() < bEnd && slotEndTime.getTime() > bStart);
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

export async function createBooking(userId: string, input: CreateBookingInput) {
  const creator = await prisma.user.findUnique({
    where: { id: input.creatorId },
    include: { sessionTypes: true },
  });

  if (!creator || creator.role !== 'CREATOR') {
    throw new NotFoundError('Creator');
  }

  const sessionType = creator.sessionTypes.find((st) => st.id === input.sessionTypeId);
  if (!sessionType || !sessionType.isActive) {
    throw new NotFoundError('Session type');
  }

  const startTime = new Date(input.startTime);
  const endTime = new Date(startTime.getTime() + sessionType.duration * 60000);

  if (startTime <= new Date()) {
    throw new ValidationError({ startTime: ['Cannot book a session in the past'] });
  }

  const conflicting = await prisma.booking.findFirst({
    where: {
      creatorId: input.creatorId,
      status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });

  if (conflicting) {
    throw new ValidationError({ startTime: ['This time slot is no longer available'] });
  }

  const platformFee = sessionType.price
    ? Math.round(sessionType.price * (config.platform.feePercent / 100))
    : 0;

  const booking = await prisma.booking.create({
    data: {
      creatorId: input.creatorId,
      studentId: userId,
      sessionTypeId: input.sessionTypeId,
      startTime,
      endTime,
      totalAmount: sessionType.price || 0,
      platformFee,
      creatorEarnings: (sessionType.price || 0) - platformFee,
      studentNotes: input.studentNotes,
      meetingProvider: config.video.provider,
      meetingLink: `${config.video.provider === 'jitsi' ? config.video.jitsiDomain : config.video.jitsiDomain}/${input.creatorId}-${Date.now()}`,
    },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      student: { select: { id: true, name: true, email: true } },
      sessionType: true,
    },
  });

  return booking;
}

export async function getUserBookings(userId: string, role: 'creator' | 'student', page = 1, limit = 20) {
  const where = role === 'creator' ? { creatorId: userId } : { studentId: userId };
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { startTime: 'desc' },
      include: {
        creator: { select: { id: true, name: true, photoUrl: true, displayName: true } },
        student: { select: { id: true, name: true, photoUrl: true } },
        sessionType: true,
        review: true,
      },
    }),
    prisma.booking.count({ where }),
  ]);

  return { bookings, total, page, limit };
}

export async function updateBookingStatus(bookingId: string, userId: string, input: UpdateBookingStatusInput) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new NotFoundError('Booking');

  const isCreator = booking.creatorId === userId;
  const isStudent = booking.studentId === userId;

  if (!isCreator && !isStudent) {
    throw new ForbiddenError('Not your booking');
  }

  if (input.status === 'CONFIRMED' && !isCreator) {
    throw new ForbiddenError('Only the creator can confirm bookings');
  }

  if (input.status === 'CANCELLED' && booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
    throw new ValidationError({ status: ['Can only cancel pending or confirmed bookings'] });
  }

  return prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: input.status as BookingStatus,
      cancellationReason: input.cancellationReason,
      cancelledBy: input.status === 'CANCELLED' ? userId : undefined,
    },
    include: {
      creator: { select: { id: true, name: true } },
      student: { select: { id: true, name: true } },
      sessionType: true,
    },
  });
}

export async function createReview(bookingId: string, reviewerId: string, input: CreateReviewInput) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { review: true },
  });

  if (!booking) throw new NotFoundError('Booking');
  if (booking.studentId !== reviewerId) throw new ForbiddenError('Only the student can review');
  if (booking.status !== 'COMPLETED') throw new ValidationError({ booking: ['Can only review completed sessions'] });
  if (booking.review) throw new ValidationError({ booking: ['Already reviewed'] });

  return prisma.review.create({
    data: {
      bookingId,
      reviewerId,
      creatorId: booking.creatorId,
      ...input,
    },
    include: {
      reviewer: { select: { id: true, name: true, photoUrl: true } },
    },
  });
}
