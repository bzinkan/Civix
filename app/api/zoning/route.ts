import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/zoning?address=123+Main+St&city=Cincinnati&state=OH
 *
 * Look up zoning information for a given address
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    const city = searchParams.get('city') || 'Cincinnati';
    const state = searchParams.get('state') || 'OH';

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    // Find jurisdiction
    const jurisdiction = await prisma.jurisdiction.findFirst({
      where: {
        name: { contains: city, mode: 'insensitive' },
        state: { equals: state, mode: 'insensitive' },
      },
    });

    if (!jurisdiction) {
      return NextResponse.json(
        { error: `Jurisdiction not found: ${city}, ${state}` },
        { status: 404 }
      );
    }

    // Normalize address for fuzzy matching
    const normalizedAddress = address.toLowerCase().trim();

    // Try exact match first
    let parcel = await prisma.zoningParcel.findFirst({
      where: {
        jurisdictionId: jurisdiction.id,
        address: {
          contains: normalizedAddress,
          mode: 'insensitive',
        },
        zoneCode: { not: 'UNKNOWN' },
      },
      orderBy: {
        lastVerified: 'desc',
      },
    });

    // If no exact match, try partial match
    if (!parcel) {
      // Split address into parts for better matching
      const addressParts = normalizedAddress.split(/[\s,]+/);
      const streetNumber = addressParts[0];

      parcel = await prisma.zoningParcel.findFirst({
        where: {
          jurisdictionId: jurisdiction.id,
          address: {
            startsWith: streetNumber,
            mode: 'insensitive',
          },
          zoneCode: { not: 'UNKNOWN' },
        },
        orderBy: {
          lastVerified: 'desc',
        },
      });
    }

    if (!parcel) {
      return NextResponse.json(
        {
          error: 'Address not found in zoning database',
          suggestion: 'Try a different address format or check the address spelling',
          jurisdiction: {
            name: jurisdiction.name,
            state: jurisdiction.state,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      address: parcel.address,
      parcelId: parcel.parcelId,
      zoning: {
        code: parcel.zoneCode,
        description: parcel.zoneDescription,
      },
      coordinates: parcel.latitude && parcel.longitude
        ? {
            latitude: parcel.latitude,
            longitude: parcel.longitude,
          }
        : null,
      jurisdiction: {
        id: jurisdiction.id,
        name: jurisdiction.name,
        state: jurisdiction.state,
      },
      lastVerified: parcel.lastVerified,
    });
  } catch (error: any) {
    console.error('Zoning lookup error:', error);

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
