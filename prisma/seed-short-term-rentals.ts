import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Short-term Rental (Airbnb/VRBO) Permit Requirements
const SHORT_TERM_RENTAL_PERMITS = [
  {
    activityType: 'Short-Term Rental - Owner Occupied',
    category: 'Short-Term Rentals',
    activityDescription: 'Renting out a room or portion of your primary residence for periods less than 30 days while you live on-site',
    zonesRequired: ['R-1', 'R-2', 'R-3', 'R-4', 'R-5', 'RM', 'RMX', 'SF', 'MF', 'PUD'],
    zonesProhibited: ['I-1', 'I-2', 'M-1', 'M-2'],
    feeBase: 150,
    processingDays: 14,
    requiresPlans: false,
    requiresInspection: true,
    ordinanceRef: 'Cincinnati Municipal Code Chapter 1101',
    requirements: [
      'Must be your primary residence (live there 50%+ of the year)',
      'Maximum 2 guest rooms for rental',
      'Fire safety inspection required',
      'Smoke detectors and CO detectors in each guest room',
      'Fire extinguisher on each floor',
      'Annual registration renewal required',
      'Must provide 24/7 local contact information',
      'Liability insurance minimum $500,000 recommended',
      'Collect and remit lodging/transient occupancy tax'
    ]
  },
  {
    activityType: 'Short-Term Rental - Non-Owner Occupied',
    category: 'Short-Term Rentals',
    activityDescription: 'Renting out an entire dwelling unit (house, condo, apartment) that is not your primary residence for periods less than 30 days',
    zonesRequired: ['R-2', 'R-3', 'R-4', 'RM', 'RMX', 'MF', 'PUD', 'MU', 'C-1', 'C-2'],
    zonesProhibited: ['R-1', 'SF-1', 'I-1', 'I-2', 'M-1', 'M-2'],
    feeBase: 300,
    processingDays: 30,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Cincinnati Municipal Code Chapter 1101',
    requirements: [
      'Site plan showing parking (1 space per 2 guests)',
      'Floor plan with emergency exits marked',
      'Fire safety inspection and certificate',
      'Building inspection for occupancy compliance',
      'Smoke and CO detectors hardwired with battery backup',
      'Fire extinguisher on each floor',
      'Posted emergency evacuation plan',
      'Local property manager within 30 minutes required',
      'Neighborhood notification may be required',
      'HOA approval if applicable',
      'Liability insurance minimum $1,000,000',
      'Collect and remit lodging/transient occupancy tax (7% Hamilton County)',
      'Annual registration renewal required'
    ]
  },
  {
    activityType: 'Short-Term Rental - Multi-Unit Property',
    category: 'Short-Term Rentals',
    activityDescription: 'Operating multiple short-term rental units in a building or managing multiple STR properties',
    zonesRequired: ['RM', 'RMX', 'MF', 'MU', 'C-1', 'C-2', 'C-3', 'PUD'],
    zonesProhibited: ['R-1', 'R-2', 'SF', 'I-1', 'I-2'],
    feeBase: 500,
    processingDays: 45,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Cincinnati Municipal Code Chapter 1101',
    requirements: [
      'Business license required',
      'Each unit requires separate STR permit',
      'Property management plan required',
      'Fire safety plan for entire building',
      'Commercial insurance coverage',
      'ADA accessibility compliance for common areas',
      'Designated local property manager',
      'Quarterly reporting to city may be required',
      'Parking plan (1 space per unit minimum)',
      'Noise mitigation plan',
      'Trash/recycling management plan',
      'Good neighbor policy documentation'
    ]
  },
  {
    activityType: 'Bed and Breakfast',
    category: 'Short-Term Rentals',
    activityDescription: 'Owner-occupied lodging establishment offering overnight accommodations and breakfast service to guests',
    zonesRequired: ['R-2', 'R-3', 'R-4', 'RM', 'MU', 'C-1', 'C-2', 'PUD', 'H'],
    zonesProhibited: ['R-1', 'SF-1', 'I-1', 'I-2', 'M-1', 'M-2'],
    feeBase: 400,
    processingDays: 45,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Cincinnati Municipal Code Chapter 1101; Ohio Revised Code 3717',
    requirements: [
      'Must be owner-occupied (live on premises)',
      'Maximum 6 guest rooms typically',
      'Food service license from health department',
      'Commercial kitchen requirements may apply',
      'Fire safety inspection and certificate',
      'Building code compliance for lodging',
      'Sign permit if displaying signage',
      'Parking requirements (varies by jurisdiction)',
      'Liability insurance required',
      'Lodging tax collection and remittance',
      'Annual health department inspection',
      'Food handler certifications for staff'
    ]
  },
  {
    activityType: 'Vacation Rental - Kentucky',
    category: 'Short-Term Rentals',
    activityDescription: 'Short-term rental property in Northern Kentucky (Boone, Kenton, Campbell counties)',
    zonesRequired: ['R-2', 'R-3', 'R-4', 'RM', 'MU', 'C-1', 'C-2', 'PUD'],
    zonesProhibited: ['R-1', 'A-1', 'I-1', 'I-2'],
    feeBase: 200,
    processingDays: 21,
    requiresPlans: false,
    requiresInspection: true,
    ordinanceRef: 'Kentucky Revised Statutes; Local Zoning Ordinances',
    requirements: [
      'Check local city/county regulations (varies significantly)',
      'Kentucky transient room tax (1% state + local)',
      'Fire safety inspection',
      'Smoke and CO detectors required',
      'Local contact person required',
      'Some cities require conditional use permit',
      'Covington, Newport have specific STR ordinances',
      'HOA restrictions may apply',
      'Liability insurance recommended'
    ]
  }
];

