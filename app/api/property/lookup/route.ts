import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';

// Zone classification helper
function classifyZone(zone: string): string {
  if (/^SF|^RM-|^RMX/i.test(zone)) return 'residential';
  if (/^CN|^CC/i.test(zone)) return 'commercial';
  if (/^DD/i.test(zone)) return 'downtown';
  if (/^MG|^ML/i.test(zone)) return 'industrial';
  if (/^OL/i.test(zone)) return 'office';
  if (/^PF/i.test(zone)) return 'public';
  if (/^PR/i.test(zone)) return 'parks';
  return 'commercial';
}

// Point-in-polygon using ray casting algorithm
function pointInPolygon(lat: number, lon: number, geometry: any): boolean {
  if (!geometry || !geometry.coordinates) return false;

  // Handle both Polygon and MultiPolygon
  const polygons = geometry.type === 'MultiPolygon'
    ? geometry.coordinates
    : [geometry.coordinates];

  for (const polygon of polygons) {
    const ring = polygon[0]; // Outer ring
    if (!ring) continue;

    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];

      const intersect = ((yi > lat) !== (yj > lat))
        && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);

      if (intersect) inside = !inside;
    }

    if (inside) return true;
  }

  return false;
}

// Get human-readable zone name from code
function getZoneName(zoneCode: string): string {
  const zoneNames: Record<string, string> = {
    'SF-20': 'Single Family Residential (20,000 sq ft min)',
    'SF-10': 'Single Family Residential (10,000 sq ft min)',
    'SF-6': 'Single Family Residential (6,000 sq ft min)',
    'SF-4': 'Single Family Residential (4,000 sq ft min)',
    'SF-2': 'Single Family Residential (2,000 sq ft min)',
    'RM-0.7': 'Multi-Family Residential (Low Density)',
    'RM-1.2': 'Multi-Family Residential (Medium Density)',
    'RM-2.0': 'Multi-Family Residential (High Density)',
    'RMX': 'Residential Mixed Use',
    'CN-P': 'Neighborhood Commercial (Pedestrian)',
    'CN-M': 'Neighborhood Commercial (Mixed)',
    'CC-P': 'Community Commercial (Pedestrian)',
    'CC-M': 'Community Commercial (Mixed)',
    'CC-A': 'Community Commercial (Auto-Oriented)',
    'DD-A': 'Downtown Development (Core)',
    'DD-B': 'Downtown Development (Mixed)',
    'DD-C': 'Downtown Development (Edge)',
    'MG': 'General Industrial',
    'ML': 'Light Industrial',
    'OL': 'Office/Limited',
    'PF': 'Public Facilities',
    'PR': 'Parks and Recreation',
    'PD': 'Planned Development',
  };

  // Try exact match first
  if (zoneNames[zoneCode]) return zoneNames[zoneCode];

  // Try base code (e.g., SF-4-T -> SF-4)
  const baseCode = zoneCode.split('-').slice(0, 2).join('-');
  if (zoneNames[baseCode]) return zoneNames[baseCode];

  return zoneCode;
}

