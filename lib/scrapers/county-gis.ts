import axios from 'axios';

/**
 * County GIS configuration
 */
interface CountyGISConfig {
  name: string;
  state: string;
  parcelService: string;
  zoningService: string | null;
  jurisdictions: string[];
}

/**
 * County GIS endpoints for Cincinnati metro
 */
const COUNTY_GIS: Record<string, CountyGISConfig> = {
  // Ohio counties
  'hamilton-oh': {
    name: 'Hamilton County',
    state: 'OH',
    parcelService:
      'https://cagisonline.hamilton-co.org/arcgis/rest/services/Auditor/Parcel/MapServer/0',
    zoningService:
      'https://cagisonline.hamilton-co.org/arcgis/rest/services/Planning/Zoning/MapServer/0',
    jurisdictions: [
      'cincinnati-oh',
      'norwood-oh',
      'blue-ash-oh',
      'sharonville-oh',
      'montgomery-oh',
      'madeira-oh',
      'reading-oh',
      'deer-park-oh',
    ],
  },
  'warren-oh': {
    name: 'Warren County',
    state: 'OH',
    parcelService:
      'https://gis.co.warren.oh.us/arcgis/rest/services/Auditor/Parcels/MapServer/0',
    zoningService:
      'https://gis.co.warren.oh.us/arcgis/rest/services/Planning/Zoning/MapServer/0',
    jurisdictions: ['mason-oh', 'lebanon-oh', 'loveland-oh'],
  },
  'butler-oh': {
    name: 'Butler County',
    state: 'OH',
    parcelService:
      'https://gis.bcohio.us/arcgis/rest/services/Auditor/Parcels/MapServer/0',
    zoningService:
      'https://gis.bcohio.us/arcgis/rest/services/Planning/Zoning/MapServer/0',
    jurisdictions: ['hamilton-oh', 'fairfield-oh', 'middletown-oh'],
  },
  'clermont-oh': {
    name: 'Clermont County',
    state: 'OH',
    parcelService:
      'https://gis.clermontauditor.org/arcgis/rest/services/Parcels/MapServer/0',
    zoningService: null,
    jurisdictions: ['milford-oh'],
  },
  // Kentucky counties
  'kenton-ky': {
    name: 'Kenton County',
    state: 'KY',
    parcelService:
      'https://kygeonet.ky.gov/arcgis/rest/services/Parcels/MapServer/0',
    zoningService:
      'https://maps.linkgis.org/server/rest/services/Covington_Character_Districts/MapServer/3', // LINK-GIS Character Districts
    jurisdictions: [
      'covington-ky',
      'erlanger-ky',
      'fort-mitchell-ky',
      'independence-ky',
    ],
  },
  'boone-ky': {
    name: 'Boone County',
    state: 'KY',
    parcelService:
      'https://kygeonet.ky.gov/arcgis/rest/services/Parcels/MapServer/0',
    zoningService: null,
    jurisdictions: ['florence-ky', 'burlington-ky', 'union-ky'],
  },
  'campbell-ky': {
    name: 'Campbell County',
    state: 'KY',
    parcelService:
      'https://kygeonet.ky.gov/arcgis/rest/services/Parcels/MapServer/0',
    zoningService: null,
    jurisdictions: ['newport-ky', 'fort-thomas-ky', 'cold-spring-ky'],
  },
};

export interface CountyInfo extends CountyGISConfig {
  countyId: string;
}

export interface ZoningDistrictResult {
  countyId: string;
  countyName: string;
  districts: Array<Record<string, any>>;
  error?: string;
}

export interface ParcelInfo {
  [key: string]: any;
}

/**
 * Find which county a jurisdiction is in
 */
export function getCountyForJurisdiction(
  jurisdictionId: string
): CountyInfo | null {
  for (const [countyId, config] of Object.entries(COUNTY_GIS)) {
    if (config.jurisdictions.includes(jurisdictionId)) {
      return { countyId, ...config };
    }
  }
  return null;
}

/**
 * Get all counties
 */
export function getAllCounties(): Array<CountyInfo> {
  return Object.entries(COUNTY_GIS).map(([countyId, config]) => ({
    countyId,
    ...config,
  }));
}

/**
 * Query ArcGIS REST API
 */
async function queryArcGIS(
  serviceUrl: string,
  params: Record<string, any>
): Promise<any> {
  const url = `${serviceUrl}/query`;
  const response = await axios.get(url, {
    params: {
      f: 'json',
      outFields: '*',
      returnGeometry: false,
      ...params,
    },
    timeout: 30000,
  });
  return response.data;
}

