import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/zoning/lookup
 *
 * Look up zoning + overlays for an address using geocoding + point-in-polygon
 *
 * Request body:
 * {
 *   "address": "123 Main St, Cincinnati, OH"
 * }
 *
 * Response:
 * {
 *   "address": "123 Main St, Cincinnati, OH",
 *   "coordinates": { "latitude": 39.123, "longitude": -84.456 },
 *   "zoning": { "code": "SF-4", "description": "Single Family Residential" },
 *   "overlays": {
 *     "historic_district": "Over-the-Rhine" | null,
 *     "hillside": true | false,
 *     "urban_design": "Main Street" | null,
 *     "landslide_risk": "High" | "Moderate" | "Low" | null
 *   },
 *   "permits_required": ["Historic Conservation Board Review"],
 *   "jurisdiction": { "id": "...", "name": "Cincinnati", "state": "OH" }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Step 1: Geocode the address to get lat/lon
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

    // Step 2: Find the jurisdiction
    const jurisdiction = await prisma.jurisdiction.findFirst({
      where: {
        name: { contains: city, mode: 'insensitive' },
        state: { equals: state, mode: 'insensitive' },
      },
    });

    if (!jurisdiction) {
      return NextResponse.json(
        {
          error: `We don't have zoning data for ${city}, ${state} yet`,
          coordinates: { latitude, longitude },
          suggestion: 'Cincinnati, OH is currently the only supported city'
        },
        { status: 404 }
      );
    }

    // Step 3: Get all zoning parcels with geometry for this jurisdiction
    const parcels = await prisma.zoningParcel.findMany({
      where: {
        jurisdictionId: jurisdiction.id,
      },
      select: {
        id: true,
        zoneCode: true,
        zoneDescription: true,
        geometry: true,
      },
    });

    // Filter to only parcels with geometry
    const parcelsWithGeometry = parcels.filter(p => p.geometry !== null);

    // Step 4: Find which polygon contains the point
    const matchingParcel = findContainingPolygon(latitude, longitude, parcelsWithGeometry);

    // Step 5: Check overlay districts
    const overlays = await findOverlays(jurisdiction.id, latitude, longitude);

    // Step 6: Determine required permits based on overlays
    const permitsRequired = getRequiredPermits(overlays);

    if (!matchingParcel) {
      return NextResponse.json({
        address,
        coordinates: { latitude, longitude },
        zoning: null,
        overlays,
        permits_required: permitsRequired,
        jurisdiction: {
          id: jurisdiction.id,
          name: jurisdiction.name,
          state: jurisdiction.state,
        },
        message: 'Address geocoded but no matching zoning polygon found. The address may be outside the covered area.',
      });
    }

    // Get development standards for this zone
    const developmentStandards = getDevelopmentStandards(matchingParcel.zoneCode);

    return NextResponse.json({
      address,
      coordinates: { latitude, longitude },
      zoning: {
        code: matchingParcel.zoneCode,
        description: matchingParcel.zoneDescription || getZoneDescription(matchingParcel.zoneCode),
        development_standards: developmentStandards,
      },
      overlays,
      permits_required: permitsRequired,
      jurisdiction: {
        id: jurisdiction.id,
        name: jurisdiction.name,
        state: jurisdiction.state,
      },
    });

  } catch (error: any) {
    console.error('Zoning lookup error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Geocode address using Nominatim (OpenStreetMap)
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
      headers: {
        'User-Agent': 'Civix-App/1.0',
      },
    });

    if (!response.ok) {
      console.error('Nominatim API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return null;
    }

    const location = data[0];
    const addressDetails = location.address;

    const city =
      addressDetails.city ||
      addressDetails.town ||
      addressDetails.village ||
      addressDetails.municipality ||
      addressDetails.county?.replace(' County', '');

    const state = getStateAbbreviation(addressDetails.state) || addressDetails.state;

    if (!city || !state) {
      return null;
    }

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
 * Find which polygon contains the given point
 * Uses ray-casting algorithm for point-in-polygon detection
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

    // Handle different GeoJSON geometry types
    if (geometry.type === 'Polygon') {
      polygons = [geometry.coordinates[0]]; // Outer ring only
    } else if (geometry.type === 'MultiPolygon') {
      polygons = geometry.coordinates.map((poly: number[][][]) => poly[0]); // Outer ring of each polygon
    } else {
      continue;
    }

    // Check if point is in any of the polygons
    for (const polygon of polygons) {
      if (pointInPolygon(lat, lon, polygon)) {
        return {
          zoneCode: parcel.zoneCode,
          zoneDescription: parcel.zoneDescription,
        };
      }
    }
  }

  return null;
}

