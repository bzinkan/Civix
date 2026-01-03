import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define metro areas
const METRO_AREAS = {
  'cincinnati-metro': {
    label: 'Cincinnati Metro (7 Counties)',
    counties: [
      { county: 'Hamilton', state: 'OH', fips: '39061' },
      { county: 'Butler', state: 'OH', fips: '39017' },
      { county: 'Warren', state: 'OH', fips: '39165' },
      { county: 'Clermont', state: 'OH', fips: '39025' },
      { county: 'Boone', state: 'KY', fips: '21015' },
      { county: 'Kenton', state: 'KY', fips: '21117' },
      { county: 'Campbell', state: 'KY', fips: '21037' },
    ],
  },
};

// GET /api/locations - Get user's saved locations
export async function GET(request: NextRequest) {
  try {
    // For now, use a demo user ID or get from session
    // In production, this would come from auth
    const userId = request.headers.get('x-user-id') || 'demo-user';

    // Get or create demo user
    let user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        savedLocations: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          email: `${userId}@demo.civix.app`,
        },
        include: {
          savedLocations: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      locations: user.savedLocations,
      activeLocationId: user.activeLocationId,
      metroOptions: Object.entries(METRO_AREAS).map(([key, value]) => ({
        id: key,
        label: value.label,
        countyCount: value.counties.length,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch locations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

// POST /api/locations - Add a new location
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const body = await request.json();
    const { scopeType, state, city, county, metroId, label } = body;

    // Validate required fields
    if (!scopeType || !state) {
      return NextResponse.json(
        { success: false, error: 'scopeType and state are required' },
        { status: 400 }
      );
    }

    // Validate scope type
    if (!['city', 'county', 'metro', 'state'].includes(scopeType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid scopeType' },
        { status: 400 }
      );
    }

    // City scope requires city name
    if (scopeType === 'city' && !city) {
      return NextResponse.json(
        { success: false, error: 'City name is required for city scope' },
        { status: 400 }
      );
    }

    // County scope requires county name
    if (scopeType === 'county' && !county) {
      return NextResponse.json(
        { success: false, error: 'County name is required for county scope' },
        { status: 400 }
      );
    }

    // Metro scope requires valid metro ID
    if (scopeType === 'metro' && (!metroId || !METRO_AREAS[metroId as keyof typeof METRO_AREAS])) {
      return NextResponse.json(
        { success: false, error: 'Valid metro area ID is required for metro scope' },
        { status: 400 }
      );
    }

    // Get or create user
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          email: `${userId}@demo.civix.app`,
        },
      });
    }

    // Check location limit (max 5)
    const existingCount = await prisma.savedLocation.count({
      where: { userId },
    });
    if (existingCount >= 5) {
      return NextResponse.json(
        { success: false, error: 'Maximum 5 locations allowed. Please remove one first.' },
        { status: 400 }
      );
    }

    // Build location data
    let locationLabel = label;
    let metroCounties = null;
    let fips = null;

    if (scopeType === 'city') {
      locationLabel = locationLabel || `${city}, ${state}`;
    } else if (scopeType === 'county') {
      locationLabel = locationLabel || `${county} County, ${state}`;
    } else if (scopeType === 'metro') {
      const metro = METRO_AREAS[metroId as keyof typeof METRO_AREAS];
      locationLabel = locationLabel || metro.label;
      metroCounties = metro.counties;
    } else if (scopeType === 'state') {
      locationLabel = locationLabel || state;
    }

    // Create the location
    const location = await prisma.savedLocation.create({
      data: {
        userId,
        label: locationLabel,
        scopeType,
        state,
        city: scopeType === 'city' ? city : null,
        county: scopeType === 'county' ? county : null,
        fips,
        metroCounties: metroCounties || undefined,
        sortOrder: existingCount,
      },
    });

    // If this is the first location, set it as active
    if (existingCount === 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { activeLocationId: location.id },
      });
    }

    return NextResponse.json({
      success: true,
      location,
      isNowActive: existingCount === 0,
    });
  } catch (error) {
    console.error('Failed to create location:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create location' },
      { status: 500 }
    );
  }
}

// DELETE /api/locations - Remove a location
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('id');

    if (!locationId) {
      return NextResponse.json(
        { success: false, error: 'Location ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const location = await prisma.savedLocation.findFirst({
      where: { id: locationId, userId },
    });

    if (!location) {
      return NextResponse.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      );
    }

    // Delete the location
    await prisma.savedLocation.delete({
      where: { id: locationId },
    });

    // If this was the active location, clear it or set to first remaining
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { savedLocations: { orderBy: { sortOrder: 'asc' } } },
    });

    if (user?.activeLocationId === locationId) {
      const newActiveId = user.savedLocations[0]?.id || null;
      await prisma.user.update({
        where: { id: userId },
        data: { activeLocationId: newActiveId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete location:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete location' },
      { status: 500 }
    );
  }
}

// PATCH /api/locations - Update active location or edit a location
export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const body = await request.json();
    const { locationId, setActive, label } = body;

    if (!locationId) {
      return NextResponse.json(
        { success: false, error: 'Location ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const location = await prisma.savedLocation.findFirst({
      where: { id: locationId, userId },
    });

    if (!location) {
      return NextResponse.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      );
    }

    // Set as active location
    if (setActive) {
      await prisma.user.update({
        where: { id: userId },
        data: { activeLocationId: locationId },
      });

      return NextResponse.json({
        success: true,
        activeLocationId: locationId,
        message: `Switched to ${location.label}`,
      });
    }

    // Update label
    if (label) {
      const updated = await prisma.savedLocation.update({
        where: { id: locationId },
        data: { label },
      });

      return NextResponse.json({ success: true, location: updated });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update location:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update location' },
      { status: 500 }
    );
  }
}
