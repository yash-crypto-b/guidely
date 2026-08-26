import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { sendSuccess } from '../../common/response';
import * as messagingService from './service';
import { sendMessageSchema } from './schemas';

const router = Router();

router.post('/', authenticate, validate(sendMessageSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const message = await messagingService.sendMessage(req.user!.userId, req.body);
    sendSuccess(res, message, 201, 'Message sent');
  } catch (err) { next(err); }
});

router.get('/:bookingId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await messagingService.getMessages(req.params.bookingId, req.user!.userId, page, limit);
    sendSuccess(res, result);
  } catch (err) { next(err); }
});

router.post('/:bookingId/read', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await messagingService.markAsRead(req.params.bookingId, req.user!.userId);
    sendSuccess(res, result);
  } catch (err) { next(err); }
});

export default router;
