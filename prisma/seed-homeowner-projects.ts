import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Homeowner Project Permit Requirements
const HOMEOWNER_PERMIT_REQUIREMENTS = [
  {
    activityType: 'Deck Construction',
    category: 'Homeowner Projects',
    activityDescription: 'Building a new deck or significantly modifying an existing deck attached to a residential structure',
    zonesRequired: ['R-1', 'R-2', 'R-3', 'R-4', 'R-5', 'SF', 'PUD'],
    zonesProhibited: [],
    feeBase: 150,
    processingDays: 14,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Ohio Residential Code R507; Local Building Code',
    requirements: [
      'Building permit required for decks over 200 sq ft or over 30" above grade',
      'Site plan showing property lines and setbacks',
      'Construction drawings with dimensions and details',
      'Ledger board attachment details',
      'Post and beam sizing calculations',
      'Guardrail details (36" min height for residential)',
      'Stair specifications if applicable',
      'Must meet setback requirements (typically 5-10 feet from property line)',
      'Foundation/footing inspection required',
      'Framing inspection required',
      'Final inspection required'
    ]
  },
  {
    activityType: 'Fence Installation',
    category: 'Homeowner Projects',
    activityDescription: 'Installing a new fence on residential property',
    zonesRequired: ['R-1', 'R-2', 'R-3', 'R-4', 'R-5', 'SF', 'RM', 'PUD'],
    zonesProhibited: [],
    feeBase: 50,
    processingDays: 7,
    requiresPlans: false,
    requiresInspection: false,
    ordinanceRef: 'Local Zoning Code; Cincinnati Municipal Code Chapter 1421',
    requirements: [
      'Permit required in most jurisdictions',
      'Maximum height: 4 feet in front yard, 6 feet in side/rear yard',
      'Must be set back from property line (varies by jurisdiction)',
      'Good side of fence must face outward (neighbors)',
      'Cannot obstruct sight lines at intersections/driveways',
      'HOA approval may be required',
      'Utility locate (call 811) required before digging',
      'Pool fences have additional requirements',
      'Property survey recommended to avoid encroachment',
      'Some materials may be restricted (no barbed wire in residential)'
    ]
  },
  {
    activityType: 'Shed or Detached Building',
    category: 'Homeowner Projects',
    activityDescription: 'Building or installing a storage shed, workshop, or other detached accessory structure',
    zonesRequired: ['R-1', 'R-2', 'R-3', 'R-4', 'R-5', 'SF', 'PUD'],
    zonesProhibited: [],
    feeBase: 100,
    processingDays: 14,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Ohio Residential Code R105.2; Local Zoning Code',
    requirements: [
      'Permit required if over 200 sq ft (some jurisdictions 120 sq ft)',
      'Must meet accessory structure setbacks (typically 3-5 feet from property line)',
      'Cannot be in front yard',
      'Maximum height restrictions apply (typically 15 feet)',
      'Cannot exceed certain percentage of lot coverage',
      'Site plan showing location on property',
      'Foundation requirements if over certain size',
      'Electrical permit required if wiring for power',
      'Cannot be used as dwelling unit without ADU permit',
      'HOA approval may be required'
    ]
  },
  {
    activityType: 'Swimming Pool Installation',
    category: 'Homeowner Projects',
    activityDescription: 'Installing an in-ground or above-ground swimming pool on residential property',
    zonesRequired: ['R-1', 'R-2', 'R-3', 'R-4', 'R-5', 'SF', 'PUD'],
    zonesProhibited: [],
    feeBase: 250,
    processingDays: 21,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Ohio Building Code; ISPSC; Local Codes',
    requirements: [
      'Building permit required for all pools over 24" deep',
      'Site plan showing pool location and setbacks',
      'Pool barrier (fence) required - 4 feet minimum height',
      'Self-closing, self-latching gates required',
      'Pool fence must be separate from property line fence',
      'Electrical permit for pump/lighting (GFCI required)',
      'Plumbing permit for water connections',
      'Anti-entrapment drain covers required',
      'Pool alarm or cover may be required',
      'Cannot be located over easements',
      'Deck/patio around pool may need separate permit'
    ]
  },
  {
    activityType: 'Hot Tub/Spa Installation',
    category: 'Homeowner Projects',
    activityDescription: 'Installing a hot tub or spa on residential property',
    zonesRequired: ['R-1', 'R-2', 'R-3', 'R-4', 'R-5', 'SF', 'RM', 'PUD'],
    zonesProhibited: [],
    feeBase: 100,
    processingDays: 14,
    requiresPlans: false,
    requiresInspection: true,
    ordinanceRef: 'Ohio Building Code; NEC Article 680',
    requirements: [
      'Electrical permit required (dedicated 240V circuit typical)',
      'GFCI protection required',
      'Minimum clearances from overhead power lines',
      'May require barrier if accessible to children',
      'Lockable cover recommended/required',
      'Deck must support weight (filled spa = 3000+ lbs)',
      'Proper drainage to prevent runoff to neighbors',
      'HOA approval may be required',
      'Setback requirements may apply'
    ]
  },
  {
    activityType: 'Accessory Dwelling Unit (ADU)',
    category: 'Homeowner Projects',
    activityDescription: 'Adding a secondary dwelling unit to your property (in-law suite, garage apartment, backyard cottage)',
    zonesRequired: ['R-2', 'R-3', 'R-4', 'RM', 'PUD', 'MU'],
    zonesProhibited: ['R-1', 'SF-1'],
    feeBase: 500,
    processingDays: 45,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Ohio Revised Code; Local Zoning Code; Building Code',
    requirements: [
      'Zoning approval required (not allowed in all zones)',
      'Maximum size restrictions (typically 800-1000 sq ft or 50% of main house)',
      'May require conditional use permit',
      'Full building plans required',
      'Must meet all building codes for habitation',
      'Separate entrance required',
      'Parking requirements (1 additional space typical)',
      'May need to be owner-occupied (main house or ADU)',
      'Cannot be sold separately from main property',
      'Full inspections: foundation, framing, electrical, plumbing, final',
      'Address assignment for 911',
      'Utility connections may require separate meters'
    ]
  },
  {
    activityType: 'Garage Construction',
    category: 'Homeowner Projects',
    activityDescription: 'Building a new detached garage or carport on residential property',
    zonesRequired: ['R-1', 'R-2', 'R-3', 'R-4', 'R-5', 'SF', 'PUD'],
    zonesProhibited: [],
    feeBase: 300,
    processingDays: 21,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Ohio Residential Code; Local Zoning and Building Codes',
    requirements: [
      'Building permit required',
      'Site plan showing setbacks and property coverage',
      'Construction drawings with structural details',
      'Foundation permit and inspection',
      'Must meet accessory structure setbacks',
      'Height restrictions apply (typically 15-20 feet max)',
      'Electrical permit if wiring for power/lights',
      'Cannot be used for habitation without separate permits',
      'Driveway permit may be required for curb cut',
      'Fire separation requirements if near property line',
      'HOA approval may be required'
    ]
  },
  {
    activityType: 'Patio or Concrete Work',
    category: 'Homeowner Projects',
    activityDescription: 'Installing a patio, concrete driveway, walkway, or other flatwork',
    zonesRequired: ['R-1', 'R-2', 'R-3', 'R-4', 'R-5', 'SF', 'RM', 'PUD'],
    zonesProhibited: [],
    feeBase: 75,
    processingDays: 7,
    requiresPlans: false,
    requiresInspection: false,
    ordinanceRef: 'Local Building and Zoning Codes',
    requirements: [
      'Permit often required for driveways and large patios',
      'May affect impervious surface coverage limits',
      'Must maintain proper drainage (cannot drain to neighbors)',
      'Driveway width restrictions may apply',
      'Setback requirements for driveway approach',
      'Utility locate (call 811) required before excavation',
      'Right-of-way permit needed for curb cut modifications',
      'HOA approval may be required',
      'Some jurisdictions require permits over 200 sq ft'
    ]
  },
  {
    activityType: 'Pergola or Gazebo',
    category: 'Homeowner Projects',
    activityDescription: 'Installing a pergola, gazebo, or other outdoor shade structure',
    zonesRequired: ['R-1', 'R-2', 'R-3', 'R-4', 'R-5', 'SF', 'RM', 'PUD'],
    zonesProhibited: [],
    feeBase: 100,
    processingDays: 14,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Local Building Code; Ohio Residential Code',
    requirements: [
      'Permit typically required if over 200 sq ft',
      'Must meet accessory structure setbacks',
      'Height restrictions may apply',
      'Foundation requirements for permanent structures',
      'Electrical permit if adding lighting/outlets',
      'Wind load requirements in some areas',
      'May affect lot coverage calculations',
      'HOA approval often required',
      'Cannot be enclosed without additional permits'
    ]
  },
  {
    activityType: 'Retaining Wall',
    category: 'Homeowner Projects',
    activityDescription: 'Building a retaining wall to manage grade changes on your property',
    zonesRequired: ['R-1', 'R-2', 'R-3', 'R-4', 'R-5', 'SF', 'RM', 'PUD'],
    zonesProhibited: [],
    feeBase: 150,
    processingDays: 14,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Ohio Building Code; Local Codes',
    requirements: [
      'Permit required for walls over 4 feet high',
      'Engineered plans required for walls over 4 feet',
      'Drainage behind wall required',
      'Must not redirect water to neighboring properties',
      'Setback requirements apply',
      'Footing inspection required',
      'Final inspection required',
      'May require geotechnical report for tall walls',
      'Cannot obstruct drainage easements',
      'HOA approval may be required'
    ]
  },
  {
    activityType: 'Basement Finishing',
    category: 'Homeowner Projects',
    activityDescription: 'Converting unfinished basement space into habitable living area',
    zonesRequired: ['R-1', 'R-2', 'R-3', 'R-4', 'R-5', 'SF', 'RM', 'PUD'],
    zonesProhibited: [],
    feeBase: 200,
    processingDays: 14,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Ohio Residential Code; Local Building Code',
    requirements: [
      'Building permit required',
      'Plans showing proposed layout',
      'Electrical permit for new circuits/outlets',
      'Plumbing permit if adding bathroom',
      'Minimum ceiling height requirements (typically 7 feet)',
      'Egress window required for bedrooms (5.7 sq ft minimum)',
      'Smoke and CO detectors required',
      'Fire-rated drywall on ceiling if bedroom',
      'HVAC considerations for heating/cooling',
      'Framing, electrical, plumbing, and final inspections'
    ]
  },
  {
    activityType: 'Roof Replacement',
    category: 'Homeowner Projects',
    activityDescription: 'Replacing roofing materials on a residential structure',
    zonesRequired: ['R-1', 'R-2', 'R-3', 'R-4', 'R-5', 'SF', 'RM', 'PUD'],
    zonesProhibited: [],
    feeBase: 100,
    processingDays: 7,
    requiresPlans: false,
    requiresInspection: true,
    ordinanceRef: 'Ohio Residential Code R905; Local Building Code',
    requirements: [
      'Permit typically required',
      'Maximum 2 layers of shingles (may need tear-off)',
      'Ice and water shield required in cold climates',
      'Proper ventilation required',
      'Licensed contractor recommended',
      'Disposal of old materials properly',
      'HOA may have material/color restrictions',
      'Historic districts may have additional requirements',
      'Final inspection upon completion'
    ]
  },
  {
    activityType: 'Solar Panel Installation',
    category: 'Homeowner Projects',
    activityDescription: 'Installing rooftop or ground-mounted solar photovoltaic panels',
    zonesRequired: ['R-1', 'R-2', 'R-3', 'R-4', 'R-5', 'SF', 'RM', 'PUD', 'A-1'],
    zonesProhibited: [],
    feeBase: 200,
    processingDays: 21,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Ohio Revised Code 4928.67; NEC Article 690; Local Codes',
    requirements: [
      'Building permit required',
      'Electrical permit required',
      'Structural analysis for roof-mounted systems',
      'Electrical plans showing system layout',
      'Interconnection agreement with utility',
      'Net metering application',
      'HOA cannot unreasonably prohibit (Ohio law)',
      'Ground-mounted systems have setback requirements',
      'Fire department access requirements',
      'Rapid shutdown system required',
      'Utility inspection before activation',
      'Federal tax credits available (30% as of 2024)'
    ]
  },
  {
    activityType: 'Window/Door Replacement',
    category: 'Homeowner Projects',
    activityDescription: 'Replacing windows or exterior doors in a residential structure',
    zonesRequired: ['R-1', 'R-2', 'R-3', 'R-4', 'R-5', 'SF', 'RM', 'PUD'],
    zonesProhibited: [],
    feeBase: 75,
    processingDays: 7,
    requiresPlans: false,
    requiresInspection: true,
    ordinanceRef: 'Ohio Residential Code; Energy Code',
    requirements: [
      'Permit typically required for structural changes',
      'Like-for-like replacements may be exempt',
      'Energy code compliance (U-factor requirements)',
      'Egress requirements must be maintained for bedrooms',
      'Historic districts may have design requirements',
      'Lead paint procedures for homes built before 1978',
      'HOA may have style/color restrictions',
      'Impact-rated windows may be required in some areas'
    ]
  },
  {
    activityType: 'HVAC System Replacement',
    category: 'Homeowner Projects',
    activityDescription: 'Replacing furnace, air conditioner, or heat pump system',
    zonesRequired: ['R-1', 'R-2', 'R-3', 'R-4', 'R-5', 'SF', 'RM', 'PUD'],
    zonesProhibited: [],
    feeBase: 100,
    processingDays: 7,
    requiresPlans: false,
    requiresInspection: true,
    ordinanceRef: 'Ohio Mechanical Code; Local Codes',
    requirements: [
      'Mechanical permit required',
      'Must be installed by licensed HVAC contractor',
      'Proper sizing (Manual J calculation)',
      'Ductwork modifications may need separate permit',
      'Gas line permit if modifying gas piping',
      'Electrical permit if upgrading electrical service',
      'Refrigerant handling by EPA-certified technician',
      'Final inspection before operation',
      'Rebates may be available for high-efficiency units'
    ]
  },
  {
    activityType: 'Water Heater Replacement',
    category: 'Homeowner Projects',
    activityDescription: 'Replacing residential water heater (tank or tankless)',
    zonesRequired: ['R-1', 'R-2', 'R-3', 'R-4', 'R-5', 'SF', 'RM', 'PUD'],
    zonesProhibited: [],
    feeBase: 75,
    processingDays: 3,
    requiresPlans: false,
    requiresInspection: true,
    ordinanceRef: 'Ohio Plumbing Code; Local Codes',
    requirements: [
      'Plumbing permit typically required',
      'Gas permit if gas water heater',
      'Electrical permit if electric water heater upgrade',
      'Expansion tank may be required',
      'Proper venting for gas units',
      'Pan and drain for certain installations',
      'Temperature/pressure relief valve required',
      'Final inspection',
      'Licensed plumber recommended'
    ]
  }
];

