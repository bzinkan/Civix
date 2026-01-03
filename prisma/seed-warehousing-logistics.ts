import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Warehousing and Logistics Permit Requirements
const WAREHOUSING_PERMIT_REQUIREMENTS = [
  {
    activityType: 'Warehouse/Storage Facility',
    category: 'Warehousing/Logistics',
    activityDescription: 'Facility for storing goods, inventory, and materials for distribution',
    zonesRequired: ['I-1', 'I-2', 'M-1', 'M-2', 'W', 'BP'],
    zonesProhibited: ['R-1', 'R-2', 'R-3', 'R-4', 'SF', 'C-1', 'O-1', 'O-2'],
    feeBase: 500,
    processingDays: 45,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Local Zoning Code; Ohio Building Code; Fire Code',
    requirements: [
      'Industrial zoning required',
      'Site plan showing building, parking, truck circulation',
      'Building permit for any construction/renovation',
      'Fire safety plan and sprinkler requirements',
      'Certificate of occupancy',
      'Business license',
      'Loading dock requirements based on size',
      'Stormwater management plan',
      'Traffic impact study may be required',
      'Screening/landscaping along residential boundaries',
      'Hazardous materials permit if storing hazmat'
    ]
  },
  {
    activityType: 'Distribution Center',
    category: 'Warehousing/Logistics',
    activityDescription: 'Large-scale facility for receiving, storing, and shipping goods with significant truck traffic',
    zonesRequired: ['I-1', 'I-2', 'M-1', 'M-2', 'W', 'BP'],
    zonesProhibited: ['R-1', 'R-2', 'R-3', 'R-4', 'SF', 'C-1', 'C-2', 'O-1'],
    feeBase: 1000,
    processingDays: 90,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Local Zoning Code; Ohio Building Code; ODOT',
    requirements: [
      'Heavy industrial zoning typically required',
      'Traffic impact study required',
      'Truck route plan showing access to highways',
      'Site plan with truck turning radii and queuing',
      'Building permit for warehouse construction',
      'Fire suppression system (high-pile storage)',
      'Stormwater detention/retention',
      'Environmental review may be required',
      'Noise mitigation measures',
      'Hours of operation restrictions may apply',
      'Road improvement agreement may be required',
      'Utility capacity verification'
    ]
  },
  {
    activityType: 'Fulfillment Center/E-commerce Warehouse',
    category: 'Warehousing/Logistics',
    activityDescription: 'Warehouse focused on e-commerce order fulfillment with high throughput of small packages',
    zonesRequired: ['I-1', 'I-2', 'M-1', 'M-2', 'W', 'BP'],
    zonesProhibited: ['R-1', 'R-2', 'R-3', 'R-4', 'SF', 'C-1'],
    feeBase: 750,
    processingDays: 60,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Local Zoning Code; Ohio Building Code',
    requirements: [
      'Industrial zoning required',
      'Traffic study (high vehicle counts - delivery vans, employee shifts)',
      'Parking for large employee counts (3 shifts common)',
      'Loading dock and package processing areas',
      'Conveyor and automation systems permits',
      'Electrical capacity for automation equipment',
      'Fire safety for high-pile storage and lithium batteries',
      'Shift change traffic management plan',
      'Employee amenities (break rooms, restrooms per code)'
    ]
  },
  {
    activityType: 'Cold Storage/Refrigerated Warehouse',
    category: 'Warehousing/Logistics',
    activityDescription: 'Temperature-controlled warehouse for perishable goods, frozen foods, and pharmaceuticals',
    zonesRequired: ['I-1', 'I-2', 'M-1', 'M-2', 'W'],
    zonesProhibited: ['R-1', 'R-2', 'R-3', 'R-4', 'SF', 'C-1', 'C-2'],
    feeBase: 1000,
    processingDays: 90,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Local Zoning Code; Ohio Building Code; FDA/USDA',
    requirements: [
      'Industrial zoning required',
      'Refrigeration system permits',
      'Ammonia handling plan if using ammonia refrigerant',
      'Enhanced fire protection for cold storage',
      'Electrical capacity for refrigeration systems',
      'FDA Food Facility Registration if storing food',
      'USDA inspection if storing meat/poultry',
      'Temperature monitoring and alarm systems',
      'Backup power for refrigeration',
      'Insulation and vapor barrier requirements',
      'Dock seal requirements'
    ]
  },
  {
    activityType: 'Trucking Terminal/Freight Yard',
    category: 'Warehousing/Logistics',
    activityDescription: 'Facility for parking, loading, and transferring freight between trucks',
    zonesRequired: ['I-1', 'I-2', 'M-1', 'M-2', 'W'],
    zonesProhibited: ['R-1', 'R-2', 'R-3', 'R-4', 'SF', 'C-1', 'C-2', 'O-1'],
    feeBase: 750,
    processingDays: 60,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Local Zoning Code; FMCSA Regulations',
    requirements: [
      'Heavy industrial zoning required',
      'Site plan showing truck parking, staging, and circulation',
      'Stormwater management (large impervious area)',
      'Noise mitigation (backup alarms, refrigerated trailer units)',
      'Lighting plan (security, spillover to adjacent properties)',
      'Fuel storage tank permits if on-site fueling',
      'Scale house permits if weighing trucks',
      'FMCSA operating authority',
      'Environmental review for potential contamination',
      'Screening/fencing requirements',
      'Hours of operation may be restricted'
    ]
  },
  {
    activityType: 'Self-Storage Facility',
    category: 'Warehousing/Logistics',
    activityDescription: 'Mini-storage facility with individual rental units for personal and business storage',
    zonesRequired: ['I-1', 'M-1', 'C-2', 'C-3', 'MU'],
    zonesProhibited: ['R-1', 'R-2', 'R-3', 'SF', 'O-1', 'O-2'],
    feeBase: 500,
    processingDays: 45,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Local Zoning Code; Ohio Building Code',
    requirements: [
      'Light industrial or commercial zoning',
      'Site plan showing building layout and access',
      'Building permit for construction',
      'Fire safety requirements (sprinklers for larger facilities)',
      'Security plan (gates, cameras, lighting)',
      'Office/manager space requirements',
      'Signage permit',
      'Stormwater management',
      'No overnight stays/habitation',
      'Restrictions on hazardous material storage',
      'ADA accessible units required',
      'Climate-controlled units have additional requirements'
    ]
  },
  {
    activityType: 'Last-Mile Delivery Hub',
    category: 'Warehousing/Logistics',
    activityDescription: 'Small warehouse for local delivery operations (Amazon, FedEx, UPS contractors)',
    zonesRequired: ['I-1', 'M-1', 'C-2', 'C-3', 'MU', 'BP'],
    zonesProhibited: ['R-1', 'R-2', 'R-3', 'R-4', 'SF', 'O-1'],
    feeBase: 300,
    processingDays: 30,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Local Zoning Code',
    requirements: [
      'Light industrial or commercial zoning',
      'Site plan showing van parking and loading',
      'Parking for delivery fleet (significant spaces needed)',
      'Employee parking separate from fleet parking',
      'Early morning operations may require noise mitigation',
      'Traffic pattern showing van ingress/egress',
      'Building permit for any modifications',
      'Business license',
      'DOT compliance for commercial vehicles'
    ]
  },
  {
    activityType: 'Hazardous Materials Storage',
    category: 'Warehousing/Logistics',
    activityDescription: 'Facility for storing hazardous materials, chemicals, or dangerous goods',
    zonesRequired: ['I-2', 'M-2'],
    zonesProhibited: ['R-1', 'R-2', 'R-3', 'R-4', 'SF', 'C-1', 'C-2', 'I-1', 'O-1', 'O-2'],
    feeBase: 2000,
    processingDays: 120,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Local Zoning Code; Ohio EPA; Fire Code; OSHA',
    requirements: [
      'Heavy industrial zoning required',
      'Environmental impact assessment',
      'Ohio EPA permits (may include air, water, waste)',
      'Fire department hazmat permit',
      'Spill prevention and containment plan',
      'Secondary containment for storage areas',
      'Emergency response plan',
      'Distance requirements from residential areas',
      'OSHA Process Safety Management compliance',
      'Community right-to-know reporting',
      'Specialized fire suppression systems',
      'Regular inspections by fire department and EPA'
    ]
  },
  {
    activityType: 'Intermodal/Rail-Served Facility',
    category: 'Warehousing/Logistics',
    activityDescription: 'Warehouse or distribution center with railroad access for intermodal container transfer',
    zonesRequired: ['I-1', 'I-2', 'M-2', 'W'],
    zonesProhibited: ['R-1', 'R-2', 'R-3', 'R-4', 'SF', 'C-1', 'C-2', 'O-1'],
    feeBase: 1500,
    processingDays: 180,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Local Zoning Code; FRA Regulations; Ohio Rail Development Commission',
    requirements: [
      'Heavy industrial zoning with rail access',
      'Railroad siding agreement',
      'Grade crossing permits if creating new crossings',
      'Site plan showing rail and truck circulation',
      'Container handling equipment area',
      'Traffic impact study (truck and rail)',
      'Noise mitigation plan',
      'Environmental review',
      'Stormwater management for large impervious areas',
      'Coordination with railroad operator'
    ]
  }
];

