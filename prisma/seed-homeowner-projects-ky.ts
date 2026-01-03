import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Kentucky Homeowner Projects Seed Data
 *
 * Covers Northern Kentucky counties: Boone, Kenton, Campbell
 * Uses Kentucky Building Code and local zoning ordinances
 *
 * Key differences from Ohio:
 * - Kentucky Residential Code (based on IRC)
 * - Different frost line depth (24" vs Ohio's 32")
 * - Different permit thresholds in some jurisdictions
 * - County-based building departments
 */

// Kentucky zone codes
const KY_RESIDENTIAL_ZONES = ['RR', 'SR', 'SU', 'TUR', 'MUR'];
const KY_MIXED_USE_ZONES = ['TUMU', 'CMU', 'DTC', 'DTR', 'CRM'];
const KY_ALL_ZONES = ['*'];

// Homeowner Project Permit Requirements - Kentucky
const HOMEOWNER_PERMIT_REQUIREMENTS_KY = [
  {
    activityType: 'Deck Construction (KY)',
    category: 'Homeowner Projects',
    activityDescription: 'Building a new deck or significantly modifying an existing deck attached to a residential structure in Northern Kentucky',
    zonesRequired: [...KY_RESIDENTIAL_ZONES, ...KY_MIXED_USE_ZONES],
    zonesProhibited: ['SI', 'LI', 'GI'],
    feeBase: 125,
    processingDays: 14,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Kentucky Residential Code R507; Local Building Code',
    requirements: [
      'Building permit required for decks over 200 sq ft or over 30" above grade',
      'Site plan showing property lines and setbacks',
      'Construction drawings with dimensions',
      'Ledger board attachment details',
      'Post and beam sizing per span tables',
      'Guardrail required if deck is 30"+ above grade (36" min height)',
      'Frost line depth: 24 inches in Northern Kentucky',
      'Meet setback requirements (typically 3-5 feet from property line)',
      'Footing, framing, and final inspections required',
      'Check with Boone/Kenton/Campbell County building dept'
    ]
  },
  {
    activityType: 'Fence Installation (KY)',
    category: 'Homeowner Projects',
    activityDescription: 'Installing a new fence on residential property in Northern Kentucky',
    zonesRequired: [...KY_RESIDENTIAL_ZONES, ...KY_MIXED_USE_ZONES],
    zonesProhibited: [],
    feeBase: 50,
    processingDays: 7,
    requiresPlans: false,
    requiresInspection: false,
    ordinanceRef: 'Local Zoning Ordinance',
    requirements: [
      'Permit requirements vary by city (Covington, Newport, Florence differ)',
      'Maximum height: typically 4 feet front yard, 6 feet side/rear',
      'Setback from property line varies by jurisdiction',
      'Good neighbor side facing outward',
      'Cannot obstruct sight lines at intersections',
      'HOA approval may be required in subdivisions',
      'Call 811 before digging for utility locate',
      'Pool fences have additional requirements (48" min height)',
      'Property survey recommended'
    ]
  },
  {
    activityType: 'Shed or Detached Building (KY)',
    category: 'Homeowner Projects',
    activityDescription: 'Building or installing a storage shed, workshop, or other detached accessory structure in Northern Kentucky',
    zonesRequired: [...KY_RESIDENTIAL_ZONES, ...KY_MIXED_USE_ZONES],
    zonesProhibited: [],
    feeBase: 75,
    processingDays: 14,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Kentucky Residential Code R105.2; Local Zoning',
    requirements: [
      'Permit often required if over 120-200 sq ft (varies by jurisdiction)',
      'Check with your county building department for specific threshold',
      'Must meet accessory structure setbacks',
      'Cannot be in front yard',
      'Maximum height restrictions apply',
      'Cannot exceed lot coverage limits',
      'Electrical permit required if adding power',
      'Cannot be used as dwelling without separate permits',
      'HOA restrictions may apply'
    ]
  },
  {
    activityType: 'Swimming Pool Installation (KY)',
    category: 'Homeowner Projects',
    activityDescription: 'Installing an in-ground or above-ground swimming pool in Northern Kentucky',
    zonesRequired: [...KY_RESIDENTIAL_ZONES, ...KY_MIXED_USE_ZONES],
    zonesProhibited: [],
    feeBase: 200,
    processingDays: 21,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Kentucky Building Code; ISPSC',
    requirements: [
      'Building permit required for pools over 24" deep',
      'Site plan showing pool location and setbacks',
      'Pool barrier required - minimum 48 inches height',
      'Self-closing, self-latching gates required',
      'Electrical permit for pump/lighting (GFCI required)',
      'Plumbing permit for water/drain connections',
      'Anti-entrapment drain covers required (VGBA compliant)',
      'Cannot be located over easements',
      'Northern Kentucky Health Dept requirements for larger pools',
      'Fence must fully enclose pool area'
    ]
  },
  {
    activityType: 'Hot Tub/Spa Installation (KY)',
    category: 'Homeowner Projects',
    activityDescription: 'Installing a hot tub or spa on residential property in Northern Kentucky',
    zonesRequired: [...KY_RESIDENTIAL_ZONES, ...KY_MIXED_USE_ZONES],
    zonesProhibited: [],
    feeBase: 75,
    processingDays: 14,
    requiresPlans: false,
    requiresInspection: true,
    ordinanceRef: 'Kentucky Building Code; NEC Article 680',
    requirements: [
      'Electrical permit required (dedicated 240V circuit)',
      'GFCI protection required',
      'Minimum clearances from overhead power lines',
      'Lockable cover required/recommended',
      'Deck must support weight (filled spa = 3000+ lbs)',
      'Proper drainage away from foundation',
      'HOA approval may be required',
      'Check setback requirements'
    ]
  },
  {
    activityType: 'Accessory Dwelling Unit (KY)',
    category: 'Homeowner Projects',
    activityDescription: 'Adding a secondary dwelling unit (in-law suite, garage apartment) in Northern Kentucky',
    zonesRequired: ['TUR', 'MUR', 'TUMU', 'CMU'],
    zonesProhibited: ['RR', 'SR', 'SU', 'SI', 'LI', 'GI'],
    feeBase: 400,
    processingDays: 45,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Local Zoning Code; Kentucky Building Code',
    requirements: [
      'Zoning approval required - not allowed in all zones',
      'Check with Covington/Newport/your city for ADU rules',
      'Many NKY jurisdictions are adopting ADU ordinances',
      'Size limits typically 800-1000 sq ft or % of main house',
      'May require conditional use permit',
      'Full building plans required',
      'Must meet all building codes',
      'Separate entrance required',
      'Parking requirements (typically 1 space)',
      'May require owner occupancy in main house or ADU'
    ]
  },
  {
    activityType: 'Garage Construction (KY)',
    category: 'Homeowner Projects',
    activityDescription: 'Building a new detached garage or carport in Northern Kentucky',
    zonesRequired: [...KY_RESIDENTIAL_ZONES, ...KY_MIXED_USE_ZONES],
    zonesProhibited: [],
    feeBase: 250,
    processingDays: 21,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Kentucky Residential Code; Local Zoning',
    requirements: [
      'Building permit required',
      'Site plan showing setbacks and lot coverage',
      'Construction drawings with structural details',
      'Foundation permit and inspection',
      'Meet accessory structure setbacks',
      'Height restrictions apply (typically 20 feet max)',
      'Electrical permit if wiring for power',
      'Cannot be used for habitation',
      'Fire separation requirements if near property line',
      'Driveway permit may be required'
    ]
  },
  {
    activityType: 'Patio or Concrete Work (KY)',
    category: 'Homeowner Projects',
    activityDescription: 'Installing a patio, concrete driveway, or walkway in Northern Kentucky',
    zonesRequired: [...KY_RESIDENTIAL_ZONES, ...KY_MIXED_USE_ZONES],
    zonesProhibited: [],
    feeBase: 50,
    processingDays: 7,
    requiresPlans: false,
    requiresInspection: false,
    ordinanceRef: 'Local Building and Zoning Codes',
    requirements: [
      'Permit often required for driveways and large patios',
      'May affect impervious surface limits',
      'Must maintain proper drainage',
      'Driveway width restrictions may apply',
      'Call 811 before excavation',
      'Right-of-way permit if modifying curb cut',
      'HOA approval may be required',
      'Some jurisdictions require permits over certain size'
    ]
  },
  {
    activityType: 'Retaining Wall (KY)',
    category: 'Homeowner Projects',
    activityDescription: 'Building a retaining wall to manage grade changes in Northern Kentucky',
    zonesRequired: [...KY_RESIDENTIAL_ZONES, ...KY_MIXED_USE_ZONES],
    zonesProhibited: [],
    feeBase: 125,
    processingDays: 14,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Kentucky Building Code',
    requirements: [
      'Permit required for walls over 4 feet high',
      'Engineered plans required for walls over 4 feet',
      'Drainage behind wall required',
      'Cannot redirect water to neighboring properties',
      'Setback requirements apply',
      'Footing depth must reach below frost line (24")',
      'May require geotechnical report for tall walls'
    ]
  },
  {
    activityType: 'Basement Finishing (KY)',
    category: 'Homeowner Projects',
    activityDescription: 'Converting unfinished basement to living space in Northern Kentucky',
    zonesRequired: [...KY_RESIDENTIAL_ZONES, ...KY_MIXED_USE_ZONES],
    zonesProhibited: [],
    feeBase: 175,
    processingDays: 14,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Kentucky Residential Code',
    requirements: [
      'Building permit required',
      'Plans showing proposed layout',
      'Electrical permit for new circuits',
      'Plumbing permit if adding bathroom',
      'Minimum ceiling height 7 feet (6\'8" under beams)',
      'Egress window required for bedrooms (5.7 sq ft min opening)',
      'Smoke and CO detectors required',
      'HVAC considerations',
      'Framing, electrical, plumbing, final inspections'
    ]
  },
  {
    activityType: 'Roof Replacement (KY)',
    category: 'Homeowner Projects',
    activityDescription: 'Replacing roofing materials on a residential structure in Northern Kentucky',
    zonesRequired: [...KY_RESIDENTIAL_ZONES, ...KY_MIXED_USE_ZONES],
    zonesProhibited: [],
    feeBase: 75,
    processingDays: 7,
    requiresPlans: false,
    requiresInspection: true,
    ordinanceRef: 'Kentucky Residential Code R905',
    requirements: [
      'Permit typically required',
      'Maximum 2 layers of shingles',
      'Ice and water shield required at eaves',
      'Proper ventilation required',
      'Licensed contractor recommended',
      'Proper disposal of old materials',
      'HOA may have restrictions',
      'Historic districts have additional requirements'
    ]
  },
  {
    activityType: 'Solar Panel Installation (KY)',
    category: 'Homeowner Projects',
    activityDescription: 'Installing rooftop or ground-mounted solar panels in Northern Kentucky',
    zonesRequired: KY_ALL_ZONES,
    zonesProhibited: [],
    feeBase: 175,
    processingDays: 21,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Kentucky Building Code; NEC Article 690',
    requirements: [
      'Building permit required',
      'Electrical permit required',
      'Structural analysis for roof systems',
      'Electrical plans showing system layout',
      'Interconnection agreement with utility (Duke Energy, etc.)',
      'Net metering application to utility',
      'Kentucky does not have strong HOA solar protections like Ohio',
      'Ground-mounted systems have setback requirements',
      'Fire department access requirements',
      'Federal tax credits available (30% as of 2024)'
    ]
  },
  {
    activityType: 'HVAC System Replacement (KY)',
    category: 'Homeowner Projects',
    activityDescription: 'Replacing furnace, air conditioner, or heat pump in Northern Kentucky',
    zonesRequired: KY_ALL_ZONES,
    zonesProhibited: [],
    feeBase: 75,
    processingDays: 7,
    requiresPlans: false,
    requiresInspection: true,
    ordinanceRef: 'Kentucky Mechanical Code',
    requirements: [
      'Mechanical permit required',
      'Must be installed by licensed HVAC contractor',
      'Proper sizing (Manual J calculation)',
      'Ductwork modifications may need separate permit',
      'Gas line permit if modifying gas piping',
      'Refrigerant handling by EPA-certified technician',
      'Final inspection required',
      'Duke Energy/utility rebates may be available'
    ]
  },
  {
    activityType: 'Water Heater Replacement (KY)',
    category: 'Homeowner Projects',
    activityDescription: 'Replacing residential water heater in Northern Kentucky',
    zonesRequired: KY_ALL_ZONES,
    zonesProhibited: [],
    feeBase: 50,
    processingDays: 3,
    requiresPlans: false,
    requiresInspection: true,
    ordinanceRef: 'Kentucky Plumbing Code',
    requirements: [
      'Plumbing permit typically required',
      'Gas permit if gas water heater',
      'Electrical permit if upgrading electric service',
      'Expansion tank may be required',
      'Proper venting for gas units',
      'T&P relief valve required with proper discharge',
      'Licensed plumber recommended'
    ]
  }
];

