import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

/**
 * Fetch zoning polygon data for ALL Cincinnati metro cities
 *
 * Sources:
 * - Hamilton County (OH): CAGIS
 * - Warren County (OH): Warren County GIS
 * - Butler County (OH): Butler County GIS
 * - Clermont County (OH): Clermont County GIS
 * - Kenton County (KY): LINK-GIS
 * - Campbell County (KY): Campbell County PVA
 * - Boone County (KY): Boone County PVA
 *
 * Usage:
 *   npx tsx scripts/fetch-metro-zoning.ts
 */

interface GeoJSONFeature {
  type: string;
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

// County GIS configurations with zoning endpoints
const COUNTY_ZONING_SOURCES: Record<string, {
  name: string;
  state: string;
  zoningUrl: string | null;
  zoningLayer?: number;
  jurisdictions: string[];
  fieldMappings: {
    zoneCode: string[];
    zoneDesc: string[];
    objectId: string[];
  };
}> = {
  'hamilton-oh': {
    name: 'Hamilton County',
    state: 'OH',
    zoningUrl: 'https://cagisonline.hamilton-co.org/arcgis/rest/services/Countywide_Layers/Zoning/MapServer/4',
    jurisdictions: [
      'cincinnati-oh', 'norwood-oh', 'blue-ash-oh', 'sharonville-oh',
      'montgomery-oh', 'madeira-oh', 'reading-oh', 'deer-park-oh',
      'springdale-oh', 'forest-park-oh'
    ],
    fieldMappings: {
      zoneCode: ['ZONING_CODE', 'ZONING', 'ZONE_CODE', 'Zone'],
      zoneDesc: ['ZONING_DESC', 'ZONE_DESC', 'ZONING_DESCRIPTION', 'Description'],
      objectId: ['OBJECTID', 'FID', 'OID']
    }
  },
  'warren-oh': {
    name: 'Warren County',
    state: 'OH',
    zoningUrl: 'https://maps.co.warren.oh.us/arcgis/rest/services/PlanZone/Zoning2012/MapServer/147',
    jurisdictions: ['mason-oh', 'lebanon-oh', 'loveland-oh'],
    fieldMappings: {
      zoneCode: ['ZONE', 'ZONING', 'ZONE_CODE', 'ZoningCode', 'Zoning'],
      zoneDesc: ['ZONE_DESC', 'DESCRIPTION', 'NAME', 'ZoningDesc', 'Description'],
      objectId: ['OBJECTID', 'FID']
    }
  },
  'butler-oh': {
    name: 'Butler County',
    state: 'OH',
    zoningUrl: 'https://gis.bcohio.us/arcgis/rest/services/Zoning/MapServer/0',
    jurisdictions: ['hamilton-oh', 'fairfield-oh', 'middletown-oh'],
    fieldMappings: {
      zoneCode: ['ZONE', 'ZONING', 'ZONE_CODE'],
      zoneDesc: ['ZONE_DESC', 'DESCRIPTION'],
      objectId: ['OBJECTID', 'FID']
    }
  },
  'clermont-oh': {
    name: 'Clermont County',
    state: 'OH',
    zoningUrl: 'https://gis.clermontauditor.org/arcgis/rest/services/Zoning/MapServer/0',
    jurisdictions: ['milford-oh'],
    fieldMappings: {
      zoneCode: ['ZONE', 'ZONING'],
      zoneDesc: ['DESCRIPTION'],
      objectId: ['OBJECTID']
    }
  },
  'kenton-ky': {
    name: 'Kenton County',
    state: 'KY',
    zoningUrl: 'https://maps.linkgis.org/server/rest/services',
    jurisdictions: ['covington-ky', 'erlanger-ky', 'fort-mitchell-ky', 'independence-ky'],
    fieldMappings: {
      zoneCode: ['CITY_ZONE', 'PRIMARY_ZO', 'Zone', 'ZONING'],
      zoneDesc: ['CITY_OVERLAY', 'ZONE_DESC'],
      objectId: ['OBJECTID']
    }
  },
  'campbell-ky': {
    name: 'Campbell County',
    state: 'KY',
    zoningUrl: 'https://maps.linkgis.org/server/rest/services',
    jurisdictions: ['newport-ky', 'fort-thomas-ky', 'cold-spring-ky', 'bellevue-ky', 'dayton-ky'],
    fieldMappings: {
      zoneCode: ['ZONE', 'ZONING', 'CITY_ZONE'],
      zoneDesc: ['ZONE_DESC', 'DESCRIPTION'],
      objectId: ['OBJECTID']
    }
  },
  'boone-ky': {
    name: 'Boone County',
    state: 'KY',
    zoningUrl: 'https://maps.linkgis.org/server/rest/services',
    jurisdictions: ['florence-ky'],
    fieldMappings: {
      zoneCode: ['ZONE', 'ZONING'],
      zoneDesc: ['ZONE_DESC'],
      objectId: ['OBJECTID']
    }
  }
};

// City-specific zoning service URLs (when different from county)
const CITY_ZONING_OVERRIDES: Record<string, string> = {
  'covington-ky': 'https://maps.linkgis.org/server/rest/services/Covington_Character_Districts/MapServer/3',
  'newport-ky': 'https://maps.linkgis.org/server/rest/services/Newport/Zoning/MapServer/0',
  'florence-ky': 'https://maps.linkgis.org/server/rest/services/Florence/Zoning/MapServer/0',
  'erlanger-ky': 'https://maps.linkgis.org/server/rest/services/Erlanger/Zoning/MapServer/0',
  'fort-thomas-ky': 'https://maps.linkgis.org/server/rest/services/FortThomas/Zoning/MapServer/0',
  'fort-mitchell-ky': 'https://maps.linkgis.org/server/rest/services/FortMitchell/Zoning/MapServer/0',
  'independence-ky': 'https://maps.linkgis.org/server/rest/services/Independence/Zoning/MapServer/0',
  'cold-spring-ky': 'https://maps.linkgis.org/server/rest/services/ColdSpring/Zoning/MapServer/0',
  'bellevue-ky': 'https://maps.linkgis.org/server/rest/services/Bellevue/Zoning/MapServer/0',
  'dayton-ky': 'https://maps.linkgis.org/server/rest/services/Dayton/Zoning/MapServer/0',
};

async function fetchZoningData(url: string, pageSize: number = 1000): Promise<GeoJSONFeature[]> {
  const allFeatures: GeoJSONFeature[] = [];
  let offset = 0;

  while (true) {
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
        console.log(`   ⚠️ HTTP ${response.status} - trying alternative endpoint...`);
        return allFeatures;
      }

      const data: GeoJSONResponse = await response.json();

      if (!data.features || data.features.length === 0) {
        break;
      }

      allFeatures.push(...data.features);
      console.log(`   Fetched ${data.features.length} features (total: ${allFeatures.length})`);

      if (data.features.length < pageSize) {
        break;
      }

      offset += pageSize;
    } catch (error: any) {
      console.log(`   ⚠️ Fetch error: ${error.message}`);
      break;
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
  let latitude: number | null = null;
  let longitude: number | null = null;

  if (geometry && geometry.type === 'Polygon' && geometry.coordinates?.[0]) {
    const coords = geometry.coordinates[0];
    const latSum = coords.reduce((sum: number, coord: number[]) => sum + coord[1], 0);
    const lonSum = coords.reduce((sum: number, coord: number[]) => sum + coord[0], 0);
    latitude = latSum / coords.length;
    longitude = lonSum / coords.length;
  } else if (geometry && geometry.type === 'MultiPolygon' && geometry.coordinates?.[0]?.[0]) {
    const coords = geometry.coordinates[0][0];
    const latSum = coords.reduce((sum: number, coord: number[]) => sum + coord[1], 0);
    const lonSum = coords.reduce((sum: number, coord: number[]) => sum + coord[0], 0);
    latitude = latSum / coords.length;
    longitude = lonSum / coords.length;
  } else if (geometry && geometry.type === 'Point' && geometry.coordinates) {
    longitude = geometry.coordinates[0];
    latitude = geometry.coordinates[1];
  }

  return { lat: latitude, lon: longitude };
}

async function processJurisdiction(
  jurisdictionId: string,
  features: GeoJSONFeature[],
  fieldMappings: { zoneCode: string[]; zoneDesc: string[]; objectId: string[] },
  sourceUrl: string
): Promise<{ loaded: number; skipped: number; errors: number }> {
  let loaded = 0;
  let skipped = 0;
  let errors = 0;

  // Clear existing zoning data
  const deleted = await prisma.zoningParcel.deleteMany({
    where: { jurisdictionId },
  });
  console.log(`   Cleared ${deleted.count} existing records`);

  for (const feature of features) {
    try {
      const props = feature.properties;

      const zoneCode = extractField(props, fieldMappings.zoneCode);
      const zoneDescription = extractField(props, fieldMappings.zoneDesc);
      const objectId = extractField(props, fieldMappings.objectId);

      if (!zoneCode) {
        skipped++;
        continue;
      }

      const { lat, lon } = calculateCentroid(feature.geometry);
      const cityPrefix = jurisdictionId.split('-')[0].toUpperCase().slice(0, 3);

      await prisma.zoningParcel.create({
        data: {
          jurisdictionId,
          address: `Zone ${zoneCode}`,
          parcelId: `${cityPrefix}-${objectId || loaded}`,
          zoneCode,
          zoneDescription,
          latitude: lat,
          longitude: lon,
          geometry: feature.geometry,
          sourceUrl,
        },
      });

      loaded++;

      if (loaded % 100 === 0) {
        process.stdout.write(`\r   Progress: ${loaded} loaded, ${skipped} skipped, ${errors} errors`);
      }
    } catch (error: any) {
      errors++;
      if (errors < 3) {
        console.error(`\n   Error: ${error.message}`);
      }
    }
  }

  return { loaded, skipped, errors };
}

async function fetchMetroZoning() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║  Cincinnati Metro Area Zoning GIS Data Fetcher                             ║
║                                                                            ║
║  Fetching zoning polygon data for all metro jurisdictions                  ║
║  Sources: CAGIS, Warren/Butler/Clermont County GIS, LINK-GIS               ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

