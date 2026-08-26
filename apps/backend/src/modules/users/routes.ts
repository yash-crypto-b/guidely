import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, optionalAuth, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { sendSuccess } from '../../common/response';
import * as userService from './service';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  becomeCreatorSchema,
  createSessionTypeSchema,
  setAvailabilitySchema,
  addBlackoutSchema,
} from './schemas';
import { Role } from '@prisma/client';

const router = Router();

router.post('/auth/register', validate(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await userService.register(req.body);
    sendSuccess(res, result, 201, 'Registration successful');
  } catch (err) { next(err); }
});

router.post('/auth/login', validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await userService.login(req.body);
    sendSuccess(res, result, 200, 'Login successful');
  } catch (err) { next(err); }
});

router.post('/auth/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return sendSuccess(res, null, 400, 'Refresh token required');
    const tokens = await userService.refreshAccessToken(refreshToken);
    sendSuccess(res, tokens);
  } catch (err) { next(err); }
});

router.post('/auth/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await userService.logout(req.user!.userId);
    sendSuccess(res, null, 200, 'Logged out');
  } catch (err) { next(err); }
});

router.get('/auth/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await userService.getProfile(req.user!.userId);
    sendSuccess(res, profile);
  } catch (err) { next(err); }
});

router.put('/profile', authenticate, validate(updateProfileSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await userService.updateProfile(req.user!.userId, req.body);
    sendSuccess(res, profile, 200, 'Profile updated');
  } catch (err) { next(err); }
});

router.get('/profile/:handle', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await userService.getPublicProfile(req.params.handle);
    sendSuccess(res, profile);
  } catch (err) { next(err); }
});

router.post('/become-creator', authenticate, validate(becomeCreatorSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { headline, bio, expertiseTags } = req.body;
    const profile = await userService.becomeCreator(req.user!.userId, headline, bio, expertiseTags);
    sendSuccess(res, profile, 200, 'You are now a creator!');
  } catch (err) { next(err); }
});

router.post('/session-types', authenticate, authorize(Role.CREATOR, Role.ADMIN, Role.SUPERADMIN), validate(createSessionTypeSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await userService.createSessionType(req.user!.userId, req.body);
    sendSuccess(res, session, 201, 'Session type created');
  } catch (err) { next(err); }
});

router.put('/session-types/:id', authenticate, authorize(Role.CREATOR, Role.ADMIN, Role.SUPERADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await userService.updateSessionType(req.user!.userId, req.params.id, req.body);
    sendSuccess(res, session, 200, 'Session type updated');
  } catch (err) { next(err); }
});

router.delete('/session-types/:id', authenticate, authorize(Role.CREATOR, Role.ADMIN, Role.SUPERADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await userService.deleteSessionType(req.user!.userId, req.params.id);
    sendSuccess(res, null, 200, 'Session type deleted');
  } catch (err) { next(err); }
});

router.get('/session-types', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await userService.getProfile(req.user!.userId);
    sendSuccess(res, profile.sessionTypes);
  } catch (err) { next(err); }
});

router.put('/availability', authenticate, authorize(Role.CREATOR, Role.ADMIN, Role.SUPERADMIN), validate(setAvailabilitySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slots = await userService.setAvailability(req.user!.userId, req.body);
    sendSuccess(res, slots, 200, 'Availability updated');
  } catch (err) { next(err); }
});

router.get('/availability', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await userService.getProfile(req.user!.userId);
    sendSuccess(res, profile.availability);
  } catch (err) { next(err); }
});

router.post('/blackout', authenticate, authorize(Role.CREATOR, Role.ADMIN, Role.SUPERADMIN), validate(addBlackoutSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const blackout = await userService.addBlackoutDate(req.user!.userId, new Date(req.body.date), req.body.reason);
    sendSuccess(res, blackout, 201, 'Blackout date added');
  } catch (err) { next(err); }
});

router.get('/creators/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await userService.searchCreators({
      search: req.query.search as string,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      minPrice: req.query.minPrice ? parseInt(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice as string) : undefined,
      rating: req.query.rating ? parseInt(req.query.rating as string) : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });
    sendSuccess(res, result);
  } catch (err) { next(err); }
});

export default router;