// Building Codes for Homeowner Projects
const HOMEOWNER_BUILDING_CODES = [
  {
    codeSection: 'Deck Guardrails',
    category: 'Homeowner Projects',
    codeText: 'Guards required on open sides of decks more than 30 inches above grade. Minimum height 36 inches for residential. Balusters spaced maximum 4 inches apart. Must support 200 lb concentrated load.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Ohio Residential Code R312'
  },
  {
    codeSection: 'Deck Stairs',
    category: 'Homeowner Projects',
    codeText: 'Stair treads minimum 10 inches deep, risers maximum 7.75 inches. Handrail required if 4 or more risers. Landing required at top and bottom. Consistent riser height throughout (max 3/8" variance).',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Ohio Residential Code R311'
  },
  {
    codeSection: 'Pool Barrier Requirements',
    category: 'Homeowner Projects',
    codeText: 'Swimming pools must have barrier at least 48 inches high with no openings allowing passage of 4-inch sphere. Gates must be self-closing and self-latching with latch at least 54 inches above grade.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Ohio Building Code/ISPSC'
  },
  {
    codeSection: 'Accessory Structure Setbacks',
    category: 'Homeowner Projects',
    codeText: 'Detached accessory structures (sheds, garages) typically require minimum 3-5 foot setback from property lines. Cannot be in front yard. Combined with primary structure cannot exceed lot coverage limits.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Local Zoning Code'
  },
  {
    codeSection: 'Fence Height Limits',
    category: 'Homeowner Projects',
    codeText: 'Front yard fences: 4 feet maximum. Side and rear yard fences: 6 feet maximum. Corner lots have special visibility triangle requirements. HOAs may impose stricter limits.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Local Zoning Code'
  },
  {
    codeSection: 'Bedroom Egress Requirements',
    category: 'Homeowner Projects',
    codeText: 'Every bedroom must have emergency escape window or door. Minimum opening: 5.7 sq ft (5.0 sq ft at grade), minimum height 24 inches, minimum width 20 inches. Sill maximum 44 inches above floor.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Ohio Residential Code R310'
  },
  {
    codeSection: 'ADU Requirements',
    category: 'Homeowner Projects',
    codeText: 'Accessory dwelling units must meet all building codes for habitation including minimum room sizes, ceiling heights (7 feet), egress, and fire separation. Typically limited to 800-1000 sq ft or percentage of main dwelling.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Local Zoning Code'
  },
  {
    codeSection: 'Electrical - Outdoor Receptacles',
    category: 'Homeowner Projects',
    codeText: 'Outdoor receptacles must be GFCI protected and weather-resistant (WR). At least one receptacle required at front and back of dwelling. Pool/hot tub areas require GFCI protection.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'NEC Article 210, 680'
  },
  {
    codeSection: 'Retaining Wall Requirements',
    category: 'Homeowner Projects',
    codeText: 'Retaining walls over 4 feet in height require engineered design and building permit. Must include proper drainage behind wall. Surcharge from slopes, driveways, or structures must be accounted for.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Ohio Building Code'
  },
  {
    codeSection: 'Impervious Surface Limits',
    category: 'Homeowner Projects',
    codeText: 'Total impervious surface (buildings, driveways, patios, pools) typically limited to 30-50% of lot area depending on zone. Excess may require stormwater management plan.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Local Zoning/Stormwater Code'
  }
];

