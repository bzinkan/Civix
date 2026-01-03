import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Kentucky Professional Services Seed Data
 *
 * Covers Northern Kentucky counties: Boone, Kenton, Campbell
 * Uses Kentucky regulations (KRS) and local zoning
 *
 * Key differences from Ohio:
 * - Kentucky professional licensing boards
 * - Kentucky occupational license tax (cities like Covington)
 * - Different zoning code nomenclature
 */

// Kentucky zone codes
const KY_COMMERCIAL_ZONES = ['TUMU', 'CMU', 'DTC', 'DTR', 'CRM', 'AUC', 'SO'];
const KY_RESIDENTIAL_ZONES = ['RR', 'SR', 'SU', 'TUR', 'MUR'];
const KY_INDUSTRIAL_ZONES = ['SI', 'LI', 'GI'];
const KY_ALL_ZONES = ['*'];

// Professional Services Permit Requirements - Kentucky
const PROFESSIONAL_SERVICES_PERMITS_KY = [
  {
    activityType: 'Home Office/Home Occupation (KY)',
    category: 'Professional Services',
    activityDescription: 'Operating a professional business from your residence in Northern Kentucky',
    zonesRequired: KY_RESIDENTIAL_ZONES,
    zonesProhibited: [],
    feeBase: 50,
    processingDays: 14,
    requiresPlans: false,
    requiresInspection: false,
    ordinanceRef: 'Local Zoning Ordinance',
    requirements: [
      'Home occupation permit/registration may be required',
      'Business must be secondary to residential use',
      'No external signage typically allowed',
      'Employee restrictions vary by jurisdiction',
      'Limited or no client visits in some areas',
      'Cannot generate excess traffic or noise',
      'Kentucky occupational license from city (Covington, etc.)',
      'Business license from city/county',
      'Check specific city rules - Covington, Newport, Florence differ'
    ]
  },
  {
    activityType: 'Law Office (KY)',
    category: 'Professional Services',
    activityDescription: 'Office for attorneys and legal professionals in Northern Kentucky',
    zonesRequired: [...KY_COMMERCIAL_ZONES, 'SO'],
    zonesProhibited: [...KY_RESIDENTIAL_ZONES, ...KY_INDUSTRIAL_ZONES],
    feeBase: 150,
    processingDays: 14,
    requiresPlans: false,
    requiresInspection: false,
    ordinanceRef: 'Local Zoning; Kentucky Supreme Court Rules',
    requirements: [
      'Kentucky Bar admission required',
      'Business license from city/county',
      'Kentucky occupational license (Covington, Newport)',
      'Commercial lease or owned property',
      'Signage permit if exterior signs',
      'ADA accessibility for client areas',
      'IOLTA trust account through Kentucky bank',
      'Professional liability insurance'
    ]
  },
  {
    activityType: 'Accounting/CPA Office (KY)',
    category: 'Professional Services',
    activityDescription: 'Office for accounting, bookkeeping, and tax preparation in Northern Kentucky',
    zonesRequired: [...KY_COMMERCIAL_ZONES, 'SO'],
    zonesProhibited: [...KY_INDUSTRIAL_ZONES],
    feeBase: 100,
    processingDays: 14,
    requiresPlans: false,
    requiresInspection: false,
    ordinanceRef: 'Local Zoning; KRS Chapter 325',
    requirements: [
      'Kentucky State Board of Accountancy CPA license (if CPA)',
      'PTIN for tax preparers',
      'Business license from city/county',
      'Kentucky occupational license tax',
      'Commercial location in appropriate zone',
      'Professional liability insurance',
      'Kentucky sales tax registration if applicable'
    ]
  },
  {
    activityType: 'Real Estate Office (KY)',
    category: 'Professional Services',
    activityDescription: 'Office for real estate agents and brokers in Northern Kentucky',
    zonesRequired: KY_COMMERCIAL_ZONES,
    zonesProhibited: [...KY_RESIDENTIAL_ZONES, ...KY_INDUSTRIAL_ZONES],
    feeBase: 125,
    processingDays: 14,
    requiresPlans: false,
    requiresInspection: false,
    ordinanceRef: 'Local Zoning; KRS Chapter 324',
    requirements: [
      'Kentucky Real Estate Commission license',
      'Broker in charge for brokerage office',
      'Business license from city/county',
      'Kentucky occupational license',
      'Commercial lease or property',
      'Signage permit for exterior signs',
      'E&O insurance required',
      'Trust/escrow account for earnest money'
    ]
  },
  {
    activityType: 'Insurance Agency (KY)',
    category: 'Professional Services',
    activityDescription: 'Office selling insurance policies in Northern Kentucky',
    zonesRequired: KY_COMMERCIAL_ZONES,
    zonesProhibited: [...KY_RESIDENTIAL_ZONES, ...KY_INDUSTRIAL_ZONES],
    feeBase: 100,
    processingDays: 14,
    requiresPlans: false,
    requiresInspection: false,
    ordinanceRef: 'Local Zoning; KRS Chapter 304',
    requirements: [
      'Kentucky Department of Insurance agent license',
      'Business entity registration with Kentucky SOS',
      'Business license from city/county',
      'Kentucky occupational license tax',
      'Commercial location',
      'E&O insurance for agents',
      'Agency appointment with carriers',
      'Continuing education requirements'
    ]
  },
  {
    activityType: 'Financial Advisory Office (KY)',
    category: 'Professional Services',
    activityDescription: 'Office providing investment advice and financial planning in Northern Kentucky',
    zonesRequired: [...KY_COMMERCIAL_ZONES, 'SO'],
    zonesProhibited: [...KY_RESIDENTIAL_ZONES, ...KY_INDUSTRIAL_ZONES],
    feeBase: 150,
    processingDays: 14,
    requiresPlans: false,
    requiresInspection: false,
    ordinanceRef: 'Local Zoning; SEC/FINRA; KRS 292',
    requirements: [
      'SEC/State RIA registration or FINRA broker-dealer affiliation',
      'Series 65/66 or Series 7 licenses as applicable',
      'Kentucky securities registration if state-registered',
      'Business license from city/county',
      'Kentucky occupational license',
      'Professional liability insurance',
      'Cybersecurity policies',
      'ADA accessibility'
    ]
  },
  {
    activityType: 'Medical/Dental Office (KY)',
    category: 'Professional Services',
    activityDescription: 'Office for physicians, dentists, and medical professionals in Northern Kentucky',
    zonesRequired: KY_COMMERCIAL_ZONES,
    zonesProhibited: [...KY_RESIDENTIAL_ZONES, ...KY_INDUSTRIAL_ZONES],
    feeBase: 300,
    processingDays: 30,
    requiresPlans: true,
    requiresInspection: true,
    ordinanceRef: 'Local Zoning; KRS 311; KRS 313',
    requirements: [
      'Kentucky Board of Medical/Dental Licensure license',
      'DEA registration if prescribing controlled substances',
      'Building permit for medical buildout',
      'Northern Kentucky Health Department coordination',
      'ADA accessibility (enhanced requirements)',
      'Medical waste disposal contract',
      'HIPAA compliance',
      'Professional liability insurance',
      'Kentucky occupational license'
    ]
  },
  {
    activityType: 'Therapy/Counseling Office (KY)',
    category: 'Professional Services',
    activityDescription: 'Office for mental health counselors and therapists in Northern Kentucky',
    zonesRequired: [...KY_COMMERCIAL_ZONES, 'SO'],
    zonesProhibited: [...KY_INDUSTRIAL_ZONES],
    feeBase: 100,
    processingDays: 14,
    requiresPlans: false,
    requiresInspection: false,
    ordinanceRef: 'Local Zoning; KRS 335',
    requirements: [
      'Kentucky Board of Licensed Professional Counselors license',
      'Or Kentucky Board of Social Work license (LCSW)',
      'Or Kentucky Board of Psychology license',
      'National Provider Identifier (NPI)',
      'Business license from city/county',
      'Kentucky occupational license',
      'HIPAA compliance',
      'Professional liability insurance',
      'Insurance panel credentialing if accepting insurance'
    ]
  },
  {
    activityType: 'Architectural/Engineering Firm (KY)',
    category: 'Professional Services',
    activityDescription: 'Office for architects and engineers in Northern Kentucky',
    zonesRequired: [...KY_COMMERCIAL_ZONES, 'SO'],
    zonesProhibited: [...KY_RESIDENTIAL_ZONES, ...KY_INDUSTRIAL_ZONES],
    feeBase: 150,
    processingDays: 14,
    requiresPlans: false,
    requiresInspection: false,
    ordinanceRef: 'Local Zoning; KRS 323 (Architects); KRS 322 (Engineers)',
    requirements: [
      'Kentucky Board of Architects license or',
      'Kentucky Board of Engineers and Land Surveyors license',
      'Business license from city/county',
      'Kentucky occupational license',
      'Professional liability (E&O) insurance',
      'Certificate of Authorization for firm',
      'Commercial office space'
    ]
  },
  {
    activityType: 'Consulting Office (KY)',
    category: 'Professional Services',
    activityDescription: 'General business consulting in Northern Kentucky',
    zonesRequired: [...KY_COMMERCIAL_ZONES, 'SO'],
    zonesProhibited: [...KY_INDUSTRIAL_ZONES],
    feeBase: 75,
    processingDays: 14,
    requiresPlans: false,
    requiresInspection: false,
    ordinanceRef: 'Local Zoning',
    requirements: [
      'Business license from city/county',
      'Kentucky occupational license (Covington, Newport, etc.)',
      'Commercial lease or property',
      'Kentucky sales tax registration if selling taxable services',
      'General liability insurance',
      'Professional liability insurance recommended'
    ]
  },
  {
    activityType: 'Staffing/Employment Agency (KY)',
    category: 'Professional Services',
    activityDescription: 'Agency providing staffing and employment services in Northern Kentucky',
    zonesRequired: KY_COMMERCIAL_ZONES,
    zonesProhibited: [...KY_RESIDENTIAL_ZONES, ...KY_INDUSTRIAL_ZONES],
    feeBase: 150,
    processingDays: 21,
    requiresPlans: false,
    requiresInspection: false,
    ordinanceRef: 'Local Zoning; KRS 341',
    requirements: [
      'Business license from city/county',
      'Kentucky occupational license',
      'Workers compensation for placed employees',
      'General liability insurance',
      'EEOC compliance',
      'Background check procedures',
      'I-9 verification processes',
      'Commercial office space',
      'ADA accessible interview areas'
    ]
  },
  {
    activityType: 'Marketing/Advertising Agency (KY)',
    category: 'Professional Services',
    activityDescription: 'Agency providing marketing and advertising services in Northern Kentucky',
    zonesRequired: KY_COMMERCIAL_ZONES,
    zonesProhibited: [...KY_RESIDENTIAL_ZONES, ...KY_INDUSTRIAL_ZONES],
    feeBase: 100,
    processingDays: 14,
    requiresPlans: false,
    requiresInspection: false,
    ordinanceRef: 'Local Zoning',
    requirements: [
      'Business license from city/county',
      'Kentucky occupational license',
      'Kentucky sales tax registration',
      'General liability insurance',
      'Commercial office space',
      'Signage permit if applicable'
    ]
  }
];