// Building and Fire Code Requirements for STRs
const STR_BUILDING_CODES = [
  {
    codeSection: 'Fire Safety - Smoke Detection',
    category: 'Short-Term Rentals',
    codeText: 'Smoke alarms required in each sleeping room, outside each sleeping area, and on every level including basement. Must be interconnected.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Ohio Fire Code'
  },
  {
    codeSection: 'Fire Safety - CO Detection',
    category: 'Short-Term Rentals',
    codeText: 'Carbon monoxide detectors required on every level with a fuel-burning appliance or attached garage. Must be within 10 feet of sleeping areas.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Ohio Fire Code'
  },
  {
    codeSection: 'Egress Requirements',
    category: 'Short-Term Rentals',
    codeText: 'Each sleeping room must have at least one operable emergency escape window or door with minimum 5.7 sq ft opening, 24" minimum height, 20" minimum width.',
    effectiveDate: new Date('2018-01-01'),
    jurisdiction: 'Ohio Building Code R310'
  },
  {
    codeSection: 'Fire Extinguishers',
    category: 'Short-Term Rentals',
    codeText: 'Portable fire extinguisher (2A:10BC minimum) required on each floor, mounted in visible and accessible location.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Ohio Fire Code'
  },
  {
    codeSection: 'Maximum Occupancy',
    category: 'Short-Term Rentals',
    codeText: 'Maximum occupancy typically 2 persons per bedroom plus 2 additional persons. Cannot exceed certificate of occupancy limits.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Local Building Code'
  },
  {
    codeSection: 'Parking Requirements',
    category: 'Short-Term Rentals',
    codeText: 'Off-street parking required: minimum 1 space per rental unit plus 1 space per 2 guests over 4. On-street parking restrictions may apply.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Local Zoning Code'
  },
  {
    codeSection: 'Emergency Information Posting',
    category: 'Short-Term Rentals',
    codeText: 'Emergency contact information, evacuation routes, and property address must be prominently posted inside the rental unit.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Local STR Ordinance'
  },
  {
    codeSection: 'Pool/Hot Tub Safety',
    category: 'Short-Term Rentals',
    codeText: 'Pools require 4-foot barrier with self-closing/latching gates. Hot tubs require locking covers. Safety equipment and rules must be provided.',
    effectiveDate: new Date('2018-01-01'),
    jurisdiction: 'Ohio Building Code'
  }
];

