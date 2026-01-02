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
const SUPPORTED_JURISDICTIONS = [
  'cincinnati-oh',
  'loveland-oh',
  'mason-oh',
  'covington-ky',
  'newport-ky',
  'florence-ky',
  'blue-ash-oh',
  'norwood-oh',
  'fairfield-oh',
  'hamilton-oh',
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

    // Step 4: Look up zoning from database
    let zoneCode = 'SF-4';
    let zoneName = 'Single Family Residential';
    let zoneType = 'residential';
    let parcelId: string | null = null;

    try {
      // Try to find parcel in database
      const parcel = await prisma.zoningParcel.findFirst({
        where: {
          address: {
            contains: address.split(',')[0], // Match street address part
            mode: 'insensitive',
          },
        },
      });

      if (parcel) {
        zoneCode = parcel.zoneCode;
        zoneName = parcel.zoneDescription || zoneCode;
        zoneType = classifyZone(zoneCode);
        parcelId = parcel.parcelId;
      } else {
        // Try to look up zoning district
        const district = await prisma.zoningDistrict.findFirst({
          where: {
            code: zoneCode,
          },
        });

        if (district) {
          zoneName = district.name || zoneCode;
          zoneType = district.category || classifyZone(zoneCode);
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
      cityId: jurisdictionId,
      parcelId,
      zone: zoneCode,
      zoneName,
      zoneType,
      overlays,
      constraints: constraints.length > 0 ? constraints : ['None'],
      councilDistrict: 'District 1', // Would look this up in production
      councilRep: 'Council Member', // Would look this up in production
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
