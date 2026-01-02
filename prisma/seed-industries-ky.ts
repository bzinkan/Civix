import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Kentucky Industries Seed Data
 *
 * This file contains permit requirements, building codes, and common questions
 * for all industries in Kentucky jurisdictions (Covington, etc.)
 *
 * Kentucky uses different regulatory agencies than Ohio:
 * - Kentucky ABC (Alcoholic Beverage Control) instead of Ohio DLC
 * - Kentucky Cabinet for Health and Family Services instead of Ohio Dept of Health
 * - Northern Kentucky Health Department for local food safety
 * - Kentucky Board of Education for childcare/education
 */

// Covington zone codes for reference
const KY_COMMERCIAL_ZONES = ['TUMU', 'CMU', 'DTC', 'DTR', 'CRM', 'AUC', 'SO'];
const KY_INDUSTRIAL_ZONES = ['SI', 'LI', 'GI'];
const KY_RESIDENTIAL_ZONES = ['RR', 'SR', 'SU', 'TUR'];
const KY_MIXED_USE_ZONES = ['TUMU', 'CMU', 'DTC', 'DTR', 'CRM'];
const KY_ALL_ZONES = ['*'];

// ============================================================================
// FOOD & RESTAURANT INDUSTRY
// ============================================================================

const FOOD_PERMIT_REQUIREMENTS = [
  // FOOD SERVICE LICENSES - Northern Kentucky Health Department
  { activityType: 'food_license_risk1', category: 'food_license', activityDescription: 'Risk Level 1 Food License - Prepackaged food only', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 7, requiresPlans: false, requiresInspection: true, ordinanceRef: 'NKHD Food Code' },
  { activityType: 'food_license_risk2', category: 'food_license', activityDescription: 'Risk Level 2 Food License - Limited prep (heating, assembly)', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 150.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'NKHD Food Code' },
  { activityType: 'food_license_risk3', category: 'food_license', activityDescription: 'Risk Level 3 Food License - Full cooking operations', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 250.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'NKHD Food Code' },
  { activityType: 'food_license_risk4', category: 'food_license', activityDescription: 'Risk Level 4 Food License - High-risk (sushi, smoking, raw)', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 350.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'NKHD Food Code' },

  // MOBILE FOOD
  { activityType: 'mobile_food_vendor', category: 'food_license', activityDescription: 'Mobile Food Vendor License (Food Truck)', zonesRequired: KY_ALL_ZONES, zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'NKHD Mobile Food' },
  { activityType: 'mobile_food_unit', category: 'food_license', activityDescription: 'Mobile Food Unit Health Permit', zonesRequired: KY_ALL_ZONES, zonesProhibited: [], feeBase: 175.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'NKHD Mobile Food' },
  { activityType: 'commissary_agreement', category: 'food_license', activityDescription: 'Commissary Kitchen Agreement (required for mobile)', zonesRequired: KY_ALL_ZONES, zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 7, requiresPlans: false, requiresInspection: false, ordinanceRef: 'NKHD Mobile Food' },

  // KENTUCKY ABC LIQUOR LICENSES
  { activityType: 'liquor_nq2', category: 'liquor_license', activityDescription: 'NQ2 License - Restaurant all alcohol (50%+ food sales)', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 1800.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: false, ordinanceRef: 'KRS 243.070' },
  { activityType: 'liquor_nq3', category: 'liquor_license', activityDescription: 'NQ3 License - Bar/tavern all alcohol (no food requirement)', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 2500.00, feePerSqft: null, processingDays: 90, requiresPlans: true, requiresInspection: false, ordinanceRef: 'KRS 243.070' },
  { activityType: 'liquor_nq4', category: 'liquor_license', activityDescription: 'NQ4 License - Hotel/motel alcohol service', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 3000.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: false, ordinanceRef: 'KRS 243.070' },
  { activityType: 'liquor_rd', category: 'liquor_license', activityDescription: 'RD License - Retail drink (beer/wine only)', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 500.00, feePerSqft: null, processingDays: 45, requiresPlans: true, requiresInspection: false, ordinanceRef: 'KRS 243.070' },
  { activityType: 'liquor_edt', category: 'liquor_license', activityDescription: 'EDT License - Extended hours (until 4am)', zonesRequired: ['DTC', 'DTR', 'TUMU'], zonesProhibited: [], feeBase: 1000.00, feePerSqft: null, processingDays: 30, requiresPlans: false, requiresInspection: false, ordinanceRef: 'KRS 244.290' },
  { activityType: 'liquor_caterer', category: 'liquor_license', activityDescription: 'Caterer License - Off-site alcohol service', zonesRequired: KY_ALL_ZONES, zonesProhibited: [], feeBase: 500.00, feePerSqft: null, processingDays: 30, requiresPlans: false, requiresInspection: false, ordinanceRef: 'KRS 243.260' },
  { activityType: 'liquor_temporary', category: 'liquor_license', activityDescription: 'Temporary License - Special events (1-3 days)', zonesRequired: KY_ALL_ZONES, zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: false, ordinanceRef: 'KRS 243.260' },
  { activityType: 'liquor_sunday', category: 'liquor_license', activityDescription: 'Sunday Sales Permit', zonesRequired: KY_ALL_ZONES, zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 30, requiresPlans: false, requiresInspection: false, ordinanceRef: 'KRS 244.290' },

  // BREWERY / DISTILLERY - Kentucky
  { activityType: 'microbrewery', category: 'liquor_license', activityDescription: 'Microbrewery License (under 25,000 barrels)', zonesRequired: [...KY_COMMERCIAL_ZONES, ...KY_INDUSTRIAL_ZONES], zonesProhibited: [], feeBase: 500.00, feePerSqft: null, processingDays: 90, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 243.157' },
  { activityType: 'craft_distillery', category: 'liquor_license', activityDescription: 'Craft Distillery License (under 50,000 gallons)', zonesRequired: [...KY_COMMERCIAL_ZONES, ...KY_INDUSTRIAL_ZONES], zonesProhibited: [], feeBase: 1000.00, feePerSqft: null, processingDays: 120, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 243.155' },
  { activityType: 'small_farm_winery', category: 'liquor_license', activityDescription: 'Small Farm Winery License', zonesRequired: ['RR', ...KY_COMMERCIAL_ZONES], zonesProhibited: [], feeBase: 250.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 243.155' },
  { activityType: 'ttb_brewers_notice', category: 'federal', activityDescription: 'TTB Brewer\'s Notice (Federal)', zonesRequired: KY_ALL_ZONES, zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 120, requiresPlans: true, requiresInspection: true, ordinanceRef: '27 CFR 25' },
  { activityType: 'ttb_dsp', category: 'federal', activityDescription: 'TTB Distilled Spirits Permit (Federal)', zonesRequired: KY_ALL_ZONES, zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 180, requiresPlans: true, requiresInspection: true, ordinanceRef: '27 CFR 19' },

  // CATERING & EVENTS
  { activityType: 'caterer_license', category: 'food_license', activityDescription: 'Catering Food License', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 250.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'NKHD Food Code' },
  { activityType: 'temp_food_event', category: 'food_license', activityDescription: 'Temporary Food Event Permit (1-14 days)', zonesRequired: KY_ALL_ZONES, zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: true, ordinanceRef: 'NKHD Temp Food' },

  // FARMERS MARKET & COTTAGE FOOD - Kentucky
  { activityType: 'farmers_market_vendor', category: 'food_license', activityDescription: 'Farmers Market Vendor Permit', zonesRequired: KY_ALL_ZONES, zonesProhibited: [], feeBase: 25.00, feePerSqft: null, processingDays: 7, requiresPlans: false, requiresInspection: false, ordinanceRef: 'KRS 217.127' },
  { activityType: 'cottage_food', category: 'food_license', activityDescription: 'Cottage Food Registration (home-based, $60K limit)', zonesRequired: KY_ALL_ZONES, zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 0, requiresPlans: false, requiresInspection: false, ordinanceRef: 'KRS 217.136' },
  { activityType: 'homestead_food', category: 'food_license', activityDescription: 'Homestead Food License (expanded cottage food)', zonesRequired: KY_ALL_ZONES, zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 7, requiresPlans: false, requiresInspection: true, ordinanceRef: 'KRS 217.138' },
];

// ============================================================================
// HEALTHCARE INDUSTRY
// ============================================================================

const HEALTHCARE_PERMIT_REQUIREMENTS = [
  // MEDICAL OFFICES
  { activityType: 'medical_office', category: 'healthcare', activityDescription: 'Medical Office (physician, dental, chiropractic)', zonesRequired: [...KY_COMMERCIAL_ZONES, 'SO'], zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 216B' },
  { activityType: 'urgent_care', category: 'healthcare', activityDescription: 'Urgent Care Facility', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 500.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 216B' },
  { activityType: 'outpatient_clinic', category: 'healthcare', activityDescription: 'Outpatient Clinic', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 750.00, feePerSqft: null, processingDays: 45, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 216B' },
  { activityType: 'ambulatory_surgery', category: 'healthcare', activityDescription: 'Ambulatory Surgery Center', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 2000.00, feePerSqft: null, processingDays: 90, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 216B.0441' },

  // PHARMACY
  { activityType: 'pharmacy_retail', category: 'healthcare', activityDescription: 'Retail Pharmacy', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 350.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 315' },
  { activityType: 'pharmacy_compounding', category: 'healthcare', activityDescription: 'Compounding Pharmacy', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 500.00, feePerSqft: null, processingDays: 45, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 315' },

  // LABS & IMAGING
  { activityType: 'clinical_lab', category: 'healthcare', activityDescription: 'Clinical Laboratory', zonesRequired: [...KY_COMMERCIAL_ZONES, ...KY_INDUSTRIAL_ZONES], zonesProhibited: [], feeBase: 500.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 333' },
  { activityType: 'imaging_center', category: 'healthcare', activityDescription: 'Diagnostic Imaging Center', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 750.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 216B' },

  // MENTAL HEALTH & COUNSELING
  { activityType: 'mental_health_clinic', category: 'healthcare', activityDescription: 'Mental Health Clinic', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 300.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 210.366' },
  { activityType: 'counseling_practice', category: 'healthcare', activityDescription: 'Counseling/Therapy Practice', zonesRequired: [...KY_COMMERCIAL_ZONES, 'SO'], zonesProhibited: [], feeBase: 150.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: false, ordinanceRef: 'KRS 335' },
  { activityType: 'substance_abuse', category: 'healthcare', activityDescription: 'Substance Abuse Treatment Facility', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: KY_RESIDENTIAL_ZONES, feeBase: 1000.00, feePerSqft: null, processingDays: 90, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 222' },

  // HOME HEALTH & HOSPICE
  { activityType: 'home_health_agency', category: 'healthcare', activityDescription: 'Home Health Agency', zonesRequired: [...KY_COMMERCIAL_ZONES, 'SO'], zonesProhibited: [], feeBase: 500.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 216.935' },
  { activityType: 'hospice', category: 'healthcare', activityDescription: 'Hospice Facility', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 1000.00, feePerSqft: null, processingDays: 90, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 216.935' },

  // VETERINARY
  { activityType: 'veterinary_clinic', category: 'healthcare', activityDescription: 'Veterinary Clinic', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 250.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 321' },
  { activityType: 'veterinary_hospital', category: 'healthcare', activityDescription: 'Veterinary Hospital (overnight care)', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 400.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 321' },
];

// ============================================================================
// CHILDCARE & EDUCATION INDUSTRY
// ============================================================================

const CHILDCARE_PERMIT_REQUIREMENTS = [
  // CHILDCARE - Kentucky Cabinet for Health and Family Services
  { activityType: 'childcare_center', category: 'childcare', activityDescription: 'Child Care Center (13+ children)', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: true, ordinanceRef: '922 KAR 2:090' },
  { activityType: 'childcare_type1', category: 'childcare', activityDescription: 'Type I Family Child Care (4-6 children)', zonesRequired: KY_ALL_ZONES, zonesProhibited: [], feeBase: 25.00, feePerSqft: null, processingDays: 30, requiresPlans: false, requiresInspection: true, ordinanceRef: '922 KAR 2:100' },
  { activityType: 'childcare_type2', category: 'childcare', activityDescription: 'Type II Family Child Care (7-12 children)', zonesRequired: KY_ALL_ZONES, zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 45, requiresPlans: true, requiresInspection: true, ordinanceRef: '922 KAR 2:100' },
  { activityType: 'childcare_certified', category: 'childcare', activityDescription: 'Certified Family Child Care (1-3 children, CCAP)', zonesRequired: KY_ALL_ZONES, zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: true, ordinanceRef: '922 KAR 2:110' },

  // PRESCHOOL & HEAD START
  { activityType: 'preschool', category: 'childcare', activityDescription: 'Preschool Program (3-5 years)', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: true, ordinanceRef: '922 KAR 2:090' },
  { activityType: 'head_start', category: 'childcare', activityDescription: 'Head Start / Early Head Start Program', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: true, ordinanceRef: '922 KAR 2:090' },

  // BEFORE/AFTER SCHOOL
  { activityType: 'after_school_program', category: 'childcare', activityDescription: 'Before/After School Care Program', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: '922 KAR 2:090' },
  { activityType: 'summer_camp', category: 'childcare', activityDescription: 'Summer Day Camp Program', zonesRequired: KY_ALL_ZONES, zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 21, requiresPlans: false, requiresInspection: true, ordinanceRef: '922 KAR 2:090' },

  // PRIVATE SCHOOLS
  { activityType: 'private_school', category: 'education', activityDescription: 'Private School (K-12)', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 90, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 156.160' },
  { activityType: 'tutoring_center', category: 'education', activityDescription: 'Tutoring/Learning Center', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: false, ordinanceRef: 'COV Business License' },
  { activityType: 'vocational_school', category: 'education', activityDescription: 'Vocational/Trade School', zonesRequired: [...KY_COMMERCIAL_ZONES, ...KY_INDUSTRIAL_ZONES], zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 45, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 165A' },
  { activityType: 'driving_school', category: 'education', activityDescription: 'Driving School', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 150.00, feePerSqft: null, processingDays: 30, requiresPlans: false, requiresInspection: false, ordinanceRef: 'KRS 332' },
];

// ============================================================================
// BEAUTY & SALON INDUSTRY
// ============================================================================

const BEAUTY_PERMIT_REQUIREMENTS = [
  // SALON LICENSES - Kentucky Board of Hairdressers and Cosmetologists
  { activityType: 'beauty_salon', category: 'beauty', activityDescription: 'Beauty Salon (hair, nails, skin)', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 317B' },
  { activityType: 'barbershop', category: 'beauty', activityDescription: 'Barbershop', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 317B' },
  { activityType: 'nail_salon', category: 'beauty', activityDescription: 'Nail Salon', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 317B' },
  { activityType: 'esthetics_salon', category: 'beauty', activityDescription: 'Esthetics/Skin Care Salon', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 317B' },

  // SPA & MASSAGE
  { activityType: 'day_spa', category: 'beauty', activityDescription: 'Day Spa (multiple services)', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 317B' },
  { activityType: 'massage_establishment', category: 'beauty', activityDescription: 'Massage Therapy Establishment', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 309.350' },
  { activityType: 'med_spa', category: 'beauty', activityDescription: 'Medical Spa (Botox, fillers, laser)', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 300.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 311' },

  // TATTOO & BODY ART
  { activityType: 'tattoo_studio', category: 'beauty', activityDescription: 'Tattoo Studio', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: KY_RESIDENTIAL_ZONES, feeBase: 100.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'NKHD Body Art' },
  { activityType: 'piercing_studio', category: 'beauty', activityDescription: 'Body Piercing Studio', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: KY_RESIDENTIAL_ZONES, feeBase: 100.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'NKHD Body Art' },
  { activityType: 'permanent_makeup', category: 'beauty', activityDescription: 'Permanent Makeup/Microblading', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'NKHD Body Art' },

  // TANNING
  { activityType: 'tanning_salon', category: 'beauty', activityDescription: 'Tanning Salon', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: true, ordinanceRef: 'KRS 217.922' },
];

// ============================================================================
// PET INDUSTRY
// ============================================================================

const PET_PERMIT_REQUIREMENTS = [
  // PET STORES & SERVICES
  { activityType: 'pet_store', category: 'pet', activityDescription: 'Pet Store (retail sales)', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 91' },
  { activityType: 'pet_grooming', category: 'pet', activityDescription: 'Pet Grooming Salon', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 91' },
  { activityType: 'mobile_pet_grooming', category: 'pet', activityDescription: 'Mobile Pet Grooming Service', zonesRequired: KY_ALL_ZONES, zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 7, requiresPlans: false, requiresInspection: false, ordinanceRef: 'COV Business License' },

  // BOARDING & DAYCARE
  { activityType: 'pet_boarding', category: 'pet', activityDescription: 'Pet Boarding Facility (kennel)', zonesRequired: [...KY_COMMERCIAL_ZONES, 'RR'], zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 91' },
  { activityType: 'pet_daycare', category: 'pet', activityDescription: 'Pet Daycare Facility', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 150.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 91' },
  { activityType: 'dog_training', category: 'pet', activityDescription: 'Dog Training Facility', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: false, ordinanceRef: 'COV Business License' },

  // BREEDING
  { activityType: 'pet_breeder', category: 'pet', activityDescription: 'Licensed Pet Breeder', zonesRequired: ['RR', 'SR'], zonesProhibited: ['DTC', 'DTR'], feeBase: 150.00, feePerSqft: null, processingDays: 30, requiresPlans: false, requiresInspection: true, ordinanceRef: 'COV 91' },
];

// ============================================================================
// FITNESS INDUSTRY
// ============================================================================

const FITNESS_PERMIT_REQUIREMENTS = [
  // GYMS & FITNESS CENTERS
  { activityType: 'fitness_center', category: 'fitness', activityDescription: 'Fitness Center/Gym', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },
  { activityType: 'crossfit_gym', category: 'fitness', activityDescription: 'CrossFit/Functional Fitness Gym', zonesRequired: [...KY_COMMERCIAL_ZONES, ...KY_INDUSTRIAL_ZONES], zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },
  { activityType: 'yoga_studio', category: 'fitness', activityDescription: 'Yoga/Pilates Studio', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },
  { activityType: 'martial_arts', category: 'fitness', activityDescription: 'Martial Arts Studio', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },
  { activityType: 'dance_studio', category: 'fitness', activityDescription: 'Dance Studio', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },
  { activityType: 'personal_training', category: 'fitness', activityDescription: 'Personal Training Studio', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: false, ordinanceRef: 'COV Business License' },

  // POOLS & AQUATIC
  { activityType: 'swimming_pool_public', category: 'fitness', activityDescription: 'Public Swimming Pool', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 300.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'NKHD Pool Code' },
  { activityType: 'aquatic_center', category: 'fitness', activityDescription: 'Aquatic/Swim Center', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 500.00, feePerSqft: null, processingDays: 45, requiresPlans: true, requiresInspection: true, ordinanceRef: 'NKHD Pool Code' },

  // CLIMBING & RECREATION
  { activityType: 'climbing_gym', category: 'fitness', activityDescription: 'Rock Climbing Gym', zonesRequired: [...KY_COMMERCIAL_ZONES, ...KY_INDUSTRIAL_ZONES], zonesProhibited: [], feeBase: 250.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },
  { activityType: 'trampoline_park', category: 'fitness', activityDescription: 'Trampoline Park', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 400.00, feePerSqft: null, processingDays: 45, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },
];

// ============================================================================
// AUTO INDUSTRY
// ============================================================================

const AUTO_PERMIT_REQUIREMENTS = [
  // AUTO SALES
  { activityType: 'auto_dealer_new', category: 'auto', activityDescription: 'New Car Dealership', zonesRequired: ['AUC', 'CMU'], zonesProhibited: KY_RESIDENTIAL_ZONES, feeBase: 500.00, feePerSqft: null, processingDays: 45, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 190' },
  { activityType: 'auto_dealer_used', category: 'auto', activityDescription: 'Used Car Dealership', zonesRequired: ['AUC', 'CMU', 'LI'], zonesProhibited: KY_RESIDENTIAL_ZONES, feeBase: 300.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 190' },
  { activityType: 'motorcycle_dealer', category: 'auto', activityDescription: 'Motorcycle/ATV Dealer', zonesRequired: ['AUC', 'CMU', 'LI'], zonesProhibited: KY_RESIDENTIAL_ZONES, feeBase: 250.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 190' },

  // AUTO SERVICE & REPAIR
  { activityType: 'auto_repair', category: 'auto', activityDescription: 'Auto Repair Shop (general)', zonesRequired: ['AUC', 'CMU', 'LI', 'GI'], zonesProhibited: KY_RESIDENTIAL_ZONES, feeBase: 150.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },
  { activityType: 'auto_body_shop', category: 'auto', activityDescription: 'Auto Body/Collision Repair', zonesRequired: ['LI', 'GI'], zonesProhibited: KY_RESIDENTIAL_ZONES, feeBase: 200.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },
  { activityType: 'oil_change', category: 'auto', activityDescription: 'Quick Lube/Oil Change Shop', zonesRequired: ['AUC', 'CMU'], zonesProhibited: KY_RESIDENTIAL_ZONES, feeBase: 100.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },
  { activityType: 'tire_shop', category: 'auto', activityDescription: 'Tire Shop', zonesRequired: ['AUC', 'CMU', 'LI'], zonesProhibited: KY_RESIDENTIAL_ZONES, feeBase: 100.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },
  { activityType: 'transmission_shop', category: 'auto', activityDescription: 'Transmission/Specialty Repair', zonesRequired: ['AUC', 'LI', 'GI'], zonesProhibited: KY_RESIDENTIAL_ZONES, feeBase: 150.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },

  // CAR WASH
  { activityType: 'car_wash_automatic', category: 'auto', activityDescription: 'Automatic Car Wash', zonesRequired: ['AUC', 'CMU'], zonesProhibited: KY_RESIDENTIAL_ZONES, feeBase: 200.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },
  { activityType: 'car_wash_self', category: 'auto', activityDescription: 'Self-Service Car Wash', zonesRequired: ['AUC', 'CMU', 'LI'], zonesProhibited: KY_RESIDENTIAL_ZONES, feeBase: 150.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },
  { activityType: 'car_detailing', category: 'auto', activityDescription: 'Auto Detailing Shop', zonesRequired: ['AUC', 'CMU', 'LI'], zonesProhibited: KY_RESIDENTIAL_ZONES, feeBase: 100.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: false, ordinanceRef: 'COV Business License' },

  // GAS STATION
  { activityType: 'gas_station', category: 'auto', activityDescription: 'Gas Station/Convenience Store', zonesRequired: ['AUC'], zonesProhibited: KY_RESIDENTIAL_ZONES, feeBase: 500.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158, KDEP' },
  { activityType: 'ev_charging', category: 'auto', activityDescription: 'EV Charging Station', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KBC Electrical' },

  // PARKING
  { activityType: 'parking_lot', category: 'auto', activityDescription: 'Commercial Parking Lot', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },
  { activityType: 'parking_garage', category: 'auto', activityDescription: 'Parking Garage', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 500.00, feePerSqft: null, processingDays: 45, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },

  // TOWING & SALVAGE
  { activityType: 'towing_service', category: 'auto', activityDescription: 'Towing Service', zonesRequired: ['LI', 'GI'], zonesProhibited: KY_RESIDENTIAL_ZONES, feeBase: 150.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 376' },
  { activityType: 'auto_salvage', category: 'auto', activityDescription: 'Auto Salvage Yard', zonesRequired: ['GI'], zonesProhibited: [...KY_RESIDENTIAL_ZONES, ...KY_COMMERCIAL_ZONES], feeBase: 500.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 177, COV 158' },
];

// ============================================================================
// RELIGIOUS ORGANIZATIONS
// ============================================================================

const RELIGIOUS_PERMIT_REQUIREMENTS = [
  // CHURCHES & PLACES OF WORSHIP
  { activityType: 'church', category: 'religious', activityDescription: 'Church/Place of Worship', zonesRequired: KY_ALL_ZONES, zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },
  { activityType: 'mosque', category: 'religious', activityDescription: 'Mosque', zonesRequired: KY_ALL_ZONES, zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },
  { activityType: 'synagogue', category: 'religious', activityDescription: 'Synagogue', zonesRequired: KY_ALL_ZONES, zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },
  { activityType: 'temple', category: 'religious', activityDescription: 'Temple/Buddhist Center', zonesRequired: KY_ALL_ZONES, zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },

  // RELIGIOUS SCHOOLS
  { activityType: 'religious_school', category: 'religious', activityDescription: 'Religious/Parochial School', zonesRequired: KY_ALL_ZONES, zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 156.160' },
  { activityType: 'religious_daycare', category: 'religious', activityDescription: 'Church-Based Child Care', zonesRequired: KY_ALL_ZONES, zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: true, ordinanceRef: '922 KAR 2:090' },

  // RELIGIOUS FACILITIES
  { activityType: 'fellowship_hall', category: 'religious', activityDescription: 'Fellowship Hall/Community Center', zonesRequired: KY_ALL_ZONES, zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },
  { activityType: 'parsonage', category: 'religious', activityDescription: 'Parsonage/Clergy Housing', zonesRequired: KY_ALL_ZONES, zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: false, ordinanceRef: 'COV 158' },
  { activityType: 'cemetery', category: 'religious', activityDescription: 'Cemetery', zonesRequired: ['RR', 'RP', 'REC'], zonesProhibited: KY_COMMERCIAL_ZONES, feeBase: 200.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KRS 381' },
];

// ============================================================================
// ENTERTAINMENT & EVENT VENUES
// ============================================================================

const ENTERTAINMENT_PERMIT_REQUIREMENTS = [
  // VENUES
  { activityType: 'event_venue', category: 'entertainment', activityDescription: 'Event/Wedding Venue', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 300.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },
  { activityType: 'banquet_hall', category: 'entertainment', activityDescription: 'Banquet Hall/Reception Center', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 300.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },
  { activityType: 'concert_venue', category: 'entertainment', activityDescription: 'Concert/Music Venue', zonesRequired: ['DTC', 'DTR', 'CMU'], zonesProhibited: KY_RESIDENTIAL_ZONES, feeBase: 500.00, feePerSqft: null, processingDays: 45, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },
  { activityType: 'theater', category: 'entertainment', activityDescription: 'Theater/Performing Arts Center', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 400.00, feePerSqft: null, processingDays: 45, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },
  { activityType: 'movie_theater', category: 'entertainment', activityDescription: 'Movie Theater/Cinema', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 400.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },

  // NIGHTLIFE
  { activityType: 'nightclub', category: 'entertainment', activityDescription: 'Nightclub', zonesRequired: ['DTC', 'DTR', 'TUMU'], zonesProhibited: KY_RESIDENTIAL_ZONES, feeBase: 500.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158, KY ABC' },
  { activityType: 'live_music_venue', category: 'entertainment', activityDescription: 'Live Music Venue', zonesRequired: ['DTC', 'DTR', 'TUMU', 'CMU'], zonesProhibited: KY_RESIDENTIAL_ZONES, feeBase: 300.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },
  { activityType: 'karaoke_bar', category: 'entertainment', activityDescription: 'Karaoke Bar', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: KY_RESIDENTIAL_ZONES, feeBase: 200.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },
  { activityType: 'comedy_club', category: 'entertainment', activityDescription: 'Comedy Club', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: KY_RESIDENTIAL_ZONES, feeBase: 200.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },

  // RECREATION & GAMING
  { activityType: 'bowling_alley', category: 'entertainment', activityDescription: 'Bowling Alley', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 300.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },
  { activityType: 'arcade', category: 'entertainment', activityDescription: 'Arcade/Game Center', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 150.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },
  { activityType: 'escape_room', category: 'entertainment', activityDescription: 'Escape Room', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 150.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },
  { activityType: 'laser_tag', category: 'entertainment', activityDescription: 'Laser Tag/Paintball Indoor', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 250.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },
  { activityType: 'mini_golf', category: 'entertainment', activityDescription: 'Mini Golf/Putt-Putt', zonesRequired: KY_COMMERCIAL_ZONES, zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },
  { activityType: 'go_kart', category: 'entertainment', activityDescription: 'Go-Kart Track', zonesRequired: ['AUC', 'LI'], zonesProhibited: KY_RESIDENTIAL_ZONES, feeBase: 400.00, feePerSqft: null, processingDays: 45, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158' },

  // OUTDOOR EVENTS
  { activityType: 'special_event', category: 'entertainment', activityDescription: 'Special Event Permit', zonesRequired: KY_ALL_ZONES, zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 30, requiresPlans: false, requiresInspection: false, ordinanceRef: 'COV Special Events' },
  { activityType: 'street_festival', category: 'entertainment', activityDescription: 'Street Festival/Block Party', zonesRequired: KY_ALL_ZONES, zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 45, requiresPlans: true, requiresInspection: false, ordinanceRef: 'COV Special Events' },
  { activityType: 'farmers_market', category: 'entertainment', activityDescription: 'Farmers Market (organizer)', zonesRequired: KY_ALL_ZONES, zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: false, ordinanceRef: 'COV Special Events' },

  // ADULT ENTERTAINMENT
  { activityType: 'adult_entertainment', category: 'entertainment', activityDescription: 'Adult Entertainment Establishment', zonesRequired: ['GI'], zonesProhibited: [...KY_RESIDENTIAL_ZONES, 'DTC', 'DTR'], feeBase: 1000.00, feePerSqft: null, processingDays: 90, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 113' },
];

// ============================================================================
// COMMON QUESTIONS FOR ALL INDUSTRIES
// ============================================================================

const COMMON_QUESTIONS = [
  // FOOD & RESTAURANT
  { question: 'What license do I need to open a restaurant in Covington?', category: 'restaurant', answer: 'You need a food service license from Northern Kentucky Health Department. Risk Level 3 ($250) for standard restaurants with cooking, Risk Level 4 ($350) for high-risk operations like sushi. Also need Covington business license. Apply to NKHD with floor plans 3-4 weeks before opening.', relatedPermits: ['food_license_risk3', 'food_license_risk4', 'business_license'], ordinanceRef: 'NKHD Food Code' },

  { question: 'How do I get a liquor license in Kentucky?', category: 'liquor', answer: 'Apply to Kentucky ABC (Alcoholic Beverage Control). Common options: NQ2 for restaurants (50%+ food sales, $1,800), NQ3 for bars ($2,500). Kentucky has no quota system like Ohio - licenses are available. Process takes 60-90 days. Must be 200ft from schools/churches. Local approval from Covington required.', relatedPermits: ['liquor_nq2', 'liquor_nq3'], ordinanceRef: 'KRS 243.070' },

  { question: 'Can I sell food made in my home kitchen in Kentucky?', category: 'cottage', answer: 'Yes! Kentucky\'s Cottage Food Law allows sales of baked goods, candy, jams, honey without a license. Annual limit is $60,000. Must sell direct to consumers with labels including "Made in a Home Kitchen." Homestead License ($50) expands what you can sell. Cannot sell foods requiring refrigeration.', relatedPermits: ['cottage_food', 'homestead_food'], ordinanceRef: 'KRS 217.136' },

  { question: 'What permits do I need for a food truck in Covington?', category: 'food_truck', answer: 'You need: (1) Mobile Food Unit license from NKHD ($175), (2) Covington Mobile Vendor License ($200), (3) Commissary agreement with licensed kitchen. Must pass health inspection. Some zones restrict where you can operate. Fire dept approval needed for propane setups.', relatedPermits: ['mobile_food_vendor', 'mobile_food_unit', 'commissary_agreement'], ordinanceRef: 'NKHD Mobile Food' },

  { question: 'How do I start a brewery in Kentucky?', category: 'brewery', answer: 'Kentucky is bourbon country and brewery-friendly! Need: TTB Brewer\'s Notice (federal, free, 90-120 days), Kentucky Microbrewery License ($500/year for under 25,000 barrels). Can have taproom and sell for off-premises consumption. Industrial or commercial zoning required. Budget 6+ months for all permits.', relatedPermits: ['microbrewery', 'ttb_brewers_notice'], ordinanceRef: 'KRS 243.157' },

  // HEALTHCARE
  { question: 'What do I need to open a medical office in Covington?', category: 'healthcare', answer: 'You need: Kentucky medical license for practitioners, business license, building permit for buildout. Commercial zoning required (TUMU, CMU, SO). If billing Medicaid: additional state certification. ADA compliance required. Plan review takes 2-4 weeks. HVAC and plumbing permits likely needed.', relatedPermits: ['medical_office'], ordinanceRef: 'KRS 216B' },

  { question: 'How do I open a pharmacy in Kentucky?', category: 'pharmacy', answer: 'Apply to Kentucky Board of Pharmacy. Need: pharmacist-in-charge with KY license, DEA registration, state controlled substance license. Retail pharmacy fee is $350. Must pass inspection. Location must be in commercial zone. Typical timeline is 30-45 days after application complete.', relatedPermits: ['pharmacy_retail'], ordinanceRef: 'KRS 315' },

  // CHILDCARE
  { question: 'How do I start a daycare in Covington?', category: 'childcare', answer: 'Depends on size: Type I (4-6 kids, $25), Type II (7-12 kids, $50), or Child Care Center (13+, $100). Apply to Kentucky Cabinet for Health and Family Services. Need background checks, CPR/First Aid training, fire inspection, and health inspection. Home daycares allowed in residential zones.', relatedPermits: ['childcare_type1', 'childcare_type2', 'childcare_center'], ordinanceRef: '922 KAR 2:090' },

  { question: 'Can I run a home daycare in Covington?', category: 'childcare', answer: 'Yes! Type I Family Child Care allows 4-6 children in your home ($25 license). Type II allows 7-12 children ($50). Need fire inspection, health inspection, background checks, and training. Certified family care (1-3 children) has minimal requirements if accepting CCAP subsidies.', relatedPermits: ['childcare_type1', 'childcare_type2', 'childcare_certified'], ordinanceRef: '922 KAR 2:100' },

  // BEAUTY
  { question: 'What license do I need for a salon in Kentucky?', category: 'beauty', answer: 'Apply to Kentucky Board of Hairdressers and Cosmetologists. Salon license is $50 plus individual practitioner licenses. Must have proper sanitation, ventilation, and equipment. Need business license and building permit for buildout. Commercial zoning required.', relatedPermits: ['beauty_salon', 'barbershop', 'nail_salon'], ordinanceRef: 'KRS 317B' },

  { question: 'Can I open a tattoo shop in Covington?', category: 'tattoo', answer: 'Yes, apply to Northern Kentucky Health Department ($100). Must meet strict sanitation requirements including autoclave sterilization, single-use needles, and proper waste disposal. Commercial zoning only - not allowed near residential. Artists need individual registration. Annual inspections required.', relatedPermits: ['tattoo_studio', 'piercing_studio'], ordinanceRef: 'NKHD Body Art' },

  // AUTO
  { question: 'What permits do I need for an auto repair shop?', category: 'auto', answer: 'Need Covington business license, building permit for any buildout, and proper zoning (AUC, CMU, or LI zones). If storing vehicles outside, may need screening. Environmental compliance for waste oil, fluids, and batteries. Fire dept approval for paint booths if doing body work.', relatedPermits: ['auto_repair', 'auto_body_shop'], ordinanceRef: 'COV 158' },

  { question: 'How do I open a used car lot in Covington?', category: 'auto', answer: 'Need Kentucky Motor Vehicle Dealer License from Transportation Cabinet ($300), surety bond, business license, and proper zoning (AUC or CMU). Lot must have paved surface, adequate lighting, and office space. Cannot be in residential zones. Display limit may apply.', relatedPermits: ['auto_dealer_used'], ordinanceRef: 'KRS 190' },

  // RELIGIOUS
  { question: 'Do churches need permits in Covington?', category: 'religious', answer: 'Churches are allowed in all zones under federal law (RLUIPA). No license fee for religious organizations. However, you still need building permits for construction/renovation, fire inspection for occupancy, and must meet ADA accessibility. Parking requirements may be reduced for religious use.', relatedPermits: ['church', 'mosque', 'synagogue'], ordinanceRef: 'COV 158, RLUIPA' },

  // ENTERTAINMENT
  { question: 'How do I open an event venue in Covington?', category: 'entertainment', answer: 'Need business license ($300), building permit for buildout, fire inspection for occupancy load, and commercial zoning. If serving alcohol: Kentucky ABC license. If catering food: food service license. Parking requirements depend on capacity. Sound insulation may be needed near residential.', relatedPermits: ['event_venue', 'banquet_hall', 'liquor_nq2'], ordinanceRef: 'COV 158' },

  { question: 'What do I need to open a bar or nightclub?', category: 'nightclub', answer: 'Need Kentucky ABC NQ3 license ($2,500), Covington business license, building permit, fire inspection. Downtown zones (DTC, DTR) or TUMU required. Security plan needed for capacity over 200. EDT license ($1,000) for extended hours until 4am. Live entertainment may require additional permit.', relatedPermits: ['liquor_nq3', 'nightclub', 'liquor_edt'], ordinanceRef: 'KRS 243.070, COV 158' },

  { question: 'How do I get a permit for a special event?', category: 'events', answer: 'Apply to Covington 30+ days in advance ($100-200). Need event plan including setup, security, parking, and cleanup. If serving food: temporary food permit from NKHD. If serving alcohol: Kentucky ABC temporary license ($50). Street closures require additional approval from Public Works.', relatedPermits: ['special_event', 'temp_food_event', 'liquor_temporary'], ordinanceRef: 'COV Special Events' },

  // FITNESS
  { question: 'What permits do I need for a gym in Covington?', category: 'fitness', answer: 'Need business license ($200), building permit for buildout, and commercial zoning. If shower facilities: plumbing permit. Adequate ventilation required. No special fitness license needed. Pool/spa requires NKHD permit. Occupancy load determines parking and exit requirements.', relatedPermits: ['fitness_center', 'yoga_studio'], ordinanceRef: 'COV 158' },

  // PET
  { question: 'Can I open a dog daycare in Covington?', category: 'pet', answer: 'Yes, need business license ($150), building permit for buildout, and commercial zoning. Noise mitigation may be required. Must comply with animal welfare standards. Boarding requires kennel license from Kenton County Animal Services. Cannot be in residential zones except rural (RR).', relatedPermits: ['pet_daycare', 'pet_boarding'], ordinanceRef: 'COV 91' },
];

// ============================================================================
// BUILDING CODE CHUNKS
// ============================================================================

const BUILDING_CODE_CHUNKS = [
  // FOOD SERVICE
  { codeType: 'state', section: 'NKHD 3-1', title: 'Food License Required', content: 'All food service operations must obtain a license from Northern Kentucky Health Department before opening. Licenses are risk-based: Risk Level 1 (prepackaged), Risk Level 2 (limited prep), Risk Level 3 (full cooking), Risk Level 4 (high-risk operations).' },
  { codeType: 'state', section: 'NKHD 4-1', title: 'Kitchen Requirements', content: 'Commercial kitchens must have: three-compartment sink, handwashing stations, commercial refrigeration (41°F or below), NSF-certified surfaces, Type I hood over cooking equipment with fire suppression, and adequate ventilation.' },

  // LIQUOR - KENTUCKY
  { codeType: 'state', section: 'KRS 243.020', title: 'ABC License Required', content: 'No person shall manufacture, sell, purchase, transport, or possess alcoholic beverages in Kentucky without appropriate license from the Department of Alcoholic Beverage Control.' },
  { codeType: 'state', section: 'KRS 243.070', title: 'Retail Drink License', content: 'NQ licenses authorize sale of all alcoholic beverages for consumption on premises. NQ2 requires 50%+ food sales. NQ3 allows bar operation without food requirement. EDT license extends hours until 4am in qualifying locations.' },
  { codeType: 'state', section: 'KRS 244.080', title: 'Distance Requirements', content: 'No retail license shall be issued for premises within 200 feet of any school, church, or hospital. Measurement is from door to door by shortest route.' },

  // CHILDCARE - KENTUCKY
  { codeType: 'state', section: '922 KAR 2:090', title: 'Child Care Center Requirements', content: 'Child care centers (13+ children) must be licensed by CHFS. Requirements include: background checks, staff-child ratios, training hours, health and safety standards, fire inspection, and health inspection.' },
  { codeType: 'state', section: '922 KAR 2:100', title: 'Family Child Care Homes', content: 'Type I homes (4-6 children) and Type II homes (7-12 children) must be licensed. Home must pass fire and health inspection. Caregiver must complete orientation training and background check.' },

  // HEALTHCARE - KENTUCKY
  { codeType: 'state', section: 'KRS 216B.015', title: 'Health Facility Licensure', content: 'All health facilities must be licensed by the Cabinet for Health and Family Services. Facilities include hospitals, nursing homes, ambulatory surgical centers, and other health service providers.' },

  // BEAUTY - KENTUCKY
  { codeType: 'state', section: 'KRS 317B.020', title: 'Cosmetology License', content: 'No person shall practice cosmetology, barbering, nail technology, or esthetics without a license from the Kentucky Board of Hairdressers and Cosmetologists. Shops and salons must also be licensed.' },

  // AUTO - KENTUCKY
  { codeType: 'state', section: 'KRS 190.010', title: 'Motor Vehicle Dealer License', content: 'No person shall engage in the business of buying, selling, or exchanging motor vehicles without a dealer license from the Transportation Cabinet. License requires bond, place of business, and compliance with consumer protection laws.' },

  // ENTERTAINMENT
  { codeType: 'local', section: 'COV 113', title: 'Adult Entertainment', content: 'Adult entertainment establishments are restricted to GI (General Industrial) zones only and must be at least 1,000 feet from any residential zone, school, church, park, or other adult establishment.' },

  // COTTAGE FOOD - KENTUCKY
  { codeType: 'state', section: 'KRS 217.136', title: 'Cottage Food Production', content: 'Home-based food producers may sell directly to consumers without a license if sales do not exceed $60,000 annually. Allowed products include baked goods, candy, jams, and other non-hazardous foods. Labels must state "Made in a Home Kitchen Not Inspected by the Kentucky Department for Public Health."' },
];

// ============================================================================
// SEED FUNCTION
// ============================================================================

// All Kentucky jurisdictions in the Cincinnati metro area
const KY_JURISDICTIONS = [
  'covington-ky',
  'newport-ky',
  'florence-ky',
  'erlanger-ky',
  'fort-thomas-ky',
  'fort-mitchell-ky',
  'independence-ky',
  'cold-spring-ky',
  'highland-heights-ky',
  'bellevue-ky',
  'dayton-ky',
  'elsmere-ky',
  'edgewood-ky',
  'crestview-hills-ky',
  'villa-hills-ky',
  'lakeside-park-ky',
  'taylor-mill-ky',
  'southgate-ky',
  'alexandria-ky',
  'union-ky',
  'walton-ky',
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
      // Silent error handling for duplicates
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

  // Update jurisdiction status and completeness
  await prisma.jurisdiction.update({
    where: { id: jurisdiction.id },
    data: {
      status: 'live',
      dataCompleteness: 90,
    },
  });

  console.log(`    ✓ ${permitCount} permits, ${codeCount} codes, ${questionCount} questions`);

  return { permits: permitCount, codes: codeCount, questions: questionCount, skipped: false };
}

async function seedAllKentuckyJurisdictions() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  Kentucky Industries Seed Data - ALL JURISDICTIONS             ║
║                                                                ║
║  Seeding comprehensive industry data for ALL Kentucky cities   ║
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

  for (const jurisdictionId of KY_JURISDICTIONS) {
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
Kentucky Industries Seed Complete!
${'='.repeat(60)}

Summary:
  - Jurisdictions seeded: ${seeded}
  - Jurisdictions skipped: ${skipped}
  - Total Permit Requirements: ${totalPermits}
  - Total Building Code Chunks: ${totalCodes}
  - Total Common Questions: ${totalQuestions}

Industries Now Covered in ALL Kentucky metros:
  ✓ Food & Restaurant (including liquor, KY ABC licenses)
  ✓ Healthcare (medical, pharmacy, labs)
  ✓ Childcare & Education (922 KAR regulations)
  ✓ Beauty & Salon (including tattoo)
  ✓ Pet Industry
  ✓ Fitness & Recreation
  ✓ Auto Industry
  ✓ Religious Organizations
  ✓ Entertainment & Events
`);
}

seedAllKentuckyJurisdictions()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
