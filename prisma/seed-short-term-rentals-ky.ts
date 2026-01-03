import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Kentucky Short-term Rental Seed Data
 *
 * Covers Northern Kentucky counties: Boone, Kenton, Campbell
 * Uses Kentucky zoning codes and KRS (Kentucky Revised Statutes)
 *
 * Key differences from Ohio:
 * - Kentucky transient room tax (1% state + local)
 * - Different zoning code nomenclature
 * - Local regulations vary significantly by city (Covington, Newport, Florence, etc.)
 */

// Kentucky zone codes (Covington-style, other NKY cities may vary)
const KY_COMMERCIAL_ZONES = ['TUMU', 'CMU', 'DTC', 'DTR', 'CRM', 'AUC', 'SO'];
const KY_RESIDENTIAL_ZONES = ['RR', 'SR', 'SU', 'TUR', 'MUR'];
const KY_MIXED_USE_ZONES = ['TUMU', 'CMU', 'DTC', 'DTR', 'CRM'];
const KY_ALL_ZONES = ['*'];

// Short-term Rental Permit Requirements - Kentucky
const SHORT_TERM_RENTAL_PERMITS_KY = [
  {
    activityType: 'Short-Term Rental - Owner Occupied (KY)',
    category: 'Short-Term Rentals',
    activityDescription: 'Renting out a room or portion of your primary residence for periods less than 30 days while you live on-site (Northern Kentucky)',
    zonesRequired: [...KY_RESIDENTIAL_ZONES, ...KY_MIXED_USE_ZONES],
    zonesProhibited: ['SI', 'LI', 'GI'],
    feeBase: 100,
    processingDays: 14,
    requiresPlans: false,
    requiresInspection: true,
    ordinanceRef: 'Local Zoning Ordinance; KRS 65.760',
    requirements: [
      'Must be your primary residence',
      'Check local city regulations (Covington, Newport, Florence have different rules)',
      'Fire safety inspection may be required',
      'Smoke and CO detectors required',
      'Kentucky transient room tax (1% state + local rates)',
      'Collect and remit applicable local occupational taxes',
      'Boone County: Generally allowed with registration',
      'Kenton County/Covington: Specific STR ordinance applies',
      'Campbell County/Newport: Check local requirements'
    ]
  },
  {
    activityType: 'Short-Term Rental - Non-Owner Occupied (KY)',
    category: 'Short-Term Rentals',
    activityDescription: 'Renting out an entire dwelling unit that is not your primary residence for periods less than 30 days (Northern Kentucky)',
    zonesRequired: KY_MIXED_USE_ZONES,
    zonesProhibited: ['RR', 'SR', 'SI', 'LI', 'GI'],
    feeBase: 250,
    processingDays: 30,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Local Zoning Ordinance; KRS 65.760',
    requirements: [
      'May require conditional use permit in some jurisdictions',
      'Site plan showing parking',
      'Fire safety inspection required',
      'Building inspection for occupancy compliance',
      'Smoke and CO detectors required',
      'Local property manager required (within 30 minutes)',
      'Kentucky transient room tax collection',
      'Liability insurance minimum $500,000-$1,000,000',
      'Annual registration renewal',
      'Some NKY cities restrict non-owner-occupied STRs'
    ]
  },
  {
    activityType: 'Short-Term Rental - Covington',
    category: 'Short-Term Rentals',
    activityDescription: 'Short-term rental in City of Covington, Kentucky',
    zonesRequired: ['TUMU', 'CMU', 'DTC', 'DTR', 'CRM', 'MUR'],
    zonesProhibited: ['SI', 'LI', 'GI', 'RR'],
    feeBase: 200,
    processingDays: 21,
    requiresPlans: false,
    requiresInspection: true,
    ordinanceRef: 'Covington Code of Ordinances',
    requirements: [
      'STR registration with City of Covington required',
      'Annual registration fee',
      'Fire and building safety inspection',
      'Smoke/CO detectors required',
      'Must post registration number in all listings',
      'Local contact person within Kenton County',
      'Kentucky transient room tax (6% state + local)',
      'Covington occupational license tax applies',
      'Noise ordinance compliance',
      'Parking requirements based on unit size'
    ]
  },
  {
    activityType: 'Short-Term Rental - Newport',
    category: 'Short-Term Rentals',
    activityDescription: 'Short-term rental in City of Newport, Kentucky',
    zonesRequired: ['C-1', 'C-2', 'C-3', 'MU', 'R-3', 'R-4'],
    zonesProhibited: ['R-1', 'R-2', 'I-1', 'I-2'],
    feeBase: 150,
    processingDays: 21,
    requiresPlans: false,
    requiresInspection: true,
    ordinanceRef: 'Newport Zoning Ordinance',
    requirements: [
      'Business license from City of Newport',
      'STR registration required',
      'Fire inspection and certificate',
      'Maximum occupancy limits apply',
      'Kentucky transient room tax collection',
      'Campbell County taxes apply',
      'Local contact required',
      'Must comply with noise ordinance',
      'Entertainment district has specific rules'
    ]
  },
  {
    activityType: 'Bed and Breakfast (KY)',
    category: 'Short-Term Rentals',
    activityDescription: 'Owner-occupied lodging establishment offering overnight accommodations and breakfast service in Northern Kentucky',
    zonesRequired: [...KY_COMMERCIAL_ZONES, 'MUR', 'TUR'],
    zonesProhibited: ['SI', 'LI', 'GI'],
    feeBase: 350,
    processingDays: 45,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'KRS 219; Local Zoning; Northern KY Health Dept',
    requirements: [
      'Must be owner-occupied',
      'Maximum rooms varies by jurisdiction (typically 5-8)',
      'Northern Kentucky Health Department food service permit',
      'Commercial kitchen requirements for breakfast service',
      'Fire safety inspection required',
      'Building code compliance for lodging',
      'Sign permit if displaying signage',
      'Kentucky transient room tax',
      'Business license from city',
      'Parking requirements apply'
    ]
  }
];