// Development standards by zone type
const ZONE_STANDARDS: Record<string, any> = {
  'SF-20': { minLot: 20000, frontSetback: 40, sideSetback: 10, rearSetback: 25, maxHeight: 35, maxCoverage: 0.35 },
  'SF-10': { minLot: 10000, frontSetback: 30, sideSetback: 8, rearSetback: 25, maxHeight: 35, maxCoverage: 0.40 },
  'SF-6': { minLot: 6000, frontSetback: 25, sideSetback: 5, rearSetback: 25, maxHeight: 35, maxCoverage: 0.45 },
  'SF-4': { minLot: 4000, frontSetback: 20, sideSetback: 4, rearSetback: 20, maxHeight: 35, maxCoverage: 0.50 },
  'SF-2': { minLot: 2000, frontSetback: 15, sideSetback: 3, rearSetback: 15, maxHeight: 35, maxCoverage: 0.60 },
  'RM-0.7': { minLot: 7000, frontSetback: 25, sideSetback: 5, rearSetback: 25, maxHeight: 35, maxCoverage: 0.45 },
  'RM-1.2': { minLot: 5000, frontSetback: 20, sideSetback: 5, rearSetback: 25, maxHeight: 45, maxCoverage: 0.50 },
  'RM-2.0': { minLot: 4000, frontSetback: 15, sideSetback: 5, rearSetback: 20, maxHeight: 55, maxCoverage: 0.55 },
  'RMX': { minLot: 3000, frontSetback: 10, sideSetback: 0, rearSetback: 15, maxHeight: 45, maxCoverage: 0.65 },
  'CN-P': { minLot: 0, frontSetback: 0, sideSetback: 0, rearSetback: 15, maxHeight: 35, maxCoverage: 0.70 },
  'CN-M': { minLot: 0, frontSetback: 0, sideSetback: 0, rearSetback: 15, maxHeight: 45, maxCoverage: 0.75 },
  'CC-P': { minLot: 0, frontSetback: 0, sideSetback: 0, rearSetback: 15, maxHeight: 45, maxCoverage: 0.80 },
  'CC-M': { minLot: 0, frontSetback: 0, sideSetback: 0, rearSetback: 0, maxHeight: 65, maxCoverage: 0.85 },
  'CC-A': { minLot: 0, frontSetback: 0, sideSetback: 0, rearSetback: 0, maxHeight: 85, maxCoverage: 0.90 },
  'DD-A': { minLot: 0, frontSetback: 0, sideSetback: 0, rearSetback: 0, maxHeight: 0, maxCoverage: 1.0, far: 12 },
  'DD-B': { minLot: 0, frontSetback: 0, sideSetback: 0, rearSetback: 0, maxHeight: 0, maxCoverage: 1.0, far: 8 },
  'DD-C': { minLot: 0, frontSetback: 0, sideSetback: 0, rearSetback: 0, maxHeight: 85, maxCoverage: 1.0, far: 5 },
  'MG': { minLot: 10000, frontSetback: 30, sideSetback: 10, rearSetback: 20, maxHeight: 45, maxCoverage: 0.60 },
  'ML': { minLot: 20000, frontSetback: 40, sideSetback: 15, rearSetback: 25, maxHeight: 55, maxCoverage: 0.50 },
};

