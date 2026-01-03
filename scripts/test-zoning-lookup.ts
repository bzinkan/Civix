/**
 * Test script for the zoning lookup API
 *
 * Tests the address → county → zoning polygon flow
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test addresses across different counties in the Cincinnati metro area
const TEST_ADDRESSES = [
  // Hamilton County, OH
  { address: '801 Plum St, Cincinnati, OH 45202', expectedCounty: 'Hamilton County', expectedState: 'OH' },
  { address: '100 E 4th St, Cincinnati, OH 45202', expectedCounty: 'Hamilton County', expectedState: 'OH' },

  // Kenton County, KY
  { address: '1 Roebling Way, Covington, KY 41011', expectedCounty: 'Kenton County', expectedState: 'KY' },

  // Campbell County, KY
  { address: '1 Levee Way, Newport, KY 41071', expectedCounty: 'Campbell County', expectedState: 'KY' },

  // Boone County, KY
  { address: '7850 Mall Rd, Florence, KY 41042', expectedCounty: 'Boone County', expectedState: 'KY' },

  // Warren County, OH
  { address: '5065 Deerfield Blvd, Mason, OH 45040', expectedCounty: 'Warren County', expectedState: 'OH' },

  // Butler County, OH
  { address: '1 Riverfront Plaza, Hamilton, OH 45011', expectedCounty: 'Butler County', expectedState: 'OH' },
];

/**
 * Ray-casting algorithm for point-in-polygon
 */
function pointInPolygon(lat: number, lon: number, polygon: number[][]): boolean {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0]; // longitude
    const yi = polygon[i][1]; // latitude
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Find zoning for a coordinate using county-level polygons
 */
async function findZoningByCoordinates(lat: number, lon: number) {
  // Get all counties with zoning data
  const counties = await prisma.county.findMany({
    where: {
      zoningPolygons: {
        some: {},
      },
    },
    select: {
      id: true,
      name: true,
      state: true,
      _count: {
        select: { zoningPolygons: true },
      },
    },
  });

  console.log(`  Searching ${counties.length} counties...`);

  for (const county of counties) {
    // First, filter polygons by bounding box at the database level
    // This avoids loading all 167k Butler County parcels into memory
    const polygons = await prisma.zoningPolygon.findMany({
      where: {
        countyId: county.id,
        // Only get polygons where the point is within the bbox
        // Using raw JSON path queries for bbox [minX, minY, maxX, maxY]
        AND: [
          { bbox: { path: ['0'], lte: lon } },  // minX <= lon
          { bbox: { path: ['2'], gte: lon } },  // maxX >= lon
          { bbox: { path: ['1'], lte: lat } },  // minY <= lat
          { bbox: { path: ['3'], gte: lat } },  // maxY >= lat
        ],
      },
      select: {
        id: true,
        zoneCode: true,
        zoneDescription: true,
        geometry: true,
        bbox: true,
      },
      take: 100, // Limit results since we're doing point-in-polygon anyway
    });

    // Check each polygon
    for (const polygon of polygons) {
      if (!polygon.geometry) continue;

      const geometry = polygon.geometry as any;
      if (!geometry.type) continue;

      let rings: number[][][] = [];

      if (geometry.type === 'Polygon') {
        rings = [geometry.coordinates[0]];
      } else if (geometry.type === 'MultiPolygon') {
        rings = geometry.coordinates.map((poly: number[][][]) => poly[0]);
      } else {
        continue;
      }

      for (const ring of rings) {
        if (pointInPolygon(lat, lon, ring)) {
          return {
            zoneCode: polygon.zoneCode,
            zoneDescription: polygon.zoneDescription,
            county: {
              id: county.id,
              name: county.name,
              state: county.state,
            },
          };
        }
      }
    }
  }

  return null;
}

/**
 * Geocode an address using Nominatim
 */
async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1&countrycodes=us`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Civix-Test/1.0',
      },
    });

    if (!response.ok) {
      console.error('Geocoding failed:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return null;
    }

    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

async function runTests() {
  console.log('='.repeat(70));
  console.log('ZONING LOOKUP API TEST');
  console.log('='.repeat(70));
  console.log('');

  // First, show county data summary
  const counties = await prisma.county.findMany({
    select: {
      name: true,
      state: true,
      _count: {
        select: { zoningPolygons: true, jurisdictions: true },
      },
    },
    orderBy: [{ state: 'asc' }, { name: 'asc' }],
  });

  console.log('County Data Summary:');
  console.log('-'.repeat(50));
  for (const county of counties) {
    console.log(`  ${county.name}, ${county.state}: ${county._count.zoningPolygons} polygons, ${county._count.jurisdictions} jurisdictions`);
  }
  console.log('');

  // Run tests
  let passed = 0;
  let failed = 0;

  for (const test of TEST_ADDRESSES) {
    console.log('-'.repeat(70));
    console.log(`Testing: ${test.address}`);
    console.log(`Expected: ${test.expectedCounty}, ${test.expectedState}`);

    // Geocode the address
    const coords = await geocodeAddress(test.address);

    if (!coords) {
      console.log('  FAILED: Could not geocode address');
      failed++;
      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 1100));
      continue;
    }

    console.log(`  Coordinates: ${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`);

    // Look up zoning
    const result = await findZoningByCoordinates(coords.lat, coords.lon);

    if (!result) {
      console.log('  FAILED: No zoning polygon found');
      failed++;
    } else if (result.county.name === test.expectedCounty && result.county.state === test.expectedState) {
      console.log(`  PASSED: Found ${result.zoneCode} in ${result.county.name}, ${result.county.state}`);
      if (result.zoneDescription) {
        console.log(`          ${result.zoneDescription}`);
      }
      passed++;
    } else {
      console.log(`  FAILED: Found ${result.county.name}, ${result.county.state} but expected ${test.expectedCounty}, ${test.expectedState}`);
      failed++;
    }

    // Rate limit for Nominatim (1 req/sec)
    await new Promise(resolve => setTimeout(resolve, 1100));
  }

  console.log('');
  console.log('='.repeat(70));
  console.log(`Results: ${passed} passed, ${failed} failed out of ${TEST_ADDRESSES.length} tests`);
  console.log('='.repeat(70));
}

runTests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