// Building and Fire Codes for Warehousing
const WAREHOUSING_BUILDING_CODES = [
  {
    codeSection: 'High-Piled Storage',
    category: 'Warehousing/Logistics',
    codeText: 'Storage exceeding 12 feet in height (6 feet for high-hazard commodities) requires fire department permit, approved rack system, and enhanced fire suppression. ESFR or in-rack sprinklers may be required based on commodity and height.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Ohio Fire Code Chapter 32'
  },
  {
    codeSection: 'Warehouse Fire Sprinklers',
    category: 'Warehousing/Logistics',
    codeText: 'Warehouses over 12,000 square feet require automatic fire sprinkler system. Design density based on occupancy hazard classification and storage arrangement. ESFR sprinklers preferred for high-pile storage.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Ohio Building Code; NFPA 13'
  },
  {
    codeSection: 'Loading Dock Requirements',
    category: 'Warehousing/Logistics',
    codeText: 'Loading docks require dock levelers or dock plates for safe loading. Dock bumpers and wheel chocks required. Adequate lighting (5 footcandles minimum). Vehicle restraints recommended for trailer security.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'OSHA; Ohio Building Code'
  },
  {
    codeSection: 'Truck Maneuvering Space',
    category: 'Warehousing/Logistics',
    codeText: 'Site design must accommodate truck turning radii: WB-50 (50-foot trailer) requires 45-foot inside radius, 106-foot outside radius for 180-degree turn. Approach aprons minimum 60-120 feet depending on dock angle.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Local Zoning/Engineering Standards'
  },
  {
    codeSection: 'Cold Storage Fire Protection',
    category: 'Warehousing/Logistics',
    codeText: 'Refrigerated and freezer storage requires specialized fire protection. Dry-pipe or preaction systems for freezer areas. Enhanced insulation creates fire loading concerns. Antifreeze systems prohibited in food storage areas.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'NFPA 13; Ohio Fire Code'
  },
  {
    codeSection: 'Forklift and Equipment Aisles',
    category: 'Warehousing/Logistics',
    codeText: 'Forklift aisles must be minimum 12 feet wide for adequate clearance and maneuvering. Pedestrian walkways minimum 28 inches wide with protective barriers from forklift traffic. Floor must support forklift loads.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'OSHA 1910.176'
  },
  {
    codeSection: 'Battery Charging Areas',
    category: 'Warehousing/Logistics',
    codeText: 'Forklift battery charging areas require ventilation (1 CFM per sq ft minimum), eye wash station within 25 feet, fire extinguisher, spill containment for acid batteries. Lithium battery charging has additional requirements.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'OSHA 1910.178; NFPA 505'
  },
  {
    codeSection: 'Stormwater Management - Logistics',
    category: 'Warehousing/Logistics',
    codeText: 'Large impervious areas (warehouses, parking, truck yards) require stormwater management: detention/retention basins sized for 100-year storm, water quality treatment for first flush, oil/water separators for truck areas.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Ohio EPA; Local Stormwater Regulations'
  }
];

