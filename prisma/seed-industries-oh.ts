import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Ohio Industries Seed Data
 *
 * This file contains permit requirements, building codes, and common questions
 * for all industries in Ohio jurisdictions (Cincinnati metro and suburbs)
 *
 * Ohio uses:
 * - Ohio Division of Liquor Control (DLC) for liquor licenses
 * - Cincinnati Health Department / local health districts for food
 * - Ohio Revised Code (ORC) for state regulations
 * - Ohio Building Code (OBC) for construction
 */

// Cincinnati zone codes for reference (other cities may vary)
const OH_COMMERCIAL_ZONES = ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C', 'MG', 'ML'];
const OH_INDUSTRIAL_ZONES = ['MG', 'ML', 'MI'];
const OH_RESIDENTIAL_ZONES = ['SF-20', 'SF-10', 'SF-6', 'SF-4', 'SF-2', 'RM-1.2', 'RM-2.0', 'RMX'];
const OH_MIXED_USE_ZONES = ['DD-A', 'DD-C', 'CC-M', 'CN-M'];
const OH_ALL_ZONES = ['*'];

// ============================================================================
// FOOD & RESTAURANT INDUSTRY
// ============================================================================

const FOOD_PERMIT_REQUIREMENTS = [
  // FOOD SERVICE LICENSES - Ohio Unified Food Safety Code
  { activityType: 'food_license_type1', category: 'food_license', activityDescription: 'Type 1 Food License - Prepackaged food only (no prep)', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 7, requiresPlans: false, requiresInspection: true, ordinanceRef: 'ORC 3717.11' },
  { activityType: 'food_license_type2', category: 'food_license', activityDescription: 'Type 2 Food License - Limited prep (heating/assembly only)', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 150.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3717.11' },
  { activityType: 'food_license_type3', category: 'food_license', activityDescription: 'Type 3 Food License - Standard restaurant (full prep, cooking)', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 250.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3717.11' },
  { activityType: 'food_license_type4', category: 'food_license', activityDescription: 'Type 4 Food License - High-risk prep (raw seafood, sushi, smoking)', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 350.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3717.11' },

  // MOBILE FOOD
  { activityType: 'mobile_food_vendor', category: 'food_license', activityDescription: 'Mobile Food Vendor License (Food Truck)', zonesRequired: OH_ALL_ZONES, zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3717.43' },
  { activityType: 'mobile_food_unit', category: 'food_license', activityDescription: 'Mobile Food Unit Health Permit', zonesRequired: OH_ALL_ZONES, zonesProhibited: [], feeBase: 175.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3717.43' },
  { activityType: 'commissary_agreement', category: 'food_license', activityDescription: 'Commissary Kitchen Agreement (required for mobile)', zonesRequired: OH_ALL_ZONES, zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 7, requiresPlans: false, requiresInspection: false, ordinanceRef: 'ORC 3717.43' },

  // OHIO LIQUOR LICENSES - Division of Liquor Control
  { activityType: 'liquor_d1', category: 'liquor_license', activityDescription: 'D-1 Liquor Permit - Beer only (on-premises)', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 476.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: false, ordinanceRef: 'ORC 4303.13' },
  { activityType: 'liquor_d2', category: 'liquor_license', activityDescription: 'D-2 Liquor Permit - Beer & wine (on-premises)', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 954.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: false, ordinanceRef: 'ORC 4303.13' },
  { activityType: 'liquor_d3', category: 'liquor_license', activityDescription: 'D-3 Liquor Permit - Beer & liquor (on-premises, no Sunday)', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 1562.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: false, ordinanceRef: 'ORC 4303.13' },
  { activityType: 'liquor_d5', category: 'liquor_license', activityDescription: 'D-5 Liquor Permit - All alcohol (on-premises, full service)', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 2344.00, feePerSqft: null, processingDays: 90, requiresPlans: true, requiresInspection: false, ordinanceRef: 'ORC 4303.13' },
  { activityType: 'liquor_d5k', category: 'liquor_license', activityDescription: 'D-5K Liquor Permit - Kitchen bar (food 50%+ of sales)', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 2344.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: false, ordinanceRef: 'ORC 4303.13' },
  { activityType: 'liquor_d6', category: 'liquor_license', activityDescription: 'D-6 Liquor Permit - Private club', zonesRequired: OH_ALL_ZONES, zonesProhibited: [], feeBase: 954.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: false, ordinanceRef: 'ORC 4303.13' },
  { activityType: 'sunday_sales', category: 'liquor_license', activityDescription: 'Sunday Sales Permit (add-on)', zonesRequired: OH_ALL_ZONES, zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 30, requiresPlans: false, requiresInspection: false, ordinanceRef: 'ORC 4303.182' },

  // BREWERY / DISTILLERY - Ohio
  { activityType: 'liquor_a1a', category: 'liquor_license', activityDescription: 'A-1-A Permit - Craft brewery (31,000 barrels max)', zonesRequired: [...OH_COMMERCIAL_ZONES, ...OH_INDUSTRIAL_ZONES], zonesProhibited: [], feeBase: 1562.00, feePerSqft: null, processingDays: 90, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4303.02' },
  { activityType: 'liquor_a2', category: 'liquor_license', activityDescription: 'A-2 Permit - Distillery (on-premises sales)', zonesRequired: [...OH_COMMERCIAL_ZONES, ...OH_INDUSTRIAL_ZONES], zonesProhibited: [], feeBase: 2344.00, feePerSqft: null, processingDays: 90, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4303.02' },
  { activityType: 'small_winery', category: 'liquor_license', activityDescription: 'A-2 Small Winery Permit', zonesRequired: [...OH_COMMERCIAL_ZONES, ...OH_INDUSTRIAL_ZONES], zonesProhibited: [], feeBase: 500.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4303.02' },
  { activityType: 'ttb_brewers_notice', category: 'federal', activityDescription: 'TTB Brewer\'s Notice (Federal)', zonesRequired: OH_ALL_ZONES, zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 120, requiresPlans: true, requiresInspection: true, ordinanceRef: '27 CFR 25' },
  { activityType: 'ttb_dsp', category: 'federal', activityDescription: 'TTB Distilled Spirits Permit (Federal)', zonesRequired: OH_ALL_ZONES, zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 180, requiresPlans: true, requiresInspection: true, ordinanceRef: '27 CFR 19' },

  // CATERING & EVENTS
  { activityType: 'caterer_license', category: 'food_license', activityDescription: 'Catering Food License', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 250.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3717.11' },
  { activityType: 'temp_food_event', category: 'food_license', activityDescription: 'Temporary Food Event Permit (1-3 days)', zonesRequired: OH_ALL_ZONES, zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: true, ordinanceRef: 'ORC 3717.43' },
  { activityType: 'f2_permit', category: 'liquor_license', activityDescription: 'F-2 Permit - Temporary beer/wine (special event)', zonesRequired: OH_ALL_ZONES, zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 30, requiresPlans: false, requiresInspection: false, ordinanceRef: 'ORC 4303.20' },

  // COTTAGE FOOD - Ohio
  { activityType: 'farmers_market_vendor', category: 'food_license', activityDescription: 'Farmers Market Vendor Permit', zonesRequired: OH_ALL_ZONES, zonesProhibited: [], feeBase: 25.00, feePerSqft: null, processingDays: 7, requiresPlans: false, requiresInspection: false, ordinanceRef: 'ORC 3717.22' },
  { activityType: 'cottage_food', category: 'food_license', activityDescription: 'Cottage Food Registration (home-based, $75K limit)', zonesRequired: OH_ALL_ZONES, zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 0, requiresPlans: false, requiresInspection: false, ordinanceRef: 'ORC 3715.021' },
];

// ============================================================================
// HEALTHCARE INDUSTRY
// ============================================================================

const HEALTHCARE_PERMIT_REQUIREMENTS = [
  // MEDICAL OFFICES
  { activityType: 'medical_office', category: 'healthcare', activityDescription: 'Medical Office (physician, dental, chiropractic)', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4731' },
  { activityType: 'urgent_care', category: 'healthcare', activityDescription: 'Urgent Care Facility', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 500.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4731' },
  { activityType: 'outpatient_clinic', category: 'healthcare', activityDescription: 'Outpatient Clinic', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 750.00, feePerSqft: null, processingDays: 45, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3702' },
  { activityType: 'ambulatory_surgery', category: 'healthcare', activityDescription: 'Ambulatory Surgery Center', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 2000.00, feePerSqft: null, processingDays: 90, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3702.30' },

  // PHARMACY
  { activityType: 'pharmacy_retail', category: 'healthcare', activityDescription: 'Retail Pharmacy (Terminal Distributor)', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 350.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4729' },
  { activityType: 'pharmacy_compounding', category: 'healthcare', activityDescription: 'Compounding Pharmacy', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 500.00, feePerSqft: null, processingDays: 45, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4729' },

  // LABS & IMAGING
  { activityType: 'clinical_lab', category: 'healthcare', activityDescription: 'Clinical Laboratory', zonesRequired: [...OH_COMMERCIAL_ZONES, ...OH_INDUSTRIAL_ZONES], zonesProhibited: [], feeBase: 500.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3701.20' },
  { activityType: 'imaging_center', category: 'healthcare', activityDescription: 'Diagnostic Imaging Center', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 750.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3702' },

  // MENTAL HEALTH & COUNSELING
  { activityType: 'mental_health_clinic', category: 'healthcare', activityDescription: 'Mental Health Clinic', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 300.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 5119' },
  { activityType: 'counseling_practice', category: 'healthcare', activityDescription: 'Counseling/Therapy Practice', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 150.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: false, ordinanceRef: 'ORC 4757' },
  { activityType: 'substance_abuse', category: 'healthcare', activityDescription: 'Substance Abuse Treatment Facility', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: OH_RESIDENTIAL_ZONES, feeBase: 1000.00, feePerSqft: null, processingDays: 90, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 5119.36' },

  // HOME HEALTH & HOSPICE
  { activityType: 'home_health_agency', category: 'healthcare', activityDescription: 'Home Health Agency', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 500.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3701.88' },
  { activityType: 'hospice', category: 'healthcare', activityDescription: 'Hospice Facility', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 1000.00, feePerSqft: null, processingDays: 90, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3712' },

  // VETERINARY
  { activityType: 'veterinary_clinic', category: 'healthcare', activityDescription: 'Veterinary Clinic', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 250.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4741' },
  { activityType: 'veterinary_hospital', category: 'healthcare', activityDescription: 'Veterinary Hospital (overnight care)', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 400.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4741' },
];

// ============================================================================
// CHILDCARE & EDUCATION INDUSTRY
// ============================================================================

const CHILDCARE_PERMIT_REQUIREMENTS = [
  // CHILDCARE - Ohio Department of Job and Family Services
  { activityType: 'childcare_center', category: 'childcare', activityDescription: 'Child Care Center (13+ children)', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 5104' },
  { activityType: 'childcare_type_a', category: 'childcare', activityDescription: 'Type A Family Child Care (7-12 children)', zonesRequired: OH_ALL_ZONES, zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 45, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 5104.02' },
  { activityType: 'childcare_type_b', category: 'childcare', activityDescription: 'Type B Family Child Care (1-6 children)', zonesRequired: OH_ALL_ZONES, zonesProhibited: [], feeBase: 25.00, feePerSqft: null, processingDays: 30, requiresPlans: false, requiresInspection: true, ordinanceRef: 'ORC 5104.02' },

  // PRESCHOOL
  { activityType: 'preschool', category: 'childcare', activityDescription: 'Preschool Program (3-5 years)', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 5104' },
  { activityType: 'head_start', category: 'childcare', activityDescription: 'Head Start / Early Head Start Program', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 5104' },

  // BEFORE/AFTER SCHOOL
  { activityType: 'after_school_program', category: 'childcare', activityDescription: 'Before/After School Care Program', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 5104' },
  { activityType: 'summer_camp', category: 'childcare', activityDescription: 'Summer Day Camp Program', zonesRequired: OH_ALL_ZONES, zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 21, requiresPlans: false, requiresInspection: true, ordinanceRef: 'ORC 5104' },

  // PRIVATE SCHOOLS
  { activityType: 'private_school', category: 'education', activityDescription: 'Private School (K-12)', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 90, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3301' },
  { activityType: 'tutoring_center', category: 'education', activityDescription: 'Tutoring/Learning Center', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: false, ordinanceRef: 'Local Business License' },
  { activityType: 'vocational_school', category: 'education', activityDescription: 'Vocational/Trade School', zonesRequired: [...OH_COMMERCIAL_ZONES, ...OH_INDUSTRIAL_ZONES], zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 45, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3332' },
  { activityType: 'driving_school', category: 'education', activityDescription: 'Driving School', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 150.00, feePerSqft: null, processingDays: 30, requiresPlans: false, requiresInspection: false, ordinanceRef: 'ORC 4508' },
];

// ============================================================================
// BEAUTY & SALON INDUSTRY
// ============================================================================

const BEAUTY_PERMIT_REQUIREMENTS = [
  // SALON LICENSES - Ohio State Cosmetology Board
  { activityType: 'beauty_salon', category: 'beauty', activityDescription: 'Beauty Salon (hair, nails, skin)', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 60.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4713' },
  { activityType: 'barbershop', category: 'beauty', activityDescription: 'Barbershop', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 60.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4709' },
  { activityType: 'nail_salon', category: 'beauty', activityDescription: 'Nail Salon', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 60.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4713' },
  { activityType: 'esthetics_salon', category: 'beauty', activityDescription: 'Esthetics/Skin Care Salon', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 60.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4713' },

  // SPA & MASSAGE
  { activityType: 'day_spa', category: 'beauty', activityDescription: 'Day Spa (multiple services)', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4713' },
  { activityType: 'massage_establishment', category: 'beauty', activityDescription: 'Massage Therapy Establishment', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4731.15' },
  { activityType: 'med_spa', category: 'beauty', activityDescription: 'Medical Spa (Botox, fillers, laser)', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 300.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4731' },

  // TATTOO & BODY ART
  { activityType: 'tattoo_studio', category: 'beauty', activityDescription: 'Tattoo Studio', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: OH_RESIDENTIAL_ZONES, feeBase: 100.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3730' },
  { activityType: 'piercing_studio', category: 'beauty', activityDescription: 'Body Piercing Studio', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: OH_RESIDENTIAL_ZONES, feeBase: 100.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3730' },
  { activityType: 'permanent_makeup', category: 'beauty', activityDescription: 'Permanent Makeup/Microblading', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3730' },

  // TANNING
  { activityType: 'tanning_salon', category: 'beauty', activityDescription: 'Tanning Salon', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: true, ordinanceRef: 'ORC 3701.80' },
];

// ============================================================================
// PET INDUSTRY
// ============================================================================

const PET_PERMIT_REQUIREMENTS = [
  // PET STORES & SERVICES
  { activityType: 'pet_store', category: 'pet', activityDescription: 'Pet Store (retail sales)', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },
  { activityType: 'pet_grooming', category: 'pet', activityDescription: 'Pet Grooming Salon', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },
  { activityType: 'mobile_pet_grooming', category: 'pet', activityDescription: 'Mobile Pet Grooming Service', zonesRequired: OH_ALL_ZONES, zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 7, requiresPlans: false, requiresInspection: false, ordinanceRef: 'Local Business License' },

  // BOARDING & DAYCARE
  { activityType: 'pet_boarding', category: 'pet', activityDescription: 'Pet Boarding Facility (kennel)', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 955' },
  { activityType: 'pet_daycare', category: 'pet', activityDescription: 'Pet Daycare Facility', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 150.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },
  { activityType: 'dog_training', category: 'pet', activityDescription: 'Dog Training Facility', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: false, ordinanceRef: 'Local Business License' },

  // BREEDING
  { activityType: 'pet_breeder', category: 'pet', activityDescription: 'Licensed Pet Breeder/Kennel', zonesRequired: ['*'], zonesProhibited: [], feeBase: 150.00, feePerSqft: null, processingDays: 30, requiresPlans: false, requiresInspection: true, ordinanceRef: 'ORC 956.04' },
];

// ============================================================================
// FITNESS INDUSTRY
// ============================================================================

const FITNESS_PERMIT_REQUIREMENTS = [
  // GYMS & FITNESS CENTERS
  { activityType: 'fitness_center', category: 'fitness', activityDescription: 'Fitness Center/Gym', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },
  { activityType: 'crossfit_gym', category: 'fitness', activityDescription: 'CrossFit/Functional Fitness Gym', zonesRequired: [...OH_COMMERCIAL_ZONES, ...OH_INDUSTRIAL_ZONES], zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },
  { activityType: 'yoga_studio', category: 'fitness', activityDescription: 'Yoga/Pilates Studio', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },
  { activityType: 'martial_arts', category: 'fitness', activityDescription: 'Martial Arts Studio', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },
  { activityType: 'dance_studio', category: 'fitness', activityDescription: 'Dance Studio', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },
  { activityType: 'personal_training', category: 'fitness', activityDescription: 'Personal Training Studio', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: false, ordinanceRef: 'Local Business License' },

  // POOLS & AQUATIC
  { activityType: 'swimming_pool_public', category: 'fitness', activityDescription: 'Public Swimming Pool', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 300.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'OAC 3701-31' },
  { activityType: 'aquatic_center', category: 'fitness', activityDescription: 'Aquatic/Swim Center', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 500.00, feePerSqft: null, processingDays: 45, requiresPlans: true, requiresInspection: true, ordinanceRef: 'OAC 3701-31' },

  // CLIMBING & RECREATION
  { activityType: 'climbing_gym', category: 'fitness', activityDescription: 'Rock Climbing Gym', zonesRequired: [...OH_COMMERCIAL_ZONES, ...OH_INDUSTRIAL_ZONES], zonesProhibited: [], feeBase: 250.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },
  { activityType: 'trampoline_park', category: 'fitness', activityDescription: 'Trampoline Park', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 400.00, feePerSqft: null, processingDays: 45, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },
];

// ============================================================================
// AUTO INDUSTRY
// ============================================================================

const AUTO_PERMIT_REQUIREMENTS = [
  // AUTO SALES
  { activityType: 'auto_dealer_new', category: 'auto', activityDescription: 'New Car Dealership', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: OH_RESIDENTIAL_ZONES, feeBase: 500.00, feePerSqft: null, processingDays: 45, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4517' },
  { activityType: 'auto_dealer_used', category: 'auto', activityDescription: 'Used Car Dealership', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: OH_RESIDENTIAL_ZONES, feeBase: 300.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4517' },
  { activityType: 'motorcycle_dealer', category: 'auto', activityDescription: 'Motorcycle/ATV Dealer', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: OH_RESIDENTIAL_ZONES, feeBase: 250.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4517' },

  // AUTO SERVICE & REPAIR
  { activityType: 'auto_repair', category: 'auto', activityDescription: 'Auto Repair Shop (general)', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: OH_RESIDENTIAL_ZONES, feeBase: 150.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },
  { activityType: 'auto_body_shop', category: 'auto', activityDescription: 'Auto Body/Collision Repair', zonesRequired: OH_INDUSTRIAL_ZONES, zonesProhibited: OH_RESIDENTIAL_ZONES, feeBase: 200.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },
  { activityType: 'oil_change', category: 'auto', activityDescription: 'Quick Lube/Oil Change Shop', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: OH_RESIDENTIAL_ZONES, feeBase: 100.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },
  { activityType: 'tire_shop', category: 'auto', activityDescription: 'Tire Shop', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: OH_RESIDENTIAL_ZONES, feeBase: 100.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },
  { activityType: 'transmission_shop', category: 'auto', activityDescription: 'Transmission/Specialty Repair', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: OH_RESIDENTIAL_ZONES, feeBase: 150.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },

  // CAR WASH
  { activityType: 'car_wash_automatic', category: 'auto', activityDescription: 'Automatic Car Wash', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: OH_RESIDENTIAL_ZONES, feeBase: 200.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },
  { activityType: 'car_wash_self', category: 'auto', activityDescription: 'Self-Service Car Wash', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: OH_RESIDENTIAL_ZONES, feeBase: 150.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },
  { activityType: 'car_detailing', category: 'auto', activityDescription: 'Auto Detailing Shop', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: OH_RESIDENTIAL_ZONES, feeBase: 100.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: false, ordinanceRef: 'Local Business License' },

  // GAS STATION
  { activityType: 'gas_station', category: 'auto', activityDescription: 'Gas Station/Convenience Store', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: OH_RESIDENTIAL_ZONES, feeBase: 500.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3737, Ohio EPA' },
  { activityType: 'ev_charging', category: 'auto', activityDescription: 'EV Charging Station', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'OBC Electrical' },

  // PARKING
  { activityType: 'parking_lot', category: 'auto', activityDescription: 'Commercial Parking Lot', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },
  { activityType: 'parking_garage', category: 'auto', activityDescription: 'Parking Garage', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 500.00, feePerSqft: null, processingDays: 45, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },

  // TOWING & SALVAGE
  { activityType: 'towing_service', category: 'auto', activityDescription: 'Towing Service', zonesRequired: OH_INDUSTRIAL_ZONES, zonesProhibited: OH_RESIDENTIAL_ZONES, feeBase: 150.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4513' },
  { activityType: 'auto_salvage', category: 'auto', activityDescription: 'Auto Salvage Yard', zonesRequired: ['MI'], zonesProhibited: [...OH_RESIDENTIAL_ZONES, ...OH_COMMERCIAL_ZONES], feeBase: 500.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4738, Ohio EPA' },
];

// ============================================================================
// RELIGIOUS ORGANIZATIONS
// ============================================================================

const RELIGIOUS_PERMIT_REQUIREMENTS = [
  // CHURCHES & PLACES OF WORSHIP
  { activityType: 'church', category: 'religious', activityDescription: 'Church/Place of Worship', zonesRequired: OH_ALL_ZONES, zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'RLUIPA, Local Zoning' },
  { activityType: 'mosque', category: 'religious', activityDescription: 'Mosque', zonesRequired: OH_ALL_ZONES, zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'RLUIPA, Local Zoning' },
  { activityType: 'synagogue', category: 'religious', activityDescription: 'Synagogue', zonesRequired: OH_ALL_ZONES, zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'RLUIPA, Local Zoning' },
  { activityType: 'temple', category: 'religious', activityDescription: 'Temple/Buddhist Center', zonesRequired: OH_ALL_ZONES, zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'RLUIPA, Local Zoning' },

  // RELIGIOUS SCHOOLS
  { activityType: 'religious_school', category: 'religious', activityDescription: 'Religious/Parochial School', zonesRequired: OH_ALL_ZONES, zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3301' },
  { activityType: 'religious_daycare', category: 'religious', activityDescription: 'Church-Based Child Care', zonesRequired: OH_ALL_ZONES, zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 5104' },

  // RELIGIOUS FACILITIES
  { activityType: 'fellowship_hall', category: 'religious', activityDescription: 'Fellowship Hall/Community Center', zonesRequired: OH_ALL_ZONES, zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },
  { activityType: 'parsonage', category: 'religious', activityDescription: 'Parsonage/Clergy Housing', zonesRequired: OH_ALL_ZONES, zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: false, ordinanceRef: 'Local Zoning' },
  { activityType: 'cemetery', category: 'religious', activityDescription: 'Cemetery', zonesRequired: ['*'], zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 517' },
];

// ============================================================================
// ENTERTAINMENT & EVENT VENUES
// ============================================================================

const ENTERTAINMENT_PERMIT_REQUIREMENTS = [
  // VENUES
  { activityType: 'event_venue', category: 'entertainment', activityDescription: 'Event/Wedding Venue', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 300.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },
  { activityType: 'banquet_hall', category: 'entertainment', activityDescription: 'Banquet Hall/Reception Center', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 300.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },
  { activityType: 'concert_venue', category: 'entertainment', activityDescription: 'Concert/Music Venue', zonesRequired: OH_MIXED_USE_ZONES, zonesProhibited: OH_RESIDENTIAL_ZONES, feeBase: 500.00, feePerSqft: null, processingDays: 45, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },
  { activityType: 'theater', category: 'entertainment', activityDescription: 'Theater/Performing Arts Center', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 400.00, feePerSqft: null, processingDays: 45, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },
  { activityType: 'movie_theater', category: 'entertainment', activityDescription: 'Movie Theater/Cinema', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 400.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },

  // NIGHTLIFE
  { activityType: 'nightclub', category: 'entertainment', activityDescription: 'Nightclub', zonesRequired: OH_MIXED_USE_ZONES, zonesProhibited: OH_RESIDENTIAL_ZONES, feeBase: 500.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning, ORC 4303' },
  { activityType: 'live_music_venue', category: 'entertainment', activityDescription: 'Live Music Venue', zonesRequired: OH_MIXED_USE_ZONES, zonesProhibited: OH_RESIDENTIAL_ZONES, feeBase: 300.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },
  { activityType: 'karaoke_bar', category: 'entertainment', activityDescription: 'Karaoke Bar', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: OH_RESIDENTIAL_ZONES, feeBase: 200.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },
  { activityType: 'comedy_club', category: 'entertainment', activityDescription: 'Comedy Club', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: OH_RESIDENTIAL_ZONES, feeBase: 200.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },

  // RECREATION & GAMING
  { activityType: 'bowling_alley', category: 'entertainment', activityDescription: 'Bowling Alley', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 300.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },
  { activityType: 'arcade', category: 'entertainment', activityDescription: 'Arcade/Game Center', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 150.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },
  { activityType: 'escape_room', category: 'entertainment', activityDescription: 'Escape Room', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 150.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },
  { activityType: 'laser_tag', category: 'entertainment', activityDescription: 'Laser Tag/Paintball Indoor', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 250.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },
  { activityType: 'mini_golf', category: 'entertainment', activityDescription: 'Mini Golf/Putt-Putt', zonesRequired: OH_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },
  { activityType: 'go_kart', category: 'entertainment', activityDescription: 'Go-Kart Track', zonesRequired: OH_INDUSTRIAL_ZONES, zonesProhibited: OH_RESIDENTIAL_ZONES, feeBase: 400.00, feePerSqft: null, processingDays: 45, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Zoning' },

  // OUTDOOR EVENTS
  { activityType: 'special_event', category: 'entertainment', activityDescription: 'Special Event Permit', zonesRequired: OH_ALL_ZONES, zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 30, requiresPlans: false, requiresInspection: false, ordinanceRef: 'Local Special Events' },
  { activityType: 'street_festival', category: 'entertainment', activityDescription: 'Street Festival/Block Party', zonesRequired: OH_ALL_ZONES, zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 45, requiresPlans: true, requiresInspection: false, ordinanceRef: 'Local Special Events' },
  { activityType: 'farmers_market_org', category: 'entertainment', activityDescription: 'Farmers Market (organizer)', zonesRequired: OH_ALL_ZONES, zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: false, ordinanceRef: 'Local Special Events' },

  // ADULT ENTERTAINMENT
  { activityType: 'adult_entertainment', category: 'entertainment', activityDescription: 'Adult Entertainment Establishment', zonesRequired: ['MI'], zonesProhibited: [...OH_RESIDENTIAL_ZONES, ...OH_MIXED_USE_ZONES], feeBase: 1000.00, feePerSqft: null, processingDays: 90, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 2907.40' },
];

// ============================================================================
// COMMON QUESTIONS FOR ALL INDUSTRIES (OHIO)
// ============================================================================

const COMMON_QUESTIONS = [
  // FOOD & RESTAURANT
  { question: 'What license do I need to open a restaurant in Ohio?', category: 'restaurant', answer: 'You need a food service license from your local health department. Type 3 ($250) for standard restaurants with cooking, Type 4 ($350) for high-risk operations like sushi. Apply with floor plans 3-4 weeks before opening. Also need general business license.', relatedPermits: ['food_license_type3', 'food_license_type4', 'business_license'], ordinanceRef: 'ORC 3717.11' },

  { question: 'How do I get a liquor license in Ohio?', category: 'liquor', answer: 'Apply to Ohio Division of Liquor Control. Common options: D-5 for full liquor ($2,344/year), D-5K for restaurants (food 50%+ of sales). Ohio has quota system - may need to purchase existing license ($20,000-50,000+). Must be 500ft from schools/churches. Local approval required from city council.', relatedPermits: ['liquor_d5', 'liquor_d5k'], ordinanceRef: 'ORC 4303.13' },

  { question: 'Can I sell food made in my home kitchen in Ohio?', category: 'cottage', answer: 'Yes! Ohio\'s Cottage Food Law allows sales of baked goods, candy, jams, honey without a license. Annual limit is $75,000. Must sell direct to consumers with labels including "Made in a Home Kitchen." Cannot sell foods requiring refrigeration, meat, or dairy.', relatedPermits: ['cottage_food'], ordinanceRef: 'ORC 3715.021' },

  { question: 'What permits do I need for a food truck in Ohio?', category: 'food_truck', answer: 'You need: (1) Mobile Food Unit license from Health Dept ($175), (2) Mobile Food Vendor License from city ($200), (3) Commissary agreement with licensed kitchen. Must pass health inspection. Some zones restrict where you can operate. Fire dept approval needed for propane setups.', relatedPermits: ['mobile_food_vendor', 'mobile_food_unit', 'commissary_agreement'], ordinanceRef: 'ORC 3717.43' },

  { question: 'How do I start a brewery in Ohio?', category: 'brewery', answer: 'Need: TTB Brewer\'s Notice (federal, free, 90-120 days), Ohio A-1-A permit ($1,562/year for up to 31,000 barrels). Can have taproom and sell for off-premises consumption. Industrial or commercial zoning required. Budget 6+ months for all permits.', relatedPermits: ['liquor_a1a', 'ttb_brewers_notice'], ordinanceRef: 'ORC 4303.02' },

  // HEALTHCARE
  { question: 'What do I need to open a medical office in Ohio?', category: 'healthcare', answer: 'You need: Ohio medical license for practitioners, business license, building permit for buildout. Commercial zoning required. If billing Medicaid: additional state certification. ADA compliance required. Plan review takes 2-4 weeks.', relatedPermits: ['medical_office'], ordinanceRef: 'ORC 4731' },

  { question: 'How do I open a pharmacy in Ohio?', category: 'pharmacy', answer: 'Apply to Ohio Board of Pharmacy for Terminal Distributor license. Need: pharmacist-in-charge with Ohio license, DEA registration, state controlled substance license. Retail pharmacy fee is $350. Must pass inspection. Location must be in commercial zone.', relatedPermits: ['pharmacy_retail'], ordinanceRef: 'ORC 4729' },

  // CHILDCARE
  { question: 'How do I start a daycare in Ohio?', category: 'childcare', answer: 'Depends on size: Type B (1-6 kids, $25), Type A (7-12 kids, $50), or Child Care Center (13+, $100). Apply to Ohio Dept of Job and Family Services. Need background checks (BCI/FBI), CPR/First Aid training, fire inspection, and health inspection. Home daycares allowed in residential zones.', relatedPermits: ['childcare_type_b', 'childcare_type_a', 'childcare_center'], ordinanceRef: 'ORC 5104' },

  { question: 'Can I run a home daycare in Ohio?', category: 'childcare', answer: 'Yes! Type B Family Child Care allows 1-6 children in your home ($25 license). Type A allows 7-12 children ($50). Need fire inspection, health inspection, background checks, and training. Certification required if accepting public assistance subsidies.', relatedPermits: ['childcare_type_b', 'childcare_type_a'], ordinanceRef: 'ORC 5104.02' },

  // BEAUTY
  { question: 'What license do I need for a salon in Ohio?', category: 'beauty', answer: 'Apply to Ohio State Cosmetology Board. Salon license is $60 plus individual practitioner licenses. Must have proper sanitation, ventilation, and equipment. Need business license and building permit for buildout. Commercial zoning required.', relatedPermits: ['beauty_salon', 'barbershop', 'nail_salon'], ordinanceRef: 'ORC 4713' },

  { question: 'Can I open a tattoo shop in Ohio?', category: 'tattoo', answer: 'Yes, tattoo studios are regulated under ORC 3730. Apply to local health department ($100). Must meet strict sanitation requirements including autoclave sterilization, single-use needles, and proper waste disposal. Commercial zoning only - not allowed near residential. Artists need individual registration.', relatedPermits: ['tattoo_studio', 'piercing_studio'], ordinanceRef: 'ORC 3730' },

  // AUTO
  { question: 'What permits do I need for an auto repair shop?', category: 'auto', answer: 'Need business license, building permit for any buildout, and proper commercial zoning. If storing vehicles outside, may need screening. Environmental compliance for waste oil, fluids, and batteries (Ohio EPA). Fire dept approval for paint booths if doing body work.', relatedPermits: ['auto_repair', 'auto_body_shop'], ordinanceRef: 'Local Zoning, Ohio EPA' },

  { question: 'How do I open a used car lot in Ohio?', category: 'auto', answer: 'Need Ohio Motor Vehicle Dealer License from BMV ($300), surety bond ($25,000), business license, and proper commercial zoning. Lot must have paved surface, adequate lighting, and office space. Cannot be in residential zones. Display limit may apply.', relatedPermits: ['auto_dealer_used'], ordinanceRef: 'ORC 4517' },

  // RELIGIOUS
  { question: 'Do churches need permits in Ohio?', category: 'religious', answer: 'Churches are allowed in all zones under federal law (RLUIPA). No license fee for religious organizations. However, you still need building permits for construction/renovation, fire inspection for occupancy, and must meet ADA accessibility. Parking requirements may be reduced for religious use.', relatedPermits: ['church', 'mosque', 'synagogue'], ordinanceRef: 'RLUIPA, Local Zoning' },

  // ENTERTAINMENT
  { question: 'How do I open an event venue in Ohio?', category: 'entertainment', answer: 'Need business license ($300), building permit for buildout, fire inspection for occupancy load, and commercial zoning. If serving alcohol: Ohio DLC liquor license. If catering food: food service license. Parking requirements depend on capacity. Sound insulation may be needed near residential.', relatedPermits: ['event_venue', 'banquet_hall', 'liquor_d5'], ordinanceRef: 'Local Zoning' },

  { question: 'What do I need to open a bar or nightclub in Ohio?', category: 'nightclub', answer: 'Need Ohio DLC D-5 license ($2,344 + quota purchase), city business license, building permit, fire inspection. Downtown/mixed-use zones typically required. Security plan needed for capacity over 200. Entertainment permit may be required for live music/dancing.', relatedPermits: ['liquor_d5', 'nightclub'], ordinanceRef: 'ORC 4303' },

  { question: 'How do I get a permit for a special event?', category: 'events', answer: 'Apply to city 30+ days in advance ($100-200). Need event plan including setup, security, parking, and cleanup. If serving food: temporary food permit from health dept. If serving alcohol: F-2 temporary permit from Ohio DLC ($50). Street closures require additional approval.', relatedPermits: ['special_event', 'temp_food_event', 'f2_permit'], ordinanceRef: 'Local Special Events' },

  // FITNESS
  { question: 'What permits do I need for a gym in Ohio?', category: 'fitness', answer: 'Need business license ($200), building permit for buildout, and commercial zoning. If shower facilities: plumbing permit. Adequate ventilation required. No special fitness license needed. Pool/spa requires health dept permit (OAC 3701-31). Occupancy load determines parking and exit requirements.', relatedPermits: ['fitness_center', 'yoga_studio'], ordinanceRef: 'Local Zoning, OAC 3701-31' },

  // PET
  { question: 'Can I open a dog daycare in Ohio?', category: 'pet', answer: 'Yes, need business license ($150), building permit for buildout, and commercial zoning. Noise mitigation may be required. Must comply with animal welfare standards. Boarding requires kennel license from county. Cannot be in residential zones unless approved variance.', relatedPermits: ['pet_daycare', 'pet_boarding'], ordinanceRef: 'ORC 955, Local Zoning' },
];

// ============================================================================
// BUILDING CODE CHUNKS
// ============================================================================

const BUILDING_CODE_CHUNKS = [
  // FOOD SERVICE
  { codeType: 'state', section: 'ORC 3717.04', title: 'Food Service License Required', content: 'No person shall operate a food service operation without a valid license from the local health department. Licenses must be renewed annually and posted in public view.' },
  { codeType: 'state', section: 'ORC 3717.11', title: 'Food License Types', content: 'Type 1: Prepackaged food only. Type 2: Limited food prep. Type 3: Full food preparation and cooking. Type 4: Complex operations (raw seafood, sushi, smoking).' },

  // LIQUOR - OHIO
  { codeType: 'state', section: 'ORC 4303.25', title: 'Liquor Distance Requirements', content: 'No liquor permit shall be issued for premises within 500 feet of any school, church, library, or public playground (measured door to door). Existing establishments grandfathered.' },
  { codeType: 'state', section: 'ORC 4301.22', title: 'Liquor Sale Hours', content: 'On-premises consumption: Monday-Saturday 5:30am-2:30am, Sunday 11am-2:30am (with Sunday permit) or 1pm-2:30am (without). Last call 30 minutes before closing.' },

  // CHILDCARE - OHIO
  { codeType: 'state', section: 'ORC 5104', title: 'Child Care Licensing', content: 'All child care providers caring for children under 6 years must be licensed by Ohio Department of Job and Family Services. Requirements include staff ratios, training, health and safety standards.' },
  { codeType: 'state', section: 'ORC 5104.02', title: 'Family Child Care Homes', content: 'Type A homes (7-12 children) and Type B homes (1-6 children) must be certified. Home must pass fire and health inspection. Caregiver must complete orientation training.' },

  // HEALTHCARE - OHIO
  { codeType: 'state', section: 'ORC 3702', title: 'Health Facility Licensure', content: 'Hospitals, nursing homes, ambulatory surgery centers, and other health facilities must be licensed by Ohio Department of Health.' },

  // BEAUTY - OHIO
  { codeType: 'state', section: 'ORC 4713', title: 'Cosmetology License', content: 'No person shall practice cosmetology without a license from the Ohio State Cosmetology Board. Shops and salons must also be licensed.' },
  { codeType: 'state', section: 'ORC 3730', title: 'Body Art Regulation', content: 'Tattoo and body piercing studios must register with local health department and comply with sanitation requirements.' },

  // AUTO - OHIO
  { codeType: 'state', section: 'ORC 4517', title: 'Motor Vehicle Dealer License', content: 'No person shall engage in the business of selling motor vehicles without a dealer license from Ohio BMV. Requires bond and place of business.' },

  // COTTAGE FOOD - OHIO
  { codeType: 'state', section: 'ORC 3715.021', title: 'Cottage Food Production', content: 'Home-based food producers may sell directly to consumers without a license if sales do not exceed $75,000 annually. Allowed products include baked goods, candy, jams, and other non-hazardous foods.' },
];

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

// All Ohio jurisdictions in the Cincinnati metro area
const OH_JURISDICTIONS = [
  'cincinnati-oh',
  'norwood-oh',
  'blue-ash-oh',
  'sharonville-oh',
  'montgomery-oh',
  'madeira-oh',
  'reading-oh',
  'deer-park-oh',
  'silverton-oh',
  'golf-manor-oh',
  'amberley-village-oh',
  'indian-hill-oh',
  'mariemont-oh',
  'evendale-oh',
  'glendale-oh',
  'woodlawn-oh',
  'lincoln-heights-oh',
  'lockland-oh',
  'wyoming-oh',
  'springdale-oh',
  'forest-park-oh',
  'mason-oh',
  'lebanon-oh',
  'loveland-oh',
  'franklin-oh',
  'springboro-oh',
  'hamilton-oh',
  'fairfield-oh',
  'middletown-oh',
  'oxford-oh',
  'trenton-oh',
  'monroe-oh',
  'milford-oh',
  'batavia-oh',
];

async function seedJurisdictionIndustries(jurisdictionId: string) {
  const jurisdiction = await prisma.jurisdiction.findFirst({
    where: { id: jurisdictionId },
  });

  if (!jurisdiction) {
    console.log(`  Skipping ${jurisdictionId} - not found in database`);
    return { permits: 0, codes: 0, questions: 0, skipped: true };
  }

  console.log(`\n  Seeding: ${jurisdiction.name}, ${jurisdiction.state}`);

  // Combine all permit requirements
  const ALL_PERMITS = [
    ...FOOD_PERMIT_REQUIREMENTS,
    ...HEALTHCARE_PERMIT_REQUIREMENTS,
    ...CHILDCARE_PERMIT_REQUIREMENTS,
    ...BEAUTY_PERMIT_REQUIREMENTS,
    ...PET_PERMIT_REQUIREMENTS,
    ...FITNESS_PERMIT_REQUIREMENTS,
    ...AUTO_PERMIT_REQUIREMENTS,
    ...RELIGIOUS_PERMIT_REQUIREMENTS,
    ...ENTERTAINMENT_PERMIT_REQUIREMENTS,
  ];

  // Seed Permit Requirements
  let permitCount = 0;
  for (const permit of ALL_PERMITS) {
    try {
      await prisma.permitRequirement.upsert({
        where: {
          jurisdictionId_activityType: {
            jurisdictionId: jurisdiction.id,
            activityType: permit.activityType,
          },
        },
        update: {
          activityDescription: permit.activityDescription,
          category: permit.category,
          zonesRequired: permit.zonesRequired,
          zonesProhibited: permit.zonesProhibited,
          requiresPermit: true,
          requiresPlans: permit.requiresPlans,
          requiresInspection: permit.requiresInspection,
          feeBase: permit.feeBase,
          feePerSqft: permit.feePerSqft,
          processingDays: permit.processingDays,
          documents: [],
          ordinanceRef: permit.ordinanceRef,
        },
        create: {
          jurisdictionId: jurisdiction.id,
          activityType: permit.activityType,
          activityDescription: permit.activityDescription,
          category: permit.category,
          zonesRequired: permit.zonesRequired,
          zonesProhibited: permit.zonesProhibited,
          requiresPermit: true,
          requiresPlans: permit.requiresPlans,
          requiresInspection: permit.requiresInspection,
          feeBase: permit.feeBase,
          feePerSqft: permit.feePerSqft,
          processingDays: permit.processingDays,
          documents: [],
          ordinanceRef: permit.ordinanceRef,
        },
      });
      permitCount++;
    } catch (error: any) {
      // Silent error handling
    }
  }

  // Seed Building Codes
  let codeCount = 0;
  for (const code of BUILDING_CODE_CHUNKS) {
    const existing = await prisma.buildingCodeChunk.findFirst({
      where: {
        jurisdictionId: jurisdiction.id,
        section: code.section,
      },
    });

    if (existing) {
      await prisma.buildingCodeChunk.update({
        where: { id: existing.id },
        data: {
          codeType: code.codeType,
          codeYear: '2024',
          title: code.title,
          content: code.content,
        },
      });
    } else {
      await prisma.buildingCodeChunk.create({
        data: {
          jurisdictionId: jurisdiction.id,
          codeType: code.codeType,
          codeYear: '2024',
          section: code.section,
          title: code.title,
          content: code.content,
        },
      });
    }
    codeCount++;
  }

  // Seed Common Questions
  let questionCount = 0;
  for (const q of COMMON_QUESTIONS) {
    const existing = await prisma.commonQuestion.findFirst({
      where: {
        jurisdictionId: jurisdiction.id,
        question: q.question,
      },
    });

    if (existing) {
      await prisma.commonQuestion.update({
        where: { id: existing.id },
        data: {
          category: q.category,
          answer: q.answer,
          relatedPermits: q.relatedPermits,
          ordinanceRef: q.ordinanceRef,
        },
      });
    } else {
      await prisma.commonQuestion.create({
        data: {
          jurisdictionId: jurisdiction.id,
          question: q.question,
          category: q.category,
          answer: q.answer,
          relatedPermits: q.relatedPermits,
          ordinanceRef: q.ordinanceRef,
        },
      });
    }
    questionCount++;
  }

  // Update jurisdiction status and completeness (don't change Cincinnati which is already live)
  if (jurisdictionId !== 'cincinnati-oh') {
    await prisma.jurisdiction.update({
      where: { id: jurisdiction.id },
      data: {
        status: 'live',
        dataCompleteness: 85,
      },
    });
  }

  console.log(`    ✓ ${permitCount} permits, ${codeCount} codes, ${questionCount} questions`);

  return { permits: permitCount, codes: codeCount, questions: questionCount, skipped: false };
}

async function seedAllOhioJurisdictions() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  Ohio Industries Seed Data - ALL JURISDICTIONS                 ║
║                                                                ║
║  Seeding comprehensive industry data for ALL Ohio cities       ║
║  in the Cincinnati metro area                                  ║
║  Covers: Food, Healthcare, Childcare, Beauty, Pet,             ║
║          Fitness, Auto, Religious, Entertainment               ║
╚════════════════════════════════════════════════════════════════╝
`);

  let totalPermits = 0;
  let totalCodes = 0;
  let totalQuestions = 0;
  let seeded = 0;
  let skipped = 0;

  for (const jurisdictionId of OH_JURISDICTIONS) {
    const result = await seedJurisdictionIndustries(jurisdictionId);
    if (result.skipped) {
      skipped++;
    } else {
      totalPermits += result.permits;
      totalCodes += result.codes;
      totalQuestions += result.questions;
      seeded++;
    }
  }

  console.log(`
${'='.repeat(60)}
Ohio Industries Seed Complete!
${'='.repeat(60)}

Summary:
  - Jurisdictions seeded: ${seeded}
  - Jurisdictions skipped: ${skipped}
  - Total Permit Requirements: ${totalPermits}
  - Total Building Code Chunks: ${totalCodes}
  - Total Common Questions: ${totalQuestions}

Industries Now Covered in ALL Ohio metros:
  ✓ Food & Restaurant (including Ohio DLC liquor licenses)
  ✓ Healthcare (medical, pharmacy, labs)
  ✓ Childcare & Education (ODJFS regulations)
  ✓ Beauty & Salon (including tattoo)
  ✓ Pet Industry
  ✓ Fitness & Recreation
  ✓ Auto Industry
  ✓ Religious Organizations
  ✓ Entertainment & Events
`);
}

seedAllOhioJurisdictions()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
