import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Plan configuration (used for seeding and fallback)
export const PLAN_CONFIG = {
  free: {
    planName: 'free',
    monthlyLookups: 5,
    savedProperties: 1,
    apiCallsMonthly: 0,
    teamSeats: 1,
    docUpload: false,
    pdfReports: false,
    bulkLookup: false,
    apiAccess: false,
    whiteLabel: false,
    prioritySupport: false,
    priceMonthly: 0,
    priceYearly: 0,
  },
  pro: {
    planName: 'pro',
    monthlyLookups: -1, // unlimited
    savedProperties: 25,
    apiCallsMonthly: 0,
    teamSeats: 1,
    docUpload: true,
    pdfReports: true,
    bulkLookup: false,
    apiAccess: false,
    whiteLabel: false,
    prioritySupport: false,
    priceMonthly: 29,
    priceYearly: 290,
  },
  business: {
    planName: 'business',
    monthlyLookups: -1,
    savedProperties: -1,
    apiCallsMonthly: 1000,
    teamSeats: 3,
    docUpload: true,
    pdfReports: true,
    bulkLookup: true,
    apiAccess: true,
    whiteLabel: false,
    prioritySupport: false,
    priceMonthly: 99,
    priceYearly: 990,
  },
  enterprise: {
    planName: 'enterprise',
    monthlyLookups: -1,
    savedProperties: -1,
    apiCallsMonthly: -1,
    teamSeats: -1,
    docUpload: true,
    pdfReports: true,
    bulkLookup: true,
    apiAccess: true,
    whiteLabel: true,
    prioritySupport: true,
    priceMonthly: 499,
    priceYearly: 4990,
  },
} as const;

export type PlanName = keyof typeof PLAN_CONFIG;

export interface PlanLimits {
  planName: string;
  monthlyLookups: number;
  savedProperties: number;
  apiCallsMonthly: number;
  teamSeats: number;
  docUpload: boolean;
  pdfReports: boolean;
  bulkLookup: boolean;
  apiAccess: boolean;
  whiteLabel: boolean;
  prioritySupport: boolean;
  priceMonthly: number;
  priceYearly: number;
}

// Get plan limits from database or fallback to config
export async function getPlanLimits(planName: string): Promise<PlanLimits> {
  try {
    const dbPlan = await prisma.planLimit.findUnique({
      where: { planName },
    });

    if (dbPlan) {
      return {
        planName: dbPlan.planName,
        monthlyLookups: dbPlan.monthlyLookups,
        savedProperties: dbPlan.savedProperties,
        apiCallsMonthly: dbPlan.apiCallsMonthly,
        teamSeats: dbPlan.teamSeats,
        docUpload: dbPlan.docUpload,
        pdfReports: dbPlan.pdfReports,
        bulkLookup: dbPlan.bulkLookup,
        apiAccess: dbPlan.apiAccess,
        whiteLabel: dbPlan.whiteLabel,
        prioritySupport: dbPlan.prioritySupport,
        priceMonthly: Number(dbPlan.priceMonthly),
        priceYearly: Number(dbPlan.priceYearly),
      };
    }
  } catch {
    // Database not available, use config
  }

  // Fallback to config
  const config = PLAN_CONFIG[planName as PlanName] || PLAN_CONFIG.free;
  return config as PlanLimits;
}

// Get all plans for pricing page
export async function getAllPlans(): Promise<PlanLimits[]> {
  return Promise.all([
    getPlanLimits('free'),
    getPlanLimits('pro'),
    getPlanLimits('business'),
    getPlanLimits('enterprise'),
  ]);
}

// Check if a limit is unlimited
export function isUnlimited(value: number): boolean {
  return value === -1;
}

// Format limit for display
export function formatLimit(value: number): string {
  return isUnlimited(value) ? 'Unlimited' : value.toString();
}

// Get minimum plan required for a feature
export function getMinPlanForFeature(feature: keyof PlanLimits): PlanName {
  const planOrder: PlanName[] = ['free', 'pro', 'business', 'enterprise'];

  for (const plan of planOrder) {
    const config = PLAN_CONFIG[plan];
    if (config[feature as keyof typeof config]) {
      return plan;
    }
  }

  return 'enterprise';
}

// Check if user has access to a feature
export function hasFeatureAccess(
  userPlan: string,
  feature: keyof PlanLimits
): boolean {
  const config = PLAN_CONFIG[userPlan as PlanName] || PLAN_CONFIG.free;
  return !!config[feature as keyof typeof config];
}

// Plan display info
export const PLAN_DISPLAY = {
  free: {
    name: 'Free',
    description: 'For occasional use',
    badge: null,
    color: 'gray',
  },
  pro: {
    name: 'Pro',
    description: 'For active professionals',
    badge: 'Popular',
    color: 'blue',
  },
  business: {
    name: 'Business',
    description: 'For teams and high-volume users',
    badge: null,
    color: 'purple',
  },
  enterprise: {
    name: 'Enterprise',
    description: 'For large organizations',
    badge: null,
    color: 'gold',
  },
} as const;

// Suggested plans by user type
export const SUGGESTED_PLANS: Record<string, PlanName> = {
  homeowner: 'free',
  contractor: 'pro',
  realtor: 'pro',
  small_business: 'pro',
  title: 'business',
  legal: 'business',
  developer: 'business',
};

// Feature list for pricing page
export const PLAN_FEATURES = [
  { key: 'monthlyLookups', label: 'Monthly lookups', type: 'limit' },
  { key: 'savedProperties', label: 'Saved properties', type: 'limit' },
  { key: 'docUpload', label: 'Document upload & analysis', type: 'boolean' },
  { key: 'pdfReports', label: 'PDF compliance reports', type: 'boolean' },
  { key: 'bulkLookup', label: 'Bulk lookup (CSV)', type: 'boolean' },
  { key: 'apiAccess', label: 'API access', type: 'boolean' },
  { key: 'teamSeats', label: 'Team seats', type: 'limit' },
  { key: 'whiteLabel', label: 'White-label reports', type: 'boolean' },
  { key: 'prioritySupport', label: 'Priority support', type: 'boolean' },
] as const;
