'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PlanInfo {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  badge?: string;
  features: string[];
  limits: {
    lookups: string;
    savedProperties: string;
    teamSeats: string;
  };
  highlighted?: boolean;
}

const PLANS: PlanInfo[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'For occasional use',
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      'Basic property lookup',
      'Chat assistance',
      'Zoning information',
    ],
    limits: {
      lookups: '5/month',
      savedProperties: '1',
      teamSeats: '1',
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For active professionals',
    priceMonthly: 29,
    priceYearly: 290,
    badge: 'Popular',
    highlighted: true,
    features: [
      'Everything in Free',
      'Unlimited lookups',
      'Document upload & analysis',
      'PDF compliance reports',
      'Site plan compliance check',
    ],
    limits: {
      lookups: 'Unlimited',
      savedProperties: '25',
      teamSeats: '1',
    },
  },
  {
    id: 'business',
    name: 'Business',
    description: 'For teams & high-volume users',
    priceMonthly: 99,
    priceYearly: 990,
    features: [
      'Everything in Pro',
      'Bulk lookup (CSV)',
      'API access (1,000 calls/mo)',
      '3 team seats',
      'Priority support',
    ],
    limits: {
      lookups: 'Unlimited',
      savedProperties: 'Unlimited',
      teamSeats: '3',
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    priceMonthly: 499,
    priceYearly: 4990,
    features: [
      'Everything in Business',
      'Unlimited API calls',
      'Unlimited team seats',
      'White-label reports',
      'Dedicated support',
      'Custom integrations',
    ],
    limits: {
      lookups: 'Unlimited',
      savedProperties: 'Unlimited',
      teamSeats: 'Unlimited',
    },
  },
];

const FEATURE_COMPARISON = [
  { feature: 'Monthly lookups', free: '5', pro: 'Unlimited', business: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'Saved properties', free: '1', pro: '25', business: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'Chat assistance', free: true, pro: true, business: true, enterprise: true },
  { feature: 'Document upload', free: false, pro: true, business: true, enterprise: true },
  { feature: 'Compliance check', free: false, pro: true, business: true, enterprise: true },
  { feature: 'PDF reports', free: false, pro: true, business: true, enterprise: true },
  { feature: 'Bulk lookup (CSV)', free: false, pro: false, business: true, enterprise: true },
  { feature: 'API access', free: false, pro: false, business: '1,000/mo', enterprise: 'Unlimited' },
  { feature: 'Team seats', free: '1', pro: '1', business: '3', enterprise: 'Unlimited' },
  { feature: 'White-label reports', free: false, pro: false, business: false, enterprise: true },
  { feature: 'Priority support', free: false, pro: false, business: true, enterprise: true },
];