// Building Codes - Kentucky Homeowner Projects
const HOMEOWNER_BUILDING_CODES_KY = [
  {
    codeSection: 'Deck Guardrails (KY)',
    category: 'Homeowner Projects',
    codeText: 'Guards required on open sides of decks more than 30 inches above grade. Minimum height 36 inches for residential. Balusters spaced maximum 4 inches apart. Must support 200 lb concentrated load at any point.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Kentucky Residential Code R312'
  },
  {
    codeSection: 'Frost Line Depth (KY)',
    category: 'Homeowner Projects',
    codeText: 'Northern Kentucky frost line depth is 24 inches. All footings for decks, fences, and structures must extend below this depth to prevent frost heave. This is shallower than Ohio (32 inches).',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Kentucky Residential Code R403'
  },
  {
    codeSection: 'Pool Barrier Requirements (KY)',
    category: 'Homeowner Projects',
    codeText: 'Swimming pools must have barrier at least 48 inches high with no openings allowing passage of 4-inch sphere. Gates must be self-closing and self-latching with latch at least 54 inches above grade or on pool side.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Kentucky Building Code; ISPSC'
  },
  {
    codeSection: 'Egress Window Requirements (KY)',
    category: 'Homeowner Projects',
    codeText: 'Basement and sleeping room emergency escape openings: minimum 5.7 sq ft net clear opening (5.0 sq ft at grade), minimum width 20 inches, minimum height 24 inches, maximum sill height 44 inches above floor.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Kentucky Residential Code R310'
  },
  {
    codeSection: 'Accessory Structure Setbacks (KY)',
    category: 'Homeowner Projects',
    codeText: 'Detached accessory structures typically require 3-5 foot setback from property lines depending on jurisdiction. Cannot be in front yard. Check local zoning for specific requirements in Boone, Kenton, or Campbell County.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Local Zoning Ordinance'
  },
  {
    codeSection: 'Smoke and CO Detectors (KY)',
    category: 'Homeowner Projects',
    codeText: 'Smoke alarms required in each sleeping room, outside sleeping areas, and on each level. CO detectors required on each level with fuel-burning appliances or attached garage. Required when finishing basement or adding bedrooms.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Kentucky Residential Code R314, R315'
  }
];

