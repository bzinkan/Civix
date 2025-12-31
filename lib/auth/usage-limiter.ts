// Anonymous usage tracking and limits
import { prisma } from '@/lib/db';

const FREE_TIER_LIMIT = 3; // Free queries per anonymous user

export interface UsageCheck {
  allowed: boolean;
  remaining: number;
  limit: number;
  message?: string;
}

/**
 * Check if anonymous user can make a query
 */
export async function checkAnonymousUsage(fingerprint: string): Promise<UsageCheck> {
  const usage = await prisma.anonymousUsage.upsert({
    where: { fingerprint },
    create: {
      fingerprint,
      queryCount: 0,
      lastQueryAt: new Date(),
    },
    update: {},
  });

  const remaining = Math.max(0, FREE_TIER_LIMIT - usage.queryCount);

  if (usage.queryCount >= FREE_TIER_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      limit: FREE_TIER_LIMIT,
      message: `You've reached the limit of ${FREE_TIER_LIMIT} free queries. Create an account or purchase credits to continue.`,
    };
  }

  return {
    allowed: true,
    remaining,
    limit: FREE_TIER_LIMIT,
  };
}

/**
 * Increment usage count for anonymous user
 */
export async function incrementAnonymousUsage(fingerprint: string): Promise<void> {
  await prisma.anonymousUsage.update({
    where: { fingerprint },
    data: {
      queryCount: {
        increment: 1,
      },
      lastQueryAt: new Date(),
    },
  });
}

/**
 * Check if authenticated user can make a query
 */
export async function checkUserUsage(userId: string): Promise<UsageCheck> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return {
      allowed: false,
      remaining: 0,
      limit: 0,
      message: 'User not found',
    };
  }

  // Check subscription status
  if (user.subscriptionStatus === 'active') {
    return {
      allowed: true,
      remaining: Infinity,
      limit: Infinity,
    };
  }

  // Check query credits
  if (user.queryCredits > 0) {
    return {
      allowed: true,
      remaining: user.queryCredits,
      limit: user.queryCredits,
    };
  }

  return {
    allowed: false,
    remaining: 0,
    limit: 0,
    message: 'No remaining query credits. Please purchase more or subscribe.',
  };
}

/**
 * Decrement query credits for authenticated user
 */
export async function decrementUserCredits(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      queryCredits: {
        decrement: 1,
      },
    },
  });
}
