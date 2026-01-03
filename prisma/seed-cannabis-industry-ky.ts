import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Kentucky Cannabis/CBD Industry Seed Data
 *
 * Covers Northern Kentucky counties: Boone, Kenton, Campbell
 *
 * Key differences from Ohio:
 * - Kentucky has NOT legalized recreational cannabis (as of 2024)
 * - Kentucky has a limited medical cannabis program (effective Jan 2025)
 * - Hemp/CBD is legal under KY Dept of Agriculture
 * - Different regulatory framework than Ohio
 */

// Kentucky zone codes
const KY_COMMERCIAL_ZONES = ['TUMU', 'CMU', 'DTC', 'DTR', 'CRM', 'AUC', 'SO'];
const KY_INDUSTRIAL_ZONES = ['SI', 'LI', 'GI'];
const KY_AGRICULTURAL_ZONES = ['RR', 'AG'];
const KY_ALL_ZONES = ['*'];

// Cannabis and CBD Business Permit Requirements - Kentucky
const CANNABIS_PERMIT_REQUIREMENTS_KY = [
  {
    activityType: 'CBD/Hemp Retail Store (KY)',
    category: 'Cannabis/CBD',
    activityDescription: 'Retail store selling CBD products, hemp-derived products, and related accessories in Kentucky (no THC products above 0.3%)',
    zonesRequired: KY_COMMERCIAL_ZONES,
    zonesProhibited: [...KY_INDUSTRIAL_ZONES, 'RR', 'SR', 'SU'],
    feeBase: 150,
    processingDays: 21,
    requiresPlans: false,
    requiresInspection: true,
    ordinanceRef: 'KRS 260.850; 2018 Farm Bill',
    requirements: [
      'Kentucky business license from city/county',
      'Products must be derived from hemp (less than 0.3% THC)',
      'Certificate of Analysis (COA) required for all products',
      'Products must comply with FDA regulations',
      'No sales to persons under 21 for smokable hemp',
      'Age verification required',
      'Proper product labeling required',
      'No medical claims without FDA approval',
      'Kentucky Department of Agriculture hemp processor license if processing',
      'Kentucky sales tax registration'
    ]
  },
  {
    activityType: 'Medical Cannabis Dispensary (KY)',
    category: 'Cannabis/CBD',
    activityDescription: 'Licensed dispensary selling medical cannabis to registered patients (Kentucky medical cannabis program effective January 2025)',
    zonesRequired: KY_COMMERCIAL_ZONES,
    zonesProhibited: [...KY_INDUSTRIAL_ZONES, 'RR', 'SR', 'SU', 'TUR'],
    feeBase: 5000,
    processingDays: 180,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'KRS 218B; Kentucky Cabinet for Health and Family Services',
    requirements: [
      'Kentucky medical cannabis dispensary license required',
      'License applications expected to open in 2024',
      'Must be 1,000 feet from schools, daycares, public playgrounds',
      'Local government cannot ban but can impose reasonable zoning',
      'Security plan with surveillance required',
      'Seed-to-sale tracking system',
      'Background checks for all owners and employees',
      'Proof of Kentucky residency for majority ownership',
      'Significant capital requirements',
      'Local zoning approval required',
      'Note: Recreational cannabis remains ILLEGAL in Kentucky'
    ]
  },
  {
    activityType: 'Medical Cannabis Cultivator (KY)',
    category: 'Cannabis/CBD',
    activityDescription: 'Licensed facility for growing medical cannabis plants for the Kentucky medical cannabis program',
    zonesRequired: [...KY_INDUSTRIAL_ZONES, ...KY_AGRICULTURAL_ZONES],
    zonesProhibited: ['SR', 'SU', 'TUR', 'MUR', ...KY_COMMERCIAL_ZONES],
    feeBase: 10000,
    processingDays: 365,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'KRS 218B; Kentucky Cabinet for Health and Family Services',
    requirements: [
      'Kentucky cultivator license required (limited number available)',
      'Agricultural or industrial zoning',
      'Enclosed, locked facility required',
      'Security plan with 24/7 surveillance',
      'Seed-to-sale tracking',
      'Environmental controls and odor mitigation',
      'Water usage and waste disposal plan',
      'Kentucky residency requirements for ownership',
      'Background checks for all personnel',
      'Good Agricultural Practices compliance'
    ]
  },
  {
    activityType: 'Medical Cannabis Processor (KY)',
    category: 'Cannabis/CBD',
    activityDescription: 'Licensed facility for processing medical cannabis into oils, edibles, and other products for the Kentucky program',
    zonesRequired: KY_INDUSTRIAL_ZONES,
    zonesProhibited: ['RR', 'SR', 'SU', 'TUR', 'MUR', ...KY_COMMERCIAL_ZONES],
    feeBase: 10000,
    processingDays: 365,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'KRS 218B; Kentucky Cabinet for Health and Family Services',
    requirements: [
      'Kentucky processor license required',
      'Industrial zoning',
      'Food safety certifications for edibles',
      'Laboratory testing protocols',
      'Extraction equipment safety certifications',
      'Fire safety plan',
      'Hazardous materials handling if applicable',
      'Waste disposal plan',
      'Product labeling compliance',
      'Seed-to-sale tracking'
    ]
  },
  {
    activityType: 'Hemp Cultivation (KY)',
    category: 'Cannabis/CBD',
    activityDescription: 'Agricultural operation growing hemp plants (less than 0.3% THC) for CBD, fiber, or seed production in Kentucky',
    zonesRequired: [...KY_AGRICULTURAL_ZONES, KY_INDUSTRIAL_ZONES[0]],
    zonesProhibited: ['SR', 'SU', 'TUR', ...KY_COMMERCIAL_ZONES],
    feeBase: 250,
    processingDays: 30,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'KRS 260.850; Kentucky Department of Agriculture',
    requirements: [
      'Kentucky Department of Agriculture hemp license',
      'GPS coordinates of all cultivation areas',
      'Certified seed from approved sources',
      'THC testing prior to harvest (must be below 0.3%)',
      'Background check for license applicant',
      'Annual license renewal ($250)',
      'Crop must be destroyed if THC exceeds limit',
      'Submit to KDA inspections',
      'Report acreage and varieties',
      'Agricultural zoning typically required'
    ]
  },
  {
    activityType: 'Hemp Processor (KY)',
    category: 'Cannabis/CBD',
    activityDescription: 'Facility for processing hemp into CBD extracts, fiber products, or other hemp-derived products',
    zonesRequired: [...KY_INDUSTRIAL_ZONES, 'AUC'],
    zonesProhibited: ['RR', 'SR', 'SU', 'TUR'],
    feeBase: 500,
    processingDays: 45,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'KRS 260.850; Kentucky Department of Agriculture',
    requirements: [
      'Kentucky Department of Agriculture hemp processor license',
      'Industrial or appropriate commercial zoning',
      'Extraction facility safety requirements',
      'Product testing and labeling requirements',
      'COA (Certificate of Analysis) for all products',
      'FDA compliance for food/supplement products',
      'Waste disposal plan for plant material',
      'Background check for license holder',
      'Annual license renewal'
    ]
  },
  {
    activityType: 'Delta-8 THC Retail (KY)',
    category: 'Cannabis/CBD',
    activityDescription: 'Retail sale of Delta-8 THC products derived from hemp in Kentucky',
    zonesRequired: KY_COMMERCIAL_ZONES,
    zonesProhibited: KY_INDUSTRIAL_ZONES,
    feeBase: 150,
    processingDays: 21,
    requiresPlans: false,
    requiresInspection: true,
    ordinanceRef: 'KRS 260.850; FDA Guidance',
    requirements: [
      'Legal status of Delta-8 THC is evolving - verify current regulations',
      'Products must be derived from legal hemp',
      'Certificate of Analysis required',
      'No sales to persons under 21',
      'Age verification required',
      'Proper labeling with THC content',
      'No medical claims',
      'Keep current with changing state regulations',
      'Business license from city/county',
      'Kentucky sales tax registration'
    ]
  }
];

