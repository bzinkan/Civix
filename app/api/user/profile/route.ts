import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * User Profile API
 *
 * GET /api/user/profile - Get current user profile
 * PUT /api/user/profile - Update user profile (including user type)
 */

// Valid user types
type UserType = 'homeowner' | 'contractor' | 'realtor' | 'title' | 'legal' | 'developer' | 'small_business' | 'food_business' | 'beauty_personal_care' | 'pet_industry' | 'fitness_wellness' | 'childcare_education';
type FoodBusinessType = 'restaurant' | 'food_truck' | 'cottage' | 'ghost_kitchen' | 'bar' | 'farmers_market' | 'catering' | 'brewery';
type BeautyBusinessType = 'hair_salon' | 'barbershop' | 'nail_salon' | 'spa' | 'tattoo_shop' | 'massage_establishment' | 'esthetician' | 'mobile_beauty';
type PetBusinessType = 'pet_grooming' | 'pet_boarding' | 'pet_daycare' | 'vet_clinic' | 'pet_store' | 'dog_training' | 'pet_sitting' | 'mobile_grooming';
type FitnessBusinessType = 'gym' | 'yoga_studio' | 'crossfit_gym' | 'swimming_pool' | 'martial_arts' | 'dance_studio' | 'personal_training' | 'wellness_center';
type ChildcareBusinessType = 'daycare_center' | 'home_daycare' | 'preschool' | 'private_school' | 'tutoring_center' | 'after_school' | 'summer_camp' | 'enrichment';
type SubscriptionPlan = 'free' | 'pro' | 'business' | 'enterprise';

// Plan limits
const PLAN_LIMITS: Record<SubscriptionPlan, { lookups: number; savedProperties: number; reports: number }> = {
  free: { lookups: 5, savedProperties: 1, reports: 0 },
  pro: { lookups: -1, savedProperties: 25, reports: 10 },  // -1 = unlimited
  business: { lookups: -1, savedProperties: -1, reports: -1 },
  enterprise: { lookups: -1, savedProperties: -1, reports: -1 },
};

// User type configurations
const USER_TYPE_CONFIG = {
  homeowner: {
    label: 'Homeowner',
    description: 'Managing your own property',
    features: ['property_lookup', 'permit_check', 'trash_schedule', 'report_issue'],
    defaultPlan: 'free'
  },
  contractor: {
    label: 'Contractor',
    description: 'Building and renovation professional',
    features: ['property_lookup', 'compliance_check', 'permit_estimator', 'bulk_lookup', 'form_library'],
    defaultPlan: 'pro'
  },
  realtor: {
    label: 'Real Estate Professional',
    description: 'Agent, broker, or investor',
    features: ['property_lookup', 'zoning_report', 'development_potential', 'site_finder', 'client_sharing'],
    defaultPlan: 'pro'
  },
  title: {
    label: 'Title & Escrow',
    description: 'Title company or escrow professional',
    features: ['property_lookup', 'compliance_certificate', 'permit_history', 'violation_check', 'formal_reports'],
    defaultPlan: 'business'
  },
  legal: {
    label: 'Legal Professional',
    description: 'Attorney or paralegal',
    features: ['property_lookup', 'code_search', 'citations', 'compliance_certificate', 'formal_reports'],
    defaultPlan: 'business'
  },
  developer: {
    label: 'Developer',
    description: 'Real estate developer',
    features: ['property_lookup', 'feasibility_report', 'entitlement_pathway', 'zone_change_history', 'bulk_analysis'],
    defaultPlan: 'enterprise'
  },
  small_business: {
    label: 'Small Business Owner',
    description: 'Operating or starting a business',
    features: ['property_lookup', 'license_wizard', 'sign_permit', 'home_occupation', 'location_compliance'],
    defaultPlan: 'pro'
  },
  food_business: {
    label: 'Food Business',
    description: 'Restaurant, food truck, bar, or food production',
    features: ['property_lookup', 'food_license_wizard', 'liquor_license', 'health_inspection', 'zoning_check', 'permit_checklist'],
    defaultPlan: 'pro'
  },
  beauty_personal_care: {
    label: 'Beauty & Personal Care',
    description: 'Salon, spa, tattoo, or personal services',
    features: ['property_lookup', 'license_wizard', 'health_inspection', 'zoning_check', 'permit_checklist', 'state_board_info'],
    defaultPlan: 'pro'
  },
  pet_industry: {
    label: 'Pet Industry',
    description: 'Grooming, boarding, veterinary, or pet services',
    features: ['property_lookup', 'license_wizard', 'kennel_license', 'zoning_check', 'permit_checklist', 'oda_requirements'],
    defaultPlan: 'pro'
  },
  fitness_wellness: {
    label: 'Fitness & Wellness',
    description: 'Gym, studio, pool, or wellness facility',
    features: ['property_lookup', 'license_wizard', 'pool_license', 'zoning_check', 'permit_checklist', 'health_club_act'],
    defaultPlan: 'pro'
  },
  childcare_education: {
    label: 'Childcare & Education',
    description: 'Daycare, preschool, tutoring, or educational services',
    features: ['property_lookup', 'license_wizard', 'odjfs_licensing', 'zoning_check', 'permit_checklist', 'staff_requirements'],
    defaultPlan: 'pro'
  }
};

