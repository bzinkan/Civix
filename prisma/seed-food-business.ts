import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Food Business Permit Requirements
const FOOD_PERMIT_REQUIREMENTS = [
  // FOOD SERVICE LICENSES - Ohio Unified Food Safety Code
  { activityType: 'food_license_type1', category: 'food_license', activityDescription: 'Type 1 Food License - Prepackaged food only (no prep)', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C', 'MG', 'ML'], zonesProhibited: [], feeBase: 75.00, feePerSqft: null, processingDays: 7, requiresPlans: false, requiresInspection: true, ordinanceRef: 'ORC 3717.11' },
  { activityType: 'food_license_type2', category: 'food_license', activityDescription: 'Type 2 Food License - Limited prep (heating/assembly only)', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 150.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3717.11' },
  { activityType: 'food_license_type3', category: 'food_license', activityDescription: 'Type 3 Food License - Standard restaurant (full prep, cooking)', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 250.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3717.11' },
  { activityType: 'food_license_type4', category: 'food_license', activityDescription: 'Type 4 Food License - High-risk prep (raw seafood, sushi, smoking)', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 350.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3717.11' },

  // MOBILE FOOD OPERATIONS
  { activityType: 'mobile_food_vendor', category: 'food_license', activityDescription: 'Mobile Food Vendor License (Food Truck)', zonesRequired: ['*'], zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'CMC 859.11' },
  { activityType: 'mobile_food_unit', category: 'food_license', activityDescription: 'Mobile Food Unit Health Permit', zonesRequired: ['*'], zonesProhibited: [], feeBase: 175.00, feePerSqft: null, processingDays: 14, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3717.43' },
  { activityType: 'commissary_agreement', category: 'food_license', activityDescription: 'Commissary Kitchen Agreement (required for mobile)', zonesRequired: ['*'], zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 7, requiresPlans: false, requiresInspection: false, ordinanceRef: 'ORC 3717.43' },

  // LIQUOR LICENSES - Ohio Division of Liquor Control
  { activityType: 'liquor_d1', category: 'liquor_license', activityDescription: 'D-1 Liquor Permit - Beer only (on-premises)', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 476.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: false, ordinanceRef: 'ORC 4303.13' },
  { activityType: 'liquor_d2', category: 'liquor_license', activityDescription: 'D-2 Liquor Permit - Beer & wine (on-premises)', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 954.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: false, ordinanceRef: 'ORC 4303.13' },
  { activityType: 'liquor_d3', category: 'liquor_license', activityDescription: 'D-3 Liquor Permit - Beer & liquor (on-premises, no Sunday)', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 1562.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: false, ordinanceRef: 'ORC 4303.13' },
  { activityType: 'liquor_d5', category: 'liquor_license', activityDescription: 'D-5 Liquor Permit - All alcohol (on-premises, full service)', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 2344.00, feePerSqft: null, processingDays: 90, requiresPlans: true, requiresInspection: false, ordinanceRef: 'ORC 4303.13' },
  { activityType: 'liquor_d5k', category: 'liquor_license', activityDescription: 'D-5K Liquor Permit - Kitchen bar (food 50%+ of sales)', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 2344.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: false, ordinanceRef: 'ORC 4303.13' },
  { activityType: 'liquor_d6', category: 'liquor_license', activityDescription: 'D-6 Liquor Permit - Private club', zonesRequired: ['*'], zonesProhibited: [], feeBase: 954.00, feePerSqft: null, processingDays: 60, requiresPlans: true, requiresInspection: false, ordinanceRef: 'ORC 4303.13' },
  { activityType: 'sunday_sales', category: 'liquor_license', activityDescription: 'Sunday Sales Permit (add-on)', zonesRequired: ['*'], zonesProhibited: [], feeBase: 200.00, feePerSqft: null, processingDays: 30, requiresPlans: false, requiresInspection: false, ordinanceRef: 'ORC 4303.182' },

  // BREWERY / DISTILLERY
  { activityType: 'liquor_a1a', category: 'liquor_license', activityDescription: 'A-1-A Permit - Craft brewery (31,000 barrels max)', zonesRequired: ['MG', 'ML', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 1562.00, feePerSqft: null, processingDays: 90, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4303.02' },
  { activityType: 'liquor_a2', category: 'liquor_license', activityDescription: 'A-2 Permit - Distillery (on-premises sales)', zonesRequired: ['MG', 'ML', 'CC-M', 'CC-A', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 2344.00, feePerSqft: null, processingDays: 90, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 4303.02' },
  { activityType: 'ttb_brewers_notice', category: 'federal', activityDescription: 'TTB Brewer\'s Notice (Federal)', zonesRequired: ['*'], zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 120, requiresPlans: true, requiresInspection: true, ordinanceRef: '27 CFR 25' },
  { activityType: 'ttb_dsp', category: 'federal', activityDescription: 'TTB Distilled Spirits Permit (Federal)', zonesRequired: ['*'], zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 180, requiresPlans: true, requiresInspection: true, ordinanceRef: '27 CFR 19' },

  // CATERING & EVENTS
  { activityType: 'caterer_license', category: 'food_license', activityDescription: 'Catering Food License', zonesRequired: ['CN-P', 'CN-M', 'CC-P', 'CC-M', 'CC-A', 'DD-A', 'DD-C', 'MG', 'ML'], zonesProhibited: [], feeBase: 250.00, feePerSqft: null, processingDays: 21, requiresPlans: true, requiresInspection: true, ordinanceRef: 'ORC 3717.11' },
  { activityType: 'temp_food_event', category: 'food_license', activityDescription: 'Temporary Food Event Permit (1-3 days)', zonesRequired: ['*'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 14, requiresPlans: false, requiresInspection: true, ordinanceRef: 'ORC 3717.43' },
  { activityType: 'f2_permit', category: 'liquor_license', activityDescription: 'F-2 Permit - Temporary beer/wine (special event)', zonesRequired: ['*'], zonesProhibited: [], feeBase: 50.00, feePerSqft: null, processingDays: 30, requiresPlans: false, requiresInspection: false, ordinanceRef: 'ORC 4303.20' },

  // ENTERTAINMENT & LATE NIGHT
  { activityType: 'entertainment_permit', category: 'license', activityDescription: 'Entertainment Permit (live music, dancing)', zonesRequired: ['CN-P', 'CC-P', 'CC-M', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 150.00, feePerSqft: null, processingDays: 30, requiresPlans: true, requiresInspection: false, ordinanceRef: 'CMC 857.15' },
  { activityType: 'late_night_permit', category: 'license', activityDescription: 'Late Night Operation Permit (after 2:30am)', zonesRequired: ['CC-P', 'DD-A', 'DD-C'], zonesProhibited: [], feeBase: 500.00, feePerSqft: null, processingDays: 45, requiresPlans: true, requiresInspection: false, ordinanceRef: 'CMC 857.17' },

  // FARMERS MARKET
  { activityType: 'farmers_market_vendor', category: 'food_license', activityDescription: 'Farmers Market Vendor Permit', zonesRequired: ['*'], zonesProhibited: [], feeBase: 25.00, feePerSqft: null, processingDays: 7, requiresPlans: false, requiresInspection: false, ordinanceRef: 'ORC 3717.22' },
  { activityType: 'cottage_food', category: 'food_license', activityDescription: 'Cottage Food Registration (home-based, no license needed)', zonesRequired: ['*'], zonesProhibited: [], feeBase: 0.00, feePerSqft: null, processingDays: 0, requiresPlans: false, requiresInspection: false, ordinanceRef: 'ORC 3715.021' },
];

// Food Business Building Code Chunks
const FOOD_BUILDING_CODES = [
  // FOOD ESTABLISHMENT REQUIREMENTS
  { codeType: 'OFC', section: '3717.04', title: 'Food Service License Required', content: 'No person shall operate a food service operation without a valid license from the local health department. Licenses must be renewed annually and posted in public view. First-time applicants must pass a pre-opening inspection.' },
  { codeType: 'OFC', section: '3717.05', title: 'Food Safety Training', content: 'At least one person in charge per shift must hold a valid food safety certification (ServSafe or equivalent). Certification must be obtained within 90 days of opening and renewed every 5 years.' },
  { codeType: 'OFC', section: '3717.11', title: 'Food License Types', content: 'Type 1: Prepackaged food only, no preparation. Type 2: Limited food prep (reheating, assembly). Type 3: Full food preparation and cooking. Type 4: Complex operations (raw seafood, sushi, smoking, curing). License type determines inspection frequency and fees.' },

  // KITCHEN REQUIREMENTS
  { codeType: 'OFC', section: '4-301.11', title: 'Food Prep Surfaces', content: 'Food-contact surfaces must be smooth, nonporous, and easily cleanable. Acceptable materials: stainless steel, food-grade plastic, sealed hardwood (cutting boards only). All surfaces must be NSF-certified or equivalent.' },
  { codeType: 'OFC', section: '4-301.12', title: 'Three-Compartment Sink', content: 'All food establishments must have a three-compartment sink for washing, rinsing, and sanitizing equipment. Minimum compartment size: 18"x18"x12" deep. Drain boards required on both ends.' },
  { codeType: 'OFC', section: '5-203.11', title: 'Handwashing Stations', content: 'Handwashing sinks required in food prep areas, restrooms, and dishwashing areas. Must have hot and cold running water (minimum 100°F), soap dispenser, paper towels or air dryer, and waste receptacle.' },
  { codeType: 'OFC', section: '4-204.11', title: 'Commercial Refrigeration', content: 'All refrigerated storage must maintain 41°F or below. Freezers must maintain 0°F or below. Units must have accurate thermometers visible without opening doors. Reach-in units preferred for frequent access.' },
  { codeType: 'OFC', section: '6-202.11', title: 'Ventilation Hood Requirements', content: 'Type I hoods required over cooking equipment producing grease-laden vapors (fryers, grills, ovens). Must extend 6" beyond equipment on all sides. Fire suppression system (Ansul) required. Makeup air must be provided.' },

  // RESTROOMS & FACILITIES
  { codeType: 'OBC', section: '2902.1', title: 'Restroom Requirements', content: 'Restaurants: 1 per 75 occupants (0-150), then 1 per 120. Bars: 1 per 40 (male), 1 per 40 (female). Employee restrooms required if customer restrooms not accessible. ADA accessible restroom required.' },
  { codeType: 'OBC', section: '2902.3', title: 'Employee Facilities', content: 'Food establishments must provide employee restrooms, lockers or storage for personal belongings, and break area separate from food prep areas. Dressing rooms required if uniforms are changed on-site.' },

  // MOBILE FOOD UNITS
  { codeType: 'OFC', section: '3717.43', title: 'Mobile Food Unit Requirements', content: 'Mobile food units must have: potable water tank (minimum 30 gallons), wastewater tank (15% larger than potable), three-compartment sink, handwashing sink, proper refrigeration, and commissary agreement for cleaning and restocking.' },
  { codeType: 'local', section: '859.11', title: 'Food Truck Operations', content: 'Food trucks in Cincinnati must: obtain Mobile Food Vendor License, have Health Department approval, operate only in designated zones, maintain 200ft distance from restaurants (unless invited), and return to licensed commissary daily.' },
  { codeType: 'local', section: '859.13', title: 'Food Truck Locations', content: 'Food trucks permitted in: downtown (DD zones) with Street Performance Permit, commercial zones during business hours, special event locations with permit. Prohibited in: residential zones, within 50ft of intersections, blocking pedestrian access.' },

  // LIQUOR ESTABLISHMENT REQUIREMENTS
  { codeType: 'ORC', section: '4303.25', title: 'Liquor Establishment Distance', content: 'No liquor permit issued for premises within 500 feet of a school, church, library, or public playground (measured door to door). Existing establishments grandfathered. Variance possible through local option election.' },
  { codeType: 'ORC', section: '4301.22', title: 'Liquor Sale Hours', content: 'On-premises consumption: Monday-Saturday 5:30am-2:30am, Sunday 11am-2:30am (with Sunday permit) or 1pm-2:30am (without). Last call 30 minutes before closing. Additional restrictions may apply locally.' },
  { codeType: 'local', section: '863.05', title: 'Bar Security Requirements', content: 'Establishments with capacity over 200 or history of violations must file security plan with Police Department. Security personnel required after 10pm. ID scanners recommended for establishments serving under-25 crowd.' },

  // BREWERY / DISTILLERY
  { codeType: 'ORC', section: '4303.021', title: 'Craft Brewery Regulations', content: 'A-1-A permit holders may manufacture up to 31,000 barrels annually, sell for on-premises consumption, and sell sealed containers for carryout. May operate taproom during permitted hours. Tours and tastings allowed.' },
  { codeType: 'federal', section: '27 CFR 25', title: 'TTB Brewery Requirements', content: 'All breweries must obtain federal Brewer\'s Notice from TTB before production. Requires: bond or bond exemption (under 6,000 barrels), premises description, equipment list, and operations plan. Processing time 75-120 days.' },

  // COTTAGE FOOD
  { codeType: 'ORC', section: '3715.021', title: 'Cottage Food Production', content: 'Home-based producers may sell non-hazardous foods directly to consumers without a license. Allowed items: baked goods, candy, jams, honey, dry mixes. Annual sales limit: $75,000. Must label with name, address, and "Made in a home kitchen" statement.' },
  { codeType: 'ORC', section: '3715.022', title: 'Cottage Food Restrictions', content: 'Cottage food producers may NOT sell: foods requiring refrigeration, meat, dairy, canned vegetables, or items containing these. Sales must be direct to consumers (not wholesale). Internet sales allowed with in-person delivery.' },

  // OUTDOOR DINING
  { codeType: 'local', section: '719.05', title: 'Sidewalk Cafe Permit', content: 'Outdoor dining on public sidewalks requires Sidewalk Cafe Permit from DOTE. Must maintain 5-foot clear pedestrian path. Tables and barriers must be removable. Hours limited to establishment operating hours. Annual fee based on square footage.' },
  { codeType: 'local', section: '719.07', title: 'Outdoor Dining Alcohol', content: 'Serving alcohol in outdoor dining areas requires liquor permit extension from Ohio Division of Liquor Control. Area must be clearly delineated with barriers. Server must verify age before serving.' },
];

// Food Business Common Questions
const FOOD_COMMON_QUESTIONS = [
  { question: 'What license do I need to open a restaurant?', category: 'restaurant', answer: 'You\'ll need a Type 3 Food Service License for a standard restaurant with full cooking. Type 4 is required for high-risk operations like sushi or smoking. Apply through Cincinnati Health Department. Fee is $250 (Type 3) or $350 (Type 4). Allow 3-4 weeks for plan review and inspection. You\'ll also need a general business license.', relatedPermits: ['food_license_type3', 'food_license_type4', 'business_license'], ordinanceRef: 'ORC 3717.11' },

  { question: 'How do I get a liquor license for my restaurant?', category: 'liquor', answer: 'Apply to Ohio Division of Liquor Control. Common options: D-5 (full liquor, $2,344/year) or D-5K (food must be 50%+ of sales). Processing takes 60-90 days. Quota limits apply - may need to purchase existing license. Must be 500ft from schools/churches. Local approval required from City Council. Budget $5,000-50,000+ to purchase a quota license.', relatedPermits: ['liquor_d5', 'liquor_d5k'], ordinanceRef: 'ORC 4303.13' },

  { question: 'What permits do I need for a food truck?', category: 'food_truck', answer: 'You need: (1) Mobile Food Unit License from Health Dept ($175), (2) Mobile Food Vendor License from City ($200), (3) Commissary Agreement (contract with licensed kitchen for cleaning/storage). Your truck must pass health inspection annually. Some zones restrict where you can operate. Fire extinguisher and propane setup require Fire Dept approval.', relatedPermits: ['mobile_food_vendor', 'mobile_food_unit', 'commissary_agreement'], ordinanceRef: 'CMC 859.11' },

  { question: 'Can I sell food made in my home kitchen?', category: 'cottage', answer: 'Yes, under Ohio\'s Cottage Food Law. No license needed for: baked goods, candy, jams, honey, dry mixes, popcorn. You CANNOT sell: anything requiring refrigeration, meat, dairy, or canned vegetables. Annual sales limit is $75,000. Must sell direct to consumers only (no wholesale). Labels must include your name, address, and "Made in a home kitchen" statement.', relatedPermits: ['cottage_food'], ordinanceRef: 'ORC 3715.021' },

  { question: 'How do I open a bar or nightclub?', category: 'bar', answer: 'You\'ll need: D-5 liquor permit ($2,344 + purchase of quota license), Entertainment Permit if live music/dancing ($150), Late Night Permit if open past 2:30am ($500). Location must be 500ft from schools/churches. Capacity over 200 requires security plan. Expect total startup costs of $50,000-150,000+ for permits and license purchase.', relatedPermits: ['liquor_d5', 'entertainment_permit', 'late_night_permit'], ordinanceRef: 'ORC 4303.13' },

  { question: 'What do I need to start a brewery?', category: 'brewery', answer: 'Required permits: (1) TTB Brewer\'s Notice (federal, free but 90-120 day process), (2) Ohio A-1-A permit ($1,562, up to 31,000 barrels), (3) Food License if serving food. You\'ll need industrial or commercial zoning (MG, ML, CC-M preferred). Building must meet commercial code for assembly and food service. Budget 6+ months for all permits.', relatedPermits: ['liquor_a1a', 'ttb_brewers_notice', 'food_license_type2'], ordinanceRef: 'ORC 4303.02' },

  { question: 'What kitchen equipment is required for a restaurant?', category: 'equipment', answer: 'Health code minimums: three-compartment sink, handwashing sinks, commercial refrigeration (41°F or below), NSF-certified prep surfaces. If cooking: Type I ventilation hood with fire suppression over grease-producing equipment. Hot water heater sized for volume. Separate mop sink. All equipment must be easily cleanable and accessible for inspection.', relatedPermits: ['food_license_type3'], ordinanceRef: 'OFC 4-301' },

  { question: 'How many restrooms does my restaurant need?', category: 'restroom', answer: 'Ohio Building Code requires: up to 50 occupants: 1 each male/female, 51-100: 2 each, 101-200: 3 each. For bars, it\'s 1 per 40 patrons. All must be ADA accessible. Employee restrooms required if customer ones aren\'t accessible. Handwashing sinks must be in or immediately adjacent to restrooms.', relatedPermits: [], ordinanceRef: 'OBC 2902.1' },

  { question: 'Can I have outdoor seating at my restaurant?', category: 'outdoor', answer: 'Yes! For private property: just follow zoning setbacks. For sidewalk: need Sidewalk Cafe Permit from DOTE. Must maintain 5-foot pedestrian path. Serving alcohol outdoors requires permit extension from Ohio Liquor Control. Barriers required if serving alcohol. Seasonal permits available for year-round establishments.', relatedPermits: ['sidewalk_cafe', 'liquor_d5'], ordinanceRef: 'CMC 719.05' },

  { question: 'What zones allow restaurants?', category: 'zoning', answer: 'Restaurants are permitted in: CN-P (Neighborhood Pedestrian), CN-M (Neighborhood Mixed), CC-P (Community Pedestrian), CC-M (Community Mixed), CC-A (Community Auto), DD-A and DD-C (Downtown). NOT permitted in residential zones (SF, RM) unless as home occupation with significant restrictions. Check specific zoning for liquor permit eligibility.', relatedPermits: [], ordinanceRef: 'CMC 1419' },

  { question: 'How do I get certified in food safety?', category: 'training', answer: 'At least one manager per shift must have food safety certification. Options: ServSafe Manager ($150-200, 8-hour course), Cincinnati Health Dept course, or other ANSI-accredited programs. Must pass exam with 75%+. Certificate valid for 5 years. Training covers: temperature control, cross-contamination, cleaning, HACCP principles.', relatedPermits: [], ordinanceRef: 'OFC 3717.05' },

  { question: 'What are the operating hours for bars in Cincinnati?', category: 'hours', answer: 'Standard liquor hours: Mon-Sat 5:30am-2:30am, Sunday 11am-2:30am (with Sunday permit) or 1pm-2:30am (without). Last call 30 minutes before closing. Late Night Permit allows operation past 2:30am in certain zones (DD-A, DD-C, CC-P). Food trucks typically limited to 7am-10pm in most locations.', relatedPermits: ['liquor_d5', 'late_night_permit'], ordinanceRef: 'ORC 4301.22' },

  { question: 'Do I need a permit to cater events?', category: 'catering', answer: 'Yes, you need a Catering Food License ($250). Must have commercial kitchen that passes inspection. For events with alcohol: need F-2 temporary permit ($50 per event) or catering endorsement on liquor license. Temporary Food Event permits ($50) cover single events up to 3 days. Must submit food menu 14 days in advance.', relatedPermits: ['caterer_license', 'f2_permit', 'temp_food_event'], ordinanceRef: 'ORC 3717.11' },

  { question: 'Where can I park my food truck?', category: 'food_truck_location', answer: 'Food trucks allowed in: Downtown (DD zones) with Street Performance Permit, commercial zones during business hours, private property with owner permission, special events with permit. NOT allowed: residential zones, within 50ft of intersections, blocking pedestrian paths, within 200ft of restaurants (unless invited). Must return to commissary daily.', relatedPermits: ['mobile_food_vendor'], ordinanceRef: 'CMC 859.13' },
];

async function seedFoodBusinessData() {
  console.log('Starting Food Business data seed...\n');

  // Get Cincinnati jurisdiction
  const jurisdiction = await prisma.jurisdiction.findFirst({
    where: { name: 'Cincinnati' },
  });

  if (!jurisdiction) {
    console.error('Cincinnati jurisdiction not found! Please create it first.');
    process.exit(1);
  }

  console.log(`Found jurisdiction: ${jurisdiction.name}, ${jurisdiction.state} (ID: ${jurisdiction.id})\n`);

  // Seed Food Permit Requirements
  console.log('Seeding Food Business Permit Requirements...');
  let permitCount = 0;
  for (const permit of FOOD_PERMIT_REQUIREMENTS) {
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
  console.log(`✓ Seeded ${permitCount} food business permit requirements\n`);

  // Seed Food Building Codes
  console.log('Seeding Food Business Building Codes...');
  let codeCount = 0;
  for (const code of FOOD_BUILDING_CODES) {
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
  console.log(`✓ Seeded ${codeCount} food business building codes\n`);

  // Seed Food Common Questions
  console.log('Seeding Food Business Common Questions...');
  let questionCount = 0;
  for (const q of FOOD_COMMON_QUESTIONS) {
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
  console.log(`✓ Seeded ${questionCount} food business common questions\n`);

  console.log('='.repeat(50));
  console.log('Food Business data seed completed successfully!');
  console.log('='.repeat(50));
  console.log(`
Summary:
  - Permit Requirements: ${permitCount}
  - Building Code Chunks: ${codeCount}
  - Common Questions: ${questionCount}
`);
}

seedFoodBusinessData()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
