import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';

// POST - Add to waitlist
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, jurisdictionId, cityName, stateCode, addressSearched } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Check if already on waitlist for this jurisdiction
    const existing = await prisma.waitlist.findFirst({
      where: {
        email,
        jurisdictionId,
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Already on waitlist',
        alreadyExists: true,
      });
    }

    // Create or find the jurisdiction (even if not live)
    let jurisdiction = null;
    if (jurisdictionId) {
      jurisdiction = await prisma.jurisdiction.findFirst({
        where: { id: jurisdictionId },
      });

      if (!jurisdiction && cityName && stateCode) {
        // Create a placeholder jurisdiction
        jurisdiction = await prisma.jurisdiction.create({
          data: {
            id: jurisdictionId,
            name: cityName,
            state: stateCode,
            type: 'city',
            status: 'planned',
            dataCompleteness: 0,
          },
        });
      }
    }

    // Add to waitlist
    await prisma.waitlist.create({
      data: {
        email,
        jurisdictionId: jurisdiction?.id || null,
        cityName,
        stateCode,
        addressSearched,
        source: 'address_lookup',
      },
    });

    // Get waitlist count for this jurisdiction
    const waitlistCount = jurisdictionId
      ? await prisma.waitlist.count({
          where: { jurisdictionId },
        })
      : 0;

    return NextResponse.json({
      success: true,
      message: 'Added to waitlist',
      waitlistCount,
    });
  } catch (error) {
    console.error('Waitlist error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add to waitlist' },
      { status: 500 }
    );
  }
}

// GET - Get waitlist count for a jurisdiction
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jurisdictionId = searchParams.get('jurisdictionId');

    if (!jurisdictionId) {
      return NextResponse.json(
        { success: false, error: 'Jurisdiction ID required' },
        { status: 400 }
      );
    }

    const count = await prisma.waitlist.count({
      where: { jurisdictionId },
    });

    return NextResponse.json({
      success: true,
      jurisdictionId,
      waitlistCount: count,
    });
  } catch (error) {
    console.error('Waitlist count error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get waitlist count' },
      { status: 500 }
    );
  }
}
