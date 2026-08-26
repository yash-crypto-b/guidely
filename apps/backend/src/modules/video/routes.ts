import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import { sendSuccess } from '../../common/response';
import { createMeetingLink } from '../../providers/video';

const router = Router();

router.post('/meeting', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomName } = req.body;
    if (!roomName) return sendSuccess(res, null, 400, 'roomName is required');
    const meeting = await createMeetingLink(roomName);
    sendSuccess(res, meeting);
  } catch (err) { next(err); }
});

router.get('/provider', (_req: Request, res: Response) => {
  sendSuccess(res, { provider: process.env.VIDEO_PROVIDER || 'jitsi' });
});

export default router;
