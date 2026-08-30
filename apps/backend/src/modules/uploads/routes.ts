import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import { sendSuccess } from '../../common/response';
import * as uploadService from './service';
import multer from 'multer';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// ─── Upload Profile Photo ─────────────────────────────────────────────

router.post(
  '/profile-photo',
  authenticate,
  upload.single('photo'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return sendSuccess(res, null, 400, 'No file uploaded');
      }
      const result = await uploadService.uploadProfilePhoto(req.user!.userId, {
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        originalname: req.file.originalname,
      });
      sendSuccess(res, result, 200, 'Profile photo uploaded');
    } catch (err) { next(err); }
  }
);

// ─── Upload Resume ────────────────────────────────────────────────────

router.post(
  '/resume',
  authenticate,
  upload.single('resume'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return sendSuccess(res, null, 400, 'No file uploaded');
      }
      const result = await uploadService.uploadResume(req.user!.userId, {
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        originalname: req.file.originalname,
      });
      sendSuccess(res, result, 200, 'Resume uploaded');
    } catch (err) { next(err); }
  }
);

// ─── Get User Uploads ─────────────────────────────────────────────────

router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uploads = await uploadService.getUserUploads(req.user!.userId);
    sendSuccess(res, uploads);
  } catch (err) { next(err); }
});

// ─── Delete Profile Photo ─────────────────────────────────────────────

router.delete('/profile-photo', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await uploadService.deleteProfilePhoto(req.user!.userId);
    sendSuccess(res, null, 200, 'Profile photo deleted');
  } catch (err) { next(err); }
});

// ─── Delete Resume ────────────────────────────────────────────────────

router.delete('/resume', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await uploadService.deleteResume(req.user!.userId, req.body.url);
    sendSuccess(res, null, 200, 'Resume deleted');
  } catch (err) { next(err); }
});

export default router;
