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

    // Step 7: Detect HOA and utilities
    const hoaDetection = detectPotentialHOA(zoneCode, null, null, zoneType, formattedAddress, city, county || countyName || undefined);
    const utilities = detectUtilities(city, county || countyName, zoneSource);

    // Step 8: Build property response
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
      // HOA detection
      mayHaveHOA: hoaDetection.mayHaveHOA,
      hoaIndicators: hoaDetection.indicators,
      // Utilities
      utilities,
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

// HOA detection heuristics
// Returns indicators if property may be in an HOA
// Enhanced with county-specific known HOA communities for Cincinnati Metro (7 counties)
function detectPotentialHOA(
  zoneCode: string,
  subdivision?: string | null,
  yearBuilt?: number | null,
  zoneType?: string,
  address?: string,
  city?: string,
  county?: string
): { mayHaveHOA: boolean; indicators: string[] } {
  const indicators: string[] = [];
  const cityLower = (city || '').toLowerCase();
  const countyLower = (county || '').toLowerCase().replace(' county', '');
  const subdivisionLower = (subdivision || '').toLowerCase();
  const addressLower = (address || '').toLowerCase();
  const zoneCodeUpper = (zoneCode || '').toUpperCase();

  // ============================================
  // DOWNTOWN COMMERCIAL EXCLUSION
  // Downtown buildings (office towers, apartments, hotels, stadiums)
  // don't have HOAs unless they are condominiums
  // ============================================
  const isDowntownZone = /^DD-?[ABC]?$/i.test(zoneCodeUpper) ||
                         zoneType === 'downtown' ||
                         /downtown|CBD|central business/i.test(zoneCodeUpper);

  // Check if address indicates a condo (unit ownership vs rental)
  const isCondoAddress = /\bunit\s*\d|\bcondo\b|\b#\s*\d{1,4}\b|\bph\s*\d|\bpenthouse\b/i.test(addressLower) &&
                         !/\bapt\b|\bapartment\b|\bste\b|\bsuite\b|\bfloor\b|\bfl\b/i.test(addressLower);

  // Skip HOA detection for downtown zones unless it looks like a condo
  if (isDowntownZone && !isCondoAddress) {
    return { mayHaveHOA: false, indicators: [] };
  }

  // If it's a downtown condo, note that specifically
  if (isDowntownZone && isCondoAddress) {
    indicators.push('Downtown condominium - may have condo association fees');
  }

  // ============================================
  // KNOWN HOA COMMUNITIES BY COUNTY
  // These are confirmed or highly likely HOA communities
  // ============================================

  // HAMILTON COUNTY, OH - Known HOA subdivisions
  const hamiltonCountyHOAs = [
    // Indian Hill area
    'indian hill', 'camargo', 'given road', 'shawnee run', 'grand valley',
    // Montgomery/Blue Ash area
    'heritage hill', 'vintage club', 'kenwood', 'sycamore township', 'montgomery place',
    'cooper creek', 'harper\'s point', 'harpers point', 'the sanctuary',
    // Anderson Township
    'anderson hills', 'the bluffs', 'beechmont', 'cherry grove', 'forestville',
    'turpin hills', 'summerside', 'newtown', 'four bridges', 'the farms',
    // West Side
    'bridgetown', 'westwood station', 'cheviot gardens', 'mack', 'delhi hills',
    'sayler park', 'cleves crossing',
    // Northern Hamilton
    'springdale meadows', 'sharonville commons', 'evendale estates', 'forest park village',
    'winton woods', 'greenhills', 'finneytown', 'white oak',
    // Eastern Hamilton
    'madeira estates', 'kenwood manor', 'mariemont', 'fairfax village', 'oakley square',
    'hyde park square', 'mt lookout', 'columbia tusculum',
    // Condo/Townhouse communities
    'rookwood', 'norwood towers', 'gaslight', 'prospect hill', 'liberty hill',
  ];

  // BUTLER COUNTY, OH - Known HOA subdivisions
  const butlerCountyHOAs = [
    // West Chester area (heavy HOA presence)
    'beckett ridge', 'wetherington', 'lakota hills', 'liberty township', 'tylersville',
    'deerfield township', 'savannah', 'heritage club', 'the oaks', 'muirfield',
    'glen oaks', 'liberty center', 'voice of america', 'voa', 'liberty crossing',
    'carriage hill', 'lakota east', 'lakota west',
    // Fairfield
    'fairfield township', 'pleasant run farms', 'village green', 'winton place',
    'forest fair', 'bridgewater', 'fairfield greens',
    // Hamilton
    'hamilton lakes', 'riverside', 'lindenwald', 'german village',
    // Middletown
    'lemon township', 'trenton crossing', 'monroe meadows', 'liberty commons',
    // Oxford area
    'oxford township', 'talawanda', 'hueston woods',
  ];

  // WARREN COUNTY, OH - Known HOA subdivisions (very high HOA presence)
  const warrenCountyHOAs = [
    // Mason area (almost all new developments have HOAs)
    'deerfield', 'heritage', 'mason montgomery', 'heritage oak', 'estates of mason',
    'traditions', 'mason ohio', 'crooked tree', 'sawyer point', 'the sanctuary at mason',
    'heritage hill', 'river\'s bend', 'rivers bend', 'kings mills', 'natorp',
    // Loveland area
    'loveland estates', 'oasis', 'loveland park', 'symmes township', 'butterworth',
    'loveland trace', 'branch hill guinea',
    // Lebanon area
    'lebanon meadows', 'turtle creek', 'turtlecreek', 'kings', 'countryside',
    // Springboro/Franklin
    'springboro estates', 'settlers walk', 'clearcreek', 'franklin township',
    'carlisle', 'miamisburg', 'centerville road',
    // South Lebanon/Maineville
    'south lebanon', 'maineville', 'foster crossing', 'landen', 'socialville',
  ];

  // CLERMONT COUNTY, OH - Known HOA subdivisions
  const clermontCountyHOAs = [
    // Milford area
    'miami township', 'mulberry', 'camps creek', 'eastgate', 'milford estates',
    // Union Township
    'union township', 'eastgate mall', 'glen este', 'withamsville',
    // Batavia area
    'batavia township', 'afton', 'williamsburg',
    // Pierce Township
    'pierce township', 'new richmond', 'amelia', 'locust corner',
    // Goshen
    'goshen township', 'pleasant plain', 'owensville',
  ];

  // BOONE COUNTY, KY - Known HOA subdivisions
  const booneCountyHOAs = [
    // Florence area
    'florence', 'oakbrook', 'tanglewood', 'thornwilde', 'deerfield',
    'houston acres', 'mall road', 'burlington pike',
    // Union area
    'union', 'big bone', 'richwood', 'frogtown', 'waterloo',
    // Burlington area
    'burlington', 'limaburg', 'bullittsville', 'idlewild', 'constance',
    // Hebron area
    'hebron', 'north bend', 'rabbit hash', 'belleview', 'petersburg',
    // Walton area
    'walton', 'verona', 'richwood road',
  ];

  // KENTON COUNTY, KY - Known HOA subdivisions
  const kentonCountyHOAs = [
    // Covington
    'mainstrasse', 'licking riverside', 'devou park', 'latonia', 'rosedale',
    // Erlanger/Elsmere
    'erlanger', 'commonwealth', 'kenton vale', 'elsmere', 'price pike',
    // Fort Mitchell/Fort Wright
    'fort mitchell', 'ft mitchell', 'fort wright', 'ft wright', 'lookout heights',
    'south fort mitchell', 'dixie highway',
    // Independence
    'independence', 'taylor mill', 'kenton county', 'banklick',
    // Villa Hills/Crescent Springs
    'villa hills', 'crescent springs', 'crestview hills', 'buttermilk', 'lakeside park',
    'park hills', 'thomas more', 'edgewood',
  ];

  // CAMPBELL COUNTY, KY - Known HOA subdivisions
  const campbellCountyHOAs = [
    // Newport
    'newport', 'monmouth street', 'east row', 'mansion hill', 'the levee',
    // Fort Thomas
    'fort thomas', 'ft thomas', 'highland', 'south fort thomas', 'midway',
    // Highland Heights/Cold Spring
    'highland heights', 'cold spring', 'crossroads', 'aa highway', 'martha layne collins',
    // Alexandria
    'alexandria', 'campbell county', 'four mile', 'grants lick',
    // Bellevue/Dayton
    'bellevue', 'dayton', 'fairfield avenue',
    // Southgate/Wilder
    'southgate', 'wilder', 'woodlawn', 'silver grove', 'melbourne',
  ];

  // Check if property is in a known HOA community by county
  let knownHOAs: string[] = [];
  if (countyLower.includes('hamilton')) {
    knownHOAs = hamiltonCountyHOAs;
  } else if (countyLower.includes('butler')) {
    knownHOAs = butlerCountyHOAs;
  } else if (countyLower.includes('warren')) {
    knownHOAs = warrenCountyHOAs;
  } else if (countyLower.includes('clermont')) {
    knownHOAs = clermontCountyHOAs;
  } else if (countyLower.includes('boone')) {
    knownHOAs = booneCountyHOAs;
  } else if (countyLower.includes('kenton')) {
    knownHOAs = kentonCountyHOAs;
  } else if (countyLower.includes('campbell')) {
    knownHOAs = campbellCountyHOAs;
  }

  // Check subdivision against known HOAs for the county
  if (subdivision) {
    for (const hoaName of knownHOAs) {
      if (subdivisionLower.includes(hoaName) || hoaName.includes(subdivisionLower)) {
        indicators.push(`"${subdivision}" is a known community with HOA in ${county || 'this area'}`);
        break;
      }
    }
  }

  // Also check address for known HOA community names
  for (const hoaName of knownHOAs) {
    if (addressLower.includes(hoaName) && !indicators.some(i => i.includes('known community'))) {
      indicators.push(`Address suggests location in HOA community area`);
      break;
    }
  }

  // ============================================
  // GENERIC SUBDIVISION NAME PATTERNS
  // ============================================
  if (subdivision && !indicators.some(i => i.includes('known community'))) {
    const hoaSubdivisionPatterns = [
      /estates?$/i,
      /village/i,
      /commons?$/i,
      /pointe?$/i,
      /landing/i,
      /preserve/i,
      /crossing/i,
      /ridge/i,
      /glen/i,
      /knoll/i,
      /manor/i,
      /place$/i,
      /court$/i,
      /reserve/i,
      /grove/i,
      /meadow/i,
      /hills?$/i,
      /woods?$/i,
      /trace/i,
      /run$/i,
      /creek/i,
      /lake/i,
      /pond/i,
      /garden/i,
      /park$/i,
      /cove$/i,
      /farm$/i,
      /farms$/i,
      /springs?$/i,
      /bluff/i,
      /hollow/i,
      /way$/i,
      /walk$/i,
      /trail/i,
      /view$/i,
      /valley/i,
      /heights$/i,
      /shores?$/i,
      /point$/i,
      /station$/i,
    ];

    for (const pattern of hoaSubdivisionPatterns) {
      if (pattern.test(subdivision)) {
        indicators.push(`Subdivision name "${subdivision}" suggests planned community`);
        break;
      }
    }
  }

  // ============================================
  // YEAR BUILT HEURISTICS (County-specific thresholds)
  // ============================================
  if (yearBuilt) {
    // Warren County: Almost all post-1990 developments have HOAs
    if (countyLower.includes('warren') && yearBuilt >= 1990) {
      indicators.push(`Built in ${yearBuilt} in Warren County (most post-1990 developments have HOAs)`);
    }
    // Butler County (West Chester): Strong HOA presence post-1985
    else if (countyLower.includes('butler') && yearBuilt >= 1985) {
      indicators.push(`Built in ${yearBuilt} in Butler County (many post-1985 developments have HOAs)`);
    }
    // Other counties: General post-1980 rule
    else if (yearBuilt >= 1980) {
      indicators.push(`Built in ${yearBuilt} (post-1980 developments often have HOAs)`);
    }
  }

  // ============================================
  // ZONE CODE PATTERNS
  // ============================================
  if (zoneCode) {
    // PUD (Planned Unit Development) - strong HOA indicator
    if (/^PD|^PUD/i.test(zoneCode)) {
      indicators.push('Planned Development (PD/PUD) zoning typically requires HOA');
    }
    // Multi-family/condo zones
    else if (/^RM-|^RMX|condo|townhouse|TH|MF/i.test(zoneCode)) {
      indicators.push('Multi-family/townhouse zoning often includes HOA');
    }
    // Residential cluster developments
    else if (/cluster|conservation|overlay/i.test(zoneCode)) {
      indicators.push('Cluster/conservation development zoning often has HOA');
    }
  }

  // ============================================
  // ADDRESS PATTERNS
  // ============================================
  if (address) {
    // Condo/unit patterns
    if (/\bunit\b|\bapt\b|#\d|\bcondo\b|\bsuite\b/i.test(address)) {
      indicators.push('Unit/apartment-style address suggests shared ownership community');
    }
    // Townhouse/row patterns
    if (/\btownhouse\b|\btownhome\b|\brow\b/i.test(address)) {
      indicators.push('Townhouse-style property often has HOA');
    }
  }

  // ============================================
  // CITY-SPECIFIC PATTERNS
  // ============================================
  // Mason, OH is almost entirely HOA-governed for residential
  if (cityLower === 'mason' && countyLower.includes('warren')) {
    if (!indicators.some(i => i.includes('Mason'))) {
      indicators.push('Mason, OH residential areas predominantly have HOAs');
    }
  }
  // West Chester Township, OH - very high HOA prevalence
  if (cityLower.includes('west chester') || cityLower.includes('liberty township')) {
    if (!indicators.some(i => i.includes('West Chester') || i.includes('Liberty'))) {
      indicators.push('West Chester/Liberty Township areas predominantly have HOAs');
    }
  }

  return {
    mayHaveHOA: indicators.length >= 1, // Show warning if any indicator found
    indicators,
  };
}

