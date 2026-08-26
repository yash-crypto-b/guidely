import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { sendSuccess } from '../../common/response';
import * as adminService from './service';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate, authorize(Role.ADMIN, Role.SUPERADMIN));

router.get('/dashboard', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await adminService.getDashboardStats();
    sendSuccess(res, stats);
  } catch (err) { next(err); }
});

router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const role = req.query.role as string;
    const result = await adminService.getUsers(page, limit, role);
    sendSuccess(res, result);
  } catch (err) { next(err); }
});

router.patch('/users/:id/toggle-status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await adminService.toggleUserStatus(req.params.id);
    sendSuccess(res, user, 200, 'User status updated');
  } catch (err) { next(err); }
});

router.patch('/users/:id/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await adminService.verifyCreator(req.params.id);
    sendSuccess(res, user, 200, 'Creator verified');
  } catch (err) { next(err); }
});

router.get('/config', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await adminService.getPlatformConfig();
    sendSuccess(res, config);
  } catch (err) { next(err); }
});

router.put('/config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await adminService.updatePlatformConfig(req.body);
    sendSuccess(res, config, 200, 'Platform config updated');
  } catch (err) { next(err); }
});

export default router;
