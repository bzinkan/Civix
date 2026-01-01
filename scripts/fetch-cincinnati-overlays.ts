import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

/**
 * Fetch Cincinnati overlay district data from CAGIS
 *
 * Overlay layers from CAGIS Zoning MapServer:
 * - Layer 1: Urban Design Districts
 * - Layer 2: Historic Districts
 * - Layer 3: Hillside Districts
 *
 * Additional layers:
 * - Countywide_Layers/Other_Districts Layer 8: Landslide Susceptibility
 */

interface OverlayConfig {
  name: string;
  type: 'historic' | 'hillside' | 'urban_design' | 'landslide' | 'flood';
  apiUrl: string;
  nameField: string;
  descField?: string;
}

const OVERLAY_CONFIGS: OverlayConfig[] = [
  {
    name: 'Historic Districts',
    type: 'historic',
    apiUrl: 'https://cagisonline.hamilton-co.org/arcgis/rest/services/Countywide_Layers/Zoning/MapServer/2/query',
    nameField: 'DISTRICT_N',
    descField: 'DESCRIPTIO',
  },
  {
    name: 'Hillside Districts',
    type: 'hillside',
    apiUrl: 'https://cagisonline.hamilton-co.org/arcgis/rest/services/Countywide_Layers/Zoning/MapServer/3/query',
    nameField: 'DISTRICT_N',
    descField: 'DESCRIPTIO',
  },
  {
    name: 'Urban Design Districts',
    type: 'urban_design',
    apiUrl: 'https://cagisonline.hamilton-co.org/arcgis/rest/services/Countywide_Layers/Zoning/MapServer/1/query',
    nameField: 'DISTRICT_N',
    descField: 'DESCRIPTIO',
  },
  {
    name: 'Landslide Susceptibility',
    type: 'landslide',
    apiUrl: 'https://cagisonline.hamilton-co.org/arcgis/rest/services/Countywide_Layers/Other_Districts/MapServer/8/query',
    nameField: 'SUSCEPTIBI',
    descField: 'DESCRIPTIO',
  },
];

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

async function fetchOverlayData(config: OverlayConfig): Promise<GeoJSONFeature[]> {
  console.log(`\nFetching ${config.name}...`);
  console.log(`   URL: ${config.apiUrl}`);

  const allFeatures: GeoJSONFeature[] = [];
  let offset = 0;
  const pageSize = 2000;

  while (true) {
    const params = new URLSearchParams({
      where: '1=1',
      outFields: '*',
      f: 'geojson',
      returnGeometry: 'true',
      resultOffset: offset.toString(),
      resultRecordCount: pageSize.toString(),
    });

    const fullUrl = `${config.apiUrl}?${params.toString()}`;
    const response = await fetch(fullUrl);

    if (!response.ok) {
      console.error(`   ERROR: HTTP ${response.status}`);
      break;
    }

    const data: GeoJSONResponse = await response.json();

    if (!data.features || data.features.length === 0) {
      break;
    }

    allFeatures.push(...data.features);
    console.log(`   Fetched ${data.features.length} records (total: ${allFeatures.length})`);

    if (data.features.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  return allFeatures;
}

async function main() {
  console.log(`
Cincinnati Overlay Districts Fetcher

This script fetches overlay district data from CAGIS:
- Historic Districts (requires Historic Conservation Board review)
- Hillside Districts (slope/geology restrictions)
- Urban Design Districts (design review for development)
- Landslide Susceptibility Areas

Starting fetch...
`);

  const jurisdictionId = process.argv[2];

  if (!jurisdictionId) {
    console.error('ERROR: Jurisdiction ID required');
    console.error('Usage: npx tsx scripts/fetch-cincinnati-overlays.ts <jurisdiction-id>');
    process.exit(1);
  }

  // Verify jurisdiction exists
  const jurisdiction = await prisma.jurisdiction.findUnique({
    where: { id: jurisdictionId },
  });

  if (!jurisdiction) {
    console.error(`ERROR: Jurisdiction not found: ${jurisdictionId}`);
    process.exit(1);
  }

  console.log(`[OK] Jurisdiction: ${jurisdiction.name}, ${jurisdiction.state}`);

  // Create output directory
  const outputDir = path.join(process.cwd(), 'data', 'cincinnati', 'overlays');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Clear existing overlay data
  console.log(`\nClearing existing overlay data...`);
  const deleted = await prisma.overlayDistrict.deleteMany({
    where: { jurisdictionId },
  });
  console.log(`   Deleted ${deleted.count} existing overlay records`);

  // Fetch and load each overlay type
  let totalLoaded = 0;

  for (const config of OVERLAY_CONFIGS) {
    try {
      const features = await fetchOverlayData(config);

      if (features.length === 0) {
        console.log(`   No ${config.name} features found`);
        continue;
      }

      // Save raw GeoJSON
      const outputPath = path.join(outputDir, `${config.type}.geojson`);
      fs.writeFileSync(outputPath, JSON.stringify({ type: 'FeatureCollection', features }, null, 2));
      console.log(`   Saved to: ${outputPath}`);

      // Log sample properties
      if (features.length > 0) {
        console.log(`   Sample properties:`, Object.keys(features[0].properties).join(', '));
      }

      // Load into database
      console.log(`   Loading into database...`);
      let loaded = 0;
      let errors = 0;

      for (const feature of features) {
        try {
          const props = feature.properties;

          // Extract name based on config
          let name = props[config.nameField] || props.NAME || props.DISTRICT || 'Unknown';
          if (typeof name !== 'string') name = String(name);

          // Extract description
          let description = config.descField ? props[config.descField] : null;
          if (description && typeof description !== 'string') description = String(description);

          // For landslide, use susceptibility level as name
          if (config.type === 'landslide') {
            const level = props.SUSCEPTIBI || props.SUSCEPTIBILITY || props.LEVEL;
            name = level ? `Susceptibility: ${level}` : 'Landslide Area';
            description = `Landslide susceptibility level: ${level || 'Unknown'}`;
          }

          await prisma.overlayDistrict.create({
            data: {
              jurisdictionId,
              overlayType: config.type,
              name,
              description,
              geometry: feature.geometry,
              properties: props,
              sourceUrl: config.apiUrl,
            },
          });

          loaded++;
        } catch (error: any) {
          errors++;
          if (errors < 3) {
            console.error(`   Error loading feature:`, error.message);
          }
        }
      }

      console.log(`   [OK] Loaded ${loaded} ${config.name} (${errors} errors)`);
      totalLoaded += loaded;

    } catch (error: any) {
      console.error(`   ERROR fetching ${config.name}:`, error.message);
    }
  }

  // Summary
  console.log(`\n========================================`);
  console.log(`Summary`);
  console.log(`========================================`);

  const overlayCounts = await prisma.overlayDistrict.groupBy({
    by: ['overlayType'],
    where: { jurisdictionId },
    _count: { id: true },
  });

  for (const count of overlayCounts) {
    console.log(`   ${count.overlayType}: ${count._count.id} districts`);
  }

  console.log(`\n   Total overlays loaded: ${totalLoaded}`);
  console.log(`\n[OK] Overlay districts are now available for property lookups!`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error('ERROR:', error);
  await prisma.$disconnect();
  process.exit(1);
});
