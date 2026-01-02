import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ExtractedZone {
  zone_code: string;
  zone_name: string;
  category: string;
  description: string;
  min_lot_sqft: number | null;
  max_lot_coverage: number | null;
  max_height_ft: number | null;
  max_stories: number | null;
  front_setback_ft: number | null;
  side_setback_ft: number | null;
  rear_setback_ft: number | null;
  max_far: number | null;
  allowed_uses: string[];
  conditional_uses: string[];
  prohibited_uses: string[];
  parking_required: string | null;
  notes: string | null;
  code_section: string | null;
  confidence: 'high' | 'medium' | 'low';
}

export interface ExtractedPermit {
  permit_type: string;
  category: string;
  description: string;
  required_for: string;
  exemptions: string | null;
  fee_base: number | null;
  fee_formula: string | null;
  review_days: number | null;
  requires_plans: boolean;
  requires_inspection: boolean;
  inspection_types: string[];
  code_section: string | null;
  confidence: 'high' | 'medium' | 'low';
}

export interface ExtractedFee {
  permit_type: string;
  description: string;
  fee_type: 'flat' | 'per_sqft' | 'percentage' | 'tiered' | 'calculated';
  base_fee: number | null;
  per_sqft_fee: number | null;
  minimum_fee: number | null;
  maximum_fee: number | null;
  notes: string | null;
  confidence: 'high' | 'medium' | 'low';
}

export interface ExtractedCode {
  code_type: string;
  section: string;
  title: string;
  content: string;
  keywords: string[];
  applies_to: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface ExtractedQuestion {
  question: string;
  category: string;
  answer: string;
  related_permits: string[];
  code_reference: string | null;
}

export interface ExtractedIndustryPermit {
  permit_type: string;
  category: string;
  description: string;
  zones_allowed: string[];
  zones_prohibited: string[];
  requirements: string[];
  fee_base: number | null;
  review_days: number | null;
  code_section: string | null;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Parse JSON from AI response, handling markdown code blocks
 */
function parseAIResponse<T>(text: string): T[] | { error: string; raw: string } {
  try {
    const jsonText = text
      .trim()
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '');
    return JSON.parse(jsonText);
  } catch (e) {
    return { error: 'Parse failed', raw: text };
  }
}

/**
 * Extract zoning districts from municipal code text
 */
export async function extractZoningDistricts(
  jurisdictionId: string,
  zoningCodeText: string
): Promise<ExtractedZone[] | { error: string; raw: string }> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [
      {
        role: 'user',
        content: `You are extracting zoning district regulations from a municipal code.

JURISDICTION: ${jurisdictionId}

MUNICIPAL CODE TEXT:
${zoningCodeText.substring(0, 50000)}

Extract ALL zoning districts mentioned into this exact JSON format. Be thorough.

[
  {
    "zone_code": "R-1",
    "zone_name": "Single Family Residential",
    "category": "residential",
    "description": "Low density single family residential district",
    "min_lot_sqft": 10000,
    "max_lot_coverage": 0.35,
    "max_height_ft": 35,
    "max_stories": 2.5,
    "front_setback_ft": 30,
    "side_setback_ft": 8,
    "rear_setback_ft": 30,
    "max_far": null,
    "allowed_uses": ["single_family", "home_occupation"],
    "conditional_uses": ["church", "school", "adu"],
    "prohibited_uses": ["commercial", "industrial", "multi_family"],
    "parking_required": "2 spaces per dwelling unit",
    "notes": "Any special conditions",
    "code_section": "Section 153.040",
    "confidence": "high"
  }
]

RULES:
- Extract EVERY district you find in the code
- Use null for values not specified
- category must be: residential, commercial, industrial, mixed, downtown, office, public, parks
- confidence: "high" if clearly stated, "medium" if inferred, "low" if uncertain
- Include the code section reference

Return ONLY valid JSON array, no other text.`,
      },
    ],
  });

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';
  return parseAIResponse<ExtractedZone>(text);
}

/**
 * Extract permit requirements from building code
 */
export async function extractPermitRequirements(
  jurisdictionId: string,
  buildingCodeText: string
): Promise<ExtractedPermit[] | { error: string; raw: string }> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [
      {
        role: 'user',
        content: `You are extracting permit requirements from a municipal code.

JURISDICTION: ${jurisdictionId}

MUNICIPAL CODE TEXT:
${buildingCodeText.substring(0, 50000)}

Extract ALL permit types into this JSON format:

[
  {
    "permit_type": "deck",
    "category": "building",
    "description": "Permit for deck construction or replacement",
    "required_for": "Decks over 200 sq ft or 30 inches above grade",
    "exemptions": "Decks under 200 sq ft and under 30 inches",
    "fee_base": 75.00,
    "fee_formula": "$75 base + $0.15 per square foot",
    "review_days": 5,
    "requires_plans": true,
    "requires_inspection": true,
    "inspection_types": ["footing", "framing", "final"],
    "code_section": "Section 105.2",
    "confidence": "high"
  }
]

CATEGORIES to look for:
- building: construction, additions, decks, fences, sheds, pools, demolition
- trade: electrical, plumbing, HVAC, roofing, mechanical
- commercial: tenant buildout, sign, change of use, occupancy
- license: business license, contractor, rental registration
- health: food service, pool, tattoo, massage
- special: driveway, sidewalk, special event, temporary

Return ONLY valid JSON array.`,
      },
    ],
  });

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';
  return parseAIResponse<ExtractedPermit>(text);
}

/**
 * Extract fee schedule
 */
