import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Professional Services Permit Requirements
const PROFESSIONAL_SERVICES_PERMITS = [
  {
    activityType: 'Home Office/Home Occupation',
    category: 'Professional Services',
    activityDescription: 'Operating a professional business from your residence (consulting, freelance, remote work)',
    zonesRequired: ['R-1', 'R-2', 'R-3', 'R-4', 'R-5', 'SF', 'RM', 'PUD'],
    zonesProhibited: [],
    feeBase: 50,
    processingDays: 14,
    requiresPlans: false,
    requiresInspection: false,
    ordinanceRef: 'Cincinnati Municipal Code Chapter 1411; Local Zoning Codes',
    requirements: [
      'Home occupation permit/registration may be required',
      'Business must be clearly secondary to residential use',
      'No external indication of business (signage)',
      'No employees other than residents typically',
      'Limited client/customer visits (varies by jurisdiction)',
      'No retail sales from premises',
      'Cannot generate excess traffic, noise, or parking demand',
      'Cannot store inventory or hazardous materials',
      'Business license still required',
      'May need to register with city for tax purposes'
    ]
  },
  {
    activityType: 'Law Office',
    category: 'Professional Services',
    activityDescription: 'Office for attorneys and legal professionals',
    zonesRequired: ['C-1', 'C-2', 'C-3', 'O-1', 'O-2', 'MU', 'CC', 'PUD'],
    zonesProhibited: ['R-1', 'SF', 'I-1', 'I-2', 'M-1', 'M-2'],
    feeBase: 150,
    processingDays: 14,
    requiresPlans: false,
    requiresInspection: false,
    ordinanceRef: 'Local Zoning Code; Ohio Supreme Court Rules',
    requirements: [
      'Business license from city/county',
      'Commercial lease or owned property',
      'Signage permit if exterior signs',
      'Zoning compliance verification',
      'ADA accessibility for client areas',
      'Attorney registration with Ohio Supreme Court',
      'Professional liability insurance',
      'IOLTA trust account for client funds',
      'Fire occupancy permit if required by building size'
    ]
  },
  {
    activityType: 'Accounting/CPA Office',
    category: 'Professional Services',
    activityDescription: 'Office for accounting, bookkeeping, and tax preparation services',
    zonesRequired: ['C-1', 'C-2', 'C-3', 'O-1', 'O-2', 'MU', 'CC', 'PUD'],
    zonesProhibited: ['R-1', 'SF', 'I-1', 'I-2', 'M-1', 'M-2'],
    feeBase: 100,
    processingDays: 14,
    requiresPlans: false,
    requiresInspection: false,
    ordinanceRef: 'Local Zoning Code; Ohio Revised Code Chapter 4701',
    requirements: [
      'Business license from city/county',
      'CPA license from Accountancy Board of Ohio (if CPA)',
      'PTIN for tax preparers',
      'Commercial location in appropriate zone',
      'Signage permit if applicable',
      'Professional liability insurance',
      'Data security measures for client information',
      'ADA accessibility',
      'Ohio vendor license if providing taxable services'
    ]
  },
  {
    activityType: 'Real Estate Office',
    category: 'Professional Services',
    activityDescription: 'Office for real estate agents and brokers',
    zonesRequired: ['C-1', 'C-2', 'C-3', 'O-1', 'O-2', 'MU', 'CC', 'NC', 'PUD'],
    zonesProhibited: ['R-1', 'SF', 'I-1', 'I-2'],
    feeBase: 150,
    processingDays: 14,
    requiresPlans: false,
    requiresInspection: false,
    ordinanceRef: 'Local Zoning Code; Ohio Revised Code Chapter 4735',
    requirements: [
      'Ohio Real Estate license (agent or broker)',
      'Broker office must have broker of record',
      'Business license from city/county',
      'Commercial lease or property',
      'Signage permit for exterior signs',
      'E&O insurance required',
      'Trust/escrow account for earnest money',
      'Division of Real Estate compliance',
      'ADA accessibility for client meetings'
    ]
  },
  {
    activityType: 'Insurance Agency',
    category: 'Professional Services',
    activityDescription: 'Office selling insurance policies and providing insurance services',
    zonesRequired: ['C-1', 'C-2', 'C-3', 'O-1', 'O-2', 'MU', 'CC', 'NC', 'PUD'],
    zonesProhibited: ['R-1', 'SF', 'I-1', 'I-2'],
    feeBase: 100,
    processingDays: 14,
    requiresPlans: false,
    requiresInspection: false,
    ordinanceRef: 'Local Zoning Code; Ohio Revised Code Chapter 3905',
    requirements: [
      'Ohio Department of Insurance agent license',
      'Business entity registration with Ohio Secretary of State',
      'Business license from city/county',
      'Commercial location',
      'Signage permit if applicable',
      'E&O insurance for agents',
      'Agency appointment with insurance carriers',
      'ADA accessibility',
      'Continuing education requirements'
    ]
  },
  {
    activityType: 'Financial Advisory/Investment Office',
    category: 'Professional Services',
    activityDescription: 'Office providing investment advice, wealth management, and financial planning',
    zonesRequired: ['C-1', 'C-2', 'C-3', 'O-1', 'O-2', 'MU', 'CC', 'PUD'],
    zonesProhibited: ['R-1', 'SF', 'I-1', 'I-2', 'M-1', 'M-2'],
    feeBase: 150,
    processingDays: 14,
    requiresPlans: false,
    requiresInspection: false,
    ordinanceRef: 'Local Zoning Code; SEC/FINRA Regulations',
    requirements: [
      'SEC/State RIA registration or FINRA broker-dealer affiliation',
      'Series 65/66 or Series 7 licenses as applicable',
      'Business license from city/county',
      'Commercial office space',
      'Professional liability insurance',
      'ADV Part 2 disclosure documents',
      'Cybersecurity policies and procedures',
      'Client record retention systems',
      'ADA accessibility'
    ]
  },
  {
    activityType: 'Medical/Dental Office',
    category: 'Professional Services',
    activityDescription: 'Office for physicians, dentists, and medical professionals',
    zonesRequired: ['C-1', 'C-2', 'C-3', 'O-1', 'O-2', 'MU', 'CC', 'H', 'PUD'],
    zonesProhibited: ['R-1', 'R-2', 'SF', 'I-1', 'I-2'],
    feeBase: 300,
    processingDays: 30,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Local Zoning Code; Ohio Revised Code Chapter 4731; OSHA',
    requirements: [
      'Ohio Medical/Dental Board license',
      'DEA registration if prescribing controlled substances',
      'Certificate of need if applicable',
      'Building permit for medical buildout',
      'Plumbing permit for medical fixtures',
      'HVAC requirements for medical spaces',
      'ADA accessibility (enhanced requirements)',
      'Medical waste disposal plan',
      'HIPAA compliance infrastructure',
      'Professional liability insurance',
      'Fire safety and occupancy permit'
    ]
  },
  {
    activityType: 'Therapy/Counseling Office',
    category: 'Professional Services',
    activityDescription: 'Office for mental health counselors, therapists, and psychologists',
    zonesRequired: ['C-1', 'C-2', 'C-3', 'O-1', 'O-2', 'MU', 'CC', 'PUD'],
    zonesProhibited: ['R-1', 'SF', 'I-1', 'I-2', 'M-1', 'M-2'],
    feeBase: 100,
    processingDays: 14,
    requiresPlans: false,
    requiresInspection: false,
    ordinanceRef: 'Local Zoning Code; Ohio Counselor/Social Worker Board',
    requirements: [
      'Ohio license (LPCC, LISW, Psychologist, etc.)',
      'National Provider Identifier (NPI)',
      'Business license from city/county',
      'Commercial lease with soundproofing considerations',
      'HIPAA compliance measures',
      'Professional liability insurance',
      'ADA accessibility',
      'Waiting room accommodations',
      'Insurance panel credentialing if accepting insurance'
    ]
  },
  {
    activityType: 'Architectural/Engineering Firm',
    category: 'Professional Services',
    activityDescription: 'Office for architects, engineers, and design professionals',
    zonesRequired: ['C-1', 'C-2', 'C-3', 'O-1', 'O-2', 'MU', 'CC', 'PUD'],
    zonesProhibited: ['R-1', 'SF', 'I-1', 'I-2', 'M-1', 'M-2'],
    feeBase: 150,
    processingDays: 14,
    requiresPlans: false,
    requiresInspection: false,
    ordinanceRef: 'Local Zoning Code; Ohio Revised Code Chapter 4703/4733',
    requirements: [
      'Ohio Architects Board or Engineers/Surveyors Board license',
      'Business license from city/county',
      'Professional liability (E&O) insurance',
      'Commercial office space',
      'Certificate of Authorization for firm if required',
      'Signage permit if applicable',
      'ADA accessibility'
    ]
  },
  {
    activityType: 'Consulting Office',
    category: 'Professional Services',
    activityDescription: 'General business consulting, management consulting, IT consulting',
    zonesRequired: ['C-1', 'C-2', 'C-3', 'O-1', 'O-2', 'MU', 'CC', 'NC', 'PUD'],
    zonesProhibited: ['R-1', 'SF', 'I-1', 'I-2'],
    feeBase: 100,
    processingDays: 14,
    requiresPlans: false,
    requiresInspection: false,
    ordinanceRef: 'Local Zoning Code',
    requirements: [
      'Business license from city/county',
      'Commercial lease or property',
      'Ohio vendor license for taxable services',
      'General liability insurance',
      'Professional liability insurance recommended',
      'Signage permit if applicable',
      'ADA accessibility'
    ]
  },
  {
    activityType: 'Marketing/Advertising Agency',
    category: 'Professional Services',
    activityDescription: 'Agency providing marketing, advertising, and creative services',
    zonesRequired: ['C-1', 'C-2', 'C-3', 'O-1', 'O-2', 'MU', 'CC', 'PUD'],
    zonesProhibited: ['R-1', 'SF', 'I-1', 'I-2', 'M-1'],
    feeBase: 100,
    processingDays: 14,
    requiresPlans: false,
    requiresInspection: false,
    ordinanceRef: 'Local Zoning Code',
    requirements: [
      'Business license from city/county',
      'Commercial office space',
      'Ohio vendor license',
      'General liability insurance',
      'Copyright/IP considerations for creative work',
      'Media liability insurance recommended',
      'Signage permit if applicable',
      'ADA accessibility'
    ]
  },
  {
    activityType: 'Staffing/Employment Agency',
    category: 'Professional Services',
    activityDescription: 'Agency providing temporary staffing, recruiting, and employment services',
    zonesRequired: ['C-1', 'C-2', 'C-3', 'O-1', 'O-2', 'MU', 'CC', 'PUD'],
    zonesProhibited: ['R-1', 'SF', 'I-1', 'I-2'],
    feeBase: 150,
    processingDays: 21,
    requiresPlans: false,
    requiresInspection: false,
    ordinanceRef: 'Local Zoning Code; Ohio Revised Code Chapter 4143',
    requirements: [
      'Business license from city/county',
      'Employment agency license from Ohio (if charging job seekers)',
      'Commercial office space for interviews',
      'Workers compensation coverage for placed employees',
      'General liability insurance',
      'EEOC compliance',
      'Background check procedures',
      'I-9 verification processes',
      'ADA accessible interview spaces'
    ]
  }
];

