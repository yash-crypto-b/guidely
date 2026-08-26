import prisma from '../../db';
import { config } from '../../config';

export interface NotificationInput {
  userId: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, any>;
}

export async function sendNotification(input: NotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data || {},
    },
  });
  return notification;
}

export async function getNotifications(userId: string, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);

  return { notifications, total, unreadCount, page, limit };
}

export async function markNotificationRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { readAt: new Date() },
  });
}

export async function markAllRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (!config.smtp.host) return { sent: false, reason: 'SMTP not configured' };

  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });

    await transporter.sendMail({
      from: config.smtp.from,
      to,
      subject,
      html,
    });

    return { sent: true };
  } catch (error) {
    console.error('Email send failed:', error);
    return { sent: false, reason: 'Send failed' };
  }
}

export async function sendBookingReminder(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      student: { select: { id: true, name: true, email: true } },
      sessionType: true,
    },
  });

  if (!booking) return;

  const timeStr = booking.startTime.toLocaleString();
  const subject = `Reminder: Your session with ${booking.creator.name} is coming up`;

  for (const user of [booking.creator, booking.student]) {
    await sendNotification({
      userId: user.id,
      type: 'booking_reminder',
      title: 'Session Reminder',
      body: `Your session "${booking.sessionType.title}" starts at ${timeStr}`,
      data: { bookingId: booking.id },
    });

    await sendEmail(user.email, subject, `<h2>Session Reminder</h2><p>Your session "${booking.sessionType.title}" with ${booking.creator.name} starts at ${timeStr}.</p><p>Meeting link: ${booking.meetingLink || 'TBD'}</p>`);
  }
}
