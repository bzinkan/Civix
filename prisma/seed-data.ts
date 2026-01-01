import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Cincinnati Zoning District Definitions
// Based on Cincinnati Zoning Code Chapter 1419
const ZONING_DISTRICTS = [
  // Single-Family Residential Districts
  { code: 'SF-20', name: 'Single-Family Residential - 20,000 sq ft', description: 'Low-density single-family residential. Minimum lot size 20,000 sq ft.' },
  { code: 'SF-10', name: 'Single-Family Residential - 10,000 sq ft', description: 'Low-density single-family residential. Minimum lot size 10,000 sq ft.' },
  { code: 'SF-6', name: 'Single-Family Residential - 6,000 sq ft', description: 'Medium-density single-family residential. Minimum lot size 6,000 sq ft.' },
  { code: 'SF-4', name: 'Single-Family Residential - 4,000 sq ft', description: 'Higher-density single-family residential. Minimum lot size 4,000 sq ft.' },
  { code: 'SF-2', name: 'Single-Family Residential - 2,000 sq ft', description: 'Urban single-family residential. Minimum lot size 2,000 sq ft.' },

  // Single-Family with Modifiers
  { code: 'SF-4-T', name: 'Single-Family Residential - Traditional', description: 'SF-4 with traditional neighborhood design standards.' },
  { code: 'SF-4-MH', name: 'Single-Family Residential - Mt. Healthy', description: 'SF-4 with Mt. Healthy overlay standards.' },
  { code: 'SF-6-T', name: 'Single-Family Residential - Traditional', description: 'SF-6 with traditional neighborhood design standards.' },
  { code: 'SF-6-MH', name: 'Single-Family Residential - Mt. Healthy', description: 'SF-6 with Mt. Healthy overlay standards.' },

  // Multi-Family Residential Districts
  { code: 'RM-0.7', name: 'Residential Multi-Family - 0.7 FAR', description: 'Low-density multi-family. Maximum FAR 0.7, up to 3 stories.' },
  { code: 'RM-1.2', name: 'Residential Multi-Family - 1.2 FAR', description: 'Medium-density multi-family. Maximum FAR 1.2, up to 4 stories.' },
  { code: 'RM-2.0', name: 'Residential Multi-Family - 2.0 FAR', description: 'Higher-density multi-family. Maximum FAR 2.0, up to 6 stories.' },
  { code: 'RM-1.2-T', name: 'Residential Multi-Family - Traditional', description: 'RM-1.2 with traditional neighborhood design standards.' },
  { code: 'RM-1.2-MH', name: 'Residential Multi-Family - Mt. Healthy', description: 'RM-1.2 with Mt. Healthy overlay standards.' },
  { code: 'RM-2.0-T', name: 'Residential Multi-Family - Traditional', description: 'RM-2.0 with traditional neighborhood design standards.' },

  // Residential Mixed-Use Districts
  { code: 'RMX', name: 'Residential Mixed-Use', description: 'Allows residential with limited commercial uses on ground floor.' },
  { code: 'RMX-T', name: 'Residential Mixed-Use - Traditional', description: 'RMX with traditional neighborhood design standards.' },
  { code: 'RMX-MH', name: 'Residential Mixed-Use - Mt. Healthy', description: 'RMX with Mt. Healthy overlay standards.' },

  // Commercial Districts
  { code: 'CC-A', name: 'Community Commercial - Auto-Oriented', description: 'Auto-oriented commercial with drive-through and parking-forward design.' },
  { code: 'CC-P', name: 'Community Commercial - Pedestrian', description: 'Pedestrian-oriented commercial with buildings at sidewalk.' },
  { code: 'CC-M', name: 'Community Commercial - Mixed', description: 'Mixed commercial allowing both auto and pedestrian-oriented development.' },
  { code: 'CN-P', name: 'Neighborhood Commercial - Pedestrian', description: 'Small-scale neighborhood commercial, pedestrian-oriented.' },
  { code: 'CN-M', name: 'Neighborhood Commercial - Mixed', description: 'Small-scale neighborhood commercial, mixed orientation.' },

  // Downtown/Urban Core Districts
  { code: 'DD-A', name: 'Downtown Development - A', description: 'Downtown core with highest density and intensity.' },
  { code: 'DD-B', name: 'Downtown Development - B', description: 'Downtown fringe with high density mixed-use.' },
  { code: 'DD-C', name: 'Downtown Development - C', description: 'Downtown transition with moderate density.' },

  // Office Districts
  { code: 'OL', name: 'Office - Limited', description: 'Low-intensity office uses, often transitional between residential and commercial.' },
  { code: 'OG', name: 'Office - General', description: 'General office uses with moderate intensity.' },

  // Industrial Districts
  { code: 'EG', name: 'Employment - General', description: 'Light industrial, warehousing, and employment uses.' },
  { code: 'EI', name: 'Employment - Intensive', description: 'Heavy industrial and intensive employment uses.' },

  // Special Districts
  { code: 'PR', name: 'Parks and Recreation', description: 'Public parks, recreation facilities, and open space.' },
  { code: 'PD', name: 'Planned Development', description: 'Planned unit development with negotiated standards.' },
  { code: 'IF', name: 'Institutional Facilities', description: 'Schools, hospitals, government buildings, religious institutions.' },

  // Transect-Based Districts (Form-Based Code)
  { code: 'T3-N', name: 'Transect 3 - Neighborhood', description: 'Sub-urban residential character, lower density.' },
  { code: 'T4-N', name: 'Transect 4 - Neighborhood', description: 'General urban residential character, moderate density.' },
  { code: 'T4-MS', name: 'Transect 4 - Main Street', description: 'Urban mixed-use main street character.' },
  { code: 'T5-N', name: 'Transect 5 - Neighborhood', description: 'Urban center residential, higher density.' },
  { code: 'T5-MS', name: 'Transect 5 - Main Street', description: 'Urban center main street, highest mixed-use intensity.' },
  { code: 'T5-MS-O', name: 'Transect 5 - Main Street - OTR', description: 'Over-the-Rhine specific urban main street standards.' },
  { code: 'T5-L', name: 'Transect 5 - Local', description: 'Urban center local street standards.' },
  { code: 'T6-N', name: 'Transect 6 - Neighborhood', description: 'Urban core, highest density residential.' },
  { code: 'T6-MS', name: 'Transect 6 - Main Street', description: 'Urban core main street, highest intensity.' },
];

