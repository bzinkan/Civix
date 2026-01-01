import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';

const prisma = new PrismaClient();

/**
 * Chat API with Image/Document Upload Support
 *
 * POST /api/chat
 *
 * Handles conversational queries with optional document attachments.
 * Uses Claude Vision to extract data from site plans, permits, etc.
 *
 * Request body:
 * {
 *   "message": "Does this deck plan meet zoning?",
 *   "address": "123 Main St, Cincinnati, OH",
 *   "attachments": [
 *     {
 *       "type": "image/png" | "image/jpeg" | "application/pdf",
 *       "data": "base64...",
 *       "filename": "site-plan.png"
 *     }
 *   ],
 *   "conversation_id": "optional - for continuing conversation",
 *   "confirm_extracted": { ... } // User-confirmed values from previous extraction
 * }
 */

interface Attachment {
  type: string;
  data: string;
  filename: string;
}

interface ExtractedValues {
  lot_width_ft: number | null;
  lot_depth_ft: number | null;
  lot_area_sqft: number | null;
  existing_footprint_sqft: number | null;
  project_footprint_sqft: number | null;
  project_type: string | null;
  front_setback_ft: number | null;
  rear_setback_ft: number | null;
  left_side_setback_ft: number | null;
  right_side_setback_ft: number | null;
  building_height_ft: number | null;
  confidence: 'high' | 'medium' | 'low';
  notes: string;
}

interface PropertyContext {
  address: string;
  zoning: {
    code: string;
    description: string;
  } | null;
  development_standards: {
    max_height_ft: number | null;
    setbacks: {
      front_ft: number | null;
      side_ft: number | null;
      rear_ft: number | null;
    };
    max_lot_coverage: number | null;
  } | null;
  overlays: {
    historic_district: string | null;
    hillside: boolean;
    urban_design: string | null;
    landslide_risk: string | null;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      address,
      attachments = [],
      conversation_id,
      confirm_extracted
    } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // If user is confirming extracted values, run compliance check
    if (confirm_extracted && address) {
      const complianceResult = await runComplianceCheck(address, confirm_extracted);
      return NextResponse.json({
        type: 'compliance_result',
        ...complianceResult
      });
    }

    // Get property context if address provided
    let propertyContext: PropertyContext | null = null;
    if (address) {
      propertyContext = await getPropertyContext(address);
    }

    // If attachments present, extract data from documents
    if (attachments.length > 0) {
      const extraction = await extractFromDocuments(attachments, propertyContext);

      if (extraction.success && extraction.values) {
        return NextResponse.json({
          type: 'extraction',
          message: 'I extracted these values from your document. Please confirm they are correct before I run the compliance check.',
          property: propertyContext,
          extracted_values: extraction.values,
          confidence: extraction.values.confidence,
          notes: extraction.values.notes,
          requires_confirmation: true
        });
      } else {
        return NextResponse.json({
          type: 'extraction_failed',
          message: extraction.error,
          suggestion: 'Please upload a document with labeled dimensions (site plan, survey, or architectural drawing), or provide the measurements directly.',
          property: propertyContext
        });
      }
    }