// Building and Safety Codes - Kentucky Cannabis/CBD
const CANNABIS_BUILDING_CODES_KY = [
  {
    codeSection: 'Medical Cannabis Dispensary Security (KY)',
    category: 'Cannabis/CBD',
    codeText: 'Kentucky medical cannabis dispensaries will require: commercial-grade security system, 24/7 HD video surveillance covering all areas with 90-day retention, intrusion alarm with 24/7 monitoring, secure storage for product, access control systems. Specific requirements per KRS 218B regulations.',
    effectiveDate: new Date('2025-01-01'),
    jurisdiction: 'KRS 218B; Kentucky CHFS'
  },
  {
    codeSection: 'Hemp Processing Facility (KY)',
    category: 'Cannabis/CBD',
    codeText: 'Hemp processing facilities must comply with Kentucky Building Code for industrial uses. Extraction operations require proper ventilation, fire suppression if using flammable solvents, and compliance with OSHA regulations for chemical handling.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Kentucky Building Code; OSHA'
  },
  {
    codeSection: 'CBD Retail Display (KY)',
    category: 'Cannabis/CBD',
    codeText: 'CBD products must display: THC content (must be <0.3%), CBD content per serving, batch/lot number, manufacturer information, and statement that product is derived from hemp. No FDA-unapproved health claims permitted.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'FDA; Kentucky Dept of Agriculture'
  },
  {
    codeSection: 'Medical Cannabis Distance Requirements (KY)',
    category: 'Cannabis/CBD',
    codeText: 'Kentucky medical cannabis dispensaries must be located at least 1,000 feet from schools, daycares, and public playgrounds. Distance measured property line to property line. Local governments may not impose greater distance requirements.',
    effectiveDate: new Date('2025-01-01'),
    jurisdiction: 'KRS 218B'
  },
  {
    codeSection: 'Hemp Cultivation Testing (KY)',
    category: 'Cannabis/CBD',
    codeText: 'All hemp crops must be tested for THC content within 30 days of anticipated harvest. Testing must be performed by DEA-registered laboratory. Crops exceeding 0.3% THC must be destroyed under KDA supervision.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'KRS 260.850; 7 CFR 990'
  }
];