// Building Codes - Kentucky Professional Services
const PROFESSIONAL_SERVICES_CODES_KY = [
  {
    codeSection: 'Office Occupancy (KY)',
    category: 'Professional Services',
    codeText: 'Professional offices are typically Group B occupancy under Kentucky Building Code. Egress and fire safety requirements based on occupant load (1 person per 100 sq ft gross for business areas).',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Kentucky Building Code'
  },
  {
    codeSection: 'ADA Accessibility - Kentucky',
    category: 'Professional Services',
    codeText: 'Public areas of professional offices must be accessible per ADA and Kentucky Building Code: 32-inch minimum clear door width, accessible route to services, accessible restrooms, reception counter with lowered section.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'ADA Standards; Kentucky Building Code'
  },
  {
    codeSection: 'Kentucky Occupational License Tax',
    category: 'Professional Services',
    codeText: 'Many Kentucky cities impose occupational license tax on net profits or gross receipts. Covington, Newport, and other NKY cities have varying rates. This is in addition to state and federal income tax. Must register with each city where you do business.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'KRS 68.197; Local Ordinances'
  },
  {
    codeSection: 'Home Occupation Standards (KY)',
    category: 'Professional Services',
    codeText: 'Home occupation standards vary by NKY jurisdiction. Generally: limited to portion of dwelling, no exterior storage or signage, no employees beyond household members, limited client visits. Must obtain business license even for home businesses.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'Local Zoning Ordinance'
  },
  {
    codeSection: 'Medical Office ADA (KY)',
    category: 'Professional Services',
    codeText: 'Medical offices require enhanced accessibility: at least one exam room per specialty must accommodate wheelchair transfer with 30x48 inch clear floor space. All patient areas must be on accessible route.',
    effectiveDate: new Date('2020-01-01'),
    jurisdiction: 'ADA Standards; Kentucky Building Code'
  }
];