// Common Questions about Short-Term Rentals
const STR_COMMON_QUESTIONS = [
  {
    question: 'Do I need a permit to rent my home on Airbnb?',
    answer: 'In most Cincinnati metro area jurisdictions, yes. Cincinnati requires a Short-Term Rental permit for any rental less than 30 consecutive days. Requirements vary by whether you live on the property (owner-occupied) or not. Many suburbs like Mason, West Chester, and Northern Kentucky cities have their own regulations. Always check your specific city\'s requirements before listing your property.',
    category: 'Short-Term Rentals',
    tags: ['airbnb', 'permit', 'registration', 'vrbo']
  },
  {
    question: 'What taxes do I need to pay on short-term rental income?',
    answer: 'You must collect and remit several taxes: 1) Hamilton County Lodging Tax (3%); 2) City of Cincinnati Transient Occupancy Tax (varies); 3) Ohio State Sales Tax on rentals under 30 days (5.75%); 4) Federal and state income tax on rental income. Airbnb and VRBO automatically collect some taxes in certain jurisdictions. In Kentucky, you\'ll pay Kentucky transient room tax (1%) plus local taxes. Keep detailed records of all rental income and expenses.',
    category: 'Short-Term Rentals',
    tags: ['taxes', 'lodging tax', 'income', 'airbnb']
  },
  {
    question: 'Can my HOA prohibit short-term rentals?',
    answer: 'Yes, HOAs can legally prohibit or restrict short-term rentals through their CC&Rs (Covenants, Conditions & Restrictions). Many newer subdivisions in Warren, Butler, and Clermont counties have strict rental restrictions. Before investing in an STR property or listing your home, review your HOA documents carefully and contact your HOA board. Even if not explicitly prohibited, minimum lease terms (like 6 months or 1 year) effectively ban short-term rentals.',
    category: 'Short-Term Rentals',
    tags: ['hoa', 'restrictions', 'condo', 'subdivision']
  },
  {
    question: 'What insurance do I need for a short-term rental?',
    answer: 'Standard homeowner\'s insurance typically does NOT cover short-term rental activity and claims may be denied. You need: 1) Short-term rental insurance or a landlord policy endorsement; 2) Liability coverage of at least $500,000-$1,000,000; 3) Consider umbrella policy for additional protection. Airbnb and VRBO offer Host Protection Insurance, but this is secondary coverage and has limitations. Inform your insurance company of rental activity to avoid policy cancellation.',
    category: 'Short-Term Rentals',
    tags: ['insurance', 'liability', 'coverage', 'protection']
  },
  {
    question: 'What fire safety equipment is required for a short-term rental?',
    answer: 'Ohio requires: 1) Smoke alarms in every bedroom, outside sleeping areas, and on each level (interconnected); 2) Carbon monoxide detectors on every level with fuel-burning appliances; 3) Fire extinguisher on each floor (2A:10BC rated minimum); 4) Clearly marked emergency exits; 5) Posted evacuation routes. Many jurisdictions require a fire safety inspection before issuing an STR permit. Battery-only smoke detectors may not meet requirements for non-owner-occupied rentals.',
    category: 'Short-Term Rentals',
    tags: ['fire safety', 'smoke detectors', 'inspection', 'requirements']
  },
  {
    question: 'Do I need to live in the property to operate a short-term rental?',
    answer: 'It depends on your jurisdiction and zoning. Cincinnati distinguishes between owner-occupied (you live there) and non-owner-occupied STRs. Owner-occupied rentals face fewer restrictions and lower fees. Non-owner-occupied rentals may be prohibited in certain residential zones (like R-1 single-family) and require additional permits, inspections, and a designated local contact person. Some suburbs only allow owner-occupied STRs.',
    category: 'Short-Term Rentals',
    tags: ['owner-occupied', 'zoning', 'regulations', 'primary residence']
  },
  {
    question: 'What are the penalties for operating without a permit?',
    answer: 'Operating an unlicensed short-term rental can result in: 1) Fines ranging from $100-$1,000 per day of violation; 2) Order to cease operations immediately; 3) Denial of future permit applications; 4) Potential liens on the property; 5) Legal action from neighbors. Cities actively monitor platforms like Airbnb for unlicensed properties. Cincinnati has increased enforcement and neighbors can file complaints online.',
    category: 'Short-Term Rentals',
    tags: ['penalties', 'fines', 'enforcement', 'compliance']
  },
  {
    question: 'How do I handle noise complaints from neighbors?',
    answer: 'Proactive steps to prevent issues: 1) Establish clear house rules about quiet hours (typically 10pm-8am); 2) Limit occupancy to prevent parties; 3) Use noise monitoring devices (like NoiseAware) that alert you to loud gatherings; 4) Screen guests and avoid one-night weekend bookings; 5) Provide local contact info to neighbors; 6) Respond quickly to complaints. Document all communications. Repeated complaints can result in permit revocation.',
    category: 'Short-Term Rentals',
    tags: ['noise', 'neighbors', 'complaints', 'house rules']
  },
  {
    question: 'Can I rent out my apartment or condo as a short-term rental?',
    answer: 'Possibly, but check multiple sources: 1) Your lease agreement - most prohibit subletting without landlord approval; 2) Condo association rules - many prohibit or restrict STRs; 3) Building rules for multi-family properties; 4) Local zoning - some zones prohibit STRs in apartment buildings. In Cincinnati, multi-unit STRs face additional requirements. Getting caught violating your lease could result in eviction.',
    category: 'Short-Term Rentals',
    tags: ['apartment', 'condo', 'lease', 'landlord']
  },
  {
    question: 'What is the difference between short-term and long-term rentals for permits?',
    answer: 'Short-term rentals (less than 30 consecutive days) require STR permits and lodging tax collection. Long-term rentals (30+ days) require a rental registration/license in Cincinnati and inspections but no lodging tax. The 30-day threshold is key - some hosts avoid STR regulations by requiring minimum 30-day stays, which is legal but limits your market. Some areas measure by total days rented per year, not consecutive days.',
    category: 'Short-Term Rentals',
    tags: ['short-term', 'long-term', 'definitions', '30 days']
  }
];