// Common Questions - Kentucky Cannabis/CBD
const CANNABIS_COMMON_QUESTIONS_KY = [
  {
    question: 'Is recreational marijuana legal in Kentucky?',
    answer: 'No, recreational marijuana remains ILLEGAL in Kentucky. Unlike Ohio, which legalized recreational cannabis in 2023, Kentucky has not legalized adult-use cannabis. Possession of marijuana in Kentucky is still a criminal offense. However, Kentucky has passed medical cannabis legislation (SB 47) that will take effect January 1, 2025, allowing registered patients to obtain medical marijuana from licensed dispensaries.',
    category: 'Cannabis/CBD',
    tags: ['recreational', 'legal', 'kentucky', 'illegal']
  },
  {
    question: 'When will medical marijuana be available in Kentucky?',
    answer: 'Kentucky\'s medical cannabis program is scheduled to begin January 1, 2025. The Kentucky Cabinet for Health and Family Services is developing regulations throughout 2024. Patients with qualifying conditions will be able to register and obtain medical cannabis from licensed dispensaries. Qualifying conditions include cancer, chronic pain, epilepsy, multiple sclerosis, PTSD, and other specified conditions.',
    category: 'Cannabis/CBD',
    tags: ['medical', 'kentucky', '2025', 'program']
  },
  {
    question: 'Can I open a CBD store in Northern Kentucky?',
    answer: 'Yes, CBD stores selling hemp-derived products (less than 0.3% THC) are legal in Kentucky. You need: 1) Business license from your city/county; 2) Kentucky sales tax registration; 3) Products with valid Certificates of Analysis (COAs); 4) Proper labeling showing THC content; 5) Age verification for smokable products (21+). Locate in commercial zones - check with Covington, Newport, or your specific city for zoning requirements.',
    category: 'Cannabis/CBD',
    tags: ['cbd', 'store', 'kentucky', 'legal']
  },
  {
    question: 'How do I get a hemp cultivation license in Kentucky?',
    answer: 'Kentucky has one of the nation\'s leading hemp programs. To cultivate: 1) Apply to Kentucky Department of Agriculture; 2) Pass background check; 3) Provide GPS coordinates of cultivation areas; 4) Pay license fee ($250/year); 5) Use certified seed sources; 6) Allow KDA inspections; 7) Test crops before harvest. Kentucky was a pioneer in hemp and has a well-established program. Agricultural zoning typically required.',
    category: 'Cannabis/CBD',
    tags: ['hemp', 'cultivation', 'license', 'kda']
  },
  {
    question: 'Can I sell Delta-8 THC in Kentucky?',
    answer: 'The legal status of Delta-8 THC in Kentucky is complex and evolving. While derived from legal hemp, Delta-8 products exist in a regulatory gray area. Some argue they\'re legal under the 2018 Farm Bill; others say they violate federal analog drug laws. Kentucky has not specifically banned Delta-8, but regulations could change. If selling: verify current laws, require age 21+, ensure products have COAs, and consult legal counsel.',
    category: 'Cannabis/CBD',
    tags: ['delta-8', 'thc', 'kentucky', 'legal status']
  },
  {
    question: 'Will Northern Kentucky cities allow medical cannabis dispensaries?',
    answer: 'Under Kentucky\'s medical cannabis law (SB 47), local governments CANNOT ban dispensaries but can impose reasonable zoning restrictions. This means Covington, Newport, Florence, and other NKY cities must allow dispensaries somewhere within their boundaries. However, cities can regulate location (distance from schools, etc.), hours of operation, and other reasonable conditions. Watch for local ordinances as the 2025 start date approaches.',
    category: 'Cannabis/CBD',
    tags: ['dispensary', 'northern kentucky', 'local', 'zoning']
  },
  {
    question: 'What are the qualifying conditions for medical cannabis in Kentucky?',
    answer: 'Kentucky\'s medical cannabis program covers: cancer, chronic pain, epilepsy/seizure disorders, multiple sclerosis, chronic nausea, post-traumatic stress disorder (PTSD), and any condition for which an opioid could be prescribed. A physician must certify the condition. Patients must register with the state and obtain a medical cannabis card. The program does not allow smoking - only oils, tinctures, edibles, and vaporization.',
    category: 'Cannabis/CBD',
    tags: ['medical', 'qualifying conditions', 'kentucky', 'patients']
  },
  {
    question: 'How much does it cost to get a medical cannabis dispensary license in Kentucky?',
    answer: 'Exact costs are still being finalized, but Kentucky medical cannabis licenses will require significant investment: 1) Application fee (expected $5,000-$10,000); 2) License fee (expected $50,000-$100,000 annually); 3) Facility buildout ($500,000-$1,500,000); 4) Security systems ($50,000-$100,000); 5) Initial inventory; 6) Operating capital. Kentucky requires majority Kentucky resident ownership. License numbers will be limited.',
    category: 'Cannabis/CBD',
    tags: ['dispensary', 'license', 'cost', 'kentucky']
  },
  {
    question: 'Can I grow hemp on my property in Boone/Kenton/Campbell County?',
    answer: 'Yes, with proper licensing. You need a Kentucky Department of Agriculture hemp license regardless of county. Requirements: agricultural zoning (check your property), background check, GPS field coordinates, approved seed, and annual testing. Small-scale grows are possible but must still be licensed. Many Northern Kentucky properties are residential zones that don\'t allow agricultural activities - verify your zoning with the county before applying.',
    category: 'Cannabis/CBD',
    tags: ['hemp', 'cultivation', 'northern kentucky', 'zoning']
  },
  {
    question: 'What\'s the difference between Kentucky and Ohio cannabis laws?',
    answer: 'Major differences: 1) Recreational cannabis is LEGAL in Ohio (Issue 2, Nov 2023), ILLEGAL in Kentucky; 2) Ohio medical cannabis has been active since 2018, Kentucky starts Jan 2025; 3) Ohio allows home growing (6 plants), Kentucky does not; 4) Ohio dispensaries can sell to adults 21+, Kentucky will be medical-only with card; 5) Ohio has consumption lounges (coming), Kentucky does not. If you live in NKY, you cannot legally purchase recreational cannabis in Ohio to bring back.',
    category: 'Cannabis/CBD',
    tags: ['ohio', 'kentucky', 'comparison', 'legal differences']
  }
];