// Common Questions about Homeowner Projects
const HOMEOWNER_COMMON_QUESTIONS = [
  {
    question: 'Do I need a permit to build a deck?',
    answer: 'In most Cincinnati-area jurisdictions, yes, you need a building permit for decks. The threshold varies: some require permits for any deck attached to the house, others exempt decks under 200 square feet that are less than 30 inches above grade. You\'ll need to submit plans showing dimensions, materials, and how it attaches to the house. Inspections are required for footings, framing, and final. Building without a permit can result in fines and being required to tear it down.',
    category: 'Homeowner Projects',
    tags: ['deck', 'permit', 'building', 'residential']
  },
  {
    question: 'How close to the property line can I build a fence?',
    answer: 'Fence setback requirements vary by jurisdiction but generally: most areas allow fences on or very near the property line in side and rear yards. However, you\'re responsible for ensuring it\'s on YOUR property - a survey is highly recommended. In front yards, fences often need to be set back from the sidewalk. Height limits also differ: typically 4 feet in front yards, 6 feet in side/rear. Corner lots have visibility requirements. Always check with your city and HOA before installing.',
    category: 'Homeowner Projects',
    tags: ['fence', 'property line', 'setback', 'height']
  },
  {
    question: 'Do I need a permit for a shed?',
    answer: 'It depends on size. Most jurisdictions exempt sheds under 200 square feet (some use 120 sq ft threshold) that are used only for storage and have no electrical or plumbing. However, you still must follow zoning rules: proper setbacks from property lines, not in front yard, and not exceeding lot coverage limits. Larger sheds require permits, inspections, and sometimes foundations. If you\'re adding electricity, you\'ll need an electrical permit regardless of size. Always verify with your local building department.',
    category: 'Homeowner Projects',
    tags: ['shed', 'permit', 'storage', 'accessory structure']
  },
  {
    question: 'What permits do I need for an in-ground pool?',
    answer: 'Installing a pool requires multiple permits: 1) Building permit for the pool structure; 2) Electrical permit for the pump, lights, and GFCI protection; 3) Plumbing permit for water connections; 4) Fence permit for the required barrier. You\'ll need a site plan showing the pool location meets setbacks and isn\'t over any easements. Pool must have a separate barrier (fence) at least 4 feet high with self-closing, self-latching gates. Multiple inspections are required. Budget $500-1000 for permit fees alone.',
    category: 'Homeowner Projects',
    tags: ['pool', 'swimming', 'permit', 'fence']
  },
  {
    question: 'Can I build an ADU (accessory dwelling unit) on my property?',
    answer: 'ADUs are not permitted in all zones. In Cincinnati, they\'re generally allowed in R-2 and higher density residential zones but prohibited in R-1 single-family zones. Requirements typically include: maximum size limits (often 800-1000 sq ft), parking requirements, owner-occupancy rules (you must live in either the main house or ADU), and the ADU cannot be sold separately. You\'ll need zoning approval and full building permits. Many suburbs have stricter rules or don\'t allow ADUs at all.',
    category: 'Homeowner Projects',
    tags: ['adu', 'accessory dwelling', 'in-law suite', 'garage apartment']
  },
  {
    question: 'Do I need a permit to finish my basement?',
    answer: 'Yes, finishing a basement requires permits: building permit at minimum, plus electrical and plumbing permits if adding outlets, fixtures, or bathrooms. Key requirements include: minimum 7-foot ceiling height, egress window in any bedroom (5.7 sq ft minimum opening), smoke and CO detectors, and proper fire separation. You cannot legally create a bedroom without an egress window. Inspections are required at various stages. Unpermitted finished basements can cause problems when selling your home.',
    category: 'Homeowner Projects',
    tags: ['basement', 'finishing', 'permit', 'egress']
  },
  {
    question: 'What are the requirements for a pool fence?',
    answer: 'Ohio and local codes require pool barriers meeting these standards: minimum 4 feet high (many localities require 5 feet); no openings allowing passage of 4-inch sphere; gates must be self-closing and self-latching with latch at least 54 inches above ground or on pool side; no handholds or footholds for climbing. The fence must completely surround the pool - your property line fence typically doesn\'t count. Above-ground pools with sides 4+ feet tall may serve as part of the barrier with a lockable ladder.',
    category: 'Homeowner Projects',
    tags: ['pool', 'fence', 'safety', 'barrier']
  },
  {
    question: 'Can my HOA prevent me from installing solar panels?',
    answer: 'Ohio law (ORC 4928.67) prohibits HOAs from banning solar panels outright, but they can impose reasonable aesthetic requirements like placement location or requiring panels to be parallel to the roof line. They cannot require you to get their approval if it would significantly increase cost or decrease efficiency. Document any HOA restrictions and ensure they\'re "reasonable" as defined by law. If your HOA tries to prohibit panels entirely, cite the Ohio statute.',
    category: 'Homeowner Projects',
    tags: ['solar', 'hoa', 'panels', 'restrictions']
  },
  {
    question: 'Do I need a permit to replace my roof?',
    answer: 'Generally yes, a permit is required for roof replacement. The inspector verifies: proper installation, adequate ventilation, ice/water shield in required areas, and that you\'re not exceeding two layers of shingles (if you have two layers already, a tear-off is required). Permit fees are typically $100-200. The permit also ensures your roofer is licensed and your work is documented for insurance purposes. Historic districts may have additional material and appearance requirements.',
    category: 'Homeowner Projects',
    tags: ['roof', 'replacement', 'permit', 'shingles']
  },
  {
    question: 'What permits do I need for a pergola or gazebo?',
    answer: 'Permit requirements depend on size and whether it\'s attached to the house. Generally: structures under 200 square feet may be exempt, but anything attached to the house usually requires a permit. You\'ll need to meet accessory structure setbacks (typically 3-5 feet from property lines) and height limits. If adding electrical for lighting, an electrical permit is required. Permanent structures with foundations have more requirements than freestanding ones. Check your HOA - they often have rules about outdoor structures.',
    category: 'Homeowner Projects',
    tags: ['pergola', 'gazebo', 'permit', 'outdoor']
  },
  {
    question: 'Do I need a permit to replace my water heater?',
    answer: 'Yes, most jurisdictions require a plumbing permit for water heater replacement. For gas water heaters, you may also need a gas permit. Requirements have changed over the years: expansion tanks are now often required, proper venting is critical for gas units, and the temperature/pressure relief valve must discharge properly. While homeowners can sometimes do this work themselves, licensed plumbers ensure code compliance. The inspection verifies safe installation.',
    category: 'Homeowner Projects',
    tags: ['water heater', 'permit', 'plumbing', 'replacement']
  },
  {
    question: 'How do I know if I need a survey before building?',
    answer: 'A property survey is strongly recommended before: building near property lines (fences, sheds, garages), adding structures that must meet setback requirements, or any time you\'re unsure of exact property boundaries. While not always legally required for permits, building on your neighbor\'s property is a costly mistake. If your title insurance or deed shows a survey, it may be outdated. New surveys cost $300-800 but provide peace of mind and legal protection.',
    category: 'Homeowner Projects',
    tags: ['survey', 'property line', 'setback', 'boundary']
  }
];

