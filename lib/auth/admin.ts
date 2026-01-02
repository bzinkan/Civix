import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export interface AdminAuthResult {
  user?: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
  error?: NextResponse;
}

/**
 * Get current user from session/cookie
 * This is a simplified version - in production, use NextAuth or similar
 */
async function getCurrentUser(): Promise<{ id: string; email: string } | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return null;
    }

    // In production, verify JWT or session token
    // For now, just decode the email from the cookie
    const decoded = JSON.parse(atob(sessionCookie.value));
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Require admin role for API routes
 */
export async function requireAdmin(
  request?: NextRequest
): Promise<AdminAuthResult> {
  const session = await getCurrentUser();

  if (!session?.email) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user) {
    return {
      error: NextResponse.json({ error: 'User not found' }, { status: 401 }),
    };
  }

  if (!['admin', 'super_admin'].includes(user.role)) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { user };
}

/**
 * Require super_admin role for sensitive operations
 */
export async function requireSuperAdmin(
  request?: NextRequest
): Promise<AdminAuthResult> {
  const session = await getCurrentUser();

  if (!session?.email) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user) {
    return {
      error: NextResponse.json({ error: 'User not found' }, { status: 401 }),
    };
  }

  if (user.role !== 'super_admin') {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { user };
}

/**
 * Check if user has reviewer access (can review but not approve)
 */
export async function requireReviewer(
  request?: NextRequest
): Promise<AdminAuthResult> {
  const session = await getCurrentUser();

  if (!session?.email) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user) {
    return {
      error: NextResponse.json({ error: 'User not found' }, { status: 401 }),
    };
  }

  if (!['reviewer', 'admin', 'super_admin'].includes(user.role)) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { user };
}

/**
 * Log admin activity
 */
export async function logAdminActivity(
  userId: string | null,
  action: string,
  targetType?: string,
  targetId?: string,
  details?: Record<string, any>
) {
  return prisma.adminActivityLog.create({
    data: {
      userId,
      action,
      targetType,
      targetId,
      details,
    },
  });
}