// Kentucky Cannabis Business Startup Checklist
const CANNABIS_BUSINESS_CHECKLIST_KY = {
  name: 'CBD/Hemp Business Startup - Kentucky',
  category: 'Cannabis/CBD',
  description: 'Checklist for starting a CBD retail or hemp business in Northern Kentucky (Boone, Kenton, Campbell counties)',
  steps: [
    {
      order: 1,
      title: 'Research Legal Requirements',
      description: 'Understand Kentucky hemp and CBD regulations',
      estimatedDays: 14,
      tips: [
        'CBD from hemp (<0.3% THC) is legal in Kentucky',
        'Recreational cannabis is NOT legal',
        'Medical cannabis starts January 2025',
        'Check local city zoning for retail',
        'Consult attorney on current regulations'
      ]
    },
    {
      order: 2,
      title: 'Choose Business Structure',
      description: 'Register your business entity with Kentucky',
      estimatedDays: 14,
      tips: [
        'Register with Kentucky Secretary of State',
        'Obtain EIN from IRS',
        'LLC provides liability protection',
        'Consider Kentucky residency requirements for future cannabis licenses'
      ]
    },
    {
      order: 3,
      title: 'Find Compliant Location',
      description: 'Secure retail space in appropriate commercial zone',
      estimatedDays: 30,
      tips: [
        'Verify commercial zoning allows retail',
        'Check Covington/Newport/city regulations',
        'Consider visibility and parking',
        'Confirm landlord approves of CBD business'
      ]
    },
    {
      order: 4,
      title: 'Obtain Licenses and Permits',
      description: 'Get required business licenses and registrations',
      estimatedDays: 21,
      tips: [
        'City/county business license',
        'Kentucky sales tax registration',
        'If processing: KDA hemp processor license',
        'Signage permit if applicable'
      ]
    },
    {
      order: 5,
      title: 'Source Compliant Products',
      description: 'Establish relationships with reputable suppliers',
      estimatedDays: 21,
      tips: [
        'Require COAs (Certificates of Analysis) for all products',
        'Verify THC content is below 0.3%',
        'Check for proper labeling',
        'Avoid products making medical claims',
        'Consider Kentucky-based suppliers'
      ]
    },
    {
      order: 6,
      title: 'Set Up Store Operations',
      description: 'Prepare your store for opening',
      estimatedDays: 14,
      tips: [
        'Install point-of-sale system',
        'Train staff on product knowledge',
        'Implement age verification procedures',
        'Set up inventory tracking',
        'Create compliant marketing materials'
      ]
    },
    {
      order: 7,
      title: 'Open for Business',
      description: 'Launch your CBD retail operation',
      estimatedDays: 7,
      tips: [
        'Final inspection if required',
        'Soft opening to test operations',
        'Collect Kentucky sales tax',
        'Stay current on regulatory changes',
        'Watch for medical cannabis opportunities in 2025'
      ]
    }
  ]
};