    // Regular chat - no attachments
    const response = await handleChatMessage(message, propertyContext, conversation_id);
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Extract measurements from uploaded documents using Claude Vision
 */
async function extractFromDocuments(
  attachments: Attachment[],
  propertyContext: PropertyContext | null
): Promise<{ success: boolean; values?: ExtractedValues; error?: string }> {

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Process first image attachment
  const imageAttachment = attachments.find(a =>
    a.type.startsWith('image/') || a.type === 'application/pdf'
  );

  if (!imageAttachment) {
    return {
      success: false,
      error: 'No supported image or PDF found. Please upload a site plan, survey, or architectural drawing.'
    };
  }

  // Determine media type
  let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/png';
  if (imageAttachment.type === 'image/jpeg') mediaType = 'image/jpeg';
  else if (imageAttachment.type === 'image/gif') mediaType = 'image/gif';
  else if (imageAttachment.type === 'image/webp') mediaType = 'image/webp';

  const contextInfo = propertyContext
    ? `Property: ${propertyContext.address}
Zone: ${propertyContext.zoning?.code || 'Unknown'}
Required setbacks: Front ${propertyContext.development_standards?.setbacks.front_ft || '?'}ft, Side ${propertyContext.development_standards?.setbacks.side_ft || '?'}ft, Rear ${propertyContext.development_standards?.setbacks.rear_ft || '?'}ft`
    : 'No property context available.';

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageAttachment.data,
            },
          },
          {
            type: 'text',
            text: `You are extracting dimensions from a site plan, survey, or architectural drawing for a zoning compliance check.

${contextInfo}

Extract any measurements you can find that are CLEARLY LABELED on the document.
DO NOT guess or estimate - only extract values that are explicitly shown.

Return ONLY valid JSON in this exact format:
{
  "lot_width_ft": <number or null>,
  "lot_depth_ft": <number or null>,
  "lot_area_sqft": <number or null>,
  "existing_footprint_sqft": <number or null>,
  "project_footprint_sqft": <number or null>,
  "project_type": <"deck" | "addition" | "shed" | "fence" | "pool" | "garage" | "other" | null>,
  "front_setback_ft": <number or null>,
  "rear_setback_ft": <number or null>,
  "left_side_setback_ft": <number or null>,
  "right_side_setback_ft": <number or null>,
  "building_height_ft": <number or null>,
  "confidence": <"high" | "medium" | "low">,
  "notes": "<any unclear items or missing info>"
}

Rules:
- Return null for any value not clearly shown
- "confidence" should be "high" only if the document is a professional drawing with clear labels
- "confidence" should be "low" if the image is unclear, hand-drawn, or a photo
- In "notes", mention anything that's ambiguous or that you couldn't find`
          }
        ]
      }]
    });

    // Parse the response
    const content = response.content[0];
    if (content.type !== 'text') {
      return { success: false, error: 'Unexpected response format from vision model' };
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        error: 'Could not extract structured data from this document. Please ensure it has clearly labeled dimensions.'
      };
    }

    const extracted: ExtractedValues = JSON.parse(jsonMatch[0]);

    // Check if we got meaningful data
    const hasUsefulData =
      extracted.front_setback_ft !== null ||
      extracted.rear_setback_ft !== null ||
      extracted.left_side_setback_ft !== null ||
      extracted.right_side_setback_ft !== null ||
      extracted.lot_area_sqft !== null ||
      extracted.project_footprint_sqft !== null;

    if (!hasUsefulData) {
      return {
        success: false,
        error: 'I couldn\'t find any measurable dimensions in this document. For a compliance check, I need at least setback distances or project dimensions.'
      };
    }

    return { success: true, values: extracted };

  } catch (error: any) {
    console.error('Vision extraction error:', error);
    return {
      success: false,
      error: 'Failed to analyze document. Please try a clearer image or provide measurements directly.'
    };
  }
}

/**
 * Run deterministic compliance check against zone rules
 */
