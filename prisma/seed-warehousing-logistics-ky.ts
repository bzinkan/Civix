import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Kentucky Zone Codes for Warehousing/Industrial
const KY_INDUSTRIAL_ZONES = ['I-1', 'I-2', 'M-1', 'M-2', 'IL', 'IH', 'BP', 'EMP'];
const KY_HEAVY_INDUSTRIAL_ZONES = ['I-2', 'M-2', 'IH'];
const KY_LIGHT_INDUSTRIAL_ZONES = ['I-1', 'M-1', 'IL', 'BP', 'EMP'];
const KY_COMMERCIAL_ZONES = ['C-2', 'C-3', 'CMU', 'CC', 'TUMU', 'DTC'];
const KY_RESIDENTIAL_ZONES = ['R-1', 'R-2', 'R-3', 'R-4', 'SF', 'MF', 'DTR'];
const KY_OFFICE_ZONES = ['O-1', 'O-2', 'PRO'];

// Warehousing and Logistics Permit Requirements - Kentucky
const WAREHOUSING_PERMIT_REQUIREMENTS_KY = [
  {
    activityType: 'Warehouse/Storage Facility (KY)',
    category: 'Warehousing/Logistics',
    activityDescription: 'Facility for storing goods, inventory, and materials for distribution in Northern Kentucky',
    zonesRequired: KY_INDUSTRIAL_ZONES,
    zonesProhibited: [...KY_RESIDENTIAL_ZONES, 'C-1', ...KY_OFFICE_ZONES],
    feeBase: 450,
    processingDays: 45,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Local Zoning Code; Kentucky Building Code; KRS 227',
    requirements: [
      'Industrial zoning required (Boone, Kenton, or Campbell County)',
      'Site plan showing building, parking, truck circulation',
      'Building permit from county building department',
      'Fire safety plan and sprinkler requirements',
      'Certificate of occupancy',
      'Kentucky business license',
      'City occupational license (Covington, Newport, etc.)',
      'Loading dock requirements based on size',
      'Stormwater management plan (KY DOW)',
      'Traffic impact study may be required',
      'Screening/landscaping along residential boundaries',
      'Hazardous materials permit if storing hazmat'
    ]
  },
  {
    activityType: 'Distribution Center (KY)',
    category: 'Warehousing/Logistics',
    activityDescription: 'Large-scale facility for receiving, storing, and shipping goods with significant truck traffic in Northern Kentucky',
    zonesRequired: KY_HEAVY_INDUSTRIAL_ZONES,
    zonesProhibited: [...KY_RESIDENTIAL_ZONES, 'C-1', 'C-2', ...KY_OFFICE_ZONES],
    feeBase: 1000,
    processingDays: 90,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Local Zoning Code; Kentucky Building Code; KYTC',
    requirements: [
      'Heavy industrial zoning typically required',
      'Traffic impact study required',
      'Truck route plan showing access to I-75, I-71, I-275',
      'Site plan with truck turning radii and queuing',
      'Building permit from county building department',
      'Fire suppression system (high-pile storage)',
      'Kentucky DOW stormwater permit',
      'Environmental review may be required',
      'Noise mitigation measures',
      'Hours of operation restrictions may apply',
      'Road improvement agreement with KYTC may be required',
      'Utility capacity verification (Duke Energy, NKY Water)'
    ]
  },
  {
    activityType: 'Fulfillment Center/E-commerce Warehouse (KY)',
    category: 'Warehousing/Logistics',
    activityDescription: 'Warehouse focused on e-commerce order fulfillment with high throughput of small packages - Northern Kentucky/CVG area',
    zonesRequired: KY_INDUSTRIAL_ZONES,
    zonesProhibited: [...KY_RESIDENTIAL_ZONES, 'C-1'],
    feeBase: 700,
    processingDays: 60,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Local Zoning Code; Kentucky Building Code',
    requirements: [
      'Industrial zoning required',
      'Traffic study (high vehicle counts - delivery vans, employee shifts)',
      'Parking for large employee counts (Amazon, DHL common in area)',
      'Loading dock and package processing areas',
      'Conveyor and automation systems permits',
      'Electrical capacity for automation equipment (Duke Energy)',
      'Fire safety for high-pile storage and lithium batteries',
      'Shift change traffic management plan',
      'Employee amenities (break rooms, restrooms per code)',
      'City occupational license tax (payroll-based)'
    ]
  },
  {
    activityType: 'Cold Storage/Refrigerated Warehouse (KY)',
    category: 'Warehousing/Logistics',
    activityDescription: 'Temperature-controlled warehouse for perishable goods, frozen foods, and pharmaceuticals in Northern Kentucky',
    zonesRequired: KY_HEAVY_INDUSTRIAL_ZONES,
    zonesProhibited: [...KY_RESIDENTIAL_ZONES, 'C-1', 'C-2'],
    feeBase: 950,
    processingDays: 90,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Local Zoning Code; Kentucky Building Code; FDA/USDA',
    requirements: [
      'Industrial zoning required',
      'Refrigeration system permits',
      'Ammonia handling plan if using ammonia refrigerant (KY DFS)',
      'Enhanced fire protection for cold storage',
      'Electrical capacity for refrigeration systems (Duke Energy)',
      'FDA Food Facility Registration if storing food',
      'USDA inspection if storing meat/poultry',
      'Temperature monitoring and alarm systems',
      'Backup power for refrigeration',
      'Insulation and vapor barrier requirements',
      'Dock seal requirements for temperature control'
    ]
  },
  {
    activityType: 'Trucking Terminal/Freight Yard (KY)',
    category: 'Warehousing/Logistics',
    activityDescription: 'Facility for parking, loading, and transferring freight between trucks in Northern Kentucky',
    zonesRequired: KY_HEAVY_INDUSTRIAL_ZONES,
    zonesProhibited: [...KY_RESIDENTIAL_ZONES, 'C-1', 'C-2', ...KY_OFFICE_ZONES],
    feeBase: 700,
    processingDays: 60,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Local Zoning Code; FMCSA Regulations; KYTC',
    requirements: [
      'Heavy industrial zoning required',
      'Site plan showing truck parking, staging, and circulation',
      'Stormwater management (large impervious area) - KY DOW',
      'Noise mitigation (backup alarms, refrigerated trailer units)',
      'Lighting plan (security, spillover to adjacent properties)',
      'Fuel storage tank permits if on-site fueling (KY DFS)',
      'Scale house permits if weighing trucks',
      'FMCSA operating authority',
      'KYTC motor carrier authority for intrastate',
      'Environmental review for potential contamination',
      'Screening/fencing requirements',
      'Hours of operation may be restricted'
    ]
  },
  {
    activityType: 'Self-Storage Facility (KY)',
    category: 'Warehousing/Logistics',
    activityDescription: 'Mini-storage facility with individual rental units for personal and business storage in Northern Kentucky',
    zonesRequired: [...KY_LIGHT_INDUSTRIAL_ZONES, 'C-2', 'C-3', 'CMU'],
    zonesProhibited: ['R-1', 'R-2', 'R-3', 'SF', ...KY_OFFICE_ZONES],
    feeBase: 450,
    processingDays: 45,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Local Zoning Code; Kentucky Building Code; KRS 359',
    requirements: [
      'Light industrial or commercial zoning',
      'Site plan showing building layout and access',
      'Building permit from county building department',
      'Fire safety requirements (sprinklers for larger facilities)',
      'Security plan (gates, cameras, lighting)',
      'Office/manager space requirements',
      'Signage permit',
      'Stormwater management',
      'No overnight stays/habitation (KRS 359 Self-Service Storage Act)',
      'Restrictions on hazardous material storage',
      'ADA accessible units required',
      'Climate-controlled units have additional requirements',
      'City occupational license if in Covington/Newport'
    ]
  },
  {
    activityType: 'Last-Mile Delivery Hub (KY)',
    category: 'Warehousing/Logistics',
    activityDescription: 'Small warehouse for local delivery operations serving Northern Kentucky/Cincinnati metro',
    zonesRequired: [...KY_LIGHT_INDUSTRIAL_ZONES, 'C-2', 'C-3', 'CMU', 'BP'],
    zonesProhibited: [...KY_RESIDENTIAL_ZONES, ...KY_OFFICE_ZONES],
    feeBase: 275,
    processingDays: 30,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Local Zoning Code; KYTC',
    requirements: [
      'Light industrial or commercial zoning',
      'Site plan showing van parking and loading',
      'Parking for delivery fleet (significant spaces needed)',
      'Employee parking separate from fleet parking',
      'Early morning operations may require noise mitigation',
      'Traffic pattern showing van ingress/egress',
      'Building permit for any modifications',
      'Kentucky business license',
      'City occupational license',
      'DOT compliance for commercial vehicles'
    ]
  },
  {
    activityType: 'Hazardous Materials Storage (KY)',
    category: 'Warehousing/Logistics',
    activityDescription: 'Facility for storing hazardous materials, chemicals, or dangerous goods in Northern Kentucky',
    zonesRequired: KY_HEAVY_INDUSTRIAL_ZONES,
    zonesProhibited: [...KY_RESIDENTIAL_ZONES, 'C-1', 'C-2', 'I-1', ...KY_OFFICE_ZONES],
    feeBase: 1800,
    processingDays: 120,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Local Zoning Code; KY DEP; Fire Code; OSHA; KRS 224',
    requirements: [
      'Heavy industrial zoning required',
      'Environmental impact assessment',
      'Kentucky DEP permits (may include air, water, waste)',
      'Fire department hazmat permit',
      'Spill prevention and containment plan (SPCC)',
      'Secondary containment for storage areas',
      'Emergency response plan filed with local fire dept',
      'Distance requirements from residential areas',
      'OSHA Process Safety Management compliance',
      'Community right-to-know reporting (EPCRA)',
      'Specialized fire suppression systems',
      'Regular inspections by fire department and KY DEP'
    ]
  },
  {
    activityType: 'Intermodal/Rail-Served Facility (KY)',
    category: 'Warehousing/Logistics',
    activityDescription: 'Warehouse or distribution center with railroad access for intermodal container transfer in Northern Kentucky',
    zonesRequired: KY_HEAVY_INDUSTRIAL_ZONES,
    zonesProhibited: [...KY_RESIDENTIAL_ZONES, 'C-1', 'C-2', ...KY_OFFICE_ZONES],
    feeBase: 1400,
    processingDays: 180,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Local Zoning Code; FRA Regulations; KYTC Rail',
    requirements: [
      'Heavy industrial zoning with rail access',
      'Railroad siding agreement (CSX, Norfolk Southern active in NKY)',
      'Grade crossing permits if creating new crossings (KYTC)',
      'Site plan showing rail and truck circulation',
      'Container handling equipment area',
      'Traffic impact study (truck and rail)',
      'Noise mitigation plan',
      'Environmental review (KY DEP)',
      'Stormwater management for large impervious areas',
      'Coordination with railroad operator'
    ]
  }
];

