import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import { sendSuccess } from '../../common/response';
import * as calendarService from './service';
import prisma from '../../db';

const router = Router();

// ─── Get iCal for a single booking ────────────────────────────────────

router.get('/booking/:id.ics', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ical = await calendarService.getBookingICal(req.params.id, req.user!.userId);
    res.set({
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="guidely-session-${req.params.id}.ics"`,
    });
    res.send(ical);
  } catch (err) { next(err); }
});

// ─── Get user's calendar feed ─────────────────────────────────────────

router.get('/feed.ics', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ical = await calendarService.getUserCalendarFeed(req.user!.userId);
    res.set({
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="guidely-sessions.ics"',
    });
    res.send(ical);
  } catch (err) { next(err); }
});

// ─── Get Google Calendar link for a booking ────────────────────────────

router.get('/booking/:id/google', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        creator: { select: { id: true, name: true, displayName: true } },
        sessionType: { select: { title: true } },
      },
    });

    if (!booking) {
      return sendSuccess(res, null, 404, 'Booking not found');
    }

    if (booking.creatorId !== req.user!.userId && booking.studentId !== req.user!.userId) {
      return sendSuccess(res, null, 403, 'Not your booking');
    }

    const creatorAny = booking.creator as any;
    const link = calendarService.generateGoogleCalendarLink({
      startTime: booking.startTime,
      endTime: booking.endTime,
      serviceTitle: booking.sessionType.title,
      mentorName: creatorAny.displayName || booking.creator.name,
      meetingLink: booking.meetingLink || undefined,
    });

    sendSuccess(res, { url: link });
  } catch (err) { next(err); }
});

export default router;
