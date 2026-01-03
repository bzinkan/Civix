import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Cannabis and CBD Business Permit Requirements
// Note: Ohio legalized adult-use cannabis in November 2023 (Issue 2)
const CANNABIS_PERMIT_REQUIREMENTS = [
  {
    activityType: 'CBD/Hemp Retail Store',
    category: 'Cannabis/CBD',
    activityDescription: 'Retail store selling CBD products, hemp-derived products, and related accessories (no THC products above 0.3%)',
    zonesRequired: ['C-1', 'C-2', 'C-3', 'C-4', 'MU', 'CC', 'NC'],
    zonesProhibited: ['R-1', 'R-2', 'R-3', 'R-4', 'SF', 'I-1', 'I-2'],
    feeBase: 200,
    processingDays: 21,
    requiresPlans: false,
    requiresInspection: true,
    ordinanceRef: 'Ohio Revised Code Chapter 928; 2018 Farm Bill',
    requirements: [
      'Business license from city/county',
      'Products must be derived from hemp (less than 0.3% THC)',
      'Certificate of Analysis (COA) required for all products',
      'Products must comply with FDA regulations',
      'No sales to persons under 21 for smokable hemp',
      'Age verification required',
      'Proper product labeling required',
      'No medical claims can be made',
      'Vendor license from Ohio Department of Agriculture for hemp products'
    ]
  },
  {
    activityType: 'Adult-Use Cannabis Dispensary',
    category: 'Cannabis/CBD',
    activityDescription: 'Retail dispensary selling adult-use (recreational) cannabis products to consumers 21+',
    zonesRequired: ['C-2', 'C-3', 'C-4', 'MU', 'CC'],
    zonesProhibited: ['R-1', 'R-2', 'R-3', 'R-4', 'SF', 'RM', 'I-1', 'I-2', 'H'],
    feeBase: 5000,
    processingDays: 180,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Ohio Revised Code Chapter 3780; Ohio Administrative Code 3796',
    requirements: [
      'State license from Ohio Division of Cannabis Control required',
      'Must be 500+ feet from schools, churches, libraries, playgrounds, parks',
      'Must be 1000+ feet from another dispensary (varies by jurisdiction)',
      'Local zoning approval and conditional use permit',
      'Security plan with surveillance systems',
      'Inventory tracking system (METRC)',
      'Background checks for all owners and employees',
      'Local municipality must not have opted out',
      'Proof of financial responsibility ($500,000+ liquid assets)',
      'Community engagement plan',
      'Detailed business plan and operating procedures',
      'Odor mitigation plan',
      'No drive-through service permitted',
      'Hours limited (typically 7am-9pm)'
    ]
  },
  {
    activityType: 'Medical Marijuana Dispensary',
    category: 'Cannabis/CBD',
    activityDescription: 'Dispensary selling medical marijuana to registered patients with valid Ohio Medical Marijuana Card',
    zonesRequired: ['C-2', 'C-3', 'C-4', 'MU', 'CC'],
    zonesProhibited: ['R-1', 'R-2', 'R-3', 'R-4', 'SF', 'RM', 'I-1', 'I-2'],
    feeBase: 5000,
    processingDays: 180,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Ohio Revised Code Chapter 3796; Ohio Administrative Code 3796',
    requirements: [
      'State dispensary license from Ohio Board of Pharmacy',
      'Provisional license requires detailed application',
      'Must be 500+ feet from schools, churches, libraries, playgrounds',
      'Security requirements including vault storage',
      'Licensed pharmacist or pharmacy technician on staff',
      'Patient verification system',
      'METRC inventory tracking',
      'Background checks for all employees',
      'Local zoning approval',
      'Comprehensive security plan with 24/7 surveillance'
    ]
  },
  {
    activityType: 'Cannabis Cultivation Facility',
    category: 'Cannabis/CBD',
    activityDescription: 'Facility for growing cannabis plants for processing and sale to dispensaries',
    zonesRequired: ['I-1', 'I-2', 'M-1', 'M-2', 'A-1'],
    zonesProhibited: ['R-1', 'R-2', 'R-3', 'R-4', 'SF', 'C-1', 'C-2'],
    feeBase: 10000,
    processingDays: 365,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Ohio Revised Code Chapter 3796; Ohio Administrative Code 3796',
    requirements: [
      'State cultivation license from Ohio Division of Cannabis Control',
      'Level I (large) or Level II (small) cultivation license',
      'Minimum 25,000 sq ft for Level I',
      'Industrial or agricultural zoning',
      'Environmental impact assessment',
      'Odor control systems required',
      'Water usage and waste disposal plan',
      'Security plan with surveillance and access control',
      'Seed-to-sale tracking (METRC)',
      'Good Agricultural Practices certification',
      'Local conditional use permit',
      'Significant capital requirements ($2M+ typically)'
    ]
  },
  {
    activityType: 'Cannabis Processing Facility',
    category: 'Cannabis/CBD',
    activityDescription: 'Facility for processing raw cannabis into oils, edibles, concentrates, and other products',
    zonesRequired: ['I-1', 'I-2', 'M-1', 'M-2'],
    zonesProhibited: ['R-1', 'R-2', 'R-3', 'R-4', 'SF', 'C-1', 'RM'],
    feeBase: 10000,
    processingDays: 365,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Ohio Revised Code Chapter 3796; Ohio Administrative Code 3796',
    requirements: [
      'State processing license from Ohio Division of Cannabis Control',
      'Food safety certifications for edibles production',
      'Laboratory testing protocols',
      'Extraction equipment safety certifications',
      'Fire safety plan for processing operations',
      'Hazardous materials handling procedures',
      'Waste disposal plan',
      'Product labeling compliance',
      'METRC inventory tracking',
      'Quality control procedures',
      'Industrial zoning approval'
    ]
  },
  {
    activityType: 'Hemp Cultivation',
    category: 'Cannabis/CBD',
    activityDescription: 'Agricultural operation growing hemp plants (less than 0.3% THC) for CBD, fiber, or seed production',
    zonesRequired: ['A-1', 'A-2', 'AG', 'R-A', 'I-1'],
    zonesProhibited: ['R-1', 'R-2', 'R-3', 'C-1', 'C-2'],
    feeBase: 500,
    processingDays: 45,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Ohio Revised Code Chapter 928; Ohio Administrative Code 901:9',
    requirements: [
      'Ohio Department of Agriculture hemp cultivation license',
      'GPS coordinates of cultivation area',
      'Certified hemp seed or clones from approved source',
      'Testing plan to verify THC levels below 0.3%',
      'Destruction plan for non-compliant plants',
      'Background check for license holder',
      'Annual license renewal',
      'Report acreage and variety planted',
      'Allow ODA inspections',
      'Harvest notification required'
    ]
  },
  {
    activityType: 'Cannabis Consumption Lounge',
    category: 'Cannabis/CBD',
    activityDescription: 'Licensed establishment where adults 21+ can consume cannabis products on-premises',
    zonesRequired: ['C-2', 'C-3', 'C-4', 'MU', 'CC'],
    zonesProhibited: ['R-1', 'R-2', 'R-3', 'R-4', 'SF', 'I-1', 'I-2'],
    feeBase: 3000,
    processingDays: 180,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Ohio Revised Code Chapter 3780 (pending regulations)',
    requirements: [
      'State consumption lounge license (regulations pending)',
      'Must be attached to licensed dispensary OR standalone',
      'Enhanced ventilation/air filtration systems',
      'No alcohol sales permitted',
      'Food service restrictions may apply',
      'Distance requirements from schools/churches',
      'Security and surveillance requirements',
      'DUI prevention measures',
      'Staff training on responsible consumption',
      'Local municipality must opt-in',
      'Note: Full regulations still being developed as of 2024'
    ]
  }
];