// STR Business Checklist
const STR_BUSINESS_CHECKLIST = {
  name: 'Short-Term Rental Startup',
  category: 'Short-Term Rentals',
  description: 'Complete checklist for starting a short-term rental (Airbnb/VRBO) business in the Cincinnati metro area',
  steps: [
    {
      order: 1,
      title: 'Check Zoning and HOA Restrictions',
      description: 'Verify your property is in a zone that allows short-term rentals and check HOA/condo rules',
      estimatedDays: 7,
      tips: [
        'Use Civix to look up your zoning classification',
        'Request written confirmation from your HOA if applicable',
        'Review deed restrictions on your property',
        'Contact city planning department if unsure'
      ]
    },
    {
      order: 2,
      title: 'Review Insurance Coverage',
      description: 'Contact your insurance provider about short-term rental coverage',
      estimatedDays: 14,
      tips: [
        'Get quotes for STR-specific policies',
        'Understand what Airbnb/VRBO host protection covers (and doesn\'t)',
        'Consider umbrella liability policy',
        'Document your property with photos before hosting'
      ]
    },
    {
      order: 3,
      title: 'Prepare Property for Inspection',
      description: 'Install required safety equipment and prepare for fire safety inspection',
      estimatedDays: 14,
      tips: [
        'Install interconnected smoke alarms in all required locations',
        'Install CO detectors on each level',
        'Purchase and mount fire extinguishers',
        'Ensure all bedrooms have proper egress windows',
        'Check that address is clearly visible from street'
      ]
    },
    {
      order: 4,
      title: 'Apply for STR Permit',
      description: 'Submit short-term rental permit application to your city',
      estimatedDays: 30,
      tips: [
        'Gather required documents: ID, proof of ownership, floor plan',
        'Pay application fee',
        'Schedule fire safety inspection',
        'Provide local contact information'
      ]
    },
    {
      order: 5,
      title: 'Register for Tax Collection',
      description: 'Set up accounts to collect and remit required lodging taxes',
      estimatedDays: 14,
      tips: [
        'Register with Ohio Department of Taxation for sales tax',
        'Register with Hamilton County for lodging tax',
        'Set up tax collection in Airbnb/VRBO (may be automatic)',
        'Consult accountant about income tax obligations'
      ]
    },
    {
      order: 6,
      title: 'Prepare Property for Guests',
      description: 'Furnish, stock, and prepare your property for short-term guests',
      estimatedDays: 21,
      tips: [
        'Provide essential furnishings and linens',
        'Stock kitchen with basic cookware and utensils',
        'Create welcome guide with house rules and local info',
        'Post emergency information and evacuation routes',
        'Set up keyless entry or lockbox',
        'Arrange cleaning service between guests'
      ]
    },
    {
      order: 7,
      title: 'Create Listings and Go Live',
      description: 'Create compelling listings on rental platforms and start accepting bookings',
      estimatedDays: 7,
      tips: [
        'Take high-quality photos (consider professional photographer)',
        'Write detailed, accurate descriptions',
        'Set competitive pricing (research comparable listings)',
        'Establish clear house rules',
        'Set up instant book or review requests',
        'Consider starting with lower prices to build reviews'
      ]
    }
  ]
};

export async function seedShortTermRentals() {
  console.log('Seeding short-term rental data...');

  // Seed permit requirements
  for (const permit of SHORT_TERM_RENTAL_PERMITS) {
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
  console.log(`Seeded ${SHORT_TERM_RENTAL_PERMITS.length} STR permit requirements`);

  // Seed building codes
  for (const code of STR_BUILDING_CODES) {
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
  console.log(`Seeded ${STR_BUILDING_CODES.length} STR building codes`);

  // Seed common questions
  for (const qa of STR_COMMON_QUESTIONS) {
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
  console.log(`Seeded ${STR_COMMON_QUESTIONS.length} STR common questions`);

  // Seed business checklist
  const existingChecklist = await prisma.businessChecklist.findFirst({
    where: { name: STR_BUSINESS_CHECKLIST.name },
  });

  if (existingChecklist) {
    await prisma.businessChecklist.update({
      where: { id: existingChecklist.id },
      data: {
        category: STR_BUSINESS_CHECKLIST.category,
        description: STR_BUSINESS_CHECKLIST.description,
        steps: STR_BUSINESS_CHECKLIST.steps,
      },
    });
  } else {
    await prisma.businessChecklist.create({
      data: STR_BUSINESS_CHECKLIST,
    });
  }
  console.log('Seeded STR business checklist');

  console.log('Short-term rental seeding complete!');
}

export {
  SHORT_TERM_RENTAL_PERMITS,
  STR_BUILDING_CODES,
  STR_COMMON_QUESTIONS,
  STR_BUSINESS_CHECKLIST
};