// Building Codes for Professional Services
const PROFESSIONAL_SERVICES_CODES = [
  {
    codeSection: 'Office Occupancy Classification',
    category: 'Professional Services',
    codeText: 'Professional offices are typically Group B occupancy. Egress, fire safety, and accessibility requirements based on occupant load calculations (1 person per 100 sq ft gross for business areas).',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Ohio Building Code'
  },
  {
    codeSection: 'ADA Accessibility - Professional Offices',
    category: 'Professional Services',
    codeText: 'Public areas of professional offices must be accessible: 32" clear door width minimum, accessible route to services, accessible restrooms, reception counter with lowered section (36" max height).',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'ADA Standards; Ohio Building Code'
  },
  {
    codeSection: 'Medical Office Requirements',
    category: 'Professional Services',
    codeText: 'Medical/dental offices have enhanced requirements: hand washing stations, medical gas systems if applicable, sterilization areas, HVAC ventilation requirements, and ADA exam room accessibility.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Ohio Building Code; OSHA'
  },
  {
    codeSection: 'Home Occupation Standards',
    category: 'Professional Services',
    codeText: 'Home occupations limited to 25% of dwelling floor area. No exterior storage, no signage exceeding 1 sq ft, no employees other than residents, limited client visits. Must be clearly secondary to residential use.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Cincinnati Municipal Code 1411'
  },
  {
    codeSection: 'Signage Requirements',
    category: 'Professional Services',
    codeText: 'Professional office signage regulated by zoning. Wall signs, monument signs, and window signs subject to size limits and permit requirements. Illuminated signs may have additional restrictions.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Local Sign Code'
  },
  {
    codeSection: 'Parking Requirements - Office',
    category: 'Professional Services',
    codeText: 'Office uses typically require 1 parking space per 250-300 sq ft of floor area. Medical offices may require higher ratios (1 per 200 sq ft). Accessible parking spaces required per ADA.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Local Zoning Code'
  }
];

