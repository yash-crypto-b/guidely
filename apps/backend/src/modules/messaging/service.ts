import prisma from '../../db';
import { NotFoundError, ForbiddenError } from '../../common/errors';
import { SendMessageInput } from './schemas';

export async function sendMessage(userId: string, input: SendMessageInput) {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
  });

  if (!booking) throw new NotFoundError('Booking');
  if (booking.creatorId !== userId && booking.studentId !== userId) {
    throw new ForbiddenError('Not your booking conversation');
  }

  return prisma.message.create({
    data: {
      bookingId: input.bookingId,
      senderId: userId,
      content: input.content,
    },
    include: {
      sender: { select: { id: true, name: true, photoUrl: true } },
    },
  });
}

export async function getMessages(bookingId: string, userId: string, page = 1, limit = 50) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new NotFoundError('Booking');
  if (booking.creatorId !== userId && booking.studentId !== userId) {
    throw new ForbiddenError('Not your booking conversation');
  }

  const skip = (page - 1) * limit;
  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { bookingId },
      skip,
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, name: true, photoUrl: true } },
      },
    }),
    prisma.message.count({ where: { bookingId } }),
  ]);

  return { messages, total, page, limit };
}

export async function markAsRead(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new NotFoundError('Booking');
  if (booking.creatorId !== userId && booking.studentId !== userId) {
    throw new ForbiddenError('Not your booking conversation');
  }

  await prisma.message.updateMany({
    where: {
      bookingId,
      senderId: { not: userId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return { success: true };
}