// Building and Fire Codes for Warehousing - Kentucky
const WAREHOUSING_BUILDING_CODES_KY = [
  {
    codeSection: 'High-Piled Storage (KY)',
    category: 'Warehousing/Logistics',
    codeText: 'Storage exceeding 12 feet in height (6 feet for high-hazard commodities) requires fire department permit, approved rack system, and enhanced fire suppression. ESFR or in-rack sprinklers may be required based on commodity and height. Kentucky Fire Marshal has jurisdiction over high-pile storage permits.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Kentucky Fire Code; KRS 227'
  },
  {
    codeSection: 'Warehouse Fire Sprinklers (KY)',
    category: 'Warehousing/Logistics',
    codeText: 'Warehouses over 12,000 square feet require automatic fire sprinkler system per Kentucky Building Code. Design density based on occupancy hazard classification and storage arrangement. ESFR sprinklers preferred for high-pile storage. Plans reviewed by State Fire Marshal or local fire authority.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Kentucky Building Code; NFPA 13; KRS 227'
  },
  {
    codeSection: 'Loading Dock Requirements (KY)',
    category: 'Warehousing/Logistics',
    codeText: 'Loading docks require dock levelers or dock plates for safe loading. Dock bumpers and wheel chocks required. Adequate lighting (5 footcandles minimum). Vehicle restraints recommended for trailer security. Kentucky OSHA enforces workplace safety requirements.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'KY OSH; Kentucky Building Code'
  },
  {
    codeSection: 'Truck Maneuvering Space (KY)',
    category: 'Warehousing/Logistics',
    codeText: 'Site design must accommodate truck turning radii: WB-50 (50-foot trailer) requires 45-foot inside radius, 106-foot outside radius for 180-degree turn. Approach aprons minimum 60-120 feet depending on dock angle. Northern Kentucky sites near I-75/I-71/I-275 subject to KYTC coordination.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Local Zoning/Engineering; KYTC Standards'
  },
  {
    codeSection: 'Cold Storage Fire Protection (KY)',
    category: 'Warehousing/Logistics',
    codeText: 'Refrigerated and freezer storage requires specialized fire protection per Kentucky Fire Code. Dry-pipe or preaction systems for freezer areas. Enhanced insulation creates fire loading concerns. Antifreeze systems prohibited in food storage areas. Ammonia systems require Kentucky DFS permits.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'NFPA 13; Kentucky Fire Code; KRS 227'
  },
  {
    codeSection: 'Forklift and Equipment Aisles (KY)',
    category: 'Warehousing/Logistics',
    codeText: 'Forklift aisles must be minimum 12 feet wide for adequate clearance and maneuvering. Pedestrian walkways minimum 28 inches wide with protective barriers from forklift traffic. Floor must support forklift loads. Kentucky OSH Program enforces industrial safety.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'KY OSH Program (803 KAR 2:308)'
  },
  {
    codeSection: 'Battery Charging Areas (KY)',
    category: 'Warehousing/Logistics',
    codeText: 'Forklift battery charging areas require ventilation (1 CFM per sq ft minimum), eye wash station within 25 feet, fire extinguisher, spill containment for acid batteries. Lithium battery charging has additional fire safety requirements. Kentucky OSH enforces workplace safety.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'KY OSH; NFPA 505; Kentucky Fire Code'
  },
  {
    codeSection: 'Stormwater Management - Logistics (KY)',
    category: 'Warehousing/Logistics',
    codeText: 'Large impervious areas (warehouses, parking, truck yards) require Kentucky Division of Water (DOW) stormwater permit. Detention/retention basins sized for appropriate storm events, water quality treatment for first flush, oil/water separators for truck areas. KPDES permit required for industrial stormwater.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Kentucky DOW; KPDES; KRS 224'
  }
];

