import { NextRequest, NextResponse } from 'next/server';

/**
 * Geocoding API - Convert address to city/state
 *
 * Uses multiple free geocoding services with fallbacks:
 * 1. Nominatim (OpenStreetMap) - Free, no API key required
 * 2. Could add Google Maps API later for better accuracy
 */

interface GeocodeResult {
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Try Nominatim (OpenStreetMap) geocoding - FREE
    const result = await geocodeWithNominatim(address);

    if (!result) {
      return NextResponse.json(
        { error: 'Could not geocode address. Please check the address and try again.' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { error: 'Failed to process geocoding request' },
      { status: 500 }
    );
  }
}

/**
 * Geocode using Nominatim (OpenStreetMap)
 * Free service, no API key required
 * Rate limit: 1 request/second
 */
async function geocodeWithNominatim(address: string): Promise<GeocodeResult | null> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&addressdetails=1&limit=1&countrycodes=us`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Civix-App/1.0', // Required by Nominatim
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

    // Extract city (can be in different fields)
    const city =
      addressDetails.city ||
      addressDetails.town ||
      addressDetails.village ||
      addressDetails.municipality ||
      addressDetails.county?.replace(' County', '');

    // Extract state
    const state = addressDetails.state;

    if (!city || !state) {
      return null;
    }

    // Convert state name to abbreviation if needed
    const stateAbbr = getStateAbbreviation(state);

    return {
      address,
      city,
      state: stateAbbr || state,
      zipCode: addressDetails.postcode,
      latitude: parseFloat(location.lat),
      longitude: parseFloat(location.lon),
    };

  } catch (error) {
    console.error('Nominatim geocoding error:', error);
    return null;
  }
}

/**
 * Convert state name to 2-letter abbreviation
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

  const normalized = stateName.toLowerCase().trim();
  return stateMap[normalized] || null;
}