export async function GET(request: NextRequest) {
  try {
    // In production, get user from session/auth
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        conversations: {
          orderBy: { updatedAt: 'desc' },
          take: 5
        },
        _count: {
          select: {
            conversations: true,
            savedProperties: true,
            generatedReports: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userType = (user.userType || 'homeowner') as UserType;
    const subscriptionPlan = (user.subscriptionPlan || 'free') as SubscriptionPlan;
    const typeConfig = USER_TYPE_CONFIG[userType] || USER_TYPE_CONFIG.homeowner;
    const planLimits = PLAN_LIMITS[subscriptionPlan] || PLAN_LIMITS.free;

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: userType,
        companyName: user.companyName,
        licenseNumber: user.licenseNumber,
        subscriptionPlan: subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionEndsAt: user.subscriptionEndsAt,
        monthlyLookups: user.monthlyLookups || 0,
        lookupResetDate: user.lookupResetDate,
        createdAt: user.createdAt
      },
      typeConfig,
      planLimits,
      usage: {
        conversations: user._count.conversations,
        savedProperties: user._count.savedProperties,
        generatedReports: user._count.generatedReports,
        lookupsUsed: user.monthlyLookups || 0,
        lookupsRemaining: planLimits.lookups === -1 ? 'unlimited' : Math.max(0, planLimits.lookups - (user.monthlyLookups || 0)),
        propertiesRemaining: planLimits.savedProperties === -1 ? 'unlimited' : Math.max(0, planLimits.savedProperties - user._count.savedProperties),
        reportsRemaining: planLimits.reports === -1 ? 'unlimited' : Math.max(0, planLimits.reports - user._count.generatedReports)
      },
      recentConversations: user.conversations
    });

  } catch (error: unknown) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { error: 'Failed to get profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      userType, name, companyName, licenseNumber,
      foodBusinessType, foodBusinessData,
      beautyBusinessType, beautyBusinessData,
      petBusinessType, petBusinessData,
      fitnessBusinessType, fitnessBusinessData,
      childcareBusinessType, childcareBusinessData
    } = body;

    // Validate user type
    if (userType && !USER_TYPE_CONFIG[userType as keyof typeof USER_TYPE_CONFIG]) {
      return NextResponse.json(
        { error: 'Invalid user type', validTypes: Object.keys(USER_TYPE_CONFIG) },
        { status: 400 }
      );
    }

    // Build update data object
    // Note: We use foodBusinessType/foodBusinessData fields generically for all industry sub-types
    const updateData: {
      name?: string;
      userType?: string;
      companyName?: string;
      licenseNumber?: string;
      foodBusinessType?: string;
      foodBusinessData?: object;
      updatedAt: Date;
    } = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (userType !== undefined) updateData.userType = userType;
    if (companyName !== undefined) updateData.companyName = companyName;
    if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber;

    // Store sub-business type (using foodBusinessType field for all industries)
    if (foodBusinessType !== undefined) updateData.foodBusinessType = foodBusinessType;
    if (beautyBusinessType !== undefined) updateData.foodBusinessType = beautyBusinessType;
    if (petBusinessType !== undefined) updateData.foodBusinessType = petBusinessType;
    if (fitnessBusinessType !== undefined) updateData.foodBusinessType = fitnessBusinessType;
    if (childcareBusinessType !== undefined) updateData.foodBusinessType = childcareBusinessType;

    // Store business-specific data (using foodBusinessData field for all industries)
    if (foodBusinessData !== undefined) updateData.foodBusinessData = foodBusinessData;
    if (beautyBusinessData !== undefined) updateData.foodBusinessData = beautyBusinessData;
    if (petBusinessData !== undefined) updateData.foodBusinessData = petBusinessData;
    if (fitnessBusinessData !== undefined) updateData.foodBusinessData = fitnessBusinessData;
    if (childcareBusinessData !== undefined) updateData.foodBusinessData = childcareBusinessData;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    const effectiveUserType = (updatedUser.userType || 'homeowner') as UserType;
    const typeConfig = USER_TYPE_CONFIG[effectiveUserType] || USER_TYPE_CONFIG.homeowner;

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        userType: effectiveUserType,
        companyName: updatedUser.companyName,
        licenseNumber: updatedUser.licenseNumber,
        subscriptionPlan: updatedUser.subscriptionPlan
      },
      typeConfig,
      message: `Profile updated. You now have access to ${typeConfig.label} features.`
    });

  } catch (error: unknown) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