// Common Questions - Kentucky Professional Services
const PROFESSIONAL_SERVICES_QUESTIONS_KY = [
  {
    question: 'Can I run a business from my home in Northern Kentucky?',
    answer: 'Yes, but requirements vary by city. Covington, Newport, Florence, and other NKY cities have different home occupation rules. Generally: business must be secondary to residential use, limited or no external signs, restrictions on employees and client visits, and you still need a business license and Kentucky occupational license tax registration. Remote work for an employer typically doesn\'t need a permit, but running your own business does.',
    category: 'Professional Services',
    tags: ['home office', 'home occupation', 'kentucky', 'permit']
  },
  {
    question: 'What is Kentucky occupational license tax?',
    answer: 'Unlike Ohio, many Kentucky cities impose an occupational license tax (sometimes called payroll tax or net profits tax) on individuals and businesses. Covington charges 2.5% on employee wages and net business profits. Newport and other cities have similar taxes. This is separate from state income tax. If you operate a business in these cities, you must register and file returns. This applies even to home-based businesses.',
    category: 'Professional Services',
    tags: ['occupational license', 'tax', 'covington', 'kentucky']
  },
  {
    question: 'Do I need a business license to freelance in Kentucky?',
    answer: 'Yes. Even if working from home, you need: 1) City/county business license; 2) Kentucky occupational license registration in cities that have it (Covington, Newport, etc.); 3) Kentucky tax registration for sales tax if applicable; 4) Professional license if your field requires it. The occupational license tax is unique to Kentucky - Ohio cities don\'t have this. Register with each city where you have clients or operate.',
    category: 'Professional Services',
    tags: ['freelance', 'business license', 'kentucky', 'registration']
  },
  {
    question: 'What zones allow professional offices in Covington?',
    answer: 'Professional offices are typically allowed in: TUMU (Traditional Urban Mixed Use), CMU (Contemporary Mixed Use), DTC (Downtown Core), DTR (Downtown Residential), CRM (Commercial Riverfront Mixed), and SO (Suburban Office) zones. Single-family residential zones generally prohibit offices except as limited home occupations. Check Covington\'s zoning map or contact Planning & Zoning to verify your specific property.',
    category: 'Professional Services',
    tags: ['zoning', 'covington', 'office', 'kentucky']
  },
  {
    question: 'How do I get a Kentucky professional license?',
    answer: 'Kentucky has separate licensing boards for each profession: Kentucky Bar (attorneys), Kentucky Board of Accountancy (CPAs), Kentucky Real Estate Commission (realtors), Kentucky Board of Medical Licensure (physicians), Kentucky Board of Dentistry (dentists), etc. Apply through the appropriate board. Many accept online applications. Processing times and fees vary. Continuing education is required for most licenses.',
    category: 'Professional Services',
    tags: ['license', 'professional', 'kentucky', 'boards']
  },
  {
    question: 'Do I need a separate license to practice in Ohio and Kentucky?',
    answer: 'Generally yes, most professions require separate state licenses. Attorneys need admission to both state bars. CPAs need licenses from both accountancy boards. Real estate agents need licenses in both states. Some professions have reciprocity agreements that simplify the process. Medical doctors can apply for licenses in both states. This is important for Cincinnati-area professionals who serve clients on both sides of the river.',
    category: 'Professional Services',
    tags: ['license', 'ohio', 'kentucky', 'reciprocity']
  },
  {
    question: 'What are the ADA requirements for offices in Kentucky?',
    answer: 'Kentucky follows federal ADA standards plus Kentucky Building Code. Professional offices open to clients must provide: accessible route from parking to services, 32-inch minimum door width, accessible reception/counter area, accessible restrooms if public restrooms are provided, and accessible parking. Medical offices have enhanced requirements including accessible exam rooms. Existing buildings may have less stringent requirements for modifications.',
    category: 'Professional Services',
    tags: ['ada', 'accessibility', 'kentucky', 'office']
  },
  {
    question: 'Can I have employees work at my home office in Kentucky?',
    answer: 'Most Northern Kentucky home occupation rules restrict or prohibit employees who are not household members. Having outside employees come to a residential address raises issues with: zoning compliance, parking, workers\' compensation inspections, and neighbor concerns. If you need employees, consider commercial office space, co-working spaces, or having employees work from their own homes remotely. Check your specific city\'s ordinances.',
    category: 'Professional Services',
    tags: ['employees', 'home office', 'kentucky', 'zoning']
  },
  {
    question: 'Where do I register my business in Kentucky?',
    answer: 'Steps to register a business in Kentucky: 1) Choose business structure (sole proprietor, LLC, corporation); 2) Register with Kentucky Secretary of State for LLCs/corps ($40 online); 3) Get EIN from IRS; 4) Register with Kentucky Department of Revenue for applicable taxes; 5) Get local business license from city/county; 6) Register for occupational license tax in cities like Covington/Newport; 7) Obtain professional licenses as required.',
    category: 'Professional Services',
    tags: ['register', 'business', 'kentucky', 'llc']
  },
  {
    question: 'How do Covington taxes compare to Cincinnati?',
    answer: 'Key differences: Covington has a 2.5% occupational license tax on wages and net profits (similar to Cincinnati\'s 1.8% city income tax). Kentucky has a flat 4% state income tax (vs. Ohio\'s graduated rate). Kentucky has no local school income taxes like some Ohio districts. Property taxes are generally lower in Kentucky. Overall tax burden depends on individual circumstances - consult a tax professional for your specific situation.',
    category: 'Professional Services',
    tags: ['taxes', 'covington', 'cincinnati', 'comparison']
  }
];