// Common Questions about Warehousing and Logistics - Kentucky
const WAREHOUSING_COMMON_QUESTIONS_KY = [
  {
    question: 'What zoning do I need for a warehouse in Northern Kentucky?',
    answer: 'Warehouses in Northern Kentucky require industrial zoning, typically: I-1 or IL (Light Industrial) for general warehousing and distribution; I-2, IH, or M-2 (Heavy Industrial) for operations with significant truck traffic, outdoor storage, or hazardous materials. Boone County has EMP (Employment Center) zones suitable for warehousing. Some commercial zones (C-2, C-3) may allow limited warehousing in Kenton and Campbell Counties. Residential and office zones prohibit warehouse uses. Use Civix to check your specific property\'s zoning classification.',
    category: 'Warehousing/Logistics',
    tags: ['zoning', 'industrial', 'warehouse', 'location', 'kentucky', 'northern kentucky']
  },
  {
    question: 'What permits do I need to open a warehouse in Kentucky?',
    answer: 'Opening a warehouse in Kentucky requires: 1) Zoning compliance verification from county/city planning; 2) Building permit from county building department; 3) Certificate of occupancy; 4) Fire safety permit from State Fire Marshal or local fire authority (especially for high-pile storage); 5) Kentucky business license; 6) City occupational license in Covington, Newport, or other cities with occupational tax; 7) Kentucky DEP permits if storing hazardous materials; 8) Food facility registration if storing food products; 9) Kentucky DOW stormwater permit (KPDES) for large sites. Permit costs typically range from $1,000 to $8,000 depending on size and complexity.',
    category: 'Warehousing/Logistics',
    tags: ['permits', 'warehouse', 'building', 'fire safety', 'kentucky']
  },
  {
    question: 'Why is Northern Kentucky a major logistics hub?',
    answer: 'Northern Kentucky is a premier logistics hub due to: 1) CVG Airport - major DHL Americas hub, Amazon Prime Air hub; 2) Interstate access - I-75, I-71, I-275 intersection; 3) Proximity to Cincinnati (no state income tax advantage); 4) Within 600 miles of 60% of US population; 5) Foreign Trade Zone #161 available; 6) River access via Ohio River ports; 7) Rail access (CSX, Norfolk Southern); 8) Business-friendly tax environment; 9) Available industrial land in Boone County. Major tenants include Amazon, DHL, Wayfair, and numerous third-party logistics providers.',
    category: 'Warehousing/Logistics',
    tags: ['northern kentucky', 'logistics hub', 'cvg', 'amazon', 'dhl']
  },
  {
    question: 'What are the fire safety requirements for high-pile storage in Kentucky?',
    answer: 'High-pile storage (over 12 feet, or 6 feet for high-hazard commodities) in Kentucky requires: 1) Fire department permit from State Fire Marshal or local fire authority; 2) Automatic fire sprinklers (ESFR or in-rack systems); 3) Approved rack design and aisle widths; 4) Maximum storage heights based on commodity class; 5) Posted storage plans; 6) Fire department access aisles; 7) Commodity classification documentation; 8) Regular fire inspections per KRS 227. Northern Kentucky fire departments (Boone, Kenton, Campbell) have specific high-pile storage requirements.',
    category: 'Warehousing/Logistics',
    tags: ['fire safety', 'high-pile', 'storage', 'sprinklers', 'kentucky']
  },
  {
    question: 'Can I operate a trucking company from industrial property in Kentucky?',
    answer: 'Yes, trucking terminals are permitted in heavy industrial zones (I-2, M-2, IH) in Northern Kentucky. Requirements include: 1) Adequate parking and staging for trucks; 2) Truck turning radii accommodated on site; 3) Access to approved truck routes and interstates; 4) Stormwater management (KY DOW permit); 5) Noise mitigation if near residential; 6) FMCSA operating authority; 7) Kentucky Transportation Cabinet (KYTC) motor carrier authority for intrastate operations; 8) DOT compliance for commercial vehicles. Fuel storage on-site requires Kentucky Division of Fire Safety (DFS) permits.',
    category: 'Warehousing/Logistics',
    tags: ['trucking', 'terminal', 'freight', 'industrial', 'kentucky']
  },
  {
    question: 'What are the requirements for a cold storage warehouse in Kentucky?',
    answer: 'Cold storage warehouses in Kentucky have additional requirements beyond standard warehouses: 1) Refrigeration system permits and inspections; 2) Ammonia handling plan and Kentucky DFS permits if using ammonia refrigerant; 3) Specialized fire suppression for freezer areas (dry-pipe or preaction) per Kentucky Fire Code; 4) Significant electrical capacity for refrigeration (coordinate with Duke Energy); 5) FDA Food Facility Registration for food storage; 6) USDA inspection for meat/poultry; 7) Backup power for refrigeration; 8) Temperature monitoring and alarm systems; 9) Vapor barriers and insulation requirements.',
    category: 'Warehousing/Logistics',
    tags: ['cold storage', 'refrigerated', 'food', 'freezer', 'kentucky']
  },
  {
    question: 'Do I need environmental permits for a warehouse in Kentucky?',
    answer: 'Environmental permits in Kentucky depend on your operations: 1) KPDES stormwater permit from Kentucky DOW required for large impervious surfaces; 2) Air quality permit from Kentucky DEP if emissions from equipment; 3) Hazardous waste generator permit if generating hazmat waste; 4) SPCC plan if storing oil/fuel above threshold quantities; 5) Wastewater permit if industrial discharge to sewer or stream. Standard warehousing with no hazmat typically only needs stormwater permits. Kentucky DEP (Department for Environmental Protection) has jurisdiction under KRS 224.',
    category: 'Warehousing/Logistics',
    tags: ['environmental', 'permits', 'kpdes', 'stormwater', 'kentucky']
  },
  {
    question: 'How much parking is required for a warehouse in Northern Kentucky?',
    answer: 'Warehouse parking requirements vary by county (Boone, Kenton, Campbell) and use: 1) General warehouse: 1 space per 2,000-5,000 sq ft of floor area; 2) Distribution/fulfillment: 1 space per 500-1,000 sq ft (higher employee counts - common for Amazon-style operations); 3) Must provide truck loading spaces separate from parking; 4) ADA accessible spaces required. High-turnover facilities like fulfillment centers near CVG need significantly more parking for shift changes. A traffic study can determine actual demand. Boone County has specific parking standards for EMP zones.',
    category: 'Warehousing/Logistics',
    tags: ['parking', 'warehouse', 'requirements', 'traffic', 'kentucky']
  },
  {
    question: 'Can I store hazardous materials in a Kentucky warehouse?',
    answer: 'Storing hazardous materials in Kentucky requires special permits and zoning: 1) Heavy industrial zoning (I-2, M-2, IH) typically required; 2) Fire department hazmat storage permit (State Fire Marshal); 3) Kentucky DEP permits depending on material type (KRS 224); 4) Spill prevention and containment (SPCC plan); 5) Secondary containment for storage areas; 6) Emergency response plan filed with local LEPC; 7) Distance requirements from residential areas and sensitive receptors; 8) Specialized fire suppression systems; 9) Community right-to-know reporting (EPCRA). Storage quantities are limited by fire code.',
    category: 'Warehousing/Logistics',
    tags: ['hazmat', 'hazardous materials', 'storage', 'permits', 'kentucky']
  },
  {
    question: 'What is the occupational license tax for warehouses in Northern Kentucky?',
    answer: 'Several Northern Kentucky cities levy occupational license taxes (payroll taxes) that apply to warehouses: 1) Covington: 2.5% of employee wages; 2) Newport: 2% of employee wages; 3) Florence: 2% of employee wages; 4) Fort Mitchell: 1% of employee wages. Boone County unincorporated areas do not have occupational license tax, which is why many large warehouses locate there. This tax is withheld from employee wages and remitted to the city. Net profit tax may also apply. Check with specific city for current rates and filing requirements.',
    category: 'Warehousing/Logistics',
    tags: ['occupational license', 'tax', 'payroll', 'covington', 'newport', 'kentucky']
  },
  {
    question: 'How do I start a self-storage business in Northern Kentucky?',
    answer: 'Starting a self-storage facility in Northern Kentucky requires: 1) Find light industrial or commercial zoning that allows self-storage in Boone, Kenton, or Campbell County; 2) Site plan approval showing building layout and access; 3) Building permits from county building department; 4) Fire safety requirements (sprinklers for larger facilities); 5) Security systems (gates, cameras, lighting); 6) Office/manager space; 7) Signage permits; 8) Kentucky business license; 9) City occupational license if in incorporated area. KRS 359 (Self-Service Storage Act) governs lien and rental requirements. Typical development costs are $25-50 per square foot.',
    category: 'Warehousing/Logistics',
    tags: ['self-storage', 'mini storage', 'startup', 'facility', 'kentucky']
  }
];

