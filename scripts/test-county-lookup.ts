import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

// Point-in-polygon using ray casting algorithm
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

async function testCountyLookup() {
  console.log('');
  console.log('=== County-Level Zoning Lookup Test ===');
  console.log('');

  const testLocations = [
    { name: 'Cincinnati Downtown', lat: 39.1015, lon: -84.5125, expectedCounty: 'Hamilton' },
    { name: 'Fairfield, OH (Butler Co)', lat: 39.3450, lon: -84.5400, expectedCounty: 'Butler' },
    { name: 'Mason, OH (Warren Co)', lat: 39.3600, lon: -84.3100, expectedCounty: 'Warren' }, // Note: May be outside Warren data
    { name: 'Milford, OH (Clermont Co)', lat: 39.1755, lon: -84.2945, expectedCounty: 'Clermont' },
    { name: 'Covington, KY (Kenton Co)', lat: 39.0300, lon: -84.5100, expectedCounty: 'Kenton' },
    { name: 'Newport, KY (Campbell Co)', lat: 39.0912, lon: -84.4958, expectedCounty: 'Campbell' },
    { name: 'Florence, KY (Boone Co)', lat: 38.9989, lon: -84.6266, expectedCounty: 'Boone' },
  ];

  // Get all counties
  const counties = await prisma.county.findMany();
  console.log(`Found ${counties.length} counties in database\n`);

  console.log('Location'.padEnd(35) + 'Expected'.padEnd(12) + 'Zone Found');
  console.log('-'.repeat(70));

  for (const test of testLocations) {
    // Find the county
    const county = counties.find(c =>
      c.name.toLowerCase().includes(test.expectedCounty.toLowerCase())
    );

    if (!county) {
      console.log(`${test.name.padEnd(35)} ${test.expectedCounty.padEnd(12)} County not found!`);
      continue;
    }

    // Query with bounding box filter
    const tolerance = 0.01;
    const polygons = await prisma.$queryRaw<Array<{
      id: string;
      zoneCode: string;
      geometry: any;
    }>>`
      SELECT id, "zoneCode", geometry
      FROM "ZoningPolygon"
      WHERE "countyId" = ${county.id}
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND latitude BETWEEN ${test.lat - tolerance} AND ${test.lat + tolerance}
        AND longitude BETWEEN ${test.lon - tolerance} AND ${test.lon + tolerance}
      LIMIT 100
    `;

    let foundZone = 'Not found';
    for (const polygon of polygons) {
      if (polygon.geometry && pointInPolygon(test.lat, test.lon, polygon.geometry)) {
        foundZone = polygon.zoneCode;
        break;
      }
    }

    const status = foundZone !== 'Not found' ? '✓' : '✗';
    console.log(`${status} ${test.name.padEnd(33)} ${test.expectedCounty.padEnd(12)} ${foundZone}`);
  }

  console.log('');
  await prisma.$disconnect();
}

testCountyLookup().catch(console.error);