// Cincinnati Permit Requirements
// Based on Cincinnati Building & Inspections Department
const PERMIT_REQUIREMENTS = [
  // Fences
  {
    activityType: 'fence',
    activityDescription: 'Installation of fence',
    zoneCode: null, // All zones
    requiresPermit: true,
    permitType: 'Building Permit',
    requirements: {
      maxHeightFront: 4,
      maxHeightSideRear: 6,
      setbackFromSidewalk: 0,
      materialRestrictions: ['No barbed wire in residential', 'No electrified fences in residential'],
    },
    estimatedFee: 75,
    processingDays: 5,
    documents: ['Site plan', 'Property survey'],
    ordinanceRef: 'CMC 1421-05',
  },
  {
    activityType: 'fence_over_6ft',
    activityDescription: 'Installation of fence over 6 feet',
    zoneCode: null,
    requiresPermit: true,
    permitType: 'Building Permit + Zoning Variance',
    requirements: {
      requiresVariance: true,
      boardReview: 'Board of Zoning Appeals',
    },
    estimatedFee: 350,
    processingDays: 45,
    documents: ['Site plan', 'Property survey', 'Variance application', 'Neighbor notification'],
    ordinanceRef: 'CMC 1421-05',
  },

  // Decks
  {
    activityType: 'deck',
    activityDescription: 'Construction of deck',
    zoneCode: null,
    requiresPermit: true,
    permitType: 'Building Permit',
    requirements: {
      maxHeight: 30,
      setbackSide: 3,
      setbackRear: 10,
      requiresRailing: true,
      railingHeight: 36,
      requiresInspection: true,
    },
    estimatedFee: 150,
    processingDays: 10,
    documents: ['Site plan', 'Construction drawings', 'Material specifications'],
    ordinanceRef: 'CMC 1101-33',
  },
  {
    activityType: 'deck_under_30_inches',
    activityDescription: 'Deck less than 30 inches above grade',
    zoneCode: null,
    requiresPermit: false,
    permitType: null,
    requirements: {
      maxHeightAboveGrade: 30,
      noRoofOrWalls: true,
    },
    estimatedFee: 0,
    processingDays: 0,
    documents: [],
    ordinanceRef: 'CMC 1101-33',
  },

  // Sheds and Accessory Structures
  {
    activityType: 'shed_under_120sqft',
    activityDescription: 'Storage shed under 120 square feet',
    zoneCode: null,
    requiresPermit: false,
    permitType: null,
    requirements: {
      maxSize: 120,
      maxHeight: 10,
      setbackSide: 3,
      setbackRear: 3,
      noPlumbing: true,
      noElectrical: true,
    },
    estimatedFee: 0,
    processingDays: 0,
    documents: [],
    ordinanceRef: 'CMC 1421-17',
  },
  {
    activityType: 'shed_over_120sqft',
    activityDescription: 'Storage shed 120 square feet or larger',
    zoneCode: null,
    requiresPermit: true,
    permitType: 'Building Permit',
    requirements: {
      setbackSide: 3,
      setbackRear: 3,
      maxLotCoverage: 0.3,
    },
    estimatedFee: 100,
    processingDays: 10,
    documents: ['Site plan', 'Construction drawings'],
    ordinanceRef: 'CMC 1421-17',
  },

  // Additions and Renovations
  {
    activityType: 'addition',
    activityDescription: 'Building addition',
    zoneCode: null,
    requiresPermit: true,
    permitType: 'Building Permit',
    requirements: {
      mustMeetSetbacks: true,
      mustMeetLotCoverage: true,
      structuralReviewRequired: true,
    },
    estimatedFee: 250,
    processingDays: 15,
    documents: ['Site plan', 'Floor plans', 'Elevations', 'Structural calculations', 'Energy compliance'],
    ordinanceRef: 'CMC 1101-33',
  },
  {
    activityType: 'interior_renovation',
    activityDescription: 'Interior renovation (non-structural)',
    zoneCode: null,
    requiresPermit: true,
    permitType: 'Building Permit',
    requirements: {
      nonStructural: true,
      noExteriorChanges: true,
    },
    estimatedFee: 125,
    processingDays: 7,
    documents: ['Floor plans', 'Scope of work description'],
    ordinanceRef: 'CMC 1101-33',
  },
  {
    activityType: 'electrical_work',
    activityDescription: 'Electrical installation or modification',
    zoneCode: null,
    requiresPermit: true,
    permitType: 'Electrical Permit',
    requirements: {
      licensedContractorRequired: true,
      inspectionRequired: true,
    },
    estimatedFee: 75,
    processingDays: 3,
    documents: ['Electrical plan', 'Load calculations'],
    ordinanceRef: 'CMC 1101-33',
  },
  {
    activityType: 'plumbing_work',
    activityDescription: 'Plumbing installation or modification',
    zoneCode: null,
    requiresPermit: true,
    permitType: 'Plumbing Permit',
    requirements: {
      licensedContractorRequired: true,
      inspectionRequired: true,
    },
    estimatedFee: 75,
    processingDays: 3,
    documents: ['Plumbing plan'],
    ordinanceRef: 'CMC 1101-33',
  },
  {
    activityType: 'hvac_work',
    activityDescription: 'HVAC installation or replacement',
    zoneCode: null,
    requiresPermit: true,
    permitType: 'Mechanical Permit',
    requirements: {
      licensedContractorRequired: true,
      inspectionRequired: true,
    },
    estimatedFee: 75,
    processingDays: 3,
    documents: ['Mechanical plan', 'Equipment specifications'],
    ordinanceRef: 'CMC 1101-33',
  },

  // Roofing and Siding
  {
    activityType: 'roof_replacement',
    activityDescription: 'Roof replacement (same material)',
    zoneCode: null,
    requiresPermit: true,
    permitType: 'Building Permit',
    requirements: {
      sameMaterial: true,
      maxLayers: 2,
    },
    estimatedFee: 100,
    processingDays: 3,
    documents: ['Scope of work'],
    ordinanceRef: 'CMC 1101-33',
  },
  {
    activityType: 'siding_replacement',
    activityDescription: 'Siding replacement',
    zoneCode: null,
    requiresPermit: true,
    permitType: 'Building Permit',
    requirements: {},
    estimatedFee: 75,
    processingDays: 3,
    documents: ['Scope of work', 'Material specifications'],
    ordinanceRef: 'CMC 1101-33',
  },

  // Historic District Requirements
  {
    activityType: 'exterior_work_historic',
    activityDescription: 'Exterior work in historic district',
    zoneCode: null,
    requiresPermit: true,
    permitType: 'Certificate of Appropriateness + Building Permit',
    requirements: {
      historicReviewRequired: true,
      reviewBoard: 'Historic Conservation Board',
      preservationStandards: 'Secretary of Interior Standards',
    },
    estimatedFee: 200,
    processingDays: 30,
    documents: ['Historic application', 'Photos of existing conditions', 'Proposed materials', 'Design drawings'],
    ordinanceRef: 'CMC 1435',
  },

  // Demolition
  {
    activityType: 'demolition',
    activityDescription: 'Building demolition',
    zoneCode: null,
    requiresPermit: true,
    permitType: 'Demolition Permit',
    requirements: {
      asbestosInspectionRequired: true,
      utilityDisconnectionRequired: true,
      historicReviewIfApplicable: true,
    },
    estimatedFee: 500,
    processingDays: 21,
    documents: ['Demolition plan', 'Asbestos survey', 'Utility disconnection confirmation', 'Site restoration plan'],
    ordinanceRef: 'CMC 1101-33',
  },

  // Swimming Pools
  {
    activityType: 'swimming_pool',
    activityDescription: 'Swimming pool installation',
    zoneCode: null,
    requiresPermit: true,
    permitType: 'Building Permit',
    requirements: {
      fenceRequired: true,
      fenceHeight: 48,
      selfClosingGate: true,
      setbackSide: 10,
      setbackRear: 10,
    },
    estimatedFee: 200,
    processingDays: 10,
    documents: ['Site plan', 'Pool specifications', 'Fence details', 'Electrical plan'],
    ordinanceRef: 'CMC 1421-19',
  },

  // Driveways and Parking
  {
    activityType: 'driveway',
    activityDescription: 'Driveway installation or replacement',
    zoneCode: null,
    requiresPermit: true,
    permitType: 'Right-of-Way Permit',
    requirements: {
      maxWidth: 24,
      approachRequired: true,
      drainageConsideration: true,
    },
    estimatedFee: 150,
    processingDays: 7,
    documents: ['Site plan', 'Driveway specifications'],
    ordinanceRef: 'CMC 723',
  },
  {
    activityType: 'parking_lot',
    activityDescription: 'Parking lot construction',
    zoneCode: null,
    requiresPermit: true,
    permitType: 'Building Permit + Zoning Certificate',
    requirements: {
      landscapingRequired: true,
      lightingStandards: true,
      stormwaterManagement: true,
      adaCompliance: true,
    },
    estimatedFee: 500,
    processingDays: 21,
    documents: ['Site plan', 'Grading plan', 'Landscaping plan', 'Lighting plan', 'Stormwater plan'],
    ordinanceRef: 'CMC 1425',
  },

  // Signs
  {
    activityType: 'sign_commercial',
    activityDescription: 'Commercial sign installation',
    zoneCode: null,
    requiresPermit: true,
    permitType: 'Sign Permit',
    requirements: {
      maxArea: 'Varies by zone',
      illuminationRestrictions: true,
    },
    estimatedFee: 100,
    processingDays: 7,
    documents: ['Sign design', 'Location plan', 'Structural details'],
    ordinanceRef: 'CMC 1431',
  },

  // Business Permits
  {
    activityType: 'home_occupation',
    activityDescription: 'Home-based business',
    zoneCode: null,
    requiresPermit: true,
    permitType: 'Zoning Certificate',
    requirements: {
      noExternalEvidence: true,
      noEmployees: true,
      noRetailSales: true,
      maxArea: 0.25,
    },
    estimatedFee: 50,
    processingDays: 5,
    documents: ['Application', 'Business description'],
    ordinanceRef: 'CMC 1419-15',
  },
  {
    activityType: 'restaurant',
    activityDescription: 'Restaurant or food service establishment',
    zoneCode: null,
    requiresPermit: true,
    permitType: 'Zoning Certificate + Health Permit + Building Permit',
    requirements: {
      healthDepartmentApproval: true,
      greaseTrap: true,
      parkingRequired: true,
      fireSuppressionIfApplicable: true,
    },
    estimatedFee: 750,
    processingDays: 30,
    documents: ['Floor plan', 'Equipment layout', 'Ventilation plan', 'Parking calculation'],
    ordinanceRef: 'CMC 1419',
  },
  {
    activityType: 'retail_store',
    activityDescription: 'Retail store',
    zoneCode: null,
    requiresPermit: true,
    permitType: 'Zoning Certificate',
    requirements: {
      parkingRequired: true,
      signageRestrictions: true,
    },
    estimatedFee: 150,
    processingDays: 10,
    documents: ['Floor plan', 'Parking calculation'],
    ordinanceRef: 'CMC 1419',
  },
  {
    activityType: 'daycare',
    activityDescription: 'Daycare or childcare facility',
    zoneCode: null,
    requiresPermit: true,
    permitType: 'Zoning Certificate + State License',
    requirements: {
      outdoorPlayArea: true,
      dropOffArea: true,
      stateInspection: true,
    },
    estimatedFee: 250,
    processingDays: 21,
    documents: ['Floor plan', 'Site plan', 'State application'],
    ordinanceRef: 'CMC 1419',
  },

  // ADUs and Multi-Family Conversions
  {
    activityType: 'adu',
    activityDescription: 'Accessory Dwelling Unit',
    zoneCode: null,
    requiresPermit: true,
    permitType: 'Zoning Certificate + Building Permit',
    requirements: {
      maxSize: 800,
      ownerOccupancy: true,
      parkingRequired: true,
      setbackCompliance: true,
    },
    estimatedFee: 350,
    processingDays: 21,
    documents: ['Site plan', 'Floor plans', 'Elevations', 'Parking plan'],
    ordinanceRef: 'CMC 1421-21',
  },
  {
    activityType: 'duplex_conversion',
    activityDescription: 'Single-family to duplex conversion',
    zoneCode: null,
    requiresPermit: true,
    permitType: 'Zoning Certificate + Building Permit',
    requirements: {
      zoneMustAllow: true,
      separateEntrances: true,
      parkingRequired: true,
      fireRatingRequired: true,
    },
    estimatedFee: 500,
    processingDays: 30,
    documents: ['Site plan', 'Floor plans', 'Fire separation details', 'Parking plan'],
    ordinanceRef: 'CMC 1419',
  },
];