// Building and Fire Code Requirements - Kentucky
const STR_BUILDING_CODES_KY = [
  {
    codeSection: 'Fire Safety - Smoke Detection (KY)',
    category: 'Short-Term Rentals',
    codeText: 'Kentucky requires smoke alarms in each sleeping room, outside each sleeping area, and on every level. Interconnection required for new construction. Battery-only alarms acceptable in existing residential if hardwired not feasible.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Kentucky Building Code; NFPA 72'
  },
  {
    codeSection: 'Fire Safety - CO Detection (KY)',
    category: 'Short-Term Rentals',
    codeText: 'Carbon monoxide detectors required in dwellings with fuel-burning appliances or attached garages. Must be installed outside sleeping areas within 10 feet of bedroom doors.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Kentucky Building Code'
  },
  {
    codeSection: 'Egress Requirements (KY)',
    category: 'Short-Term Rentals',
    codeText: 'Each sleeping room must have emergency escape window or door with minimum 5.7 sq ft opening (5.0 sq ft at grade level), minimum 24 inches height, minimum 20 inches width, maximum 44 inches sill height.',
    effectiveDate: new Date('2018-01-01'),
    jurisdiction: 'Kentucky Residential Code R310'
  },
  {
    codeSection: 'Kentucky Transient Room Tax',
    category: 'Short-Term Rentals',
    codeText: 'Kentucky imposes 1% state transient room tax on accommodations less than 30 days. Local governments may impose additional taxes. Kenton County: additional local tax applies. Campbell County: local lodging tax. Boone County: check local rates.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'KRS 142.400'
  },
  {
    codeSection: 'Maximum Occupancy (KY)',
    category: 'Short-Term Rentals',
    codeText: 'Maximum occupancy typically 2 persons per bedroom plus 2 additional. Local fire marshal may set specific limits based on building features. Cannot exceed certificate of occupancy limits where applicable.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Local Fire Code'
  },
  {
    codeSection: 'Pool/Hot Tub Safety (KY)',
    category: 'Short-Term Rentals',
    codeText: 'Swimming pools require barrier at least 48 inches high with self-closing, self-latching gates. Hot tubs require locking covers. Safety equipment and posted rules required. Fence must meet Kentucky Building Code standards.',
    effectiveDate: new Date('2018-01-01'),
    jurisdiction: 'Kentucky Building Code'
  }
];

