import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

/**
 * Fetch zoning data from CAGIS API and load into RDS
 *
 * CAGIS API Documentation:
 * https://cagisonline.hamilton-co.org/arcgis/rest/services/Countywide_Layers/Zoning/MapServer/4
 *
 * Usage:
 *   npx tsx scripts/fetch-cagis-zoning.ts [jurisdiction-id]
 *
 * Examples:
 *   npx tsx scripts/fetch-cagis-zoning.ts cincinnati-oh
 */

interface CAGISZoningFeature {
  type: string;
  properties: {
    OBJECTID: number;
    ZONING_CODE?: string;
    ZONING_DESC?: string;
    PARCEL_ID?: string;
    ADDRESS?: string;
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: any;
  };
}

interface CAGISResponse {
  type: string;
  features: CAGISZoningFeature[];
}

async function fetchCAGISZoning(jurisdictionId: string = 'cincinnati-oh') {
  console.log(`🌐 Fetching zoning data from CAGIS API...`);
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

    // CAGIS Zoning API endpoint
    const apiUrl = 'https://cagisonline.hamilton-co.org/arcgis/rest/services/Countywide_Layers/Zoning/MapServer/4/query';

    // Query parameters
    const params = new URLSearchParams({
      where: '1=1',  // Get all records
      outFields: '*', // Get all fields
      f: 'geojson',   // GeoJSON format
      returnGeometry: 'true',
    });

    const fullUrl = `${apiUrl}?${params.toString()}`;

    console.log(`📡 Fetching from CAGIS API...`);
    console.log(`   URL: ${apiUrl}`);
    console.log(`   This may take a few minutes for large datasets...\n`);

    // Fetch data
    const response = await fetch(fullUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: CAGISResponse = await response.json();

    console.log(`✓ Received ${data.features?.length || 0} features from API\n`);

    if (!data.features || data.features.length === 0) {
      console.error('❌ No features returned from API');
      console.error('   The API may be down or the query may be invalid');
      process.exit(1);
    }

    // Save raw GeoJSON to file for reference
    const outputDir = path.join(process.cwd(), 'data', 'cincinnati');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'cagis-zoning-raw.geojson');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`✓ Saved raw GeoJSON to: ${outputPath}\n`);

    // Inspect field names from first feature
    const sampleFeature = data.features[0];
    console.log(`📋 Available fields in CAGIS data:`);
    Object.keys(sampleFeature.properties).forEach(key => {
      console.log(`   - ${key}: ${sampleFeature.properties[key]}`);
    });
    console.log('');

    // Process and load into database
    console.log(`💾 Loading zoning data into RDS...`);

    let loaded = 0;
    let skipped = 0;
    let errors = 0;

    for (const feature of data.features) {
      try {
        const props = feature.properties;

        // Extract address - try different field names
        const address = props.ADDRESS || props.SITUS_ADDRESS || props.FULL_ADDRESS || props.address || 'Unknown';

        // Extract zoning code and description
        const zoneCode = props.ZONING_CODE || props.ZONE_CODE || props.ZONING || props.zoning_code || '';
        const zoneDescription = props.ZONING_DESC || props.ZONE_DESC || props.ZONING_DESCRIPTION || props.zoning_desc || null;

        // Skip if no zoning code
        if (!zoneCode) {
          skipped++;
          continue;
        }

        // Extract parcel ID
        const parcelId = props.PARCEL_ID || props.PARCELID || props.PIN || props.parcel_id || null;

        // Extract geometry
        const geometry = feature.geometry;

        // Calculate centroid for latitude/longitude (simple average for polygons)
        let latitude: number | null = null;
        let longitude: number | null = null;

        if (geometry && geometry.type === 'Polygon' && geometry.coordinates?.[0]) {
          const coords = geometry.coordinates[0];
          const latSum = coords.reduce((sum: number, coord: number[]) => sum + coord[1], 0);
          const lonSum = coords.reduce((sum: number, coord: number[]) => sum + coord[0], 0);
          latitude = latSum / coords.length;
          longitude = lonSum / coords.length;
        } else if (geometry && geometry.type === 'Point' && geometry.coordinates) {
          longitude = geometry.coordinates[0];
          latitude = geometry.coordinates[1];
        }

        // Create zoning parcel record
        await prisma.zoningParcel.create({
          data: {
            jurisdictionId,
            address,
            parcelId,
            zoneCode,
            zoneDescription,
            latitude,
            longitude,
            geometry: geometry,
            sourceUrl: apiUrl,
          },
        });

        loaded++;

        // Progress indicator
        if (loaded % 100 === 0) {
          process.stdout.write(`\r   Progress: ${loaded} loaded, ${skipped} skipped, ${errors} errors`);
        }
      } catch (error: any) {
        errors++;
        if (errors < 5) {
          console.error(`\n   ⚠ Error processing feature:`, error.message);
        }
      }
    }

    console.log(`\n\n✅ Zoning data loading complete!\n`);
    console.log(`📊 Summary:`);
    console.log(`   Total features: ${data.features.length}`);
    console.log(`   Successfully loaded: ${loaded}`);
    console.log(`   Skipped (no zone code): ${skipped}`);
    console.log(`   Errors: ${errors}`);

    // Show sample data
    const sampleParcels = await prisma.zoningParcel.findMany({
      where: { jurisdictionId },
      take: 5,
    });

    console.log('\n📋 Sample parcels loaded:');
    for (const parcel of sampleParcels) {
      console.log(`   • ${parcel.address} → ${parcel.zoneCode} (${parcel.zoneDescription || 'N/A'})`);
    }

    // Show zone code distribution
    const zoneCodes = await prisma.$queryRaw<Array<{ zoneCode: string; count: bigint }>>`
      SELECT "zoneCode", COUNT(*) as count
      FROM "ZoningParcel"
      WHERE "jurisdictionId" = ${jurisdictionId}
      GROUP BY "zoneCode"
      ORDER BY count DESC
      LIMIT 10
    `;

    console.log('\n📈 Top zone codes:');
    for (const zone of zoneCodes) {
      console.log(`   ${zone.zoneCode}: ${zone.count} parcels`);
    }

    console.log('\n✓ Cincinnati zoning data is now searchable in the app!');

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nPossible issues:');
    console.error('- CAGIS API may be temporarily unavailable');
    console.error('- Network connection issues');
    console.error('- API endpoint may have changed');
    console.error('\nTry again later or contact CAGIS support: cagis@hamilton-co.org');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// CLI interface
const jurisdictionId = process.argv[2] || 'cincinnati-oh';

console.log(`
🏛️ CAGIS Zoning Data Fetcher

This script fetches zoning data from the Cincinnati Area Geographic Information System (CAGIS)
and loads it into your RDS database for Cincinnati ordinance lookups.

Data Source: Hamilton County CAGIS
API: https://cagisonline.hamilton-co.org/arcgis/rest/services/Countywide_Layers/Zoning/MapServer/4

Starting fetch...
`);

fetchCAGISZoning(jurisdictionId);
