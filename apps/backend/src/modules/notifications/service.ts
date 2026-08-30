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

export async function sendBookingConfirmation(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      creator: { select: { id: true, name: true, email: true, displayName: true } },
      student: { select: { id: true, name: true, email: true } },
      sessionType: true,
    },
  });

  if (!booking) return;

  // Notify mentee
  await sendNotification({
    userId: booking.studentId,
    type: 'booking_confirmed',
    title: 'Booking Confirmed',
    body: `Your session "${booking.sessionType.title}" with ${booking.creator.name} has been confirmed`,
    data: { bookingId: booking.id },
  });

  // Notify mentor
  await sendNotification({
    userId: booking.creatorId,
    type: 'new_booking',
    title: 'New Booking',
    body: `${booking.student.name} has booked "${booking.sessionType.title}" with you`,
    data: { bookingId: booking.id },
  });

  // Send emails with templates
  const { bookingConfirmationMentee, bookingConfirmationMentor } = require('./emailTemplates');

  await sendEmail(
    booking.student.email,
    `Booking Confirmed: ${booking.sessionType.title} with ${booking.creator.name}`,
    bookingConfirmationMentee({
      menteeName: booking.student.name,
      mentorName: booking.creator.displayName || booking.creator.name,
      serviceTitle: booking.sessionType.title,
      startTime: booking.startTime,
      duration: booking.sessionType.duration,
      meetingLink: booking.meetingLink || undefined,
      bookingId: booking.id,
    })
  );

  await sendEmail(
    booking.creator.email,
    `New Booking: ${booking.student.name} booked ${booking.sessionType.title}`,
    bookingConfirmationMentor({
      menteeName: booking.student.name,
      mentorName: booking.creator.displayName || booking.creator.name,
      serviceTitle: booking.sessionType.title,
      startTime: booking.startTime,
      duration: booking.sessionType.duration,
      meetingLink: booking.meetingLink || undefined,
      bookingMetadata: booking.bookingMetadata || undefined,
    })
  );
}

export async function sendBookingReminder(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      creator: { select: { id: true, name: true, email: true, displayName: true } },
      student: { select: { id: true, name: true, email: true } },
      sessionType: true,
    },
  });

  if (!booking) return;

  const now = new Date();
  const minutesUntil = Math.round((booking.startTime.getTime() - now.getTime()) / 60000);

  const timeStr = booking.startTime.toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const { sessionReminder } = require('./emailTemplates');

  // Notify both parties
  for (const [user, otherParty, isCreator] of [
    [booking.creator, booking.student, true],
    [booking.student, booking.creator, false],
  ] as any[]) {
    await sendNotification({
      userId: user.id,
      type: 'booking_reminder',
      title: 'Session Reminder',
      body: `Your session "${booking.sessionType.title}" starts at ${timeStr}`,
      data: { bookingId: booking.id },
    });

    await sendEmail(
      user.email,
      `Reminder: Your session starts ${minutesUntil <= 60 ? 'soon' : 'in a few hours'}`,
      sessionReminder({
        recipientName: user.name,
        otherPartyName: otherParty.displayName || otherParty.name,
        serviceTitle: booking.sessionType.title,
        startTime: booking.startTime,
        meetingLink: booking.meetingLink || undefined,
        minutesUntil,
      })
    );
  }
}

export async function sendReviewRequest(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      creator: { select: { id: true, name: true, displayName: true } },
      student: { select: { id: true, name: true, email: true } },
      sessionType: true,
    },
  });

  if (!booking) return;

  await sendNotification({
    userId: booking.studentId,
    type: 'review_request',
    title: 'Leave a Review',
    body: `How was your session with ${booking.creator.name}?`,
    data: { bookingId: booking.id },
  });

  const { reviewRequest } = require('./emailTemplates');
  await sendEmail(
    booking.student.email,
    `How was your session with ${booking.creator.name}?`,
    reviewRequest({
      menteeName: booking.student.name,
      mentorName: booking.creator.displayName || booking.creator.name,
      serviceTitle: booking.sessionType.title,
      bookingId: booking.id,
    })
  );
}