// Common Questions about Warehousing and Logistics
const WAREHOUSING_COMMON_QUESTIONS = [
  {
    question: 'What zoning do I need for a warehouse?',
    answer: 'Warehouses require industrial zoning, typically: I-1 (Light Industrial) for general warehousing and distribution; I-2 or M-2 (Heavy Industrial) for operations with significant truck traffic, outdoor storage, or hazardous materials. Commercial zones (C-2, C-3) may allow limited warehousing as accessory to retail in some jurisdictions. Residential and office zones prohibit warehouse uses. Use Civix to check your specific property\'s zoning classification.',
    category: 'Warehousing/Logistics',
    tags: ['zoning', 'industrial', 'warehouse', 'location']
  },
  {
    question: 'What permits do I need to open a warehouse?',
    answer: 'Opening a warehouse requires: 1) Zoning compliance verification; 2) Building permit for any construction or renovation; 3) Certificate of occupancy; 4) Fire safety permit (especially for high-pile storage); 5) Business license; 6) Ohio EPA permits if storing hazardous materials; 7) Food facility registration if storing food products; 8) Stormwater permit for large sites. You may also need a traffic impact study for larger facilities. Permit costs can range from $1,000 to $10,000+ depending on size and complexity.',
    category: 'Warehousing/Logistics',
    tags: ['permits', 'warehouse', 'building', 'fire safety']
  },
  {
    question: 'What are the fire safety requirements for high-pile storage?',
    answer: 'High-pile storage (over 12 feet, or 6 feet for high-hazard commodities) has strict fire requirements: 1) Fire department permit required; 2) Automatic fire sprinklers (ESFR or in-rack systems); 3) Approved rack design and aisle widths; 4) Maximum storage heights based on commodity class; 5) Posted storage plans; 6) Fire department access aisles; 7) Commodity classification documentation; 8) Regular fire inspections. Failure to comply can result in citations and forced storage reduction.',
    category: 'Warehousing/Logistics',
    tags: ['fire safety', 'high-pile', 'storage', 'sprinklers']
  },
  {
    question: 'Can I operate a trucking company from industrial property?',
    answer: 'Yes, trucking terminals are permitted in heavy industrial zones (I-2, M-2). Requirements include: 1) Adequate parking and staging for trucks; 2) Truck turning radii accommodated on site; 3) Access to approved truck routes (some roads restrict heavy vehicles); 4) Stormwater management for large paved areas; 5) Noise mitigation if near residential; 6) FMCSA operating authority; 7) DOT compliance for commercial vehicles. Fuel storage on-site requires additional permits.',
    category: 'Warehousing/Logistics',
    tags: ['trucking', 'terminal', 'freight', 'industrial']
  },
  {
    question: 'What are the requirements for a cold storage warehouse?',
    answer: 'Cold storage warehouses have additional requirements beyond standard warehouses: 1) Refrigeration system permits and inspections; 2) Ammonia handling plan and permits if using ammonia; 3) Specialized fire suppression for freezer areas (dry-pipe or preaction); 4) Significant electrical capacity for refrigeration; 5) FDA Food Facility Registration for food storage; 6) USDA inspection for meat/poultry; 7) Backup power for refrigeration; 8) Temperature monitoring and alarm systems; 9) Vapor barriers and insulation requirements.',
    category: 'Warehousing/Logistics',
    tags: ['cold storage', 'refrigerated', 'food', 'freezer']
  },
  {
    question: 'Do I need environmental permits for a warehouse?',
    answer: 'Environmental permits depend on your operations: 1) Stormwater permit required for large impervious surfaces (SWPPP); 2) Air quality permit if emissions from equipment; 3) Hazardous waste generator permit if generating hazmat waste; 4) Spill prevention plan (SPCC) if storing oil/fuel; 5) Wastewater permit if industrial discharge. Standard warehousing with no hazmat typically only needs stormwater permits. Ohio EPA and local environmental departments have jurisdiction.',
    category: 'Warehousing/Logistics',
    tags: ['environmental', 'permits', 'epa', 'stormwater']
  },
  {
    question: 'How much parking is required for a warehouse?',
    answer: 'Warehouse parking requirements vary by jurisdiction and use: 1) General warehouse: 1 space per 2,000-5,000 sq ft of floor area; 2) Distribution/fulfillment: 1 space per 500-1,000 sq ft (higher employee counts); 3) Must provide truck loading spaces separate from parking; 4) ADA accessible spaces required (1 per 25 spaces typically). High-turnover facilities like fulfillment centers need significantly more parking for shift changes. A traffic study can determine actual demand.',
    category: 'Warehousing/Logistics',
    tags: ['parking', 'warehouse', 'requirements', 'traffic']
  },
  {
    question: 'Can I store hazardous materials in my warehouse?',
    answer: 'Storing hazardous materials requires special permits and zoning: 1) Heavy industrial zoning (I-2, M-2) typically required; 2) Fire department hazmat storage permit; 3) Ohio EPA permits depending on material type; 4) Spill prevention and containment (secondary containment); 5) Distance requirements from residential areas and sensitive receptors; 6) Specialized fire suppression systems; 7) Emergency response plan; 8) Employee training and safety equipment; 9) Community right-to-know reporting (EPCRA). Storage quantities are limited by fire code.',
    category: 'Warehousing/Logistics',
    tags: ['hazmat', 'hazardous materials', 'storage', 'permits']
  },
  {
    question: 'What are the truck access requirements for warehouses?',
    answer: 'Warehouse truck access requirements include: 1) Access to designated truck routes (check local restrictions); 2) Adequate turning radius on-site (WB-50 trailer needs 45-foot inside radius); 3) Approach aprons of 60-120 feet for loading docks; 4) Turn lanes or deceleration lanes on public roads may be required; 5) Site entrance adequate for truck dimensions; 6) Internal circulation that prevents trucks from blocking public streets. Traffic impact studies often required for larger facilities.',
    category: 'Warehousing/Logistics',
    tags: ['truck', 'access', 'turning radius', 'traffic']
  },
  {
    question: 'How do I start a self-storage business?',
    answer: 'Starting a self-storage facility requires: 1) Find light industrial or commercial zoning that allows self-storage; 2) Site plan approval showing building layout and access; 3) Building permits for construction; 4) Fire safety requirements (sprinklers for larger facilities); 5) Security systems (gates, cameras, lighting); 6) Office/manager space; 7) Signage permits; 8) Business license. Some jurisdictions have specific self-storage ordinances. Climate-controlled units have additional mechanical requirements. Typical development costs are $25-50 per square foot.',
    category: 'Warehousing/Logistics',
    tags: ['self-storage', 'mini storage', 'startup', 'facility']
  },
  {
    question: 'What insurance do I need for a warehouse?',
    answer: 'Warehouse operations typically need: 1) Commercial property insurance for building and contents; 2) General liability insurance ($1M+ typical); 3) Warehouse legal liability for customer goods; 4) Workers compensation (required with employees); 5) Commercial auto for trucks/forklifts on public roads; 6) Umbrella policy for additional liability; 7) Business interruption insurance; 8) Equipment breakdown coverage. Cold storage and hazmat facilities have specialized insurance requirements. Costs vary significantly by operation type and stored goods.',
    category: 'Warehousing/Logistics',
    tags: ['insurance', 'liability', 'coverage', 'warehouse']
  }
];

