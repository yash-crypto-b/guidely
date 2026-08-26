import { Router } from 'express';
import userRoutes from './modules/users/routes';
import bookingRoutes from './modules/bookings/routes';
import paymentRoutes from './modules/payments/routes';
import messagingRoutes from './modules/messaging/routes';
import videoRoutes from './modules/video/routes';
import notificationRoutes from './modules/notifications/routes';
import adminRoutes from './modules/admin/routes';

const router = Router();

router.use('/auth', userRoutes);
router.use('/users', userRoutes);
router.use('/profile', userRoutes);
router.use('/session-types', userRoutes);
router.use('/availability', userRoutes);
router.use('/blackout', userRoutes);
router.use('/creators', userRoutes);
router.use('/become-creator', userRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/messages', messagingRoutes);
router.use('/video', videoRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

export default router;