// Homeowner Project Checklists
const HOMEOWNER_PROJECT_CHECKLIST = {
  name: 'Home Improvement Project Checklist',
  category: 'Homeowner Projects',
  description: 'General checklist for planning and executing permitted home improvement projects in the Cincinnati area',
  steps: [
    {
      order: 1,
      title: 'Check Zoning and Setback Requirements',
      description: 'Verify your project complies with local zoning codes',
      estimatedDays: 3,
      tips: [
        'Use Civix to look up your property zoning',
        'Check setback requirements for your zone',
        'Verify lot coverage limits',
        'Identify any easements on your property'
      ]
    },
    {
      order: 2,
      title: 'Check HOA Requirements',
      description: 'Review HOA rules if applicable',
      estimatedDays: 7,
      tips: [
        'Review CC&Rs for restrictions on your project type',
        'Submit architectural review application if required',
        'Get approval in writing before proceeding',
        'Note any material or color restrictions'
      ]
    },
    {
      order: 3,
      title: 'Call 811 Before Digging',
      description: 'Have underground utilities marked',
      estimatedDays: 5,
      tips: [
        'Call 811 at least 48 hours before digging',
        'Utilities will be marked with paint/flags',
        'Wait for all utilities to respond',
        'This is free and required by law'
      ]
    },
    {
      order: 4,
      title: 'Get Quotes and Select Contractor',
      description: 'Obtain multiple bids for contractor work',
      estimatedDays: 14,
      tips: [
        'Get at least 3 quotes for comparison',
        'Verify contractor is licensed and insured',
        'Check references and reviews',
        'Get detailed written contract'
      ]
    },
    {
      order: 5,
      title: 'Apply for Permits',
      description: 'Submit permit applications to your local building department',
      estimatedDays: 14,
      tips: [
        'Determine which permits needed (building, electrical, plumbing)',
        'Prepare required documents (plans, site plan)',
        'Pay permit fees',
        'Homeowner or contractor can pull permits'
      ]
    },
    {
      order: 6,
      title: 'Complete Work and Inspections',
      description: 'Execute project with required inspections',
      estimatedDays: 30,
      tips: [
        'Schedule inspections at required stages',
        'Don\'t cover work before inspection (walls, foundations)',
        'Keep permit posted at job site',
        'Address any inspector comments promptly'
      ]
    },
    {
      order: 7,
      title: 'Final Inspection and Close Permit',
      description: 'Complete final inspection and close out permit',
      estimatedDays: 7,
      tips: [
        'Schedule final inspection when work complete',
        'Ensure all previous inspections passed',
        'Keep final approval documentation',
        'Update homeowner insurance if needed'
      ]
    }
  ]
};