// Building and Safety Codes for Cannabis/CBD
const CANNABIS_BUILDING_CODES = [
  {
    codeSection: 'Cannabis Dispensary Security',
    category: 'Cannabis/CBD',
    codeText: 'Dispensaries must have commercial-grade security including: 24/7 HD video surveillance covering all areas; 90-day recording retention; intrusion alarm system with 24/7 monitoring; secure storage vault for product; access control systems; security personnel during operating hours.',
    effectiveDate: new Date('2024-01-01'),
    jurisdiction: 'Ohio Administrative Code 3796'
  },
  {
    codeSection: 'Cannabis Ventilation Requirements',
    category: 'Cannabis/CBD',
    codeText: 'Cultivation and processing facilities must have HVAC systems that prevent odor from escaping the premises. Carbon filtration or equivalent required. Negative pressure environments recommended.',
    effectiveDate: new Date('2024-01-01'),
    jurisdiction: 'Ohio Administrative Code 3796'
  },
  {
    codeSection: 'Cannabis Storage Requirements',
    category: 'Cannabis/CBD',
    codeText: 'All cannabis products must be stored in secure, locked areas. Dispensaries require a vault or safe room. Temperature and humidity controls required for product integrity.',
    effectiveDate: new Date('2024-01-01'),
    jurisdiction: 'Ohio Administrative Code 3796'
  },
  {
    codeSection: 'Fire Safety - Cannabis Facilities',
    category: 'Cannabis/CBD',
    codeText: 'Cultivation facilities using high-intensity lighting require fire suppression systems. Processing facilities with extraction equipment require explosion-proof electrical and enhanced fire protection.',
    effectiveDate: new Date('2024-01-01'),
    jurisdiction: 'Ohio Fire Code'
  },
  {
    codeSection: 'CBD Retail Display Requirements',
    category: 'Cannabis/CBD',
    codeText: 'CBD products must be displayed with clear labeling showing THC content (<0.3%), CBD content, and Certificate of Analysis availability. Products cannot make FDA-unapproved health claims.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'FDA/Ohio Department of Agriculture'
  },
  {
    codeSection: 'Distance Requirements',
    category: 'Cannabis/CBD',
    codeText: 'Cannabis dispensaries must be located at least 500 feet from schools, churches, libraries, public playgrounds, and parks. Distance measured from property line to property line. Some municipalities require greater distances.',
    effectiveDate: new Date('2024-01-01'),
    jurisdiction: 'Ohio Revised Code 3796'
  }
];

