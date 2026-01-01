import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getPlanLimits, isUnlimited } from './plans';

const prisma = new PrismaClient();

export interface LimitCheckResult {
  allowed: boolean;
  error?: string;
  errorCode?: 'limit_reached' | 'feature_locked' | 'not_authenticated';
  limit?: number;
  used?: number;
  remaining?: number;
  upgradeUrl?: string;
  requiredPlan?: string;
}

// Check if user can perform a lookup
export async function checkLookupLimit(userId: string | null): Promise<LimitCheckResult> {
  // Anonymous users get limited lookups via fingerprint (handled separately)
  if (!userId) {
    return { allowed: true }; // Let anonymous handler deal with it
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionPlan: true,
      monthlyLookups: true,
      lookupResetDate: true,
    },
  });

  if (!user) {
    return {
      allowed: false,
      error: 'User not found',
      errorCode: 'not_authenticated',
    };
  }

  const plan = await getPlanLimits(user.subscriptionPlan || 'free');

  // Check if we need to reset monthly count
  const now = new Date();
  const resetDate = user.lookupResetDate ? new Date(user.lookupResetDate) : null;
  let currentLookups = user.monthlyLookups || 0;

  if (!resetDate || now > resetDate) {
    // Reset the count
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    await prisma.user.update({
      where: { id: userId },
      data: {
        monthlyLookups: 0,
        lookupResetDate: nextReset,
      },
    });
    currentLookups = 0;
  }

  // Unlimited lookups
  if (isUnlimited(plan.monthlyLookups)) {
    return { allowed: true };
  }

  // Check limit
  if (currentLookups >= plan.monthlyLookups) {
    return {
      allowed: false,
      error: 'Monthly lookup limit reached',
      errorCode: 'limit_reached',
      limit: plan.monthlyLookups,
      used: currentLookups,
      remaining: 0,
      upgradeUrl: '/pricing',
    };
  }

  return {
    allowed: true,
    limit: plan.monthlyLookups,
    used: currentLookups,
    remaining: plan.monthlyLookups - currentLookups,
  };
}

// Increment lookup count after successful lookup
export async function incrementLookupCount(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      monthlyLookups: { increment: 1 },
    },
  });
}

// Check if user can save a property
export async function checkSavedPropertyLimit(userId: string): Promise<LimitCheckResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionPlan: true,
      _count: {
        select: { savedProperties: true },
      },
    },
  });

  if (!user) {
    return {
      allowed: false,
      error: 'User not found',
      errorCode: 'not_authenticated',
    };
  }

  const plan = await getPlanLimits(user.subscriptionPlan || 'free');
  const currentCount = user._count.savedProperties;

  // Unlimited
  if (isUnlimited(plan.savedProperties)) {
    return { allowed: true };
  }

  if (currentCount >= plan.savedProperties) {
    return {
      allowed: false,
      error: 'Saved property limit reached',
      errorCode: 'limit_reached',
      limit: plan.savedProperties,
      used: currentCount,
      remaining: 0,
      upgradeUrl: '/pricing',
    };
  }

  return {
    allowed: true,
    limit: plan.savedProperties,
    used: currentCount,
    remaining: plan.savedProperties - currentCount,
  };
}

// Check if user has access to a specific feature
export async function checkFeatureAccess(
  userId: string,
  feature: 'docUpload' | 'pdfReports' | 'bulkLookup' | 'apiAccess' | 'whiteLabel'
): Promise<LimitCheckResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionPlan: true },
  });

  if (!user) {
    return {
      allowed: false,
      error: 'User not found',
      errorCode: 'not_authenticated',
    };
  }

  const plan = await getPlanLimits(user.subscriptionPlan || 'free');

  if (!plan[feature]) {
    // Find minimum plan that has this feature
    const requiredPlan = feature === 'docUpload' || feature === 'pdfReports'
      ? 'pro'
      : feature === 'bulkLookup' || feature === 'apiAccess'
      ? 'business'
      : 'enterprise';

    return {
      allowed: false,
      error: `${formatFeatureName(feature)} requires a higher plan`,
      errorCode: 'feature_locked',
      requiredPlan,
      upgradeUrl: '/pricing',
    };
  }

  return { allowed: true };
}

// Get user's current usage stats
export async function getUserUsageStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionPlan: true,
      monthlyLookups: true,
      lookupResetDate: true,
      _count: {
        select: {
          savedProperties: true,
          generatedReports: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const plan = await getPlanLimits(user.subscriptionPlan || 'free');

  return {
    plan: user.subscriptionPlan || 'free',
    lookups: {
      used: user.monthlyLookups || 0,
      limit: plan.monthlyLookups,
      unlimited: isUnlimited(plan.monthlyLookups),
      resetDate: user.lookupResetDate,
    },
    savedProperties: {
      used: user._count.savedProperties,
      limit: plan.savedProperties,
      unlimited: isUnlimited(plan.savedProperties),
    },
    reports: {
      used: user._count.generatedReports,
      limit: plan.pdfReports ? -1 : 0,
      unlimited: plan.pdfReports,
    },
    features: {
      docUpload: plan.docUpload,
      pdfReports: plan.pdfReports,
      bulkLookup: plan.bulkLookup,
      apiAccess: plan.apiAccess,
    },
  };
}

// Helper to format feature names
function formatFeatureName(feature: string): string {
  const names: Record<string, string> = {
    docUpload: 'Document upload',
    pdfReports: 'PDF reports',
    bulkLookup: 'Bulk lookup',
    apiAccess: 'API access',
    whiteLabel: 'White-label reports',
  };
  return names[feature] || feature;
}

// Middleware wrapper for API routes
export function withLookupLimit(
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const userId = req.headers.get('x-user-id');

    if (userId) {
      const check = await checkLookupLimit(userId);
      if (!check.allowed) {
        return NextResponse.json(
          {
            error: check.errorCode,
            message: check.error,
            limit: check.limit,
            used: check.used,
            upgradeUrl: check.upgradeUrl,
          },
          { status: 403 }
        );
      }
    }

    const response = await handler(req, userId || '');

    // Increment count on success
    if (response.ok && userId) {
      await incrementLookupCount(userId);
    }

    return response;
  };
}

// Middleware wrapper for feature-gated routes
export function withFeatureAccess(feature: 'docUpload' | 'pdfReports' | 'bulkLookup' | 'apiAccess') {
  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    return async (req: NextRequest) => {
      const userId = req.headers.get('x-user-id');

      if (!userId) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      const check = await checkFeatureAccess(userId, feature);
      if (!check.allowed) {
        return NextResponse.json(
          {
            error: check.errorCode,
            message: check.error,
            requiredPlan: check.requiredPlan,
            upgradeUrl: check.upgradeUrl,
          },
          { status: 403 }
        );
      }

      return handler(req);
    };
  };
}
