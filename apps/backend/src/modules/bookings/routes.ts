import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { sendSuccess } from '../../common/response';
import * as bookingService from './service';
import { createBookingSchema, updateBookingStatusSchema, createReviewSchema } from './schemas';

const router = Router();

router.get('/slots/:creatorId/:sessionTypeId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const slots = await bookingService.getAvailableSlots(req.params.creatorId, req.params.sessionTypeId, date);
    sendSuccess(res, slots);
  } catch (err) { next(err); }
});

router.post('/', authenticate, validate(createBookingSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingService.createBooking(req.user!.userId, req.body);
    sendSuccess(res, booking, 201, 'Booking created');
  } catch (err) { next(err); }
});

router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = (req.query.role as string) || 'student';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await bookingService.getUserBookings(req.user!.userId, role as any, page, limit);
    sendSuccess(res, result);
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookings } = await bookingService.getUserBookings(req.user!.userId, 'student', 1, 1);
    const booking = bookings.find((b) => b.id === req.params.id);
    if (!booking) {
      const { bookings: creatorBookings } = await bookingService.getUserBookings(req.user!.userId, 'creator', 1, 1);
      const cb = creatorBookings.find((b) => b.id === req.params.id);
      if (!cb) return sendSuccess(res, null, 404, 'Booking not found');
      return sendSuccess(res, cb);
    }
    sendSuccess(res, booking);
  } catch (err) { next(err); }
});

router.patch('/:id/status', authenticate, validate(updateBookingStatusSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingService.updateBookingStatus(req.params.id, req.user!.userId, req.body);
    sendSuccess(res, booking, 200, `Booking ${req.body.status.toLowerCase()}`);
  } catch (err) { next(err); }
});

router.post('/:id/review', authenticate, validate(createReviewSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const review = await bookingService.createReview(req.params.id, req.user!.userId, req.body);
    sendSuccess(res, review, 201, 'Review submitted');
  } catch (err) { next(err); }
});

export default router;