// Common Questions about Cannabis/CBD Business
const CANNABIS_COMMON_QUESTIONS = [
  {
    question: 'Is recreational cannabis legal in Ohio?',
    answer: 'Yes, Ohio voters approved Issue 2 in November 2023, legalizing adult-use (recreational) cannabis for persons 21 and older. Adults can possess up to 2.5 ounces and grow up to 6 plants at home (12 per household). However, retail sales require state licensing and local approval. As of 2024, the Ohio Division of Cannabis Control is still implementing regulations for adult-use dispensaries. Many existing medical dispensaries are expected to also receive adult-use licenses.',
    category: 'Cannabis/CBD',
    tags: ['recreational', 'legal', 'ohio', 'issue 2']
  },
  {
    question: 'Can I open a cannabis dispensary in Cincinnati?',
    answer: 'Cincinnati has not opted out of adult-use cannabis sales, so dispensaries are potentially allowed. However, you need: 1) A state license from the Ohio Division of Cannabis Control (limited number available); 2) Local zoning approval - must be in commercial zones and meet distance requirements (500+ feet from schools, churches, parks); 3) Building permits and inspections; 4) Significant capital ($2M+ typically required). The city may implement additional local regulations. Many suburbs HAVE opted out, so check each municipality.',
    category: 'Cannabis/CBD',
    tags: ['dispensary', 'cincinnati', 'license', 'zoning']
  },
  {
    question: 'Which Cincinnati-area cities have banned cannabis dispensaries?',
    answer: 'Several Cincinnati metro municipalities have opted out of allowing cannabis dispensaries. As regulations are still being finalized, check with individual cities. Generally, more conservative suburbs are more likely to opt out. Cities that allow dispensaries may still impose additional restrictions like increased distance requirements or limited operating hours. Use Civix to check your specific location\'s zoning and local ordinances.',
    category: 'Cannabis/CBD',
    tags: ['opt-out', 'ban', 'suburbs', 'municipalities']
  },
  {
    question: 'Can I sell CBD products without a special license?',
    answer: 'Selling CBD products derived from hemp (less than 0.3% THC) does not require a cannabis license, but you still need: 1) Standard business license; 2) Retail sales tax registration; 3) Products must have Certificates of Analysis (COAs) proving THC content; 4) Products must comply with FDA labeling requirements; 5) No unapproved health claims; 6) For smokable hemp products, customers must be 21+. Ohio Department of Agriculture regulates hemp-derived products. Operating in commercial zones is recommended.',
    category: 'Cannabis/CBD',
    tags: ['cbd', 'hemp', 'retail', 'license']
  },
  {
    question: 'How much does it cost to open a cannabis dispensary?',
    answer: 'Opening a cannabis dispensary in Ohio requires significant capital: 1) State application fee: $5,000-$10,000; 2) State license fee: $70,000+ annually; 3) Local permit fees: $2,000-$10,000; 4) Real estate: $200,000-$500,000 for purchase/buildout; 5) Security systems: $50,000-$100,000; 6) Initial inventory: $200,000-$500,000; 7) Operating capital: $500,000+. Total startup costs typically range from $1-3 million. You must demonstrate liquid assets of at least $500,000.',
    category: 'Cannabis/CBD',
    tags: ['cost', 'investment', 'startup', 'capital']
  },
  {
    question: 'Can I grow cannabis at home in Ohio?',
    answer: 'Yes, under Issue 2, Ohio adults 21+ can grow cannabis at home: 1) Up to 6 plants per adult; 2) Maximum 12 plants per household; 3) Plants must be in a secure, enclosed space not visible/accessible to public; 4) Cannot sell or distribute homegrown cannabis; 5) Landlords can prohibit growing in rental properties; 6) HOAs may restrict growing. Note: Growing for commercial purposes requires a cultivation license. Home grow regulations took effect December 2023.',
    category: 'Cannabis/CBD',
    tags: ['home grow', 'cultivation', 'plants', 'personal use']
  },
  {
    question: 'What are the zoning requirements for a cannabis dispensary?',
    answer: 'Cannabis dispensaries in Ohio face strict zoning requirements: 1) Must be in commercial zones (typically C-2 or higher); 2) At least 500 feet from schools, churches, libraries, playgrounds, and public parks; 3) Some cities require 1,000+ feet from other dispensaries; 4) Industrial and residential zones are prohibited; 5) Cannot operate as home occupation; 6) Many cities require conditional use permits with public hearings. Check Civix for your specific parcel\'s zoning and proximity to restricted uses.',
    category: 'Cannabis/CBD',
    tags: ['zoning', 'distance', 'location', 'requirements']
  },
  {
    question: 'How do I get a hemp cultivation license in Ohio?',
    answer: 'To grow hemp in Ohio: 1) Apply to Ohio Department of Agriculture (ODA); 2) Provide GPS coordinates of all cultivation areas; 3) Pass background check (no felony drug convictions in past 10 years); 4) Pay license fee ($500 for up to 100 acres); 5) Use certified seed/clones from approved sources; 6) Submit to THC testing before harvest; 7) Agree to inspections. License is valid for one year. If THC exceeds 0.3%, crop must be destroyed. Agricultural zoning typically required.',
    category: 'Cannabis/CBD',
    tags: ['hemp', 'cultivation', 'farming', 'oda']
  },
  {
    question: 'Can I consume cannabis in public in Ohio?',
    answer: 'No. Ohio law prohibits public consumption of cannabis. You cannot consume cannabis: 1) On any public street, sidewalk, or park; 2) In vehicles (even as passenger); 3) On school grounds; 4) On federal property; 5) In most workplaces. Consumption is only legal in private residences or licensed consumption lounges (when available). Landlords and property owners can prohibit use on their property. Violation can result in fines and misdemeanor charges.',
    category: 'Cannabis/CBD',
    tags: ['public', 'consumption', 'smoking', 'legal']
  },
  {
    question: 'What licenses do I need to manufacture CBD products?',
    answer: 'Manufacturing CBD products in Ohio requires: 1) Ohio Department of Agriculture hemp processor license; 2) Food manufacturing license if producing edibles (Ohio Department of Agriculture); 3) FDA facility registration for interstate commerce; 4) Local business license; 5) Building permits for manufacturing facility; 6) If using extraction equipment, additional safety permits. Facilities must follow Good Manufacturing Practices (GMP). Products must be tested and properly labeled. No health claims can be made without FDA approval.',
    category: 'Cannabis/CBD',
    tags: ['manufacturing', 'cbd', 'processing', 'license']
  }
];

