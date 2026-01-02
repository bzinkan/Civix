import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed Zone Definitions and Permit Requirements for Ohio Metro Cities
 *
 * Ohio cities follow the Ohio Building Code (OBC) with local amendments
 * Zoning codes are largely standardized across Ohio municipalities
 *
 * Usage:
 *   npx tsx prisma/seed-metro-oh.ts
 */

// Standard Ohio zoning codes (most Ohio municipalities use these)
const OHIO_ZONING_DISTRICTS = [
  // RESIDENTIAL DISTRICTS
  { code: 'R-1', name: 'Single-Family Residential - Low Density', category: 'residential', description: 'Low density single-family residential with large lots', minLotSqft: 15000, maxLotCoverage: 0.30, maxHeightFt: 35, maxStories: 2.5, frontSetbackFt: 35, sideSetbackFt: 10, rearSetbackFt: 35, maxFar: null, allowedUses: ['single_family_home', 'home_occupation', 'accessory_dwelling_unit'] },
  { code: 'R-2', name: 'Single-Family Residential - Medium Density', category: 'residential', description: 'Medium density single-family residential', minLotSqft: 10000, maxLotCoverage: 0.35, maxHeightFt: 35, maxStories: 2.5, frontSetbackFt: 30, sideSetbackFt: 8, rearSetbackFt: 30, maxFar: null, allowedUses: ['single_family_home', 'home_occupation', 'accessory_dwelling_unit'] },
  { code: 'R-3', name: 'Single-Family Residential - High Density', category: 'residential', description: 'Higher density single-family residential', minLotSqft: 7500, maxLotCoverage: 0.40, maxHeightFt: 35, maxStories: 2.5, frontSetbackFt: 25, sideSetbackFt: 6, rearSetbackFt: 25, maxFar: null, allowedUses: ['single_family_home', 'two_family', 'home_occupation'] },
  { code: 'R-4', name: 'Multi-Family Residential', category: 'residential', description: 'Multi-family residential including apartments', minLotSqft: 5000, maxLotCoverage: 0.50, maxHeightFt: 45, maxStories: 3, frontSetbackFt: 25, sideSetbackFt: 10, rearSetbackFt: 25, maxFar: 1.5, allowedUses: ['single_family_home', 'two_family', 'townhouse', 'apartment', 'home_occupation'] },
  { code: 'R-5', name: 'High-Density Residential', category: 'residential', description: 'High-density residential and apartment districts', minLotSqft: 3000, maxLotCoverage: 0.60, maxHeightFt: 60, maxStories: 5, frontSetbackFt: 20, sideSetbackFt: 10, rearSetbackFt: 20, maxFar: 2.5, allowedUses: ['apartment', 'townhouse', 'condominium'] },
  { code: 'RM', name: 'Residential Mixed', category: 'residential', description: 'Mixed residential types', minLotSqft: 6000, maxLotCoverage: 0.45, maxHeightFt: 40, maxStories: 3, frontSetbackFt: 25, sideSetbackFt: 8, rearSetbackFt: 25, maxFar: 1.5, allowedUses: ['single_family_home', 'two_family', 'townhouse', 'apartment_small'] },

  // COMMERCIAL DISTRICTS
  { code: 'C-1', name: 'Neighborhood Commercial', category: 'commercial', description: 'Neighborhood-serving retail and services', minLotSqft: 5000, maxLotCoverage: 0.60, maxHeightFt: 35, maxStories: 2, frontSetbackFt: 10, sideSetbackFt: 0, rearSetbackFt: 10, maxFar: 1.0, allowedUses: ['retail', 'restaurant', 'personal_service', 'office', 'bank'] },
  { code: 'C-2', name: 'General Commercial', category: 'commercial', description: 'General retail and commercial uses', minLotSqft: 10000, maxLotCoverage: 0.65, maxHeightFt: 45, maxStories: 3, frontSetbackFt: 20, sideSetbackFt: 10, rearSetbackFt: 15, maxFar: 1.5, allowedUses: ['retail', 'restaurant', 'office', 'hotel', 'entertainment', 'auto_service'] },
  { code: 'C-3', name: 'Highway Commercial', category: 'commercial', description: 'Auto-oriented commercial along major roads', minLotSqft: 15000, maxLotCoverage: 0.50, maxHeightFt: 45, maxStories: 3, frontSetbackFt: 40, sideSetbackFt: 15, rearSetbackFt: 20, maxFar: 1.0, allowedUses: ['retail', 'restaurant', 'auto_service', 'gas_station', 'drive_through', 'hotel'] },
  { code: 'C-4', name: 'Central Business District', category: 'commercial', description: 'Downtown core commercial', minLotSqft: 0, maxLotCoverage: 1.00, maxHeightFt: null, maxStories: null, frontSetbackFt: 0, sideSetbackFt: 0, rearSetbackFt: 0, maxFar: 10.0, allowedUses: ['office', 'retail', 'restaurant', 'hotel', 'residential', 'entertainment'] },
  { code: 'O-1', name: 'Office District', category: 'commercial', description: 'Professional office uses', minLotSqft: 10000, maxLotCoverage: 0.50, maxHeightFt: 50, maxStories: 4, frontSetbackFt: 30, sideSetbackFt: 15, rearSetbackFt: 25, maxFar: 1.5, allowedUses: ['office', 'medical_office', 'bank', 'personal_service'] },

  // MIXED USE DISTRICTS
  { code: 'MX', name: 'Mixed Use', category: 'mixed_use', description: 'Mixed commercial and residential uses', minLotSqft: 5000, maxLotCoverage: 0.70, maxHeightFt: 55, maxStories: 4, frontSetbackFt: 0, sideSetbackFt: 0, rearSetbackFt: 10, maxFar: 3.0, allowedUses: ['retail', 'restaurant', 'office', 'residential_upper_floors', 'live_work'] },
  { code: 'MU', name: 'Mixed Use Urban', category: 'mixed_use', description: 'Urban mixed-use with higher density', minLotSqft: 2000, maxLotCoverage: 0.85, maxHeightFt: 65, maxStories: 5, frontSetbackFt: 0, sideSetbackFt: 0, rearSetbackFt: 5, maxFar: 4.0, allowedUses: ['retail', 'restaurant', 'office', 'hotel', 'apartment', 'entertainment'] },

  // INDUSTRIAL DISTRICTS
  { code: 'I-1', name: 'Light Industrial', category: 'industrial', description: 'Light industrial and flex uses', minLotSqft: 20000, maxLotCoverage: 0.50, maxHeightFt: 50, maxStories: 3, frontSetbackFt: 40, sideSetbackFt: 20, rearSetbackFt: 25, maxFar: 1.0, allowedUses: ['light_industrial', 'warehouse', 'office', 'flex_space'] },
  { code: 'I-2', name: 'General Industrial', category: 'industrial', description: 'General manufacturing and industrial', minLotSqft: 30000, maxLotCoverage: 0.60, maxHeightFt: 60, maxStories: 4, frontSetbackFt: 50, sideSetbackFt: 25, rearSetbackFt: 30, maxFar: 1.5, allowedUses: ['manufacturing', 'warehouse', 'distribution', 'heavy_industrial'] },
  { code: 'I-3', name: 'Heavy Industrial', category: 'industrial', description: 'Heavy industrial uses', minLotSqft: 50000, maxLotCoverage: 0.55, maxHeightFt: 75, maxStories: 5, frontSetbackFt: 60, sideSetbackFt: 30, rearSetbackFt: 40, maxFar: 2.0, allowedUses: ['heavy_industrial', 'manufacturing', 'processing'] },

  // SPECIAL DISTRICTS
  { code: 'PD', name: 'Planned Development', category: 'special', description: 'Planned unit development with flexible standards', minLotSqft: null, maxLotCoverage: null, maxHeightFt: null, maxStories: null, frontSetbackFt: null, sideSetbackFt: null, rearSetbackFt: null, maxFar: null, allowedUses: ['varies_by_plan'] },
  { code: 'OS', name: 'Open Space', category: 'special', description: 'Parks and open space preservation', minLotSqft: null, maxLotCoverage: 0.05, maxHeightFt: 25, maxStories: 1, frontSetbackFt: 50, sideSetbackFt: 25, rearSetbackFt: 50, maxFar: 0.05, allowedUses: ['park', 'recreation', 'conservation'] },
  { code: 'INS', name: 'Institutional', category: 'special', description: 'Schools, churches, government', minLotSqft: 20000, maxLotCoverage: 0.40, maxHeightFt: 50, maxStories: 4, frontSetbackFt: 40, sideSetbackFt: 20, rearSetbackFt: 30, maxFar: 1.0, allowedUses: ['school', 'church', 'government', 'hospital', 'community_center'] },
];