// Kentucky Professional Services Startup Checklist
const PROFESSIONAL_SERVICES_CHECKLIST_KY = {
  name: 'Professional Services Business Startup - Kentucky',
  category: 'Professional Services',
  description: 'Checklist for starting a professional services business in Northern Kentucky (Boone, Kenton, Campbell counties)',
  steps: [
    {
      order: 1,
      title: 'Verify Professional Credentials',
      description: 'Ensure Kentucky professional licenses are current',
      estimatedDays: 30,
      tips: [
        'Apply for Kentucky license if not already held',
        'Complete continuing education if required',
        'Register with appropriate Kentucky licensing board',
        'If also serving Ohio clients, get Ohio license'
      ]
    },
    {
      order: 2,
      title: 'Choose Business Structure',
      description: 'Decide on legal structure and register',
      estimatedDays: 14,
      tips: [
        'Register LLC/corporation with Kentucky Secretary of State',
        'Get EIN from IRS',
        'Some professions require specific structures (PLLC)',
        'Kentucky LLC filing fee is $40 online'
      ]
    },
    {
      order: 3,
      title: 'Find Office Location',
      description: 'Secure office space that meets zoning requirements',
      estimatedDays: 30,
      tips: [
        'Verify zoning allows professional office',
        'Consider Covington downtown, Newport, or suburban locations',
        'Check ADA compliance of space',
        'Consider parking availability for clients'
      ]
    },
    {
      order: 4,
      title: 'Register with City/County',
      description: 'Obtain business licenses and register for taxes',
      estimatedDays: 14,
      tips: [
        'Get city/county business license',
        'Register for occupational license tax (Covington, Newport)',
        'Register with Kentucky Department of Revenue',
        'Register trade name if applicable'
      ]
    },
    {
      order: 5,
      title: 'Set Up Insurance',
      description: 'Obtain required business and professional insurance',
      estimatedDays: 14,
      tips: [
        'Professional liability (E&O) insurance',
        'General liability insurance',
        'Workers comp if hiring employees',
        'Cyber liability if handling sensitive data'
      ]
    },
    {
      order: 6,
      title: 'Establish Business Operations',
      description: 'Set up banking and operational systems',
      estimatedDays: 14,
      tips: [
        'Open business bank account',
        'Set up accounting system',
        'Trust account if required (attorneys, real estate)',
        'HIPAA compliance if healthcare-related'
      ]
    },
    {
      order: 7,
      title: 'Launch Business',
      description: 'Final preparations and opening',
      estimatedDays: 7,
      tips: [
        'Apply for signage permit if applicable',
        'Set up business phone and email',
        'Order business cards and materials',
        'Join local professional associations (NKY Chamber, etc.)'
      ]
    }
  ]
};

