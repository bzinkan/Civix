import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Cincinnati Zoning Districts (from Cincinnati Zoning Code Chapter 1401-1421)
const ZONING_DISTRICTS = [
  // SINGLE FAMILY RESIDENTIAL
  { code: 'SF-20', name: 'Single Family 20', category: 'residential', description: 'Large lot single-family, 20,000 sq ft minimum', minLotSqft: 20000, maxLotCoverage: 0.25, maxHeightFt: 35, maxStories: 2.5, frontSetbackFt: 40, sideSetbackFt: 15, rearSetbackFt: 40, maxFar: null, allowedUses: ['single_family_home', 'home_occupation', 'accessory_dwelling_unit'] },
  { code: 'SF-10', name: 'Single Family 10', category: 'residential', description: 'Single-family, 10,000 sq ft minimum', minLotSqft: 10000, maxLotCoverage: 0.35, maxHeightFt: 35, maxStories: 2.5, frontSetbackFt: 30, sideSetbackFt: 8, rearSetbackFt: 30, maxFar: null, allowedUses: ['single_family_home', 'home_occupation', 'accessory_dwelling_unit'] },
  { code: 'SF-6', name: 'Single Family 6', category: 'residential', description: 'Single-family, 6,000 sq ft minimum', minLotSqft: 6000, maxLotCoverage: 0.40, maxHeightFt: 35, maxStories: 2.5, frontSetbackFt: 25, sideSetbackFt: 5, rearSetbackFt: 25, maxFar: null, allowedUses: ['single_family_home', 'home_occupation', 'accessory_dwelling_unit'] },
  { code: 'SF-4', name: 'Single Family 4', category: 'residential', description: 'Urban single-family, 4,000 sq ft minimum', minLotSqft: 4000, maxLotCoverage: 0.45, maxHeightFt: 35, maxStories: 2.5, frontSetbackFt: 20, sideSetbackFt: 3, rearSetbackFt: 25, maxFar: null, allowedUses: ['single_family_home', 'home_occupation', 'accessory_dwelling_unit', 'two_family_conversion'] },
  { code: 'SF-2', name: 'Single Family 2', category: 'residential', description: 'High-density single-family, 2,000 sq ft minimum', minLotSqft: 2000, maxLotCoverage: 0.50, maxHeightFt: 35, maxStories: 3, frontSetbackFt: 15, sideSetbackFt: 3, rearSetbackFt: 20, maxFar: null, allowedUses: ['single_family_home', 'home_occupation', 'accessory_dwelling_unit', 'two_family'] },

  // With modifiers
  { code: 'SF-4-T', name: 'Single Family 4 - Traditional', category: 'residential', description: 'SF-4 with traditional neighborhood design standards', minLotSqft: 4000, maxLotCoverage: 0.45, maxHeightFt: 35, maxStories: 2.5, frontSetbackFt: 20, sideSetbackFt: 3, rearSetbackFt: 25, maxFar: null, allowedUses: ['single_family_home', 'home_occupation', 'accessory_dwelling_unit'] },
  { code: 'SF-4-MH', name: 'Single Family 4 - Mt. Healthy', category: 'residential', description: 'SF-4 with Mt. Healthy overlay standards', minLotSqft: 4000, maxLotCoverage: 0.45, maxHeightFt: 35, maxStories: 2.5, frontSetbackFt: 20, sideSetbackFt: 3, rearSetbackFt: 25, maxFar: null, allowedUses: ['single_family_home', 'home_occupation', 'accessory_dwelling_unit'] },
  { code: 'SF-6-T', name: 'Single Family 6 - Traditional', category: 'residential', description: 'SF-6 with traditional neighborhood design standards', minLotSqft: 6000, maxLotCoverage: 0.40, maxHeightFt: 35, maxStories: 2.5, frontSetbackFt: 25, sideSetbackFt: 5, rearSetbackFt: 25, maxFar: null, allowedUses: ['single_family_home', 'home_occupation', 'accessory_dwelling_unit'] },
  { code: 'SF-6-MH', name: 'Single Family 6 - Mt. Healthy', category: 'residential', description: 'SF-6 with Mt. Healthy overlay standards', minLotSqft: 6000, maxLotCoverage: 0.40, maxHeightFt: 35, maxStories: 2.5, frontSetbackFt: 25, sideSetbackFt: 5, rearSetbackFt: 25, maxFar: null, allowedUses: ['single_family_home', 'home_occupation', 'accessory_dwelling_unit'] },

  // MULTI-FAMILY RESIDENTIAL
  { code: 'RM-0.7', name: 'Residential Multi 0.7', category: 'residential', description: 'Low-density multi-family, 0.7 FAR', minLotSqft: 6000, maxLotCoverage: 0.40, maxHeightFt: 35, maxStories: 3, frontSetbackFt: 25, sideSetbackFt: 8, rearSetbackFt: 25, maxFar: 0.7, allowedUses: ['single_family_home', 'two_family', 'townhouse', 'apartment_3_4_units'] },
  { code: 'RM-1.2', name: 'Residential Multi 1.2', category: 'residential', description: 'Medium-density multi-family, 1.2 FAR', minLotSqft: 5000, maxLotCoverage: 0.50, maxHeightFt: 45, maxStories: 4, frontSetbackFt: 20, sideSetbackFt: 5, rearSetbackFt: 20, maxFar: 1.2, allowedUses: ['single_family_home', 'two_family', 'townhouse', 'apartment', 'senior_housing'] },
  { code: 'RM-2.0', name: 'Residential Multi 2.0', category: 'residential', description: 'High-density multi-family, 2.0 FAR', minLotSqft: 4000, maxLotCoverage: 0.60, maxHeightFt: 65, maxStories: 6, frontSetbackFt: 15, sideSetbackFt: 5, rearSetbackFt: 15, maxFar: 2.0, allowedUses: ['apartment', 'senior_housing', 'mixed_use_residential'] },
  { code: 'RM-1.2-T', name: 'Residential Multi 1.2 - Traditional', category: 'residential', description: 'RM-1.2 with traditional neighborhood design', minLotSqft: 5000, maxLotCoverage: 0.50, maxHeightFt: 45, maxStories: 4, frontSetbackFt: 20, sideSetbackFt: 5, rearSetbackFt: 20, maxFar: 1.2, allowedUses: ['single_family_home', 'two_family', 'townhouse', 'apartment'] },
  { code: 'RM-1.2-MH', name: 'Residential Multi 1.2 - Mt. Healthy', category: 'residential', description: 'RM-1.2 with Mt. Healthy overlay', minLotSqft: 5000, maxLotCoverage: 0.50, maxHeightFt: 45, maxStories: 4, frontSetbackFt: 20, sideSetbackFt: 5, rearSetbackFt: 20, maxFar: 1.2, allowedUses: ['single_family_home', 'two_family', 'townhouse', 'apartment'] },
  { code: 'RM-2.0-T', name: 'Residential Multi 2.0 - Traditional', category: 'residential', description: 'RM-2.0 with traditional neighborhood design', minLotSqft: 4000, maxLotCoverage: 0.60, maxHeightFt: 65, maxStories: 6, frontSetbackFt: 15, sideSetbackFt: 5, rearSetbackFt: 15, maxFar: 2.0, allowedUses: ['apartment', 'senior_housing', 'mixed_use_residential'] },
  { code: 'RMX', name: 'Residential Mixed', category: 'residential', description: 'Mixed residential types encouraged', minLotSqft: 3000, maxLotCoverage: 0.55, maxHeightFt: 55, maxStories: 5, frontSetbackFt: 10, sideSetbackFt: 5, rearSetbackFt: 15, maxFar: 1.5, allowedUses: ['single_family_home', 'two_family', 'townhouse', 'apartment', 'live_work'] },
  { code: 'RMX-T', name: 'Residential Mixed - Traditional', category: 'residential', description: 'RMX with traditional neighborhood design', minLotSqft: 3000, maxLotCoverage: 0.55, maxHeightFt: 55, maxStories: 5, frontSetbackFt: 10, sideSetbackFt: 5, rearSetbackFt: 15, maxFar: 1.5, allowedUses: ['single_family_home', 'two_family', 'townhouse', 'apartment', 'live_work'] },
  { code: 'RMX-MH', name: 'Residential Mixed - Mt. Healthy', category: 'residential', description: 'RMX with Mt. Healthy overlay', minLotSqft: 3000, maxLotCoverage: 0.55, maxHeightFt: 55, maxStories: 5, frontSetbackFt: 10, sideSetbackFt: 5, rearSetbackFt: 15, maxFar: 1.5, allowedUses: ['single_family_home', 'two_family', 'townhouse', 'apartment', 'live_work'] },

  // COMMERCIAL - NEIGHBORHOOD
  { code: 'CN-P', name: 'Commercial Neighborhood Pedestrian', category: 'commercial', description: 'Walkable neighborhood commercial', minLotSqft: 2000, maxLotCoverage: 0.80, maxHeightFt: 45, maxStories: 4, frontSetbackFt: 0, sideSetbackFt: 0, rearSetbackFt: 10, maxFar: 2.0, allowedUses: ['retail', 'restaurant', 'office', 'personal_service', 'residential_upper_floors'] },
  { code: 'CN-M', name: 'Commercial Neighborhood Mixed', category: 'commercial', description: 'Auto-accessible neighborhood commercial', minLotSqft: 5000, maxLotCoverage: 0.60, maxHeightFt: 45, maxStories: 3, frontSetbackFt: 10, sideSetbackFt: 5, rearSetbackFt: 15, maxFar: 1.5, allowedUses: ['retail', 'restaurant', 'office', 'personal_service', 'gas_station', 'drive_through'] },

  // COMMERCIAL - COMMUNITY
  { code: 'CC-P', name: 'Commercial Community Pedestrian', category: 'commercial', description: 'Urban commercial corridor, pedestrian', minLotSqft: 2000, maxLotCoverage: 0.85, maxHeightFt: 65, maxStories: 6, frontSetbackFt: 0, sideSetbackFt: 0, rearSetbackFt: 10, maxFar: 3.0, allowedUses: ['retail', 'restaurant', 'office', 'entertainment', 'hotel', 'residential_upper_floors'] },
  { code: 'CC-M', name: 'Commercial Community Mixed', category: 'commercial', description: 'Auto-oriented commercial', minLotSqft: 10000, maxLotCoverage: 0.50, maxHeightFt: 55, maxStories: 4, frontSetbackFt: 20, sideSetbackFt: 10, rearSetbackFt: 20, maxFar: 2.0, allowedUses: ['retail', 'restaurant', 'office', 'entertainment', 'big_box_retail', 'auto_service'] },
  { code: 'CC-A', name: 'Commercial Community Auto', category: 'commercial', description: 'Auto-centric commercial', minLotSqft: 15000, maxLotCoverage: 0.40, maxHeightFt: 45, maxStories: 3, frontSetbackFt: 30, sideSetbackFt: 15, rearSetbackFt: 25, maxFar: 1.0, allowedUses: ['big_box_retail', 'auto_dealership', 'auto_service', 'warehouse_retail'] },

  // OFFICE
  { code: 'OL', name: 'Office Limited', category: 'commercial', description: 'Office and limited retail', minLotSqft: 8000, maxLotCoverage: 0.50, maxHeightFt: 45, maxStories: 4, frontSetbackFt: 25, sideSetbackFt: 10, rearSetbackFt: 25, maxFar: 1.5, allowedUses: ['office', 'medical_office', 'bank', 'personal_service'] },

  // DOWNTOWN DEVELOPMENT
  { code: 'DD-A', name: 'Downtown Development A', category: 'downtown', description: 'Downtown core, highest density', minLotSqft: 0, maxLotCoverage: 1.00, maxHeightFt: null, maxStories: null, frontSetbackFt: 0, sideSetbackFt: 0, rearSetbackFt: 0, maxFar: 12.0, allowedUses: ['office', 'retail', 'restaurant', 'hotel', 'residential', 'entertainment', 'parking_structure'] },
  { code: 'DD-C', name: 'Downtown Development C', category: 'downtown', description: 'Downtown commercial fringe', minLotSqft: 0, maxLotCoverage: 0.90, maxHeightFt: 200, maxStories: 20, frontSetbackFt: 0, sideSetbackFt: 0, rearSetbackFt: 0, maxFar: 8.0, allowedUses: ['office', 'retail', 'restaurant', 'hotel', 'residential', 'entertainment'] },

  // MANUFACTURING/INDUSTRIAL
  { code: 'MG', name: 'Manufacturing General', category: 'industrial', description: 'General manufacturing and industrial', minLotSqft: 10000, maxLotCoverage: 0.60, maxHeightFt: 65, maxStories: 5, frontSetbackFt: 25, sideSetbackFt: 10, rearSetbackFt: 25, maxFar: 2.0, allowedUses: ['manufacturing', 'warehouse', 'distribution', 'light_industrial', 'office'] },
  { code: 'ML', name: 'Manufacturing Limited', category: 'industrial', description: 'Light manufacturing, flex space', minLotSqft: 8000, maxLotCoverage: 0.55, maxHeightFt: 55, maxStories: 4, frontSetbackFt: 20, sideSetbackFt: 10, rearSetbackFt: 20, maxFar: 1.5, allowedUses: ['light_industrial', 'warehouse', 'flex_space', 'office', 'maker_space'] },

  // SPECIAL DISTRICTS
  { code: 'PR', name: 'Parks and Recreation', category: 'special', description: 'Public parks and recreation', minLotSqft: 0, maxLotCoverage: 0.10, maxHeightFt: 35, maxStories: 2, frontSetbackFt: 50, sideSetbackFt: 25, rearSetbackFt: 50, maxFar: 0.1, allowedUses: ['park', 'recreation_facility', 'community_center'] },
  { code: 'PF', name: 'Public Facilities', category: 'special', description: 'Government and institutional', minLotSqft: 0, maxLotCoverage: 0.50, maxHeightFt: 65, maxStories: 5, frontSetbackFt: 25, sideSetbackFt: 15, rearSetbackFt: 25, maxFar: 2.0, allowedUses: ['government', 'school', 'hospital', 'religious', 'utility'] },
  { code: 'PD', name: 'Planned Development', category: 'special', description: 'Planned unit development with negotiated standards', minLotSqft: null, maxLotCoverage: null, maxHeightFt: null, maxStories: null, frontSetbackFt: null, sideSetbackFt: null, rearSetbackFt: null, maxFar: null, allowedUses: ['varies_by_approval'] },
];