// Warehousing Business Startup Checklist
const WAREHOUSING_BUSINESS_CHECKLIST = {
  name: 'Warehouse/Logistics Business Startup',
  category: 'Warehousing/Logistics',
  description: 'Checklist for starting a warehouse or logistics operation in the Cincinnati area',
  steps: [
    {
      order: 1,
      title: 'Identify Location Requirements',
      description: 'Determine space needs, truck access, and zoning requirements',
      estimatedDays: 30,
      tips: [
        'Calculate square footage needs based on storage requirements',
        'Determine ceiling height requirements (24-40 feet typical for modern warehousing)',
        'Identify truck access and loading dock needs',
        'Check proximity to highways and transportation routes',
        'Verify industrial zoning using Civix'
      ]
    },
    {
      order: 2,
      title: 'Secure Property',
      description: 'Lease or purchase appropriate industrial property',
      estimatedDays: 60,
      tips: [
        'Verify zoning allows your specific warehouse use',
        'Check for any deed restrictions or easements',
        'Review truck access from public roads',
        'Assess building condition (sprinklers, electrical, loading docks)',
        'Negotiate tenant improvement allowances if leasing'
      ]
    },
    {
      order: 3,
      title: 'Apply for Permits and Approvals',
      description: 'Submit applications for required permits',
      estimatedDays: 60,
      tips: [
        'Apply for building permits for any construction/renovation',
        'Submit high-pile storage permit to fire department',
        'Apply for stormwater permit if required',
        'Get certificate of occupancy',
        'Obtain business license'
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
        'Set up electrical for equipment',
        'Install dock equipment (levelers, bumpers, lights)'
      ]
    },
    {
      order: 5,
      title: 'Obtain Insurance and Registrations',
      description: 'Secure required insurance and business registrations',
      estimatedDays: 30,
      tips: [
        'Obtain commercial property and liability insurance',
        'Set up warehouse legal liability coverage',
        'Register for state and local taxes',
        'Register with Ohio BWC for workers comp',
        'Get FMCSA authority if operating trucks'
      ]
    },
    {
      order: 6,
      title: 'Pass Final Inspections',
      description: 'Complete inspections and obtain certificate of occupancy',
      estimatedDays: 30,
      tips: [
        'Schedule and pass fire inspection',
        'Pass building inspection',
        'Complete fire sprinkler inspection and test',
        'Obtain certificate of occupancy',
        'Document compliance for ongoing operations'
      ]
    },
    {
      order: 7,
      title: 'Begin Operations',
      description: 'Launch warehouse operations',
      estimatedDays: 14,
      tips: [
        'Train employees on safety and procedures',
        'Implement inventory management system',
        'Establish receiving and shipping procedures',
        'Set up customer/vendor relationships',
        'Schedule regular safety and fire inspections'
      ]
    }
  ]
};

