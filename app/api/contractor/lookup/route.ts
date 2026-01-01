import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * Contractor Property Lookup API
 *
 * POST /api/contractor/lookup
 *
 * A unified endpoint for contractors that provides all regulatory information
 * needed for a project at a given address, including:
 * - Zoning code and development standards
 * - Historic district status and requirements
 * - Overlay districts (hillside, urban design, landslide)
 * - Required permits and reviews
 * - Key contacts
 *
 * Request body:
 * {
 *   "address": "123 Main St, Cincinnati, OH",
 *   "project_type": "renovation" | "new_construction" | "addition" | "tenant_improvement" | "demolition" (optional)
 * }
 */

interface DevelopmentStandards {
  max_height_ft: number | null;
  max_stories: number | null;
  setbacks: {
    front_ft: number | null;
    side_ft: number | null;
    rear_ft: number | null;
  };
  max_lot_coverage: number | null;
  max_far: number | null;
  min_lot_size_sqft: number | null;
  parking_notes: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const { address, project_type } = await request.json();

    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Step 1: Geocode the address
    const geocodeResult = await geocodeAddress(address);

    if (!geocodeResult) {
      return NextResponse.json(
        {
          error: 'Could not geocode address',
          suggestion: 'Please check the address spelling and try again'
        },
        { status: 404 }
      );
    }

    const { latitude, longitude, city, state } = geocodeResult;

    // Step 2: Find jurisdiction
    const jurisdiction = await prisma.jurisdiction.findFirst({
      where: {
        name: { contains: city, mode: 'insensitive' },
        state: { equals: state, mode: 'insensitive' },
      },
    });

    if (!jurisdiction) {
      return NextResponse.json(
        {
          error: `We don't have data for ${city}, ${state} yet`,
          coordinates: { latitude, longitude },
          supported_cities: ['Cincinnati, OH']
        },
        { status: 404 }
      );
    }

    // Step 3: Find zoning
    const parcels = await prisma.zoningParcel.findMany({
      where: { jurisdictionId: jurisdiction.id },
      select: {
        id: true,
        zoneCode: true,
        zoneDescription: true,
        geometry: true,
      },
    });

    const parcelsWithGeometry = parcels.filter(p => p.geometry !== null);
    const matchingParcel = findContainingPolygon(latitude, longitude, parcelsWithGeometry);

    // Step 4: Check overlay districts
    const overlays = await findOverlays(jurisdiction.id, latitude, longitude);

    // Step 5: Get development standards
    const zoneCode = matchingParcel?.zoneCode || null;
    const developmentStandards = zoneCode ? getDevelopmentStandards(zoneCode) : null;

    // Step 6: Determine required permits and reviews
    const requirements = determineRequirements(zoneCode, overlays, project_type);

    // Step 7: Load relevant rule data
    const ruleGuidance = loadRelevantRules(overlays, project_type);