// Building Code Chunks (Ohio Building Code based on IBC 2021)
const BUILDING_CODE_CHUNKS = [
  // General Requirements
  {
    codeType: 'OBC',
    codeYear: '2024',
    section: '101',
    title: 'General - Scope and Application',
    content: `The Ohio Building Code (OBC) applies to the construction, alteration, movement, enlargement, replacement, repair, equipment, use and occupancy, location, maintenance, removal and demolition of every building or structure or any appurtenances connected or attached to such buildings or structures. Existing buildings undergoing repair, alterations, or additions shall comply with Section 3401. This code shall apply to matters governing the construction and renovation of buildings and structures in the State of Ohio.`,
  },
  {
    codeType: 'OBC',
    codeYear: '2024',
    section: '105.1',
    title: 'Permits Required',
    content: `Any owner or owner's authorized agent who intends to construct, enlarge, alter, repair, move, demolish, or change the occupancy of a building or structure, or to erect, install, enlarge, alter, repair, remove, convert or replace any electrical, gas, mechanical or plumbing system, the installation of which is regulated by this code, or to cause any such work to be performed, shall first make application to the building official and obtain the required permit.`,
  },
  {
    codeType: 'OBC',
    codeYear: '2024',
    section: '105.2',
    title: 'Work Exempt from Permit',
    content: `Permits shall not be required for the following: 1. One-story detached accessory structures used as tool and storage sheds, playhouses and similar uses, provided the floor area is not greater than 120 square feet (11.15 m²). 2. Fences not over 7 feet (2134 mm) high. 3. Retaining walls that are not over 4 feet (1219 mm) in height measured from the bottom of the footing to the top of the wall, unless supporting a surcharge. 4. Water tanks supported directly upon grade if the capacity does not exceed 5,000 gallons (18,927 L). 5. Sidewalks and driveways. 6. Painting, papering, tiling, carpeting, cabinets, countertops and similar finish work. 7. Prefabricated swimming pools accessory to Group R-3 that are less than 24 inches deep. 8. Swings and other playground equipment. 9. Window awnings supported by an exterior wall that do not project more than 54 inches from the exterior wall. 10. Decks not exceeding 200 square feet in area, that are not more than 30 inches above grade at any point.`,
  },

  // Occupancy Classifications
  {
    codeType: 'OBC',
    codeYear: '2024',
    section: '302',
    title: 'Occupancy Classification',
    content: `Structures or portions of structures shall be classified into occupancy groups: Assembly (A-1 through A-5), Business (B), Educational (E), Factory (F-1, F-2), High Hazard (H-1 through H-5), Institutional (I-1 through I-4), Mercantile (M), Residential (R-1 through R-4), Storage (S-1, S-2), and Utility (U). Where a structure is proposed for a purpose not specifically provided for, the building official shall classify it based on most similar listed use.`,
  },
  {
    codeType: 'OBC',
    codeYear: '2024',
    section: '310.4',
    title: 'Residential Group R-3',
    content: `Residential Group R-3 occupancy includes: Buildings that do not contain more than two dwelling units. Adult care facilities that provide accommodations for five or fewer persons. Child care facilities that provide accommodations for five or fewer persons. Congregate living facilities with 16 or fewer persons. Lodging houses. One- and two-family dwellings complying with the International Residential Code are permitted to be constructed in accordance with that code.`,
  },

  // Building Heights and Areas
  {
    codeType: 'OBC',
    codeYear: '2024',
    section: '504',
    title: 'Building Height',
    content: `The height and number of stories of a building shall be governed by the intended use or occupancy of the building, the type of construction, whether automatic sprinkler system is provided, and the building's fire area. Building height shall be measured from grade plane to the average height of the highest roof surface. Heights are determined per Table 504.3 based on construction type and occupancy.`,
  },
  {
    codeType: 'OBC',
    codeYear: '2024',
    section: '506',
    title: 'Building Area',
    content: `The building area shall not exceed the limits specified in Table 506.2 based on the building type of construction and occupancy classification. Allowable area increases are permitted for frontage (street or open space) and automatic sprinkler system installation. The allowable area per story (Aa) is calculated as: Aa = At + [At × If] + [At × Is], where At is the tabular area, If is the area increase factor for frontage, and Is is the area increase factor for sprinklers.`,
  },

  // Fire Protection
  {
    codeType: 'OBC',
    codeYear: '2024',
    section: '903.2',
    title: 'Automatic Sprinkler Systems Required',
    content: `An automatic sprinkler system shall be provided throughout buildings and structures as specified in Sections 903.2.1 through 903.2.12. Sprinklers are required in: Group A occupancies with fire area exceeding 12,000 sq ft or occupant load over 300. Group E occupancies with fire area exceeding 12,000 sq ft. Group F-1 occupancies with fire area exceeding 12,000 sq ft. Group H occupancies. Group I occupancies. Group M occupancies exceeding 12,000 sq ft. Group R-1 and R-2 occupancies. Group S-1 occupancies exceeding 12,000 sq ft.`,
  },
  {
    codeType: 'OBC',
    codeYear: '2024',
    section: '907.2',
    title: 'Fire Alarm Systems Required',
    content: `Fire alarm systems shall be installed in accordance with NFPA 72 and shall be provided in new buildings and structures in accordance with Sections 907.2.1 through 907.2.23. A fire alarm system is required in: Group A with occupant load of 300 or more. Group B with occupant load of 500 or more. Group E. Group F with occupant load of 500 or more. Group H. Group I. Group M with occupant load of 500 or more. Group R-1. Group R-2 with more than 16 dwelling units.`,
  },

  // Means of Egress
  {
    codeType: 'OBC',
    codeYear: '2024',
    section: '1003',
    title: 'General Means of Egress Requirements',
    content: `Buildings or portions thereof shall be provided with a means of egress system. The means of egress shall consist of three separate and distinct parts: exit access, the exit, and the exit discharge. A means of egress shall be provided from every occupied portion of a building or structure. Means of egress components shall be designed and constructed in accordance with this chapter. The means of egress shall be illuminated, marked, and maintained.`,
  },
  {
    codeType: 'OBC',
    codeYear: '2024',
    section: '1006.2',
    title: 'Minimum Number of Exits',
    content: `Every story or occupied roof shall be provided with the minimum number of exits or access to exits based on occupant load: 1-500 occupants requires 2 exits; 501-1,000 requires 3 exits; More than 1,000 requires 4 exits. Single exits are permitted in specific circumstances for stories with occupant loads not exceeding Table 1006.2.1 limits and where travel distance does not exceed limits in Table 1006.2.1.`,
  },
  {
    codeType: 'OBC',
    codeYear: '2024',
    section: '1011',
    title: 'Stairways',
    content: `Stairways shall have a minimum width of 44 inches (1118 mm). Stairways serving an occupant load of less than 50 may have a minimum width of 36 inches (914 mm). The maximum riser height is 7 inches (178 mm) and minimum is 4 inches (102 mm). Minimum tread depth is 11 inches (279 mm). Stair landings shall have a depth not less than the width of the stairway. Handrails shall be provided on both sides of stairways.`,
  },

  // Accessibility
  {
    codeType: 'OBC',
    codeYear: '2024',
    section: '1103',
    title: 'Accessibility Requirements - Scoping',
    content: `Sites, buildings, structures, facilities, elements and spaces shall be accessible to persons with physical disabilities as specified in Chapter 11. Accessible routes shall be provided from public transportation stops, accessible parking, accessible passenger loading zones, and public streets or sidewalks to the accessible building entrance. At least one accessible route shall connect accessible buildings, facilities, elements and spaces on the same site.`,
  },
  {
    codeType: 'OBC',
    codeYear: '2024',
    section: '1107',
    title: 'Accessible Dwelling Units and Sleeping Units',
    content: `Accessible units and Type A and Type B dwelling units shall be provided in accordance with this section. In Group R-2 occupancies with more than 20 dwelling units, at least 2% of dwelling units shall be Type A units. In Group R-2 occupancies, all units on the ground floor and all units in buildings with elevators shall be Type B units. Type A units shall comply with ICC A117.1 Section 1002. Type B units shall comply with ICC A117.1 Section 1003.`,
  },

  // Energy Conservation
  {
    codeType: 'IECC',
    codeYear: '2024',
    section: 'R402',
    title: 'Residential Building Thermal Envelope',
    content: `The building thermal envelope shall meet the requirements of Sections R402.1 through R402.5. Climate Zone 5 (Cincinnati area) insulation requirements: Ceiling R-49, Wood frame wall R-20 or 13+5, Mass wall R-13 or 15, Floor R-30, Basement wall R-10 or 13, Slab R-10 for 2 ft, Crawlspace wall R-10. Fenestration U-factor maximum 0.30, SHGC maximum NR. Air leakage maximum 5 ACH50.`,
  },
  {
    codeType: 'IECC',
    codeYear: '2024',
    section: 'R403',
    title: 'Systems - Mechanical',
    content: `Mechanical systems shall be designed and installed in accordance with this section. Heating and cooling equipment shall be sized per ACCA Manual S or equivalent. Duct insulation: Supply ducts in unconditioned spaces R-8, return ducts R-6. All ducts shall be sealed with mastic, mastic plus embedded fabric, or UL 181-rated tape. Building cavities shall not be used as supply ducts. Mechanical ventilation shall comply with Section R403.6.`,
  },

  // Plumbing
  {
    codeType: 'OPC',
    codeYear: '2024',
    section: '301',
    title: 'General Plumbing Regulations',
    content: `Plumbing systems shall be designed and installed in accordance with this code. All plumbing work shall be performed by licensed plumbers. Permits are required for plumbing installations, alterations, or extensions. Water supply systems shall be designed to provide adequate pressure and flow to all fixtures. Drainage systems shall be designed to convey waste water to approved disposal facilities. Venting systems shall be provided to protect trap seals.`,
  },
  {
    codeType: 'OPC',
    codeYear: '2024',
    section: '405',
    title: 'Water Heaters',
    content: `Water heaters shall be installed in accordance with manufacturer's instructions and this code. Water heaters shall have temperature and pressure relief valves. Relief valve discharge shall terminate to a safe location. Water heaters in garages shall be protected from vehicle impact and elevated 18 inches minimum if fuel-fired. Expansion tanks shall be provided on closed water supply systems. Water heaters shall be accessible for service and replacement.`,
  },

  // Electrical
  {
    codeType: 'NEC',
    codeYear: '2023',
    section: '210',
    title: 'Branch Circuits',
    content: `Branch circuits shall be rated in accordance with the maximum permitted ampere rating or setting of the overcurrent device. Standard branch circuit ratings are 15, 20, 30, 40, and 50 amperes. Dwelling unit branch circuit requirements: Kitchen small appliance circuits - two 20A circuits. Bathroom receptacle circuit - 20A. Laundry circuit - 20A. General lighting circuits per NEC 220.12. GFCI protection required in bathrooms, kitchens, garages, outdoors, crawlspaces, and unfinished basements.`,
  },
  {
    codeType: 'NEC',
    codeYear: '2023',
    section: '220',
    title: 'Branch Circuit, Feeder, and Service Calculations',
    content: `The minimum service for a single-family dwelling is 100 amperes, 3-wire. General lighting load: 3 VA per square foot of floor area. Small appliance load: 1,500 VA per circuit (minimum 2 circuits). Laundry circuit: 1,500 VA. Appliances at nameplate rating. After first 10 kVA of general lighting and small appliance load, remainder at 40%. Heating and cooling loads at 100% of largest plus 65% of others.`,
  },

  // Residential Code Specifics
  {
    codeType: 'ORC',
    codeYear: '2024',
    section: 'R301',
    title: 'Design Criteria',
    content: `Buildings and structures shall be designed and constructed to safely support all loads. Design loads for Cincinnati, Ohio (Hamilton County): Ground snow load 20 psf, Wind speed 115 mph, Seismic Design Category A, Frost line depth 32 inches, Termite damage probability moderate to heavy, Decay probability slight to moderate, Winter design temperature 6°F, Ice shield underlayment required. Wood foundation systems are not permitted in Climate Zone 5 unless designed by a registered design professional.`,
  },
  {
    codeType: 'ORC',
    codeYear: '2024',
    section: 'R302',
    title: 'Fire-Resistant Construction',
    content: `Exterior walls less than 3 feet from property line shall have 1-hour fire-resistance rating. Projections shall not extend beyond the point of lot line distance. Openings in exterior walls less than 3 feet from property line are prohibited. Dwelling-garage separation: 1/2-inch gypsum board on garage side of common walls, 5/8-inch Type X for ceiling if habitable space above. Self-closing door between dwelling and garage. Attached garage floor 4 inches below dwelling floor or sloped away.`,
  },
  {
    codeType: 'ORC',
    codeYear: '2024',
    section: 'R311',
    title: 'Means of Egress',
    content: `All dwelling units shall have at least one exit door meeting requirements. Exit door minimum width 32 inches clear, minimum height 6 feet 8 inches. Landings required at exterior doors, minimum 36 inches x 36 inches. Emergency escape and rescue openings required in basements and sleeping rooms: minimum net clear opening 5.7 sq ft (5.0 sq ft at grade), minimum width 20 inches, minimum height 24 inches, maximum sill height 44 inches. Bars or grilles must be releasable from inside without tools or keys.`,
  },
  {
    codeType: 'ORC',
    codeYear: '2024',
    section: 'R313',
    title: 'Automatic Fire Sprinkler Systems',
    content: `Ohio has adopted a local option for residential sprinklers. Cincinnati does not require automatic fire sprinkler systems in one- and two-family dwellings. When sprinkler systems are installed, they shall comply with NFPA 13D or Section P2904. Sprinkler systems may be required by other conditions such as increased building area or height allowances, or fire department access limitations.`,
  },
  {
    codeType: 'ORC',
    codeYear: '2024',
    section: 'R403',
    title: 'Footings',
    content: `Footings shall be designed and constructed in accordance with this section. Minimum footing depth is 32 inches below finish grade (frost line for Cincinnati). Minimum footing width: 12 inches for conventional light-frame construction. Footings shall bear on undisturbed soil or engineered fill. Stepped footings shall be provided on sloped sites. Footings shall not bear on frozen soil. Concrete strength minimum 2,500 psi (3,000 psi for exposed concrete).`,
  },
];