  const results: Array<{
    jurisdictionId: string;
    name: string;
    polygons: number;
    status: 'success' | 'partial' | 'failed';
    error?: string;
  }> = [];

  // Get all jurisdictions
  const allJurisdictions = await prisma.jurisdiction.findMany({
    where: {
      OR: [
        { state: 'OH' },
        { state: 'KY' }
      ]
    },
    orderBy: { name: 'asc' }
  });

  console.log(`Found ${allJurisdictions.length} jurisdictions to process\n`);

  for (const jurisdiction of allJurisdictions) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🏛️  ${jurisdiction.name}, ${jurisdiction.state} (${jurisdiction.id})`);
    console.log(`${'='.repeat(60)}`);

    try {
      // Check for city-specific override first
      let zoningUrl = CITY_ZONING_OVERRIDES[jurisdiction.id];
      let fieldMappings = {
        zoneCode: ['CITY_ZONE', 'PRIMARY_ZO', 'Zone', 'ZONING', 'ZONE_CODE', 'ZONING_CODE'],
        zoneDesc: ['CITY_OVERLAY', 'ZONE_DESC', 'ZONING_DESC', 'DESCRIPTION'],
        objectId: ['OBJECTID', 'FID', 'OID']
      };

      // If no override, find county config
      if (!zoningUrl) {
        for (const [countyId, config] of Object.entries(COUNTY_ZONING_SOURCES)) {
          if (config.jurisdictions.includes(jurisdiction.id) && config.zoningUrl) {
            zoningUrl = config.zoningUrl;
            fieldMappings = config.fieldMappings;
            break;
          }
        }
      }

      if (!zoningUrl) {
        console.log(`   ⚠️ No zoning service configured - skipping`);
        results.push({
          jurisdictionId: jurisdiction.id,
          name: jurisdiction.name,
          polygons: 0,
          status: 'failed',
          error: 'No zoning service configured'
        });
        continue;
      }

      console.log(`   Source: ${zoningUrl}`);
      console.log(`   Fetching zoning polygons...`);

      const features = await fetchZoningData(zoningUrl);

      if (features.length === 0) {
        console.log(`   ⚠️ No features returned from API`);
        results.push({
          jurisdictionId: jurisdiction.id,
          name: jurisdiction.name,
          polygons: 0,
          status: 'failed',
          error: 'No features returned'
        });
        continue;
      }

      console.log(`   ✓ Received ${features.length} features`);
      console.log(`   Loading into database...`);

      const { loaded, skipped, errors } = await processJurisdiction(
        jurisdiction.id,
        features,
        fieldMappings,
        zoningUrl
      );

      console.log(`\n   ✓ Loaded: ${loaded}, Skipped: ${skipped}, Errors: ${errors}`);

      // Update jurisdiction data completeness
      await prisma.jurisdiction.update({
        where: { id: jurisdiction.id },
        data: {
          dataCompleteness: 95,
        },
      });

      results.push({
        jurisdictionId: jurisdiction.id,
        name: jurisdiction.name,
        polygons: loaded,
        status: loaded > 0 ? 'success' : 'partial'
      });

      // Small delay between jurisdictions
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({
        jurisdictionId: jurisdiction.id,
        name: jurisdiction.name,
        polygons: 0,
        status: 'failed',
        error: error.message
      });
    }
  }

  // Summary
  console.log(`\n\n${'═'.repeat(60)}`);
  console.log(`📊 ZONING DATA FETCH SUMMARY`);
  console.log(`${'═'.repeat(60)}\n`);

  const successful = results.filter(r => r.status === 'success');
  const partial = results.filter(r => r.status === 'partial');
  const failed = results.filter(r => r.status === 'failed');

  console.log(`✅ Successful: ${successful.length}`);
  for (const r of successful) {
    console.log(`   - ${r.name}: ${r.polygons} polygons`);
  }

  if (partial.length > 0) {
    console.log(`\n⚠️ Partial: ${partial.length}`);
    for (const r of partial) {
      console.log(`   - ${r.name}: ${r.polygons} polygons`);
    }
  }

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}`);
    for (const r of failed) {
      console.log(`   - ${r.name}: ${r.error}`);
    }
  }

  const totalPolygons = results.reduce((sum, r) => sum + r.polygons, 0);
  console.log(`\n📈 Total polygons loaded: ${totalPolygons.toLocaleString()}`);

  // Save summary
  const summaryPath = path.join(process.cwd(), 'data', 'zoning-fetch-summary.json');
  fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
  fs.writeFileSync(summaryPath, JSON.stringify({
    fetchedAt: new Date().toISOString(),
    totalJurisdictions: results.length,
    successful: successful.length,
    partial: partial.length,
    failed: failed.length,
    totalPolygons,
    results
  }, null, 2));
  console.log(`\n📄 Summary saved to: ${summaryPath}`);
}

// Run
fetchMetroZoning()
  .catch((e) => {
    console.error('Fetch error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
