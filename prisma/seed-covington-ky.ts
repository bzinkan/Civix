import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Covington, KY Zoning Districts (Neighborhood Development Code - Chapter 158)
// Based on character-based zoning system adopted in Commissioners' Ordinance O-22-20
// Source: https://online.encodeplus.com/regs/covington-ky/
const ZONING_DISTRICTS = [
  // RESIDENTIAL DISTRICTS
  { code: 'RR', name: 'Rural Residential', category: 'residential', description: 'Rural character with large lots and agricultural uses', minLotSqft: 40000, maxLotCoverage: 0.20, maxHeightFt: 35, maxStories: 2.5, frontSetbackFt: 50, sideSetbackFt: 20, rearSetbackFt: 40, maxFar: null, allowedUses: ['single_family_home', 'home_occupation', 'agricultural'] },
  { code: 'SR', name: 'Suburban Residential', category: 'residential', description: 'Suburban single-family character with moderate lot sizes', minLotSqft: 12500, maxLotCoverage: 0.35, maxHeightFt: 35, maxStories: 2.5, frontSetbackFt: 30, sideSetbackFt: 8, rearSetbackFt: 30, maxFar: null, allowedUses: ['single_family_home', 'home_occupation', 'accessory_dwelling_unit'] },
  { code: 'SU', name: 'Semi-Urban Residential', category: 'residential', description: 'Semi-urban residential with smaller lots, may include duplexes', minLotSqft: 6000, maxLotCoverage: 0.45, maxHeightFt: 35, maxStories: 2.5, frontSetbackFt: 20, sideSetbackFt: 5, rearSetbackFt: 25, maxFar: null, allowedUses: ['single_family_home', 'two_family', 'home_occupation', 'accessory_dwelling_unit'] },
  { code: 'TUR', name: 'Traditional Urban Residential', category: 'residential', description: 'Traditional urban residential neighborhoods with historic character', minLotSqft: 3000, maxLotCoverage: 0.50, maxHeightFt: 40, maxStories: 3, frontSetbackFt: 10, sideSetbackFt: 3, rearSetbackFt: 20, maxFar: 1.5, allowedUses: ['single_family_home', 'two_family', 'townhouse', 'apartment_small', 'home_occupation'] },

  // MIXED USE DISTRICTS
  { code: 'TUMU', name: 'Traditional Urban Mixed Use', category: 'mixed_use', description: 'Urban mixed-use with ground floor commercial and upper floor residential', minLotSqft: 2000, maxLotCoverage: 0.80, maxHeightFt: 50, maxStories: 4, frontSetbackFt: 0, sideSetbackFt: 0, rearSetbackFt: 10, maxFar: 3.0, allowedUses: ['retail', 'restaurant', 'office', 'personal_service', 'residential_upper_floors', 'live_work'] },
  { code: 'CMU', name: 'Commercial Mixed Use', category: 'mixed_use', description: 'Commercial mixed use with variety of commercial and residential uses', minLotSqft: 5000, maxLotCoverage: 0.70, maxHeightFt: 55, maxStories: 5, frontSetbackFt: 10, sideSetbackFt: 5, rearSetbackFt: 15, maxFar: 2.5, allowedUses: ['retail', 'restaurant', 'office', 'hotel', 'apartment', 'entertainment'] },

  // DOWNTOWN DISTRICTS
  { code: 'DTC', name: 'Downtown Core', category: 'downtown', description: 'Downtown core with highest density and intensity of uses', minLotSqft: 0, maxLotCoverage: 1.00, maxHeightFt: null, maxStories: null, frontSetbackFt: 0, sideSetbackFt: 0, rearSetbackFt: 0, maxFar: 10.0, allowedUses: ['office', 'retail', 'restaurant', 'hotel', 'residential', 'entertainment', 'parking_structure'] },
  { code: 'DTR', name: 'Downtown Riverfront', category: 'downtown', description: 'Downtown riverfront mixed-use development', minLotSqft: 0, maxLotCoverage: 0.90, maxHeightFt: 120, maxStories: 12, frontSetbackFt: 0, sideSetbackFt: 0, rearSetbackFt: 0, maxFar: 8.0, allowedUses: ['office', 'retail', 'restaurant', 'hotel', 'residential', 'entertainment', 'marina'] },
  { code: 'CRM', name: 'Central Riverfront Mixed-Use', category: 'downtown', description: 'Central riverfront area with mixed commercial and recreational uses', minLotSqft: 0, maxLotCoverage: 0.85, maxHeightFt: 85, maxStories: 8, frontSetbackFt: 0, sideSetbackFt: 0, rearSetbackFt: 10, maxFar: 6.0, allowedUses: ['office', 'retail', 'restaurant', 'hotel', 'residential', 'recreation'] },

  // COMMERCIAL DISTRICTS
  { code: 'AUC', name: 'Auto-Urban Commercial', category: 'commercial', description: 'Auto-oriented commercial uses along major corridors', minLotSqft: 10000, maxLotCoverage: 0.50, maxHeightFt: 45, maxStories: 3, frontSetbackFt: 25, sideSetbackFt: 10, rearSetbackFt: 20, maxFar: 1.0, allowedUses: ['retail', 'restaurant', 'auto_service', 'gas_station', 'drive_through', 'big_box_retail'] },
  { code: 'SO', name: 'Suburban Office', category: 'commercial', description: 'Suburban office and professional services', minLotSqft: 15000, maxLotCoverage: 0.40, maxHeightFt: 50, maxStories: 4, frontSetbackFt: 30, sideSetbackFt: 15, rearSetbackFt: 25, maxFar: 1.5, allowedUses: ['office', 'medical_office', 'bank', 'personal_service'] },

  // INDUSTRIAL DISTRICTS
  { code: 'SI', name: 'Suburban Industrial', category: 'industrial', description: 'Suburban industrial and business park uses', minLotSqft: 20000, maxLotCoverage: 0.50, maxHeightFt: 50, maxStories: 4, frontSetbackFt: 30, sideSetbackFt: 15, rearSetbackFt: 25, maxFar: 1.0, allowedUses: ['light_industrial', 'warehouse', 'office', 'flex_space'] },
  { code: 'LI', name: 'Limited Industrial', category: 'industrial', description: 'Limited industrial with minimal external impacts', minLotSqft: 15000, maxLotCoverage: 0.55, maxHeightFt: 55, maxStories: 4, frontSetbackFt: 25, sideSetbackFt: 10, rearSetbackFt: 20, maxFar: 1.5, allowedUses: ['light_industrial', 'manufacturing', 'warehouse', 'distribution', 'office'] },
  { code: 'GI', name: 'General Industrial', category: 'industrial', description: 'General industrial with heavy manufacturing', minLotSqft: 20000, maxLotCoverage: 0.60, maxHeightFt: 65, maxStories: 5, frontSetbackFt: 30, sideSetbackFt: 15, rearSetbackFt: 30, maxFar: 2.0, allowedUses: ['manufacturing', 'heavy_industrial', 'warehouse', 'distribution'] },

  // SPECIAL DISTRICTS
  { code: 'RP', name: 'Resource Protection', category: 'special', description: 'Conservation and resource protection areas', minLotSqft: null, maxLotCoverage: 0.05, maxHeightFt: 25, maxStories: 1, frontSetbackFt: 50, sideSetbackFt: 25, rearSetbackFt: 50, maxFar: 0.05, allowedUses: ['conservation', 'passive_recreation', 'agricultural'] },
  { code: 'REC', name: 'Recreation', category: 'special', description: 'Parks and recreational facilities', minLotSqft: null, maxLotCoverage: 0.20, maxHeightFt: 35, maxStories: 2, frontSetbackFt: 25, sideSetbackFt: 15, rearSetbackFt: 25, maxFar: 0.2, allowedUses: ['park', 'recreation_facility', 'community_center', 'sports_facility'] },
];

