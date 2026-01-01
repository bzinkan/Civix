import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

/**
 * Fetch parcel data from CAGIS API with addresses
 *
 * This fetches the Auditor Parcel Information which has street addresses.
 * We'll match these with zoning polygons to create address→zone lookups.
 *
 * API: https://cagisonline.hamilton-co.org/arcgis/rest/services/Countywide_Layers/AuditorParcelInformation/MapServer/0
 */

interface CAGISParcelFeature {
  type: string;
  properties: {
    OBJECTID: number;
    PARCELID?: string;
    SITEADDR?: string;
    SITECITY?: string;
    SITEZIP?: string;
    OWNER?: string;
    LANDUSE?: string;
    ACREAGE?: number;
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: any;
  };
}

interface CAGISResponse {
  type: string;
  features: CAGISParcelFeature[];
  exceededTransferLimit?: boolean;
}

function calculateCentroid(geometry: any): { lat: number; lon: number } | null {
  if (!geometry || !geometry.coordinates) return null;

  if (geometry.type === 'Point') {
    return {
      lon: geometry.coordinates[0],
      lat: geometry.coordinates[1]
    };
  }

  if (geometry.type === 'Polygon' && geometry.coordinates[0]) {
    const coords = geometry.coordinates[0];
    const latSum = coords.reduce((sum: number, coord: number[]) => sum + coord[1], 0);
    const lonSum = coords.reduce((sum: number, coord: number[]) => sum + coord[0], 0);
    return {
      lat: latSum / coords.length,
      lon: lonSum / coords.length
    };
  }

  if (geometry.type === 'MultiPolygon' && geometry.coordinates[0]?.[0]) {
    const coords = geometry.coordinates[0][0];
    const latSum = coords.reduce((sum: number, coord: number[]) => sum + coord[1], 0);
    const lonSum = coords.reduce((sum: number, coord: number[]) => sum + coord[0], 0);
    return {
      lat: latSum / coords.length,
      lon: lonSum / coords.length
    };
  }

  return null;
}

