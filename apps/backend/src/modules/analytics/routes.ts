import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import { sendSuccess } from '../../common/response';
import * as analyticsService from './service';
import { Role } from '@prisma/client';

const router = Router();

// ─── Track Event (public) ─────────────────────────────────────────────

router.post('/track', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await analyticsService.trackEvent({
      eventType: req.body.eventType,
      userId: req.user?.userId,
      sessionId: req.body.sessionId,
      data: req.body.data,
      source: req.body.source,
      page: req.body.page,
    });
    sendSuccess(res, event, 201);
  } catch (err) { next(err); }
});

// ─── Marketplace Analytics (admin only) ────────────────────────────────

router.get('/marketplace', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In production, add admin role check here
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const analytics = await analyticsService.getMarketplaceAnalytics(startDate, endDate);
    sendSuccess(res, analytics);
  } catch (err) { next(err); }
});

// ─── Mentor Performance (authenticated) ────────────────────────────────

router.get('/mentor/:mentorId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Allow mentors to see their own stats, or admins to see any
    if (req.user!.userId !== req.params.mentorId && req.user!.role !== 'ADMIN') {
      return sendSuccess(res, null, 403, 'Not authorized');
    }
    const performance = await analyticsService.getMentorPerformance(req.params.mentorId);
    sendSuccess(res, performance);
  } catch (err) { next(err); }
});

export default router;
