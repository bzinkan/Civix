import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

/**
 * Match parcels to zoning polygons using spatial intersection
 *
 * This script:
 * 1. Gets all parcels with lat/lon coordinates
 * 2. For each parcel, finds the zoning polygon that contains its centroid
 * 3. Updates the parcel's zoneCode and zoneDescription
 */

function pointInPolygon(point: { lat: number; lon: number }, polygon: any): boolean {
  // Simple point-in-polygon algorithm (ray casting)
  if (!polygon || !polygon.coordinates) return false;

  const coords = polygon.type === 'Polygon'
    ? polygon.coordinates[0]
    : polygon.type === 'MultiPolygon'
      ? polygon.coordinates[0][0]
      : null;

  if (!coords) return false;

  let inside = false;
  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const xi = coords[i][0], yi = coords[i][1];
    const xj = coords[j][0], yj = coords[j][1];

    const intersect = ((yi > point.lon) !== (yj > point.lon))
      && (point.lat < (xj - xi) * (point.lon - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}

async function matchParcelsToZones(jurisdictionId: string) {
  console.log(`🔗 Matching parcels to zoning polygons...`);
  console.log(`   Jurisdiction: ${jurisdictionId}\n`);

  try {
    // Get jurisdiction
    const jurisdiction = await prisma.jurisdiction.findUnique({
      where: { id: jurisdictionId },
    });

    if (!jurisdiction) {
      console.error(`❌ Jurisdiction not found: ${jurisdictionId}`);
      process.exit(1);
    }

    console.log(`✓ Jurisdiction found: ${jurisdiction.name}, ${jurisdiction.state}\n`);

    // Get all zoning polygons (from earlier zoning fetch)
    console.log(`📊 Loading zoning polygons...`);
    const zoningPolygons = await prisma.$queryRaw<Array<{ zoneCode: string; zoneDescription: string | null; geometry: any }>>`
      SELECT DISTINCT "zoneCode", "zoneDescription", "geometry"
      FROM "ZoningParcel"
      WHERE "jurisdictionId" = ${jurisdictionId}
        AND "geometry" IS NOT NULL
        AND "zoneCode" != 'UNKNOWN'
    `;

    console.log(`   ✓ Loaded ${zoningPolygons.length} zoning polygons\n`);

    if (zoningPolygons.length === 0) {
      console.error(`❌ No zoning polygons found.`);
      console.error(`   Run: npx tsx scripts/fetch-cagis-zoning.ts ${jurisdictionId}`);
      process.exit(1);
    }

    // Get all parcels with coordinates but unknown zones
    console.log(`📊 Loading parcels with addresses...`);
    const parcels = await prisma.zoningParcel.findMany({
      where: {
        jurisdictionId,
        zoneCode: 'UNKNOWN',
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        address: true,
        parcelId: true,
        latitude: true,
        longitude: true,
      }
    });

    console.log(`   ✓ Found ${parcels.length} parcels to match\n`);

    if (parcels.length === 0) {
      console.log(`   No parcels to match. All parcels already have zones.`);
      return;
    }

    console.log(`🔍 Matching parcels to zones (this may take a while)...\n`);

    let matched = 0;
    let unmatched = 0;

    for (const parcel of parcels) {
      if (!parcel.latitude || !parcel.longitude) {
        unmatched++;
        continue;
      }

      const point = { lat: parcel.latitude, lon: parcel.longitude };

      // Find matching zone
      let foundZone: { zoneCode: string; zoneDescription: string | null } | null = null;

      for (const zone of zoningPolygons) {
        if (pointInPolygon(point, zone.geometry)) {
          foundZone = zone;
          break;
        }
      }

      if (foundZone) {
        // Update parcel with zone info
        await prisma.zoningParcel.update({
          where: { id: parcel.id },
          data: {
            zoneCode: foundZone.zoneCode,
            zoneDescription: foundZone.zoneDescription,
          }
        });

        matched++;

        if (matched % 100 === 0) {
          process.stdout.write(`\r   Progress: ${matched} matched, ${unmatched} unmatched`);
        }
      } else {
        unmatched++;
      }
    }

    console.log(`\n\n✅ Zone matching complete!\n`);
    console.log(`📊 Summary:`);
    console.log(`   Total parcels: ${parcels.length}`);
    console.log(`   Successfully matched: ${matched}`);
    console.log(`   Unmatched: ${unmatched}`);

    // Show sample matched parcels
    const sampleMatched = await prisma.zoningParcel.findMany({
      where: {
        jurisdictionId,
        zoneCode: { not: 'UNKNOWN' },
        address: { not: 'Unknown' }
      },
      take: 5,
    });

    console.log('\n📋 Sample matched parcels:');
    for (const parcel of sampleMatched) {
      console.log(`   • ${parcel.address}`);
      console.log(`     Zone: ${parcel.zoneCode} (${parcel.zoneDescription || 'N/A'})`);
    }

    // Count total parcels with zones
    const totalMatched = await prisma.zoningParcel.count({
      where: {
        jurisdictionId,
        zoneCode: { not: 'UNKNOWN' }
      }
    });

    console.log(`\n📊 Total parcels with zones: ${totalMatched}`);
    console.log(`\n✓ Address→Zone lookup system is now ready!`);

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
🔗 Parcel-to-Zone Matcher

Usage:
  npx tsx scripts/match-parcels-to-zones.ts <jurisdiction-id>

Example:
  npx tsx scripts/match-parcels-to-zones.ts cmjtegbhx0000mm2kzoehlezj

What it does:
  - Uses spatial joins to match parcel centroids to zoning polygons
  - Updates ZoningParcel records with correct zone codes
  - Creates complete address→zone lookup capability

Prerequisites:
  1. Run: npx tsx scripts/fetch-cagis-zoning.ts <jurisdiction-id>
  2. Run: npx tsx scripts/fetch-cagis-parcels.ts <jurisdiction-id>
  3. Then run this script

This enables users to look up zones by street address!
`);
  process.exit(0);
}

console.log(`
╔════════════════════════════════════════════════════════════════╗
║  Parcel-to-Zone Matcher                                       ║
╚════════════════════════════════════════════════════════════════╝
`);

matchParcelsToZones(jurisdictionId);