async function seed() {
  console.log('Starting database seed...\n');

  // Get Cincinnati jurisdiction
  const jurisdiction = await prisma.jurisdiction.findFirst({
    where: { name: 'Cincinnati' },
  });

  if (!jurisdiction) {
    console.error('Cincinnati jurisdiction not found! Please create it first.');
    process.exit(1);
  }

  console.log(`Found jurisdiction: ${jurisdiction.name}, ${jurisdiction.state}\n`);

  // Seed Zoning Districts
  console.log('Seeding Zoning Districts...');
  let districtCount = 0;
  for (const district of ZONING_DISTRICTS) {
    await prisma.zoningDistrict.upsert({
      where: {
        id: `${jurisdiction.id}-${district.code}`,
      },
      create: {
        id: `${jurisdiction.id}-${district.code}`,
        code: district.code,
        name: `${district.name} - ${district.description}`,
        jurisdictionId: jurisdiction.id,
      },
      update: {
        name: `${district.name} - ${district.description}`,
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
        zoneCode: permit.zoneCode,
        requiresPermit: permit.requiresPermit,
        permitType: permit.permitType,
        requirements: permit.requirements,
        estimatedFee: permit.estimatedFee,
        processingDays: permit.processingDays,
        documents: permit.documents,
        ordinanceRef: permit.ordinanceRef,
      },
    });
    permitCount++;
  }
  console.log(`✓ Seeded ${permitCount} permit requirements\n`);

  // Seed Building Code Chunks
  console.log('Seeding Building Code Chunks...');
  let codeCount = 0;
  for (const chunk of BUILDING_CODE_CHUNKS) {
    await prisma.buildingCodeChunk.create({
      data: {
        jurisdictionId: jurisdiction.id,
        codeType: chunk.codeType,
        codeYear: chunk.codeYear,
        section: chunk.section,
        title: chunk.title,
        content: chunk.content,
      },
    });
    codeCount++;
  }
  console.log(`✓ Seeded ${codeCount} building code chunks\n`);

  console.log('Database seed completed successfully!');
  console.log(`Summary:
  - Zoning Districts: ${districtCount}
  - Permit Requirements: ${permitCount}
  - Building Code Chunks: ${codeCount}
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
