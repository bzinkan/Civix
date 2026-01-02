import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed Zone Definitions and Permit Requirements for Kentucky Metro Cities
 *
 * Kentucky cities follow the Kentucky Building Code (KBC) with local amendments
 * Northern Kentucky cities often have similar zoning structures
 *
 * Usage:
 *   npx tsx prisma/seed-metro-ky.ts
 */

// Kentucky zoning codes (Northern Kentucky style)
const KENTUCKY_ZONING_DISTRICTS = [
  // RESIDENTIAL DISTRICTS
  { code: 'R-1A', name: 'Rural Residential', category: 'residential', description: 'Rural character with large lots', minLotSqft: 40000, maxLotCoverage: 0.20, maxHeightFt: 35, maxStories: 2.5, frontSetbackFt: 50, sideSetbackFt: 20, rearSetbackFt: 40, maxFar: null, allowedUses: ['single_family_home', 'home_occupation', 'agricultural'] },
  { code: 'R-1B', name: 'Suburban Residential Low', category: 'residential', description: 'Low density suburban single-family', minLotSqft: 20000, maxLotCoverage: 0.25, maxHeightFt: 35, maxStories: 2.5, frontSetbackFt: 40, sideSetbackFt: 15, rearSetbackFt: 35, maxFar: null, allowedUses: ['single_family_home', 'home_occupation', 'accessory_dwelling_unit'] },
  { code: 'R-1C', name: 'Suburban Residential', category: 'residential', description: 'Suburban single-family residential', minLotSqft: 12500, maxLotCoverage: 0.30, maxHeightFt: 35, maxStories: 2.5, frontSetbackFt: 30, sideSetbackFt: 8, rearSetbackFt: 30, maxFar: null, allowedUses: ['single_family_home', 'home_occupation', 'accessory_dwelling_unit'] },
  { code: 'R-1D', name: 'Urban Residential', category: 'residential', description: 'Urban single-family with smaller lots', minLotSqft: 7500, maxLotCoverage: 0.40, maxHeightFt: 35, maxStories: 2.5, frontSetbackFt: 25, sideSetbackFt: 6, rearSetbackFt: 25, maxFar: null, allowedUses: ['single_family_home', 'two_family', 'home_occupation'] },
  { code: 'R-2', name: 'Two-Family Residential', category: 'residential', description: 'Two-family and duplex residential', minLotSqft: 6000, maxLotCoverage: 0.45, maxHeightFt: 35, maxStories: 2.5, frontSetbackFt: 25, sideSetbackFt: 6, rearSetbackFt: 25, maxFar: null, allowedUses: ['single_family_home', 'two_family', 'home_occupation'] },
  { code: 'R-3', name: 'Multi-Family Residential', category: 'residential', description: 'Multi-family residential including apartments', minLotSqft: 5000, maxLotCoverage: 0.50, maxHeightFt: 45, maxStories: 3, frontSetbackFt: 25, sideSetbackFt: 10, rearSetbackFt: 25, maxFar: 1.5, allowedUses: ['single_family_home', 'two_family', 'townhouse', 'apartment'] },
  { code: 'R-4', name: 'High-Density Residential', category: 'residential', description: 'High-density apartments and condos', minLotSqft: 3000, maxLotCoverage: 0.60, maxHeightFt: 60, maxStories: 5, frontSetbackFt: 20, sideSetbackFt: 10, rearSetbackFt: 20, maxFar: 2.5, allowedUses: ['apartment', 'townhouse', 'condominium'] },
  { code: 'TUR', name: 'Traditional Urban Residential', category: 'residential', description: 'Traditional urban neighborhoods', minLotSqft: 3000, maxLotCoverage: 0.50, maxHeightFt: 40, maxStories: 3, frontSetbackFt: 10, sideSetbackFt: 3, rearSetbackFt: 20, maxFar: 1.5, allowedUses: ['single_family_home', 'two_family', 'townhouse', 'apartment_small'] },

  // COMMERCIAL DISTRICTS
  { code: 'C-1', name: 'Neighborhood Commercial', category: 'commercial', description: 'Neighborhood-serving retail and services', minLotSqft: 5000, maxLotCoverage: 0.60, maxHeightFt: 35, maxStories: 2, frontSetbackFt: 15, sideSetbackFt: 0, rearSetbackFt: 10, maxFar: 1.0, allowedUses: ['retail', 'restaurant', 'personal_service', 'office'] },
  { code: 'C-2', name: 'General Commercial', category: 'commercial', description: 'General retail and commercial', minLotSqft: 10000, maxLotCoverage: 0.65, maxHeightFt: 50, maxStories: 4, frontSetbackFt: 25, sideSetbackFt: 10, rearSetbackFt: 15, maxFar: 2.0, allowedUses: ['retail', 'restaurant', 'office', 'hotel', 'entertainment', 'auto_service'] },
  { code: 'C-3', name: 'Highway Commercial', category: 'commercial', description: 'Auto-oriented commercial', minLotSqft: 15000, maxLotCoverage: 0.50, maxHeightFt: 45, maxStories: 3, frontSetbackFt: 40, sideSetbackFt: 15, rearSetbackFt: 20, maxFar: 1.0, allowedUses: ['retail', 'restaurant', 'auto_service', 'gas_station', 'drive_through', 'hotel'] },
  { code: 'CBD', name: 'Central Business District', category: 'commercial', description: 'Downtown core', minLotSqft: 0, maxLotCoverage: 1.00, maxHeightFt: null, maxStories: null, frontSetbackFt: 0, sideSetbackFt: 0, rearSetbackFt: 0, maxFar: 10.0, allowedUses: ['office', 'retail', 'restaurant', 'hotel', 'residential', 'entertainment'] },
  { code: 'O-1', name: 'Office', category: 'commercial', description: 'Professional office', minLotSqft: 10000, maxLotCoverage: 0.45, maxHeightFt: 50, maxStories: 4, frontSetbackFt: 30, sideSetbackFt: 15, rearSetbackFt: 25, maxFar: 1.5, allowedUses: ['office', 'medical_office', 'bank'] },

  // MIXED USE DISTRICTS
  { code: 'TUMU', name: 'Traditional Urban Mixed Use', category: 'mixed_use', description: 'Urban mixed-use', minLotSqft: 2000, maxLotCoverage: 0.80, maxHeightFt: 50, maxStories: 4, frontSetbackFt: 0, sideSetbackFt: 0, rearSetbackFt: 10, maxFar: 3.0, allowedUses: ['retail', 'restaurant', 'office', 'residential_upper_floors', 'live_work'] },
  { code: 'CMU', name: 'Commercial Mixed Use', category: 'mixed_use', description: 'Commercial mixed-use', minLotSqft: 5000, maxLotCoverage: 0.70, maxHeightFt: 55, maxStories: 5, frontSetbackFt: 10, sideSetbackFt: 5, rearSetbackFt: 15, maxFar: 2.5, allowedUses: ['retail', 'restaurant', 'office', 'hotel', 'apartment', 'entertainment'] },

  // INDUSTRIAL DISTRICTS
  { code: 'I-1', name: 'Light Industrial', category: 'industrial', description: 'Light industrial', minLotSqft: 20000, maxLotCoverage: 0.50, maxHeightFt: 50, maxStories: 3, frontSetbackFt: 40, sideSetbackFt: 20, rearSetbackFt: 25, maxFar: 1.0, allowedUses: ['light_industrial', 'warehouse', 'office', 'flex_space'] },
  { code: 'I-2', name: 'General Industrial', category: 'industrial', description: 'General industrial', minLotSqft: 30000, maxLotCoverage: 0.60, maxHeightFt: 65, maxStories: 4, frontSetbackFt: 50, sideSetbackFt: 25, rearSetbackFt: 30, maxFar: 1.5, allowedUses: ['manufacturing', 'warehouse', 'distribution', 'heavy_industrial'] },

  // SPECIAL DISTRICTS
  { code: 'PUD', name: 'Planned Unit Development', category: 'special', description: 'Planned development', minLotSqft: null, maxLotCoverage: null, maxHeightFt: null, maxStories: null, frontSetbackFt: null, sideSetbackFt: null, rearSetbackFt: null, maxFar: null, allowedUses: ['varies_by_plan'] },
  { code: 'RP', name: 'Resource Protection', category: 'special', description: 'Conservation areas', minLotSqft: null, maxLotCoverage: 0.05, maxHeightFt: 25, maxStories: 1, frontSetbackFt: 50, sideSetbackFt: 25, rearSetbackFt: 50, maxFar: 0.05, allowedUses: ['conservation', 'passive_recreation'] },
  { code: 'REC', name: 'Recreation', category: 'special', description: 'Parks and recreation', minLotSqft: null, maxLotCoverage: 0.20, maxHeightFt: 35, maxStories: 2, frontSetbackFt: 25, sideSetbackFt: 15, rearSetbackFt: 25, maxFar: 0.2, allowedUses: ['park', 'recreation_facility', 'community_center'] },
];