async function runComplianceCheck(
  address: string,
  extractedValues: ExtractedValues
): Promise<{
  compliant: boolean;
  results: Array<{
    rule: string;
    required: number | string;
    actual: number | string;
    pass: boolean;
    difference?: number;
  }>;
  summary: string;
  next_steps: string[];
  forms_needed: string[];
}> {
  // Get property zoning data
  const propertyContext = await getPropertyContext(address);

  if (!propertyContext || !propertyContext.zoning || !propertyContext.development_standards) {
    return {
      compliant: false,
      results: [],
      summary: 'Could not determine zoning for this address.',
      next_steps: ['Verify the address is correct', 'Contact the zoning department'],
      forms_needed: []
    };
  }

  const standards = propertyContext.development_standards;
  const results: Array<{
    rule: string;
    required: number | string;
    actual: number | string;
    pass: boolean;
    difference?: number;
  }> = [];

  // Check front setback
  if (extractedValues.front_setback_ft !== null && standards.setbacks.front_ft !== null) {
    const pass = extractedValues.front_setback_ft >= standards.setbacks.front_ft;
    results.push({
      rule: 'Front Setback',
      required: `${standards.setbacks.front_ft} ft min`,
      actual: `${extractedValues.front_setback_ft} ft`,
      pass,
      difference: extractedValues.front_setback_ft - standards.setbacks.front_ft
    });
  }

  // Check rear setback
  if (extractedValues.rear_setback_ft !== null && standards.setbacks.rear_ft !== null) {
    const pass = extractedValues.rear_setback_ft >= standards.setbacks.rear_ft;
    results.push({
      rule: 'Rear Setback',
      required: `${standards.setbacks.rear_ft} ft min`,
      actual: `${extractedValues.rear_setback_ft} ft`,
      pass,
      difference: extractedValues.rear_setback_ft - standards.setbacks.rear_ft
    });
  }

  // Check side setbacks
  if (extractedValues.left_side_setback_ft !== null && standards.setbacks.side_ft !== null) {
    const pass = extractedValues.left_side_setback_ft >= standards.setbacks.side_ft;
    results.push({
      rule: 'Left Side Setback',
      required: `${standards.setbacks.side_ft} ft min`,
      actual: `${extractedValues.left_side_setback_ft} ft`,
      pass,
      difference: extractedValues.left_side_setback_ft - standards.setbacks.side_ft
    });
  }

  if (extractedValues.right_side_setback_ft !== null && standards.setbacks.side_ft !== null) {
    const pass = extractedValues.right_side_setback_ft >= standards.setbacks.side_ft;
    results.push({
      rule: 'Right Side Setback',
      required: `${standards.setbacks.side_ft} ft min`,
      actual: `${extractedValues.right_side_setback_ft} ft`,
      pass,
      difference: extractedValues.right_side_setback_ft - standards.setbacks.side_ft
    });
  }

  // Check height
  if (extractedValues.building_height_ft !== null && standards.max_height_ft !== null) {
    const pass = extractedValues.building_height_ft <= standards.max_height_ft;
    results.push({
      rule: 'Building Height',
      required: `${standards.max_height_ft} ft max`,
      actual: `${extractedValues.building_height_ft} ft`,
      pass,
      difference: standards.max_height_ft - extractedValues.building_height_ft
    });
  }

  // Check lot coverage
  if (extractedValues.lot_area_sqft && extractedValues.project_footprint_sqft &&
      extractedValues.existing_footprint_sqft !== null && standards.max_lot_coverage !== null) {
    const totalFootprint = (extractedValues.existing_footprint_sqft || 0) + extractedValues.project_footprint_sqft;
    const coverage = totalFootprint / extractedValues.lot_area_sqft;
    const pass = coverage <= standards.max_lot_coverage;
    results.push({
      rule: 'Lot Coverage',
      required: `${(standards.max_lot_coverage * 100).toFixed(0)}% max`,
      actual: `${(coverage * 100).toFixed(1)}%`,
      pass,
      difference: standards.max_lot_coverage - coverage
    });
  }

  // Determine overall compliance
  const compliant = results.length > 0 && results.every(r => r.pass);
  const failures = results.filter(r => !r.pass);

  // Build summary
  let summary: string;
  if (results.length === 0) {
    summary = 'Could not perform compliance check - insufficient data extracted.';
  } else if (compliant) {
    summary = `COMPLIANT - All ${results.length} checked requirements pass.`;
  } else {
    summary = `NOT COMPLIANT - ${failures.length} issue${failures.length > 1 ? 's' : ''} found.`;
  }

  // Determine next steps
  const next_steps: string[] = [];
  const forms_needed: string[] = [];

  if (!compliant && failures.length > 0) {
    for (const failure of failures) {
      if (failure.rule.includes('Setback') && failure.difference) {
        next_steps.push(`Move ${failure.rule.toLowerCase().replace(' setback', '')} of project ${Math.abs(failure.difference).toFixed(1)} ft to meet requirement`);
      }
      if (failure.rule === 'Building Height' && failure.difference) {
        next_steps.push(`Reduce height by ${Math.abs(failure.difference).toFixed(1)} ft`);
      }
      if (failure.rule === 'Lot Coverage') {
        next_steps.push('Reduce project footprint or apply for variance');
      }
    }
    next_steps.push('Or apply for a variance (approval not guaranteed)');
    forms_needed.push('Variance Application');
  }

  // Add standard forms
  if (extractedValues.project_type) {
    forms_needed.push('Building Permit Application');
    if (extractedValues.project_type === 'deck' && extractedValues.building_height_ft && extractedValues.building_height_ft > 30) {
      forms_needed.push('Structural Plans Required');
    }
  }

  // Check for historic district
  if (propertyContext.overlays.historic_district) {
    next_steps.unshift(`Note: Property is in ${propertyContext.overlays.historic_district} Historic District`);
    forms_needed.push('Certificate of Appropriateness Application');
  }

  return {
    compliant,
    results,
    summary,
    next_steps,
    forms_needed
  };
}

