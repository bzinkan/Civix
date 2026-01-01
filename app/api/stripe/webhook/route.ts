import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { stripe, getStripeStatus } from '../../../../lib/stripe';
import Stripe from 'stripe';

const prisma = new PrismaClient();

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * POST /api/stripe/webhook
 *
 * Handles Stripe webhook events
 */
export async function POST(request: NextRequest) {
  const status = getStripeStatus();
  if (!status.enabled || !stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: unknown) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan;

  if (!userId) {
    // Try to find user by customer email
    const customerEmail = session.customer_email || session.customer_details?.email;
    if (customerEmail) {
      const user = await prisma.user.findUnique({
        where: { email: customerEmail },
      });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            stripeId: session.customer as string,
            subscriptionId: session.subscription as string,
            subscriptionStatus: 'active',
            subscriptionPlan: plan || 'pro',
          },
        });
      }
    }
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeId: session.customer as string,
      subscriptionId: session.subscription as string,
      subscriptionStatus: 'active',
      subscriptionPlan: plan || 'pro',
    },
  });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find user by Stripe customer ID
  const user = await prisma.user.findFirst({
    where: { stripeId: customerId },
  });

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Determine plan from price
  const priceId = subscription.items.data[0]?.price.id;
  let plan = 'pro';

  if (priceId?.includes('business')) {
    plan = 'business';
  } else if (priceId?.includes('enterprise')) {
    plan = 'enterprise';
  }

  // Map Stripe status to our status
  let status = 'active';
  if (subscription.status === 'trialing') {
    status = 'trialing';
  } else if (subscription.status === 'past_due') {
    status = 'past_due';
  } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    status = 'canceled';
  }

  // Get the current period end from the subscription
  const currentPeriodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionId: subscription.id,
      subscriptionStatus: status,
      subscriptionPlan: status === 'canceled' ? 'free' : plan,
      subscriptionEndsAt: currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000)
        : null,
    },
  });
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const user = await prisma.user.findFirst({
    where: { stripeId: customerId },
  });

  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'canceled',
      subscriptionPlan: 'free', // Revert to free plan
    },
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Could send a receipt email here
  console.log('Payment succeeded for invoice:', invoice.id);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const user = await prisma.user.findFirst({
    where: { stripeId: customerId },
  });

  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'past_due',
    },
  });

  // Could send a payment failed email here
  console.log('Payment failed for user:', user.id);
}
