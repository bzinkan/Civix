import { NextRequest, NextResponse } from 'next/server';
import { createConversation, loadConversation, processMessage } from '@/lib/ai/conversation';
import { checkAnonymousUsage, incrementAnonymousUsage } from '@/lib/auth/usage-limiter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationId, fingerprint, userId } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check usage limits for anonymous users
    if (!userId && fingerprint) {
      const usageCheck = await checkAnonymousUsage(fingerprint);

      if (!usageCheck.allowed) {
        return NextResponse.json({
          type: 'paywall',
          message: usageCheck.message,
          conversationId: null,
          usage: {
            remaining: usageCheck.remaining,
            limit: usageCheck.limit,
          },
        });
      }
    }

    // Load or create conversation
    let context;

    if (conversationId) {
      context = await loadConversation(conversationId);
      if (!context) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
    } else {
      context = await createConversation(userId, fingerprint);
    }

    // Process the message
    const response = await processMessage(context, message);

    // Increment usage for new conversations
    if (!conversationId && !userId && fingerprint) {
      await incrementAnonymousUsage(fingerprint);
    }

    // Get updated usage info
    let usage;
    if (!userId && fingerprint) {
      const usageCheck = await checkAnonymousUsage(fingerprint);
      usage = {
        remaining: usageCheck.remaining,
        limit: usageCheck.limit,
      };
    }

    return NextResponse.json({
      ...response,
      conversationId: context.conversationId,
      usage,
    });

  } catch (error: any) {
    console.error('Query API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
