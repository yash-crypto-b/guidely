import Stripe from 'stripe';
import { config } from '../../config';
import prisma from '../../db';
import { NotFoundError, ValidationError } from '../../common/errors';

let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    if (!config.stripe.secretKey) {
      throw new ValidationError({ stripe: ['Stripe is not configured'] });
    }
    stripe = new Stripe(config.stripe.secretKey, { apiVersion: '2024-04-10' as any });
  }
  return stripe;
}

export async function createStripeConnectAccount(userId: string, returnUrl: string, refreshUrl: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User');

  if (user.stripeAccountId) {
    const accountLink = await getStripe().accountLinks.create({
      account: user.stripeAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });
    return { url: accountLink.url, accountId: user.stripeAccountId };
  }

  const account = await getStripe().accounts.create({
    type: 'express',
    country: 'US',
    email: user.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'individual',
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeAccountId: account.id },
  });

  const accountLink = await getStripe().accountLinks.create({
    account: account.id,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });

  return { url: accountLink.url, accountId: account.id };
}

export async function createPaymentIntent(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { creator: true, payment: true },
  });

  if (!booking) throw new NotFoundError('Booking');
  if (booking.studentId !== userId) throw new ValidationError({ booking: ['Not your booking'] });
  if (booking.payment) throw new ValidationError({ booking: ['Payment already exists'] });
  if (!booking.totalAmount || booking.totalAmount <= 0) {
    throw new ValidationError({ booking: ['Free sessions do not require payment'] });
  }
  if (!booking.creator.stripeAccountId) {
    throw new ValidationError({ creator: ['Creator has not set up payouts'] });
  }

  const paymentIntent = await getStripe().paymentIntents.create({
    amount: booking.totalAmount,
    currency: 'usd',
    application_fee_amount: booking.platformFee || undefined,
    transfer_data: {
      destination: booking.creator.stripeAccountId,
    },
    metadata: {
      bookingId: booking.id,
      platform: config.platform.name,
    },
  });

  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      stripePaymentIntentId: paymentIntent.id,
      stripeAccountId: booking.creator.stripeAccountId,
      amount: booking.totalAmount,
      platformFee: booking.platformFee || 0,
      creatorAmount: booking.creatorEarnings || booking.totalAmount,
      status: paymentIntent.status,
    },
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: { stripePaymentIntentId: paymentIntent.id },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    amount: paymentIntent.amount,
  };
}

export async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent;
      await prisma.payment.updateMany({
        where: { stripePaymentIntentId: pi.id },
        data: { status: 'succeeded' },
      });
      if (pi.metadata.bookingId) {
        await prisma.booking.update({
          where: { id: pi.metadata.bookingId },
          data: { status: 'CONFIRMED' },
        });
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent;
      await prisma.payment.updateMany({
        where: { stripePaymentIntentId: pi.id },
        data: { status: 'failed' },
      });
      break;
    }
    case 'account.updated': {
      break;
    }
  }
}

export async function getPaymentStatus(bookingId: string) {
  const payment = await prisma.payment.findUnique({ where: { bookingId } });
  if (!payment) return { status: 'pending' };
  return payment;
}