// Kentucky Building Permit Requirements
const KENTUCKY_PERMIT_REQUIREMENTS = [
  // RESIDENTIAL BUILDING PERMITS
  { activityType: 'deck', category: 'building', activityDescription: 'Deck construction or replacement', zonesRequired: ['*'], zonesProhibited: [], feeBase: 75.00, feePerSqft: 0.15, processingDays: 5, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KBC 105.1' },
  { activityType: 'fence', category: 'building', activityDescription: 'Fence installation (over 6ft or front yard)', zonesRequired: ['*'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 3, requiresPlans: false, requiresInspection: true, ordinanceRef: 'Local Zoning' },
  { activityType: 'shed', category: 'building', activityDescription: 'Accessory structure under 200 sq ft', zonesRequired: ['*'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 3, requiresPlans: false, requiresInspection: true, ordinanceRef: 'KBC 105.2' },
  { activityType: 'accessory_structure', category: 'building', activityDescription: 'Accessory structure over 200 sq ft', zonesRequired: ['*'], zonesProhibited: [], feeBase: 100.00, feePerSqft: 0.20, processingDays: 7, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KBC 105.1' },
  { activityType: 'addition', category: 'building', activityDescription: 'Home addition', zonesRequired: ['*'], zonesProhibited: [], feeBase: 150.00, feePerSqft: 0.25, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KBC 105.1' },
  { activityType: 'basement_finish', category: 'building', activityDescription: 'Finishing basement space', zonesRequired: ['*'], zonesProhibited: [], feeBase: 100.00, feePerSqft: 0.10, processingDays: 7, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KBC 105.1' },
  { activityType: 'garage', category: 'building', activityDescription: 'Garage construction', zonesRequired: ['*'], zonesProhibited: [], feeBase: 125.00, feePerSqft: 0.20, processingDays: 10, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KBC 105.1' },
  { activityType: 'pool', category: 'building', activityDescription: 'Swimming pool installation', zonesRequired: ['*'], zonesProhibited: [], feeBase: 150.00, feePerSqft: null, processingDays: 10, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KBC 105.1' },
  { activityType: 'demolition', category: 'building', activityDescription: 'Structure demolition', zonesRequired: ['*'], zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KBC 105.1' },
  { activityType: 'new_construction_residential', category: 'building', activityDescription: 'New residential construction', zonesRequired: ['*'], zonesProhibited: ['I-2'], feeBase: 500.00, feePerSqft: 0.30, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KBC 105.1' },

  // TRADE PERMITS
  { activityType: 'electrical', category: 'trade', activityDescription: 'Electrical work', zonesRequired: ['*'], zonesProhibited: [], feeBase: 60.00, feePerSqft: null, processingDays: 3, requiresPlans: false, requiresInspection: true, ordinanceRef: 'KBC Chapter 27' },
  { activityType: 'plumbing', category: 'trade', activityDescription: 'Plumbing work', zonesRequired: ['*'], zonesProhibited: [], feeBase: 60.00, feePerSqft: null, processingDays: 3, requiresPlans: false, requiresInspection: true, ordinanceRef: 'KBC Chapter 29' },
  { activityType: 'hvac', category: 'trade', activityDescription: 'HVAC installation/replacement', zonesRequired: ['*'], zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 3, requiresPlans: false, requiresInspection: true, ordinanceRef: 'KBC Chapter 28' },
  { activityType: 'roofing', category: 'trade', activityDescription: 'Roof replacement', zonesRequired: ['*'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 2, requiresPlans: false, requiresInspection: true, ordinanceRef: 'KBC 105.1' },

  // COMMERCIAL PERMITS
  { activityType: 'tenant_buildout', category: 'commercial', activityDescription: 'Commercial tenant improvement', zonesRequired: ['C-1', 'C-2', 'C-3', 'CBD', 'O-1', 'TUMU', 'CMU'], zonesProhibited: [], feeBase: 200.00, feePerSqft: 0.20, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KBC 105.1' },
  { activityType: 'new_construction_commercial', category: 'commercial', activityDescription: 'New commercial construction', zonesRequired: ['C-1', 'C-2', 'C-3', 'CBD', 'O-1', 'TUMU', 'CMU', 'I-1', 'I-2'], zonesProhibited: [], feeBase: 1000.00, feePerSqft: 0.35, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KBC 105.1' },
  { activityType: 'change_of_use', category: 'commercial', activityDescription: 'Change of occupancy/use', zonesRequired: ['*'], zonesProhibited: [], feeBase: 150.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KBC 105.1' },
  { activityType: 'sign', category: 'commercial', activityDescription: 'Sign installation', zonesRequired: ['*'], zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 7, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Sign Code' },

  // BUSINESS LICENSES
  { activityType: 'business_license', category: 'license', activityDescription: 'Occupational license', zonesRequired: ['*'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 5, requiresPlans: false, requiresInspection: false, ordinanceRef: 'Local Ordinance' },
  { activityType: 'food_service', category: 'license', activityDescription: 'Food service establishment', zonesRequired: ['C-1', 'C-2', 'C-3', 'CBD', 'TUMU', 'CMU'], zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Northern KY Health Dept' },
  { activityType: 'liquor_permit', category: 'license', activityDescription: 'Liquor permit (local approval)', zonesRequired: ['C-1', 'C-2', 'C-3', 'CBD', 'TUMU', 'CMU'], zonesProhibited: [], feeBase: 500.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: false, ordinanceRef: 'KY ABC' },
  { activityType: 'home_occupation', category: 'license', activityDescription: 'Home-based business', zonesRequired: ['R-1A', 'R-1B', 'R-1C', 'R-1D', 'R-2', 'R-3', 'TUR'], zonesProhibited: [], feeBase: 25.00, feePerSqft: null, processingDays: 7, requiresPlans: false, requiresInspection: false, ordinanceRef: 'Local Zoning' },

  // SPECIAL USES
  { activityType: 'short_term_rental', category: 'license', activityDescription: 'Short-term rental license', zonesRequired: ['*'], zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: true, ordinanceRef: 'Local STR Ordinance' },
  { activityType: 'rental_registration', category: 'license', activityDescription: 'Rental dwelling license', zonesRequired: ['*'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 7, requiresPlans: false, requiresInspection: true, ordinanceRef: 'Local Rental Code' },
];

// Permit Exemptions (Kentucky Building Code)
const KENTUCKY_PERMIT_EXEMPTIONS = [
  { activity: 'fence_under_6ft', description: 'Fence 6 feet or under in rear/side yard', maxValue: null, maxSqft: null, conditions: 'Rear and side yards only', ordinanceRef: 'KBC 105.2' },
  { activity: 'fence_under_4ft', description: 'Fence 4 feet or under in front yard', maxValue: null, maxSqft: null, conditions: 'Front yard fences', ordinanceRef: 'KBC 105.2' },
  { activity: 'shed_under_120sqft', description: 'Accessory structure under 120 sq ft', maxValue: null, maxSqft: 120, conditions: 'One story, no utilities', ordinanceRef: 'KBC 105.2' },
  { activity: 'interior_paint', description: 'Interior painting and wallpapering', maxValue: null, maxSqft: null, conditions: null, ordinanceRef: 'KBC 105.2' },
  { activity: 'flooring', description: 'Flooring replacement', maxValue: null, maxSqft: null, conditions: 'No structural changes', ordinanceRef: 'KBC 105.2' },
  { activity: 'cabinets', description: 'Cabinet replacement', maxValue: null, maxSqft: null, conditions: 'No plumbing/electrical changes', ordinanceRef: 'KBC 105.2' },
  { activity: 'minor_repair', description: 'Minor repairs under $2,500', maxValue: 2500, maxSqft: null, conditions: 'Non-structural only', ordinanceRef: 'KBC 105.2' },
  { activity: 'landscaping', description: 'Landscaping and gardening', maxValue: null, maxSqft: null, conditions: 'No major grading', ordinanceRef: 'KBC 105.2' },
  { activity: 'retaining_wall_under_4ft', description: 'Retaining wall under 4 feet', maxValue: null, maxSqft: null, conditions: 'No surcharge loads', ordinanceRef: 'KBC 105.2' },
  { activity: 'window_replacement', description: 'Window replacement (same size)', maxValue: null, maxSqft: null, conditions: 'Same size opening', ordinanceRef: 'KBC 105.2' },
  { activity: 'door_replacement', description: 'Door replacement (same size)', maxValue: null, maxSqft: null, conditions: 'Same size opening', ordinanceRef: 'KBC 105.2' },
  { activity: 'gutter', description: 'Gutter installation', maxValue: null, maxSqft: null, conditions: null, ordinanceRef: 'KBC 105.2' },
  { activity: 'deck_under_30in', description: 'Deck under 30 inches above grade', maxValue: null, maxSqft: 200, conditions: 'Under 200 sq ft, no roof', ordinanceRef: 'KBC 105.2' },
];

// Building Code Chunks (Kentucky Building Code)
const KENTUCKY_BUILDING_CODE_CHUNKS = [
  { codeType: 'state', section: 'KBC 105.1', title: 'Permit Required', content: 'Any owner or authorized agent who intends to construct, enlarge, alter, repair, move, demolish, or change the occupancy of a building shall first make application to the building official and obtain the required permit.' },
  { codeType: 'state', section: 'KBC 105.2', title: 'Work Exempt from Permit', content: 'Exemptions include: One-story detached accessory structures not exceeding 120 square feet. Fences not over 6 feet high. Retaining walls not over 4 feet. Painting, papering, tiling, carpeting. Temporary structures.' },
  { codeType: 'state', section: 'KBC 109.3', title: 'Building Permit Valuations', content: 'The applicant for a permit shall provide an estimated permit value at time of application. Permit valuations include total value of work.' },
  { codeType: 'state', section: 'KBC 110.1', title: 'Inspections General', content: 'Construction or work for which a permit is required shall be subject to inspection by the building official.' },
  { codeType: 'state', section: 'KBC Chapter 3', title: 'Use and Occupancy Classification', content: 'Buildings shall be classified into groups: Assembly (A), Business (B), Educational (E), Factory (F), High Hazard (H), Institutional (I), Mercantile (M), Residential (R), Storage (S), Utility (U).' },
];

// Kentucky Metro Cities to seed
const KENTUCKY_METRO_CITIES = [
  // Kenton County
  { id: 'covington-ky', name: 'Covington', county: 'Kenton' },
  { id: 'erlanger-ky', name: 'Erlanger', county: 'Kenton' },
  { id: 'fort-mitchell-ky', name: 'Fort Mitchell', county: 'Kenton' },
  { id: 'independence-ky', name: 'Independence', county: 'Kenton' },
  // Campbell County
  { id: 'newport-ky', name: 'Newport', county: 'Campbell' },
  { id: 'fort-thomas-ky', name: 'Fort Thomas', county: 'Campbell' },
  { id: 'cold-spring-ky', name: 'Cold Spring', county: 'Campbell' },
  { id: 'bellevue-ky', name: 'Bellevue', county: 'Campbell' },
  { id: 'dayton-ky', name: 'Dayton', county: 'Campbell' },
  // Boone County
  { id: 'florence-ky', name: 'Florence', county: 'Boone' },
];

async function seedKentuckyMetroCities() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║  Kentucky Metro Cities Seed                                                ║
║                                                                            ║
║  Seeding zone definitions and permit requirements for ${KENTUCKY_METRO_CITIES.length} cities        ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

  for (const city of KENTUCKY_METRO_CITIES) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`🏛️  ${city.name}, KY (${city.id})`);
    console.log(`${'─'.repeat(60)}`);

    // Check if jurisdiction exists
    const jurisdiction = await prisma.jurisdiction.findUnique({
      where: { id: city.id },
    });

    if (!jurisdiction) {
      console.log(`   ⚠️ Jurisdiction not found - skipping`);
      continue;
    }

    // Skip Covington - it has its own dedicated seed file
    if (city.id === 'covington-ky') {
      console.log(`   ℹ️ Covington has dedicated seed file - skipping generic seed`);
      continue;
    }

    // Clear existing data
    console.log(`   Clearing existing data...`);
    await prisma.commonQuestion.deleteMany({ where: { jurisdictionId: city.id } });
    await prisma.permitExemption.deleteMany({ where: { jurisdictionId: city.id } });
    await prisma.permitRequirement.deleteMany({ where: { jurisdictionId: city.id } });
    await prisma.buildingCodeChunk.deleteMany({ where: { jurisdictionId: city.id } });
    await prisma.zoningDistrict.deleteMany({ where: { jurisdictionId: city.id } });

    // Seed Zoning Districts
    console.log(`   Seeding zoning districts...`);
    let districtCount = 0;
    for (const district of KENTUCKY_ZONING_DISTRICTS) {
      await prisma.zoningDistrict.create({
        data: {
          jurisdictionId: city.id,
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
    console.log(`   ✓ ${districtCount} zoning districts`);

    // Seed Permit Requirements
    console.log(`   Seeding permit requirements...`);
    let permitCount = 0;
    for (const permit of KENTUCKY_PERMIT_REQUIREMENTS) {
      await prisma.permitRequirement.create({
        data: {
          jurisdictionId: city.id,
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
    console.log(`   ✓ ${permitCount} permit requirements`);

    // Seed Permit Exemptions
    console.log(`   Seeding permit exemptions...`);
    let exemptionCount = 0;
    for (const exemption of KENTUCKY_PERMIT_EXEMPTIONS) {
      await prisma.permitExemption.create({
        data: {
          jurisdictionId: city.id,
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
    console.log(`   ✓ ${exemptionCount} permit exemptions`);

    // Seed Building Code Chunks
    console.log(`   Seeding building code chunks...`);
    let codeCount = 0;
    for (const chunk of KENTUCKY_BUILDING_CODE_CHUNKS) {
      await prisma.buildingCodeChunk.create({
        data: {
          jurisdictionId: city.id,
          codeType: chunk.codeType,
          codeYear: '2024',
          section: chunk.section,
          title: chunk.title,
          content: chunk.content,
        },
      });
      codeCount++;
    }
    console.log(`   ✓ ${codeCount} building code chunks`);

    // Update jurisdiction status
    await prisma.jurisdiction.update({
      where: { id: city.id },
      data: {
        status: 'live',
        dataCompleteness: 85,
      },
    });
    console.log(`   ✓ Status updated to 'live'`);
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`✅ Kentucky metro cities seed completed!`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`
Summary:
  - Cities seeded: ${KENTUCKY_METRO_CITIES.length - 1} (Covington has dedicated seed)
  - Zoning districts per city: ${KENTUCKY_ZONING_DISTRICTS.length}
  - Permit requirements per city: ${KENTUCKY_PERMIT_REQUIREMENTS.length}
  - Permit exemptions per city: ${KENTUCKY_PERMIT_EXEMPTIONS.length}
  - Building code chunks per city: ${KENTUCKY_BUILDING_CODE_CHUNKS.length}
`);
}

// Run
seedKentuckyMetroCities()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