/**
 * Ray-casting algorithm to determine if a point is inside a polygon
 * Polygon coordinates are in [lon, lat] format (GeoJSON standard)
 */
function pointInPolygon(lat: number, lon: number, polygon: number[][]): boolean {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0]; // longitude
    const yi = polygon[i][1]; // latitude
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Get human-readable description for Cincinnati zone codes
 */
function getZoneDescription(zoneCode: string): string {
  const zoneDescriptions: Record<string, string> = {
    // Single Family Residential
    'SF-20': 'Single-Family Residential (20,000 sq ft min lot)',
    'SF-10': 'Single-Family Residential (10,000 sq ft min lot)',
    'SF-6': 'Single-Family Residential (6,000 sq ft min lot)',
    'SF-4': 'Single-Family Residential (4,000 sq ft min lot)',
    'SF-2': 'Single-Family Residential (2,000 sq ft min lot)',
    'SF-4-T': 'Single-Family Residential Transitional',
    'SF-6-T': 'Single-Family Residential Transitional',
    'SF-10-T': 'Single-Family Residential Transitional',
    'SF-4-MH': 'Single-Family Residential (Manufactured Housing)',

    // Multi-Family Residential
    'RM-0.7': 'Multi-Family Residential (0.7 FAR)',
    'RM-1.2': 'Multi-Family Residential (1.2 FAR)',
    'RM-2.0': 'Multi-Family Residential (2.0 FAR)',
    'RM-1.2-MH': 'Multi-Family Residential (Manufactured Housing)',
    'RMX': 'Residential Mixed-Use',
    'RMX-T': 'Residential Mixed-Use Transitional',

    // Commercial
    'CC-A': 'Commercial Community (Type A)',
    'CC-A-B': 'Commercial Community (Type A-B)',
    'CC-M': 'Commercial Community (Mixed)',
    'CC-P': 'Commercial Community (Pedestrian)',
    'CN-P': 'Commercial Neighborhood (Pedestrian)',
    'CG': 'Commercial General',
    'CG-A': 'Commercial General (Type A)',

    // Manufacturing/Industrial
    'MG': 'Manufacturing General',
    'ML': 'Manufacturing Light',

    // Special Districts
    'PR': 'Parks and Recreation',
    'PD': 'Planned Development',
    'DD-A': 'Downtown Development (Type A)',
    'DD-B': 'Downtown Development (Type B)',
    'DD-C': 'Downtown Development (Type C)',
    'MX': 'Mixed Use',
    'OL': 'Office/Limited',
  };

  return zoneDescriptions[zoneCode] || `Zoning District ${zoneCode}`;
}

