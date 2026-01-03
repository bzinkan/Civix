import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function checkCountyStatus() {
  console.log('');
  console.log('=== County Zoning Data Status ===');
  console.log('');

  // Check County table
  const counties = await prisma.county.findMany({
    orderBy: { name: 'asc' }
  });

  if (counties.length === 0) {
    console.log('No counties found in County table.');
    console.log('');
  } else {
    console.log(`Found ${counties.length} counties:`);
    console.log('');
  }

  // Check ZoningPolygon counts by county
  const polygonCounts = await prisma.$queryRaw<Array<{ name: string; state: string; count: bigint }>>`
    SELECT c.name, c.state, COUNT(zp.id) as count
    FROM "County" c
    LEFT JOIN "ZoningPolygon" zp ON zp."countyId" = c.id
    GROUP BY c.id, c.name, c.state
    ORDER BY count DESC
  `;

  console.log('County'.padEnd(25) + 'State'.padEnd(8) + 'Polygons'.padStart(12) + '  Status');
  console.log('-'.repeat(60));

  let totalPolygons = 0n;
  for (const row of polygonCounts) {
    const status = row.count > 0n ? '✓ Ready' : '✗ No data';
    console.log(
      row.name.padEnd(25) +
      row.state.padEnd(8) +
      row.count.toString().padStart(12) +
      '  ' + status
    );
    totalPolygons += row.count;
  }

  console.log('-'.repeat(60));
  console.log('Total'.padEnd(33) + totalPolygons.toString().padStart(12));
  console.log('');

  // Check ZoningParcel counts (jurisdiction-level, like Cincinnati)
  console.log('=== Jurisdiction-Level Zoning Data (ZoningParcel) ===');
  console.log('');

  const parcelCounts = await prisma.$queryRaw<Array<{ name: string; state: string; count: bigint }>>`
    SELECT j.name, j.state, COUNT(zp.id) as count
    FROM "Jurisdiction" j
    LEFT JOIN "ZoningParcel" zp ON zp."jurisdictionId" = j.id
    GROUP BY j.id, j.name, j.state
    HAVING COUNT(zp.id) > 0
    ORDER BY count DESC
  `;

  if (parcelCounts.length === 0) {
    console.log('No jurisdiction-level parcel data found.');
  } else {
    console.log('Jurisdiction'.padEnd(25) + 'State'.padEnd(8) + 'Parcels'.padStart(12));
    console.log('-'.repeat(45));

    let totalParcels = 0n;
    for (const row of parcelCounts) {
      console.log(
        row.name.padEnd(25) +
        row.state.padEnd(8) +
        row.count.toString().padStart(12)
      );
      totalParcels += row.count;
    }
    console.log('-'.repeat(45));
    console.log('Total'.padEnd(33) + totalParcels.toString().padStart(12));
  }

  // Test point-in-polygon lookup capability
  console.log('');
  console.log('=== Point-in-Polygon Test ===');
  console.log('');

  const testPoints = [
    { name: 'Cincinnati Downtown', lat: 39.1015, lon: -84.5125, expected: 'Hamilton' },
    { name: 'Covington, KY', lat: 39.0837, lon: -84.5086, expected: 'Kenton/Campbell' },
    { name: 'Mason, OH', lat: 39.3600, lon: -84.3100, expected: 'Warren' },
    { name: 'Hamilton, OH', lat: 39.3995, lon: -84.5613, expected: 'Butler' },
  ];

  // Get all polygons for testing
  const allPolygons = await prisma.zoningPolygon.findMany({
    select: {
      zoneCode: true,
      geometry: true,
      county: { select: { name: true } }
    }
  });

  for (const test of testPoints) {
    let found = false;
    let foundZone = '';
    let foundCounty = '';

    for (const polygon of allPolygons) {
      if (polygon.geometry && pointInPolygon(test.lat, test.lon, polygon.geometry as any)) {
        found = true;
        foundZone = polygon.zoneCode;
        foundCounty = polygon.county.name;
        break;
      }
    }

    const status = found ? `✓ ${foundZone} (${foundCounty})` : '✗ Not found';
    console.log(`${test.name.padEnd(25)} ${status}`);
  }

  await prisma.$disconnect();
}

function pointInPolygon(lat: number, lon: number, geometry: any): boolean {
  if (!geometry || !geometry.coordinates) return false;

  const polygons = geometry.type === 'MultiPolygon'
    ? geometry.coordinates
    : [geometry.coordinates];

  for (const polygon of polygons) {
    const ring = polygon[0];
    if (!ring) continue;

    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];

      const intersect = ((yi > lat) !== (yj > lat))
        && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);

      if (intersect) inside = !inside;
    }

    if (inside) return true;
  }

  return false;
}

checkCountyStatus();