// Common Questions - Kentucky Homeowner Projects
const HOMEOWNER_COMMON_QUESTIONS_KY = [
  {
    question: 'Do I need a permit to build a deck in Northern Kentucky?',
    answer: 'In most Northern Kentucky jurisdictions, yes. Permits are typically required for decks over 200 square feet or more than 30 inches above grade. Check with your county building department: Boone County Building Inspection, Kenton County Inspection, or Campbell County Building. You\'ll need plans showing dimensions, materials, and attachment to the house. Inspections are required. Frost depth is 24 inches (shallower than Ohio).',
    category: 'Homeowner Projects',
    tags: ['deck', 'permit', 'northern kentucky', 'building']
  },
  {
    question: 'What permits do I need for a pool in Boone/Kenton/Campbell County?',
    answer: 'Installing a pool requires: 1) Building permit from your county; 2) Electrical permit for pump and lighting; 3) Plumbing permit for water connections; 4) Required barrier/fence permit. Pool fences must be 48 inches minimum with self-closing, self-latching gates. Contact your county building department - requirements are similar across NKY but fees vary. Northern Kentucky Health Department has requirements for larger pools.',
    category: 'Homeowner Projects',
    tags: ['pool', 'permit', 'fence', 'northern kentucky']
  },
  {
    question: 'How close to the property line can I build a fence in Kentucky?',
    answer: 'Fence setbacks vary by city in Northern Kentucky. Generally: most areas allow fences on or near the property line in side/rear yards, but you\'re responsible for ensuring it\'s on YOUR property. Front yard fences often have setbacks and height limits (usually 4 feet max). Covington, Newport, and other cities have different ordinances. Get a survey before building near the property line. HOAs may have additional restrictions.',
    category: 'Homeowner Projects',
    tags: ['fence', 'property line', 'setback', 'kentucky']
  },
  {
    question: 'Do I need a permit for a shed in Northern Kentucky?',
    answer: 'Permit requirements vary by county and city. Generally: sheds under 120-200 sq ft used only for storage may be exempt, but you still must follow zoning rules (setbacks, not in front yard, lot coverage limits). Larger sheds require permits. If adding electricity, you need an electrical permit regardless of size. Check with Boone, Kenton, or Campbell County building department for your specific jurisdiction.',
    category: 'Homeowner Projects',
    tags: ['shed', 'permit', 'accessory', 'kentucky']
  },
  {
    question: 'Can I build an ADU (accessory dwelling unit) in Northern Kentucky?',
    answer: 'ADU rules vary by city in Northern Kentucky. Covington has been updating its zoning to allow ADUs in some zones. Newport and other cities have different regulations. Many traditional single-family zones don\'t allow second dwelling units. You\'ll typically need zoning approval, building permits, and must meet all building codes. Check with your specific city\'s planning department - ADU policies are evolving across the region.',
    category: 'Homeowner Projects',
    tags: ['adu', 'accessory dwelling', 'kentucky', 'zoning']
  },
  {
    question: 'What is the frost line depth in Northern Kentucky?',
    answer: 'The frost line depth in Northern Kentucky is 24 inches, which is shallower than Ohio (32 inches). All footings for decks, fences, gazebos, and other structures must extend below this depth to prevent frost heave. This affects foundation design and construction costs. Your permit inspector will verify footing depth during inspection.',
    category: 'Homeowner Projects',
    tags: ['frost line', 'footing', 'depth', 'kentucky']
  },
  {
    question: 'Do I need a permit to finish my basement in Kentucky?',
    answer: 'Yes, finishing a basement requires permits in Northern Kentucky. You need: building permit for the work, electrical permit for new circuits/outlets, plumbing permit if adding bathroom. Key requirements: minimum 7-foot ceiling height, egress window in any bedroom (5.7 sq ft minimum opening), smoke and CO detectors. Inspections are required at framing, electrical rough-in, and final stages.',
    category: 'Homeowner Projects',
    tags: ['basement', 'finish', 'permit', 'kentucky']
  },
  {
    question: 'Can my HOA stop me from installing solar panels in Kentucky?',
    answer: 'Unlike Ohio, Kentucky does not have strong state-level protections for solar panel installation against HOA restrictions. HOAs in Kentucky can potentially prohibit or significantly restrict solar panels through their CC&Rs. Review your HOA documents before investing in solar. Some newer developments have solar-friendly provisions, but many older HOAs have broad architectural control. This is an area where Kentucky differs significantly from Ohio.',
    category: 'Homeowner Projects',
    tags: ['solar', 'hoa', 'kentucky', 'restrictions']
  },
  {
    question: 'Where do I get building permits in Kenton County?',
    answer: 'Building permits in Kenton County are obtained from: 1) Kenton County Building Inspection Department for unincorporated areas; 2) Individual city building departments for incorporated areas (Covington, Erlanger, Independence, etc.). Covington has its own building department. Some smaller cities contract with the county. Contact Kenton County at (859) 392-1900 or check their website for applications and fee schedules.',
    category: 'Homeowner Projects',
    tags: ['permits', 'kenton county', 'building department', 'kentucky']
  },
  {
    question: 'Do I need a permit to replace my roof in Northern Kentucky?',
    answer: 'Yes, most Northern Kentucky jurisdictions require permits for roof replacement. The permit ensures: proper installation, adequate ventilation, ice and water shield at eaves, and no more than 2 layers of shingles. Fees are typically $50-100. The permit also documents the work for insurance and resale purposes. Historic districts in Covington and Newport may have additional material requirements.',
    category: 'Homeowner Projects',
    tags: ['roof', 'permit', 'replacement', 'kentucky']
  }
];

