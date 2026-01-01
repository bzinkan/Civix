import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Beauty & Personal Care Permit Requirements
const BEAUTY_PERMIT_REQUIREMENTS = [
  // COSMETOLOGY LICENSES - Ohio State Cosmetology Board
  { activityType: 'cosmetology_salon', category: 'state_license', activityDescription: 'Cosmetology Salon License - Hair salon with full services', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 60.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4713.41' },
  { activityType: 'beauty_salon', category: 'state_license', activityDescription: 'Beauty Salon License - Limited to hair styling (no cutting)', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 45.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4713.41' },
  { activityType: 'barbershop', category: 'state_license', activityDescription: 'Barber Shop License - Traditional barber services', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 60.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4709.07' },
  { activityType: 'nail_salon', category: 'state_license', activityDescription: 'Nail Salon License - Manicure and pedicure services', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 45.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4713.41' },
  { activityType: 'esthetician_salon', category: 'state_license', activityDescription: 'Esthetics Salon License - Skincare and facial services', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 45.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4713.41' },

  // INDIVIDUAL PRACTITIONER LICENSES
  { activityType: 'cosmetologist_license', category: 'individual_license', activityDescription: 'Cosmetologist License - Individual practitioner', zonesRequired: ['*'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: false, ordinanceRef: 'ORC 4713.28' },
  { activityType: 'barber_license', category: 'individual_license', activityDescription: 'Barber License - Individual practitioner', zonesRequired: ['*'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: false, ordinanceRef: 'ORC 4709.02' },
  { activityType: 'manicurist_license', category: 'individual_license', activityDescription: 'Manicurist License - Individual nail technician', zonesRequired: ['*'], zonesProhibited: [], feeBase: 30.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: false, ordinanceRef: 'ORC 4713.28' },
  { activityType: 'esthetician_license', category: 'individual_license', activityDescription: 'Esthetician License - Individual skincare specialist', zonesRequired: ['*'], zonesProhibited: [], feeBase: 30.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: false, ordinanceRef: 'ORC 4713.28' },

  // BODY ART - Hamilton County Health Department
  { activityType: 'tattoo_establishment', category: 'health_license', activityDescription: 'Body Art Establishment License - Tattoo shop', zonesRequired: ['CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C', 'MG'], zonesProhibited: [], feeBase: 300.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3730.03' },
  { activityType: 'tattoo_operator', category: 'individual_license', activityDescription: 'Body Art Operator Permit - Individual tattoo artist', zonesRequired: ['*'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: false, ordinanceRef: 'ORC 3730.04' },
  { activityType: 'piercing_establishment', category: 'health_license', activityDescription: 'Body Piercing Establishment License', zonesRequired: ['CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C', 'MG'], zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3730.03' },
  { activityType: 'permanent_makeup', category: 'health_license', activityDescription: 'Permanent Cosmetics License - Microblading, PMU', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3730.03' },

  // MASSAGE
  { activityType: 'massage_establishment', category: 'state_license', activityDescription: 'Massage Establishment License', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4731.15' },
  { activityType: 'massage_therapist', category: 'individual_license', activityDescription: 'Licensed Massage Therapist (LMT)', zonesRequired: ['*'], zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 30, requiresPlans: false, requiresInspection: false, ordinanceRef: 'ORC 4731.04' },

  // SPA SERVICES
  { activityType: 'spa_facility', category: 'license', activityDescription: 'Day Spa Facility License - Full service spa', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 150.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'CMC 857' },
  { activityType: 'tanning_facility', category: 'license', activityDescription: 'Tanning Facility Registration', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: true, ordinanceRef: 'ORC 4713.82' },

  // MOBILE SERVICES
  { activityType: 'mobile_salon', category: 'state_license', activityDescription: 'Mobile Salon License - At-home beauty services', zonesRequired: ['*'], zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4713.41' },
];

// Beauty Business Building Code Chunks
const BEAUTY_BUILDING_CODES = [
  // SALON REQUIREMENTS
  { codeType: 'OAC', section: '4713-5-01', title: 'Salon Physical Requirements', content: 'Salons must have: minimum 125 sq ft for first station plus 50 sq ft for each additional station, adequate lighting (50 foot-candles), ventilation, hot and cold running water, and separate restroom facilities.' },
  { codeType: 'OAC', section: '4713-5-02', title: 'Sanitation Requirements', content: 'All tools must be sanitized between clients using EPA-registered disinfectant. Implements must be stored in closed containers. Single-use items (neck strips, cotton) disposed after each use. Towels laundered between uses.' },
  { codeType: 'OAC', section: '4713-5-03', title: 'Salon Equipment', content: 'Each workstation requires: styling chair, mirror, adequate lighting, storage for clean tools, covered container for used tools. Shampoo station required for hair services. Pedicure chairs must have disposable liners.' },

  // BARBERSHOP REQUIREMENTS
  { codeType: 'OAC', section: '4709-5-01', title: 'Barbershop Requirements', content: 'Barbershops must have: minimum 100 sq ft per chair, sterilization equipment, clean linen supply, waste containers, hot and cold running water at each station, and separate restroom.' },
  { codeType: 'OAC', section: '4709-5-02', title: 'Barber Tools Sanitation', content: 'Razors and clippers must be sanitized between clients. Styptic pencils prohibited - use individual powder/liquid. Neck dusters must be sanitized. Hot lather machines maintained at 160°F minimum.' },

  // BODY ART REQUIREMENTS
  { codeType: 'OAC', section: '3730-1-01', title: 'Body Art Establishment Standards', content: 'Tattoo/piercing establishments must have: separate procedure room(s) with nonporous floors/walls, autoclave for sterilization, handwashing sink in each procedure room, separate clean and dirty areas, and sharps disposal containers.' },
  { codeType: 'OAC', section: '3730-1-02', title: 'Sterilization Requirements', content: 'All reusable equipment must be sterilized in autoclave. Spore testing required monthly. Single-use needles mandatory - never reuse. Ink caps single-use. Gloves changed between clients and during procedure if contaminated.' },
  { codeType: 'OAC', section: '3730-1-03', title: 'Body Art Training', content: 'All operators must complete bloodborne pathogen training (OSHA standard). First aid and CPR certification recommended. Apprenticeship or training program required before licensure.' },

  // NAIL SALON REQUIREMENTS
  { codeType: 'OAC', section: '4713-5-05', title: 'Nail Salon Ventilation', content: 'Nail salons must have adequate ventilation to remove fumes from acrylics, polish, and removers. Air exchange rate of 25 CFM per station recommended. Local exhaust ventilation at each workstation strongly recommended.' },
  { codeType: 'OAC', section: '4713-5-06', title: 'Pedicure Sanitation', content: 'Pedicure basins must be cleaned and disinfected between each client. Whirlpool jets must be flushed with disinfectant for 10 minutes after each use. Disposable liners recommended. Monthly microbial testing available.' },

  // MASSAGE REQUIREMENTS
  { codeType: 'OAC', section: '4731-1-05', title: 'Massage Establishment Requirements', content: 'Massage establishments must have: clean linens for each client, proper sanitation, adequate lighting and ventilation, private treatment rooms with doors, and posted license. Licensed massage therapist on premises during operation.' },
  { codeType: 'OAC', section: '4731-1-06', title: 'Massage Therapist Standards', content: 'LMTs must complete 750 hours of training from approved school, pass MBLEx exam, and maintain CPR certification. 24 hours continuing education required every 2 years for renewal.' },

  // GENERAL BUILDING CODE
  { codeType: 'OBC', section: '2902.1', title: 'Restroom Requirements - Beauty', content: 'Beauty establishments: 1 restroom for 1-15 occupants, 2 for 16-35. Employee and customer restrooms may be combined for small establishments. ADA accessible restroom required.' },
  { codeType: 'local', section: '857.10', title: 'Beauty Business Zoning', content: 'Salons and spas permitted in commercial zones. Tattoo shops often restricted - must be 500ft from schools, churches in some areas. Home-based salon may require home occupation permit and has client limits.' },
];

// Beauty Business Common Questions
const BEAUTY_COMMON_QUESTIONS = [
  { question: 'What license do I need to open a hair salon?', category: 'salon', answer: 'You need an Ohio Cosmetology Salon License ($60) from the State Cosmetology Board. All stylists must have individual cosmetologist licenses. You\'ll also need a Cincinnati business license. The space must be inspected - minimum 125 sq ft for first station plus 50 sq ft for each additional.', relatedPermits: ['cosmetology_salon', 'cosmetologist_license'], ordinanceRef: 'ORC 4713.41' },

  { question: 'How do I open a barbershop?', category: 'barber', answer: 'You need an Ohio Barber Shop License ($60) from the State Barber Board. All barbers must hold individual barber licenses. Shop must have minimum 100 sq ft per chair, hot/cold water at each station, sterilization equipment. City business license required. Zoning verification for location.', relatedPermits: ['barbershop', 'barber_license'], ordinanceRef: 'ORC 4709.07' },

  { question: 'What permits do I need for a tattoo shop?', category: 'tattoo', answer: 'Tattoo shops require: Body Art Establishment License from Hamilton County Health Dept ($300/year), individual Body Art Operator Permits for each artist ($50/year), city business license. Must pass health inspection - autoclave required. Zoning restrictions apply - check distance from schools/churches.', relatedPermits: ['tattoo_establishment', 'tattoo_operator'], ordinanceRef: 'ORC 3730.03' },

  { question: 'Can I do hair/nails from my home?', category: 'home_business', answer: 'Yes, with restrictions. You need: salon license from state board, home occupation permit from city, and compliance with residential zoning. Limits typically include: max 1-2 clients at a time, no employees, no signage, adequate parking. Space must meet state board requirements.', relatedPermits: ['cosmetology_salon', 'mobile_salon'], ordinanceRef: 'CMC 1413' },

  { question: 'What do I need to open a nail salon?', category: 'nail', answer: 'Ohio Nail Salon License ($45) plus individual manicurist licenses for all technicians. Critical requirements: proper ventilation for fumes, pedicure sanitation protocols, EPA-registered disinfectants. City business license. OSHA compliance for chemical handling recommended.', relatedPermits: ['nail_salon', 'manicurist_license'], ordinanceRef: 'ORC 4713.41' },

  { question: 'How do I become a licensed massage therapist?', category: 'massage', answer: 'Complete 750 hours at Ohio-approved massage school, pass the MBLEx exam, apply to State Medical Board for LMT license ($100). If opening establishment, need Massage Establishment License. Maintain CPR certification. 24 CE hours every 2 years for renewal.', relatedPermits: ['massage_therapist', 'massage_establishment'], ordinanceRef: 'ORC 4731.04' },

  { question: 'What health inspections are required for beauty businesses?', category: 'inspection', answer: 'Hair/nail salons: State Cosmetology Board inspection before opening and random inspections. Tattoo/piercing: Hamilton County Health Dept annual inspection. Massage: State Medical Board inspection. All must maintain sanitation logs and have proper licenses posted.', relatedPermits: ['cosmetology_salon', 'tattoo_establishment'], ordinanceRef: 'ORC 4713' },

  { question: 'Can I offer microblading or permanent makeup?', category: 'permanent_makeup', answer: 'Permanent makeup (including microblading) is classified as body art in Ohio. You need: Body Art Establishment License if working independently, Body Art Operator Permit, bloodborne pathogen training. Some estheticians add this service - requires additional training and licensing.', relatedPermits: ['permanent_makeup', 'tattoo_operator'], ordinanceRef: 'ORC 3730' },

  { question: 'What ventilation is required for a nail salon?', category: 'ventilation', answer: 'While not specified in sq ft, OSHA recommends 25 CFM per station. Local exhaust ventilation (vent at each table) strongly recommended. Many salons use downdraft tables. Good ventilation protects workers from acrylic and polish fumes. May need HVAC permit for installation.', relatedPermits: ['nail_salon'], ordinanceRef: 'OAC 4713-5-05' },

  { question: 'Do I need special training to open a spa?', category: 'spa', answer: 'Depends on services offered. Hair/nails: cosmetology license. Massage: LMT license. Esthetics: esthetician license. Each service requires appropriately licensed staff. Spa owner doesn\'t need all licenses but must employ licensed practitioners. Combined establishments need multiple salon licenses.', relatedPermits: ['spa_facility', 'cosmetology_salon', 'massage_establishment'], ordinanceRef: 'ORC 4713' },
];

// Beauty Business Checklists
const BEAUTY_BUSINESS_CHECKLISTS = [
  {
    businessType: 'hair_salon',
    checklistName: 'Hair Salon Opening Checklist',
    description: 'Complete guide to opening a hair salon in Cincinnati.',
    totalSteps: 10,
    estimatedDays: 60,
    estimatedCost: '$1,000 - $5,000',
    items: [
      { step: 1, title: 'Find a Location', description: 'Identify location in commercial zone (CN, CC, DD). Verify zoning allows salon use. Ensure 125 sq ft minimum for first station.', category: 'planning', required: true, estimatedDays: 30, feeRange: null, links: [] },
      { step: 2, title: 'Register Your Business', description: 'Register with Ohio Secretary of State, obtain EIN, register for Cincinnati business license ($50).', category: 'business', required: true, estimatedDays: 7, feeRange: '$50-200', links: [] },
      { step: 3, title: 'Apply for Salon License', description: 'Submit application to Ohio State Cosmetology Board with floor plan showing stations, sinks, and equipment.', category: 'license', required: true, estimatedDays: 21, feeRange: '$60', links: [] },
      { step: 4, title: 'Verify Stylist Licenses', description: 'Ensure all stylists have current Ohio cosmetology licenses. Post copies in salon.', category: 'license', required: true, estimatedDays: 7, feeRange: '$50/stylist', links: [] },
      { step: 5, title: 'Set Up Stations', description: 'Install styling chairs, mirrors, shampoo bowls. Each station needs adequate lighting, storage for clean/dirty tools.', category: 'equipment', required: true, estimatedDays: 14, feeRange: '$2,000-10,000', links: [] },
      { step: 6, title: 'Sanitation Setup', description: 'Purchase EPA-registered disinfectants, UV sanitizers, clean/dirty tool containers, disposable supplies.', category: 'compliance', required: true, estimatedDays: 3, feeRange: '$200-500', links: [] },
      { step: 7, title: 'Building Compliance', description: 'Ensure adequate restrooms, ADA accessibility, proper plumbing for shampoo bowls.', category: 'building', required: true, estimatedDays: 14, feeRange: 'Varies', links: [] },
      { step: 8, title: 'State Board Inspection', description: 'Schedule and pass inspection from Ohio State Cosmetology Board.', category: 'inspection', required: true, estimatedDays: 7, feeRange: null, links: [] },
      { step: 9, title: 'Obtain Insurance', description: 'Get general liability and professional liability insurance. Required by most landlords.', category: 'business', required: true, estimatedDays: 7, feeRange: '$500-1,500/year', links: [] },
      { step: 10, title: 'Post Required Signage', description: 'Post salon license, individual licenses, and price list in visible location.', category: 'compliance', required: true, estimatedDays: 1, feeRange: null, links: [] },
    ],
  },
  {
    businessType: 'tattoo_shop',
    checklistName: 'Tattoo Shop Opening Checklist',
    description: 'Guide to opening a tattoo and body art studio in Cincinnati.',
    totalSteps: 12,
    estimatedDays: 90,
    estimatedCost: '$3,000 - $15,000',
    items: [
      { step: 1, title: 'Find a Location', description: 'Location must be in appropriate commercial zone. Check 500ft distance from schools and churches. Verify with zoning office.', category: 'planning', required: true, estimatedDays: 45, feeRange: null, links: [] },
      { step: 2, title: 'Register Your Business', description: 'Ohio Secretary of State, EIN, Cincinnati business license.', category: 'business', required: true, estimatedDays: 7, feeRange: '$50-200', links: [] },
      { step: 3, title: 'Apply for Body Art Establishment License', description: 'Submit application to Hamilton County Health Department with floor plan and equipment list.', category: 'health', required: true, estimatedDays: 30, feeRange: '$300', links: [] },
      { step: 4, title: 'Design Procedure Room(s)', description: 'Rooms need nonporous floors and walls (tile, sealed concrete), handwashing sink, proper lighting, separate clean/dirty areas.', category: 'building', required: true, estimatedDays: 21, feeRange: '$2,000-10,000', links: [] },
      { step: 5, title: 'Purchase Autoclave', description: 'FDA-cleared autoclave required for sterilizing reusable equipment. Set up spore testing protocol.', category: 'equipment', required: true, estimatedDays: 7, feeRange: '$1,000-3,000', links: [] },
      { step: 6, title: 'Bloodborne Pathogen Training', description: 'All artists must complete OSHA bloodborne pathogen training. Certificates posted.', category: 'training', required: true, estimatedDays: 7, feeRange: '$50-100/person', links: [] },
      { step: 7, title: 'Artist Permits', description: 'Each tattoo artist needs individual Body Art Operator Permit from Health Department.', category: 'license', required: true, estimatedDays: 14, feeRange: '$50/artist', links: [] },
      { step: 8, title: 'Sharps Disposal Contract', description: 'Contract with medical waste company for sharps and biohazard disposal.', category: 'compliance', required: true, estimatedDays: 7, feeRange: '$50-100/month', links: [] },
      { step: 9, title: 'Set Up Supplies', description: 'Single-use needles, ink caps, gloves, barrier film, approved inks, aftercare supplies.', category: 'equipment', required: true, estimatedDays: 7, feeRange: '$1,000-3,000', links: [] },
      { step: 10, title: 'Health Department Inspection', description: 'Pass initial Health Department inspection before opening.', category: 'inspection', required: true, estimatedDays: 14, feeRange: null, links: [] },
      { step: 11, title: 'Age Verification System', description: 'Set up ID checking process. Ohio requires 18+ for tattoos without parent consent.', category: 'compliance', required: true, estimatedDays: 1, feeRange: null, links: [] },
      { step: 12, title: 'Liability Insurance', description: 'Professional liability insurance essential for body art businesses.', category: 'business', required: true, estimatedDays: 7, feeRange: '$1,000-3,000/year', links: [] },
    ],
  },
  {
    businessType: 'nail_salon',
    checklistName: 'Nail Salon Opening Checklist',
    description: 'Guide to opening a nail salon in Cincinnati.',
    totalSteps: 10,
    estimatedDays: 45,
    estimatedCost: '$1,500 - $8,000',
    items: [
      { step: 1, title: 'Find a Location', description: 'Commercial zone required. Consider ventilation needs - avoid basement locations. First floor preferred for client accessibility.', category: 'planning', required: true, estimatedDays: 30, feeRange: null, links: [] },
      { step: 2, title: 'Register Your Business', description: 'Ohio Secretary of State, EIN, Cincinnati business license.', category: 'business', required: true, estimatedDays: 7, feeRange: '$50-200', links: [] },
      { step: 3, title: 'Apply for Nail Salon License', description: 'Submit application to Ohio State Cosmetology Board with floor plan.', category: 'license', required: true, estimatedDays: 21, feeRange: '$45', links: [] },
      { step: 4, title: 'Install Ventilation System', description: 'Adequate ventilation critical for nail salons. Consider downdraft tables and HVAC upgrades. May need permit.', category: 'building', required: true, estimatedDays: 14, feeRange: '$500-5,000', links: [] },
      { step: 5, title: 'Set Up Pedicure Stations', description: 'Pedicure chairs with plumbed basins. Establish cleaning and disinfection protocol. Consider disposable liners.', category: 'equipment', required: true, estimatedDays: 7, feeRange: '$1,000-5,000/chair', links: [] },
      { step: 6, title: 'Verify Technician Licenses', description: 'All nail technicians need Ohio manicurist licenses.', category: 'license', required: true, estimatedDays: 7, feeRange: '$30/tech', links: [] },
      { step: 7, title: 'Sanitation Supplies', description: 'EPA-registered disinfectants, hospital-grade for pedicure basins, disposable files/buffers, clean tool storage.', category: 'compliance', required: true, estimatedDays: 3, feeRange: '$200-400', links: [] },
      { step: 8, title: 'State Board Inspection', description: 'Pass Ohio Cosmetology Board inspection. Focus on ventilation and sanitation.', category: 'inspection', required: true, estimatedDays: 7, feeRange: null, links: [] },
      { step: 9, title: 'Chemical Safety', description: 'OSHA compliance for chemical handling. SDS sheets available. Proper storage for flammables.', category: 'compliance', required: true, estimatedDays: 3, feeRange: null, links: [] },
      { step: 10, title: 'Insurance', description: 'General and professional liability insurance.', category: 'business', required: true, estimatedDays: 7, feeRange: '$500-1,500/year', links: [] },
    ],
  },
];

async function seedBeautyIndustryData() {
  console.log('Starting Beauty & Personal Care data seed...\n');

  const jurisdiction = await prisma.jurisdiction.findFirst({
    where: { name: 'Cincinnati' },
  });

  if (!jurisdiction) {
    console.error('Cincinnati jurisdiction not found! Please run main seed first.');
    process.exit(1);
  }

  console.log(`Found jurisdiction: ${jurisdiction.name}, ${jurisdiction.state}\n`);

  // Seed Permit Requirements
  console.log('Seeding Beauty Permit Requirements...');
  let permitCount = 0;
  for (const permit of BEAUTY_PERMIT_REQUIREMENTS) {
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
  console.log(`✓ Seeded ${permitCount} beauty permit requirements\n`);

  // Seed Building Codes
  console.log('Seeding Beauty Building Codes...');
  let codeCount = 0;
  for (const code of BEAUTY_BUILDING_CODES) {
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
  console.log(`✓ Seeded ${codeCount} beauty building codes\n`);

  // Seed Common Questions
  console.log('Seeding Beauty Common Questions...');
  let questionCount = 0;
  for (const q of BEAUTY_COMMON_QUESTIONS) {
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
  console.log(`✓ Seeded ${questionCount} beauty common questions\n`);

  // Seed Business Checklists
  console.log('Seeding Beauty Business Checklists...');
  let checklistCount = 0;
  for (const checklist of BEAUTY_BUSINESS_CHECKLISTS) {
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
  console.log(`✓ Seeded ${checklistCount} beauty business checklists\n`);

  console.log('='.repeat(50));
  console.log('Beauty & Personal Care data seed completed!');
  console.log('='.repeat(50));
}

seedBeautyIndustryData()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