export async function seedCannabisIndustryKY() {
  console.log('Seeding Kentucky cannabis/CBD industry data...');

  // Seed permit requirements
  for (const permit of CANNABIS_PERMIT_REQUIREMENTS_KY) {
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
  console.log(`Seeded ${CANNABIS_PERMIT_REQUIREMENTS_KY.length} KY cannabis permit requirements`);

  // Seed building codes
  for (const code of CANNABIS_BUILDING_CODES_KY) {
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
  console.log(`Seeded ${CANNABIS_BUILDING_CODES_KY.length} KY cannabis building codes`);

  // Seed common questions
  for (const qa of CANNABIS_COMMON_QUESTIONS_KY) {
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
  console.log(`Seeded ${CANNABIS_COMMON_QUESTIONS_KY.length} KY cannabis common questions`);

  // Seed business checklist
  const existingChecklist = await prisma.businessChecklist.findFirst({
    where: { name: CANNABIS_BUSINESS_CHECKLIST_KY.name },
  });

  if (existingChecklist) {
    await prisma.businessChecklist.update({
      where: { id: existingChecklist.id },
      data: {
        category: CANNABIS_BUSINESS_CHECKLIST_KY.category,
        description: CANNABIS_BUSINESS_CHECKLIST_KY.description,
        steps: CANNABIS_BUSINESS_CHECKLIST_KY.steps,
      },
    });
  } else {
    await prisma.businessChecklist.create({
      data: CANNABIS_BUSINESS_CHECKLIST_KY,
    });
  }
  console.log('Seeded KY cannabis business checklist');

  console.log('Kentucky cannabis/CBD industry seeding complete!');
}

export {
  CANNABIS_PERMIT_REQUIREMENTS_KY,
  CANNABIS_BUILDING_CODES_KY,
  CANNABIS_COMMON_QUESTIONS_KY,
  CANNABIS_BUSINESS_CHECKLIST_KY
};