// Common Questions about Professional Services
const PROFESSIONAL_SERVICES_QUESTIONS = [
  {
    question: 'Can I run a business from my home?',
    answer: 'Yes, but with restrictions. Cincinnati and most suburbs allow "home occupations" as accessory uses in residential zones. Typical requirements: 1) Business must be clearly secondary to residential use; 2) Usually limited to 25% of floor area; 3) No employees other than residents; 4) Limited or no client visits (varies by jurisdiction); 5) No exterior signage or indication of business; 6) No retail sales; 7) Cannot generate excess traffic or noise. You typically need a home occupation permit and business license. Remote work for an employer generally doesn\'t need a permit.',
    category: 'Professional Services',
    tags: ['home office', 'home occupation', 'work from home', 'permit']
  },
  {
    question: 'Do I need a business license to freelance or consult?',
    answer: 'Yes. Even if working from home, you need: 1) City/township business license (Cincinnati, for example, requires all businesses operating in the city to register); 2) State tax registration if providing taxable services; 3) Professional license if your field requires it (CPA, attorney, engineer, etc.). The city needs to know you\'re operating for tax purposes. Costs are usually minimal ($50-150/year for small businesses). Operating without proper registration can result in fines and back taxes.',
    category: 'Professional Services',
    tags: ['freelance', 'consulting', 'business license', 'registration']
  },
  {
    question: 'What zones allow professional offices?',
    answer: 'Professional offices are typically allowed in: Commercial zones (C-1, C-2, C-3) - permitted by right; Office zones (O-1, O-2) - designed for professional uses; Mixed-use zones (MU) - often permitted; Some higher-density residential zones may allow offices as conditional use. Single-family residential (R-1, SF) generally prohibits offices except as limited home occupations. Use Civix to check your specific property\'s zoning and whether professional offices are a permitted use.',
    category: 'Professional Services',
    tags: ['zoning', 'office', 'commercial', 'location']
  },
  {
    question: 'What permits do I need to open a law office?',
    answer: 'Opening a law office requires: 1) Ohio Supreme Court attorney registration (already have if licensed); 2) City/county business license; 3) Zoning compliance (commercial or office zones); 4) Signage permit for exterior signs; 5) Certificate of occupancy or fire permit depending on building size. You don\'t need special building permits unless doing construction. Also need: IOLTA trust account, professional liability insurance, and proper client file systems. Consider ADA accessibility for client meetings.',
    category: 'Professional Services',
    tags: ['law office', 'attorney', 'permit', 'license']
  },
  {
    question: 'Can I see clients at my home office?',
    answer: 'It depends on local regulations and can be tricky. Many jurisdictions limit or prohibit client visits for home occupations because of traffic and parking impacts. Cincinnati\'s rules are relatively restrictive. If you need regular client visits, consider: 1) Meeting clients at their location; 2) Using co-working spaces; 3) Renting a small commercial office; 4) Checking if your suburb has more lenient rules. Occasional client visits may be permitted - check your specific city\'s home occupation ordinance.',
    category: 'Professional Services',
    tags: ['home office', 'clients', 'home occupation', 'visitors']
  },
  {
    question: 'What insurance do I need for a professional service business?',
    answer: 'Professional service businesses typically need: 1) Professional Liability (E&O) Insurance - essential for advice-based businesses; 2) General Liability Insurance - for slip/fall and property damage; 3) Workers\' Compensation - required if you have employees; 4) Business Personal Property - for equipment/furniture; 5) Cyber Liability - if handling client data. Some professions have specific requirements: attorneys need malpractice coverage, CPAs need E&O, medical professionals need malpractice. Costs vary widely by profession and risk level.',
    category: 'Professional Services',
    tags: ['insurance', 'liability', 'professional', 'coverage']
  },
  {
    question: 'How do I register my business in Ohio?',
    answer: 'Steps to register a business in Ohio: 1) Choose business structure (sole proprietor, LLC, corporation); 2) Register with Ohio Secretary of State (required for LLC/Corp, optional for sole proprietors using business name); 3) Get EIN from IRS (required for employees or non-sole proprietor); 4) Register with Ohio Department of Taxation for applicable taxes; 5) Get local business license from city/county; 6) Obtain any professional licenses required for your field. LLC filing is $99 online. Business licenses vary by city ($50-200 typically).',
    category: 'Professional Services',
    tags: ['register', 'llc', 'corporation', 'ohio']
  },
  {
    question: 'What are the ADA requirements for a professional office?',
    answer: 'Professional offices open to clients must comply with ADA: 1) Accessible route from parking/entrance to services; 2) 32" minimum clear door width; 3) Accessible reception counter (36" max height section); 4) Accessible restroom if public restrooms provided; 5) Accessible parking spaces (1 per 25 spaces); 6) No barriers like steps without ramps. Existing buildings may have less stringent requirements if modifications are not "readily achievable." New construction must be fully compliant. Medical offices have enhanced requirements.',
    category: 'Professional Services',
    tags: ['ada', 'accessibility', 'office', 'compliance']
  },
  {
    question: 'Can I hire employees to work in my home office?',
    answer: 'Generally no, not in residential zones. Most home occupation regulations prohibit employees other than household residents. Having employees report to a residential address creates issues with: zoning violations, increased traffic, parking demand, workers\' compensation inspections, and neighbor complaints. If you need employees, you should lease commercial office space. Some remote employees working from their own homes are different - they\'re not coming to your home. Check your specific jurisdiction\'s rules.',
    category: 'Professional Services',
    tags: ['employees', 'home office', 'hiring', 'zoning']
  },
  {
    question: 'Do I need a sign permit for my office?',
    answer: 'Yes, exterior signs typically require permits. Requirements include: 1) Sign permit application with design/dimensions; 2) Compliance with size limits for your zone; 3) Setback requirements; 4) Illumination restrictions (may prohibit flashing/animated); 5) Building owner approval for tenant signs. Wall signs, monument signs, and projecting signs have different rules. Many office parks and shopping centers have additional sign standards. Interior signs visible through windows may also be regulated. Fees typically $50-150.',
    category: 'Professional Services',
    tags: ['signage', 'permit', 'sign', 'business']
  },
  {
    question: 'What are the parking requirements for an office?',
    answer: 'Office parking requirements vary by jurisdiction but typically: 1) General office: 1 space per 250-300 sq ft of floor area; 2) Medical/dental: 1 space per 175-200 sq ft (higher due to patient turnover); 3) Must include ADA accessible spaces (1 per 25 spaces). If your space doesn\'t meet requirements, you may need: variance approval, shared parking agreement with adjacent uses, or to find a different location. Downtown areas may have reduced requirements or allow payment in-lieu-of parking.',
    category: 'Professional Services',
    tags: ['parking', 'office', 'requirements', 'zoning']
  }
];