export async function extractFeeSchedule(
  jurisdictionId: string,
  feeText: string
): Promise<ExtractedFee[] | { error: string; raw: string }> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `Extract the fee schedule into JSON format.

JURISDICTION: ${jurisdictionId}

FEE SCHEDULE TEXT:
${feeText.substring(0, 30000)}

Format:
[
  {
    "permit_type": "building_permit_residential",
    "description": "Residential building permit",
    "fee_type": "flat",
    "base_fee": 100.00,
    "per_sqft_fee": 0.25,
    "minimum_fee": 100.00,
    "maximum_fee": null,
    "notes": "Plan review additional 65%",
    "confidence": "high"
  }
]

fee_type options: "flat", "per_sqft", "percentage", "tiered", "calculated"

Return ONLY valid JSON array.`,
      },
    ],
  });

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';
  return parseAIResponse<ExtractedFee>(text);
}

/**
 * Extract building code chunks
 */
export async function extractBuildingCodes(
  jurisdictionId: string,
  codeText: string,
  codeType: string
): Promise<ExtractedCode[] | { error: string; raw: string }> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [
      {
        role: 'user',
        content: `Extract building code requirements into structured chunks.

JURISDICTION: ${jurisdictionId}
CODE TYPE: ${codeType}

CODE TEXT:
${codeText.substring(0, 50000)}

Format as practical chunks that answer common questions:
[
  {
    "code_type": "local",
    "section": "1419-09",
    "title": "Rear Yard Setback Requirements",
    "content": "Rear yards shall be provided as follows: (a) For residential districts, minimum 25 feet...",
    "keywords": ["setback", "rear yard", "residential"],
    "applies_to": ["residential", "commercial"],
    "confidence": "high"
  }
]

code_type: "local", "IBC", "IRC", "IPC", "IMC", "IFC", "state"

Focus on extractable, useful requirements. Skip boilerplate.

Return ONLY valid JSON array.`,
      },
    ],
  });

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';
  return parseAIResponse<ExtractedCode>(text);
}

/**
 * Generate common Q&A from extracted data
 */
export async function generateCommonQuestions(
  jurisdictionId: string,
  zones: ExtractedZone[],
  permits: ExtractedPermit[]
): Promise<ExtractedQuestion[] | { error: string; raw: string }> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `Generate common questions and answers for ${jurisdictionId}.

ZONING DATA:
${JSON.stringify(zones?.slice(0, 10), null, 2)}

PERMIT DATA:
${JSON.stringify(permits?.slice(0, 15), null, 2)}

Generate 15-20 practical Q&A pairs residents and businesses would ask:

[
  {
    "question": "Do I need a permit to build a deck?",
    "category": "deck",
    "answer": "Yes, decks require a building permit in ${jurisdictionId}. Decks over 200 sq ft or more than 30 inches above grade require a permit. The fee is $75 plus $0.15 per square foot. Plans showing dimensions and attachment to the house are required.",
    "related_permits": ["deck", "building_permit"],
    "code_reference": "Section 105.2"
  }
]

Cover these topics:
- Fence permits and height limits
- Deck permits
- Shed/accessory structures
- Home business rules
- Building height limits
- Business licenses
- Sign permits
- Rental registration

Return ONLY valid JSON array.`,
      },
    ],
  });

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';
  return parseAIResponse<ExtractedQuestion>(text);
}

/**
 * Extract industry-specific permits
 */
export async function extractIndustryPermits(
  jurisdictionId: string,
  codeText: string,
  industry: string
): Promise<ExtractedIndustryPermit[] | { error: string; raw: string }> {
  const industryPrompts: Record<string, string> = {
    food: 'Extract all food-related permits: restaurants, food trucks, health dept requirements, liquor licenses, cottage food, catering, mobile vendors.',
    beauty:
      'Extract all beauty/personal care permits: salons, barbershops, tattoo parlors, massage establishments, spas, nail salons.',
    pet: 'Extract all pet industry permits: grooming, boarding/kennels, veterinary clinics, pet stores, doggy daycares.',
    fitness:
      'Extract all fitness/wellness permits: gyms, pools, spas, yoga studios, martial arts, personal training.',
    childcare:
      'Extract all childcare/education permits: daycares, preschools, tutoring centers, private schools.',
    healthcare:
      'Extract all healthcare permits: medical offices, urgent care, pharmacies, labs, dental offices.',
    auto: 'Extract all auto industry permits: repair shops, dealerships, car washes, gas stations, body shops.',
    entertainment:
      'Extract all entertainment permits: event venues, theaters, nightclubs, arcades, bowling alleys.',
    religious:
      'Extract all religious facility requirements: churches, mosques, temples, religious schools.',
  };

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `Extract ${industry} industry permits from this municipal code.

JURISDICTION: ${jurisdictionId}

${industryPrompts[industry] || `Extract all ${industry} industry permits.`}

CODE TEXT:
${codeText.substring(0, 40000)}

Format:
[
  {
    "permit_type": "restaurant",
    "category": "${industry}",
    "description": "Restaurant food service establishment",
    "zones_allowed": ["CC-M", "CC-A", "DD-A"],
    "zones_prohibited": ["SF-*", "RM-*"],
    "requirements": ["Health dept license", "Building permit", "Sign permit"],
    "fee_base": 150.00,
    "review_days": 14,
    "code_section": "Section XXX",
    "confidence": "high"
  }
]

If no ${industry} permits are found, return empty array [].

Return ONLY valid JSON array.`,
      },
    ],
  });

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';
  return parseAIResponse<ExtractedIndustryPermit>(text);
}