// Common Questions - Kentucky STRs
const STR_COMMON_QUESTIONS_KY = [
  {
    question: 'Do I need a permit to rent my home on Airbnb in Northern Kentucky?',
    answer: 'Requirements vary by city in Northern Kentucky. Covington requires STR registration and annual permit. Newport requires business license and registration. Florence (Boone County) has different requirements. Unincorporated areas may have fewer restrictions but still require Kentucky transient room tax collection. Always check with your specific city before listing.',
    category: 'Short-Term Rentals',
    tags: ['airbnb', 'permit', 'northern kentucky', 'covington', 'newport']
  },
  {
    question: 'What taxes do I pay on short-term rentals in Kentucky?',
    answer: 'Kentucky STR operators must collect and remit: 1) Kentucky state transient room tax (1%); 2) Local transient room taxes (varies by county/city - typically 3-6%); 3) Kentucky state sales tax (6%); 4) Local occupational license tax in some cities like Covington. Airbnb collects some taxes automatically in Kentucky, but verify what\'s covered. Total tax burden typically 10-13% depending on location.',
    category: 'Short-Term Rentals',
    tags: ['taxes', 'kentucky', 'transient room tax', 'sales tax']
  },
  {
    question: 'Can my HOA prohibit short-term rentals in Kentucky?',
    answer: 'Yes, Kentucky law allows HOAs to restrict or prohibit short-term rentals through their CC&Rs. Many newer developments in Boone County and suburban Kenton County have rental restrictions. Review your HOA documents carefully before listing. Unlike some states, Kentucky has not passed legislation limiting HOA authority over STRs.',
    category: 'Short-Term Rentals',
    tags: ['hoa', 'restrictions', 'kentucky', 'cc&r']
  },
  {
    question: 'What insurance do I need for a Kentucky short-term rental?',
    answer: 'Standard homeowner\'s insurance typically does not cover STR activity in Kentucky. You need: 1) Short-term rental or landlord policy endorsement; 2) Liability coverage of at least $500,000; 3) Consider umbrella policy for additional protection. Airbnb/VRBO host protection is secondary coverage only. Inform your insurance company of rental activity to avoid policy voidance.',
    category: 'Short-Term Rentals',
    tags: ['insurance', 'liability', 'kentucky', 'coverage']
  },
  {
    question: 'What fire safety equipment is required for STRs in Northern Kentucky?',
    answer: 'Kentucky requires: 1) Smoke alarms in every bedroom and on each level (interconnected preferred); 2) Carbon monoxide detectors on each level with fuel-burning appliances; 3) Fire extinguisher recommended on each floor; 4) Clear emergency exits. Some cities like Covington require fire inspection before issuing STR permit. Northern Kentucky Fire Districts may have additional requirements.',
    category: 'Short-Term Rentals',
    tags: ['fire safety', 'smoke detectors', 'kentucky', 'inspection']
  },
  {
    question: 'Are there different rules for STRs in Covington vs Newport?',
    answer: 'Yes, each city has different regulations: Covington has a formal STR registration program with annual fees, requires posting registration number in listings, and has specific zoning restrictions. Newport requires business license and has entertainment district considerations. Florence and other Boone County cities have less formal requirements but still require business registration. Always check the specific city\'s ordinances.',
    category: 'Short-Term Rentals',
    tags: ['covington', 'newport', 'florence', 'local rules']
  },
  {
    question: 'How do I register my short-term rental in Covington, KY?',
    answer: 'To register an STR in Covington: 1) Verify your property is in an allowed zone (mixed-use and some residential zones); 2) Complete STR registration application with City; 3) Pass fire and building safety inspection; 4) Pay annual registration fee; 5) Obtain occupational license; 6) Post registration number in all online listings; 7) Maintain local contact person. Renewal is annual. Non-owner-occupied rentals have stricter requirements.',
    category: 'Short-Term Rentals',
    tags: ['covington', 'registration', 'process', 'permit']
  },
  {
    question: 'What are the penalties for operating an unregistered STR in Kentucky?',
    answer: 'Penalties vary by jurisdiction: Cities like Covington can issue fines for unregistered STRs (typically $100-500 per violation/day), order cease of operations, and deny future permits. Additionally, failure to collect/remit Kentucky transient room tax can result in state penalties including back taxes, interest, and fines. Some cities monitor platforms like Airbnb for compliance.',
    category: 'Short-Term Rentals',
    tags: ['penalties', 'fines', 'enforcement', 'kentucky']
  },
  {
    question: 'Can I operate a short-term rental in an apartment in Northern Kentucky?',
    answer: 'It depends on multiple factors: 1) Your lease - most prohibit subletting without landlord permission; 2) Building/condo rules - many prohibit STRs; 3) City regulations - some zones don\'t allow STRs in multi-family buildings; 4) Landlord approval in writing is essential. Operating without proper authorization can result in eviction and lease termination. Covington has specific rules for multi-family STRs.',
    category: 'Short-Term Rentals',
    tags: ['apartment', 'condo', 'lease', 'multi-family']
  },
  {
    question: 'Do I need a local contact person for my Kentucky STR?',
    answer: 'Most Northern Kentucky cities with STR regulations require a local contact person who can respond to issues within a reasonable time (typically 30-60 minutes). This person must be available 24/7 during guest stays. In Covington, the contact must be within Kenton County. The contact\'s information must be provided to neighbors and/or the city. Property management companies can serve this role.',
    category: 'Short-Term Rentals',
    tags: ['local contact', 'property manager', 'requirements', 'kentucky']
  }
];