// Professional Services Startup Checklist
const PROFESSIONAL_SERVICES_CHECKLIST = {
  name: 'Professional Services Business Startup',
  category: 'Professional Services',
  description: 'Checklist for starting a professional services business (consulting, law, accounting, etc.) in the Cincinnati area',
  steps: [
    {
      order: 1,
      title: 'Verify Professional Credentials',
      description: 'Ensure you have required professional licenses and credentials',
      estimatedDays: 30,
      tips: [
        'Verify state license is current (attorney, CPA, engineer, etc.)',
        'Complete any continuing education requirements',
        'Obtain any specialty certifications needed',
        'Register with relevant professional boards'
      ]
    },
    {
      order: 2,
      title: 'Choose Business Structure',
      description: 'Decide on legal structure (sole proprietor, LLC, PC, etc.)',
      estimatedDays: 7,
      tips: [
        'Consult with accountant about tax implications',
        'Consider liability protection needs',
        'Some professions require specific structures (PC for attorneys)',
        'Register with Ohio Secretary of State if forming entity'
      ]
    },
    {
      order: 3,
      title: 'Find Office Location',
      description: 'Secure office space that meets zoning and client needs',
      estimatedDays: 30,
      tips: [
        'Verify zoning allows professional office use',
        'Consider client accessibility and parking',
        'Check ADA compliance of space',
        'Review lease terms carefully',
        'Consider co-working space to start'
      ]
    },
    {
      order: 4,
      title: 'Register Business Locally',
      description: 'Obtain required business licenses and registrations',
      estimatedDays: 14,
      tips: [
        'Register for city/county business license',
        'Register with Ohio Department of Taxation',
        'Get EIN from IRS if needed',
        'Register trade name if applicable'
      ]
    },
    {
      order: 5,
      title: 'Set Up Insurance',
      description: 'Obtain required business and professional insurance',
      estimatedDays: 14,
      tips: [
        'Get professional liability (E&O) insurance',
        'Obtain general liability insurance',
        'Consider cyber liability coverage',
        'Set up workers comp if hiring employees'
      ]
    },
    {
      order: 6,
      title: 'Establish Business Operations',
      description: 'Set up banking, accounting, and operational systems',
      estimatedDays: 14,
      tips: [
        'Open business bank account',
        'Set up accounting system',
        'Establish trust account if required (attorneys, real estate)',
        'Implement client management system',
        'Set up secure data storage (HIPAA/client confidentiality)'
      ]
    },
    {
      order: 7,
      title: 'Launch Business',
      description: 'Complete final preparations and open for business',
      estimatedDays: 7,
      tips: [
        'Order business cards and marketing materials',
        'Set up business phone and email',
        'Apply for signage permit if applicable',
        'Announce launch to network',
        'Join professional associations and networks'
      ]
    }
  ]
};

