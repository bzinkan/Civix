import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';

// GET - List saved properties
export async function GET(request: Request) {
  try {
    // In production, would get userId from auth
    // For now, return all properties (or filter by session)

    const properties = await prisma.savedProperty.findMany({
      orderBy: { lastAccessed: 'desc' },
      take: 50,
      include: {
        conversations: {
          take: 1,
          orderBy: { updatedAt: 'desc' },
          include: {
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    const formattedProperties = properties.map((prop) => ({
      id: prop.id,
      address: prop.address,
      nickname: prop.nickname,
      zoneCode: prop.zoneCode,
      zoneName: prop.zoneName,
      zoneType: prop.zoneType,
      constraints: prop.overlays ? JSON.parse(JSON.stringify(prop.overlays)) : [],
      lastAccessed: prop.lastAccessed.toISOString(),
      createdAt: prop.createdAt.toISOString(),
      conversationCount: prop.conversations.length,
      lastMessage: prop.conversations[0]?.messages[0]?.content?.slice(0, 50) || null,
    }));

    return NextResponse.json({
      success: true,
      properties: formattedProperties,
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch properties' }, { status: 500 });
  }
}

// POST - Create new saved property
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, nickname } = body;

    if (!address) {
      return NextResponse.json({ success: false, error: 'Address is required' }, { status: 400 });
    }

    // Lookup property data
    const lookupUrl = new URL('/api/property/lookup', request.url);
    lookupUrl.searchParams.set('address', address);

    let propertyData: any = {};
    try {
      const lookupRes = await fetch(lookupUrl.toString());
      const lookupResult = await lookupRes.json();
      if (lookupResult.success) {
        propertyData = lookupResult.property;
      }
    } catch (e) {
      console.error('Property lookup failed:', e);
    }

    // Create saved property
    const savedProperty = await prisma.savedProperty.create({
      data: {
        address: propertyData.address || address,
        cityId: propertyData.cityId || 'cincinnati-oh',
        parcelId: propertyData.parcelId,
        zoneCode: propertyData.zone,
        zoneName: propertyData.zoneName,
        zoneType: propertyData.zoneType,
        overlays: propertyData.overlays || [],
        propertyData: propertyData,
        nickname,
      },
    });

    return NextResponse.json({
      success: true,
      property: {
        id: savedProperty.id,
        address: savedProperty.address,
        nickname: savedProperty.nickname,
        zoneCode: savedProperty.zoneCode,
        zoneName: savedProperty.zoneName,
        zoneType: savedProperty.zoneType,
      },
    });
  } catch (error) {
    console.error('Error creating property:', error);
    return NextResponse.json({ success: false, error: 'Failed to create property' }, { status: 500 });
  }
}