/**
 * Get development standards (setbacks, height, etc.) for a zone code
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

function getDevelopmentStandards(zoneCode: string): DevelopmentStandards {
  const standards: Record<string, DevelopmentStandards> = {
    // Single Family Residential
    'SF-20': {
      max_height_ft: 35, max_stories: 2.5,
      setbacks: { front_ft: 35, side_ft: 10, rear_ft: 30 },
      max_lot_coverage: 0.25, max_far: null, min_lot_size_sqft: 20000,
      parking_notes: '2 spaces required'
    },
    'SF-10': {
      max_height_ft: 35, max_stories: 2.5,
      setbacks: { front_ft: 30, side_ft: 8, rear_ft: 25 },
      max_lot_coverage: 0.30, max_far: null, min_lot_size_sqft: 10000,
      parking_notes: '2 spaces required'
    },
    'SF-6': {
      max_height_ft: 35, max_stories: 2.5,
      setbacks: { front_ft: 25, side_ft: 5, rear_ft: 25 },
      max_lot_coverage: 0.35, max_far: null, min_lot_size_sqft: 6000,
      parking_notes: '2 spaces required'
    },
    'SF-4': {
      max_height_ft: 35, max_stories: 2.5,
      setbacks: { front_ft: 20, side_ft: 4, rear_ft: 20 },
      max_lot_coverage: 0.40, max_far: null, min_lot_size_sqft: 4000,
      parking_notes: '2 spaces required'
    },
    'SF-2': {
      max_height_ft: 35, max_stories: 2.5,
      setbacks: { front_ft: 10, side_ft: 3, rear_ft: 15 },
      max_lot_coverage: 0.50, max_far: null, min_lot_size_sqft: 2000,
      parking_notes: '2 spaces required'
    },
    // Multi-Family Residential
    'RM-0.7': {
      max_height_ft: 35, max_stories: 3,
      setbacks: { front_ft: 25, side_ft: 8, rear_ft: 25 },
      max_lot_coverage: 0.40, max_far: 0.7, min_lot_size_sqft: 6000,
      parking_notes: '1.5 spaces per unit'
    },
    'RM-1.2': {
      max_height_ft: 45, max_stories: 4,
      setbacks: { front_ft: 20, side_ft: 8, rear_ft: 20 },
      max_lot_coverage: 0.45, max_far: 1.2, min_lot_size_sqft: 6000,
      parking_notes: '1.5 spaces per unit'
    },
    'RM-2.0': {
      max_height_ft: 65, max_stories: 5,
      setbacks: { front_ft: 15, side_ft: 10, rear_ft: 15 },
      max_lot_coverage: 0.50, max_far: 2.0, min_lot_size_sqft: 6000,
      parking_notes: '1 space per unit, may be reduced'
    },
    // Commercial
    'CN-P': {
      max_height_ft: 35, max_stories: 3,
      setbacks: { front_ft: 0, side_ft: 0, rear_ft: 10 },
      max_lot_coverage: null, max_far: 1.0, min_lot_size_sqft: null,
      parking_notes: 'May be reduced or waived'
    },
    'CC-P': {
      max_height_ft: 45, max_stories: 4,
      setbacks: { front_ft: 0, side_ft: 0, rear_ft: 10 },
      max_lot_coverage: null, max_far: 2.0, min_lot_size_sqft: null,
      parking_notes: 'Reduced requirements'
    },
    'CC-A': {
      max_height_ft: 45, max_stories: 4,
      setbacks: { front_ft: 25, side_ft: 10, rear_ft: 20 },
      max_lot_coverage: null, max_far: 1.0, min_lot_size_sqft: null,
      parking_notes: 'Standard requirements'
    },
    'CC-M': {
      max_height_ft: 45, max_stories: 4,
      setbacks: { front_ft: 10, side_ft: 5, rear_ft: 15 },
      max_lot_coverage: null, max_far: 1.5, min_lot_size_sqft: null,
      parking_notes: 'Standard requirements'
    },
    'CG': {
      max_height_ft: 65, max_stories: 5,
      setbacks: { front_ft: 25, side_ft: 10, rear_ft: 20 },
      max_lot_coverage: null, max_far: 2.0, min_lot_size_sqft: null,
      parking_notes: 'Standard requirements'
    },
    // Downtown
    'DD-A': {
      max_height_ft: null, max_stories: null,
      setbacks: { front_ft: 0, side_ft: 0, rear_ft: 0 },
      max_lot_coverage: null, max_far: 12.0, min_lot_size_sqft: null,
      parking_notes: 'No minimum required'
    },
    'DD-B': {
      max_height_ft: 200, max_stories: null,
      setbacks: { front_ft: 0, side_ft: 0, rear_ft: 0 },
      max_lot_coverage: null, max_far: 8.0, min_lot_size_sqft: null,
      parking_notes: 'Reduced requirements'
    },
    'DD-C': {
      max_height_ft: 85, max_stories: null,
      setbacks: { front_ft: 0, side_ft: 0, rear_ft: 10 },
      max_lot_coverage: null, max_far: 4.0, min_lot_size_sqft: null,
      parking_notes: 'Standard requirements'
    },
    // Manufacturing
    'ML': {
      max_height_ft: 45, max_stories: null,
      setbacks: { front_ft: 25, side_ft: 10, rear_ft: 20 },
      max_lot_coverage: null, max_far: 1.0, min_lot_size_sqft: null,
      parking_notes: '1 per 2000 sq ft'
    },
    'MG': {
      max_height_ft: 65, max_stories: null,
      setbacks: { front_ft: 25, side_ft: 10, rear_ft: 25 },
      max_lot_coverage: null, max_far: 2.0, min_lot_size_sqft: null,
      parking_notes: '1 per 2000 sq ft'
    },
  };

  return standards[zoneCode] || {
    max_height_ft: null, max_stories: null,
    setbacks: { front_ft: null, side_ft: null, rear_ft: null },
    max_lot_coverage: null, max_far: null, min_lot_size_sqft: null,
    parking_notes: null
  };
}

/**
 * Convert state name to abbreviation
 */
