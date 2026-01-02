import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

/**
 * Fetch zoning polygon data by COUNTY for Cincinnati metro area
 *
 * Counties covered:
 * - Ohio: Hamilton, Warren, Butler, Clermont
 * - Kentucky: Kenton, Campbell, Boone
 *
 * Usage:
 *   npx tsx scripts/fetch-county-zoning.ts [county-id]
 *
 * Examples:
 *   npx tsx scripts/fetch-county-zoning.ts           # Fetch all counties
 *   npx tsx scripts/fetch-county-zoning.ts hamilton  # Fetch Hamilton County only
 *   npx tsx scripts/fetch-county-zoning.ts warren    # Fetch Warren County only
 */

interface GeoJSONFeature {
  type: string;
  id?: number;
  properties: Record<string, any>;
  geometry: {
    type: string;
    coordinates: any;
  };
}

interface GeoJSONResponse {
  type: string;
  features: GeoJSONFeature[];
}

// Cincinnati metro area counties with their GIS endpoints
const METRO_COUNTIES: Record<string, {
  name: string;
  state: string;
  fips?: string;
  zoningUrl: string | null;
  parcelUrl?: string;
  fieldMappings: {
    zoneCode: string[];
    zoneDesc: string[];
    objectId: string[];
    township?: string[];
    city?: string[];
    acres?: string[];
  };
}> = {
  // ===== OHIO COUNTIES =====
  'hamilton': {
    name: 'Hamilton County',
    state: 'OH',
    fips: '39061',
    zoningUrl: 'https://cagisonline.hamilton-co.org/arcgis/rest/services/Countywide_Layers/Zoning/MapServer/4',
    parcelUrl: 'https://cagisonline.hamilton-co.org/arcgis/rest/services/Auditor/Parcel/MapServer/0',
    fieldMappings: {
      zoneCode: ['ZONING_CODE', 'ZONING', 'ZONE_CODE', 'Zone'],
      zoneDesc: ['ZONING_DESC', 'ZONE_DESC', 'ZONING_DESCRIPTION', 'Description'],
      objectId: ['OBJECTID', 'FID', 'OID'],
      city: ['CITY', 'JURISDICTION', 'MUNICPALITY'],
    }
  },
  'warren': {
    name: 'Warren County',
    state: 'OH',
    fips: '39165',
    zoningUrl: 'https://maps.co.warren.oh.us/arcgis/rest/services/PlanZone/Zoning2012/MapServer/147',
    fieldMappings: {
      zoneCode: ['ZONING', 'ZONE', 'ZONE_CODE'],
      zoneDesc: ['ZONE_DESC', 'DESCRIPTION'],
      objectId: ['OBJECTID', 'FID'],
      township: ['TWP', 'TOWNSHIP'],
      acres: ['ACRES'],
    }
  },
  'butler': {
    name: 'Butler County',
    state: 'OH',
    fips: '39017',
    // Butler County uses parcel-level land use codes (LUC) instead of dedicated zoning districts
    // LUC codes: 100s=Agricultural, 300s=Industrial, 400s=Commercial, 500s=Residential, 600s=Exempt
    // CLASS: A=Agricultural, C=Commercial, I=Industrial, R=Residential, E=Exempt, U=Utility
    zoningUrl: 'https://maps.butlercountyauditor.org/arcgis/rest/services/PARCELSEARCH/MapServer/0',
    fieldMappings: {
      zoneCode: ['LUC', 'CLASS'],
      zoneDesc: ['CLASS'],  // We'll map CLASS to a description
      objectId: ['OBJECTID', 'PIN'],
      city: ['LOCATION'],  // Address field that may contain city info
      acres: ['ACRES'],
    }
  },
  'clermont': {
    name: 'Clermont County',
    state: 'OH',
    fips: '39025',
    zoningUrl: 'https://maps.clermontcountyohio.gov/server/rest/services/WMAS/Zoning/MapServer/0',
    fieldMappings: {
      zoneCode: ['DIST', 'ZONE', 'ZONING'],
      zoneDesc: ['DESCRIPTION'],
      objectId: ['OBJECTID'],
      township: ['TOWNSHIP'],
    }
  },

  // ===== KENTUCKY COUNTIES =====
  'kenton': {
    name: 'Kenton County',
    state: 'KY',
    fips: '21117',
    // Kenton County uses LINK-GIS which has city-specific layers
    // Covington has its own Character Districts layer
    zoningUrl: 'https://maps.linkgis.org/server/rest/services/Covington_Character_Districts/MapServer/3',
    fieldMappings: {
      zoneCode: ['CITY_ZONE', 'PRIMARY_ZO', 'Zone', 'ZONING'],
      zoneDesc: ['CITY_OVERLAY', 'ZONE_DESC'],
      objectId: ['OBJECTID'],
    }
  },
  'campbell': {
    name: 'Campbell County',
    state: 'KY',
    fips: '21037',
    zoningUrl: 'https://maps.linkgis.org/server/rest/services/Identify_Zoning/MapServer/1',
    fieldMappings: {
      zoneCode: ['ZONE', 'ZONING', 'CITY_ZONE'],
      zoneDesc: ['ZONE_ALIAS', 'ZONE_HELP', 'ZONE_DESC', 'DESCRIPTION'],
      objectId: ['OBJECTID'],
      city: ['CITY_NAME'],
    }
  },
  'boone': {
    name: 'Boone County',
    state: 'KY',
    fips: '21015',
    zoningUrl: 'https://secure.boonecountygis.com/server/rest/services/Labels_PlanningAndZoning/MapServer/52',
    fieldMappings: {
      zoneCode: ['ZONINGLABL', 'BASEZONING', 'ZONE', 'ZONING'],
      zoneDesc: ['ZONINGDESC', 'ZONE_DESC'],
      objectId: ['OBJECTID'],
      city: ['JURISDICTN'],
    }
  }
};