export async function seedWarehousingLogistics() {
  console.log('Seeding warehousing/logistics data...');

  // Seed permit requirements
  for (const permit of WAREHOUSING_PERMIT_REQUIREMENTS) {
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
  console.log(`Seeded ${WAREHOUSING_PERMIT_REQUIREMENTS.length} warehousing permit requirements`);

  // Seed building codes
  for (const code of WAREHOUSING_BUILDING_CODES) {
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
  console.log(`Seeded ${WAREHOUSING_BUILDING_CODES.length} warehousing building codes`);

  // Seed common questions
  for (const qa of WAREHOUSING_COMMON_QUESTIONS) {
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
  console.log(`Seeded ${WAREHOUSING_COMMON_QUESTIONS.length} warehousing common questions`);

  // Seed business checklist
  const existingChecklist = await prisma.businessChecklist.findFirst({
    where: { name: WAREHOUSING_BUSINESS_CHECKLIST.name },
  });

  if (existingChecklist) {
    await prisma.businessChecklist.update({
      where: { id: existingChecklist.id },
      data: {
        category: WAREHOUSING_BUSINESS_CHECKLIST.category,
        description: WAREHOUSING_BUSINESS_CHECKLIST.description,
        steps: WAREHOUSING_BUSINESS_CHECKLIST.steps,
      },
    });
  } else {
    await prisma.businessChecklist.create({
      data: WAREHOUSING_BUSINESS_CHECKLIST,
    });
  }
  console.log('Seeded warehousing business checklist');

  console.log('Warehousing/logistics seeding complete!');
}

export {
  WAREHOUSING_PERMIT_REQUIREMENTS,
  WAREHOUSING_BUILDING_CODES,
  WAREHOUSING_COMMON_QUESTIONS,
  WAREHOUSING_BUSINESS_CHECKLIST
};
