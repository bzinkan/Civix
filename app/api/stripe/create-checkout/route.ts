import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { stripe, getPriceId, PlanType, BillingInterval, getStripeStatus } from '../../../../lib/stripe';

const prisma = new PrismaClient();

/**
 * POST /api/stripe/create-checkout
 *
 * Creates a Stripe Checkout session for subscription
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    const status = getStripeStatus();
    if (!status.enabled || !stripe) {
      return NextResponse.json(
        {
          error: 'Payment processing is not available',
          message: status.message,
          // For demo purposes, show success message
          demo: true,
          demoMessage: 'In production, this would redirect to Stripe Checkout'
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { plan, interval } = body as { plan: string; interval: string };

    // Validate plan
    if (!['pro', 'business', 'enterprise'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // Validate interval
    const billingInterval: BillingInterval = interval === 'year' ? 'yearly' : 'monthly';

    // Get user ID from header (in production, use proper auth)
    const userId = request.headers.get('x-user-id');

    // Get or create Stripe customer
    let customerId: string | undefined;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { stripeId: true, email: true, name: true },
      });

      if (user?.stripeId) {
        customerId = user.stripeId;
      } else if (user?.email) {
        // Create new Stripe customer
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name || undefined,
          metadata: {
            userId: userId,
          },
        });
        customerId = customer.id;

        // Save Stripe customer ID
        await prisma.user.update({
          where: { id: userId },
          data: { stripeId: customer.id },
        });
      }
    }

    // Get the price ID for this plan/interval
    const priceId = getPriceId(plan as PlanType, billingInterval);

    // Get base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
      request.headers.get('origin') ||
      'http://localhost:3001';

    // Create Checkout Session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard?upgraded=true&plan=${plan}`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      subscription_data: {
        trial_period_days: 14, // 14-day free trial
        metadata: {
          userId: userId || '',
          plan: plan,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      tax_id_collection: {
        enabled: true,
      },
    };

    // Add customer if we have one
    if (customerId) {
      sessionParams.customer = customerId;
    } else {
      sessionParams.customer_creation = 'always';
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });

  } catch (error: unknown) {
    console.error('Stripe checkout error:', error);

    // Handle Stripe errors specifically
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as { type: string; message: string };
      return NextResponse.json(
        { error: stripeError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
