import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Saved Properties API
 *
 * GET /api/user/properties - List saved properties
 * POST /api/user/properties - Save a new property
 */

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const properties = await prisma.savedProperty.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({
      properties,
      count: properties.length
    });

  } catch (error: any) {
    console.error('Properties API error:', error);
    return NextResponse.json(
      { error: 'Failed to get properties' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      address,
      nickname,
      parcelId,
      jurisdictionId,
      zoneCode,
      zoneDescription,
      isHistoric,
      historicDistrict,
      overlayData,
      notes,
      tags
    } = body;

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Check plan limits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { _count: { select: { savedProperties: true } } }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const limits: Record<string, number> = {
      free: 1,
      pro: 25,
      business: -1,
      enterprise: -1
    };

    const limit = limits[user.subscriptionPlan] || 1;
    if (limit !== -1 && user._count.savedProperties >= limit) {
      return NextResponse.json(
        {
          error: 'Property limit reached',
          message: `Your ${user.subscriptionPlan} plan allows ${limit} saved properties. Upgrade to save more.`,
          currentCount: user._count.savedProperties,
          limit
        },
        { status: 403 }
      );
    }

    // Check if already saved
    const existing = await prisma.savedProperty.findFirst({
      where: { userId, address }
    });

    if (existing) {
      // Update existing
      const updated = await prisma.savedProperty.update({
        where: { id: existing.id },
        data: {
          nickname: nickname || existing.nickname,
          zoneCode: zoneCode || existing.zoneCode,
          zoneDescription: zoneDescription || existing.zoneDescription,
          isHistoric: isHistoric ?? existing.isHistoric,
          historicDistrict: historicDistrict || existing.historicDistrict,
          overlayData: overlayData || existing.overlayData,
          notes: notes ?? existing.notes,
          tags: tags || existing.tags,
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        property: updated,
        message: 'Property updated'
      });
    }

    // Create new
    const property = await prisma.savedProperty.create({
      data: {
        userId,
        address,
        nickname,
        parcelId,
        jurisdictionId,
        zoneCode,
        zoneDescription,
        isHistoric: isHistoric || false,
        historicDistrict,
        overlayData,
        notes,
        tags: tags || []
      }
    });

    return NextResponse.json({
      success: true,
      property,
      message: 'Property saved'
    });

  } catch (error: any) {
    console.error('Save property error:', error);
    return NextResponse.json(
      { error: 'Failed to save property' },
      { status: 500 }
    );
  }
}