// Utility service detection based on location
// Comprehensive coverage for Cincinnati Metro (7 counties)
// Returns estimated utility providers and service types
function detectUtilities(
  city: string,
  county?: string | null,
  zoneSource?: string
): {
  sewer: 'municipal' | 'septic' | 'unknown';
  sewerProvider?: string;
  water: 'municipal' | 'well' | 'unknown';
  waterProvider?: string;
  gas: 'available' | 'not_available' | 'unknown';
  gasProvider?: string;
  electric: string;
  internet: string[];
} {
  const cityLower = city.toLowerCase().trim();
  const countyLower = (county || '').toLowerCase().replace(' county', '').trim();

  // Default values
  let sewer: 'municipal' | 'septic' | 'unknown' = 'unknown';
  let sewerProvider: string | undefined;
  let water: 'municipal' | 'well' | 'unknown' = 'unknown';
  let waterProvider: string | undefined;
  let gas: 'available' | 'not_available' | 'unknown' = 'unknown';
  let gasProvider: string | undefined;
  let electric = 'Check local provider';
  let internet: string[] = [];

  // Properties outside city limits more likely to be on septic/well
  const isUnincorporated = zoneSource === 'county';

  // ============================================
  // HAMILTON COUNTY, OHIO
  // ============================================
  if (countyLower === 'hamilton' || countyLower.includes('hamilton')) {
    electric = 'Duke Energy Ohio';
    gas = 'available';
    gasProvider = 'Duke Energy Ohio';
    internet = ['altafiber (Cincinnati Bell Fioptics)', 'Spectrum', 'AT&T'];

    // Metropolitan Sewer District (MSD) serves most of Hamilton County
    sewer = 'municipal';
    sewerProvider = 'Metropolitan Sewer District (MSD)';

    // Water providers by municipality
    const gcwwCities = [
      'cincinnati', 'norwood', 'st. bernard', 'st bernard', 'elmwood place',
      'golf manor', 'silverton', 'deer park', 'amberley village', 'amberley',
      'mariemont', 'fairfax', 'madeira', 'indian hill', 'terrace park',
      'milford', 'loveland', 'montgomery', 'blue ash', 'sharonville',
      'evendale', 'glendale', 'woodlawn', 'lincoln heights', 'lockland',
      'reading', 'arlington heights', 'mt. healthy', 'mt healthy', 'mount healthy',
      'springdale', 'forest park', 'greenhills', 'north college hill',
      'mount airy', 'mt airy', 'cheviot', 'westwood', 'price hill',
      'delhi', 'anderson', 'hyde park', 'oakley', 'mt. lookout', 'mt lookout',
      'clifton', 'northside', 'walnut hills', 'avondale', 'bond hill',
      'roselawn', 'pleasant ridge', 'kennedy heights', 'madisonville',
      'columbia tusculum', 'east end', 'linwood', 'mt. washington', 'mt washington',
      'sayler park', 'sedamsville', 'riverside', 'addyston', 'north bend',
      'cleves', 'miami heights', 'miamitown', 'elizabethtown', 'finneytown',
      'white oak', 'monfort heights', 'bridgetown', 'dent', 'harrison',
      'whitewater', 'colerain', 'groesbeck', 'pleasant run', 'mt. airy',
    ];

    const swowCities = ['harrison', 'whitewater', 'cleves', 'north bend', 'addyston', 'elizabethtown'];

    if (gcwwCities.some(c => cityLower.includes(c) || c.includes(cityLower))) {
      water = 'municipal';
      waterProvider = 'Greater Cincinnati Water Works (GCWW)';
    } else if (swowCities.some(c => cityLower.includes(c))) {
      water = 'municipal';
      waterProvider = 'Southwest Ohio Water (SWOW)';
    } else if (cityLower === 'wyoming') {
      water = 'municipal';
      waterProvider = 'Wyoming Water Works';
    } else if (isUnincorporated) {
      water = 'well';
      waterProvider = 'Private well (unincorporated area)';
      sewer = 'septic';
      sewerProvider = 'Private septic (verify with county)';
    } else {
      water = 'municipal';
      waterProvider = 'Greater Cincinnati Water Works (GCWW)';
    }
  }

  // ============================================
  // BUTLER COUNTY, OHIO
  // ============================================
  else if (countyLower === 'butler' || countyLower.includes('butler')) {
    electric = 'Duke Energy Ohio / AES Ohio';
    gas = 'available';
    gasProvider = 'Duke Energy Ohio / Vectren';
    internet = ['Spectrum', 'altafiber', 'AT&T', 'Cincinnati Bell'];

    // Butler County has multiple water providers
    if (cityLower === 'hamilton') {
      water = 'municipal';
      waterProvider = 'City of Hamilton Water';
      sewer = 'municipal';
      sewerProvider = 'City of Hamilton Wastewater';
    } else if (cityLower === 'fairfield') {
      water = 'municipal';
      waterProvider = 'Fairfield Water Department';
      sewer = 'municipal';
      sewerProvider = 'Fairfield Wastewater';
    } else if (cityLower === 'middletown') {
      water = 'municipal';
      waterProvider = 'City of Middletown Water';
      sewer = 'municipal';
      sewerProvider = 'Middletown Wastewater Treatment';
    } else if (cityLower === 'oxford') {
      water = 'municipal';
      waterProvider = 'City of Oxford Water';
      sewer = 'municipal';
      sewerProvider = 'Oxford Wastewater';
    } else if (['trenton', 'monroe', 'middletown'].some(c => cityLower.includes(c))) {
      water = 'municipal';
      waterProvider = 'Butler County Water & Sewer';
      sewer = 'municipal';
      sewerProvider = 'Butler County Water & Sewer';
    } else if (['west chester', 'liberty township', 'liberty', 'mason'].some(c => cityLower.includes(c))) {
      water = 'municipal';
      waterProvider = 'Cincinnati Water Works / Butler County Water';
      sewer = 'municipal';
      sewerProvider = 'Butler County Water & Sewer';
    } else if (isUnincorporated) {
      water = 'well';
      waterProvider = 'Private well (unincorporated Butler County)';
      sewer = 'septic';
      sewerProvider = 'Private septic system';
    } else {
      water = 'municipal';
      waterProvider = 'Butler County Water & Sewer';
      sewer = 'municipal';
      sewerProvider = 'Butler County Water & Sewer';
    }
  }

  // ============================================
  // WARREN COUNTY, OHIO
  // ============================================
  else if (countyLower === 'warren' || countyLower.includes('warren')) {
    electric = 'Duke Energy Ohio';
    gas = 'available';
    gasProvider = 'Duke Energy Ohio / Vectren';
    internet = ['Spectrum', 'Cincinnati Bell', 'Frontier', 'AT&T'];

    if (cityLower === 'mason') {
      water = 'municipal';
      waterProvider = 'City of Mason Water';
      sewer = 'municipal';
      sewerProvider = 'City of Mason Wastewater';
    } else if (cityLower === 'lebanon') {
      water = 'municipal';
      waterProvider = 'City of Lebanon Water';
      sewer = 'municipal';
      sewerProvider = 'Lebanon Wastewater';
    } else if (cityLower === 'loveland') {
      water = 'municipal';
      waterProvider = 'City of Loveland Water';
      sewer = 'municipal';
      sewerProvider = 'Loveland Wastewater / Warren County';
    } else if (cityLower === 'franklin') {
      water = 'municipal';
      waterProvider = 'City of Franklin Water';
      sewer = 'municipal';
      sewerProvider = 'Franklin Wastewater';
    } else if (cityLower === 'springboro') {
      water = 'municipal';
      waterProvider = 'City of Springboro Water';
      sewer = 'municipal';
      sewerProvider = 'Springboro Wastewater';
    } else if (['deerfield', 'maineville', 'morrow', 'south lebanon', 'waynesville', 'harveysburg', 'oregonia'].some(c => cityLower.includes(c))) {
      water = 'municipal';
      waterProvider = 'Warren County Water & Sewer';
      sewer = 'municipal';
      sewerProvider = 'Warren County Water & Sewer';
    } else if (isUnincorporated) {
      water = 'well';
      waterProvider = 'Private well (rural Warren County)';
      sewer = 'septic';
      sewerProvider = 'Private septic system';
    } else {
      water = 'municipal';
      waterProvider = 'Warren County Water & Sewer';
      sewer = 'municipal';
      sewerProvider = 'Warren County Water & Sewer';
    }
  }

  // ============================================
  // CLERMONT COUNTY, OHIO
  // ============================================
  else if (countyLower === 'clermont' || countyLower.includes('clermont')) {
    electric = 'Duke Energy Ohio';
    gas = 'available';
    gasProvider = 'Duke Energy Ohio';
    internet = ['Spectrum', 'Cincinnati Bell', 'AT&T'];

    if (cityLower === 'milford') {
      water = 'municipal';
      waterProvider = 'City of Milford Water';
      sewer = 'municipal';
      sewerProvider = 'Milford Wastewater';
    } else if (cityLower === 'batavia') {
      water = 'municipal';
      waterProvider = 'Clermont County Water Resources';
      sewer = 'municipal';
      sewerProvider = 'Clermont County Water Resources';
    } else if (['amelia', 'bethel', 'new richmond', 'williamsburg', 'owensville', 'goshen', 'loveland'].some(c => cityLower.includes(c))) {
      water = 'municipal';
      waterProvider = 'Clermont County Water Resources';
      sewer = 'municipal';
      sewerProvider = 'Clermont County Water Resources';
    } else if (['union township', 'miami township', 'pierce township', 'stonelick'].some(c => cityLower.includes(c))) {
      water = 'municipal';
      waterProvider = 'Clermont County Water Resources';
      sewer = 'municipal';
      sewerProvider = 'Clermont County Water Resources';
    } else if (isUnincorporated) {
      // Many rural areas of Clermont are on wells/septic
      water = 'well';
      waterProvider = 'Private well (rural Clermont County)';
      sewer = 'septic';
      sewerProvider = 'Private septic system';
    } else {
      water = 'municipal';
      waterProvider = 'Clermont County Water Resources';
      sewer = 'municipal';
      sewerProvider = 'Clermont County Water Resources';
    }
  }

  // ============================================
  // BOONE COUNTY, KENTUCKY
  // ============================================
  else if (countyLower === 'boone' || countyLower.includes('boone')) {
    electric = 'Duke Energy Kentucky';
    gas = 'available';
    gasProvider = 'Duke Energy Kentucky';
    internet = ['Spectrum', 'Cincinnati Bell', 'altafiber', 'AT&T'];

    // Sanitation District No. 1 serves most of Northern Kentucky
    sewer = 'municipal';
    sewerProvider = 'Sanitation District No. 1 (SD1)';

    if (cityLower === 'florence') {
      water = 'municipal';
      waterProvider = 'Boone County Water District';
    } else if (cityLower === 'union') {
      water = 'municipal';
      waterProvider = 'Boone County Water District';
    } else if (cityLower === 'walton') {
      water = 'municipal';
      waterProvider = 'City of Walton Water';
    } else if (cityLower === 'burlington') {
      water = 'municipal';
      waterProvider = 'Boone County Water District';
    } else if (cityLower === 'hebron') {
      water = 'municipal';
      waterProvider = 'Boone County Water District';
    } else if (['petersburg', 'verona', 'rabbit hash', 'big bone', 'belleview', 'constance', 'limaburg'].some(c => cityLower.includes(c))) {
      water = 'municipal';
      waterProvider = 'Boone County Water District';
    } else if (isUnincorporated) {
      water = 'well';
      waterProvider = 'Private well (rural Boone County)';
      sewer = 'septic';
      sewerProvider = 'Private septic (verify with county)';
    } else {
      water = 'municipal';
      waterProvider = 'Boone County Water District';
    }
  }

  // ============================================
  // KENTON COUNTY, KENTUCKY
  // ============================================
  else if (countyLower === 'kenton' || countyLower.includes('kenton')) {
    electric = 'Duke Energy Kentucky';
    gas = 'available';
    gasProvider = 'Duke Energy Kentucky';
    internet = ['Spectrum', 'Cincinnati Bell', 'altafiber', 'AT&T'];

    // Sanitation District No. 1 serves most of Kenton County
    sewer = 'municipal';
    sewerProvider = 'Sanitation District No. 1 (SD1)';

    if (cityLower === 'covington') {
      water = 'municipal';
      waterProvider = 'Northern Kentucky Water District (NKWD)';
    } else if (cityLower === 'erlanger') {
      water = 'municipal';
      waterProvider = 'Northern Kentucky Water District (NKWD)';
    } else if (cityLower === 'independence') {
      water = 'municipal';
      waterProvider = 'Northern Kentucky Water District (NKWD)';
    } else if (cityLower === 'edgewood') {
      water = 'municipal';
      waterProvider = 'Northern Kentucky Water District (NKWD)';
    } else if (['fort mitchell', 'ft mitchell', 'ft. mitchell'].some(c => cityLower.includes(c))) {
      water = 'municipal';
      waterProvider = 'Northern Kentucky Water District (NKWD)';
    } else if (['villa hills', 'crescent springs', 'crestview hills', 'park hills', 'lakeside park', 'taylor mill', 'elsmere', 'bromley', 'ludlow', 'latonia'].some(c => cityLower.includes(c))) {
      water = 'municipal';
      waterProvider = 'Northern Kentucky Water District (NKWD)';
    } else if (isUnincorporated) {
      water = 'well';
      waterProvider = 'Private well (rural Kenton County)';
      sewer = 'septic';
      sewerProvider = 'Private septic (verify with county)';
    } else {
      water = 'municipal';
      waterProvider = 'Northern Kentucky Water District (NKWD)';
    }
  }

  // ============================================
  // CAMPBELL COUNTY, KENTUCKY
  // ============================================
  else if (countyLower === 'campbell' || countyLower.includes('campbell')) {
    electric = 'Duke Energy Kentucky';
    gas = 'available';
    gasProvider = 'Duke Energy Kentucky';
    internet = ['Spectrum', 'Cincinnati Bell', 'altafiber', 'AT&T'];

    // Sanitation District No. 1 serves most of Campbell County
    sewer = 'municipal';
    sewerProvider = 'Sanitation District No. 1 (SD1)';

    if (cityLower === 'newport') {
      water = 'municipal';
      waterProvider = 'Northern Kentucky Water District (NKWD)';
    } else if (['fort thomas', 'ft thomas', 'ft. thomas'].some(c => cityLower.includes(c))) {
      water = 'municipal';
      waterProvider = 'Fort Thomas Water Works';
    } else if (cityLower === 'bellevue') {
      water = 'municipal';
      waterProvider = 'City of Bellevue Water';
    } else if (cityLower === 'dayton') {
      water = 'municipal';
      waterProvider = 'City of Dayton Water';
    } else if (['highland heights', 'cold spring', 'alexandria', 'southgate', 'wilder', 'silver grove', 'melbourne', 'california'].some(c => cityLower.includes(c))) {
      water = 'municipal';
      waterProvider = 'Campbell County Kentucky Water District';
    } else if (isUnincorporated) {
      water = 'well';
      waterProvider = 'Private well (rural Campbell County)';
      sewer = 'septic';
      sewerProvider = 'Private septic (verify with county)';
    } else {
      water = 'municipal';
      waterProvider = 'Campbell County Kentucky Water District';
    }
  }

  return { sewer, sewerProvider, water, waterProvider, gas, gasProvider, electric, internet };
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
