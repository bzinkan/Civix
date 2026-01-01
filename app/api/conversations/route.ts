import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/conversations
 * Create a new conversation
 *
 * Body:
 * - userId (optional): User ID if authenticated
 * - fingerprint (optional): Browser fingerprint for anonymous users
 * - jurisdictionId: The jurisdiction ID
 * - jurisdictionName: Jurisdiction name
 * - jurisdictionState: Jurisdiction state
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, fingerprint, jurisdictionId, jurisdictionName, jurisdictionState } = await request.json();

    if (!jurisdictionId || !jurisdictionName || !jurisdictionState) {
      return NextResponse.json(
        { error: 'Jurisdiction details are required' },
        { status: 400 }
      );
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        userId: userId || null,
        fingerprint: fingerprint || null,
        jurisdictionId,
        jurisdictionName,
        jurisdictionState,
        status: 'active',
      },
    });

    return NextResponse.json(conversation);
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/conversations
 * List conversations for a user
 *
 * Query params:
 * - userId (optional): User ID
 * - fingerprint (optional): Browser fingerprint
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const fingerprint = searchParams.get('fingerprint');

    if (!userId && !fingerprint) {
      return NextResponse.json(
        { error: 'userId or fingerprint required' },
        { status: 400 }
      );
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        ...(userId ? { userId } : { fingerprint }),
        status: 'active',
      },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(conversations);
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