// Covington Permit Requirements (based on scraped ordinances)
// Kentucky uses state building codes with local amendments
const PERMIT_REQUIREMENTS = [
  // RESIDENTIAL BUILDING PERMITS
  { activityType: 'deck', category: 'building', activityDescription: 'Deck construction or replacement', zonesRequired: ['*'], zonesProhibited: [], feeBase: 75.00, feePerSqft: 0.15, processingDays: 5, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KBC 105.1' },
  { activityType: 'fence', category: 'building', activityDescription: 'Fence installation (over 6ft or front yard)', zonesRequired: ['*'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 3, requiresPlans: false, requiresInspection: true, ordinanceRef: 'COV 158.04' },
  { activityType: 'shed', category: 'building', activityDescription: 'Accessory structure under 200 sq ft', zonesRequired: ['*'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 3, requiresPlans: false, requiresInspection: true, ordinanceRef: 'KBC 105.2' },
  { activityType: 'accessory_structure', category: 'building', activityDescription: 'Accessory structure over 200 sq ft', zonesRequired: ['*'], zonesProhibited: [], feeBase: 100.00, feePerSqft: 0.20, processingDays: 7, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KBC 105.1' },
  { activityType: 'addition', category: 'building', activityDescription: 'Home addition', zonesRequired: ['*'], zonesProhibited: [], feeBase: 150.00, feePerSqft: 0.25, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KBC 105.1' },
  { activityType: 'basement_finish', category: 'building', activityDescription: 'Finishing basement space', zonesRequired: ['*'], zonesProhibited: [], feeBase: 100.00, feePerSqft: 0.10, processingDays: 7, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KBC 105.1' },
  { activityType: 'garage', category: 'building', activityDescription: 'Garage construction', zonesRequired: ['*'], zonesProhibited: [], feeBase: 125.00, feePerSqft: 0.20, processingDays: 10, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KBC 105.1' },
  { activityType: 'pool', category: 'building', activityDescription: 'Swimming pool installation', zonesRequired: ['*'], zonesProhibited: [], feeBase: 150.00, feePerSqft: null, processingDays: 10, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KBC 105.1' },
  { activityType: 'demolition', category: 'building', activityDescription: 'Structure demolition', zonesRequired: ['*'], zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KBC 105.1' },
  { activityType: 'new_construction_residential', category: 'building', activityDescription: 'New residential construction', zonesRequired: ['*'], zonesProhibited: ['GI', 'LI', 'SI'], feeBase: 500.00, feePerSqft: 0.30, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KBC 105.1' },

  // TRADE PERMITS
  { activityType: 'electrical', category: 'trade', activityDescription: 'Electrical work', zonesRequired: ['*'], zonesProhibited: [], feeBase: 60.00, feePerSqft: null, processingDays: 3, requiresPlans: false, requiresInspection: true, ordinanceRef: 'KBC Chapter 27' },
  { activityType: 'plumbing', category: 'trade', activityDescription: 'Plumbing work', zonesRequired: ['*'], zonesProhibited: [], feeBase: 60.00, feePerSqft: null, processingDays: 3, requiresPlans: false, requiresInspection: true, ordinanceRef: 'KBC Chapter 29' },
  { activityType: 'hvac', category: 'trade', activityDescription: 'HVAC installation/replacement', zonesRequired: ['*'], zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 3, requiresPlans: false, requiresInspection: true, ordinanceRef: 'KBC Chapter 28' },
  { activityType: 'roofing', category: 'trade', activityDescription: 'Roof replacement', zonesRequired: ['*'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 2, requiresPlans: false, requiresInspection: true, ordinanceRef: 'KBC 105.1' },

  // COMMERCIAL PERMITS
  { activityType: 'tenant_buildout', category: 'commercial', activityDescription: 'Commercial tenant improvement', zonesRequired: ['TUMU', 'CMU', 'DTC', 'DTR', 'CRM', 'AUC', 'SO'], zonesProhibited: [], feeBase: 200.00, feePerSqft: 0.20, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KBC 105.1' },
  { activityType: 'new_construction_commercial', category: 'commercial', activityDescription: 'New commercial construction', zonesRequired: ['TUMU', 'CMU', 'DTC', 'DTR', 'CRM', 'AUC', 'SO', 'SI', 'LI', 'GI'], zonesProhibited: [], feeBase: 1000.00, feePerSqft: 0.35, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KBC 105.1' },
  { activityType: 'change_of_use', category: 'commercial', activityDescription: 'Change of occupancy/use', zonesRequired: ['*'], zonesProhibited: [], feeBase: 150.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'KBC 105.1' },
  { activityType: 'sign', category: 'commercial', activityDescription: 'Sign installation', zonesRequired: ['*'], zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 7, requiresPlans: true, requiresInspection: true, ordinanceRef: 'COV 158.05' },

  // BUSINESS LICENSES (Covington specific - Chapter 110 & 127)
  { activityType: 'business_license', category: 'license', activityDescription: 'General business license (occupational license)', zonesRequired: ['*'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 5, requiresPlans: false, requiresInspection: false, ordinanceRef: 'COV 110' },
  { activityType: 'food_service', category: 'license', activityDescription: 'Food service establishment', zonesRequired: ['TUMU', 'CMU', 'DTC', 'DTR', 'CRM', 'AUC'], zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'Northern KY Health Dept' },
  { activityType: 'liquor_permit', category: 'license', activityDescription: 'Liquor permit (local approval)', zonesRequired: ['TUMU', 'CMU', 'DTC', 'DTR', 'CRM', 'AUC'], zonesProhibited: [], feeBase: 500.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: false, ordinanceRef: 'COV 112' },
  { activityType: 'home_occupation', category: 'license', activityDescription: 'Home-based business', zonesRequired: ['RR', 'SR', 'SU', 'TUR'], zonesProhibited: [], feeBase: 25.00, feePerSqft: null, processingDays: 7, requiresPlans: false, requiresInspection: false, ordinanceRef: 'COV 158.04' },

  // SHORT-TERM RENTAL (Chapter 127 - detailed requirements)
  { activityType: 'short_term_rental', category: 'license', activityDescription: 'Short-term rental license (Airbnb, VRBO)', zonesRequired: ['*'], zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: true, ordinanceRef: 'COV 127.05' },
  { activityType: 'short_term_rental_host_occupied', category: 'license', activityDescription: 'Host-occupied short-term rental', zonesRequired: ['*'], zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: true, ordinanceRef: 'COV 127.05' },
  { activityType: 'short_term_rental_non_host', category: 'license', activityDescription: 'Non-host-occupied short-term rental', zonesRequired: ['*'], zonesProhibited: [], feeBase: 300.00, feePerSqft: null, processingDays: 21, requiresPlans: false, requiresInspection: true, ordinanceRef: 'COV 127.05' },

  // RENTAL DWELLING LICENSE (Chapter 155)
  { activityType: 'rental_registration', category: 'license', activityDescription: 'Rental dwelling license', zonesRequired: ['*'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 7, requiresPlans: false, requiresInspection: true, ordinanceRef: 'COV 155.05' },

  // HISTORIC DISTRICT (Chapter 159)
  { activityType: 'historic_coa', category: 'special', activityDescription: 'Certificate of Appropriateness (Historic District)', zonesRequired: ['*'], zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: false, ordinanceRef: 'COV 159' },
];

// Permit Exemptions
const PERMIT_EXEMPTIONS = [
  { activity: 'fence_under_6ft', description: 'Fence 6 feet or under in rear/side yard', maxValue: null, maxSqft: null, conditions: 'Rear and side yards only', ordinanceRef: 'KBC 105.2' },
  { activity: 'fence_under_4ft', description: 'Fence 4 feet or under in front yard', maxValue: null, maxSqft: null, conditions: 'Front yard fences', ordinanceRef: 'KBC 105.2' },
  { activity: 'shed_under_120sqft', description: 'Accessory structure under 120 sq ft, one story', maxValue: null, maxSqft: 120, conditions: 'One story, no plumbing or electrical', ordinanceRef: 'KBC 105.2' },
  { activity: 'interior_paint', description: 'Interior painting and wallpapering', maxValue: null, maxSqft: null, conditions: null, ordinanceRef: 'KBC 105.2' },
  { activity: 'flooring', description: 'Flooring replacement (no structural changes)', maxValue: null, maxSqft: null, conditions: 'No subfloor structural modifications', ordinanceRef: 'KBC 105.2' },
  { activity: 'cabinets', description: 'Cabinet replacement (no plumbing/electrical)', maxValue: null, maxSqft: null, conditions: 'No plumbing or electrical changes', ordinanceRef: 'KBC 105.2' },
  { activity: 'minor_repair', description: 'Minor repairs under $2,500', maxValue: 2500, maxSqft: null, conditions: 'Non-structural work only', ordinanceRef: 'KBC 105.2' },
  { activity: 'landscaping', description: 'Landscaping and gardening', maxValue: null, maxSqft: null, conditions: 'No grading changes over 4 inches', ordinanceRef: 'KBC 105.2' },
  { activity: 'retaining_wall_under_4ft', description: 'Retaining wall under 4 feet', maxValue: null, maxSqft: null, conditions: 'No surcharge loads', ordinanceRef: 'KBC 105.2' },
  { activity: 'window_replacement', description: 'Window replacement (same size opening)', maxValue: null, maxSqft: null, conditions: 'Same size opening, no structural changes', ordinanceRef: 'KBC 105.2' },
  { activity: 'door_replacement', description: 'Door replacement (same size opening)', maxValue: null, maxSqft: null, conditions: 'Same size opening, no structural changes', ordinanceRef: 'KBC 105.2' },
  { activity: 'gutter', description: 'Gutter installation/replacement', maxValue: null, maxSqft: null, conditions: null, ordinanceRef: 'KBC 105.2' },
  { activity: 'appliance_replacement', description: 'Like-for-like appliance replacement', maxValue: null, maxSqft: null, conditions: 'No new circuits or gas lines', ordinanceRef: 'KBC 105.2' },
  { activity: 'deck_under_30in', description: 'Deck less than 30 inches above grade', maxValue: null, maxSqft: 200, conditions: 'Under 200 sq ft, no roof', ordinanceRef: 'KBC 105.2' },
];

// Building Code Chunks (Kentucky Building Code + Covington Local)
const BUILDING_CODE_CHUNKS = [
  // GENERAL BUILDING
  { codeType: 'state', section: 'KBC 105.1', title: 'Permit Required', content: 'Any owner or authorized agent who intends to construct, enlarge, alter, repair, move, demolish, or change the occupancy of a building shall first make application to the building official and obtain the required permit.' },
  { codeType: 'state', section: 'KBC 105.2', title: 'Work Exempt from Permit', content: 'Exemptions include: One-story detached accessory structures not exceeding 120 square feet. Fences not over 6 feet high. Retaining walls not over 4 feet. Painting, papering, tiling, carpeting and similar finish work. Temporary structures.' },

  // COVINGTON SHORT-TERM RENTAL
  { codeType: 'local', section: 'COV 127.01', title: 'Short-Term Rental Purpose', content: 'It is the purpose of this chapter to promote the health, safety, and welfare of residents and of occupants of short-term rental dwellings in the city. The regulation will protect the residential character of Covington\'s residential neighborhoods and preserve the character of the city\'s historic districts.' },
  { codeType: 'local', section: 'COV 127.02', title: 'Short-Term Rental Definitions', content: 'SHORT-TERM RENTAL: Any residential dwelling unit offered for rent for a duration of occupancy of less than 30 consecutive days. HOST-OCCUPIED: A short-term rental that is the primary residence of the host who is also the record owner. NON-HOST-OCCUPIED: A short-term rental that is not the primary residence of the host.' },
  { codeType: 'local', section: 'COV 127.03', title: 'Unlicensed STR Prohibited', content: 'It shall be unlawful for any owner or person to list or advertise an unlicensed short-term rental on a hosting platform.' },
  { codeType: 'local', section: 'COV 127.06', title: 'STR Ownership Limits', content: 'Owners are limited in the number of non-host-occupied short-term rental licenses they may hold within the city. Limits help preserve housing stock for residents.' },
  { codeType: 'local', section: 'COV 127.07', title: 'STR Density Limits', content: 'Density limits apply to non-host-occupied short-term rentals per block face to prevent over-concentration and maintain neighborhood character.' },
  { codeType: 'local', section: 'COV 127.10', title: 'Short-Term Rental Agent', content: 'Each short-term rental must have a designated rental agent who can respond to complaints within 60 minutes. The host may serve as the rental agent.' },
  { codeType: 'local', section: 'COV 127.12', title: 'STR Operating Regulations', content: 'Operating regulations include occupancy limits, noise restrictions, parking requirements, and prohibition on events/parties. Must post license and emergency contact information.' },

  // RENTAL DWELLING LICENSE
  { codeType: 'local', section: 'COV 155.01', title: 'Rental Dwelling Purpose', content: 'All persons renting residential property in the city must obtain a rental dwelling license. The city\'s intent is to ensure that rental housing is safe, sanitary and properly operated.' },
  { codeType: 'local', section: 'COV 155.05', title: 'Rental Dwelling License Required', content: 'A rental dwelling license is required for any residential structure that the owner rents or leases to the public for residential purposes. Inspection required before license issuance.' },
  { codeType: 'local', section: 'COV 155.06', title: 'Rental License Fees', content: 'Rental dwelling license fees are established by the city. Licenses are valid for one year and must be renewed annually. Inspection fees may apply.' },

  // PROPERTY MAINTENANCE
  { codeType: 'local', section: 'COV 152', title: 'Property Maintenance Code', content: 'The city has adopted the International Property Maintenance Code for the maintenance of existing residential and nonresidential structures. All buildings must be maintained in a safe and sanitary condition.' },

  // HISTORIC DISTRICTS
  { codeType: 'local', section: 'COV 159', title: 'Historic Covington Design Guidelines', content: 'Properties in designated historic districts require Certificate of Appropriateness for exterior changes. The Historic Preservation Board reviews applications. Changes must be consistent with the historic character of the district.' },

  // NEIGHBORHOOD DEVELOPMENT CODE
  { codeType: 'local', section: 'COV 158.02', title: 'Character Districts', content: 'Covington uses character-based zoning with 16 distinct districts: RR (Rural Residential), SR (Suburban Residential), SU (Semi-Urban Residential), TUR (Traditional Urban Residential), TUMU (Traditional Urban Mixed Use), CMU (Commercial Mixed Use), DTC (Downtown Core), DTR (Downtown Riverfront), CRM (Central Riverfront Mixed-Use), AUC (Auto-Urban Commercial), SO (Suburban Office), SI (Suburban Industrial), LI (Limited Industrial), GI (General Industrial), RP (Resource Protection), and REC (Recreation).' },
];

// Common Questions for Covington
const COMMON_QUESTIONS = [
  { question: 'Do I need a license to rent my property on Airbnb in Covington?', category: 'str', answer: 'Yes, all short-term rentals (less than 30 days) in Covington require a license. Host-occupied rentals cost $100/year, non-host-occupied cost $300/year. You must pass an inspection and designate a rental agent who can respond within 60 minutes to complaints.', relatedPermits: ['short_term_rental'], ordinanceRef: 'COV 127' },
  { question: 'What is the difference between host-occupied and non-host-occupied STR?', category: 'str', answer: 'Host-occupied means the property is your primary residence and you live there. Non-host-occupied means you don\'t live at the property. Non-host-occupied rentals have ownership limits, density restrictions by block face, and higher fees ($300 vs $100).', relatedPermits: ['short_term_rental_host_occupied', 'short_term_rental_non_host'], ordinanceRef: 'COV 127.02' },
  { question: 'Do I need a license to rent out my house long-term in Covington?', category: 'rental', answer: 'Yes, all rental properties in Covington require a Rental Dwelling License. The license costs $50 per year and requires passing an inspection. This applies to single-family homes, duplexes, and apartment units.', relatedPermits: ['rental_registration'], ordinanceRef: 'COV 155' },
  { question: 'What permits do I need to build a deck in Covington?', category: 'deck', answer: 'You need a building permit for deck construction. The fee is $75 base plus $0.15 per square foot. Plans are required showing dimensions and construction details. Decks under 200 sq ft and less than 30 inches above grade may be exempt.', relatedPermits: ['deck'], ordinanceRef: 'KBC 105.1' },
  { question: 'Can I run a business from my home in Covington?', category: 'home_occupation', answer: 'Yes, home occupations are permitted in residential zones (RR, SR, SU, TUR). Requirements include: no exterior evidence of business, limited customer visits, no non-resident employees, no outdoor storage. Registration costs $25.', relatedPermits: ['home_occupation'], ordinanceRef: 'COV 158.04' },
  { question: 'What are Covington\'s zoning districts?', category: 'zoning', answer: 'Covington uses character-based zoning with 16 districts: Residential (RR, SR, SU, TUR), Mixed Use (TUMU, CMU), Downtown (DTC, DTR, CRM), Commercial (AUC, SO), Industrial (SI, LI, GI), and Special (RP, REC). Each has specific allowed uses and development standards.', relatedPermits: [], ordinanceRef: 'COV 158.02' },
  { question: 'Do I need approval for exterior changes in Covington\'s historic districts?', category: 'historic', answer: 'Yes, properties in designated historic districts require a Certificate of Appropriateness from the Historic Preservation Board for exterior changes including paint colors, windows, doors, siding, and roofing materials. There is no fee for the application.', relatedPermits: ['historic_coa'], ordinanceRef: 'COV 159' },
  { question: 'What building code does Covington use?', category: 'building', answer: 'Covington follows the Kentucky Building Code (KBC), which is based on the International Building Code with state amendments. The city also has local ordinances for specific requirements like short-term rentals and rental licensing.', relatedPermits: [], ordinanceRef: 'KBC' },
  { question: 'How tall can my fence be in Covington?', category: 'fence', answer: 'Front yard fences can be maximum 4 feet tall. Side and rear yard fences can be maximum 6 feet tall. Fences under 6 feet in rear/side yards typically don\'t need a permit. Check with the city for historic district requirements.', relatedPermits: ['fence'], ordinanceRef: 'COV 158.04' },
  { question: 'What is the occupancy limit for short-term rentals in Covington?', category: 'str', answer: 'Occupancy is limited based on the sleeping accommodations of the unit. Generally 2 persons per bedroom plus 2 additional. No events or parties are permitted. The specific limit will be stated on your license.', relatedPermits: ['short_term_rental'], ordinanceRef: 'COV 127.12' },
];

async function seed() {
  console.log('Starting Covington, KY data seed...\n');

  // Get Covington jurisdiction
  const jurisdiction = await prisma.jurisdiction.findFirst({
    where: { id: 'covington-ky' },
  });

  if (!jurisdiction) {
    console.error('Covington jurisdiction not found! Please run seed-jurisdictions first.');
    process.exit(1);
  }

  console.log(`Found jurisdiction: ${jurisdiction.name}, ${jurisdiction.state} (ID: ${jurisdiction.id})\n`);

  // Clear existing data
  console.log('Clearing existing Covington data...');
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

  // Update jurisdiction status to 'live'
  console.log('Updating jurisdiction status...');
  await prisma.jurisdiction.update({
    where: { id: jurisdiction.id },
    data: {
      status: 'live',
      dataCompleteness: 80, // 80% complete (no GIS polygons yet)
    },
  });
  console.log('✓ Updated Covington status to "live"\n');

  console.log('='.repeat(50));
  console.log('Covington, KY data seed completed successfully!');
  console.log('='.repeat(50));
  console.log(`
Summary:
  - Zoning Districts: ${districtCount}
  - Permit Requirements: ${permitCount}
  - Permit Exemptions: ${exemptionCount}
  - Building Code Chunks: ${codeCount}
  - Common Questions: ${questionCount}
  - Status: live (80% complete)

Note: Zoning GIS polygons not yet loaded. Address-to-zone lookup
will not work until LINK-GIS polygon data is acquired.
Contact LINK-GIS (859.331.8980) for zoning shapefile access.
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
