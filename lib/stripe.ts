import Stripe from 'stripe';

export type StripeStatus = {
  enabled: boolean;
  message: string;
};

// Initialize Stripe with secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2025-12-15.clover' })
  : null;

export function getStripeStatus(): StripeStatus {
  if (!stripeSecretKey) {
    return {
      enabled: false,
      message: 'Stripe is not configured. Set STRIPE_SECRET_KEY in your .env file.',
    };
  }
  return {
    enabled: true,
    message: 'Stripe is configured and ready.',
  };
}

// Price IDs for each plan (set these in your Stripe dashboard)
// For testing, you can create products/prices in test mode
export const STRIPE_PRICES = {
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly',
  },
  business: {
    monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || 'price_business_monthly',
    yearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY || 'price_business_yearly',
  },
  enterprise: {
    monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly',
    yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || 'price_enterprise_yearly',
  },
};

export type PlanType = keyof typeof STRIPE_PRICES;
export type BillingInterval = 'monthly' | 'yearly';

export function getPriceId(plan: PlanType, interval: BillingInterval): string {
  return STRIPE_PRICES[plan][interval];
}
