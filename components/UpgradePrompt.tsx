'use client';

import { useRouter } from 'next/navigation';

interface UpgradePromptProps {
  type: 'limit' | 'feature';
  feature?: string;
  currentPlan?: string;
  limit?: number;
  used?: number;
  requiredPlan?: string;
  onClose?: () => void;
}

const PLAN_FEATURES: Record<string, string[]> = {
  pro: [
    'Unlimited property lookups',
    'Document upload & analysis',
    'PDF compliance reports',
    '25 saved properties',
  ],
  business: [
    'Everything in Pro',
    'Bulk lookup (CSV)',
    'API access (1,000 calls/mo)',
    '3 team seats',
  ],
  enterprise: [
    'Everything in Business',
    'Unlimited API calls',
    'White-label reports',
    'Dedicated support',
  ],
};

const PLAN_PRICES: Record<string, number> = {
  pro: 29,
  business: 99,
  enterprise: 499,
};

export default function UpgradePrompt({
  type,
  feature,
  currentPlan = 'free',
  limit,
  used,
  requiredPlan = 'pro',
  onClose,
}: UpgradePromptProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  const handleDismiss = () => {
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
        {type === 'limit' ? (
          <>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">&#9888;&#65039;</div>
              <h2 className="text-xl font-bold mb-2">
                You&apos;ve used all {limit} free lookups this month
              </h2>
              <p className="text-gray-500">
                Upgrade to Pro for unlimited lookups and more features
              </p>
            </div>

            {/* Usage bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span>Usage</span>
                <span className="font-medium">{used} / {limit}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: '100%' }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Resets on the 1st of next month
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">&#128274;</div>
              <h2 className="text-xl font-bold mb-2">
                {feature} requires {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}
              </h2>
              <p className="text-gray-500">
                Upgrade to unlock this feature and more
              </p>
            </div>
          </>
        )}

        {/* Plan features */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-lg">
              {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}
            </span>
            <span className="text-2xl font-bold">
              ${PLAN_PRICES[requiredPlan]}<span className="text-sm font-normal text-gray-500">/mo</span>
            </span>
          </div>
          <ul className="space-y-2">
            {PLAN_FEATURES[requiredPlan]?.map((feat, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="text-green-500">&#10003;</span>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleUpgrade}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Start 14-day free trial
          </button>
          <button
            onClick={handleDismiss}
            className="w-full py-2 px-4 text-gray-500 hover:text-gray-700 text-sm"
          >
            Maybe later - wait until next month
          </button>
        </div>

        {/* Fine print */}
        <p className="text-xs text-gray-400 text-center mt-4">
          Cancel anytime. No credit card required for trial.
        </p>
      </div>
    </div>
  );
}

// Inline upgrade banner (non-modal)
export function UpgradeBanner({
  message,
  requiredPlan = 'pro',
}: {
  message: string;
  requiredPlan?: string;
}) {
  const router = useRouter();

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl">&#9889;</span>
        <div>
          <p className="font-medium">{message}</p>
          <p className="text-sm text-blue-100">
            Upgrade to {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} for ${PLAN_PRICES[requiredPlan]}/mo
          </p>
        </div>
      </div>
      <button
        onClick={() => router.push('/pricing')}
        className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
      >
        Upgrade
      </button>
    </div>
  );
}

// Usage stats component
export function UsageStats({
  lookups,
  savedProperties,
  plan,
}: {
  lookups: { used: number; limit: number; unlimited: boolean };
  savedProperties: { used: number; limit: number; unlimited: boolean };
  plan: string;
}) {
  const router = useRouter();

  const getPercentage = (used: number, limit: number, unlimited: boolean) => {
    if (unlimited) return 0;
    return Math.min(100, (used / limit) * 100);
  };

  const getColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">Usage this month</h3>
        <span className="text-sm px-2 py-1 bg-gray-100 rounded-full capitalize">
          {plan} Plan
        </span>
      </div>

      <div className="space-y-4">
        {/* Lookups */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Property lookups</span>
            <span className="font-medium">
              {lookups.unlimited ? (
                <span className="text-green-600">Unlimited</span>
              ) : (
                `${lookups.used} / ${lookups.limit}`
              )}
            </span>
          </div>
          {!lookups.unlimited && (
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getColor(
                  getPercentage(lookups.used, lookups.limit, lookups.unlimited)
                )}`}
                style={{
                  width: `${getPercentage(lookups.used, lookups.limit, lookups.unlimited)}%`,
                }}
              />
            </div>
          )}
        </div>

        {/* Saved Properties */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Saved properties</span>
            <span className="font-medium">
              {savedProperties.unlimited ? (
                <span className="text-green-600">Unlimited</span>
              ) : (
                `${savedProperties.used} / ${savedProperties.limit}`
              )}
            </span>
          </div>
          {!savedProperties.unlimited && (
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getColor(
                  getPercentage(savedProperties.used, savedProperties.limit, savedProperties.unlimited)
                )}`}
                style={{
                  width: `${getPercentage(
                    savedProperties.used,
                    savedProperties.limit,
                    savedProperties.unlimited
                  )}%`,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {plan === 'free' && (
        <button
          onClick={() => router.push('/pricing')}
          className="w-full mt-4 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
        >
          Upgrade for unlimited access
        </button>
      )}
    </div>
  );
}