// Kentucky Homeowner Project Checklist
const HOMEOWNER_PROJECT_CHECKLIST_KY = {
  name: 'Home Improvement Project Checklist - Kentucky',
  category: 'Homeowner Projects',
  description: 'General checklist for planning home improvement projects in Northern Kentucky (Boone, Kenton, Campbell counties)',
  steps: [
    {
      order: 1,
      title: 'Check Zoning and Setbacks',
      description: 'Verify project complies with local zoning',
      estimatedDays: 3,
      tips: [
        'Check your property zoning with county/city',
        'Verify setback requirements',
        'Check lot coverage limits',
        'Identify any easements on your property'
      ]
    },
    {
      order: 2,
      title: 'Check HOA Requirements',
      description: 'Review HOA rules if applicable',
      estimatedDays: 7,
      tips: [
        'Review CC&Rs for restrictions',
        'Submit architectural review if required',
        'Get approval in writing',
        'Note material/color restrictions'
      ]
    },
    {
      order: 3,
      title: 'Call 811 Before Digging',
      description: 'Have underground utilities marked',
      estimatedDays: 5,
      tips: [
        'Call 811 at least 48 hours before digging',
        'Wait for all utilities to mark',
        'This service is free',
        'Kentucky law requires utility locate'
      ]
    },
    {
      order: 4,
      title: 'Get Quotes from Contractors',
      description: 'Obtain multiple bids for contractor work',
      estimatedDays: 14,
      tips: [
        'Get at least 3 quotes',
        'Verify Kentucky contractor license if applicable',
        'Check references and insurance',
        'Get detailed written contract'
      ]
    },
    {
      order: 5,
      title: 'Apply for Permits',
      description: 'Submit permit applications',
      estimatedDays: 14,
      tips: [
        'Determine which permits needed',
        'Contact Boone/Kenton/Campbell County or your city',
        'Prepare required documents',
        'Pay permit fees'
      ]
    },
    {
      order: 6,
      title: 'Complete Work with Inspections',
      description: 'Execute project with required inspections',
      estimatedDays: 30,
      tips: [
        'Schedule inspections at required stages',
        'Don\'t cover work before inspection',
        'Keep permit posted at job site',
        'Address inspector comments promptly'
      ]
    },
    {
      order: 7,
      title: 'Final Inspection and Close Permit',
      description: 'Complete final inspection',
      estimatedDays: 7,
      tips: [
        'Schedule final inspection',
        'Ensure all previous inspections passed',
        'Keep documentation',
        'Update homeowner insurance if needed'
      ]
    }
  ]
};