// Cannabis Business Startup Checklist
const CANNABIS_BUSINESS_CHECKLIST = {
  name: 'Cannabis Dispensary Startup',
  category: 'Cannabis/CBD',
  description: 'Comprehensive checklist for opening a cannabis dispensary in Ohio (adult-use or medical)',
  steps: [
    {
      order: 1,
      title: 'Research Local Regulations',
      description: 'Determine if your target municipality allows cannabis dispensaries and understand local requirements',
      estimatedDays: 30,
      tips: [
        'Check if city/township has opted out of adult-use cannabis',
        'Review local zoning code for cannabis-specific provisions',
        'Attend city council meetings to understand local sentiment',
        'Use Civix to verify zoning at potential locations'
      ]
    },
    {
      order: 2,
      title: 'Secure Financing',
      description: 'Arrange capital for application, buildout, and operations',
      estimatedDays: 90,
      tips: [
        'Traditional banks rarely lend to cannabis businesses',
        'Explore cannabis-specific lenders and investors',
        'Prepare detailed business plan with financial projections',
        'Budget $1-3 million minimum for dispensary',
        'Demonstrate $500,000+ liquid assets for state application'
      ]
    },
    {
      order: 3,
      title: 'Find Suitable Location',
      description: 'Identify and secure a property that meets all zoning and distance requirements',
      estimatedDays: 60,
      tips: [
        'Verify 500+ feet from schools, churches, parks, libraries',
        'Confirm commercial zoning (C-2 or higher typically)',
        'Check for distance requirements from other dispensaries',
        'Consider visibility, parking, and security',
        'Get landlord approval in writing'
      ]
    },
    {
      order: 4,
      title: 'Prepare State License Application',
      description: 'Compile comprehensive application for Ohio Division of Cannabis Control',
      estimatedDays: 90,
      tips: [
        'Develop detailed operations plan',
        'Create security plan with surveillance specifications',
        'Prepare employee training program',
        'Document ownership structure and conduct background checks',
        'Engage cannabis licensing consultant if needed'
      ]
    },
    {
      order: 5,
      title: 'Obtain Local Approvals',
      description: 'Secure local zoning approval, conditional use permit, and building permits',
      estimatedDays: 120,
      tips: [
        'Submit conditional use permit application',
        'Prepare for public hearing',
        'Engage with community proactively',
        'Submit building plans for any renovations',
        'Coordinate with fire marshal for safety review'
      ]
    },
    {
      order: 6,
      title: 'Build Out Facility',
      description: 'Construct or renovate facility to meet all state and local requirements',
      estimatedDays: 120,
      tips: [
        'Install required security systems (cameras, alarms, vault)',
        'Build out retail area, storage, and point-of-sale zones',
        'Install HVAC with odor control',
        'Ensure ADA accessibility compliance',
        'Pass all required inspections'
      ]
    },
    {
      order: 7,
      title: 'Hire and Train Staff',
      description: 'Recruit team and complete required training and background checks',
      estimatedDays: 45,
      tips: [
        'All employees require background checks',
        'Complete state-mandated training programs',
        'Train on METRC inventory system',
        'Develop customer service protocols',
        'Hire security personnel'
      ]
    },
    {
      order: 8,
      title: 'Final Inspections and Launch',
      description: 'Pass state inspection and open for business',
      estimatedDays: 30,
      tips: [
        'Schedule state inspection of completed facility',
        'Stock initial inventory from licensed cultivators/processors',
        'Test all systems (POS, security, METRC)',
        'Soft opening to work out operations',
        'Grand opening and ongoing compliance'
      ]
    }
  ]
};

