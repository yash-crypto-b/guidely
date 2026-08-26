import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import { sendSuccess } from '../../common/response';
import * as notificationService from './service';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await notificationService.getNotifications(req.user!.userId, page, limit);
    sendSuccess(res, result);
  } catch (err) { next(err); }
});

router.put('/:id/read', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationService.markNotificationRead(req.params.id, req.user!.userId);
    sendSuccess(res, null, 200, 'Marked as read');
  } catch (err) { next(err); }
});

router.put('/read-all', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationService.markAllRead(req.user!.userId);
    sendSuccess(res, null, 200, 'All marked as read');
  } catch (err) { next(err); }
});

export default router;