/**
 * Get all unique zoning districts from county GIS
 */
export async function getZoningDistricts(
  countyId: string
): Promise<ZoningDistrictResult> {
  const config = COUNTY_GIS[countyId];
  if (!config) {
    return {
      countyId,
      countyName: 'Unknown',
      districts: [],
      error: 'County not found',
    };
  }

  if (!config.zoningService) {
    return {
      countyId,
      countyName: config.name,
      districts: [],
      error: 'No zoning service available',
    };
  }

  try {
    const result = await queryArcGIS(config.zoningService, {
      where: '1=1',
      returnDistinctValues: true,
      outFields: 'ZONING,ZONE_DESC,ZONE_TYPE',
    });

    const districts = result.features?.map((f: any) => f.attributes) || [];
    return {
      countyId,
      countyName: config.name,
      districts,
    };
  } catch (error: any) {
    return {
      countyId,
      countyName: config.name,
      districts: [],
      error: error.message,
    };
  }
}

/**
 * Get parcel info by address
 */
export async function getParcelByAddress(
  countyId: string,
  address: string
): Promise<ParcelInfo | null> {
  const config = COUNTY_GIS[countyId];
  if (!config) return null;

  try {
    // Escape single quotes in address
    const escapedAddress = address.replace(/'/g, "''");

    const result = await queryArcGIS(config.parcelService, {
      where: `UPPER(SITEADDR) LIKE UPPER('%${escapedAddress}%')`,
      outFields: '*',
    });

    return result.features?.[0]?.attributes || null;
  } catch (error) {
    console.error('Parcel lookup error:', error);
    return null;
  }
}

/**
 * Get parcel info by parcel ID
 */
export async function getParcelById(
  countyId: string,
  parcelId: string
): Promise<ParcelInfo | null> {
  const config = COUNTY_GIS[countyId];
  if (!config) return null;

  try {
    const result = await queryArcGIS(config.parcelService, {
      where: `PARCELID = '${parcelId}' OR PARID = '${parcelId}'`,
      outFields: '*',
    });

    return result.features?.[0]?.attributes || null;
  } catch (error) {
    console.error('Parcel lookup error:', error);
    return null;
  }
}

/**
 * Get all parcels for a jurisdiction (for analysis)
 */
export async function getJurisdictionParcels(
  jurisdictionId: string,
  limit: number = 100
): Promise<ParcelInfo[]> {
  const county = getCountyForJurisdiction(jurisdictionId);
  if (!county) return [];

  try {
    // Extract city name from jurisdiction ID
    const cityName = jurisdictionId.split('-')[0];

    const result = await queryArcGIS(county.parcelService, {
      where: `UPPER(CITY) LIKE UPPER('%${cityName}%')`,
      resultRecordCount: limit,
    });

    return result.features?.map((f: any) => f.attributes) || [];
  } catch (error) {
    console.error('Jurisdiction parcels error:', error);
    return [];
  }
}

/**
 * Get zoning for a specific location by coordinates
 */
export async function getZoningByCoords(
  countyId: string,
  lat: number,
  lon: number
): Promise<ParcelInfo | null> {
  const config = COUNTY_GIS[countyId];
  if (!config || !config.zoningService) return null;

  try {
    const result = await queryArcGIS(config.zoningService, {
      geometry: JSON.stringify({
        x: lon,
        y: lat,
        spatialReference: { wkid: 4326 },
      }),
      geometryType: 'esriGeometryPoint',
      spatialRel: 'esriSpatialRelIntersects',
      inSR: 4326,
      outFields: '*',
    });

    return result.features?.[0]?.attributes || null;
  } catch (error) {
    console.error('Zoning by coords error:', error);
    return null;
  }
}

/**
 * Search parcels by owner name
 */
export async function searchParcelsByOwner(
  countyId: string,
  ownerName: string,
  limit: number = 50
): Promise<ParcelInfo[]> {
  const config = COUNTY_GIS[countyId];
  if (!config) return [];

  try {
    const escapedName = ownerName.replace(/'/g, "''");

    const result = await queryArcGIS(config.parcelService, {
      where: `UPPER(OWNER) LIKE UPPER('%${escapedName}%')`,
      resultRecordCount: limit,
    });

    return result.features?.map((f: any) => f.attributes) || [];
  } catch (error) {
    console.error('Owner search error:', error);
    return [];
  }
}