export async function seedHomeownerProjectsKY() {
  console.log('Seeding Kentucky homeowner projects data...');

  // Seed permit requirements
  for (const permit of HOMEOWNER_PERMIT_REQUIREMENTS_KY) {
    await prisma.permitRequirement.upsert({
      where: {
        activityType_category: {
          activityType: permit.activityType,
          category: permit.category,
        },
      },
      update: {
        activityDescription: permit.activityDescription,
        zonesRequired: permit.zonesRequired,
        zonesProhibited: permit.zonesProhibited,
        feeBase: permit.feeBase,
        processingDays: permit.processingDays,
        requiresPlans: permit.requiresPlans,
        requiresInspection: permit.requiresInspection,
        ordinanceRef: permit.ordinanceRef,
        requirements: permit.requirements,
      },
      create: permit,
    });
  }
  console.log(`Seeded ${HOMEOWNER_PERMIT_REQUIREMENTS_KY.length} KY homeowner permit requirements`);

  // Seed building codes
  for (const code of HOMEOWNER_BUILDING_CODES_KY) {
    await prisma.buildingCode.upsert({
      where: {
        codeSection_jurisdiction: {
          codeSection: code.codeSection,
          jurisdiction: code.jurisdiction,
        },
      },
      update: {
        category: code.category,
        codeText: code.codeText,
        effectiveDate: code.effectiveDate,
      },
      create: code,
    });
  }
  console.log(`Seeded ${HOMEOWNER_BUILDING_CODES_KY.length} KY homeowner building codes`);

  // Seed common questions
  for (const qa of HOMEOWNER_COMMON_QUESTIONS_KY) {
    await prisma.commonQuestion.upsert({
      where: {
        question_category: {
          question: qa.question,
          category: qa.category,
        },
      },
      update: {
        answer: qa.answer,
        tags: qa.tags,
      },
      create: qa,
    });
  }
  console.log(`Seeded ${HOMEOWNER_COMMON_QUESTIONS_KY.length} KY homeowner common questions`);

  // Seed checklist
  const existingChecklist = await prisma.businessChecklist.findFirst({
    where: { name: HOMEOWNER_PROJECT_CHECKLIST_KY.name },
  });

  if (existingChecklist) {
    await prisma.businessChecklist.update({
      where: { id: existingChecklist.id },
      data: {
        category: HOMEOWNER_PROJECT_CHECKLIST_KY.category,
        description: HOMEOWNER_PROJECT_CHECKLIST_KY.description,
        steps: HOMEOWNER_PROJECT_CHECKLIST_KY.steps,
      },
    });
  } else {
    await prisma.businessChecklist.create({
      data: HOMEOWNER_PROJECT_CHECKLIST_KY,
    });
  }
  console.log('Seeded KY homeowner project checklist');

  console.log('Kentucky homeowner projects seeding complete!');
}

export {
  HOMEOWNER_PERMIT_REQUIREMENTS_KY,
  HOMEOWNER_BUILDING_CODES_KY,
  HOMEOWNER_COMMON_QUESTIONS_KY,
  HOMEOWNER_PROJECT_CHECKLIST_KY
};