async function fetchGeoJSON(url: string, pageSize: number = 1000): Promise<GeoJSONFeature[]> {
  const allFeatures: GeoJSONFeature[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({
      where: '1=1',
      outFields: '*',
      f: 'geojson',
      returnGeometry: 'true',
      resultOffset: offset.toString(),
      resultRecordCount: pageSize.toString(),
    });

    const fullUrl = `${url}/query?${params.toString()}`;

    try {
      const response = await fetch(fullUrl);

      if (!response.ok) {
        console.log(`   HTTP ${response.status} error`);
        return allFeatures;
      }

      const data: GeoJSONResponse = await response.json();

      if (!data.features || data.features.length === 0) {
        hasMore = false;
        break;
      }

      allFeatures.push(...data.features);
      console.log(`   Fetched ${data.features.length} features (total: ${allFeatures.length})`);

      if (data.features.length < pageSize) {
        hasMore = false;
      } else {
        offset += pageSize;
      }
    } catch (error: any) {
      console.log(`   Fetch error: ${error.message}`);
      hasMore = false;
    }
  }

  return allFeatures;
}

function extractField(props: Record<string, any>, fieldNames: string[]): string | null {
  for (const field of fieldNames) {
    if (props[field] !== undefined && props[field] !== null && props[field] !== '') {
      return String(props[field]);
    }
  }
  return null;
}

function calculateCentroid(geometry: any): { lat: number | null; lon: number | null } {
  if (!geometry) return { lat: null, lon: null };

  try {
    let coords: number[][] = [];

    if (geometry.type === 'Polygon' && geometry.coordinates?.[0]) {
      coords = geometry.coordinates[0];
    } else if (geometry.type === 'MultiPolygon' && geometry.coordinates?.[0]?.[0]) {
      coords = geometry.coordinates[0][0];
    } else if (geometry.type === 'Point' && geometry.coordinates) {
      return { lon: geometry.coordinates[0], lat: geometry.coordinates[1] };
    }

    if (coords.length === 0) return { lat: null, lon: null };

    const latSum = coords.reduce((sum, coord) => sum + coord[1], 0);
    const lonSum = coords.reduce((sum, coord) => sum + coord[0], 0);

    return {
      lat: latSum / coords.length,
      lon: lonSum / coords.length,
    };
  } catch {
    return { lat: null, lon: null };
  }
}