// Building Permits
const PERMIT_REQUIREMENTS = [
  // RESIDENTIAL BUILDING PERMITS
  { activityType: 'deck', category: 'building', activityDescription: 'Deck construction or replacement', zonesRequired: ['*'], zonesProhibited: [], feeBase: 75.00, feePerSqft: 0.15, processingDays: 5, requiresPlans: true, requiresInspection: true, ordinanceRef: 'CMC 1101.2' },
  { activityType: 'fence', category: 'building', activityDescription: 'Fence installation (over 6ft or front yard)', zonesRequired: ['*'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 3, requiresPlans: false, requiresInspection: true, ordinanceRef: 'CMC 1101.2' },
  { activityType: 'shed', category: 'building', activityDescription: 'Accessory structure under 200 sq ft', zonesRequired: ['*'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 3, requiresPlans: false, requiresInspection: true, ordinanceRef: 'CMC 1101.2' },
  { activityType: 'accessory_structure', category: 'building', activityDescription: 'Accessory structure over 200 sq ft', zonesRequired: ['*'], zonesProhibited: [], feeBase: 100.00, feePerSqft: 0.20, processingDays: 7, requiresPlans: true, requiresInspection: true, ordinanceRef: 'CMC 1101.2' },
  { activityType: 'addition', category: 'building', activityDescription: 'Home addition', zonesRequired: ['*'], zonesProhibited: [], feeBase: 150.00, feePerSqft: 0.25, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'CMC 1101.2' },
  { activityType: 'basement_finish', category: 'building', activityDescription: 'Finishing basement space', zonesRequired: ['*'], zonesProhibited: [], feeBase: 100.00, feePerSqft: 0.10, processingDays: 7, requiresPlans: true, requiresInspection: true, ordinanceRef: 'CMC 1101.2' },
  { activityType: 'garage', category: 'building', activityDescription: 'Garage construction', zonesRequired: ['*'], zonesProhibited: [], feeBase: 125.00, feePerSqft: 0.20, processingDays: 10, requiresPlans: true, requiresInspection: true, ordinanceRef: 'CMC 1101.2' },
  { activityType: 'pool', category: 'building', activityDescription: 'Swimming pool installation', zonesRequired: ['*'], zonesProhibited: [], feeBase: 150.00, feePerSqft: null, processingDays: 10, requiresPlans: true, requiresInspection: true, ordinanceRef: 'CMC 1101.2' },
  { activityType: 'demolition', category: 'building', activityDescription: 'Structure demolition', zonesRequired: ['*'], zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'CMC 1105.1' },
  { activityType: 'new_construction_residential', category: 'building', activityDescription: 'New residential construction', zonesRequired: ['*'], zonesProhibited: ['MG', 'ML'], feeBase: 500.00, feePerSqft: 0.30, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'CMC 1101.2' },

  // TRADE PERMITS
  { activityType: 'electrical', category: 'trade', activityDescription: 'Electrical work', zonesRequired: ['*'], zonesProhibited: [], feeBase: 60.00, feePerSqft: null, processingDays: 3, requiresPlans: false, requiresInspection: true, ordinanceRef: 'CMC 1301' },
  { activityType: 'plumbing', category: 'trade', activityDescription: 'Plumbing work', zonesRequired: ['*'], zonesProhibited: [], feeBase: 60.00, feePerSqft: null, processingDays: 3, requiresPlans: false, requiresInspection: true, ordinanceRef: 'CMC 1401' },
  { activityType: 'hvac', category: 'trade', activityDescription: 'HVAC installation/replacement', zonesRequired: ['*'], zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 3, requiresPlans: false, requiresInspection: true, ordinanceRef: 'CMC 1501' },
  { activityType: 'roofing', category: 'trade', activityDescription: 'Roof replacement', zonesRequired: ['*'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 2, requiresPlans: false, requiresInspection: true, ordinanceRef: 'CMC 1101.2' },
  { activityType: 'siding', category: 'trade', activityDescription: 'Siding replacement', zonesRequired: ['*'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 2, requiresPlans: false, requiresInspection: false, ordinanceRef: 'CMC 1101.2' },

  // COMMERCIAL PERMITS
  { activityType: 'tenant_buildout', category: 'commercial', activityDescription: 'Commercial tenant improvement', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C', 'OL'], zonesProhibited: [], feeBase: 200.00, feePerSqft: 0.20, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'CMC 1101.2' },
  { activityType: 'new_construction_commercial', category: 'commercial', activityDescription: 'New commercial construction', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C', 'OL', 'MG', 'ML'], zonesProhibited: [], feeBase: 1000.00, feePerSqft: 0.35, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'CMC 1101.2' },
  { activityType: 'change_of_use', category: 'commercial', activityDescription: 'Change of occupancy/use', zonesRequired: ['*'], zonesProhibited: [], feeBase: 150.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'CMC 1101.2' },
  { activityType: 'sign', category: 'commercial', activityDescription: 'Sign installation', zonesRequired: ['*'], zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 7, requiresPlans: true, requiresInspection: true, ordinanceRef: 'CMC Chapter 1439' },

  // BUSINESS LICENSES
  { activityType: 'business_license', category: 'license', activityDescription: 'General business license', zonesRequired: ['*'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 5, requiresPlans: false, requiresInspection: false, ordinanceRef: 'CMC Chapter 857' },
  { activityType: 'food_service', category: 'license', activityDescription: 'Food service establishment', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'CMC Chapter 859' },
  { activityType: 'liquor_permit', category: 'license', activityDescription: 'Liquor permit (local approval)', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 500.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: false, ordinanceRef: 'CMC Chapter 863' },
  { activityType: 'home_occupation', category: 'license', activityDescription: 'Home-based business', zonesRequired: ['SF-*', 'RM-*', 'RMX'], zonesProhibited: [], feeBase: 25.00, feePerSqft: null, processingDays: 7, requiresPlans: false, requiresInspection: false, ordinanceRef: 'CMC 1419-19' },
  { activityType: 'short_term_rental', category: 'license', activityDescription: 'Short-term rental (Airbnb)', zonesRequired: ['*'], zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: true, ordinanceRef: 'CMC Chapter 856' },
  { activityType: 'rental_registration', category: 'license', activityDescription: 'Rental property registration', zonesRequired: ['*'], zonesProhibited: [], feeBase: 60.00, feePerSqft: null, processingDays: 7, requiresPlans: false, requiresInspection: true, ordinanceRef: 'CMC Chapter 1117' },
  { activityType: 'contractor_registration', category: 'license', activityDescription: 'Contractor registration', zonesRequired: ['*'], zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 3, requiresPlans: false, requiresInspection: false, ordinanceRef: 'CMC Chapter 855' },

  // SPECIAL PERMITS
  { activityType: 'driveway_apron', category: 'public', activityDescription: 'Driveway apron in right-of-way', zonesRequired: ['*'], zonesProhibited: [], feeBase: 150.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'CMC Chapter 723' },
  { activityType: 'sidewalk_cafe', category: 'public', activityDescription: 'Outdoor dining on sidewalk', zonesRequired: ['CN-P', 'CC-P', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: false, ordinanceRef: 'CMC Chapter 719' },
  { activityType: 'special_event', category: 'public', activityDescription: 'Special event permit', zonesRequired: ['*'], zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 30, requiresPlans: false, requiresInspection: false, ordinanceRef: 'CMC Chapter 859' },
];

// Permit Exemptions
const PERMIT_EXEMPTIONS = [
  { activity: 'fence_under_6ft', description: 'Fence 6 feet or under in rear/side yard', maxValue: null, maxSqft: null, conditions: 'Rear and side yards only', ordinanceRef: 'CMC 1101.2.1' },
  { activity: 'fence_under_4ft', description: 'Fence 4 feet or under in front yard', maxValue: null, maxSqft: null, conditions: 'Front yard fences', ordinanceRef: 'CMC 1101.2.1' },
  { activity: 'shed_under_120sqft', description: 'Accessory structure under 120 sq ft, one story', maxValue: null, maxSqft: 120, conditions: 'One story, no plumbing or electrical', ordinanceRef: 'CMC 1101.2.1' },
  { activity: 'interior_paint', description: 'Interior painting and wallpapering', maxValue: null, maxSqft: null, conditions: null, ordinanceRef: 'CMC 1101.2.1' },
  { activity: 'flooring', description: 'Flooring replacement (no structural changes)', maxValue: null, maxSqft: null, conditions: 'No subfloor structural modifications', ordinanceRef: 'CMC 1101.2.1' },
  { activity: 'cabinets', description: 'Cabinet replacement (no plumbing/electrical)', maxValue: null, maxSqft: null, conditions: 'No plumbing or electrical changes', ordinanceRef: 'CMC 1101.2.1' },
  { activity: 'minor_repair', description: 'Minor repairs under $2,500', maxValue: 2500, maxSqft: null, conditions: 'Non-structural work only', ordinanceRef: 'CMC 1101.2.1' },
  { activity: 'landscaping', description: 'Landscaping and gardening', maxValue: null, maxSqft: null, conditions: 'No grading changes over 4 inches', ordinanceRef: 'CMC 1101.2.1' },
  { activity: 'retaining_wall_under_4ft', description: 'Retaining wall under 4 feet', maxValue: null, maxSqft: null, conditions: 'No surcharge loads', ordinanceRef: 'CMC 1101.2.1' },
  { activity: 'window_replacement', description: 'Window replacement (same size opening)', maxValue: null, maxSqft: null, conditions: 'Same size opening, no structural changes', ordinanceRef: 'CMC 1101.2.1' },
  { activity: 'door_replacement', description: 'Door replacement (same size opening)', maxValue: null, maxSqft: null, conditions: 'Same size opening, no structural changes', ordinanceRef: 'CMC 1101.2.1' },
  { activity: 'gutter', description: 'Gutter installation/replacement', maxValue: null, maxSqft: null, conditions: null, ordinanceRef: 'CMC 1101.2.1' },
  { activity: 'appliance_replacement', description: 'Like-for-like appliance replacement', maxValue: null, maxSqft: null, conditions: 'No new circuits or gas lines', ordinanceRef: 'CMC 1101.2.1' },
  { activity: 'deck_under_30in', description: 'Deck less than 30 inches above grade', maxValue: null, maxSqft: 200, conditions: 'Under 200 sq ft, no roof', ordinanceRef: 'CMC 1101.2.1' },
];

// Building Code Chunks
const BUILDING_CODE_CHUNKS = [
  // GENERAL BUILDING
  { codeType: 'local', section: '1101.1', title: 'Permit Required', content: 'No person shall construct, enlarge, alter, repair, move, demolish, or change the occupancy of a building or structure without first obtaining a permit from the Building Department.' },
  { codeType: 'local', section: '1101.2.1', title: 'Work Exempt from Permit', content: 'The following work is exempt from permit requirements: (1) One-story detached accessory structures not exceeding 120 square feet. (2) Fences not over 6 feet high in rear/side yards, 4 feet in front yards. (3) Retaining walls not over 4 feet. (4) Painting, papering, tiling, carpeting, countertops, and similar finish work. (5) Temporary structures for special events. (6) Prefabricated swimming pools less than 24 inches deep.' },

  // SETBACKS & YARDS
  { codeType: 'local', section: '1419-05', title: 'Front Yard Requirements', content: 'Front yards shall be measured from the street right-of-way line to the nearest point of the building. Porches, stoops, and steps may project up to 6 feet into the required front yard. Eaves and gutters may project up to 2 feet.' },
  { codeType: 'local', section: '1419-07', title: 'Side Yard Requirements', content: 'Side yards shall be provided on each side of every building. Air conditioning units, generators, and similar mechanical equipment may be located in side yards but must be setback at least 3 feet from property line.' },
  { codeType: 'local', section: '1419-09', title: 'Rear Yard Requirements', content: 'Rear yards shall be measured from the rear lot line. Accessory structures may be located in rear yards subject to setback requirements. Decks may project up to 10 feet into required rear yard.' },

  // HEIGHT & LOT COVERAGE
  { codeType: 'local', section: '1419-11', title: 'Building Height Measurement', content: 'Building height shall be measured from the average finished grade at the front of the building to the highest point of the roof. Half-stories under a sloped roof count as half a story if the floor area with 5+ foot ceiling height is less than 50% of the floor below.' },
  { codeType: 'local', section: '1419-13', title: 'Lot Coverage Calculation', content: 'Lot coverage includes all buildings and structures with roofs, including garages, carports, and covered porches. Uncovered decks, patios, driveways, and swimming pools are not included in lot coverage calculations.' },

  // DECKS
  { codeType: 'IRC', section: 'R507.1', title: 'Decks General', content: 'Decks shall be constructed in accordance with this section. Deck footings shall extend below frost line (32 inches in Cincinnati). Ledger boards shall be positively attached to the house structure.' },
  { codeType: 'IRC', section: 'R507.2', title: 'Deck Joist Span', content: 'Maximum joist spans for common deck lumber: 2x6 SPF at 16" OC = 9ft 6in, 2x8 SPF at 16" OC = 12ft 6in, 2x10 SPF at 16" OC = 16ft. Cantilevers limited to 1/4 of the allowable joist span.' },
  { codeType: 'IRC', section: 'R507.4', title: 'Deck Posts', content: 'Wood deck posts shall be a minimum 4x4 nominal. Posts over 8 feet require 6x6 minimum. Posts shall be positively connected to footing and beam.' },
  { codeType: 'IRC', section: 'R312.1', title: 'Guards Required', content: 'Guards shall be provided on open sides of walking surfaces including decks that are more than 30 inches above grade. Guards shall not be less than 36 inches in height.' },

  // FENCES
  { codeType: 'local', section: '1439-37', title: 'Fence Height Limits', content: 'Front yard: Maximum 4 feet. Side and rear yards: Maximum 6 feet. Corner lots: Sight triangle must maintain visibility (no fence over 30 inches within 25 feet of intersection).' },
  { codeType: 'local', section: '1439-39', title: 'Fence Materials', content: 'Permitted fence materials include wood, vinyl, aluminum, wrought iron, chain link, and masonry. Barbed wire and razor wire prohibited in residential districts. Electric fences require permit and must meet safety standards.' },

  // ACCESSORY STRUCTURES
  { codeType: 'local', section: '1419-17', title: 'Accessory Structures', content: 'Accessory structures shall be located in rear yards only, except garages may have driveway access from side yard. Maximum height 15 feet or height of principal building, whichever is less. Must be setback minimum 3 feet from property lines.' },
  { codeType: 'local', section: '1419-17.1', title: 'ADU Requirements', content: 'Accessory Dwelling Units permitted in SF-4, SF-2, and RM districts. Maximum 800 sq ft or 50% of principal dwelling. Owner must occupy either principal or accessory unit. One ADU per lot maximum.' },

  // HOME OCCUPATION
  { codeType: 'local', section: '1419-19', title: 'Home Occupation Standards', content: 'Home occupations permitted in residential districts subject to: (1) No exterior evidence of business. (2) No customer visits or limited to 8 per day. (3) No employees other than residents. (4) No outdoor storage. (5) No noise, odor, or vibration detectable at property line. (6) Maximum 25% of dwelling used for business.' },

  // SHORT TERM RENTAL
  { codeType: 'local', section: '856.03', title: 'Short Term Rental Requirements', content: 'Short-term rentals (less than 30 consecutive days) require registration. Owner must be primary resident. Maximum 2 guests per bedroom plus 2 additional. Must comply with building, fire, and health codes. $100 annual registration fee.' },

  // PARKING
  { codeType: 'local', section: '1425-07', title: 'Residential Parking Requirements', content: 'Single-family: 2 spaces (1 may be tandem). Two-family: 1.5 spaces per unit. Multi-family: 1 space per unit for first 4, 0.75 spaces per unit thereafter. ADU: 1 additional space unless within 1/4 mile of transit.' },
  { codeType: 'local', section: '1425-09', title: 'Commercial Parking Requirements', content: 'Retail: 1 space per 300 sq ft. Restaurant: 1 space per 100 sq ft dining area. Office: 1 space per 400 sq ft. Downtown (DD zones): Reduced or waived requirements.' },

  // NOISE & CONSTRUCTION HOURS
  { codeType: 'local', section: '910.03', title: 'Construction Hours', content: 'Construction work permitted: Weekdays 7am-9pm, Saturdays 9am-9pm, Sundays noon-9pm. No work before noon on Sundays without special permit. Noise limits: 65 dB daytime, 55 dB nighttime in residential areas.' },

  // HISTORIC DISTRICTS
  { codeType: 'local', section: '1435-01', title: 'Historic District Review', content: 'Properties in designated historic districts require Certificate of Appropriateness for exterior changes. Historic Conservation Board reviews applications. Changes must meet Secretary of Interior Standards for historic preservation.' },
];

// Common Questions
const COMMON_QUESTIONS = [
  { question: 'Do I need a permit to build a deck?', category: 'deck', answer: 'Yes, decks require a building permit in Cincinnati. You\'ll need to submit plans showing dimensions, height above grade, and attachment method. Fee is $75 base + $0.15 per square foot. Typical review time is 5 business days. Exception: Decks under 200 sq ft and less than 30 inches above grade may be exempt.', relatedPermits: ['deck'], ordinanceRef: 'CMC 1101.2' },
  { question: 'How tall can my fence be?', category: 'fence', answer: 'In Cincinnati: Front yard fences can be maximum 4 feet tall. Side and rear yard fences can be maximum 6 feet tall. Fences under 6 feet in rear/side yards typically don\'t need a permit. Corner lots have additional visibility requirements.', relatedPermits: ['fence'], ordinanceRef: 'CMC 1439-37' },
  { question: 'Can I build a shed without a permit?', category: 'shed', answer: 'Sheds under 120 square feet and one story do not require a permit in Cincinnati. Larger sheds require a building permit ($50 base fee). All sheds must be in the rear yard and at least 3 feet from property lines. Maximum height is 15 feet.', relatedPermits: ['shed', 'accessory_structure'], ordinanceRef: 'CMC 1101.2.1' },
  { question: 'Can I run a business from home?', category: 'home_occupation', answer: 'Yes, home occupations are permitted in residential zones with restrictions: no exterior evidence of business, limited customer visits (8/day max), no employees other than residents, no outdoor storage, and maximum 25% of home used for business. Registration costs $25 with 7-day processing.', relatedPermits: ['home_occupation'], ordinanceRef: 'CMC 1419-19' },
  { question: 'Can I rent my house on Airbnb?', category: 'str', answer: 'Yes, short-term rentals are permitted in Cincinnati but require registration ($100/year). You must be the primary resident (owner-occupied). Maximum guests: 2 per bedroom plus 2 additional. Must comply with building, fire, and health codes.', relatedPermits: ['short_term_rental'], ordinanceRef: 'CMC 856.03' },
  { question: 'What are the setback requirements?', category: 'setback', answer: 'Setbacks vary by zoning district. For example, SF-4 (common in urban areas) requires: 20 ft front, 3 ft sides, 25 ft rear. Decks may project 10 ft into rear setback. Porches may project 6 ft into front setback. Look up your specific zone for exact requirements.', relatedPermits: [], ordinanceRef: 'CMC 1419' },
  { question: 'When can construction work be done?', category: 'noise', answer: 'Construction is permitted: Weekdays 7am-9pm, Saturdays 9am-9pm, Sundays noon-9pm. No work before noon on Sundays without special permit. Noise limits: 65 dB daytime, 55 dB nighttime in residential areas.', relatedPermits: [], ordinanceRef: 'CMC 910.03' },
  { question: 'Do I need a permit to replace windows?', category: 'windows', answer: 'Window replacement in the same size opening does not require a permit. If you\'re changing the size of the opening or adding new windows, a permit is required. Historic district properties may need Historic Conservation Board approval.', relatedPermits: [], ordinanceRef: 'CMC 1101.2.1' },
  { question: 'How do I register a rental property?', category: 'rental', answer: 'All rental properties (1-3 family) in Cincinnati must be registered. Registration costs $60 per year. Properties are inspected on a rotating basis. Lead paint disclosure required for pre-1978 buildings.', relatedPermits: ['rental_registration'], ordinanceRef: 'CMC 1117' },
  { question: 'What requires a building permit?', category: 'general', answer: 'Permits required for: new construction, additions, structural changes, decks over 30" high, fences over 6ft or in front yards, sheds over 120 sq ft, electrical/plumbing/HVAC work, roofing, pools, and demolition. Exempt: interior paint, flooring, cabinets, minor repairs under $2,500.', relatedPermits: [], ordinanceRef: 'CMC 1101.2' },
  { question: 'Can I add an accessory dwelling unit (ADU)?', category: 'adu', answer: 'ADUs are permitted in SF-4, SF-2, and RM zoning districts. Maximum size is 800 sq ft or 50% of the principal dwelling. The owner must live in either the main house or ADU. One ADU per lot. Requires building permit and zoning approval.', relatedPermits: ['addition'], ordinanceRef: 'CMC 1419-17.1' },
  { question: 'Do I need approval for exterior changes in a historic district?', category: 'historic', answer: 'Yes, properties in designated historic districts require a Certificate of Appropriateness from the Historic Conservation Board for any exterior changes including paint colors, windows, doors, siding, and roofing materials. Interior changes typically don\'t require review.', relatedPermits: [], ordinanceRef: 'CMC 1435-01' },
];

async function seed() {
  console.log('Starting Cincinnati data seed...\n');

  // Get Cincinnati jurisdiction
  const jurisdiction = await prisma.jurisdiction.findFirst({
    where: { name: 'Cincinnati' },
  });

  if (!jurisdiction) {
    console.error('Cincinnati jurisdiction not found! Please create it first.');
    process.exit(1);
  }

  console.log(`Found jurisdiction: ${jurisdiction.name}, ${jurisdiction.state} (ID: ${jurisdiction.id})\n`);

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.commonQuestion.deleteMany({ where: { jurisdictionId: jurisdiction.id } });
  await prisma.permitExemption.deleteMany({ where: { jurisdictionId: jurisdiction.id } });
  await prisma.permitRequirement.deleteMany({ where: { jurisdictionId: jurisdiction.id } });
  await prisma.buildingCodeChunk.deleteMany({ where: { jurisdictionId: jurisdiction.id } });
  await prisma.zoningDistrict.deleteMany({ where: { jurisdictionId: jurisdiction.id } });
  console.log('✓ Cleared existing data\n');

  // Seed Zoning Districts
  console.log('Seeding Zoning Districts...');
  let districtCount = 0;
  for (const district of ZONING_DISTRICTS) {
    await prisma.zoningDistrict.create({
      data: {
        jurisdictionId: jurisdiction.id,
        code: district.code,
        name: district.name,
        category: district.category,
        description: district.description,
        minLotSqft: district.minLotSqft,
        maxLotCoverage: district.maxLotCoverage,
        maxHeightFt: district.maxHeightFt,
        maxStories: district.maxStories,
        frontSetbackFt: district.frontSetbackFt,
        sideSetbackFt: district.sideSetbackFt,
        rearSetbackFt: district.rearSetbackFt,
        maxFar: district.maxFar,
        allowedUses: district.allowedUses,
      },
    });
    districtCount++;
  }
  console.log(`✓ Seeded ${districtCount} zoning districts\n`);

  // Seed Permit Requirements
  console.log('Seeding Permit Requirements...');
  let permitCount = 0;
  for (const permit of PERMIT_REQUIREMENTS) {
    await prisma.permitRequirement.create({
      data: {
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
  }
  console.log(`✓ Seeded ${permitCount} permit requirements\n`);

  // Seed Permit Exemptions
  console.log('Seeding Permit Exemptions...');
  let exemptionCount = 0;
  for (const exemption of PERMIT_EXEMPTIONS) {
    await prisma.permitExemption.create({
      data: {
        jurisdictionId: jurisdiction.id,
        activity: exemption.activity,
        description: exemption.description,
        maxValue: exemption.maxValue,
        maxSqft: exemption.maxSqft,
        conditions: exemption.conditions,
        ordinanceRef: exemption.ordinanceRef,
      },
    });
    exemptionCount++;
  }
  console.log(`✓ Seeded ${exemptionCount} permit exemptions\n`);

  // Seed Building Code Chunks
  console.log('Seeding Building Code Chunks...');
  let codeCount = 0;
  for (const chunk of BUILDING_CODE_CHUNKS) {
    await prisma.buildingCodeChunk.create({
      data: {
        jurisdictionId: jurisdiction.id,
        codeType: chunk.codeType,
        codeYear: '2024',
        section: chunk.section,
        title: chunk.title,
        content: chunk.content,
      },
    });
    codeCount++;
  }
  console.log(`✓ Seeded ${codeCount} building code chunks\n`);

  // Seed Common Questions
  console.log('Seeding Common Questions...');
  let questionCount = 0;
  for (const q of COMMON_QUESTIONS) {
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
    questionCount++;
  }
  console.log(`✓ Seeded ${questionCount} common questions\n`);

  console.log('='.repeat(50));
  console.log('Cincinnati data seed completed successfully!');
  console.log('='.repeat(50));
  console.log(`
Summary:
  - Zoning Districts: ${districtCount}
  - Permit Requirements: ${permitCount}
  - Permit Exemptions: ${exemptionCount}
  - Building Code Chunks: ${codeCount}
  - Common Questions: ${questionCount}
`);
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