export async function seedProfessionalServices() {
  console.log('Seeding professional services data...');

  // Seed permit requirements
  for (const permit of PROFESSIONAL_SERVICES_PERMITS) {
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
  console.log(`Seeded ${PROFESSIONAL_SERVICES_PERMITS.length} professional services permit requirements`);

  // Seed building codes
  for (const code of PROFESSIONAL_SERVICES_CODES) {
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
  console.log(`Seeded ${PROFESSIONAL_SERVICES_CODES.length} professional services building codes`);

  // Seed common questions
  for (const qa of PROFESSIONAL_SERVICES_QUESTIONS) {
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
  console.log(`Seeded ${PROFESSIONAL_SERVICES_QUESTIONS.length} professional services common questions`);

  // Seed business checklist
  const existingChecklist = await prisma.businessChecklist.findFirst({
    where: { name: PROFESSIONAL_SERVICES_CHECKLIST.name },
  });

  if (existingChecklist) {
    await prisma.businessChecklist.update({
      where: { id: existingChecklist.id },
      data: {
        category: PROFESSIONAL_SERVICES_CHECKLIST.category,
        description: PROFESSIONAL_SERVICES_CHECKLIST.description,
        steps: PROFESSIONAL_SERVICES_CHECKLIST.steps,
      },
    });
  } else {
    await prisma.businessChecklist.create({
      data: PROFESSIONAL_SERVICES_CHECKLIST,
    });
  }
  console.log('Seeded professional services business checklist');

  console.log('Professional services seeding complete!');
}

export {
  PROFESSIONAL_SERVICES_PERMITS,
  PROFESSIONAL_SERVICES_CODES,
  PROFESSIONAL_SERVICES_QUESTIONS,
  PROFESSIONAL_SERVICES_CHECKLIST
};
