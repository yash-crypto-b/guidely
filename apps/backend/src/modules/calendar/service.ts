import prisma from '../../db';
import { NotFoundError, ForbiddenError } from '../../common/errors';

// ─── Generate iCal for a booking ──────────────────────────────────────

function formatICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeICalText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function generateBookingICal(booking: {
  id: string;
  startTime: Date;
  endTime: Date;
  serviceTitle: string;
  mentorName: string;
  menteeName: string;
  meetingLink?: string;
  description?: string;
}): string {
  const now = formatICalDate(new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Guidely//Mentorship Platform//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${booking.id}@guidely.dev`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatICalDate(booking.startTime)}`,
    `DTEND:${formatICalDate(booking.endTime)}`,
    `SUMMARY:${escapeICalText(booking.serviceTitle)} with ${escapeICalText(booking.mentorName)}`,
    `DESCRIPTION:${escapeICalText(booking.description || `Session between ${booking.menteeName} and ${booking.mentorName}`)}`,
    `ORGANIZER;CN=${escapeICalText(booking.mentorName)}:mailto:noreply@guidely.dev`,
    `ATTENDEE;CN=${escapeICalText(booking.menteeName)}:mailto:noreply@guidely.dev`,
    'STATUS:CONFIRMED',
  ];

  if (booking.meetingLink) {
    lines.push(`URL:${booking.meetingLink}`);
    lines.push(`LOCATION:${booking.meetingLink}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n');
}

// ─── Get booking iCal ─────────────────────────────────────────────────

export async function getBookingICal(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      creator: { select: { id: true, name: true, displayName: true } },
      student: { select: { id: true, name: true } },
      sessionType: { select: { title: true } },
    },
  });

  if (!booking) throw new NotFoundError('Booking');
  if (booking.creatorId !== userId && booking.studentId !== userId) {
    throw new ForbiddenError('Not your booking');
  }

  return generateBookingICal({
    id: booking.id,
    startTime: booking.startTime,
    endTime: booking.endTime,
    serviceTitle: booking.sessionType.title,
    mentorName: booking.creator.displayName || booking.creator.name,
    menteeName: booking.student.name,
    meetingLink: booking.meetingLink || undefined,
    description: booking.bookingMetadata || undefined,
  });
}

// ─── Get user's calendar feed ─────────────────────────────────────────

export async function getUserCalendarFeed(userId: string) {
  const bookings = await prisma.booking.findMany({
    where: {
      OR: [
        { creatorId: userId },
        { studentId: userId },
      ],
      status: { in: ['CONFIRMED', 'PENDING'] },
      startTime: { gte: new Date() },
    },
    include: {
      creator: { select: { id: true, name: true, displayName: true } },
      student: { select: { id: true, name: true } },
      sessionType: { select: { title: true } },
    },
    orderBy: { startTime: 'asc' },
  });

  const now = formatICalDate(new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Guidely//Mentorship Platform//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Guidely Sessions',
  ];

  for (const booking of bookings) {
    const isCreator = booking.creatorId === userId;
    const otherParty = isCreator ? booking.student : booking.creator;

    lines.push(
      'BEGIN:VEVENT',
      `UID:${booking.id}@guidely.dev`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatICalDate(booking.startTime)}`,
      `DTEND:${formatICalDate(booking.endTime)}`,
      `SUMMARY:${escapeICalText(booking.sessionType.title)} with ${escapeICalText((otherParty as any).displayName || otherParty.name)}`,
      `DESCRIPTION:${escapeICalText(booking.bookingMetadata || `Guidely session`)}`,
      'STATUS:CONFIRMED',
    );

    if (booking.meetingLink) {
      lines.push(`URL:${booking.meetingLink}`);
      lines.push(`LOCATION:${booking.meetingLink}`);
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}

// ─── Generate Google Calendar link ────────────────────────────────────

export function generateGoogleCalendarLink(booking: {
  startTime: Date;
  endTime: Date;
  serviceTitle: string;
  mentorName: string;
  meetingLink?: string;
}): string {
  const start = formatICalDate(booking.startTime);
  const end = formatICalDate(booking.endTime);
  const title = encodeURIComponent(`${booking.serviceTitle} with ${booking.mentorName}`);
  const details = encodeURIComponent(booking.meetingLink || '');
  const location = encodeURIComponent(booking.meetingLink || '');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
}