export async function seedCannabisIndustry() {
  console.log('Seeding cannabis/CBD industry data...');

  // Seed permit requirements
  for (const permit of CANNABIS_PERMIT_REQUIREMENTS) {
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
  console.log(`Seeded ${CANNABIS_PERMIT_REQUIREMENTS.length} cannabis permit requirements`);

  // Seed building codes
  for (const code of CANNABIS_BUILDING_CODES) {
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
  console.log(`Seeded ${CANNABIS_BUILDING_CODES.length} cannabis building codes`);

  // Seed common questions
  for (const qa of CANNABIS_COMMON_QUESTIONS) {
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
  console.log(`Seeded ${CANNABIS_COMMON_QUESTIONS.length} cannabis common questions`);

  // Seed business checklist
  const existingChecklist = await prisma.businessChecklist.findFirst({
    where: { name: CANNABIS_BUSINESS_CHECKLIST.name },
  });

  if (existingChecklist) {
    await prisma.businessChecklist.update({
      where: { id: existingChecklist.id },
      data: {
        category: CANNABIS_BUSINESS_CHECKLIST.category,
        description: CANNABIS_BUSINESS_CHECKLIST.description,
        steps: CANNABIS_BUSINESS_CHECKLIST.steps,
      },
    });
  } else {
    await prisma.businessChecklist.create({
      data: CANNABIS_BUSINESS_CHECKLIST,
    });
  }
  console.log('Seeded cannabis business checklist');

  console.log('Cannabis/CBD industry seeding complete!');
}

export {
  CANNABIS_PERMIT_REQUIREMENTS,
  CANNABIS_BUILDING_CODES,
  CANNABIS_COMMON_QUESTIONS,
  CANNABIS_BUSINESS_CHECKLIST
};