function getStateAbbreviation(stateName: string): string | null {
  const stateMap: Record<string, string> = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
    'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
    'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
    'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
    'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
    'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
    'wisconsin': 'WI', 'wyoming': 'WY'
  };

  const normalized = stateName?.toLowerCase().trim();
  return stateMap[normalized] || null;
}

// ============================================================================
// OVERLAY DISTRICT FUNCTIONS
// ============================================================================

interface OverlayResult {
  historic_district: string | null;
  hillside: boolean;
  urban_design: string | null;
  landslide_risk: string | null;
}

/**
 * Find all overlay districts that contain the given point
 */
async function findOverlays(
  jurisdictionId: string,
  lat: number,
  lon: number
): Promise<OverlayResult> {
  const result: OverlayResult = {
    historic_district: null,
    hillside: false,
    urban_design: null,
    landslide_risk: null,
  };

  // Get all overlay districts for this jurisdiction
  const overlays = await prisma.overlayDistrict.findMany({
    where: { jurisdictionId },
    select: {
      overlayType: true,
      name: true,
      geometry: true,
      properties: true,
    },
  });

  // Check each overlay
  for (const overlay of overlays) {
    if (!overlay.geometry) continue;

    const geometry = overlay.geometry as any;
    if (!geometry.type) continue;

    // Check if point is in this overlay polygon
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
        // Found a match - update result based on overlay type
        switch (overlay.overlayType) {
          case 'historic':
            const props = overlay.properties as any;
            result.historic_district = props?.HD_NAME || overlay.name || 'Historic District';
            break;

          case 'hillside':
            result.hillside = true;
            break;

          case 'urban_design':
            const udProps = overlay.properties as any;
            result.urban_design = udProps?.UD_NAME || overlay.name || 'Urban Design District';
            break;

          case 'landslide':
            const lsProps = overlay.properties as any;
            const potential = lsProps?.POTENTIAL;
            // Convert numeric potential to readable string
            // 1 = Low, 2 = Moderate, 3 = High (based on CAGIS data)
            if (potential === 1) {
              result.landslide_risk = 'Low';
            } else if (potential === 2) {
              result.landslide_risk = 'Moderate';
            } else if (potential === 3) {
              result.landslide_risk = 'High';
            } else {
              result.landslide_risk = potential ? String(potential) : null;
            }
            break;
        }
        break; // Found match for this polygon, move to next overlay
      }
    }
  }

  return result;
}

/**
 * Determine what additional permits/reviews are required based on overlays
 */
function getRequiredPermits(overlays: OverlayResult): string[] {
  const permits: string[] = [];

  if (overlays.historic_district) {
    permits.push('Historic Conservation Board Review');
    permits.push('Certificate of Appropriateness (for exterior changes)');
  }

  if (overlays.hillside) {
    permits.push('Hillside Development Review');
    permits.push('Grading Permit (for any earth disturbance)');
  }

  if (overlays.urban_design) {
    permits.push('Urban Design Review');
  }

  if (overlays.landslide_risk && overlays.landslide_risk !== 'Low') {
    permits.push('Geotechnical Assessment Required');
    if (overlays.landslide_risk === 'High') {
      permits.push('Engineering Review for Foundation');
    }
  }

  return permits;
}