// Kentucky STR Business Checklist
const STR_BUSINESS_CHECKLIST_KY = {
  name: 'Short-Term Rental Startup - Kentucky',
  category: 'Short-Term Rentals',
  description: 'Complete checklist for starting a short-term rental (Airbnb/VRBO) business in Northern Kentucky (Boone, Kenton, Campbell counties)',
  steps: [
    {
      order: 1,
      title: 'Check Local Regulations',
      description: 'Verify STR rules for your specific city/county in Northern Kentucky',
      estimatedDays: 7,
      tips: [
        'Covington, Newport, Florence each have different rules',
        'Check if your zone allows STRs',
        'Review any HOA/condo restrictions',
        'Contact city planning or zoning department'
      ]
    },
    {
      order: 2,
      title: 'Review Insurance Coverage',
      description: 'Contact your insurance provider about short-term rental coverage',
      estimatedDays: 14,
      tips: [
        'Standard homeowner\'s policies don\'t cover STR activity',
        'Get quotes for STR-specific policies',
        'Minimum $500,000 liability recommended',
        'Document property condition before hosting'
      ]
    },
    {
      order: 3,
      title: 'Prepare Property for Safety Inspection',
      description: 'Install required safety equipment for fire/building inspection',
      estimatedDays: 14,
      tips: [
        'Smoke alarms in all bedrooms and hallways',
        'CO detectors on each level',
        'Fire extinguisher on each floor',
        'Ensure egress windows in bedrooms meet code',
        'Verify address is clearly visible'
      ]
    },
    {
      order: 4,
      title: 'Register with City/County',
      description: 'Obtain required STR registration, business license, and permits',
      estimatedDays: 30,
      tips: [
        'Apply for STR permit/registration',
        'Obtain occupational license if required (Covington)',
        'Schedule fire/safety inspection',
        'Pay applicable fees',
        'Designate local contact person'
      ]
    },
    {
      order: 5,
      title: 'Register for Tax Collection',
      description: 'Set up accounts to collect Kentucky transient room tax and local taxes',
      estimatedDays: 14,
      tips: [
        'Register with Kentucky Department of Revenue',
        'Register for local occupational/lodging taxes',
        'Understand what Airbnb/VRBO collects automatically',
        'Set up accounting system to track taxes'
      ]
    },
    {
      order: 6,
      title: 'Prepare Property for Guests',
      description: 'Furnish, stock, and prepare your property',
      estimatedDays: 21,
      tips: [
        'Provide essential furnishings and linens',
        'Create welcome guide with house rules',
        'Post emergency info and evacuation routes',
        'Post STR registration number as required',
        'Set up keyless entry',
        'Arrange cleaning service'
      ]
    },
    {
      order: 7,
      title: 'Create Listings and Go Live',
      description: 'Create listings on rental platforms',
      estimatedDays: 7,
      tips: [
        'Include registration number in listing (required in Covington)',
        'Take high-quality photos',
        'Set competitive pricing',
        'Establish clear house rules',
        'Provide accurate description and amenities'
      ]
    }
  ]
};

export async function seedShortTermRentalsKY() {
  console.log('Seeding Kentucky short-term rental data...');

  // Seed permit requirements
  for (const permit of SHORT_TERM_RENTAL_PERMITS_KY) {
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
  console.log(`Seeded ${SHORT_TERM_RENTAL_PERMITS_KY.length} KY STR permit requirements`);

  // Seed building codes
  for (const code of STR_BUILDING_CODES_KY) {
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
  console.log(`Seeded ${STR_BUILDING_CODES_KY.length} KY STR building codes`);

  // Seed common questions
  for (const qa of STR_COMMON_QUESTIONS_KY) {
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
  console.log(`Seeded ${STR_COMMON_QUESTIONS_KY.length} KY STR common questions`);

  // Seed business checklist
  const existingChecklist = await prisma.businessChecklist.findFirst({
    where: { name: STR_BUSINESS_CHECKLIST_KY.name },
  });

  if (existingChecklist) {
    await prisma.businessChecklist.update({
      where: { id: existingChecklist.id },
      data: {
        category: STR_BUSINESS_CHECKLIST_KY.category,
        description: STR_BUSINESS_CHECKLIST_KY.description,
        steps: STR_BUSINESS_CHECKLIST_KY.steps,
      },
    });
  } else {
    await prisma.businessChecklist.create({
      data: STR_BUSINESS_CHECKLIST_KY,
    });
  }
  console.log('Seeded KY STR business checklist');

  console.log('Kentucky short-term rental seeding complete!');
}

export {
  SHORT_TERM_RENTAL_PERMITS_KY,
  STR_BUILDING_CODES_KY,
  STR_COMMON_QUESTIONS_KY,
  STR_BUSINESS_CHECKLIST_KY
};