export default function PricingPage() {
  const router = useRouter();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get current plan from localStorage or API
    const userType = localStorage.getItem('userType');
    const plan = localStorage.getItem('subscriptionPlan') || 'free';
    setCurrentPlan(plan);
  }, []);

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'free') {
      router.push('/dashboard');
      return;
    }

    if (planId === 'enterprise') {
      // Contact sales
      window.location.href = 'mailto:sales@civix.com?subject=Enterprise%20Plan%20Inquiry';
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planId,
          interval: billingInterval === 'yearly' ? 'year' : 'month',
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(data.error);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    }
    setLoading(false);
  };

  const yearlyDiscount = (plan: PlanInfo) => {
    if (plan.priceMonthly === 0) return 0;
    const monthlyTotal = plan.priceMonthly * 12;
    return Math.round((1 - plan.priceYearly / monthlyTotal) * 100);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Simple, transparent pricing</h1>
        <p className="text-gray-500">Choose the plan that fits your needs</p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center items-center gap-4">
        <span className={billingInterval === 'monthly' ? 'font-semibold' : 'text-gray-500'}>
          Monthly
        </span>
        <button
          onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
          className={`relative w-14 h-7 rounded-full transition-colors ${
            billingInterval === 'yearly' ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
              billingInterval === 'yearly' ? 'translate-x-8' : 'translate-x-1'
            }`}
          />
        </button>
        <span className={billingInterval === 'yearly' ? 'font-semibold' : 'text-gray-500'}>
          Yearly
          <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
            Save up to 17%
          </span>
        </span>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`card relative flex flex-col ${
              plan.highlighted
                ? 'border-2 border-blue-500 shadow-lg'
                : 'border border-gray-200'
            }`}
          >
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {plan.badge}
                </span>
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="text-sm text-gray-500">{plan.description}</p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">
                  ${billingInterval === 'yearly' && plan.priceYearly > 0
                    ? Math.round(plan.priceYearly / 12)
                    : plan.priceMonthly}
                </span>
                {plan.priceMonthly > 0 && (
                  <span className="text-gray-500">/month</span>
                )}
              </div>
              {billingInterval === 'yearly' && plan.priceYearly > 0 && (
                <p className="text-sm text-gray-500">
                  ${plan.priceYearly}/year (save {yearlyDiscount(plan)}%)
                </p>
              )}
            </div>

            <div className="mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Lookups:</span>
                <span className="font-medium">{plan.limits.lookups}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Saved properties:</span>
                <span className="font-medium">{plan.limits.savedProperties}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Team seats:</span>
                <span className="font-medium">{plan.limits.teamSeats}</span>
              </div>
            </div>

            <ul className="mb-6 space-y-2 flex-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 mt-0.5">&#10003;</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelectPlan(plan.id)}
              disabled={loading || currentPlan === plan.id}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                currentPlan === plan.id
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : plan.highlighted
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {currentPlan === plan.id
                ? 'Current Plan'
                : plan.id === 'enterprise'
                ? 'Contact Sales'
                : plan.id === 'free'
                ? 'Get Started'
                : loading
                ? 'Loading...'
                : 'Upgrade'}
            </button>
          </div>
        ))}
      </div>

      {/* Feature Comparison Table */}
      <div className="card overflow-x-auto">
        <h2 className="text-xl font-bold mb-6">Compare all features</h2>
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Feature</th>
              <th className="text-center py-3 px-4">Free</th>
              <th className="text-center py-3 px-4 bg-blue-50">Pro</th>
              <th className="text-center py-3 px-4">Business</th>
              <th className="text-center py-3 px-4">Enterprise</th>
            </tr>
          </thead>
          <tbody>
            {FEATURE_COMPARISON.map((row, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-3 px-4 text-gray-700">{row.feature}</td>
                {['free', 'pro', 'business', 'enterprise'].map((plan) => {
                  const value = row[plan as keyof typeof row];
                  return (
                    <td
                      key={plan}
                      className={`text-center py-3 px-4 ${plan === 'pro' ? 'bg-blue-50' : ''}`}
                    >
                      {typeof value === 'boolean' ? (
                        value ? (
                          <span className="text-green-500 text-lg">&#10003;</span>
                        ) : (
                          <span className="text-gray-300">&#8212;</span>
                        )
                      ) : (
                        <span className="font-medium">{value}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FAQ */}
      <div className="card">
        <h2 className="text-xl font-bold mb-6">Frequently asked questions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-1">Can I change plans later?</h3>
            <p className="text-gray-600 text-sm">
              Yes! You can upgrade or downgrade at any time. Changes take effect immediately.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">What happens when I hit my lookup limit?</h3>
            <p className="text-gray-600 text-sm">
              You&apos;ll see an upgrade prompt. Your limit resets on the 1st of each month, or you can upgrade for unlimited access.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Is there a free trial?</h3>
            <p className="text-gray-600 text-sm">
              Yes! Pro and Business plans include a 14-day free trial. No credit card required to start.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">What payment methods do you accept?</h3>
            <p className="text-gray-600 text-sm">
              We accept all major credit cards via Stripe. Enterprise customers can pay by invoice.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">
          Questions about which plan is right for you?
        </p>
        <a
          href="mailto:support@civix.com"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Contact our team &rarr;
        </a>
      </div>
    </div>
  );
}
