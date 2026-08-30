import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, optionalAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { sendSuccess } from '../../common/response';
import * as connectionsService from './service';
import {
  updateMentorProfileSchema,
  createServiceSchema,
  updateServiceSchema,
  createBookingRequestSchema,
} from './schemas';
import { Role } from '@prisma/client';

const router = Router();

// ─── Marketplace ──────────────────────────────────────────────────────

// Public: Search mentors in the marketplace
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = {
      search: req.query.search as string,
      industry: req.query.industry as string,
      role: req.query.role as string,
      skills: req.query.skills ? (req.query.skills as string).split(',') : undefined,
      experienceLevel: req.query.experienceLevel as string,
      minPrice: req.query.minPrice ? parseInt(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice as string) : undefined,
      language: req.query.language as string,
      deliveryType: req.query.deliveryType as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };
    const result = await connectionsService.searchMentors(query);
    sendSuccess(res, result);
  } catch (err) { next(err); }
});

// Public: Get recommended mentors
router.get('/recommended', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 6;
    const mentors = await connectionsService.getRecommendedMentors('', limit);
    sendSuccess(res, mentors);
  } catch (err) { next(err); }
});

// Public: Get mentor public profile
router.get('/mentor/:handle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await connectionsService.getPublicMentorProfile(req.params.handle);
    sendSuccess(res, profile);
  } catch (err) { next(err); }
});

// Public: Get available slots for a service
router.get('/mentor/:handle/slots/:serviceId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const slots = await connectionsService.getServiceSlots(
      req.params.handle,
      req.params.serviceId,
      date
    );
    sendSuccess(res, slots);
  } catch (err) { next(err); }
});

// ─── Mentor Profile Management ────────────────────────────────────────

// Mentor: Get own profile
router.get('/profile', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await connectionsService.getMentorProfile(req.user!.userId);
    sendSuccess(res, profile);
  } catch (err) { next(err); }
});

// Mentor: Update profile
router.put('/profile', authenticate, validate(updateMentorProfileSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await connectionsService.updateMentorProfile(req.user!.userId, req.body);
    sendSuccess(res, profile, 200, 'Profile updated');
  } catch (err) { next(err); }
});

// ─── Services ─────────────────────────────────────────────────────────

// Mentor: Get own services
router.get('/services', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const services = await connectionsService.getMentorServices(req.user!.userId);
    sendSuccess(res, services);
  } catch (err) { next(err); }
});

// Mentor: Create service
router.post('/services', authenticate, validate(createServiceSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = await connectionsService.createService(req.user!.userId, req.body);
    sendSuccess(res, service, 201, 'Service created');
  } catch (err) { next(err); }
});

// Mentor: Update service
router.put('/services/:id', authenticate, validate(updateServiceSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = await connectionsService.updateService(req.user!.userId, req.params.id, req.body);
    sendSuccess(res, service, 200, 'Service updated');
  } catch (err) { next(err); }
});

// Mentor: Delete service
router.delete('/services/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await connectionsService.deleteService(req.user!.userId, req.params.id);
    sendSuccess(res, null, 200, 'Service deleted');
  } catch (err) { next(err); }
});

// ─── Bookings ─────────────────────────────────────────────────────────

// Mentee: Book a session with attribution
router.post('/book', authenticate, validate(createBookingRequestSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mentorHandle = req.query.mentor as string || req.body.mentorHandle;
    if (!mentorHandle) {
      return sendSuccess(res, null, 400, 'Mentor handle is required');
    }
    const booking = await connectionsService.createConnectionBooking(
      req.user!.userId,
      mentorHandle,
      req.body
    );
    sendSuccess(res, booking, 201, 'Booking created');
  } catch (err) { next(err); }
});

// ─── Saved Mentors ────────────────────────────────────────────────────

router.post('/saved', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await connectionsService.saveMentor(req.user!.userId, req.body.mentorId);
    sendSuccess(res, result);
  } catch (err) { next(err); }
});

router.get('/saved', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const saved = await connectionsService.getSavedMentors(req.user!.userId);
    sendSuccess(res, saved);
  } catch (err) { next(err); }
});

// ─── Mentor Dashboard: Earnings ───────────────────────────────────────

router.get('/earnings', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const earnings = await connectionsService.getMentorEarnings(req.user!.userId);
    sendSuccess(res, earnings);
  } catch (err) { next(err); }
});

// ─── Mentee Dashboard ─────────────────────────────────────────────────

router.get('/my-bookings', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const result = await connectionsService.getMenteeBookings(req.user!.userId, page, limit);
    sendSuccess(res, result);
  } catch (err) { next(err); }
});

// ─── Reviews ─────────────────────────────────────────────────────────

router.post('/bookings/:id/review', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return sendSuccess(res, null, 400, 'Rating must be between 1 and 5');
    }
    const review = await connectionsService.createConnectionReview(
      req.params.id,
      req.user!.userId,
      { rating, comment }
    );
    sendSuccess(res, review, 201, 'Review submitted');
  } catch (err) { next(err); }
});

// ─── Analytics Tracking ───────────────────────────────────────────────

router.post('/track', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { trackEvent } = require('../analytics/service');
    const event = await trackEvent({
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

export default router;
