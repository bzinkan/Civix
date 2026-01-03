import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';

// GET - Fetch a single property with its conversations
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const property = await prisma.savedProperty.findUnique({
      where: { id },
      include: {
        conversations: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    // Update last accessed time
    await prisma.savedProperty.update({
      where: { id },
      data: { lastAccessed: new Date() },
    });

    return NextResponse.json({
      success: true,
      property: {
        id: property.id,
        address: property.address,
        nickname: property.nickname,
        zoneCode: property.zoneCode,
        zoneName: property.zoneName,
        zoneType: property.zoneType,
        propertyData: property.propertyData,
        conversations: property.conversations,
      },
    });
  } catch (error) {
    console.error('Error fetching property:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch property' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a saved property
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete the property (cascades to conversations if configured)
    await prisma.savedProperty.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting property:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete property' },
      { status: 500 }
    );
  }
}