/**
 * Get property context for an address
 */
async function getPropertyContext(address: string): Promise<PropertyContext | null> {
  try {
    // Geocode the address
    const encodedAddress = encodeURIComponent(address);
    const geoResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&addressdetails=1&limit=1&countrycodes=us`,
      { headers: { 'User-Agent': 'Civix-Chat/1.0' } }
    );

    if (!geoResponse.ok) return null;

    const geoData = await geoResponse.json();
    if (!geoData || geoData.length === 0) return null;

    const location = geoData[0];
    const lat = parseFloat(location.lat);
    const lon = parseFloat(location.lon);

    // Find jurisdiction
    const addressDetails = location.address;
    const city = addressDetails.city || addressDetails.town || addressDetails.village;

    const jurisdiction = await prisma.jurisdiction.findFirst({
      where: {
        name: { contains: city || 'Cincinnati', mode: 'insensitive' },
      },
    });

    if (!jurisdiction) return {
      address,
      zoning: null,
      development_standards: null,
      overlays: { historic_district: null, hillside: false, urban_design: null, landslide_risk: null }
    };

    // Find zoning
    const parcels = await prisma.zoningParcel.findMany({
      where: { jurisdictionId: jurisdiction.id },
      select: { zoneCode: true, zoneDescription: true, geometry: true },
    });

    let zoning: { code: string; description: string } | null = null;
    for (const parcel of parcels) {
      if (!parcel.geometry) continue;
      const geometry = parcel.geometry as any;
      if (isPointInGeometry(lat, lon, geometry)) {
        zoning = {
          code: parcel.zoneCode,
          description: parcel.zoneDescription || getZoneDescription(parcel.zoneCode)
        };
        break;
      }
    }

    // Get development standards
    const development_standards = zoning ? getDevelopmentStandards(zoning.code) : null;

    // Check overlays
    const overlays = await getOverlays(jurisdiction.id, lat, lon);

    return {
      address,
      zoning,
      development_standards,
      overlays
    };
  } catch (error) {
    console.error('Error getting property context:', error);
    return null;
  }
}

/**
 * Check if point is in geometry
 */
function isPointInGeometry(lat: number, lon: number, geometry: any): boolean {
  if (!geometry || !geometry.type) return false;

  let polygons: number[][][] = [];
  if (geometry.type === 'Polygon') {
    polygons = [geometry.coordinates[0]];
  } else if (geometry.type === 'MultiPolygon') {
    polygons = geometry.coordinates.map((p: number[][][]) => p[0]);
  }

  for (const polygon of polygons) {
    if (pointInPolygon(lat, lon, polygon)) return true;
  }
  return false;
}

function pointInPolygon(lat: number, lon: number, polygon: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Get overlay districts
 */
async function getOverlays(jurisdictionId: string, lat: number, lon: number) {
  const result = { historic_district: null as string | null, hillside: false, urban_design: null as string | null, landslide_risk: null as string | null };

  const overlays = await prisma.overlayDistrict.findMany({
    where: { jurisdictionId },
    select: { overlayType: true, name: true, geometry: true, properties: true },
  });

  for (const overlay of overlays) {
    if (!overlay.geometry) continue;
    if (isPointInGeometry(lat, lon, overlay.geometry as any)) {
      const props = overlay.properties as any;
      switch (overlay.overlayType) {
        case 'historic': result.historic_district = props?.HD_NAME || overlay.name; break;
        case 'hillside': result.hillside = true; break;
        case 'urban_design': result.urban_design = props?.UD_NAME || overlay.name; break;
        case 'landslide':
          const p = props?.POTENTIAL;
          result.landslide_risk = p === 1 ? 'Low' : p === 2 ? 'Moderate' : p === 3 ? 'High' : null;
          break;
      }
    }
  }
  return result;
}

/**
 * Get zone description
 */
function getZoneDescription(code: string): string {
  const map: Record<string, string> = {
    'SF-4': 'Single-Family Residential (4,000 sq ft min lot)',
    'SF-6': 'Single-Family Residential (6,000 sq ft min lot)',
    'SF-10': 'Single-Family Residential (10,000 sq ft min lot)',
    'RM-1.2': 'Multi-Family Residential (1.2 FAR)',
    'DD-A': 'Downtown Development (Core)',
  };
  return map[code] || `Zoning District ${code}`;
}

/**
 * Get development standards for a zone
 */
function getDevelopmentStandards(zoneCode: string): {
  max_height_ft: number | null;
  setbacks: { front_ft: number | null; side_ft: number | null; rear_ft: number | null };
  max_lot_coverage: number | null;
} {
  const standards: Record<string, any> = {
    'SF-20': { max_height_ft: 35, setbacks: { front_ft: 35, side_ft: 10, rear_ft: 30 }, max_lot_coverage: 0.25 },
    'SF-10': { max_height_ft: 35, setbacks: { front_ft: 30, side_ft: 8, rear_ft: 25 }, max_lot_coverage: 0.30 },
    'SF-6': { max_height_ft: 35, setbacks: { front_ft: 25, side_ft: 5, rear_ft: 25 }, max_lot_coverage: 0.35 },
    'SF-4': { max_height_ft: 35, setbacks: { front_ft: 20, side_ft: 4, rear_ft: 20 }, max_lot_coverage: 0.40 },
    'SF-2': { max_height_ft: 35, setbacks: { front_ft: 10, side_ft: 3, rear_ft: 15 }, max_lot_coverage: 0.50 },
    'RM-0.7': { max_height_ft: 35, setbacks: { front_ft: 25, side_ft: 8, rear_ft: 25 }, max_lot_coverage: 0.40 },
    'RM-1.2': { max_height_ft: 45, setbacks: { front_ft: 20, side_ft: 8, rear_ft: 20 }, max_lot_coverage: 0.45 },
    'RM-2.0': { max_height_ft: 65, setbacks: { front_ft: 15, side_ft: 10, rear_ft: 15 }, max_lot_coverage: 0.50 },
    'DD-A': { max_height_ft: null, setbacks: { front_ft: 0, side_ft: 0, rear_ft: 0 }, max_lot_coverage: null },
    'DD-B': { max_height_ft: 200, setbacks: { front_ft: 0, side_ft: 0, rear_ft: 0 }, max_lot_coverage: null },
  };
  return standards[zoneCode] || { max_height_ft: null, setbacks: { front_ft: null, side_ft: null, rear_ft: null }, max_lot_coverage: null };
}

/**
 * Handle regular chat messages (no attachments)
 */
async function handleChatMessage(
  message: string,
  propertyContext: PropertyContext | null,
  conversationId?: string
): Promise<any> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const systemPrompt = `You are a helpful Cincinnati municipal regulations assistant. You help residents, contractors, and professionals understand zoning, permits, and city regulations.

${propertyContext ? `Current property context:
Address: ${propertyContext.address}
Zoning: ${propertyContext.zoning?.code || 'Unknown'} - ${propertyContext.zoning?.description || ''}
Historic District: ${propertyContext.overlays.historic_district || 'None'}
Hillside: ${propertyContext.overlays.hillside ? 'Yes' : 'No'}
Setbacks: Front ${propertyContext.development_standards?.setbacks.front_ft || '?'}ft, Side ${propertyContext.development_standards?.setbacks.side_ft || '?'}ft, Rear ${propertyContext.development_standards?.setbacks.rear_ft || '?'}ft
Max Height: ${propertyContext.development_standards?.max_height_ft || 'Unknown'}ft
Max Lot Coverage: ${propertyContext.development_standards?.max_lot_coverage ? (propertyContext.development_standards.max_lot_coverage * 100) + '%' : 'Unknown'}` : 'No property context provided.'}

Guidelines:
1. Be helpful and specific
2. If the user wants to check if a project is compliant, ask them to upload a site plan or provide measurements
3. Always mention if a property is in a historic district - this affects what they can do
4. Provide contact numbers when relevant: Building permits (513) 352-3276, Historic (513) 352-4822
5. If you're unsure, recommend they verify with the city`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: message }]
  });

  const content = response.content[0];

  return {
    type: 'chat',
    message: content.type === 'text' ? content.text : 'I apologize, I could not generate a response.',
    property: propertyContext
  };
}
