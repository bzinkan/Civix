'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

// Comprehensive tool configuration with AI prompts
const TOOL_CONFIG: Record<string, {
  title: string;
  icon: string;
  description: string;
  category: string;
  systemContext: string;
  suggestedQuestions: string[];
  requiresAddress?: boolean;
}> = {
  // ===== HOMEOWNER TOOLS =====
  'permit-checker': {
    title: 'Permit Checker',
    icon: '📋',
    description: 'Check if your project requires a permit',
    category: 'homeowner',
    systemContext: 'You are a Cincinnati permit expert. Help the user determine if their home improvement project requires a permit. Ask about: project type, scope, location, and property details. Reference Cincinnati Municipal Code Chapter 1101 for building permits.',
    suggestedQuestions: [
      'Do I need a permit to build a deck?',
      'Is a permit required for a bathroom remodel?',
      'Do I need a permit for a new fence?',
      'What permits do I need for a kitchen renovation?'
    ],
    requiresAddress: true
  },
  'fence': {
    title: 'Fence Calculator',
    icon: '🏗️',
    description: 'Check fence height and setback requirements',
    category: 'homeowner',
    systemContext: 'You are a Cincinnati fence regulations expert. Help users understand fence requirements including: max heights (4ft front yard, 6ft side/rear), setback requirements, materials allowed, and permit requirements. Reference Cincinnati Zoning Code Section 1419-17.',
    suggestedQuestions: [
      'How tall can my fence be in the front yard?',
      'What is the maximum fence height for my backyard?',
      'Do I need a permit for a 6-foot privacy fence?',
      'Can I build a fence on the property line?'
    ],
    requiresAddress: true
  },
  'noise': {
    title: 'Noise Rules',
    icon: '🔊',
    description: 'Quiet hours and noise ordinance information',
    category: 'homeowner',
    systemContext: 'You are a Cincinnati noise ordinance expert. Help users understand noise regulations including: quiet hours (10pm-7am weekdays, 11pm-8am weekends), construction hours, permitted decibel levels, and how to file complaints. Reference Cincinnati Municipal Code Chapter 910.',
    suggestedQuestions: [
      'What are the quiet hours in Cincinnati?',
      'When can construction work start in the morning?',
      'How do I report a noise complaint?',
      'Are leaf blowers allowed on Sundays?'
    ]
  },
  'trash': {
    title: 'Trash Schedule',
    icon: '🗑️',
    description: 'Find your trash and recycling pickup days',
    category: 'homeowner',
    systemContext: 'You are a Cincinnati waste management expert. Help users with: trash pickup schedules, recycling guidelines, bulk item pickup, yard waste collection, and holiday schedule changes. Reference Cincinnati Public Services information.',
    suggestedQuestions: [
      'What day is my trash pickup?',
      'What can I put in recycling?',
      'How do I schedule a bulk item pickup?',
      'When is yard waste collected?'
    ],
    requiresAddress: true
  },
  'reps': {
    title: 'My Representatives',
    icon: '🏛️',
    description: 'Find your elected officials and council member',
    category: 'homeowner',
    systemContext: 'You are a Cincinnati civic information expert. Help users find their elected representatives including: City Council member, Mayor, County Commissioner, State Representative, State Senator, and US Congress members based on their address.',
    suggestedQuestions: [
      'Who is my city council member?',
      'How do I contact the mayor\'s office?',
      'Who represents my area in the Ohio legislature?',
      'When is the next city council meeting?'
    ],
    requiresAddress: true
  },
  'report': {
    title: 'Report an Issue',
    icon: '🚨',
    description: 'Report potholes, graffiti, or other city issues',
    category: 'homeowner',
    systemContext: 'You are a Cincinnati 311 service expert. Help users report city issues like: potholes, streetlight outages, graffiti, abandoned vehicles, property maintenance violations, and other concerns. Provide the CSR (Customer Service Request) process and relevant contact numbers.',
    suggestedQuestions: [
      'How do I report a pothole?',
      'Who do I call about a streetlight out?',
      'How do I report graffiti?',
      'How do I report an abandoned vehicle?'
    ],
    requiresAddress: true
  },

  // ===== CONTRACTOR TOOLS =====
  'compliance': {
    title: 'Compliance Calculator',
    icon: '✅',
    description: 'Check if your project meets zoning requirements',
    category: 'contractor',
    systemContext: 'You are a Cincinnati zoning compliance expert. Help contractors verify projects meet requirements for: setbacks, lot coverage, building height, FAR, parking, and use regulations. Reference Cincinnati Zoning Code and ask for specific measurements.',
    suggestedQuestions: [
      'What are the setback requirements for SF-6 zoning?',
      'How do I calculate lot coverage?',
      'What is the maximum building height allowed?',
      'How many parking spaces are required?'
    ],
    requiresAddress: true
  },
  'fees': {
    title: 'Fee Estimator',
    icon: '💰',
    description: 'Estimate permit fees based on project valuation',
    category: 'contractor',
    systemContext: 'You are a Cincinnati permit fee expert. Help estimate fees for building permits based on project valuation, plan review fees, inspection fees, and other applicable charges. Cincinnati uses ICC valuation tables and fee schedules.',
    suggestedQuestions: [
      'How much is a building permit for a $50,000 project?',
      'What are the plan review fees?',
      'Are there fees for re-inspections?',
      'How much is a demolition permit?'
    ]
  },
  'forms': {
    title: 'Form Library',
    icon: '📄',
    description: 'Find and download permit applications',
    category: 'contractor',
    systemContext: 'You are a Cincinnati permit forms expert. Help users find the right application forms for: building permits, electrical permits, plumbing permits, HVAC permits, zoning certificates, and other approvals. Provide links to Cincinnati Building Department forms.',
    suggestedQuestions: [
      'Where do I get a building permit application?',
      'What forms do I need for an electrical permit?',
      'Is there a contractor registration form?',
      'Where do I find the zoning certificate application?'
    ]
  },
  'bulk': {
    title: 'Bulk Lookup',
    icon: '📊',
    description: 'Look up multiple properties at once',
    category: 'contractor',
    systemContext: 'You are a Cincinnati property data expert. Help users understand how to look up zoning, permits, and property information for multiple addresses. Explain CAGIS resources and batch lookup options.',
    suggestedQuestions: [
      'How do I look up zoning for multiple properties?',
      'Can I get permit history for a list of addresses?',
      'How do I check violations for multiple properties?',
      'Where can I download parcel data?'
    ]
  },
  'inspections': {
    title: 'Inspection Scheduler',
    icon: '🏗️',
    description: 'Schedule and track permit inspections',
    category: 'contractor',
    systemContext: 'You are a Cincinnati building inspection expert. Help with: scheduling inspections, inspection types required, what inspectors look for, failed inspection remedies, and the inspection process. Reference Cincinnati Building Department procedures.',
    suggestedQuestions: [
      'How do I schedule a building inspection?',
      'What inspections are required for a new deck?',
      'What happens if I fail an inspection?',
      'How much notice do I need for an inspection?'
    ]
  },

  // ===== REALTOR TOOLS =====
  'zoning-report': {
    title: 'Zoning Report',
    icon: '📋',
    description: 'Generate a comprehensive zoning summary',
    category: 'realtor',
    systemContext: 'You are a Cincinnati zoning report expert. Help generate comprehensive zoning information including: zone classification, permitted uses, development standards, overlays, setbacks, height limits, and any restrictions. Format as a professional report.',
    suggestedQuestions: [
      'What is the zoning for this property?',
      'What uses are allowed in this zone?',
      'Are there any overlay districts?',
      'What are the development standards?'
    ],
    requiresAddress: true
  },
  'dev-potential': {
    title: 'Development Potential',
    icon: '📈',
    description: 'Analyze what can be built on a property',
    category: 'realtor',
    systemContext: 'You are a Cincinnati development analysis expert. Help analyze properties for: maximum buildable area, allowed uses, density calculations, required setbacks, parking requirements, and potential variances needed.',
    suggestedQuestions: [
      'What is the maximum buildable square footage?',
      'Can this property be subdivided?',
      'Is multi-family development allowed?',
      'What density is permitted?'
    ],
    requiresAddress: true
  },
  'site-finder': {
    title: 'Site Finder',
    icon: '🗺️',
    description: 'Search for properties by zoning type',
    category: 'realtor',
    systemContext: 'You are a Cincinnati site selection expert. Help users find properties that meet specific zoning or use requirements. Explain which zones allow specific uses and how to search for available properties.',
    suggestedQuestions: [
      'What zones allow multi-family housing?',
      'Where can I build a retail store?',
      'Which areas allow mixed-use development?',
      'What zones permit light industrial?'
    ]
  },
  'client-reports': {
    title: 'Client Reports',
    icon: '👤',
    description: 'Generate reports to share with clients',
    category: 'realtor',
    systemContext: 'You are a Cincinnati real estate report expert. Help create professional property reports including: zoning summary, development potential, nearby amenities, school districts, and property history for client presentations.',
    suggestedQuestions: [
      'Create a property summary for my client',
      'What information should I include in a buyer report?',
      'How do I explain zoning to my client?',
      'What due diligence should buyers do?'
    ],
    requiresAddress: true
  },
  'comps': {
    title: 'Comp Analysis',
    icon: '📊',
    description: 'Compare similar properties in the area',
    category: 'realtor',
    systemContext: 'You are a Cincinnati property comparison expert. Help analyze comparable properties considering: zoning, lot size, building size, recent sales, and development potential.',
    suggestedQuestions: [
      'How do I find comparable properties?',
      'What factors affect property value in this zone?',
      'How does zoning impact property values?',
      'What recent developments are nearby?'
    ],
    requiresAddress: true
  },
  'schools': {
    title: 'School Districts',
    icon: '🎓',
    description: 'Find school district information',
    category: 'realtor',
    systemContext: 'You are a Cincinnati school district expert. Help users find information about: school district boundaries, school ratings, enrollment information, and how school districts affect property values.',
    suggestedQuestions: [
      'What school district is this address in?',
      'What are the nearby schools?',
      'How do I find school ratings?',
      'Do school districts affect zoning?'
    ],
    requiresAddress: true
  },

  // ===== SMALL BUSINESS TOOLS =====
  'license-wizard': {
    title: 'License Wizard',
    icon: '📋',
    description: 'Find out what licenses your business needs',
    category: 'small_business',
    systemContext: 'You are a Cincinnati business licensing expert. Help users identify required licenses including: city business license, vendor license, health permits, state registrations, and industry-specific permits based on their business type.',
    suggestedQuestions: [
      'What licenses do I need to open a restaurant?',
      'Do I need a business license for freelancing?',
      'What permits does a food truck need?',
      'How do I get a vendor license?'
    ]
  },
  'sign-permit': {
    title: 'Sign Permit',
    icon: '🪧',
    description: 'Sign size and placement requirements',
    category: 'small_business',
    systemContext: 'You are a Cincinnati sign regulations expert. Help with: sign size limits, placement requirements, illumination rules, and permit requirements. Reference Cincinnati Zoning Code Chapter 1419-19 for sign regulations.',
    suggestedQuestions: [
      'How big can my business sign be?',
      'Do I need a permit for a window sign?',
      'Are illuminated signs allowed?',
      'Can I have a sidewalk sign?'
    ],
    requiresAddress: true
  },
  'home-occupation': {
    title: 'Home Occupation',
    icon: '🏠',
    description: 'Rules for running a business from home',
    category: 'small_business',
    systemContext: 'You are a Cincinnati home occupation expert. Help users understand rules for home-based businesses including: allowed activities, customer visits, signage, parking, and registration requirements. Reference Cincinnati Zoning Code Section 1419-07.',
    suggestedQuestions: [
      'Can I run a business from my home?',
      'How many customers can visit my home business?',
      'Do I need a permit for a home office?',
      'Can I have employees at my home business?'
    ],
    requiresAddress: true
  },
  'food-service': {
    title: 'Food Service',
    icon: '🍽️',
    description: 'Food service permits and health requirements',
    category: 'small_business',
    systemContext: 'You are a Cincinnati food service licensing expert. Help with: food service operation license, health department requirements, food handler certifications, and facility requirements. Reference Hamilton County Health Department regulations.',
    suggestedQuestions: [
      'What permits do I need for a restaurant?',
      'How do I get a food service license?',
      'What are the health inspection requirements?',
      'Do I need ServSafe certification?'
    ]
  },
  'parking': {
    title: 'Parking Requirements',
    icon: '🅿️',
    description: 'Calculate required parking spaces',
    category: 'small_business',
    systemContext: 'You are a Cincinnati parking requirements expert. Help calculate required parking based on use type, square footage, and location. Reference Cincinnati Zoning Code Chapter 1419-21 for parking ratios and reductions available in certain districts.',
    suggestedQuestions: [
      'How many parking spaces does my business need?',
      'Are there parking reductions in downtown?',
      'Can I share parking with another business?',
      'What if I can\'t provide enough parking?'
    ],
    requiresAddress: true
  },
  'location-check': {
    title: 'Location Check',
    icon: '📍',
    description: 'Verify your business can operate at this location',
    category: 'small_business',
    systemContext: 'You are a Cincinnati business location expert. Help verify if a specific business type is allowed at a location based on zoning, use regulations, and any required conditional use permits.',
    suggestedQuestions: [
      'Can I open a retail store at this address?',
      'Is my business type allowed in this zone?',
      'Do I need a conditional use permit?',
      'What businesses are prohibited here?'
    ],
    requiresAddress: true
  },

  // ===== LEGAL TOOLS =====
  'compliance-cert': {
    title: 'Compliance Certificate',
    icon: '📜',
    description: 'Generate a formal compliance certificate',
    category: 'legal',
    systemContext: 'You are a Cincinnati zoning compliance expert for legal professionals. Help explain the process for obtaining zoning compliance certificates, letters of conformance, and what they certify.',
    suggestedQuestions: [
      'How do I get a zoning compliance letter?',
      'What does a compliance certificate include?',
      'How long is a compliance certificate valid?',
      'What is a non-conforming use certificate?'
    ],
    requiresAddress: true
  },
  'permit-history': {
    title: 'Permit History',
    icon: '📋',
    description: 'View complete permit history for a property',
    category: 'legal',
    systemContext: 'You are a Cincinnati permit records expert. Help users understand how to obtain complete permit history including: building permits, renovation permits, occupancy certificates, and inspection records.',
    suggestedQuestions: [
      'How do I get the permit history for a property?',
      'Where are permit records stored?',
      'Can I see inspection reports?',
      'How far back do permit records go?'
    ],
    requiresAddress: true
  },
  'violations': {
    title: 'Violation Check',
    icon: '⚠️',
    description: 'Check for open violations on a property',
    category: 'legal',
    systemContext: 'You are a Cincinnati code enforcement expert. Help users understand: how to check for violations, types of violations, resolution process, and liens that may result from unresolved violations.',
    suggestedQuestions: [
      'How do I check for open violations?',
      'What types of violations are common?',
      'How do I resolve a code violation?',
      'Can violations affect property sale?'
    ],
    requiresAddress: true
  },
  'zoning-letter': {
    title: 'Zoning Letter',
    icon: '✉️',
    description: 'Request an official zoning determination',
    category: 'legal',
    systemContext: 'You are a Cincinnati zoning letter expert. Help users understand how to request official zoning letters, what they contain, and when they are needed for legal or financing purposes.',
    suggestedQuestions: [
      'How do I request a zoning verification letter?',
      'What does an official zoning letter include?',
      'How long does it take to get a zoning letter?',
      'How much does a zoning letter cost?'
    ],
    requiresAddress: true
  },
  'variances': {
    title: 'Variance History',
    icon: '📂',
    description: 'Research past variance decisions',
    category: 'legal',
    systemContext: 'You are a Cincinnati variance expert. Help users research past variance decisions, understand the variance process, and what factors the Board of Zoning Appeals considers.',
    suggestedQuestions: [
      'How do I find past variance decisions?',
      'What is the variance approval process?',
      'What criteria does the BZA consider?',
      'How do I appeal a variance decision?'
    ],
    requiresAddress: true
  },
  'municipal-code': {
    title: 'Municipal Code',
    icon: '📚',
    description: 'Search Cincinnati Municipal Code',
    category: 'legal',
    systemContext: 'You are a Cincinnati Municipal Code expert. Help users find and understand specific code sections including: building code, zoning code, health and safety regulations, and business regulations.',
    suggestedQuestions: [
      'Where can I find the zoning code?',
      'What chapter covers building permits?',
      'How do I cite a specific code section?',
      'When was the code last updated?'
    ]
  },

  // ===== TITLE & ESCROW TOOLS =====
  'liens': {
    title: 'Lien Search',
    icon: '🔍',
    description: 'Check for liens on a property',
    category: 'title',
    systemContext: 'You are a Cincinnati lien search expert. Help users understand: how to search for liens, types of liens (tax, mechanic, judgment), and how liens affect property transfers.',
    suggestedQuestions: [
      'How do I check for liens on a property?',
      'What types of liens should I look for?',
      'Do code violations create liens?',
      'How do I clear a lien from a property?'
    ],
    requiresAddress: true
  },
  'co-search': {
    title: 'Certificate of Occupancy',
    icon: '🏢',
    description: 'Verify certificate of occupancy status',
    category: 'title',
    systemContext: 'You are a Cincinnati certificate of occupancy expert. Help users understand: when C/O is required, how to verify C/O exists, and what issues arise without a valid certificate of occupancy.',
    suggestedQuestions: [
      'Does this property have a certificate of occupancy?',
      'When is a C/O required?',
      'What if there is no certificate of occupancy?',
      'How do I get a copy of the C/O?'
    ],
    requiresAddress: true
  },

  // ===== DEVELOPER TOOLS =====
  'feasibility': {
    title: 'Feasibility Report',
    icon: '📊',
    description: 'Analyze development feasibility',
    category: 'developer',
    systemContext: 'You are a Cincinnati development feasibility expert. Help analyze: allowable density, building envelope, parking requirements, impact fees, and potential challenges for development projects.',
    suggestedQuestions: [
      'What can I build on this lot?',
      'What is the maximum density allowed?',
      'What are the likely development costs?',
      'Are there any development incentives?'
    ],
    requiresAddress: true
  },
  'entitlements': {
    title: 'Entitlement Pathway',
    icon: '🗺️',
    description: 'Determine what approvals are needed',
    category: 'developer',
    systemContext: 'You are a Cincinnati entitlement process expert. Help developers understand: required approvals, review timelines, public hearing requirements, and the sequence of approvals needed for different project types.',
    suggestedQuestions: [
      'What approvals do I need for this project?',
      'How long does the entitlement process take?',
      'Do I need a public hearing?',
      'What triggers site plan review?'
    ],
    requiresAddress: true
  },
  'zone-history': {
    title: 'Zone Change History',
    icon: '📋',
    description: 'View recent rezonings in the area',
    category: 'developer',
    systemContext: 'You are a Cincinnati rezoning history expert. Help users research past rezonings, understand the rezoning process, and analyze trends in the area.',
    suggestedQuestions: [
      'What rezonings have occurred nearby?',
      'How do I apply for a zone change?',
      'What is the rezoning approval process?',
      'How long does rezoning take?'
    ],
    requiresAddress: true
  },
  'meetings': {
    title: 'Public Meetings',
    icon: '🏛️',
    description: 'Find upcoming planning meetings',
    category: 'developer',
    systemContext: 'You are a Cincinnati public meetings expert. Help users find: City Planning Commission meetings, Board of Zoning Appeals hearings, City Council meetings, and community council meetings relevant to development.',
    suggestedQuestions: [
      'When is the next Planning Commission meeting?',
      'How do I get on the BZA agenda?',
      'Where can I find meeting agendas?',
      'How do I speak at a public hearing?'
    ]
  },
  'impact-fees': {
    title: 'Impact Fees',
    icon: '💵',
    description: 'Calculate development impact fees',
    category: 'developer',
    systemContext: 'You are a Cincinnati impact fee expert. Help calculate: park impact fees, transportation fees, water/sewer tap fees, and other development-related fees and contributions.',
    suggestedQuestions: [
      'What impact fees apply to my project?',
      'How are impact fees calculated?',
      'Are there any fee waivers available?',
      'When are impact fees due?'
    ],
    requiresAddress: true
  },

  // ===== FOOD BUSINESS TOOLS =====
  'food-license': {
    title: 'Food License',
    icon: '🍽️',
    description: 'Food service operation license requirements',
    category: 'food_business',
    systemContext: 'You are a Cincinnati food licensing expert. Help with food service operation licenses, health department requirements, kitchen requirements, and the application process.',
    suggestedQuestions: [
      'How do I get a food service license?',
      'What are the kitchen requirements?',
      'How often are health inspections?',
      'What is the license renewal process?'
    ]
  },
  'liquor-license': {
    title: 'Liquor License',
    icon: '🍺',
    description: 'Ohio liquor permit requirements',
    category: 'food_business',
    systemContext: 'You are an Ohio liquor licensing expert. Help with: types of liquor permits (D1, D2, D3, D5, etc.), application process, Sunday sales permits, and local approval requirements.',
    suggestedQuestions: [
      'What type of liquor license do I need?',
      'How do I apply for a liquor permit?',
      'Can I get a Sunday sales permit?',
      'What is the quota for liquor licenses?'
    ],
    requiresAddress: true
  },
  'health-prep': {
    title: 'Health & Prep Requirements',
    icon: '🧤',
    description: 'Food safety and preparation requirements',
    category: 'food_business',
    systemContext: 'You are a Hamilton County food safety expert. Help with: food handler certifications, HACCP plans, temperature requirements, and health inspection preparation.',
    suggestedQuestions: [
      'What certifications do food handlers need?',
      'What are the food storage requirements?',
      'How do I prepare for a health inspection?',
      'What is a HACCP plan?'
    ]
  },
  'mobile-vendor': {
    title: 'Mobile Vendor Permit',
    icon: '🚚',
    description: 'Food truck and mobile vendor requirements',
    category: 'food_business',
    systemContext: 'You are a Cincinnati mobile food vendor expert. Help with: mobile vendor licenses, approved vending locations, commissary requirements, and operational restrictions.',
    suggestedQuestions: [
      'How do I get a food truck permit?',
      'Where can food trucks operate?',
      'Do I need a commissary agreement?',
      'What are the parking restrictions?'
    ]
  },
  'commissary': {
    title: 'Commissary Requirements',
    icon: '🏭',
    description: 'Commercial kitchen and commissary needs',
    category: 'food_business',
    systemContext: 'You are a Cincinnati commissary expert. Help food trucks and mobile vendors understand commissary requirements, shared kitchen options, and compliance documentation.',
    suggestedQuestions: [
      'Do I need a commissary for my food truck?',
      'What are the commissary requirements?',
      'Where can I find shared commercial kitchens?',
      'How do I document commissary usage?'
    ]
  },
  'cottage-food': {
    title: 'Cottage Food',
    icon: '🏠',
    description: 'Home-based food production rules',
    category: 'food_business',
    systemContext: 'You are an Ohio cottage food law expert. Help with: allowed products, sales limits ($75,000/year), labeling requirements, and where cottage food can be sold.',
    suggestedQuestions: [
      'What foods can I sell under cottage food law?',
      'What is the annual sales limit?',
      'What labeling is required?',
      'Where can I sell cottage food products?'
    ]
  },
  'brewery-license': {
    title: 'Brewery License',
    icon: '🍺',
    description: 'Craft brewery and taproom permits',
    category: 'food_business',
    systemContext: 'You are an Ohio craft brewery licensing expert. Help with: A-1c permits, taproom licenses, production limits, distribution rules, and federal TTB requirements.',
    suggestedQuestions: [
      'What licenses do I need to open a brewery?',
      'Can I have a taproom?',
      'What are the production limits?',
      'Do I need federal TTB approval?'
    ]
  },
  'entertainment-permit': {
    title: 'Entertainment Permit',
    icon: '🎵',
    description: 'Live music and entertainment licenses',
    category: 'food_business',
    systemContext: 'You are a Cincinnati entertainment permit expert. Help with: live entertainment licenses, noise regulations, outdoor entertainment, and capacity requirements.',
    suggestedQuestions: [
      'Do I need a permit for live music?',
      'What are the noise limits?',
      'Can I have outdoor entertainment?',
      'What are the hours for live music?'
    ],
    requiresAddress: true
  },
  'restaurant-buildout': {
    title: 'Restaurant Buildout',
    icon: '🔨',
    description: 'Construction requirements for restaurants',
    category: 'food_business',
    systemContext: 'You are a Cincinnati restaurant construction expert. Help with: building permits, grease trap requirements, hood and ventilation systems, ADA compliance, and occupancy requirements.',
    suggestedQuestions: [
      'What permits do I need for restaurant buildout?',
      'Do I need a grease trap?',
      'What are the ventilation requirements?',
      'How do I get a certificate of occupancy?'
    ],
    requiresAddress: true
  },

  // ===== BEAUTY & PERSONAL CARE TOOLS =====
  'cosmetology-license': {
    title: 'Cosmetology License',
    icon: '💇',
    description: 'Ohio State Cosmetology Board requirements',
    category: 'beauty_personal_care',
    systemContext: 'You are an Ohio State Cosmetology Board expert. Help with: salon licensing, cosmetologist requirements, booth rental rules, and sanitation requirements.',
    suggestedQuestions: [
      'How do I open a hair salon in Ohio?',
      'What licenses do stylists need?',
      'What are the sanitation requirements?',
      'Can I rent booths to independent stylists?'
    ]
  },
  'tattoo-permit': {
    title: 'Tattoo & Piercing Permit',
    icon: '🎨',
    description: 'Body art establishment requirements',
    category: 'beauty_personal_care',
    systemContext: 'You are an Ohio tattoo and body piercing regulations expert. Help with: artist licensing, shop permits, health department requirements, and age restrictions.',
    suggestedQuestions: [
      'How do I get a tattoo shop license?',
      'What training do tattoo artists need?',
      'What are the health requirements?',
      'What are the age restrictions for tattooing?'
    ]
  },
  'spa-license': {
    title: 'Spa & Massage License',
    icon: '💆',
    description: 'Massage establishment requirements',
    category: 'beauty_personal_care',
    systemContext: 'You are an Ohio massage therapy licensing expert. Help with: massage therapist licensing through the State Medical Board, establishment requirements, and continuing education.',
    suggestedQuestions: [
      'How do I open a massage spa?',
      'What license do massage therapists need?',
      'What are the facility requirements?',
      'Do I need liability insurance?'
    ]
  },

  // ===== PET INDUSTRY TOOLS =====
  'kennel-license': {
    title: 'Kennel License',
    icon: '🐕',
    description: 'Dog kennel and boarding facility permits',
    category: 'pet_industry',
    systemContext: 'You are an Ohio kennel licensing expert. Help with: kennel license requirements, Ohio Department of Agriculture rules, zoning for kennels, and animal care standards.',
    suggestedQuestions: [
      'How do I get a kennel license?',
      'How many dogs require a kennel license?',
      'What are the facility requirements?',
      'What zones allow kennels?'
    ],
    requiresAddress: true
  },
  'pet-grooming': {
    title: 'Pet Grooming',
    icon: '🐩',
    description: 'Pet grooming business requirements',
    category: 'pet_industry',
    systemContext: 'You are a pet grooming business expert. Help with: business licensing, zoning requirements, health and safety standards, and mobile grooming regulations.',
    suggestedQuestions: [
      'Do I need a license for pet grooming?',
      'What are the zoning requirements?',
      'Can I operate a mobile grooming van?',
      'What safety standards apply?'
    ]
  },
  'vet-clinic': {
    title: 'Veterinary Clinic',
    icon: '🏥',
    description: 'Veterinary practice requirements',
    category: 'pet_industry',
    systemContext: 'You are an Ohio veterinary practice expert. Help with: veterinary licensing through the State Veterinary Medical Licensing Board, facility requirements, and controlled substance handling.',
    suggestedQuestions: [
      'How do I open a veterinary clinic?',
      'What are the facility requirements?',
      'How do I handle controlled substances?',
      'What insurance do I need?'
    ]
  },

  // ===== FITNESS & WELLNESS TOOLS =====
  'gym-license': {
    title: 'Gym License',
    icon: '🏋️',
    description: 'Fitness facility requirements',
    category: 'fitness_wellness',
    systemContext: 'You are an Ohio fitness facility expert. Help with: Ohio Health Club Act requirements, membership contract rules, facility safety, and liability considerations.',
    suggestedQuestions: [
      'What licenses do I need to open a gym?',
      'What does the Health Club Act require?',
      'Do I need a bond or insurance?',
      'What are the contract disclosure requirements?'
    ]
  },
  'pool-license': {
    title: 'Pool License',
    icon: '🏊',
    description: 'Public pool and spa requirements',
    category: 'fitness_wellness',
    systemContext: 'You are an Ohio public pool licensing expert. Help with: pool permits, lifeguard requirements, water quality standards, and health department inspections.',
    suggestedQuestions: [
      'How do I get a public pool license?',
      'Do I need certified lifeguards?',
      'What are the water quality requirements?',
      'How often are pool inspections?'
    ]
  },
  'yoga-studio': {
    title: 'Yoga/Dance Studio',
    icon: '🧘',
    description: 'Studio facility requirements',
    category: 'fitness_wellness',
    systemContext: 'You are a fitness studio licensing expert. Help with: business licensing, zoning for studio use, instructor certifications, and liability considerations.',
    suggestedQuestions: [
      'What permits do I need for a yoga studio?',
      'What zones allow fitness studios?',
      'Do instructors need certifications?',
      'What insurance should I have?'
    ],
    requiresAddress: true
  },

  // ===== CHILDCARE & EDUCATION TOOLS =====
  'daycare-license': {
    title: 'Daycare License',
    icon: '👶',
    description: 'ODJFS childcare licensing requirements',
    category: 'childcare_education',
    systemContext: 'You are an Ohio childcare licensing expert (ODJFS). Help with: Type A and Type B home licenses, childcare center licensing, staff-to-child ratios, and facility requirements.',
    suggestedQuestions: [
      'How do I get licensed for home daycare?',
      'What is the difference between Type A and Type B?',
      'What are the staff-to-child ratios?',
      'What background checks are required?'
    ]
  },
  'preschool-license': {
    title: 'Preschool License',
    icon: '🎨',
    description: 'Preschool and early education requirements',
    category: 'childcare_education',
    systemContext: 'You are an Ohio preschool licensing expert. Help with: preschool licensing through ODJFS, curriculum requirements, teacher qualifications, and Step Up to Quality ratings.',
    suggestedQuestions: [
      'How do I license a preschool?',
      'What teacher qualifications are required?',
      'What is Step Up to Quality?',
      'What curriculum is required?'
    ]
  },
  'tutoring-center': {
    title: 'Tutoring Center',
    icon: '📚',
    description: 'Tutoring and learning center requirements',
    category: 'childcare_education',
    systemContext: 'You are a tutoring business expert. Help with: business licensing, zoning requirements, and whether childcare licensing applies to tutoring services.',
    suggestedQuestions: [
      'Do I need a license for a tutoring center?',
      'Does childcare licensing apply to tutoring?',
      'What zones allow tutoring centers?',
      'Do I need background checks for tutors?'
    ],
    requiresAddress: true
  }
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ToolPage() {
  const params = useParams();
  const router = useRouter();
  const toolId = params.tool as string;
  const tool = TOOL_CONFIG[toolId];

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    if (tool) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `Welcome to the **${tool.title}**! ${tool.description}.\n\n${tool.requiresAddress ? '📍 Enter an address above for location-specific information.\n\n' : ''}What would you like to know?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [toolId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          address: address || undefined,
          toolContext: tool ? {
            toolId,
            systemContext: tool.systemContext,
            category: tool.category
          } : undefined
        })
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: Date.now().toString() + '-response',
        role: 'assistant',
        content: data.message || data.response || 'I apologize, I could not generate a response.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setLoading(false);
  };

  const handleSuggestionClick = (question: string) => {
    setInput(question);
  };

  // Unknown tool - show not found
  if (!tool) {
    return (
      <div className="space-y-6">
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold mb-2">Tool Not Found</h2>
          <p className="text-gray-500 mb-6">
            The tool "{toolId}" doesn't exist or hasn't been configured yet.
          </p>
          <button onClick={() => router.push('/tools')} className="button">
            ← Back to Tools
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="card mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/tools')} className="text-gray-400 hover:text-gray-600">
              ←
            </button>
            <span className="text-3xl">{tool.icon}</span>
            <div>
              <h1 className="text-xl font-bold">{tool.title}</h1>
              <p className="text-gray-500 text-sm">{tool.description}</p>
            </div>
          </div>
          {tool.requiresAddress && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">📍</span>
              <input
                type="text"
                className="input w-64"
                placeholder="Enter address for context..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 card overflow-y-auto mb-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100'
                }`}
              >
                <div className="whitespace-pre-wrap">
                  {message.content.split('**').map((part, i) =>
                    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                  )}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <div className="animate-pulse">●</div>
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions - show when few messages */}
        {messages.length <= 1 && tool.suggestedQuestions && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-500 mb-3">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {tool.suggestedQuestions.map((question, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(question)}
                  className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 text-left"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="card">
        <div className="flex gap-2">
          <input
            type="text"
            className="input flex-1"
            placeholder={`Ask about ${tool.title.toLowerCase()}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="button"
            disabled={loading || !input.trim()}
          >
            Send ➤
          </button>
        </div>
      </form>
    </div>
  );
}
