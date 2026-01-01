import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fitness & Wellness Permit Requirements
const FITNESS_PERMIT_REQUIREMENTS = [
  // GYM / FITNESS CENTER
  { activityType: 'gym_fitness_center', category: 'license', activityDescription: 'Gym / Fitness Center License', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C', 'MG'], zonesProhibited: [], feeBase: 150.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'CMC 857' },
  { activityType: 'health_club', category: 'license', activityDescription: 'Health Club Registration (Ohio prepaid contracts)', zonesRequired: ['*'], zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: false, ordinanceRef: 'ORC 1345.41' },

  // POOL / AQUATIC
  { activityType: 'public_pool', category: 'health_license', activityDescription: 'Public Swimming Pool License', zonesRequired: ['CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C', 'MG'], zonesProhibited: [], feeBase: 250.00, feePerSqft: null, processingDays: 45, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3749.02' },
  { activityType: 'spa_pool', category: 'health_license', activityDescription: 'Spa/Hot Tub License', zonesRequired: ['CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C', 'MG'], zonesProhibited: [], feeBase: 150.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3749.02' },
  { activityType: 'pool_operator', category: 'individual_license', activityDescription: 'Certified Pool Operator (CPO)', zonesRequired: ['*'], zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 7, requiresPlans: false, requiresInspection: false, ordinanceRef: 'OAC 3701-31' },

  // YOGA / PILATES / DANCE
  { activityType: 'yoga_studio', category: 'license', activityDescription: 'Yoga/Pilates Studio License', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: false, ordinanceRef: 'CMC 857' },
  { activityType: 'dance_studio', category: 'license', activityDescription: 'Dance Studio License', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: false, ordinanceRef: 'CMC 857' },

  // MARTIAL ARTS / BOXING
  { activityType: 'martial_arts_studio', category: 'license', activityDescription: 'Martial Arts / Boxing Gym License', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C', 'MG'], zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 21, requiresPlans: false, requiresInspection: false, ordinanceRef: 'CMC 857' },
  { activityType: 'boxing_promoter', category: 'state_license', activityDescription: 'Boxing/MMA Promoter License', zonesRequired: ['*'], zonesProhibited: [], feeBase: 500.00, feePerSqft: null, processingDays: 60, requiresPlans: false, requiresInspection: false, ordinanceRef: 'ORC 3773.36' },

  // PERSONAL TRAINING
  { activityType: 'personal_training', category: 'license', activityDescription: 'Personal Training Business License', zonesRequired: ['*'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 7, requiresPlans: false, requiresInspection: false, ordinanceRef: 'CMC 857' },

  // WELLNESS / HOLISTIC
  { activityType: 'wellness_center', category: 'license', activityDescription: 'Wellness Center License', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 21, requiresPlans: false, requiresInspection: false, ordinanceRef: 'CMC 857' },
  { activityType: 'sauna_facility', category: 'health_license', activityDescription: 'Sauna/Steam Room License', zonesRequired: ['CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'OAC 3701-31' },
  { activityType: 'cryotherapy', category: 'license', activityDescription: 'Cryotherapy Facility License', zonesRequired: ['CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 150.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'CMC 857' },

  // CLIMBING
  { activityType: 'climbing_gym', category: 'license', activityDescription: 'Indoor Climbing Gym License', zonesRequired: ['CC-M', 'CC-A', 'DD-A', 'DD-C', 'MG', 'ML'], zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 45, requiresPlans: true, requiresInspection: true, ordinanceRef: 'CMC 857' },

  // OUTDOOR FITNESS
  { activityType: 'outdoor_fitness', category: 'license', activityDescription: 'Outdoor Fitness Class Permit', zonesRequired: ['*'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: false, ordinanceRef: 'CMC 719' },
];

// Fitness & Wellness Building Code Chunks
const FITNESS_BUILDING_CODES = [
  // GYM REQUIREMENTS
  { codeType: 'OBC', section: '303.1', title: 'Assembly Occupancy - Fitness', content: 'Gyms and fitness centers are classified as Assembly Group A-3 occupancy. Requires: fire sprinklers for buildings over 12,000 sq ft or 300+ occupants, emergency lighting, exit signs, accessible routes.' },
  { codeType: 'OBC', section: '2902.1', title: 'Restroom Requirements - Fitness', content: 'Fitness facilities: 1 toilet per 125 male occupants, 1 per 65 female occupants for first 200, then 1 per 250 beyond. Showers: 1 per 40 lockers if lockers provided. ADA accessible facilities required.' },
  { codeType: 'OBC', section: '1107.6', title: 'Accessible Fitness Equipment', content: 'Accessible route to all fitness equipment areas. At least one of each type of equipment must be on accessible route. Clear floor space at accessible equipment.' },
  { codeType: 'local', section: '857.30', title: 'Gym Floor Requirements', content: 'Fitness areas should have appropriate flooring: rubber flooring for weight areas (min 3/8" thickness), sprung floors for group fitness, non-slip surfaces throughout. Consider vibration and noise control for multi-tenant buildings.' },

  // POOL REQUIREMENTS
  { codeType: 'OAC', section: '3701-31-02', title: 'Public Pool Requirements', content: 'Public pools require: Ohio Department of Health license, certified pool operator on staff, daily water testing, proper chemical storage, lifeguard requirements based on size, ADA compliant access, emergency equipment.' },
  { codeType: 'OAC', section: '3701-31-03', title: 'Pool Water Quality', content: 'Free chlorine: 1.0-10.0 ppm. pH: 7.2-7.8. Cyanuric acid: max 100 ppm. Water clarity must allow main drain to be visible. Test every 4 hours during operation. Logs maintained for 3 years.' },
  { codeType: 'OAC', section: '3701-31-04', title: 'Pool Facility Requirements', content: 'Pools must have: 4-foot minimum deck, non-slip surfaces, safety equipment (ring buoy, reaching pole, first aid kit), depth markers, no diving signs for shallow pools, emergency phone, posted rules.' },
  { codeType: 'OAC', section: '3701-31-05', title: 'Spa/Hot Tub Requirements', content: 'Spas must: maintain 100-104°F, have automatic shutoff at 104°F, post warning signs (pregnancy, heart conditions), have emergency shutoff accessible to bathers, limit bathing load per size.' },

  // STUDIO REQUIREMENTS
  { codeType: 'local', section: '857.31', title: 'Yoga/Dance Studio Requirements', content: 'Studios should have: adequate ventilation (hot yoga requires enhanced HVAC), non-slip flooring, clear of obstructions, emergency exits visible, sound insulation if in mixed-use building.' },
  { codeType: 'local', section: '857.32', title: 'Hot Yoga/Bikram Requirements', content: 'Hot yoga studios require: HVAC capable of 95-105°F with humidity control, fresh air intake, emergency cooling capability, posted health warnings, hydration stations.' },

  // MARTIAL ARTS / COMBAT
  { codeType: 'local', section: '857.33', title: 'Combat Sports Facility', content: 'Martial arts/boxing gyms should have: padded flooring in training areas, proper equipment storage, first aid kit, emergency contacts posted. Professional events require Ohio Athletic Commission approval.' },
  { codeType: 'ORC', section: '3773.36', title: 'Boxing/MMA Regulation', content: 'Professional boxing and MMA events require Ohio Athletic Commission sanctioning. Promoter license required. Event permits, medical personnel, and insurance mandated.' },

  // CLIMBING GYM
  { codeType: 'local', section: '857.34', title: 'Climbing Gym Standards', content: 'Indoor climbing facilities should follow industry standards (CWA): adequate fall zones, proper padding, anchor point inspections, belay certification for staff, waiver system, equipment inspection logs.' },

  // WELLNESS / SPA
  { codeType: 'OAC', section: '3701-31-06', title: 'Sauna/Steam Room Standards', content: 'Saunas must have: temperature limit (194°F sauna, 120°F steam), automatic timer, emergency call button, slip-resistant flooring, proper ventilation, posted health warnings.' },

  // GENERAL SAFETY
  { codeType: 'OBC', section: '1008.1', title: 'Exit Requirements - Fitness', content: 'Assembly spaces require exit capacity based on occupancy. Doors must swing in direction of egress for rooms over 50 occupants. Exit signs illuminated. Emergency lighting required.' },
  { codeType: 'local', section: '857.35', title: 'Fitness Facility Safety', content: 'All fitness facilities should have: AED (recommended for 50+ capacity), first aid kit, emergency action plan, staff trained in CPR, posted emergency procedures, equipment maintenance logs.' },
];

// Fitness & Wellness Common Questions
const FITNESS_COMMON_QUESTIONS = [
  { question: 'What permits do I need to open a gym?', category: 'gym', answer: 'You need: city business license ($50), Certificate of Occupancy for the space, building permits for any construction. If offering prepaid memberships, register under Ohio Health Club Act ($200). Fire inspection required if over 300 occupants or 12,000 sq ft. No state fitness license required.', relatedPermits: ['gym_fitness_center', 'health_club'], ordinanceRef: 'CMC 857' },

  { question: 'What are the requirements for a swimming pool at my gym?', category: 'pool', answer: 'Public pools require Ohio Department of Health license ($250+). You need: Certified Pool Operator (CPO) on staff, daily water testing logs, proper chemical storage, lifeguards (based on pool size), ADA-compliant access, and annual inspection. Processing takes 45+ days.', relatedPermits: ['public_pool', 'pool_operator'], ordinanceRef: 'ORC 3749.02' },

  { question: 'Do I need a license to teach yoga or fitness classes?', category: 'studio', answer: 'No state license required for yoga, fitness, or dance instructors in Ohio. You need a city business license ($50) if operating your own studio. If working as independent contractor at existing gym, the gym provides coverage. Liability insurance strongly recommended.', relatedPermits: ['yoga_studio', 'dance_studio'], ordinanceRef: 'CMC 857' },

  { question: 'What are the requirements for a hot yoga studio?', category: 'hot_yoga', answer: 'Hot yoga requires: HVAC system capable of 95-105°F with humidity control, fresh air intake, emergency cooling, posted health warnings. Building permit may be needed for HVAC work. Same business license as regular yoga studio. Consider soundproofing and flooring for humidity.', relatedPermits: ['yoga_studio'], ordinanceRef: 'CMC 857.31' },

  { question: 'How do I open a martial arts or boxing gym?', category: 'martial_arts', answer: 'Standard business license ($50), appropriate commercial zoning. Padded flooring recommended. If hosting professional fights or amateur competitions, you need Ohio Athletic Commission sanctioning and event permits. Liability waivers essential. Insurance required.', relatedPermits: ['martial_arts_studio', 'boxing_promoter'], ordinanceRef: 'ORC 3773.36' },

  { question: 'Do I need a license for personal training?', category: 'personal_training', answer: 'No state license required for personal trainers in Ohio. If operating your own business, you need a city business license ($50). Professional certifications (NASM, ACE, ACSM) are voluntary but industry standard and may be required by insurance. CPR certification recommended.', relatedPermits: ['personal_training'], ordinanceRef: 'CMC 857' },

  { question: 'What insurance do I need for a fitness business?', category: 'insurance', answer: 'Recommended coverage: General liability (slips, falls), professional liability (instruction-related injuries), property insurance, workers comp. If pool: additional aquatic liability. Most landlords require $1M-$2M coverage. Waivers help but don\'t replace insurance.', relatedPermits: [], ordinanceRef: null },

  { question: 'What are the restroom requirements for a gym?', category: 'restrooms', answer: 'Ohio Building Code requires: 1 toilet per 125 male, 1 per 65 female for first 200 occupants. If providing lockers, showers required (1 per 40 lockers). ADA accessible facilities required. Separate facilities for each gender unless single-occupancy.', relatedPermits: ['gym_fitness_center'], ordinanceRef: 'OBC 2902.1' },

  { question: 'Can I run fitness classes in a park?', category: 'outdoor', answer: 'Yes, but you typically need a permit to use public parks for commercial activity. Cincinnati Parks require: special event permit ($50+), proof of insurance, designated areas only. Some parks have specific fitness programming rules. Private property with owner permission doesn\'t require park permit.', relatedPermits: ['outdoor_fitness'], ordinanceRef: 'CMC 719' },

  { question: 'What do I need for a climbing gym?', category: 'climbing', answer: 'Climbing gyms need: commercial space with high ceilings (typically warehouse/industrial), business license, Certificate of Occupancy, proper liability waivers. No state-specific climbing regulations but follow CWA (Climbing Wall Association) standards. Comprehensive insurance essential.', relatedPermits: ['climbing_gym'], ordinanceRef: 'CMC 857.34' },
];

// Fitness & Wellness Business Checklists
const FITNESS_BUSINESS_CHECKLISTS = [
  {
    businessType: 'gym',
    checklistName: 'Gym / Fitness Center Checklist',
    description: 'Complete guide to opening a gym or fitness center in Cincinnati.',
    totalSteps: 12,
    estimatedDays: 90,
    estimatedCost: '$5,000 - $50,000',
    items: [
      { step: 1, title: 'Find Location', description: 'Commercial zone (CC, DD, MG). Consider: ceiling height, floor load capacity, parking, ventilation, visibility. Ground floor preferred.', category: 'planning', required: true, estimatedDays: 45, feeRange: null, links: [] },
      { step: 2, title: 'Register Business', description: 'Ohio Secretary of State, EIN, Cincinnati business license ($50).', category: 'business', required: true, estimatedDays: 7, feeRange: '$50-200', links: [] },
      { step: 3, title: 'Ohio Health Club Registration', description: 'If selling prepaid memberships over $50, register under Ohio Health Club Act.', category: 'license', required: true, estimatedDays: 14, feeRange: '$200', links: [] },
      { step: 4, title: 'Building Permits', description: 'Apply for permits for any buildout: plumbing (showers), electrical, HVAC, structural (heavy equipment).', category: 'building', required: true, estimatedDays: 30, feeRange: '$500-5,000', links: [] },
      { step: 5, title: 'Install Flooring', description: 'Rubber flooring for weights (3/8" min), appropriate flooring for cardio and group fitness areas.', category: 'building', required: true, estimatedDays: 14, feeRange: '$3,000-15,000', links: [] },
      { step: 6, title: 'Equipment Purchase & Setup', description: 'Cardio, strength equipment, free weights. Ensure accessible placement per ADA.', category: 'equipment', required: true, estimatedDays: 21, feeRange: '$20,000-200,000', links: [] },
      { step: 7, title: 'Locker Room Setup', description: 'Install lockers, showers (1 per 40 lockers), vanity areas. ADA accessible facilities.', category: 'building', required: true, estimatedDays: 21, feeRange: '$10,000-50,000', links: [] },
      { step: 8, title: 'Fire Safety', description: 'Fire suppression if over 12,000 sq ft, exit signs, emergency lighting, fire extinguishers.', category: 'fire', required: true, estimatedDays: 14, feeRange: '$1,000-10,000', links: [] },
      { step: 9, title: 'Safety Equipment', description: 'AED, first aid kit, emergency action plan posted, emergency phone numbers.', category: 'safety', required: true, estimatedDays: 3, feeRange: '$1,500-3,000', links: [] },
      { step: 10, title: 'Certificate of Occupancy', description: 'Final building inspection and C of O from Building Department.', category: 'building', required: true, estimatedDays: 7, feeRange: '$50-100', links: [] },
      { step: 11, title: 'Insurance', description: 'General liability, property insurance, professional liability. Workers comp if employees.', category: 'business', required: true, estimatedDays: 7, feeRange: '$3,000-10,000/year', links: [] },
      { step: 12, title: 'Membership System', description: 'Set up membership management software, payment processing, waivers system.', category: 'planning', required: true, estimatedDays: 7, feeRange: '$50-500/month', links: [] },
    ],
  },
  {
    businessType: 'yoga_studio',
    checklistName: 'Yoga / Pilates Studio Checklist',
    description: 'Guide to opening a yoga or pilates studio in Cincinnati.',
    totalSteps: 8,
    estimatedDays: 45,
    estimatedCost: '$2,000 - $15,000',
    items: [
      { step: 1, title: 'Find Location', description: 'Commercial zone, ground floor preferred. Consider: natural light, ventilation (critical for hot yoga), parking, neighborhood.', category: 'planning', required: true, estimatedDays: 30, feeRange: null, links: [] },
      { step: 2, title: 'Register Business', description: 'Ohio Secretary of State, EIN, Cincinnati business license ($50).', category: 'business', required: true, estimatedDays: 7, feeRange: '$50-200', links: [] },
      { step: 3, title: 'HVAC Assessment', description: 'For hot yoga: ensure HVAC can reach 95-105°F with humidity control. May need upgrades and permits.', category: 'building', required: false, estimatedDays: 14, feeRange: '$2,000-15,000', links: [] },
      { step: 4, title: 'Studio Setup', description: 'Install flooring (bamboo, cork, or studio-grade vinyl), mirrors, sound system, props storage.', category: 'building', required: true, estimatedDays: 14, feeRange: '$3,000-10,000', links: [] },
      { step: 5, title: 'Instructor Certification', description: 'Yoga Alliance 200-hour certification recommended. Pilates certification from recognized program.', category: 'training', required: false, estimatedDays: 0, feeRange: '$2,000-5,000', links: [] },
      { step: 6, title: 'Insurance', description: 'General liability and professional liability coverage. Many certifications include some coverage.', category: 'business', required: true, estimatedDays: 7, feeRange: '$500-2,000/year', links: [] },
      { step: 7, title: 'Booking System', description: 'Class scheduling software, payment processing, membership management.', category: 'planning', required: true, estimatedDays: 7, feeRange: '$50-200/month', links: [] },
      { step: 8, title: 'Health Warnings', description: 'Post health warnings (especially for hot yoga), have water available, first aid kit on site.', category: 'compliance', required: true, estimatedDays: 1, feeRange: '$100-300', links: [] },
    ],
  },
  {
    businessType: 'swimming_pool',
    checklistName: 'Swimming Pool / Aquatic Center Checklist',
    description: 'Guide to opening a swimming pool or aquatic facility in Cincinnati.',
    totalSteps: 14,
    estimatedDays: 180,
    estimatedCost: '$25,000 - $200,000+',
    items: [
      { step: 1, title: 'Find Appropriate Location', description: 'Zoning must allow pools (CC-M, CC-A, MG). Significant plumbing and structural requirements.', category: 'planning', required: true, estimatedDays: 60, feeRange: null, links: [] },
      { step: 2, title: 'Register Business', description: 'Ohio Secretary of State, EIN, Cincinnati business license.', category: 'business', required: true, estimatedDays: 7, feeRange: '$50-200', links: [] },
      { step: 3, title: 'Submit Pool Plans to ODH', description: 'Submit pool design plans to Ohio Department of Health for review before construction.', category: 'health', required: true, estimatedDays: 45, feeRange: '$250+', links: [] },
      { step: 4, title: 'Building Permits', description: 'Full building permits for pool construction, plumbing, electrical, mechanical.', category: 'building', required: true, estimatedDays: 30, feeRange: '$2,000-10,000', links: [] },
      { step: 5, title: 'Pool Construction', description: 'Build pool to ODH specifications. Includes filtration, chemical systems, deck, safety features.', category: 'building', required: true, estimatedDays: 60, feeRange: '$50,000-500,000+', links: [] },
      { step: 6, title: 'Chemical Storage Room', description: 'Proper ventilated storage for pool chemicals. OSHA compliance for handling.', category: 'building', required: true, estimatedDays: 14, feeRange: '$2,000-10,000', links: [] },
      { step: 7, title: 'Safety Equipment', description: 'Ring buoy, reaching pole, first aid kit, AED, emergency phone, spine board.', category: 'safety', required: true, estimatedDays: 7, feeRange: '$2,000-5,000', links: [] },
      { step: 8, title: 'Certified Pool Operator', description: 'At least one CPO on staff. Complete CPO certification course (2 days).', category: 'training', required: true, estimatedDays: 14, feeRange: '$300-400', links: [] },
      { step: 9, title: 'Lifeguard Certification', description: 'Hire certified lifeguards. Staffing requirements based on pool size and bather load.', category: 'training', required: true, estimatedDays: 21, feeRange: 'Varies', links: [] },
      { step: 10, title: 'ODH Inspection', description: 'Initial inspection by Ohio Department of Health before opening.', category: 'inspection', required: true, estimatedDays: 14, feeRange: null, links: [] },
      { step: 11, title: 'Public Pool License', description: 'Obtain public pool license from Ohio Department of Health.', category: 'license', required: true, estimatedDays: 14, feeRange: '$250+', links: [] },
      { step: 12, title: 'ADA Compliance', description: 'Pool lift or sloped entry, accessible routes, accessible restrooms/changing.', category: 'building', required: true, estimatedDays: 14, feeRange: '$5,000-15,000', links: [] },
      { step: 13, title: 'Post Rules & Signage', description: 'Pool rules, depth markers, no diving signs, emergency procedures, health warnings.', category: 'compliance', required: true, estimatedDays: 3, feeRange: '$500-1,000', links: [] },
      { step: 14, title: 'Insurance', description: 'Aquatic facility insurance, general liability, professional liability. Higher premiums than standard gym.', category: 'business', required: true, estimatedDays: 7, feeRange: '$10,000-30,000/year', links: [] },
    ],
  },
];

async function seedFitnessIndustryData() {
  console.log('Starting Fitness & Wellness data seed...\n');

  const jurisdiction = await prisma.jurisdiction.findFirst({
    where: { name: 'Cincinnati' },
  });

  if (!jurisdiction) {
    console.error('Cincinnati jurisdiction not found! Please run main seed first.');
    process.exit(1);
  }

  console.log(`Found jurisdiction: ${jurisdiction.name}, ${jurisdiction.state}\n`);

  // Seed Permit Requirements
  console.log('Seeding Fitness Permit Requirements...');
  let permitCount = 0;
  for (const permit of FITNESS_PERMIT_REQUIREMENTS) {
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
  console.log(`✓ Seeded ${permitCount} fitness permit requirements\n`);

  // Seed Building Codes
  console.log('Seeding Fitness Building Codes...');
  let codeCount = 0;
  for (const code of FITNESS_BUILDING_CODES) {
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
  console.log(`✓ Seeded ${codeCount} fitness building codes\n`);

  // Seed Common Questions
  console.log('Seeding Fitness Common Questions...');
  let questionCount = 0;
  for (const q of FITNESS_COMMON_QUESTIONS) {
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
  console.log(`✓ Seeded ${questionCount} fitness common questions\n`);

  // Seed Business Checklists
  console.log('Seeding Fitness Business Checklists...');
  let checklistCount = 0;
  for (const checklist of FITNESS_BUSINESS_CHECKLISTS) {
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
  console.log(`✓ Seeded ${checklistCount} fitness business checklists\n`);

  console.log('='.repeat(50));
  console.log('Fitness & Wellness data seed completed!');
  console.log('='.repeat(50));
}

seedFitnessIndustryData()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