// Warehousing Business Startup Checklist - Kentucky
const WAREHOUSING_BUSINESS_CHECKLIST_KY = {
  name: 'Warehouse/Logistics Business Startup (KY)',
  category: 'Warehousing/Logistics',
  description: 'Checklist for starting a warehouse or logistics operation in Northern Kentucky (Boone, Kenton, Campbell Counties)',
  steps: [
    {
      order: 1,
      title: 'Identify Location Requirements',
      description: 'Determine space needs, truck access, and zoning requirements for Northern Kentucky',
      estimatedDays: 30,
      tips: [
        'Calculate square footage needs based on storage requirements',
        'Determine ceiling height requirements (32-40 feet typical for modern NKY warehouses)',
        'Identify truck access and loading dock needs',
        'Check proximity to I-75, I-71, I-275, and CVG Airport',
        'Verify industrial zoning using Civix (I-1, I-2, EMP, BP zones)',
        'Consider Boone County for no occupational license tax',
        'Check if Foreign Trade Zone #161 benefits apply'
      ]
    },
    {
      order: 2,
      title: 'Secure Property',
      description: 'Lease or purchase appropriate industrial property in Northern Kentucky',
      estimatedDays: 60,
      tips: [
        'Verify zoning allows your specific warehouse use with county planning',
        'Check for any deed restrictions or easements',
        'Review truck access from public roads and state highways',
        'Assess building condition (sprinklers, electrical, loading docks)',
        'Negotiate tenant improvement allowances if leasing',
        'Contact Northern Kentucky Tri-ED for available properties'
      ]
    },
    {
      order: 3,
      title: 'Apply for Permits and Approvals',
      description: 'Submit applications for required permits to Kentucky authorities',
      estimatedDays: 60,
      tips: [
        'Apply for building permits from county building department',
        'Submit high-pile storage permit to fire department/State Fire Marshal',
        'Apply for Kentucky DOW stormwater permit (KPDES) if required',
        'Get certificate of occupancy',
        'Obtain Kentucky business license',
        'Apply for city occupational license if applicable'
      ]
    },
    {
      order: 4,
      title: 'Install Infrastructure',
      description: 'Complete buildout and install required systems',
      estimatedDays: 90,
      tips: [
        'Install or upgrade fire sprinkler system if needed',
        'Set up racking systems (permitted design)',
        'Install security systems (cameras, access control)',
        'Coordinate electrical with Duke Energy for equipment needs',
        'Install dock equipment (levelers, bumpers, lights)'
      ]
    },
    {
      order: 5,
      title: 'Obtain Insurance and Registrations',
      description: 'Secure required insurance and business registrations for Kentucky',
      estimatedDays: 30,
      tips: [
        'Obtain commercial property and liability insurance',
        'Set up warehouse legal liability coverage',
        'Register for Kentucky state taxes',
        'Register with Kentucky Labor Cabinet for workers comp',
        'Get FMCSA authority if operating trucks interstate',
        'Get KYTC motor carrier authority if operating intrastate'
      ]
    },
    {
      order: 6,
      title: 'Pass Final Inspections',
      description: 'Complete inspections and obtain certificate of occupancy',
      estimatedDays: 30,
      tips: [
        'Schedule and pass fire inspection',
        'Pass building inspection from county',
        'Complete fire sprinkler inspection and test',
        'Obtain certificate of occupancy',
        'Document compliance for ongoing operations'
      ]
    },
    {
      order: 7,
      title: 'Begin Operations',
      description: 'Launch warehouse operations in Northern Kentucky',
      estimatedDays: 14,
      tips: [
        'Train employees on safety and procedures',
        'Implement inventory management system',
        'Establish receiving and shipping procedures',
        'Set up customer/vendor relationships',
        'Schedule regular safety and fire inspections',
        'Register for city occupational license payroll withholding'
      ]
    }
  ]
};