async function fetchParcelsPage(offset: number = 0): Promise<CAGISResponse> {
  // Use the Addresses layer which has street addresses
  const apiUrl = 'https://cagisonline.hamilton-co.org/arcgis/rest/services/Countywide_Layers/addressesTables/MapServer/0/query';

  const params = new URLSearchParams({
    where: '1=1',
    outFields: '*',
    f: 'geojson',
    resultRecordCount: '1000',
    resultOffset: offset.toString(),
    returnGeometry: 'true',
  });

  const fullUrl = `${apiUrl}?${params.toString()}`;

  const response = await fetch(fullUrl);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

async function fetchAllParcels(jurisdictionId: string) {
  console.log(`🌐 Fetching parcel data from CAGIS API...`);
  console.log(`   Jurisdiction: ${jurisdictionId}\n`);

  try {
    // Verify jurisdiction exists
    const jurisdiction = await prisma.jurisdiction.findUnique({
      where: { id: jurisdictionId },
    });

    if (!jurisdiction) {
      console.error(`❌ Jurisdiction not found: ${jurisdictionId}`);
      process.exit(1);
    }

    console.log(`✓ Jurisdiction found: ${jurisdiction.name}, ${jurisdiction.state}\n`);

    console.log(`📡 Fetching parcels from CAGIS API (paginated)...`);
    console.log(`   This will take several minutes for ~200,000 parcels...\n`);

    let offset = 0;
    let allFeatures: CAGISParcelFeature[] = [];
    let pageNumber = 1;

    while (true) {
      console.log(`   Fetching page ${pageNumber} (offset: ${offset})...`);

      const data = await fetchParcelsPage(offset);

      if (!data.features || data.features.length === 0) {
        console.log(`   No more features. Fetch complete.\n`);
        break;
      }

      allFeatures = allFeatures.concat(data.features);
      console.log(`   ✓ Received ${data.features.length} features (total: ${allFeatures.length})`);

      // Check if there are more results
      if (data.features.length < 1000) {
        console.log(`   ✓ Last page. Fetch complete.\n`);
        break;
      }

      offset += 1000;
      pageNumber++;

      // Safety limit to prevent infinite loops
      if (pageNumber > 300) {
        console.log(`   ⚠ Reached safety limit of 300 pages. Stopping.\n`);
        break;
      }

      // Small delay to be nice to the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`✓ Total parcels fetched: ${allFeatures.length}\n`);

    // Save raw data
    const outputDir = path.join(process.cwd(), 'data', 'cincinnati');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'cagis-parcels-raw.geojson');
    const geoJSON = {
      type: 'FeatureCollection',
      features: allFeatures
    };
    fs.writeFileSync(outputPath, JSON.stringify(geoJSON, null, 2));
    console.log(`✓ Saved raw GeoJSON to: ${outputPath}\n`);

    // Inspect sample fields
    if (allFeatures.length > 0) {
      const sampleFeature = allFeatures[0];
      console.log(`📋 Available fields in parcel data:`);
      Object.keys(sampleFeature.properties).slice(0, 15).forEach(key => {
        console.log(`   - ${key}: ${sampleFeature.properties[key]}`);
      });
      console.log('');
    }

    // Load into database with address→parcel ID mapping
    console.log(`💾 Loading parcel data into RDS...`);

    let loaded = 0;
    let skipped = 0;
    let errors = 0;

    for (const feature of allFeatures) {
      try {
        const props = feature.properties;

        // Extract address
        const address = props.SITEADDR || props.ADDRESS || props.FULL_ADDRESS || '';
        const city = props.SITECITY || 'Cincinnati';
        const zip = props.SITEZIP || '';

        // Skip if no address
        if (!address) {
          skipped++;
          continue;
        }

        // Full address for better matching
        const fullAddress = `${address}, ${city}, OH ${zip}`.trim();

        // Extract parcel ID
        const parcelId = props.PARCELID || props.PARCEL_ID || props.PIN || '';

        // Calculate centroid
        const centroid = calculateCentroid(feature.geometry);

        // For now, we don't have zone code yet - will join with zoning data later
        // Use a placeholder zone code
        const zoneCode = 'UNKNOWN';

        // Create/update zoning parcel record
        await prisma.zoningParcel.upsert({
          where: {
            jurisdictionId_parcelId: {
              jurisdictionId,
              parcelId: parcelId || `ADDR-${loaded}`
            }
          },
          update: {
            address: fullAddress,
            latitude: centroid?.lat,
            longitude: centroid?.lon,
            geometry: feature.geometry,
          },
          create: {
            jurisdictionId,
            address: fullAddress,
            parcelId: parcelId || `ADDR-${loaded}`,
            zoneCode,
            latitude: centroid?.lat,
            longitude: centroid?.lon,
            geometry: feature.geometry,
            sourceUrl: 'https://cagisonline.hamilton-co.org/arcgis/rest/services/Countywide_Layers/AuditorParcelInformation/MapServer/0',
          }
        });

        loaded++;

        if (loaded % 1000 === 0) {
          process.stdout.write(`\r   Progress: ${loaded} loaded, ${skipped} skipped, ${errors} errors`);
        }
      } catch (error: any) {
        errors++;
        if (errors < 5) {
          console.error(`\n   ⚠ Error processing parcel:`, error.message);
        }
      }
    }

    console.log(`\n\n✅ Parcel data loading complete!\n`);
    console.log(`📊 Summary:`);
    console.log(`   Total features: ${allFeatures.length}`);
    console.log(`   Successfully loaded: ${loaded}`);
    console.log(`   Skipped (no address): ${skipped}`);
    console.log(`   Errors: ${errors}`);

    // Show sample data
    const sampleParcels = await prisma.zoningParcel.findMany({
      where: { jurisdictionId },
      take: 5,
    });

    console.log('\n📋 Sample parcels with addresses:');
    for (const parcel of sampleParcels) {
      console.log(`   • ${parcel.address}`);
      console.log(`     Parcel: ${parcel.parcelId} | Zone: ${parcel.zoneCode}`);
    }

    // Count parcels with addresses
    const addressCount = await prisma.zoningParcel.count({
      where: {
        jurisdictionId,
        address: { not: 'Unknown' }
      }
    });

    console.log(`\n📊 Parcels with addresses: ${addressCount}`);
    console.log(`\n✓ Address→Parcel mapping complete!`);
    console.log(`   Next step: Run zone matching to link parcels to zoning polygons`);

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// CLI interface
const jurisdictionId = process.argv[2];

if (!jurisdictionId) {
  console.log(`
📦 CAGIS Parcel Data Fetcher (with Addresses)

Usage:
  npx tsx scripts/fetch-cagis-parcels.ts <jurisdiction-id>

Example:
  npx tsx scripts/fetch-cagis-parcels.ts cmjtegbhx0000mm2kzoehlezj

What it does:
  - Fetches ALL parcels from CAGIS Auditor Parcel Information API (~200,000)
  - Extracts street addresses and parcel IDs
  - Loads into ZoningParcel table with address→parcel mapping
  - Prepares for zone code matching

This is step 1 of 2 for complete address→zone lookups.
Step 2: Run zone matching script to link addresses to zones.
`);
  process.exit(0);
}

console.log(`
╔════════════════════════════════════════════════════════════════╗
║  CAGIS Parcel Data Fetcher (with Addresses)                   ║
╚════════════════════════════════════════════════════════════════╝
`);

fetchAllParcels(jurisdictionId);
