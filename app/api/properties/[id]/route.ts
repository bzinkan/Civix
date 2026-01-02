import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';

// GET - Get single property with conversations
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const property = await prisma.savedProperty.findUnique({
      where: { id },
      include: {
        conversations: {
          orderBy: { updatedAt: 'desc' },
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }

    // Update last accessed
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
        overlays: property.overlays,
        conversations: property.conversations.map((conv) => ({
          id: conv.id,
          title: conv.title,
          messages: conv.messages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            citations: msg.citations,
            attachments: msg.attachments,
            createdAt: msg.createdAt.toISOString(),
          })),
        })),
        createdAt: property.createdAt.toISOString(),
        lastAccessed: property.lastAccessed.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching property:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch property' }, { status: 500 });
  }
}

// PUT - Update property
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { nickname, notes, tags } = body;

    const property = await prisma.savedProperty.update({
      where: { id },
      data: {
        nickname,
        notes,
        tags,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      property: {
        id: property.id,
        address: property.address,
        nickname: property.nickname,
      },
    });
  } catch (error) {
    console.error('Error updating property:', error);
    return NextResponse.json({ success: false, error: 'Failed to update property' }, { status: 500 });
  }
}

// DELETE - Delete property
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Delete associated conversations first
    await prisma.conversation.deleteMany({
      where: { propertyId: id },
    });

    // Delete property
    await prisma.savedProperty.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting property:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete property' }, { status: 500 });
  }
}