    // Build response
    return NextResponse.json({
      address,
      coordinates: { latitude, longitude },

      // Zoning information
      zoning: matchingParcel ? {
        code: matchingParcel.zoneCode,
        description: matchingParcel.zoneDescription || getZoneDescription(matchingParcel.zoneCode),
        development_standards: developmentStandards,
      } : null,

      // Overlay status
      overlays: {
        historic_district: overlays.historic_district,
        is_historic: overlays.historic_district !== null,
        hillside_district: overlays.hillside,
        urban_design_district: overlays.urban_design,
        landslide_risk: overlays.landslide_risk,
      },

      // What the contractor needs to do
      requirements: {
        permits_required: requirements.permits,
        reviews_required: requirements.reviews,
        special_requirements: requirements.special,
        estimated_timeline: requirements.timeline,
      },

      // Guidance from rule files
      guidance: ruleGuidance,

      // Contacts
      contacts: {
        building_permits: '(513) 352-3276',
        zoning: '(513) 352-3276',
        historic_conservation: overlays.historic_district ? '(513) 352-4822' : null,
        inspections: '(513) 352-3276',
        fire_prevention: '(513) 352-2337',
        permit_office_address: '805 Central Avenue, Suite 500, Cincinnati, OH 45202',
        permit_office_hours: '8:00 AM - 4:00 PM, Monday-Friday',
      },

      // Jurisdiction info
      jurisdiction: {
        id: jurisdiction.id,
        name: jurisdiction.name,
        state: jurisdiction.state,
      },

      // Metadata
      metadata: {
        project_type: project_type || 'not specified',
        lookup_timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('Contractor lookup error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Geocode address using Nominatim
 */
async function geocodeAddress(address: string): Promise<{
  latitude: number;
  longitude: number;
  city: string;
  state: string;
} | null> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&addressdetails=1&limit=1&countrycodes=us`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Civix-Contractor-App/1.0' },
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data || data.length === 0) return null;

    const location = data[0];
    const addressDetails = location.address;

    const city =
      addressDetails.city ||
      addressDetails.town ||
      addressDetails.village ||
      addressDetails.municipality ||
      addressDetails.county?.replace(' County', '');

    const state = getStateAbbreviation(addressDetails.state) || addressDetails.state;

    if (!city || !state) return null;

    return {
      latitude: parseFloat(location.lat),
      longitude: parseFloat(location.lon),
      city,
      state,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Point in polygon check
 */
function pointInPolygon(lat: number, lon: number, polygon: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Find containing polygon
 */
function findContainingPolygon(
  lat: number,
  lon: number,
  parcels: Array<{ id: string; zoneCode: string; zoneDescription: string | null; geometry: any }>
): { zoneCode: string; zoneDescription: string | null } | null {
  for (const parcel of parcels) {
    const geometry = parcel.geometry as any;
    if (!geometry || !geometry.type) continue;

    let polygons: number[][][] = [];
    if (geometry.type === 'Polygon') {
      polygons = [geometry.coordinates[0]];
    } else if (geometry.type === 'MultiPolygon') {
      polygons = geometry.coordinates.map((poly: number[][][]) => poly[0]);
    } else {
      continue;
    }

    for (const polygon of polygons) {
      if (pointInPolygon(lat, lon, polygon)) {
        return { zoneCode: parcel.zoneCode, zoneDescription: parcel.zoneDescription };
      }
    }
  }
  return null;
}

interface OverlayResult {
  historic_district: string | null;
  hillside: boolean;
  urban_design: string | null;
  landslide_risk: string | null;
}

/**
 * Find overlay districts
 */
async function findOverlays(jurisdictionId: string, lat: number, lon: number): Promise<OverlayResult> {
  const result: OverlayResult = {
    historic_district: null,
    hillside: false,
    urban_design: null,
    landslide_risk: null,
  };

  const overlays = await prisma.overlayDistrict.findMany({
    where: { jurisdictionId },
    select: { overlayType: true, name: true, geometry: true, properties: true },
  });

  for (const overlay of overlays) {
    if (!overlay.geometry) continue;
    const geometry = overlay.geometry as any;
    if (!geometry.type) continue;

    let polygons: number[][][] = [];
    if (geometry.type === 'Polygon') {
      polygons = [geometry.coordinates[0]];
    } else if (geometry.type === 'MultiPolygon') {
      polygons = geometry.coordinates.map((poly: number[][][]) => poly[0]);
    } else {
      continue;
    }

    for (const polygon of polygons) {
      if (pointInPolygon(lat, lon, polygon)) {
        const props = overlay.properties as any;
        switch (overlay.overlayType) {
          case 'historic':
            result.historic_district = props?.HD_NAME || overlay.name || 'Historic District';
            break;
          case 'hillside':
            result.hillside = true;
            break;
          case 'urban_design':
            result.urban_design = props?.UD_NAME || overlay.name || 'Urban Design District';
            break;
          case 'landslide':
            const potential = props?.POTENTIAL;
            if (potential === 1) result.landslide_risk = 'Low';
            else if (potential === 2) result.landslide_risk = 'Moderate';
            else if (potential === 3) result.landslide_risk = 'High';
            break;
        }
        break;
      }
    }
  }

  return result;
}

/**
 * Determine required permits and reviews
 */
function determineRequirements(
  zoneCode: string | null,
  overlays: OverlayResult,
  projectType?: string
): {
  permits: string[];
  reviews: string[];
  special: string[];
  timeline: string;
} {
  const permits: string[] = [];
  const reviews: string[] = [];
  const special: string[] = [];
  let timeline = '2-4 weeks for permit approval';

  // Base permits based on project type
  if (projectType === 'new_construction') {
    permits.push('Building Permit', 'Zoning Certificate', 'Electrical Permit', 'Plumbing Permit', 'Mechanical Permit');
    reviews.push('Plan Review');
    timeline = '4-8 weeks for plan review and permit approval';
  } else if (projectType === 'addition') {
    permits.push('Building Permit', 'Zoning Certificate');
    reviews.push('Plan Review');
    timeline = '3-6 weeks';
  } else if (projectType === 'renovation' || projectType === 'tenant_improvement') {
    permits.push('Building Permit');
    if (projectType === 'tenant_improvement') {
      permits.push('Zoning Certificate');
    }
    timeline = '2-4 weeks';
  } else if (projectType === 'demolition') {
    permits.push('Demolition Permit');
    special.push('Asbestos survey required before demolition');
    special.push('Utility disconnection proof required');
    timeline = '2-3 weeks';
  } else {
    // Generic - assume renovation
    permits.push('Building Permit (scope-dependent)');
  }

  // Historic district requirements
  if (overlays.historic_district) {
    reviews.push('Historic Conservation Board Review');
    permits.push('Certificate of Appropriateness');
    special.push(`Property is in ${overlays.historic_district} Historic District`);
    special.push('Exterior changes must follow Secretary of Interior Standards');
    special.push('Window and door replacements require approval');
    timeline = '6-10 weeks (includes HCB meeting schedule)';
  }

  // Hillside requirements
  if (overlays.hillside) {
    reviews.push('Hillside Development Review');
    permits.push('Grading Permit');
    special.push('Geotechnical report may be required');
    special.push('Tree preservation plan required');
    if (timeline.includes('2-4')) timeline = '4-6 weeks';
  }

  // Urban design requirements
  if (overlays.urban_design) {
    reviews.push('Urban Design Review Board');
    special.push(`Property is in ${overlays.urban_design} Urban Design District`);
    special.push('Exterior design must be approved');
  }

  // Landslide risk
  if (overlays.landslide_risk === 'High') {
    special.push('HIGH LANDSLIDE RISK - Geotechnical assessment required');
    special.push('Engineering review for foundation required');
    reviews.push('Geotechnical Review');
  } else if (overlays.landslide_risk === 'Moderate') {
    special.push('Moderate landslide risk - Geotechnical assessment recommended');
  }

  return { permits, reviews, special, timeline };
}

/**
 * Get zone description
 */
function getZoneDescription(zoneCode: string): string {
  const descriptions: Record<string, string> = {
    'SF-20': 'Single-Family Residential (20,000 sq ft min lot)',
    'SF-10': 'Single-Family Residential (10,000 sq ft min lot)',
    'SF-6': 'Single-Family Residential (6,000 sq ft min lot)',
    'SF-4': 'Single-Family Residential (4,000 sq ft min lot)',
    'SF-2': 'Single-Family Residential (2,000 sq ft min lot)',
    'RM-0.7': 'Multi-Family Residential (0.7 FAR)',
    'RM-1.2': 'Multi-Family Residential (1.2 FAR)',
    'RM-2.0': 'Multi-Family Residential (2.0 FAR)',
    'CC-A': 'Commercial Community (Type A)',
    'CC-M': 'Commercial Community (Mixed)',
    'CC-P': 'Commercial Community (Pedestrian)',
    'CN-P': 'Commercial Neighborhood (Pedestrian)',
    'CG': 'Commercial General',
    'MG': 'Manufacturing General',
    'ML': 'Manufacturing Light',
    'DD-A': 'Downtown Development (Type A - Core)',
    'DD-B': 'Downtown Development (Type B)',
    'DD-C': 'Downtown Development (Type C - Transition)',
  };
  return descriptions[zoneCode] || `Zoning District ${zoneCode}`;
}

/**
 * Get development standards
 */
function getDevelopmentStandards(zoneCode: string): DevelopmentStandards {
  const standards: Record<string, DevelopmentStandards> = {
    'SF-20': { max_height_ft: 35, max_stories: 2.5, setbacks: { front_ft: 35, side_ft: 10, rear_ft: 30 }, max_lot_coverage: 0.25, max_far: null, min_lot_size_sqft: 20000, parking_notes: '2 spaces required' },
    'SF-10': { max_height_ft: 35, max_stories: 2.5, setbacks: { front_ft: 30, side_ft: 8, rear_ft: 25 }, max_lot_coverage: 0.30, max_far: null, min_lot_size_sqft: 10000, parking_notes: '2 spaces required' },
    'SF-6': { max_height_ft: 35, max_stories: 2.5, setbacks: { front_ft: 25, side_ft: 5, rear_ft: 25 }, max_lot_coverage: 0.35, max_far: null, min_lot_size_sqft: 6000, parking_notes: '2 spaces required' },
    'SF-4': { max_height_ft: 35, max_stories: 2.5, setbacks: { front_ft: 20, side_ft: 4, rear_ft: 20 }, max_lot_coverage: 0.40, max_far: null, min_lot_size_sqft: 4000, parking_notes: '2 spaces required' },
    'SF-2': { max_height_ft: 35, max_stories: 2.5, setbacks: { front_ft: 10, side_ft: 3, rear_ft: 15 }, max_lot_coverage: 0.50, max_far: null, min_lot_size_sqft: 2000, parking_notes: '2 spaces required' },
    'RM-0.7': { max_height_ft: 35, max_stories: 3, setbacks: { front_ft: 25, side_ft: 8, rear_ft: 25 }, max_lot_coverage: 0.40, max_far: 0.7, min_lot_size_sqft: 6000, parking_notes: '1.5 spaces per unit' },
    'RM-1.2': { max_height_ft: 45, max_stories: 4, setbacks: { front_ft: 20, side_ft: 8, rear_ft: 20 }, max_lot_coverage: 0.45, max_far: 1.2, min_lot_size_sqft: 6000, parking_notes: '1.5 spaces per unit' },
    'RM-2.0': { max_height_ft: 65, max_stories: 5, setbacks: { front_ft: 15, side_ft: 10, rear_ft: 15 }, max_lot_coverage: 0.50, max_far: 2.0, min_lot_size_sqft: 6000, parking_notes: '1 space per unit' },
    'DD-A': { max_height_ft: null, max_stories: null, setbacks: { front_ft: 0, side_ft: 0, rear_ft: 0 }, max_lot_coverage: null, max_far: 12.0, min_lot_size_sqft: null, parking_notes: 'No minimum required' },
    'DD-B': { max_height_ft: 200, max_stories: null, setbacks: { front_ft: 0, side_ft: 0, rear_ft: 0 }, max_lot_coverage: null, max_far: 8.0, min_lot_size_sqft: null, parking_notes: 'Reduced requirements' },
    'DD-C': { max_height_ft: 85, max_stories: null, setbacks: { front_ft: 0, side_ft: 0, rear_ft: 10 }, max_lot_coverage: null, max_far: 4.0, min_lot_size_sqft: null, parking_notes: 'Standard requirements' },
  };
  return standards[zoneCode] || { max_height_ft: null, max_stories: null, setbacks: { front_ft: null, side_ft: null, rear_ft: null }, max_lot_coverage: null, max_far: null, min_lot_size_sqft: null, parking_notes: null };
}

/**
 * Get state abbreviation
 */
function getStateAbbreviation(stateName: string): string | null {
  const states: Record<string, string> = {
    'ohio': 'OH', 'kentucky': 'KY', 'indiana': 'IN',
  };
  return states[stateName?.toLowerCase()] || null;
}

/**
 * Load relevant guidance from rule files
 */
function loadRelevantRules(overlays: OverlayResult, projectType?: string): any {
  const guidance: any = {};

  try {
    const rulesDir = path.join(process.cwd(), 'data', 'rules', 'cincinnati');

    // Load building permits guidance
    const buildingPermitsPath = path.join(rulesDir, 'building-permits.json');
    if (fs.existsSync(buildingPermitsPath)) {
      const buildingPermits = JSON.parse(fs.readFileSync(buildingPermitsPath, 'utf-8'));
      guidance.permit_process = buildingPermits.application_process;
      guidance.fees = buildingPermits.fees;
      guidance.inspections = buildingPermits.inspections;
    }

    // If historic, load historic guidance
    if (overlays.historic_district) {
      const buildingPermitsPath = path.join(rulesDir, 'building-permits.json');
      if (fs.existsSync(buildingPermitsPath)) {
        const buildingPermits = JSON.parse(fs.readFileSync(buildingPermitsPath, 'utf-8'));
        guidance.historic_requirements = buildingPermits.historic_properties;
      }
    }

    // Load renovation guidance if applicable
    if (projectType === 'renovation' || projectType === 'tenant_improvement') {
      const renovationsPath = path.join(rulesDir, 'renovations.json');
      if (fs.existsSync(renovationsPath)) {
        const renovations = JSON.parse(fs.readFileSync(renovationsPath, 'utf-8'));
        guidance.renovation_tips = renovations.tips_for_contractors;
        guidance.code_compliance = renovations.code_compliance;
      }
    }

  } catch (error) {
    console.error('Error loading rule guidance:', error);
  }

  return guidance;
}