function calculateBbox(geometry: any): number[] | null {
  if (!geometry) return null;

  try {
    let coords: number[][] = [];

    if (geometry.type === 'Polygon' && geometry.coordinates?.[0]) {
      coords = geometry.coordinates[0];
    } else if (geometry.type === 'MultiPolygon') {
      // Flatten all coordinates
      for (const polygon of geometry.coordinates) {
        for (const ring of polygon) {
          coords.push(...ring);
        }
      }
    }

    if (coords.length === 0) return null;

    const lons = coords.map(c => c[0]);
    const lats = coords.map(c => c[1]);

    return [
      Math.min(...lons), // minX
      Math.min(...lats), // minY
      Math.max(...lons), // maxX
      Math.max(...lats), // maxY
    ];
  } catch {
    return null;
  }
}

async function ensureCountyExists(countyKey: string, config: typeof METRO_COUNTIES[string]): Promise<string> {
  // Try to find existing county
  let county = await prisma.county.findUnique({
    where: {
      name_state: {
        name: config.name,
        state: config.state,
      }
    }
  });

  if (!county) {
    // Create new county
    county = await prisma.county.create({
      data: {
        name: config.name,
        state: config.state,
        fips: config.fips,
        zoningServiceUrl: config.zoningUrl,
        parcelServiceUrl: config.parcelUrl,
        dataQuality: config.zoningUrl ? 'pending' : 'unavailable',
      }
    });
    console.log(`   Created county record: ${config.name}, ${config.state}`);
  } else {
    // Update service URLs if changed
    await prisma.county.update({
      where: { id: county.id },
      data: {
        zoningServiceUrl: config.zoningUrl,
        parcelServiceUrl: config.parcelUrl,
      }
    });
  }

  return county.id;
}

