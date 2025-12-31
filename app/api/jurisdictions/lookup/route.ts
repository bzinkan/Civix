import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Jurisdiction Lookup API
 *
 * Finds the appropriate jurisdiction (city/county/state) for a given location.
 * Implements the fallback hierarchy:
 * 1. Try exact city match
 * 2. Fall back to county (if implemented)
 * 3. Fall back to state (if implemented)
 *
 * Query params:
 * - city: City name (required)
 * - state: State abbreviation (required)
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const state = searchParams.get('state');

    if (!city || !state) {
      return NextResponse.json(
        { error: 'Both city and state are required' },
        { status: 400 }
      );
    }

    // Normalize inputs
    const normalizedCity = city.trim();
    const normalizedState = state.trim().toUpperCase();

    // Step 1: Try exact city match (case-insensitive)
    const cityJurisdiction = await prisma.jurisdiction.findFirst({
      where: {
        name: {
          equals: normalizedCity,
          mode: 'insensitive',
        },
        state: normalizedState,
        type: 'city',
      },
      include: {
        ordinanceDocuments: {
          where: { isActive: true },
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            ordinanceChunks: true,
          },
        },
      },
    });

    if (cityJurisdiction && cityJurisdiction._count.ordinanceChunks > 0) {
      return NextResponse.json({
        found: true,
        jurisdiction: {
          id: cityJurisdiction.id,
          name: cityJurisdiction.name,
          state: cityJurisdiction.state,
          type: cityJurisdiction.type,
          hasOrdinances: true,
          ordinanceCount: cityJurisdiction._count.ordinanceChunks,
          documents: cityJurisdiction.ordinanceDocuments,
        },
        fallbackUsed: false,
        message: `Found ordinances for ${cityJurisdiction.name}, ${cityJurisdiction.state}`,
      });
    }

    // Step 2: Try county (future implementation)
    // const countyJurisdiction = await findCountyJurisdiction(normalizedCity, normalizedState);
    // if (countyJurisdiction) { ... }

    // Step 3: Try state (future implementation)
    // const stateJurisdiction = await findStateJurisdiction(normalizedState);
    // if (stateJurisdiction) { ... }

    // No jurisdiction found
    return NextResponse.json({
      found: false,
      jurisdiction: null,
      fallbackUsed: false,
      message: `We don't have ordinances for ${normalizedCity}, ${normalizedState} yet.`,
      suggestion: `We currently support: Cincinnati, OH. More cities coming soon!`,
    });

  } catch (error: any) {
    console.error('Jurisdiction lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup jurisdiction' },
      { status: 500 }
    );
  }
}

/**
 * Get list of all available jurisdictions
 */
export async function POST(request: NextRequest) {
  try {
    const jurisdictions = await prisma.jurisdiction.findMany({
      where: {
        ordinanceChunks: {
          some: {},
        },
      },
      select: {
        id: true,
        name: true,
        state: true,
        type: true,
        _count: {
          select: {
            ordinanceChunks: true,
          },
        },
      },
      orderBy: [
        { state: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({
      jurisdictions: jurisdictions.map(j => ({
        id: j.id,
        name: j.name,
        state: j.state,
        type: j.type,
        ordinanceCount: j._count.ordinanceChunks,
      })),
      total: jurisdictions.length,
    });

  } catch (error: any) {
    console.error('Jurisdiction list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jurisdictions' },
      { status: 500 }
    );
  }
}
