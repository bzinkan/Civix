import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Childcare & Education Permit Requirements
const CHILDCARE_PERMIT_REQUIREMENTS = [
  // DAYCARE CENTERS - ODJFS Licensed
  { activityType: 'childcare_center', category: 'state_license', activityDescription: 'Child Care Center License (13+ children)', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C', 'MG'], zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 90, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 5104.02' },
  { activityType: 'preschool', category: 'state_license', activityDescription: 'Preschool Program License', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 90, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 5104.02' },

  // HOME-BASED CARE
  { activityType: 'type_a_home', category: 'state_license', activityDescription: 'Type A Home Provider (7-12 children)', zonesRequired: ['*'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 60, requiresPlans: false, requiresInspection: true, ordinanceRef: 'ORC 5104.11' },
  { activityType: 'type_b_home', category: 'state_license', activityDescription: 'Type B Home Provider (1-6 children)', zonesRequired: ['*'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 45, requiresPlans: false, requiresInspection: true, ordinanceRef: 'ORC 5104.11' },

  // SCHOOL-AGE PROGRAMS
  { activityType: 'school_age_program', category: 'state_license', activityDescription: 'School-Age Child Care Program', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 5104.02' },
  { activityType: 'summer_camp_day', category: 'license', activityDescription: 'Day Camp License (Summer program)', zonesRequired: ['*'], zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 45, requiresPlans: false, requiresInspection: true, ordinanceRef: 'ORC 5104.02' },

  // PRIVATE SCHOOLS
  { activityType: 'private_school_charter', category: 'state_license', activityDescription: 'Private School Charter (Ohio Dept of Education)', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 180, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3301.16' },
  { activityType: 'private_school_k12', category: 'state_license', activityDescription: 'Non-Public K-12 School Registration', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 90, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3301.07' },

  // TUTORING & ENRICHMENT
  { activityType: 'tutoring_center', category: 'license', activityDescription: 'Tutoring Center Business License', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: false, ordinanceRef: 'CMC 857' },
  { activityType: 'enrichment_program', category: 'license', activityDescription: 'Enrichment Program License (art, music, STEM)', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: false, ordinanceRef: 'CMC 857' },

  // STAFF CREDENTIALS
  { activityType: 'childcare_administrator', category: 'individual_license', activityDescription: 'Child Care Administrator Credential', zonesRequired: ['*'], zonesProhibited: [], feeBase: 25.00, feePerSqft: null, processingDays: 30, requiresPlans: false, requiresInspection: false, ordinanceRef: 'OAC 5101:2-12-08' },
  { activityType: 'child_development_associate', category: 'individual_license', activityDescription: 'Child Development Associate (CDA)', zonesRequired: ['*'], zonesProhibited: [], feeBase: 425.00, feePerSqft: null, processingDays: 60, requiresPlans: false, requiresInspection: false, ordinanceRef: 'Federal' },

  // FOOD SERVICE (if applicable)
  { activityType: 'childcare_food_program', category: 'federal', activityDescription: 'CACFP (Child and Adult Care Food Program)', zonesRequired: ['*'], zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 45, requiresPlans: false, requiresInspection: true, ordinanceRef: 'USDA CACFP' },

  // TRANSPORTATION
  { activityType: 'childcare_transportation', category: 'license', activityDescription: 'Child Care Transportation Registration', zonesRequired: ['*'], zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 30, requiresPlans: false, requiresInspection: true, ordinanceRef: 'OAC 5101:2-12-21' },
];

// Childcare & Education Building Code Chunks
const CHILDCARE_BUILDING_CODES = [
  // CHILDCARE CENTER REQUIREMENTS
  { codeType: 'OAC', section: '5101:2-12-02', title: 'Child Care Center Space Requirements', content: 'Indoor space: minimum 35 sq ft per child in play areas. Outdoor space: minimum 60 sq ft per child. Separate areas for infants, toddlers, preschool. Maximum group sizes: infants 12, toddlers 14, preschool 24.' },
  { codeType: 'OAC', section: '5101:2-12-03', title: 'Child Care Staff Ratios', content: 'Required ratios: Infants (0-12m) 1:5, Toddlers (12-18m) 1:6, Toddlers (18-30m) 1:7, Preschool (3-4y) 1:12, Preschool (4-5y) 1:14, School-age 1:18. Two staff minimum when 6+ children present.' },
  { codeType: 'OAC', section: '5101:2-12-04', title: 'Child Care Safety Requirements', content: 'All outlets covered, blind cords out of reach, gates at stairs, fenced outdoor area (4ft min), no standing water, age-appropriate equipment, cushioned fall zones under play equipment, medication locked, toxic substances inaccessible.' },

  // HOME PROVIDER REQUIREMENTS
  { codeType: 'OAC', section: '5101:2-13-02', title: 'Type A Home Requirements', content: 'Type A (7-12 children) requires: 45 sq ft per child indoor, assistant required when 4+ under 2 years, fenced outdoor area, separate sleeping area for infants, CPR and first aid current, fire inspection.' },
  { codeType: 'OAC', section: '5101:2-14-02', title: 'Type B Home Requirements', content: 'Type B (1-6 children) requires: 35 sq ft per child indoor, max 3 children under age 2, safe outdoor play area, smoke detectors, fire extinguisher, CPR and first aid current, background checks for all adults in home.' },

  // BUILDING CODE - EDUCATIONAL
  { codeType: 'OBC', section: '305.1', title: 'Educational Occupancy', content: 'Day care centers with more than 5 children over 2.5 years old are classified as Group E (Educational). Under 2.5 years or 5 or fewer children classified as Group R-3 or I-4. Affects fire suppression, exits, accessibility.' },
  { codeType: 'OBC', section: '305.2', title: 'Day Care Facilities', content: 'Day care facilities for more than 5 children under 2.5 years: Group I-4 Institutional. Requires fire sprinklers, fire alarm, enhanced egress. Day care for 5 or fewer: Group R-3 Residential, fewer requirements.' },

  // FIRE SAFETY
  { codeType: 'OBC', section: '903.2.3', title: 'Fire Sprinklers - Educational', content: 'Fire sprinklers required in Group E occupancies with fire area over 12,000 sq ft, or located below level of exit discharge. All Group I-4 (infant/toddler care) requires sprinklers regardless of size.' },
  { codeType: 'local', section: '857.40', title: 'Child Care Fire Safety', content: 'All child care centers require fire inspection. Fire drills monthly. Posted evacuation routes. Emergency lighting. Portable fire extinguishers. No deadbolt locks that require key to exit. Panic hardware on exits.' },

  // OUTDOOR REQUIREMENTS
  { codeType: 'OAC', section: '5101:2-12-18', title: 'Outdoor Play Area Standards', content: 'Outdoor area must be: fenced (4ft minimum), free of hazards, age-appropriate equipment, cushioned surface under equipment (per CPSC), shaded areas, water source available, visible from indoor supervision area.' },
  { codeType: 'OAC', section: '5101:2-12-19', title: 'Playground Safety', content: 'Equipment must meet CPSC guidelines. Fall zones require impact-absorbing surface. Equipment appropriate for age group. Regular safety inspections documented. No entrapment hazards.' },

  // HEALTH & SANITATION
  { codeType: 'OAC', section: '5101:2-12-15', title: 'Diapering and Toileting', content: 'Diapering area separate from food prep. Hand washing sink adjacent. Disposable changing surface or sanitized between uses. Child-sized toilets or adapters. Handwashing supervision required.' },
  { codeType: 'OAC', section: '5101:2-12-16', title: 'Food Service in Child Care', content: 'Kitchen facilities must meet local health codes if preparing food. CACFP participation requires additional standards. Age-appropriate serving sizes. Allergy management policies. No choking hazard foods for infants.' },

  // TRAINING REQUIREMENTS
  { codeType: 'OAC', section: '5101:2-12-08', title: 'Staff Training Requirements', content: 'Administrator: CDA or college degree in ECE, plus administrator credential. Lead teachers: CDA or equivalent. Assistants: high school diploma. All staff: CPR, first aid, communicable disease training. Annual professional development hours.' },
  { codeType: 'OAC', section: '5101:2-12-09', title: 'Background Check Requirements', content: 'All employees and volunteers with unsupervised access must pass: BCI (Ohio) background check, FBI fingerprint check, Ohio sex offender registry check, Ohio child abuse registry check. Checks valid for 5 years.' },
];

// Childcare & Education Common Questions
const CHILDCARE_COMMON_QUESTIONS = [
  { question: 'What license do I need to open a daycare center?', category: 'daycare', answer: 'For 13+ children, you need an ODJFS Child Care Center License ($100). Process takes 90+ days. Requirements: 35 sq ft per child, staff ratios (1:5 for infants), administrator with CDA, all staff with background checks, fire inspection, health inspection. Building must meet Group E or I-4 code requirements.', relatedPermits: ['childcare_center'], ordinanceRef: 'ORC 5104.02' },

  { question: 'How do I start a home daycare?', category: 'home_daycare', answer: 'For 1-6 children: Type B license ($50). For 7-12: Type A license ($50, requires assistant). Apply to ODJFS. Requirements: background checks for all adults, CPR/first aid, home inspection, space requirements (35 sq ft/child), smoke detectors, fire extinguisher. Process takes 45-60 days.', relatedPermits: ['type_a_home', 'type_b_home'], ordinanceRef: 'ORC 5104.11' },

  { question: 'What are the staff-to-child ratios in Ohio?', category: 'ratios', answer: 'Ohio ODJFS ratios: Infants (0-12m) 1:5, Young toddlers (12-18m) 1:6, Older toddlers (18-30m) 1:7, Preschool 3yr 1:12, Preschool 4yr 1:14, School-age 1:18. Two staff minimum required when 6+ children present. Lower ratios required for higher quality ratings (Step Up To Quality).', relatedPermits: ['childcare_center', 'type_a_home'], ordinanceRef: 'OAC 5101:2-12-03' },

  { question: 'What education is required to run a daycare?', category: 'education', answer: 'Center administrator: CDA credential or associate degree in ECE, plus Ohio Administrator Credential. Lead teachers: CDA or equivalent. All staff: CPR, first aid, communicable disease training. Type B home: no specific education (training provided). Type A home: 40 hours pre-service training.', relatedPermits: ['childcare_administrator', 'child_development_associate'], ordinanceRef: 'OAC 5101:2-12-08' },

  { question: 'What background checks are required for childcare workers?', category: 'background', answer: 'All staff must pass: BCI (Ohio Bureau of Criminal Investigation) check, FBI fingerprint check, Ohio sex offender registry check, Ohio child abuse registry check (SACWIS). Checks required before hire (conditionally cleared) and every 5 years. Cost: approximately $60-80 total.', relatedPermits: ['childcare_center'], ordinanceRef: 'OAC 5101:2-12-09' },

  { question: 'Do I need a license to open a tutoring center?', category: 'tutoring', answer: 'No state childcare license needed for tutoring centers where children are not left without parent supervision for extended periods. You need: city business license ($50), appropriate commercial zoning. If children are dropped off for sessions, some licensing may apply depending on hours and ages. Background checks recommended.', relatedPermits: ['tutoring_center'], ordinanceRef: 'CMC 857' },

  { question: 'What are the building requirements for a daycare?', category: 'building', answer: 'Centers classified as Group E (educational) or I-4 (institutional) occupancy. Requirements: 35 sq ft per child, fire sprinklers for I-4 or large E, emergency exits, fire alarm, ADA accessibility, outdoor play area (60 sq ft/child), fenced yard, age-appropriate bathrooms.', relatedPermits: ['childcare_center'], ordinanceRef: 'OBC 305' },

  { question: 'How do I start a private school in Ohio?', category: 'private_school', answer: 'Private schools must register with Ohio Department of Education. Non-chartered: minimal requirements, report student enrollment annually. Chartered: full oversight, must follow state standards. Building must meet Group E occupancy code. Teacher certification requirements vary by chartered vs non-chartered status.', relatedPermits: ['private_school_charter', 'private_school_k12'], ordinanceRef: 'ORC 3301.16' },

  { question: 'Can I run an after-school program?', category: 'after_school', answer: 'School-age child care programs need ODJFS license if caring for children for an extended period (more than 4 hours or overnight). Shorter enrichment programs may be exempt. Requirements: background checks, 1:18 ratio, appropriate space, staff training. Programs at schools may fall under different rules.', relatedPermits: ['school_age_program', 'enrichment_program'], ordinanceRef: 'ORC 5104.02' },

  { question: 'What food service requirements apply to daycares?', category: 'food', answer: 'If preparing food on-site, must meet local health department food service standards. CACFP (Child and Adult Care Food Program) participation provides reimbursement but adds requirements. Age-appropriate portions, allergy documentation, no choking hazards for infants. Kitchen separate from play areas.', relatedPermits: ['childcare_food_program'], ordinanceRef: 'OAC 5101:2-12-16' },
];

// Childcare & Education Business Checklists
const CHILDCARE_BUSINESS_CHECKLISTS = [
  {
    businessType: 'daycare_center',
    checklistName: 'Daycare Center Opening Checklist',
    description: 'Complete guide to opening a licensed child care center in Cincinnati.',
    totalSteps: 16,
    estimatedDays: 180,
    estimatedCost: '$10,000 - $75,000',
    items: [
      { step: 1, title: 'Complete Pre-Licensing Orientation', description: 'Attend ODJFS child care center orientation (required before application).', category: 'training', required: true, estimatedDays: 7, feeRange: null, links: [] },
      { step: 2, title: 'Find Suitable Location', description: 'Commercial zone, 35 sq ft per child indoor, 60 sq ft outdoor. Check zoning for childcare use.', category: 'planning', required: true, estimatedDays: 60, feeRange: null, links: [] },
      { step: 3, title: 'Register Business', description: 'Ohio Secretary of State, EIN, Cincinnati business license.', category: 'business', required: true, estimatedDays: 7, feeRange: '$50-200', links: [] },
      { step: 4, title: 'Building Permits', description: 'Apply for building permits for any construction or renovation. Must meet Group E or I-4 code.', category: 'building', required: true, estimatedDays: 45, feeRange: '$500-10,000', links: [] },
      { step: 5, title: 'Build Out Facility', description: 'Classrooms, restrooms, kitchen, outdoor area, fencing. Age-appropriate fixtures, safety features.', category: 'building', required: true, estimatedDays: 60, feeRange: '$20,000-100,000+', links: [] },
      { step: 6, title: 'Fire Safety Systems', description: 'Fire sprinklers (if required), alarm system, extinguishers, emergency lighting, exit signs.', category: 'fire', required: true, estimatedDays: 21, feeRange: '$5,000-25,000', links: [] },
      { step: 7, title: 'Fire Inspection', description: 'Pass fire marshal inspection before opening.', category: 'inspection', required: true, estimatedDays: 14, feeRange: null, links: [] },
      { step: 8, title: 'Obtain Administrator Credential', description: 'Center administrator must have CDA or degree plus Ohio Administrator Credential.', category: 'training', required: true, estimatedDays: 30, feeRange: '$25-500', links: [] },
      { step: 9, title: 'Staff Hiring & Background Checks', description: 'Hire staff meeting qualification requirements. Complete BCI/FBI checks for all employees.', category: 'staffing', required: true, estimatedDays: 30, feeRange: '$60-80/person', links: [] },
      { step: 10, title: 'Staff Training', description: 'CPR, first aid, communicable disease, child abuse recognition training for all staff.', category: 'training', required: true, estimatedDays: 14, feeRange: '$100-300/person', links: [] },
      { step: 11, title: 'Apply for Child Care License', description: 'Submit ODJFS application with floor plan, policies, staff list, fee.', category: 'license', required: true, estimatedDays: 90, feeRange: '$100', links: [] },
      { step: 12, title: 'ODJFS Inspection', description: 'Pass ODJFS licensing inspection. Covers safety, ratios, space, equipment.', category: 'inspection', required: true, estimatedDays: 14, feeRange: null, links: [] },
      { step: 13, title: 'Health Inspection', description: 'If serving food, pass health department inspection.', category: 'inspection', required: false, estimatedDays: 14, feeRange: null, links: [] },
      { step: 14, title: 'Apply for CACFP (optional)', description: 'Food program provides reimbursement for meals served to eligible children.', category: 'federal', required: false, estimatedDays: 45, feeRange: null, links: [] },
      { step: 15, title: 'Obtain Insurance', description: 'General liability, professional liability, property insurance. Child care specific coverage.', category: 'business', required: true, estimatedDays: 7, feeRange: '$2,000-8,000/year', links: [] },
      { step: 16, title: 'Post License & Information', description: 'Post license, inspection reports, emergency procedures, parent communication board.', category: 'compliance', required: true, estimatedDays: 1, feeRange: null, links: [] },
    ],
  },
  {
    businessType: 'home_daycare',
    checklistName: 'Home Daycare Provider Checklist',
    description: 'Guide to becoming a licensed Type A or Type B home daycare provider.',
    totalSteps: 12,
    estimatedDays: 60,
    estimatedCost: '$500 - $2,000',
    items: [
      { step: 1, title: 'Determine License Type', description: 'Type B: 1-6 children. Type A: 7-12 children (requires assistant). Choose based on your goals.', category: 'planning', required: true, estimatedDays: 1, feeRange: null, links: [] },
      { step: 2, title: 'Complete Pre-Licensing Orientation', description: 'Attend ODJFS home provider orientation (required before application).', category: 'training', required: true, estimatedDays: 7, feeRange: null, links: [] },
      { step: 3, title: 'Background Checks', description: 'BCI and FBI checks for provider and all adults living in home. Child abuse registry check.', category: 'compliance', required: true, estimatedDays: 14, feeRange: '$60-80/person', links: [] },
      { step: 4, title: 'CPR and First Aid Certification', description: 'Complete infant/child CPR and first aid certification.', category: 'training', required: true, estimatedDays: 7, feeRange: '$50-100', links: [] },
      { step: 5, title: 'Communicable Disease Training', description: 'Complete required health and safety training modules.', category: 'training', required: true, estimatedDays: 3, feeRange: null, links: [] },
      { step: 6, title: 'Prepare Your Home', description: 'Safety proofing: outlet covers, gates, fencing, locked cabinets, smoke detectors, fire extinguisher, safe sleep area.', category: 'building', required: true, estimatedDays: 14, feeRange: '$200-1,000', links: [] },
      { step: 7, title: 'Create Outdoor Play Area', description: 'Fenced outdoor area with age-appropriate equipment. Safe surface under climbing equipment.', category: 'building', required: true, estimatedDays: 14, feeRange: '$500-3,000', links: [] },
      { step: 8, title: 'Apply for License', description: 'Submit ODJFS Type A or Type B application with home diagram and policies.', category: 'license', required: true, estimatedDays: 45, feeRange: '$50', links: [] },
      { step: 9, title: 'Home Inspection', description: 'Pass ODJFS licensing inspection of your home.', category: 'inspection', required: true, estimatedDays: 7, feeRange: null, links: [] },
      { step: 10, title: 'Fire Inspection (Type A)', description: 'Type A homes require fire inspection. Type B recommended.', category: 'inspection', required: false, estimatedDays: 7, feeRange: null, links: [] },
      { step: 11, title: 'Obtain Insurance', description: 'Home business liability rider or child care specific policy.', category: 'business', required: true, estimatedDays: 7, feeRange: '$300-1,000/year', links: [] },
      { step: 12, title: 'Apply for CACFP (optional)', description: 'Food reimbursement program for licensed home providers.', category: 'federal', required: false, estimatedDays: 30, feeRange: null, links: [] },
    ],
  },
  {
    businessType: 'tutoring_center',
    checklistName: 'Tutoring Center Checklist',
    description: 'Guide to opening a tutoring or learning center in Cincinnati.',
    totalSteps: 8,
    estimatedDays: 30,
    estimatedCost: '$1,000 - $10,000',
    items: [
      { step: 1, title: 'Define Services', description: 'Academic tutoring, test prep, enrichment, homework help. Determine age groups and subjects.', category: 'planning', required: true, estimatedDays: 7, feeRange: null, links: [] },
      { step: 2, title: 'Find Location', description: 'Commercial zone, accessible to parents, adequate parking. Consider school district proximity.', category: 'planning', required: true, estimatedDays: 21, feeRange: null, links: [] },
      { step: 3, title: 'Register Business', description: 'Ohio Secretary of State, EIN, Cincinnati business license.', category: 'business', required: true, estimatedDays: 7, feeRange: '$50-200', links: [] },
      { step: 4, title: 'Set Up Space', description: 'Tutoring stations or rooms, waiting area for parents, restroom access.', category: 'building', required: true, estimatedDays: 14, feeRange: '$2,000-15,000', links: [] },
      { step: 5, title: 'Background Checks (recommended)', description: 'Though not required for tutoring, background checks build parent trust.', category: 'compliance', required: false, estimatedDays: 14, feeRange: '$60-80/person', links: [] },
      { step: 6, title: 'Hire Tutors', description: 'Qualified tutors in subject areas. Consider teacher certification, college students, professionals.', category: 'staffing', required: true, estimatedDays: 21, feeRange: 'Varies', links: [] },
      { step: 7, title: 'Develop Curriculum', description: 'Assessment tools, lesson plans, progress tracking, parent communication system.', category: 'planning', required: true, estimatedDays: 14, feeRange: '$500-5,000', links: [] },
      { step: 8, title: 'Insurance', description: 'General liability insurance. Professional liability if providing assessments.', category: 'business', required: true, estimatedDays: 7, feeRange: '$500-1,500/year', links: [] },
    ],
  },
];

async function seedChildcareIndustryData() {
  console.log('Starting Childcare & Education data seed...\n');

  const jurisdiction = await prisma.jurisdiction.findFirst({
    where: { name: 'Cincinnati' },
  });

  if (!jurisdiction) {
    console.error('Cincinnati jurisdiction not found! Please run main seed first.');
    process.exit(1);
  }

  console.log(`Found jurisdiction: ${jurisdiction.name}, ${jurisdiction.state}\n`);

  // Seed Permit Requirements
  console.log('Seeding Childcare Permit Requirements...');
  let permitCount = 0;
  for (const permit of CHILDCARE_PERMIT_REQUIREMENTS) {
    await prisma.permitRequirement.upsert({
      where: {
        jurisdictionId_activityType: {
          jurisdictionId: jurisdiction.id,
          activityType: permit.activityType,
        },
      },
      update: {
        activityDescription: permit.activityDescription,
        category: permit.category,
        zonesRequired: permit.zonesRequired,
        zonesProhibited: permit.zonesProhibited,
        requiresPermit: true,
        requiresPlans: permit.requiresPlans,
        requiresInspection: permit.requiresInspection,
        feeBase: permit.feeBase,
        feePerSqft: permit.feePerSqft,
        processingDays: permit.processingDays,
        documents: [],
        ordinanceRef: permit.ordinanceRef,
      },
      create: {
        jurisdictionId: jurisdiction.id,
        activityType: permit.activityType,
        activityDescription: permit.activityDescription,
        category: permit.category,
        zonesRequired: permit.zonesRequired,
        zonesProhibited: permit.zonesProhibited,
        requiresPermit: true,
        requiresPlans: permit.requiresPlans,
        requiresInspection: permit.requiresInspection,
        feeBase: permit.feeBase,
        feePerSqft: permit.feePerSqft,
        processingDays: permit.processingDays,
        documents: [],
        ordinanceRef: permit.ordinanceRef,
      },
    });
    permitCount++;
  }
  console.log(`✓ Seeded ${permitCount} childcare permit requirements\n`);

  // Seed Building Codes
  console.log('Seeding Childcare Building Codes...');
  let codeCount = 0;
  for (const code of CHILDCARE_BUILDING_CODES) {
    const existing = await prisma.buildingCodeChunk.findFirst({
      where: {
        jurisdictionId: jurisdiction.id,
        section: code.section,
      },
    });

    if (existing) {
      await prisma.buildingCodeChunk.update({
        where: { id: existing.id },
        data: {
          codeType: code.codeType,
          codeYear: '2024',
          title: code.title,
          content: code.content,
        },
      });
    } else {
      await prisma.buildingCodeChunk.create({
        data: {
          jurisdictionId: jurisdiction.id,
          codeType: code.codeType,
          codeYear: '2024',
          section: code.section,
          title: code.title,
          content: code.content,
        },
      });
    }
    codeCount++;
  }
  console.log(`✓ Seeded ${codeCount} childcare building codes\n`);

  // Seed Common Questions
  console.log('Seeding Childcare Common Questions...');
  let questionCount = 0;
  for (const q of CHILDCARE_COMMON_QUESTIONS) {
    const existing = await prisma.commonQuestion.findFirst({
      where: {
        jurisdictionId: jurisdiction.id,
        question: q.question,
      },
    });

    if (existing) {
      await prisma.commonQuestion.update({
        where: { id: existing.id },
        data: {
          category: q.category,
          answer: q.answer,
          relatedPermits: q.relatedPermits,
          ordinanceRef: q.ordinanceRef,
        },
      });
    } else {
      await prisma.commonQuestion.create({
        data: {
          jurisdictionId: jurisdiction.id,
          question: q.question,
          category: q.category,
          answer: q.answer,
          relatedPermits: q.relatedPermits,
          ordinanceRef: q.ordinanceRef,
        },
      });
    }
    questionCount++;
  }
  console.log(`✓ Seeded ${questionCount} childcare common questions\n`);

  // Seed Business Checklists
  console.log('Seeding Childcare Business Checklists...');
  let checklistCount = 0;
  for (const checklist of CHILDCARE_BUSINESS_CHECKLISTS) {
    await prisma.businessChecklist.upsert({
      where: {
        jurisdictionId_businessType: {
          jurisdictionId: jurisdiction.id,
          businessType: checklist.businessType,
        },
      },
      update: {
        checklistName: checklist.checklistName,
        description: checklist.description,
        totalSteps: checklist.totalSteps,
        estimatedDays: checklist.estimatedDays,
        estimatedCost: checklist.estimatedCost,
        items: checklist.items,
      },
      create: {
        jurisdictionId: jurisdiction.id,
        businessType: checklist.businessType,
        checklistName: checklist.checklistName,
        description: checklist.description,
        totalSteps: checklist.totalSteps,
        estimatedDays: checklist.estimatedDays,
        estimatedCost: checklist.estimatedCost,
        items: checklist.items,
      },
    });
    checklistCount++;
  }
  console.log(`✓ Seeded ${checklistCount} childcare business checklists\n`);

  console.log('='.repeat(50));
  console.log('Childcare & Education data seed completed!');
  console.log('='.repeat(50));
}

seedChildcareIndustryData()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
