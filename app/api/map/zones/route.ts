import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/map/zones
 *
 * Fetches zoning polygons near a given lat/lon for map display.
 * Uses bounding box query for performance with large datasets.
 *
 * Query params:
 *   - lat: Latitude (required)
 *   - lon: Longitude (required)
 *   - radius: Bounding box radius in degrees (default: 0.01 ~1km)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '');
    const lon = parseFloat(searchParams.get('lon') || '');
    const radius = parseFloat(searchParams.get('radius') || '0.01');

    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json(
        { error: 'lat and lon parameters are required' },
        { status: 400 }
      );
    }

    // Clamp radius to reasonable bounds (0.001 to 0.05 degrees)
    const boundedRadius = Math.min(Math.max(radius, 0.001), 0.05);

    // Query county-level ZoningPolygon table with bounding box filter
    // This efficiently queries 175K+ polygons by using lat/lon index
    const polygons = await prisma.$queryRaw<Array<{
      id: string;
      zoneCode: string;
      zoneDescription: string | null;
      geometry: any;
    }>>`
      SELECT id, "zoneCode", "zoneDescription", geometry
      FROM "ZoningPolygon"
      WHERE latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND latitude BETWEEN ${lat - boundedRadius} AND ${lat + boundedRadius}
        AND longitude BETWEEN ${lon - boundedRadius} AND ${lon + boundedRadius}
      LIMIT 200
    `;

    // Also check jurisdiction-level ZoningParcel table
    const parcels = await prisma.$queryRaw<Array<{
      id: string;
      zoneCode: string;
      zoneDescription: string | null;
      geometry: any;
    }>>`
      SELECT id, "zoneCode", "zoneDescription", geometry
      FROM "ZoningParcel"
      WHERE latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND latitude BETWEEN ${lat - boundedRadius} AND ${lat + boundedRadius}
        AND longitude BETWEEN ${lon - boundedRadius} AND ${lon + boundedRadius}
        AND geometry IS NOT NULL
      LIMIT 100
    `;

    // Combine and dedupe by ID (prefer jurisdiction-level data)
    const seenIds = new Set<string>();
    const allPolygons: Array<{
      id: string;
      zoneCode: string;
      zoneDescription: string | null;
      geometry: any;
    }> = [];

    // Add jurisdiction parcels first (higher priority)
    for (const p of parcels) {
      if (p.geometry && !seenIds.has(p.id)) {
        seenIds.add(p.id);
        allPolygons.push(p);
      }
    }

    // Add county polygons
    for (const p of polygons) {
      if (p.geometry && !seenIds.has(p.id)) {
        seenIds.add(p.id);
        allPolygons.push(p);
      }
    }

    return NextResponse.json({
      success: true,
      polygons: allPolygons,
      count: allPolygons.length,
      bounds: {
        minLat: lat - boundedRadius,
        maxLat: lat + boundedRadius,
        minLon: lon - boundedRadius,
        maxLon: lon + boundedRadius,
      },
    });
  } catch (error: any) {
    console.error('Map zones API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch zoning data', details: error.message },
      { status: 500 }
    );
  }
}