export async function seedWarehousingLogisticsKY() {
  console.log('Seeding Kentucky warehousing/logistics data...');

  // Seed permit requirements
  for (const permit of WAREHOUSING_PERMIT_REQUIREMENTS_KY) {
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
  console.log(`Seeded ${WAREHOUSING_PERMIT_REQUIREMENTS_KY.length} Kentucky warehousing permit requirements`);

  // Seed building codes
  for (const code of WAREHOUSING_BUILDING_CODES_KY) {
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
  console.log(`Seeded ${WAREHOUSING_BUILDING_CODES_KY.length} Kentucky warehousing building codes`);

  // Seed common questions
  for (const qa of WAREHOUSING_COMMON_QUESTIONS_KY) {
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
  console.log(`Seeded ${WAREHOUSING_COMMON_QUESTIONS_KY.length} Kentucky warehousing common questions`);

  // Seed business checklist
  const existingChecklist = await prisma.businessChecklist.findFirst({
    where: { name: WAREHOUSING_BUSINESS_CHECKLIST_KY.name },
  });

  if (existingChecklist) {
    await prisma.businessChecklist.update({
      where: { id: existingChecklist.id },
      data: {
        category: WAREHOUSING_BUSINESS_CHECKLIST_KY.category,
        description: WAREHOUSING_BUSINESS_CHECKLIST_KY.description,
        steps: WAREHOUSING_BUSINESS_CHECKLIST_KY.steps,
      },
    });
  } else {
    await prisma.businessChecklist.create({
      data: WAREHOUSING_BUSINESS_CHECKLIST_KY,
    });
  }
  console.log('Seeded Kentucky warehousing business checklist');

  console.log('Kentucky warehousing/logistics seeding complete!');
}

export {
  WAREHOUSING_PERMIT_REQUIREMENTS_KY,
  WAREHOUSING_BUILDING_CODES_KY,
  WAREHOUSING_COMMON_QUESTIONS_KY,
  WAREHOUSING_BUSINESS_CHECKLIST_KY
};
