import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { sendSuccess } from '../../common/response';
import * as paymentService from './service';
import { createPaymentIntentSchema, createStripeAccountSchema } from './schemas';
import { config } from '../../config';

const router = Router();

router.post('/stripe/account', authenticate, validate(createStripeAccountSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await paymentService.createStripeConnectAccount(
      req.user!.userId,
      req.body.returnUrl,
      req.body.refreshUrl
    );
    sendSuccess(res, result);
  } catch (err) { next(err); }
});

router.post('/create-payment-intent', authenticate, validate(createPaymentIntentSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await paymentService.createPaymentIntent(req.body.bookingId, req.user!.userId);
    sendSuccess(res, result);
  } catch (err) { next(err); }
});

router.post('/stripe/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const stripe = require('stripe')(config.stripe.secretKey);
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);
    } catch {
      return sendSuccess(res, null, 400, 'Invalid signature');
    }
    await paymentService.handleStripeWebhook(event);
    sendSuccess(res, { received: true });
  } catch (err) { next(err); }
});

router.get('/:bookingId/status', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = await paymentService.getPaymentStatus(req.params.bookingId);
    sendSuccess(res, status);
  } catch (err) { next(err); }
});

export default router;
