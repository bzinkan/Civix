/**
 * Jurisdiction Detection Utility
 *
 * Detects jurisdiction from Google Places result or address components
 */

export interface AddressComponents {
  streetNumber?: string;
  streetName?: string;
  city?: string;
  state?: string;
  stateShort?: string;
  county?: string;
  zip?: string;
  country?: string;
}

export interface JurisdictionInfo {
  jurisdictionId: string;
  city: string;
  state: string;
  stateShort: string;
  county?: string;
  zip?: string;
  fullAddress: string;
}

/**
 * Parse address components from Google Places result
 */
export function parseGooglePlaceResult(placeResult: google.maps.places.PlaceResult): AddressComponents {
  const components: AddressComponents = {};

  if (!placeResult.address_components) {
    return components;
  }

  for (const component of placeResult.address_components) {
    const types = component.types;

    if (types.includes('street_number')) {
      components.streetNumber = component.long_name;
    }
    if (types.includes('route')) {
      components.streetName = component.long_name;
    }
    if (types.includes('locality')) {
      components.city = component.long_name;
    }
    if (types.includes('administrative_area_level_1')) {
      components.state = component.long_name;
      components.stateShort = component.short_name;
    }
    if (types.includes('administrative_area_level_2')) {
      components.county = component.long_name;
    }
    if (types.includes('postal_code')) {
      components.zip = component.long_name;
    }
    if (types.includes('country')) {
      components.country = component.short_name;
    }
  }

  return components;
}

/**
 * Generate jurisdiction ID from city and state
 */
export function generateJurisdictionId(city: string, stateShort: string): string {
  const normalizedCity = city
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();

  const normalizedState = stateShort.toLowerCase();

  return `${normalizedCity}-${normalizedState}`;
}

/**
 * Detect jurisdiction from Google Places result
 */
export function detectJurisdiction(
  placeResult: google.maps.places.PlaceResult
): JurisdictionInfo | null {
  const components = parseGooglePlaceResult(placeResult);

  if (!components.city || !components.stateShort) {
    return null;
  }

  const jurisdictionId = generateJurisdictionId(components.city, components.stateShort);

  return {
    jurisdictionId,
    city: components.city,
    state: components.state || components.stateShort,
    stateShort: components.stateShort,
    county: components.county,
    zip: components.zip,
    fullAddress: placeResult.formatted_address || '',
  };
}

/**
 * Detect jurisdiction from manual address components
 */
export function detectJurisdictionFromComponents(
  city: string,
  state: string,
  fullAddress: string,
  county?: string,
  zip?: string
): JurisdictionInfo {
  // Normalize state to short form if full name provided
  const stateShort = state.length > 2 ? getStateAbbreviation(state) : state.toUpperCase();
  const jurisdictionId = generateJurisdictionId(city, stateShort);

  return {
    jurisdictionId,
    city,
    state,
    stateShort,
    county,
    zip,
    fullAddress,
  };
}

/**
 * Get state abbreviation from full name
 */
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

/**
 * Classify zone type from zone code
 */
export function classifyZone(zone: string): string {
  if (/^SF|^RM-|^RMX/i.test(zone)) return 'residential';
  if (/^CN|^CC/i.test(zone)) return 'commercial';
  if (/^DD/i.test(zone)) return 'downtown';
  if (/^MG|^ML/i.test(zone)) return 'industrial';
  if (/^OL/i.test(zone)) return 'office';
  if (/^PF/i.test(zone)) return 'public';
  if (/^PR/i.test(zone)) return 'parks';
  return 'commercial'; // default
}

/**
 * Get zone-specific slot configuration
 */
export function getZoneSlotConfig(zoneType: string): {
  slot2: { icon: string; label: string; field: string };
  slot7: { icon: string; label: string; field: string };
} {
  const slot2Configs: Record<string, { icon: string; label: string; field: string }> = {
    residential: { icon: '🗑️', label: 'Trash Day', field: 'trashDay' },
    commercial: { icon: '🅿️', label: 'Parking Req', field: 'parkingRatio' },
    downtown: { icon: '📊', label: 'FAR', field: 'far' },
    industrial: { icon: '🚛', label: 'Loading', field: 'loadingRequired' },
    office: { icon: '🅿️', label: 'Parking', field: 'parkingRatio' },
    public: { icon: '🎯', label: 'Current Use', field: 'currentUse' },
    parks: { icon: '🎯', label: 'Current Use', field: 'currentUse' },
  };

  const slot7Configs: Record<string, { icon: string; label: string; field: string }> = {
    parks: { icon: '📍', label: 'Managed By', field: 'managedBy' },
    vacant: { icon: '💰', label: 'Last Sale', field: 'lastSalePrice' },
    default: { icon: '📅', label: 'Built', field: 'yearBuilt' },
  };

  return {
    slot2: slot2Configs[zoneType] || slot2Configs.commercial,
    slot7: slot7Configs[zoneType] || slot7Configs.default,
  };
}
