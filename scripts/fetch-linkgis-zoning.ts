import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

/**
 * Fetch zoning data from LINK-GIS API for Covington, KY
 *
 * LINK-GIS ArcGIS REST Service:
 * https://maps.linkgis.org/server/rest/services/Covington_Character_Districts/MapServer
 *
 * Layer 3: Character Districts (polygon zoning boundaries)
 * Layer 4: Form-Based Character Districts
 *
 * Usage:
 *   npx tsx scripts/fetch-linkgis-zoning.ts
 */

interface LINKGISZoningFeature {
  type: string;
  properties: {
    OBJECTID: number;
    CITY_ZONE?: string;
    PRIMARY_ZO?: string;
    CITY_OVERLAY?: string;
    FBC?: string;
    Shape__Area?: number;
    Shape__Length?: number;
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: any;
  };
}

interface GeoJSONResponse {
  type: string;
  features: LINKGISZoningFeature[];
}

const LINK_GIS_BASE = 'https://maps.linkgis.org/server/rest/services/Covington_Character_Districts/MapServer';

async function fetchLINKGISZoning(jurisdictionId: string = 'covington-ky') {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  LINK-GIS Zoning Data Fetcher                                  ║
║                                                                ║
║  Fetching Covington, KY Character Districts from LINK-GIS     ║
╚════════════════════════════════════════════════════════════════╝
`);

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

    // Fetch from Layer 3: Character Districts
    const layer3Url = `${LINK_GIS_BASE}/3/query`;

    console.log(`Fetching Character Districts from LINK-GIS...`);
    console.log(`   URL: ${layer3Url}`);
    console.log(`   Fetching ALL records with pagination...\n`);

    let allFeatures: LINKGISZoningFeature[] = [];
    let offset = 0;
    const pageSize = 1000;

    while (true) {
      const params = new URLSearchParams({
        where: '1=1',
        outFields: '*',
        f: 'geojson',
        returnGeometry: 'true',
        resultOffset: offset.toString(),
        resultRecordCount: pageSize.toString(),
      });

      const fullUrl = `${layer3Url}?${params.toString()}`;
      const response = await fetch(fullUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GeoJSONResponse = await response.json();

      if (!data.features || data.features.length === 0) {
        break;
      }

      allFeatures = allFeatures.concat(data.features);
      console.log(`   Fetched ${data.features.length} features (total: ${allFeatures.length})`);

      if (data.features.length < pageSize) {
        break;
      }

      offset += pageSize;
    }

    console.log(`\n✓ Total received: ${allFeatures.length} features from LINK-GIS\n`);

    if (allFeatures.length === 0) {
      console.error('❌ No features returned from API');
      process.exit(1);
    }

    // Save raw GeoJSON to file
    const outputDir = path.join(process.cwd(), 'data', 'covington-ky');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const geoJsonData: GeoJSONResponse = {
      type: 'FeatureCollection',
      features: allFeatures,
    };

    const outputPath = path.join(outputDir, 'linkgis-zoning-raw.geojson');
    fs.writeFileSync(outputPath, JSON.stringify(geoJsonData, null, 2));
    console.log(`✓ Saved raw GeoJSON to: ${outputPath}\n`);

    // Inspect field names
    const sampleFeature = allFeatures[0];
    console.log(`Available fields in LINK-GIS data:`);
    Object.keys(sampleFeature.properties).forEach(key => {
      console.log(`   - ${key}: ${sampleFeature.properties[key]}`);
    });
    console.log('');

    // Clear existing zoning data
    console.log(`Clearing existing zoning data for ${jurisdiction.name}...`);
    const deleted = await prisma.zoningParcel.deleteMany({
      where: { jurisdictionId },
    });
    console.log(`   Deleted ${deleted.count} existing records\n`);

    // Process and load into database
    console.log(`Loading zoning data into RDS...`);

    let loaded = 0;
    let skipped = 0;
    let errors = 0;

    for (const feature of allFeatures) {
      try {
        const props = feature.properties;

        // Extract zone code - LINK-GIS uses CITY_ZONE or PRIMARY_ZO
        const zoneCode = props.CITY_ZONE || props.PRIMARY_ZO || props.Zone || '';
        const zoneOverlay = props.CITY_OVERLAY || null;
        const formBased = props.FBC || null;

        // Build description
        let zoneDescription = zoneCode;
        if (zoneOverlay) {
          zoneDescription += ` (${zoneOverlay})`;
        }
        if (formBased === 'Y') {
          zoneDescription += ' [Form-Based]';
        }

        // Skip if no zoning code
        if (!zoneCode) {
          skipped++;
          continue;
        }

        const geometry = feature.geometry;

        // Calculate centroid
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
        }

        // Create zoning parcel record
        await prisma.zoningParcel.create({
          data: {
            jurisdictionId,
            address: `Zone ${zoneCode}`, // Character districts don't have individual addresses
            parcelId: `COV-${props.OBJECTID}`,
            zoneCode,
            zoneDescription,
            latitude,
            longitude,
            geometry: geometry,
            sourceUrl: layer3Url,
          },
        });

        loaded++;

        if (loaded % 50 === 0) {
          process.stdout.write(`\r   Progress: ${loaded} loaded, ${skipped} skipped, ${errors} errors`);
        }
      } catch (error: any) {
        errors++;
        if (errors < 5) {
          console.error(`\n   Warning: Error processing feature:`, error.message);
        }
      }
    }

    console.log(`\n\n✓ Zoning data loading complete!\n`);
    console.log(`Summary:`);
    console.log(`   Total features: ${allFeatures.length}`);
    console.log(`   Successfully loaded: ${loaded}`);
    console.log(`   Skipped (no zone code): ${skipped}`);
    console.log(`   Errors: ${errors}`);

    // Show zone code distribution
    const zoneCodes = await prisma.$queryRaw<Array<{ zoneCode: string; count: bigint }>>`
      SELECT "zoneCode", COUNT(*) as count
      FROM "ZoningParcel"
      WHERE "jurisdictionId" = ${jurisdictionId}
      GROUP BY "zoneCode"
      ORDER BY count DESC
      LIMIT 15
    `;

    console.log('\nZone distribution:');
    for (const zone of zoneCodes) {
      console.log(`   ${zone.zoneCode}: ${zone.count} polygons`);
    }

    // Update jurisdiction data completeness
    await prisma.jurisdiction.update({
      where: { id: jurisdictionId },
      data: {
        dataCompleteness: 95, // Now has zoning polygons
      },
    });

    console.log(`\n✓ Covington zoning data is now available for address lookup!`);
    console.log(`   ${loaded} zoning polygons loaded`);

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nPossible issues:');
    console.error('- LINK-GIS API may be temporarily unavailable');
    console.error('- Network connection issues');
    console.error('- API endpoint may have changed');
    console.error('\nContact LINK-GIS: 859.331.8980 or visit linkgis.org');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run
fetchLINKGISZoning('covington-ky');