// Standard Ohio Building Permit Requirements
const OHIO_PERMIT_REQUIREMENTS = [
  // RESIDENTIAL BUILDING PERMITS
  { activityType: 'deck', category: 'building', activityDescription: 'Deck construction or replacement', zonesRequired: ['*'], zonesProhibited: [], feeBase: 100.00, feePerSqft: 0.20, processingDays: 7, requiresPlans: true, requiresInspection: true, ordinanceRef: 'OBC 105.1' },
  { activityType: 'fence', category: 'building', activityDescription: 'Fence installation (over 6ft or front yard)', zonesRequired: ['*'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 5, requiresPlans: false, requiresInspection: true, ordinanceRef: 'Local Zoning' },
  { activityType: 'shed', category: 'building', activityDescription: 'Accessory structure under 200 sq ft', zonesRequired: ['*'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 3, requiresPlans: false, requiresInspection: true, ordinanceRef: 'OBC 105.2' },
  { activityType: 'accessory_structure', category: 'building', activityDescription: 'Accessory structure over 200 sq ft', zonesRequired: ['*'], zonesProhibited: [], feeBase: 125.00, feePerSqft: 0.25, processingDays: 10, requiresPlans: true, requiresInspection: true, ordinanceRef: 'OBC 105.1' },
  { activityType: 'addition', category: 'building', activityDescription: 'Home addition', zonesRequired: ['*'], zonesProhibited: [], feeBase: 200.00, feePerSqft: 0.30, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'OBC 105.1' },
  { activityType: 'basement_finish', category: 'building', activityDescription: 'Finishing basement space', zonesRequired: ['*'], zonesProhibited: [], feeBase: 125.00, feePerSqft: 0.15, processingDays: 7, requiresPlans: true, requiresInspection: true, ordinanceRef: 'OBC 105.1' },
  { activityType: 'garage', category: 'building', activityDescription: 'Garage construction', zonesRequired: ['*'], zonesProhibited: [], feeBase: 150.00, feePerSqft: 0.25, processingDays: 10, requiresPlans: true, requiresInspection: true, ordinanceRef: 'OBC 105.1' },
  { activityType: 'pool', category: 'building', activityDescription: 'Swimming pool installation', zonesRequired: ['*'], zonesProhibited: [], feeBase: 175.00, feePerSqft: null, processingDays: 10, requiresPlans: true, requiresInspection: true, ordinanceRef: 'OBC 105.1' },
  { activityType: 'demolition', category: 'building', activityDescription: 'Structure demolition', zonesRequired: ['*'], zonesProhibited: [], feeBase: 250.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'OBC 105.1' },
  { activityType: 'new_construction_residential', category: 'building', activityDescription: 'New residential construction', zonesRequired: ['*'], zonesProhibited: ['I-2', 'I-3'], feeBase: 750.00, feePerSqft: 0.35, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'OBC 105.1' },

  // TRADE PERMITS
  { activityType: 'electrical', category: 'trade', activityDescription: 'Electrical work', zonesRequired: ['*'], zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 3, requiresPlans: false, requiresInspection: true, ordinanceRef: 'OBC Chapter 27' },
  { activityType: 'plumbing', category: 'trade', activityDescription: 'Plumbing work', zonesRequired: ['*'], zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 3, requiresPlans: false, requiresInspection: true, ordinanceRef: 'OBC Chapter 29' },
  { activityType: 'hvac', category: 'trade', activityDescription: 'HVAC installation/replacement', zonesRequired: ['*'], zonesProhibited: [], feeBase: 85.00, feePerSqft: null, processingDays: 3, requiresPlans: false, requiresInspection: true, ordinanceRef: 'OBC Chapter 28' },
  { activityType: 'roofing', category: 'trade', activityDescription: 'Roof replacement', zonesRequired: ['*'], zonesProhibited: [], feeBase: 60.00, feePerSqft: null, processingDays: 2, requiresPlans: false, requiresInspection: true, ordinanceRef: 'OBC 105.1' },

  // COMMERCIAL PERMITS
  { activityType: 'tenant_buildout', category: 'commercial', activityDescription: 'Commercial tenant improvement', zonesRequired: ['C-1', 'C-2', 'C-3', 'C-4', 'O-1', 'MX', 'MU', 'I-1'], zonesProhibited: [], feeBase: 250.00, feePerSqft: 0.25, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'OBC 105.1' },
  { activityType: 'new_construction_commercial', category: 'commercial', activityDescription: 'New commercial construction', zonesRequired: ['C-1', 'C-2', 'C-3', 'C-4', 'O-1', 'MX', 'MU', 'I-1', 'I-2', 'I-3'], zonesProhibited: [], feeBase: 1500.00, feePerSqft: 0.40, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'OBC 105.1' },
  { activityType: 'change_of_use', category: 'commercial', activityDescription: 'Change of occupancy/use', zonesRequired: ['*'], zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'OBC 105.1' },
  { activityType: 'sign', category: 'commercial', activityDescription: 'Sign installation', zonesRequired: ['*'], zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 7, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Local Sign Code' },

  // BUSINESS LICENSES
  { activityType: 'business_license', category: 'license', activityDescription: 'General business registration', zonesRequired: ['*'], zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 5, requiresPlans: false, requiresInspection: false, ordinanceRef: 'Local Business Ordinance' },
  { activityType: 'food_service', category: 'license', activityDescription: 'Food service establishment license', zonesRequired: ['C-1', 'C-2', 'C-3', 'C-4', 'MX', 'MU'], zonesProhibited: [], feeBase: 250.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Ohio Dept of Health' },
  { activityType: 'liquor_permit', category: 'license', activityDescription: 'Liquor permit (local approval)', zonesRequired: ['C-1', 'C-2', 'C-3', 'C-4', 'MX', 'MU'], zonesProhibited: [], feeBase: 500.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: false, ordinanceRef: 'ODLC' },
  { activityType: 'home_occupation', category: 'license', activityDescription: 'Home-based business', zonesRequired: ['R-1', 'R-2', 'R-3', 'R-4', 'R-5', 'RM'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 7, requiresPlans: false, requiresInspection: false, ordinanceRef: 'Local Zoning' },

  // SPECIAL USES
  { activityType: 'short_term_rental', category: 'license', activityDescription: 'Short-term rental registration', zonesRequired: ['*'], zonesProhibited: [], feeBase: 150.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: true, ordinanceRef: 'Local STR Ordinance' },
  { activityType: 'rental_registration', category: 'license', activityDescription: 'Rental property registration', zonesRequired: ['*'], zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 7, requiresPlans: false, requiresInspection: true, ordinanceRef: 'Local Rental Code' },
];

// Permit Exemptions (Ohio Building Code 105.2)
const OHIO_PERMIT_EXEMPTIONS = [
  { activity: 'fence_under_7ft', description: 'Fence 7 feet or under', maxValue: null, maxSqft: null, conditions: 'Must meet setback requirements', ordinanceRef: 'OBC 105.2' },
  { activity: 'shed_under_200sqft', description: 'Accessory structure under 200 sq ft', maxValue: null, maxSqft: 200, conditions: 'One story, no plumbing or electrical', ordinanceRef: 'OBC 105.2' },
  { activity: 'interior_paint', description: 'Interior painting and wallpapering', maxValue: null, maxSqft: null, conditions: null, ordinanceRef: 'OBC 105.2' },
  { activity: 'flooring', description: 'Flooring replacement', maxValue: null, maxSqft: null, conditions: 'No subfloor structural changes', ordinanceRef: 'OBC 105.2' },
  { activity: 'cabinets', description: 'Cabinet replacement', maxValue: null, maxSqft: null, conditions: 'No plumbing or electrical changes', ordinanceRef: 'OBC 105.2' },
  { activity: 'minor_repair', description: 'Minor repairs under $3,000', maxValue: 3000, maxSqft: null, conditions: 'Non-structural only', ordinanceRef: 'OBC 105.2' },
  { activity: 'landscaping', description: 'Landscaping', maxValue: null, maxSqft: null, conditions: 'No grading changes over 6 inches', ordinanceRef: 'OBC 105.2' },
  { activity: 'retaining_wall_under_4ft', description: 'Retaining wall under 4 feet', maxValue: null, maxSqft: null, conditions: 'No surcharge loads', ordinanceRef: 'OBC 105.2' },
  { activity: 'window_replacement', description: 'Window replacement (same size)', maxValue: null, maxSqft: null, conditions: 'Same size opening', ordinanceRef: 'OBC 105.2' },
  { activity: 'door_replacement', description: 'Door replacement (same size)', maxValue: null, maxSqft: null, conditions: 'Same size opening', ordinanceRef: 'OBC 105.2' },
  { activity: 'gutter', description: 'Gutter installation', maxValue: null, maxSqft: null, conditions: null, ordinanceRef: 'OBC 105.2' },
  { activity: 'deck_under_30in', description: 'Deck under 30 inches above grade', maxValue: null, maxSqft: 200, conditions: 'Under 200 sq ft, no roof', ordinanceRef: 'OBC 105.2' },
];

// Building Code Chunks (Ohio Building Code)
const OHIO_BUILDING_CODE_CHUNKS = [
  { codeType: 'state', section: 'OBC 105.1', title: 'Permit Required', content: 'Any owner or authorized agent who intends to construct, enlarge, alter, repair, move, demolish, or change the occupancy of a building or structure shall first make application to the building official and obtain the required permit.' },
  { codeType: 'state', section: 'OBC 105.2', title: 'Work Exempt from Permit', content: 'Exemptions include: One-story detached accessory structures not exceeding 200 square feet. Fences not over 7 feet high. Oil derricks. Retaining walls not over 4 feet. Water tanks. Painting, papering, tiling, carpeting. Temporary structures.' },
  { codeType: 'state', section: 'OBC 109.3', title: 'Building Permit Valuations', content: 'The applicant for a permit shall provide an estimated permit value at time of application. Permit valuations include total value of work, including materials and labor.' },
  { codeType: 'state', section: 'OBC 110.1', title: 'Inspections General', content: 'Construction or work for which a permit is required shall be subject to inspection by the building official. Required inspections include: footing and foundation, concrete slab, framing, mechanical rough-in, and final.' },
  { codeType: 'state', section: 'OBC Chapter 3', title: 'Use and Occupancy Classification', content: 'Buildings and structures shall be classified into groups based on their use or character of occupancy: Assembly (A), Business (B), Educational (E), Factory (F), High Hazard (H), Institutional (I), Mercantile (M), Residential (R), Storage (S), Utility (U).' },
];

// Ohio Metro Cities to seed
const OHIO_METRO_CITIES = [
  // Hamilton County
  { id: 'cincinnati-oh', name: 'Cincinnati', county: 'Hamilton' },
  { id: 'norwood-oh', name: 'Norwood', county: 'Hamilton' },
  { id: 'blue-ash-oh', name: 'Blue Ash', county: 'Hamilton' },
  { id: 'sharonville-oh', name: 'Sharonville', county: 'Hamilton' },
  { id: 'montgomery-oh', name: 'Montgomery', county: 'Hamilton' },
  { id: 'madeira-oh', name: 'Madeira', county: 'Hamilton' },
  { id: 'reading-oh', name: 'Reading', county: 'Hamilton' },
  { id: 'deer-park-oh', name: 'Deer Park', county: 'Hamilton' },
  { id: 'springdale-oh', name: 'Springdale', county: 'Hamilton' },
  { id: 'forest-park-oh', name: 'Forest Park', county: 'Hamilton' },
  // Warren County
  { id: 'mason-oh', name: 'Mason', county: 'Warren' },
  { id: 'lebanon-oh', name: 'Lebanon', county: 'Warren' },
  { id: 'loveland-oh', name: 'Loveland', county: 'Warren/Hamilton/Clermont' },
  // Butler County
  { id: 'hamilton-oh', name: 'Hamilton', county: 'Butler' },
  { id: 'fairfield-oh', name: 'Fairfield', county: 'Butler' },
  { id: 'middletown-oh', name: 'Middletown', county: 'Butler' },
  // Clermont County
  { id: 'milford-oh', name: 'Milford', county: 'Clermont' },
];

async function seedOhioMetroCities() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║  Ohio Metro Cities Seed                                                    ║
║                                                                            ║
║  Seeding zone definitions and permit requirements for ${OHIO_METRO_CITIES.length} cities         ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

  for (const city of OHIO_METRO_CITIES) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`🏛️  ${city.name}, OH (${city.id})`);
    console.log(`${'─'.repeat(60)}`);

    // Check if jurisdiction exists
    const jurisdiction = await prisma.jurisdiction.findUnique({
      where: { id: city.id },
    });

    if (!jurisdiction) {
      console.log(`   ⚠️ Jurisdiction not found - skipping`);
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
    for (const district of OHIO_ZONING_DISTRICTS) {
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
    for (const permit of OHIO_PERMIT_REQUIREMENTS) {
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
    for (const exemption of OHIO_PERMIT_EXEMPTIONS) {
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
    for (const chunk of OHIO_BUILDING_CODE_CHUNKS) {
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
  console.log(`✅ Ohio metro cities seed completed!`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`
Summary:
  - Cities seeded: ${OHIO_METRO_CITIES.length}
  - Zoning districts per city: ${OHIO_ZONING_DISTRICTS.length}
  - Permit requirements per city: ${OHIO_PERMIT_REQUIREMENTS.length}
  - Permit exemptions per city: ${OHIO_PERMIT_EXEMPTIONS.length}
  - Building code chunks per city: ${OHIO_BUILDING_CODE_CHUNKS.length}
`);
}

// Run
seedOhioMetroCities()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