// List of supported jurisdictions (live or in_progress)
// Covers 7 counties: Hamilton, Butler, Clermont, Warren (OH) and Boone, Campbell, Kenton (KY)
const SUPPORTED_JURISDICTIONS = [
  // Hamilton County, OH
  'cincinnati-oh',
  'blue-ash-oh',
  'norwood-oh',
  'madeira-oh',
  'deer-park-oh',
  'springdale-oh',
  'reading-oh',
  'sharonville-oh',
  'montgomery-oh',
  'forest-park-oh',
  'indian-hill-oh',
  'mariemont-oh',
  'wyoming-oh',
  'glendale-oh',
  'evendale-oh',
  'silverton-oh',
  'golf-manor-oh',
  'lincoln-heights-oh',
  'lockland-oh',
  'woodlawn-oh',
  'amberley-village-oh',
  // Butler County, OH
  'hamilton-oh',
  'fairfield-oh',
  'middletown-oh',
  'oxford-oh',
  'trenton-oh',
  'monroe-oh',
  // Warren County, OH
  'mason-oh',
  'loveland-oh',
  'lebanon-oh',
  'franklin-oh',
  'springboro-oh',
  // Clermont County, OH
  'milford-oh',
  'batavia-oh',
  // Boone County, KY
  'florence-ky',
  'union-ky',
  'walton-ky',
  'burlington-ky',
  'hebron-ky',
  // Campbell County, KY
  'newport-ky',
  'fort-thomas-ky',
  'bellevue-ky',
  'dayton-ky',
  'highland-heights-ky',
  'cold-spring-ky',
  'alexandria-ky',
  // Kenton County, KY
  'covington-ky',
  'erlanger-ky',
  'independence-ky',
  'edgewood-ky',
  'fort-mitchell-ky',
  'villa-hills-ky',
  'crestview-hills-ky',
  'lakeside-park-ky',
  'taylor-mill-ky',
  'elsmere-ky',
  'southgate-ky',
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const requestedJurisdictionId = searchParams.get('jurisdictionId');

    if (!address) {
      return NextResponse.json({ success: false, error: 'Address is required' }, { status: 400 });
    }

    // Step 1: Geocode the address
    let lat: number | null = null;
    let lon: number | null = null;
    let formattedAddress = address;
    let city = 'Cincinnati';
    let state = 'OH';
    let county: string | undefined;

    try {
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=us&limit=1&addressdetails=1`;
      const geocodeRes = await fetch(geocodeUrl, {
        headers: { 'User-Agent': 'Civix/2.0' }
      });
      const geocodeData = await geocodeRes.json();

      if (geocodeData && geocodeData.length > 0) {
        lat = parseFloat(geocodeData[0].lat);
        lon = parseFloat(geocodeData[0].lon);
        formattedAddress = geocodeData[0].display_name;

        // Extract address details
        const addressDetails = geocodeData[0].address;
        if (addressDetails) {
          city = addressDetails.city || addressDetails.town || addressDetails.village || addressDetails.municipality || 'Cincinnati';
          state = addressDetails.state || 'Ohio';
          county = addressDetails.county;
        }

        // Extract city from display name as fallback
        if (!addressDetails?.city) {
          const parts = formattedAddress.split(',');
          if (parts.length > 2) {
            city = parts[parts.length - 3]?.trim() || 'Cincinnati';
          }
        }
      }
    } catch (e) {
      console.error('Geocoding error:', e);
    }

    // Step 2: Determine jurisdiction ID
    const stateShort = state.length > 2 ? getStateAbbreviation(state) : state.toUpperCase();
    const jurisdictionId = requestedJurisdictionId || generateJurisdictionId(city, stateShort);

    // Step 3: Check if jurisdiction is supported
    let jurisdiction = await prisma.jurisdiction.findFirst({
      where: { id: jurisdictionId },
    });

    const isSupported = jurisdiction?.status === 'live' || SUPPORTED_JURISDICTIONS.includes(jurisdictionId);

    // If not supported, return waitlist info
    if (!isSupported) {
      // Get waitlist count
      const waitlistCount = await prisma.waitlist.count({
        where: { jurisdictionId },
      });

      return NextResponse.json({
        success: true,
        supported: false,
        jurisdictionId,
        city,
        state: stateShort,
        county,
        address: formattedAddress,
        waitlistCount,
        message: `${city}, ${stateShort} is coming soon!`,
      });
    }

    // Step 4: Look up zoning from database using point-in-polygon
    let zoneCode = 'SF-4';
    let zoneName = 'Single Family Residential';
    let zoneType = 'residential';
    let parcelId: string | null = null;
    let zoneSource = 'default';
    let countyName: string | null = null;

    try {
      if (lat && lon) {
        // First try: Look up in jurisdiction-level ZoningParcel table
        // Use raw SQL because Prisma doesn't support filtering JSON for non-null
        const zonePolygons = await prisma.$queryRaw<Array<{
          id: string;
          zoneCode: string;
          zoneDescription: string | null;
          parcelId: string | null;
          geometry: any;
        }>>`
          SELECT id, "zoneCode", "zoneDescription", "parcelId", geometry
          FROM "ZoningParcel"
          WHERE "jurisdictionId" = ${jurisdictionId}
            AND geometry IS NOT NULL
        `;

        // Find which polygon contains this point
        for (const polygon of zonePolygons) {
          if (polygon.geometry && pointInPolygon(lat, lon, polygon.geometry)) {
            zoneCode = polygon.zoneCode;
            zoneName = polygon.zoneDescription || getZoneName(zoneCode);
            zoneType = classifyZone(zoneCode);
            parcelId = polygon.parcelId;
            zoneSource = 'jurisdiction';
            break;
          }
        }

        // Second try: Look up in county-level ZoningPolygon table if no match found
        if (zoneSource === 'default') {
          // Find county by name from geocoding result
          const countyRecord = county ? await prisma.county.findFirst({
            where: {
              OR: [
                { name: { contains: county.replace(' County', ''), mode: 'insensitive' } },
                { name: county },
              ],
            },
          }) : null;

          if (countyRecord) {
            countyName = countyRecord.name;

            // Use raw SQL to query county polygons with bounding box filter
            // This avoids loading 175K polygons into memory
            const tolerance = 0.01; // ~1km bounding box filter
            const countyPolygons = await prisma.$queryRaw<Array<{
              id: string;
              zoneCode: string;
              zoneDescription: string | null;
              geometry: any;
            }>>`
              SELECT id, "zoneCode", "zoneDescription", geometry
              FROM "ZoningPolygon"
              WHERE "countyId" = ${countyRecord.id}
                AND latitude IS NOT NULL
                AND longitude IS NOT NULL
                AND latitude BETWEEN ${lat - tolerance} AND ${lat + tolerance}
                AND longitude BETWEEN ${lon - tolerance} AND ${lon + tolerance}
            `;

            // Check each polygon with point-in-polygon
            for (const polygon of countyPolygons) {
              if (polygon.geometry && pointInPolygon(lat, lon, polygon.geometry)) {
                zoneCode = polygon.zoneCode;
                zoneName = polygon.zoneDescription || getZoneName(zoneCode);
                zoneType = classifyZone(zoneCode);
                zoneSource = 'county';
                break;
              }
            }
          }
        }

        // Log if still no match found
        if (zoneSource === 'default') {
          console.log(`No zone polygon found for coordinates: ${lat}, ${lon} (county: ${county || 'unknown'})`);
        }
      }

      // Fallback: Try to look up zoning district for zone name
      if (zoneSource !== 'default') {
        const district = await prisma.zoningDistrict.findFirst({
          where: {
            jurisdictionId,
            code: zoneCode,
          },
        });

        if (district) {
          zoneName = district.name || zoneName;
          zoneType = district.category || zoneType;
        }
      }
    } catch (e) {
      console.error('Database lookup error:', e);
    }

    // Step 5: Check for overlay districts
    const overlays: string[] = [];
    const constraints: string[] = [];

    try {
      if (lat && lon) {
        // Check overlays from database
        const overlayDistricts = await prisma.overlayDistrict.findMany({
          where: {
            jurisdictionId,
          },
        });

        // Simple check - in production would do proper point-in-polygon
        for (const overlay of overlayDistricts) {
          if (overlay.geometry) {
            // Simplified - just checking if we have historic districts
            if (overlay.overlayType === 'historic') {
              // Check if address contains certain neighborhoods
              const historicNeighborhoods = ['Over-the-Rhine', 'Mt. Adams', 'Hyde Park', 'Clifton'];
              for (const neighborhood of historicNeighborhoods) {
                if (address.toLowerCase().includes(neighborhood.toLowerCase())) {
                  overlays.push(`Historic District: ${overlay.name}`);
                  constraints.push('Historic Review Required');
                  break;
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('Overlay lookup error:', e);
    }

    // Step 6: Get development standards
    const standards = ZONE_STANDARDS[zoneCode] || ZONE_STANDARDS['SF-4'];

    // Step 7: Build property response
    const property = {
      address: formattedAddress,
      city,
      state: stateShort,
      county: county || countyName,
      cityId: jurisdictionId,
      parcelId,
      zone: zoneCode,
      zoneName,
      zoneType,
      zoneSource, // 'jurisdiction' = from jurisdiction data, 'county' = from county data, 'default' = fallback
      outsideCityLimits: zoneSource === 'county', // True if zone came from county-level data (not jurisdiction)
      coordinates: lat && lon ? { lat, lon } : null,
      overlays,
      constraints: constraints.length > 0 ? constraints : ['None'],
      councilDistrict: 'District 1', // Would look this up in production
      councilRep: 'Council Member', // Would look this up in production
      schoolDistrict: getSchoolDistrict(city, county || countyName), // Lookup school district
      lotSize: null, // Would come from parcel data
      yearBuilt: null, // Would come from county assessor
      isVacant: false,
      trashDay: zoneType === 'residential' ? 'Wednesday' : undefined,
      parkingRatio: zoneType === 'commercial' ? '1 per 300 sq ft' : undefined,
      far: standards.far,
      maxHeight: standards.maxHeight,
      developmentStandards: standards,
      allowedUses: {
        permitted: getPermittedUses(zoneType),
        conditional: getConditionalUses(zoneType),
      },
    };

    return NextResponse.json({
      success: true,
      supported: true,
      property,
    });
  } catch (error) {
    console.error('Property lookup error:', error);
    return NextResponse.json({ success: false, error: 'Failed to lookup property' }, { status: 500 });
  }
}

function generateJurisdictionId(city: string, stateShort: string): string {
  const normalizedCity = city
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();

  const normalizedState = stateShort.toLowerCase();

  return `${normalizedCity}-${normalizedState}`;
}

function getStateAbbreviation(stateName: string): string {
  const states: Record<string, string> = {
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
    'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC',
  };

  return states[stateName.toLowerCase()] || stateName.slice(0, 2).toUpperCase();
}

function getPermittedUses(zoneType: string): string[] {
  switch (zoneType) {
    case 'residential':
      return ['Single Family Home', 'Home Occupation', 'Accessory Dwelling Unit'];
    case 'commercial':
      return ['Retail', 'Office', 'Restaurant', 'Personal Services'];
    case 'downtown':
      return ['Mixed Use', 'Retail', 'Office', 'Residential', 'Entertainment'];
    case 'industrial':
      return ['Manufacturing', 'Warehouse', 'Distribution', 'Research & Development'];
    case 'public':
      return ['Government Offices', 'Schools', 'Community Centers'];
    case 'parks':
      return ['Parks', 'Recreation', 'Open Space'];
    default:
      return ['Commercial', 'Retail'];
  }
}

function getConditionalUses(zoneType: string): string[] {
  switch (zoneType) {
    case 'residential':
      return ['Daycare', 'Bed & Breakfast', 'Religious Institution'];
    case 'commercial':
      return ['Drive-Through', 'Auto Repair', 'Gas Station'];
    case 'downtown':
      return ['Large Venue', 'Parking Structure'];
    case 'industrial':
      return ['Hazardous Materials', 'Outdoor Storage'];
    default:
      return [];
  }
}

// School district lookup based on city and county
// In production, this would query a proper school district boundary database
function getSchoolDistrict(city: string, county?: string | null): string {
  const cityLower = city.toLowerCase();
  const countyLower = county?.toLowerCase() || '';

  // Ohio school districts
  if (countyLower.includes('hamilton')) {
    if (cityLower === 'cincinnati') return 'Cincinnati Public Schools';
    if (cityLower === 'blue ash' || cityLower === 'deer park' || cityLower === 'silverton') return 'Deer Park Community Schools';
    if (cityLower === 'norwood') return 'Norwood City Schools';
    if (cityLower === 'madeira') return 'Madeira City Schools';
    if (cityLower === 'indian hill') return 'Indian Hill Exempted Village Schools';
    if (cityLower === 'mariemont') return 'Mariemont City Schools';
    if (cityLower === 'wyoming') return 'Wyoming City Schools';
    if (cityLower === 'reading') return 'Reading Community City Schools';
    if (cityLower === 'sharonville' || cityLower === 'springdale') return 'Princeton City Schools';
    if (cityLower === 'montgomery') return 'Sycamore Community Schools';
    if (cityLower === 'forest park') return 'Winton Woods City Schools';
    return 'Cincinnati Public Schools';
  }

  if (countyLower.includes('butler')) {
    if (cityLower === 'hamilton') return 'Hamilton City Schools';
    if (cityLower === 'fairfield') return 'Fairfield City Schools';
    if (cityLower === 'middletown') return 'Middletown City Schools';
    if (cityLower === 'oxford') return 'Talawanda School District';
    return 'Butler County Schools';
  }

  if (countyLower.includes('warren')) {
    if (cityLower === 'mason') return 'Mason City Schools';
    if (cityLower === 'loveland') return 'Loveland City Schools';
    if (cityLower === 'lebanon') return 'Lebanon City Schools';
    if (cityLower === 'springboro') return 'Springboro Community Schools';
    return 'Warren County Schools';
  }

  if (countyLower.includes('clermont')) {
    if (cityLower === 'milford') return 'Milford Exempted Village Schools';
    if (cityLower === 'batavia') return 'Batavia Local Schools';
    return 'Clermont County Schools';
  }

  // Kentucky school districts
  if (countyLower.includes('boone')) {
    return 'Boone County Schools';
  }

  if (countyLower.includes('campbell')) {
    if (cityLower === 'newport') return 'Newport Independent Schools';
    if (cityLower === 'fort thomas') return 'Fort Thomas Independent Schools';
    if (cityLower === 'bellevue') return 'Bellevue Independent Schools';
    if (cityLower === 'dayton') return 'Dayton Independent Schools';
    return 'Campbell County Schools';
  }

  if (countyLower.includes('kenton')) {
    if (cityLower === 'covington') return 'Covington Independent Schools';
    if (cityLower === 'erlanger' || cityLower === 'elsmere') return 'Erlanger-Elsmere Independent Schools';
    return 'Kenton County Schools';
  }

  return 'Check county records';
}
