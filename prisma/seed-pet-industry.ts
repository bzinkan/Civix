import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Pet Industry Permit Requirements
const PET_PERMIT_REQUIREMENTS = [
  // KENNEL LICENSES - Ohio Department of Agriculture
  { activityType: 'dog_kennel_license', category: 'state_license', activityDescription: 'Dog Kennel License - Required for 5+ dogs', zonesRequired: ['MG', 'ML', 'CC-A'], zonesProhibited: ['SF-4', 'SF-6', 'SF-10', 'SF-20', 'RM-1.2', 'RM-2'], feeBase: 75.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 955.08' },
  { activityType: 'high_volume_breeder', category: 'state_license', activityDescription: 'High Volume Breeder License - 9+ breeding dogs', zonesRequired: ['MG', 'ML'], zonesProhibited: ['SF-4', 'SF-6', 'SF-10', 'SF-20', 'RM-1.2', 'RM-2', 'CN-P', 'CN-M'], feeBase: 500.00, feePerSqft: null, processingDays: 45, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 956.04' },
  { activityType: 'animal_rescue', category: 'state_license', activityDescription: 'Animal Rescue License', zonesRequired: ['*'], zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 30, requiresPlans: false, requiresInspection: true, ordinanceRef: 'ORC 956.06' },

  // PET BOARDING & DAYCARE
  { activityType: 'pet_boarding', category: 'license', activityDescription: 'Pet Boarding Facility License', zonesRequired: ['MG', 'ML', 'CC-A', 'CC-M'], zonesProhibited: ['SF-4', 'SF-6', 'SF-10', 'SF-20', 'RM-1.2', 'RM-2'], feeBase: 200.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'CMC 857' },
  { activityType: 'pet_daycare', category: 'license', activityDescription: 'Pet Daycare Facility License', zonesRequired: ['MG', 'ML', 'CC-A', 'CC-M'], zonesProhibited: ['SF-4', 'SF-6', 'SF-10', 'SF-20', 'RM-1.2', 'RM-2'], feeBase: 150.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'CMC 857' },

  // PET GROOMING
  { activityType: 'pet_grooming', category: 'license', activityDescription: 'Pet Grooming Establishment', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: false, ordinanceRef: 'CMC 857' },
  { activityType: 'mobile_pet_grooming', category: 'license', activityDescription: 'Mobile Pet Grooming License', zonesRequired: ['*'], zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'CMC 857' },

  // VETERINARY
  { activityType: 'veterinary_clinic', category: 'state_license', activityDescription: 'Veterinary Clinic License', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C', 'MG'], zonesProhibited: [], feeBase: 250.00, feePerSqft: null, processingDays: 45, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4741.18' },
  { activityType: 'veterinary_hospital', category: 'state_license', activityDescription: 'Veterinary Hospital License - Overnight care', zonesRequired: ['CC-M', 'CC-A', 'MG', 'ML'], zonesProhibited: [], feeBase: 400.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4741.18' },
  { activityType: 'veterinarian_license', category: 'individual_license', activityDescription: 'Veterinarian License', zonesRequired: ['*'], zonesProhibited: [], feeBase: 175.00, feePerSqft: null, processingDays: 30, requiresPlans: false, requiresInspection: false, ordinanceRef: 'ORC 4741.04' },
  { activityType: 'vet_tech_license', category: 'individual_license', activityDescription: 'Registered Veterinary Technician', zonesRequired: ['*'], zonesProhibited: [], feeBase: 60.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: false, ordinanceRef: 'ORC 4741.06' },

  // PET RETAIL
  { activityType: 'pet_store', category: 'license', activityDescription: 'Pet Store License - Retail sales', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 100.00, feePerSqft: null, processingDays: 21, requiresPlans: false, requiresInspection: true, ordinanceRef: 'CMC 857' },
  { activityType: 'pet_store_animals', category: 'license', activityDescription: 'Pet Store with Live Animal Sales', zonesRequired: ['CC-P', 'CC-M', 'CC-A'], zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 956.04' },

  // PET SERVICES
  { activityType: 'pet_sitting', category: 'license', activityDescription: 'Pet Sitting Service (in-home)', zonesRequired: ['*'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 7, requiresPlans: false, requiresInspection: false, ordinanceRef: 'CMC 857' },
  { activityType: 'dog_training', category: 'license', activityDescription: 'Dog Training Facility', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'MG', 'ML'], zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: false, ordinanceRef: 'CMC 857' },
  { activityType: 'dog_walking', category: 'license', activityDescription: 'Dog Walking Service', zonesRequired: ['*'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 7, requiresPlans: false, requiresInspection: false, ordinanceRef: 'CMC 857' },
];

// Pet Industry Building Code Chunks
const PET_BUILDING_CODES = [
  // KENNEL REQUIREMENTS
  { codeType: 'OAC', section: '901:1-7-01', title: 'Dog Kennel Standards', content: 'Kennels must provide: minimum 12 sq ft per dog (small), 20 sq ft (medium), 30 sq ft (large), plus outdoor exercise area of equal size. Indoor/outdoor access required. Climate control maintaining 50-80°F. Non-porous, sanitizable flooring.' },
  { codeType: 'OAC', section: '901:1-7-02', title: 'Kennel Sanitation', content: 'Kennels must be cleaned and sanitized daily. Waste removed at least twice daily. Water and food bowls sanitized daily. Adequate ventilation - 10-20 air changes per hour. Separate isolation area for sick animals.' },
  { codeType: 'OAC', section: '956.03', title: 'High Volume Breeder Requirements', content: 'Breeders with 9+ breeding dogs must: register with ODA, maintain health records, provide veterinary care, meet housing standards, allow inspections. Annual reporting required.' },

  // BOARDING FACILITY REQUIREMENTS
  { codeType: 'local', section: '857.20', title: 'Pet Boarding Facility Standards', content: 'Boarding facilities must have: separate areas for dogs and cats, proper ventilation and climate control, fire suppression system, emergency evacuation plan, 24-hour supervision or monitoring system, and veterinary relationship.' },
  { codeType: 'local', section: '857.21', title: 'Boarding Noise Control', content: 'Pet boarding facilities must implement noise control measures: sound-dampening construction, buffer zones from residential, operating hours restrictions may apply. Noise at property line not to exceed 65dB.' },

  // GROOMING REQUIREMENTS
  { codeType: 'local', section: '857.22', title: 'Pet Grooming Standards', content: 'Grooming facilities must have: adequate drainage, non-slip flooring, proper ventilation for dryers, sanitation protocols for tools, separate drying area. No state license required for groomers but certification recommended.' },
  { codeType: 'local', section: '857.23', title: 'Mobile Grooming Requirements', content: 'Mobile grooming vans must have: potable water supply, wastewater containment, proper ventilation, non-slip surfaces, secured equipment. Waste must be disposed at approved facility.' },

  // VETERINARY REQUIREMENTS
  { codeType: 'OAC', section: '4741-1-01', title: 'Veterinary Premises Requirements', content: 'Veterinary clinics must have: exam room(s), surgical suite (if performing surgery), pharmacy area, diagnostic equipment, separate areas for sick/contagious animals, proper medical waste disposal. Overnight hospitals need 24-hour staffing.' },
  { codeType: 'OAC', section: '4741-1-02', title: 'Veterinary Medical Waste', content: 'Veterinary facilities must contract with licensed medical waste hauler. Sharps in approved containers. Deceased animals stored in refrigeration pending pickup. Controlled substance storage per DEA requirements.' },
  { codeType: 'OAC', section: '4741-1-03', title: 'Veterinary Supervision', content: 'Licensed veterinarian must be on premises during all medical procedures. Veterinary technicians may perform delegated tasks under supervision. All staff must be properly trained.' },

  // PET STORE REQUIREMENTS
  { codeType: 'local', section: '857.24', title: 'Pet Store Animal Housing', content: 'Pet stores selling animals must: maintain clean, appropriately sized enclosures; provide proper food and water; have veterinary relationship; isolate sick animals; maintain health records. Exotic animals may require additional permits.' },
  { codeType: 'ORC', section: '956.18', title: 'Pet Store Sales Restrictions', content: 'Pet stores may not sell dogs or cats from high volume breeders who have violations. Must disclose breeder information to purchasers. Recommended to partner with rescues.' },

  // ZONING
  { codeType: 'local', section: '1419.50', title: 'Pet Business Zoning', content: 'Kennels and boarding facilities typically restricted to industrial/commercial zones due to noise and odor. Groomers allowed in most commercial zones. Vet clinics allowed in most commercial and some neighborhood zones. Home-based pet sitting usually permitted.' },
];

// Pet Industry Common Questions
const PET_COMMON_QUESTIONS = [
  { question: 'What license do I need to open a pet boarding facility?', category: 'boarding', answer: 'You need: Ohio Dog Kennel License from ODA if housing 5+ dogs ($75+), city business license ($50), zoning approval (kennels typically restricted to industrial zones due to noise), and building permit for any construction. Hamilton County Health may inspect. Fire suppression may be required.', relatedPermits: ['dog_kennel_license', 'pet_boarding'], ordinanceRef: 'ORC 955.08' },

  { question: 'Do I need a license to groom pets?', category: 'grooming', answer: 'Ohio doesn\'t require a state license for pet groomers - no mandatory certification or education. You need a city business license ($50). Professional certification (NDGAA, IPG) is voluntary but recommended. Storefront needs zoning approval. Mobile grooming needs vehicle inspection and waste disposal plan.', relatedPermits: ['pet_grooming', 'mobile_pet_grooming'], ordinanceRef: 'CMC 857' },

  { question: 'How do I open a veterinary clinic?', category: 'veterinary', answer: 'Requirements: Licensed veterinarian as owner or medical director, Ohio Veterinary Medical License Board approval, facility must meet premises standards (exam rooms, surgery if applicable, pharmacy). Building permits for buildout, medical waste contract, DEA registration for controlled substances. Business license from city.', relatedPermits: ['veterinary_clinic', 'veterinarian_license'], ordinanceRef: 'ORC 4741.18' },

  { question: 'Can I run a pet sitting business from home?', category: 'pet_sitting', answer: 'Yes, in-home pet sitting usually requires only a city business license ($50). If clients drop off pets at your home, check zoning - may need home occupation permit. If you board more than 6 dogs, you need an Ohio kennel license. Keep neighbor relations in mind - noise complaints can cause issues.', relatedPermits: ['pet_sitting'], ordinanceRef: 'CMC 857' },

  { question: 'What zones allow pet boarding kennels?', category: 'zoning', answer: 'Kennels are typically restricted to industrial (MG, ML) and auto-oriented commercial (CC-A) zones due to noise and odor concerns. NOT allowed in residential or neighborhood commercial zones. Some areas may allow with conditional use permit. Always verify with zoning office before signing lease.', relatedPermits: ['dog_kennel_license', 'pet_boarding'], ordinanceRef: 'CMC 1419.50' },

  { question: 'Do I need a license for dog walking or dog training?', category: 'training', answer: 'Dog walking requires only a city business license ($50). No special permit needed. Dog training at a fixed location also just needs business license plus appropriate zoning. If training involves boarding or daycare, additional licensing applies. Insurance strongly recommended for both.', relatedPermits: ['dog_training', 'dog_walking'], ordinanceRef: 'CMC 857' },

  { question: 'What are the requirements for a mobile pet grooming van?', category: 'mobile_grooming', answer: 'Mobile grooming needs: city business license, vehicle registration and commercial insurance, potable water system, wastewater containment (cannot dump in storm drains), proper ventilation, fire extinguisher. Some areas restrict parking of commercial vehicles in residential areas. Check where you can operate.', relatedPermits: ['mobile_pet_grooming'], ordinanceRef: 'CMC 857.23' },

  { question: 'Can I sell puppies or kittens from my home?', category: 'breeding', answer: 'Occasional sales of your own pets typically don\'t require a license. However, breeding operations with 9+ adult dogs require a High Volume Breeder License from Ohio Department of Agriculture ($500+). All breeders must meet animal welfare standards. Check local zoning - breeding may not be allowed in residential zones.', relatedPermits: ['high_volume_breeder', 'dog_kennel_license'], ordinanceRef: 'ORC 956.04' },

  { question: 'What permits do I need for a pet store?', category: 'pet_store', answer: 'Basic pet supply store: city business license. If selling live animals: additional permits and inspections required, must disclose breeder sources, cannot buy from breeders with violations. Exotic animals may need USDA license. Fish-only stores have fewer requirements than those selling mammals or birds.', relatedPermits: ['pet_store', 'pet_store_animals'], ordinanceRef: 'ORC 956.18' },

  { question: 'What insurance do I need for a pet business?', category: 'insurance', answer: 'Recommended coverage: General liability (protects against customer injuries), professional liability (protects against claims of animal harm), care/custody/control (covers animals in your care), commercial auto (for mobile services). Most landlords require proof of insurance. Bonding may be required for in-home services.', relatedPermits: [], ordinanceRef: null },
];

// Pet Industry Business Checklists
const PET_BUSINESS_CHECKLISTS = [
  {
    businessType: 'pet_boarding',
    checklistName: 'Pet Boarding Facility Checklist',
    description: 'Complete guide to opening a pet boarding or kennel facility in Cincinnati.',
    totalSteps: 12,
    estimatedDays: 120,
    estimatedCost: '$5,000 - $25,000',
    items: [
      { step: 1, title: 'Find Appropriate Location', description: 'Must be in industrial or commercial zone (MG, ML, CC-A). Verify with zoning office. Consider noise buffer from residential. Adequate outdoor space required.', category: 'planning', required: true, estimatedDays: 45, feeRange: null, links: [] },
      { step: 2, title: 'Zoning Verification', description: 'Get written confirmation from zoning department that pet boarding is permitted at your location.', category: 'zoning', required: true, estimatedDays: 14, feeRange: null, links: [] },
      { step: 3, title: 'Register Business', description: 'Ohio Secretary of State registration, EIN from IRS, Cincinnati business license.', category: 'business', required: true, estimatedDays: 7, feeRange: '$50-200', links: [] },
      { step: 4, title: 'Apply for Dog Kennel License', description: 'Apply to Ohio Department of Agriculture if housing 5+ dogs. Inspection required.', category: 'license', required: true, estimatedDays: 30, feeRange: '$75-150', links: [] },
      { step: 5, title: 'Building Permits', description: 'Apply for building permits for any construction: kennels, fencing, drainage, HVAC.', category: 'building', required: true, estimatedDays: 30, feeRange: '$500-5,000', links: [] },
      { step: 6, title: 'Install Facility', description: 'Build kennels meeting size requirements. Non-porous flooring, proper drainage, climate control, indoor/outdoor runs.', category: 'building', required: true, estimatedDays: 30, feeRange: '$10,000-50,000', links: [] },
      { step: 7, title: 'Fire Safety', description: 'Install fire suppression if required. Smoke detectors. Emergency evacuation plan posted.', category: 'fire', required: true, estimatedDays: 14, feeRange: '$2,000-10,000', links: [] },
      { step: 8, title: 'Establish Veterinary Relationship', description: 'Contract with local vet for emergency care and health consultations.', category: 'planning', required: true, estimatedDays: 7, feeRange: null, links: [] },
      { step: 9, title: 'Create Policies', description: 'Vaccination requirements, liability waivers, emergency contacts, feeding schedules, medication policies.', category: 'compliance', required: true, estimatedDays: 7, feeRange: null, links: [] },
      { step: 10, title: 'ODA Inspection', description: 'Pass Ohio Department of Agriculture kennel inspection.', category: 'inspection', required: true, estimatedDays: 14, feeRange: null, links: [] },
      { step: 11, title: 'Obtain Insurance', description: 'General liability, professional liability, care/custody/control coverage essential.', category: 'business', required: true, estimatedDays: 7, feeRange: '$2,000-5,000/year', links: [] },
      { step: 12, title: 'Staff Training', description: 'Train staff on animal handling, emergency procedures, sanitation protocols, customer service.', category: 'training', required: true, estimatedDays: 7, feeRange: 'Varies', links: [] },
    ],
  },
  {
    businessType: 'pet_grooming',
    checklistName: 'Pet Grooming Business Checklist',
    description: 'Guide to opening a pet grooming salon or mobile grooming service.',
    totalSteps: 8,
    estimatedDays: 45,
    estimatedCost: '$1,000 - $10,000',
    items: [
      { step: 1, title: 'Choose Business Model', description: 'Storefront salon, mobile grooming van, or both. Each has different requirements and startup costs.', category: 'planning', required: true, estimatedDays: 7, feeRange: null, links: [] },
      { step: 2, title: 'Find Location (Storefront)', description: 'Commercial zone location with proper drainage and ventilation. Ground floor preferred for accessibility.', category: 'planning', required: false, estimatedDays: 30, feeRange: null, links: [] },
      { step: 3, title: 'Register Business', description: 'Ohio Secretary of State, EIN, Cincinnati business license.', category: 'business', required: true, estimatedDays: 7, feeRange: '$50-200', links: [] },
      { step: 4, title: 'Get Professional Certification', description: 'Optional but highly recommended. NDGAA, IPG, or similar programs. Helps with credibility and insurance.', category: 'training', required: false, estimatedDays: 30, feeRange: '$500-2,000', links: [] },
      { step: 5, title: 'Set Up Facility/Vehicle', description: 'Install grooming tables, tubs, dryers, proper drainage. Mobile: water tanks, ventilation, generators.', category: 'equipment', required: true, estimatedDays: 14, feeRange: '$5,000-30,000', links: [] },
      { step: 6, title: 'Purchase Equipment', description: 'Clippers, blades, shears, brushes, shampoos, dryers, sanitation supplies.', category: 'equipment', required: true, estimatedDays: 7, feeRange: '$1,000-5,000', links: [] },
      { step: 7, title: 'Obtain Insurance', description: 'General liability and care/custody/control coverage. Commercial auto for mobile services.', category: 'business', required: true, estimatedDays: 7, feeRange: '$500-2,000/year', links: [] },
      { step: 8, title: 'Create Booking System', description: 'Set up scheduling, intake forms, service menus, payment processing.', category: 'planning', required: true, estimatedDays: 7, feeRange: '$0-200/month', links: [] },
    ],
  },
  {
    businessType: 'vet_clinic',
    checklistName: 'Veterinary Clinic Checklist',
    description: 'Guide to opening a veterinary clinic in Cincinnati.',
    totalSteps: 14,
    estimatedDays: 180,
    estimatedCost: '$20,000 - $100,000+',
    items: [
      { step: 1, title: 'Verify Veterinary License', description: 'Ensure all veterinarians have current Ohio veterinary license. Apply if needed.', category: 'license', required: true, estimatedDays: 30, feeRange: '$175', links: [] },
      { step: 2, title: 'Find Location', description: 'Commercial zone location with adequate space for exam rooms, surgery, pharmacy, kennel area.', category: 'planning', required: true, estimatedDays: 60, feeRange: null, links: [] },
      { step: 3, title: 'Register Business', description: 'Ohio Secretary of State, EIN, Cincinnati business license.', category: 'business', required: true, estimatedDays: 7, feeRange: '$50-200', links: [] },
      { step: 4, title: 'Apply for Facility License', description: 'Apply to Ohio Veterinary Medical Licensing Board for premises registration.', category: 'license', required: true, estimatedDays: 45, feeRange: '$250-400', links: [] },
      { step: 5, title: 'Building Permits', description: 'Permits for buildout: plumbing, electrical, HVAC, medical gas if applicable.', category: 'building', required: true, estimatedDays: 30, feeRange: '$1,000-10,000', links: [] },
      { step: 6, title: 'Build Out Facility', description: 'Exam rooms, surgery suite (if applicable), reception, pharmacy area, isolation ward, kennel runs.', category: 'building', required: true, estimatedDays: 60, feeRange: '$50,000-200,000', links: [] },
      { step: 7, title: 'DEA Registration', description: 'Apply for DEA registration to prescribe controlled substances.', category: 'license', required: true, estimatedDays: 45, feeRange: '$888/3 years', links: [] },
      { step: 8, title: 'Ohio Board of Pharmacy', description: 'Register as terminal distributor of dangerous drugs with Ohio Board of Pharmacy.', category: 'license', required: true, estimatedDays: 30, feeRange: '$100', links: [] },
      { step: 9, title: 'X-Ray Registration', description: 'If offering radiography, register with Ohio Department of Health radiation control.', category: 'license', required: false, estimatedDays: 30, feeRange: '$150', links: [] },
      { step: 10, title: 'Medical Waste Contract', description: 'Contract with licensed medical waste hauler for sharps and biohazard disposal.', category: 'compliance', required: true, estimatedDays: 7, feeRange: '$100-300/month', links: [] },
      { step: 11, title: 'Purchase Equipment', description: 'Exam tables, surgery equipment, diagnostic tools, pharmacy supplies, kennels.', category: 'equipment', required: true, estimatedDays: 30, feeRange: '$50,000-200,000', links: [] },
      { step: 12, title: 'State Board Inspection', description: 'Pass Ohio Veterinary Medical Licensing Board premises inspection.', category: 'inspection', required: true, estimatedDays: 14, feeRange: null, links: [] },
      { step: 13, title: 'Obtain Insurance', description: 'Professional liability (malpractice), general liability, property insurance.', category: 'business', required: true, estimatedDays: 7, feeRange: '$5,000-15,000/year', links: [] },
      { step: 14, title: 'Hire Staff', description: 'Registered veterinary technicians, assistants, reception staff. Verify RVT licenses.', category: 'planning', required: true, estimatedDays: 30, feeRange: 'Varies', links: [] },
    ],
  },
];

async function seedPetIndustryData() {
  console.log('Starting Pet Industry data seed...\n');

  const jurisdiction = await prisma.jurisdiction.findFirst({
    where: { name: 'Cincinnati' },
  });

  if (!jurisdiction) {
    console.error('Cincinnati jurisdiction not found! Please run main seed first.');
    process.exit(1);
  }

  console.log(`Found jurisdiction: ${jurisdiction.name}, ${jurisdiction.state}\n`);

  // Seed Permit Requirements
  console.log('Seeding Pet Industry Permit Requirements...');
  let permitCount = 0;
  for (const permit of PET_PERMIT_REQUIREMENTS) {
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
  console.log(`✓ Seeded ${permitCount} pet industry permit requirements\n`);

  // Seed Building Codes
  console.log('Seeding Pet Industry Building Codes...');
  let codeCount = 0;
  for (const code of PET_BUILDING_CODES) {
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
  console.log(`✓ Seeded ${codeCount} pet industry building codes\n`);

  // Seed Common Questions
  console.log('Seeding Pet Industry Common Questions...');
  let questionCount = 0;
  for (const q of PET_COMMON_QUESTIONS) {
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
  console.log(`✓ Seeded ${questionCount} pet industry common questions\n`);

  // Seed Business Checklists
  console.log('Seeding Pet Industry Business Checklists...');
  let checklistCount = 0;
  for (const checklist of PET_BUSINESS_CHECKLISTS) {
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
  console.log(`✓ Seeded ${checklistCount} pet industry business checklists\n`);

  console.log('='.repeat(50));
  console.log('Pet Industry data seed completed!');
  console.log('='.repeat(50));
}

seedPetIndustryData()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