async function fetchCountyZoning(countyKey: string) {
  const config = METRO_COUNTIES[countyKey];
  if (!config) {
    console.error(`Unknown county: ${countyKey}`);
    return null;
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📍 ${config.name}, ${config.state}`);
  console.log(`${'═'.repeat(60)}`);

  // Ensure county exists in DB
  const countyId = await ensureCountyExists(countyKey, config);

  if (!config.zoningUrl) {
    console.log(`   ⚠️ No zoning service URL configured`);
    await prisma.county.update({
      where: { id: countyId },
      data: { dataQuality: 'unavailable' }
    });
    return {
      countyKey,
      name: config.name,
      status: 'skipped',
      reason: 'No zoning URL',
      polygons: 0,
    };
  }

  console.log(`   Source: ${config.zoningUrl}`);
  console.log(`   Fetching zoning polygons...`);

  const features = await fetchGeoJSON(config.zoningUrl);

  if (features.length === 0) {
    console.log(`   ⚠️ No features returned`);
    await prisma.county.update({
      where: { id: countyId },
      data: { dataQuality: 'unavailable' }
    });
    return {
      countyKey,
      name: config.name,
      status: 'failed',
      reason: 'No features returned',
      polygons: 0,
    };
  }

  console.log(`   ✓ Received ${features.length} features`);
  console.log(`   Loading into database...`);

  // Clear existing polygons for this county
  const deleted = await prisma.zoningPolygon.deleteMany({
    where: { countyId }
  });
  console.log(`   Cleared ${deleted.count} existing records`);

  let loaded = 0;
  let skipped = 0;
  let errors = 0;

  for (const feature of features) {
    try {
      const props = feature.properties;

      const zoneCode = extractField(props, config.fieldMappings.zoneCode);
      const objectId = extractField(props, config.fieldMappings.objectId) || String(feature.id);

      if (!zoneCode) {
        skipped++;
        continue;
      }

      const { lat, lon } = calculateCentroid(feature.geometry);
      const bbox = calculateBbox(feature.geometry);

      await prisma.zoningPolygon.create({
        data: {
          countyId,
          sourceObjectId: objectId,
          zoneCode,
          zoneDescription: extractField(props, config.fieldMappings.zoneDesc),
          township: config.fieldMappings.township
            ? extractField(props, config.fieldMappings.township)
            : null,
          city: config.fieldMappings.city
            ? extractField(props, config.fieldMappings.city)
            : null,
          acres: config.fieldMappings.acres
            ? parseFloat(extractField(props, config.fieldMappings.acres) || '0') || null
            : null,
          latitude: lat,
          longitude: lon,
          geometry: feature.geometry,
          bbox: bbox,
          sourceUrl: config.zoningUrl,
          rawProperties: props,
        }
      });

      loaded++;

      if (loaded % 500 === 0) {
        process.stdout.write(`\r   Progress: ${loaded} loaded, ${skipped} skipped, ${errors} errors`);
      }
    } catch (error: any) {
      errors++;
      if (errors < 5) {
        console.error(`\n   Error: ${error.message}`);
      }
    }
  }

  console.log(`\n   ✓ Loaded: ${loaded}, Skipped: ${skipped}, Errors: ${errors}`);

  // Update county metadata
  await prisma.county.update({
    where: { id: countyId },
    data: {
      lastFetched: new Date(),
      dataQuality: loaded > 0 ? 'complete' : 'partial',
    }
  });

  return {
    countyKey,
    name: config.name,
    status: 'success',
    polygons: loaded,
    skipped,
    errors,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const targetCounty = args[0]?.toLowerCase();

  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║  Cincinnati Metro Area - County Zoning Data Fetcher                        ║
║                                                                            ║
║  Fetching zoning polygon data at the COUNTY level                          ║
║  This provides complete coverage for all cities/townships within           ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

  const results: Array<{
    countyKey: string;
    name: string;
    status: string;
    polygons: number;
    reason?: string;
  }> = [];

  const countiesToProcess = targetCounty
    ? [targetCounty]
    : Object.keys(METRO_COUNTIES);

  console.log(`Processing ${countiesToProcess.length} ${countiesToProcess.length === 1 ? 'county' : 'counties'}...`);

  for (const countyKey of countiesToProcess) {
    if (!METRO_COUNTIES[countyKey]) {
      console.log(`\n⚠️ Unknown county: ${countyKey}`);
      continue;
    }

    const result = await fetchCountyZoning(countyKey);
    if (result) {
      results.push(result);
    }
  }

  // Summary
  console.log(`\n\n${'═'.repeat(60)}`);
  console.log(`📊 COUNTY ZONING FETCH SUMMARY`);
  console.log(`${'═'.repeat(60)}\n`);

  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status !== 'success');

  if (successful.length > 0) {
    console.log(`✅ Successful: ${successful.length}`);
    for (const r of successful) {
      console.log(`   - ${r.name}: ${r.polygons.toLocaleString()} polygons`);
    }
  }

  if (failed.length > 0) {
    console.log(`\n❌ Failed/Skipped: ${failed.length}`);
    for (const r of failed) {
      console.log(`   - ${r.name}: ${r.reason || r.status}`);
    }
  }

  const totalPolygons = results.reduce((sum, r) => sum + (r.polygons || 0), 0);
  console.log(`\n📈 Total polygons loaded: ${totalPolygons.toLocaleString()}`);

  // Save summary
  const summaryPath = path.join(process.cwd(), 'data', 'county-zoning-summary.json');
  fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
  fs.writeFileSync(summaryPath, JSON.stringify({
    fetchedAt: new Date().toISOString(),
    totalCounties: results.length,
    successful: successful.length,
    failed: failed.length,
    totalPolygons,
    results,
  }, null, 2));
  console.log(`\n📄 Summary saved to: ${summaryPath}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Fatal error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