export async function seedProfessionalServicesKY() {
  console.log('Seeding Kentucky professional services data...');

  // Seed permit requirements
  for (const permit of PROFESSIONAL_SERVICES_PERMITS_KY) {
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
  console.log(`Seeded ${PROFESSIONAL_SERVICES_PERMITS_KY.length} KY professional services permit requirements`);

  // Seed building codes
  for (const code of PROFESSIONAL_SERVICES_CODES_KY) {
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
  console.log(`Seeded ${PROFESSIONAL_SERVICES_CODES_KY.length} KY professional services building codes`);

  // Seed common questions
  for (const qa of PROFESSIONAL_SERVICES_QUESTIONS_KY) {
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
  console.log(`Seeded ${PROFESSIONAL_SERVICES_QUESTIONS_KY.length} KY professional services common questions`);

  // Seed checklist
  const existingChecklist = await prisma.businessChecklist.findFirst({
    where: { name: PROFESSIONAL_SERVICES_CHECKLIST_KY.name },
  });

  if (existingChecklist) {
    await prisma.businessChecklist.update({
      where: { id: existingChecklist.id },
      data: {
        category: PROFESSIONAL_SERVICES_CHECKLIST_KY.category,
        description: PROFESSIONAL_SERVICES_CHECKLIST_KY.description,
        steps: PROFESSIONAL_SERVICES_CHECKLIST_KY.steps,
      },
    });
  } else {
    await prisma.businessChecklist.create({
      data: PROFESSIONAL_SERVICES_CHECKLIST_KY,
    });
  }
  console.log('Seeded KY professional services checklist');

  console.log('Kentucky professional services seeding complete!');
}

export {
  PROFESSIONAL_SERVICES_PERMITS_KY,
  PROFESSIONAL_SERVICES_CODES_KY,
  PROFESSIONAL_SERVICES_QUESTIONS_KY,
  PROFESSIONAL_SERVICES_CHECKLIST_KY
};