export async function seedHomeownerProjects() {
  console.log('Seeding homeowner projects data...');

  // Seed permit requirements
  for (const permit of HOMEOWNER_PERMIT_REQUIREMENTS) {
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
  console.log(`Seeded ${HOMEOWNER_PERMIT_REQUIREMENTS.length} homeowner permit requirements`);

  // Seed building codes
  for (const code of HOMEOWNER_BUILDING_CODES) {
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
  console.log(`Seeded ${HOMEOWNER_BUILDING_CODES.length} homeowner building codes`);

  // Seed common questions
  for (const qa of HOMEOWNER_COMMON_QUESTIONS) {
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
  console.log(`Seeded ${HOMEOWNER_COMMON_QUESTIONS.length} homeowner common questions`);

  // Seed business checklist
  const existingChecklist = await prisma.businessChecklist.findFirst({
    where: { name: HOMEOWNER_PROJECT_CHECKLIST.name },
  });

  if (existingChecklist) {
    await prisma.businessChecklist.update({
      where: { id: existingChecklist.id },
      data: {
        category: HOMEOWNER_PROJECT_CHECKLIST.category,
        description: HOMEOWNER_PROJECT_CHECKLIST.description,
        steps: HOMEOWNER_PROJECT_CHECKLIST.steps,
      },
    });
  } else {
    await prisma.businessChecklist.create({
      data: HOMEOWNER_PROJECT_CHECKLIST,
    });
  }
  console.log('Seeded homeowner project checklist');

  console.log('Homeowner projects seeding complete!');
}

export {
  HOMEOWNER_PERMIT_REQUIREMENTS,
  HOMEOWNER_BUILDING_CODES,
  HOMEOWNER_COMMON_QUESTIONS,
  HOMEOWNER_PROJECT_CHECKLIST
};
