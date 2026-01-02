import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, logAdminActivity } from '@/lib/auth/admin';

// GET /api/admin/jurisdictions - List all jurisdictions
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const where: Record<string, any> = {};
  if (status) where.status = status;

  const jurisdictions = await prisma.jurisdiction.findMany({
    where,
    orderBy: [{ status: 'asc' }, { name: 'asc' }],
    include: {
      _count: {
        select: {
          waitlist: true,
          zoning: true,
          permitRequirements: true,
          commonQuestions: true,
        },
      },
    },
  });

  // Add waitlist counts
  const jurisdictionsWithCounts = jurisdictions.map((j) => ({
    ...j,
    waitlistCount: j._count.waitlist,
    zoningCount: j._count.zoning,
    permitCount: j._count.permitRequirements,
    questionCount: j._count.commonQuestions,
  }));

  return NextResponse.json({ jurisdictions: jurisdictionsWithCounts });
}

// POST /api/admin/jurisdictions - Create new jurisdiction
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  const { id, name, state, type, county, population } = body;

  if (!id || !name || !state) {
    return NextResponse.json(
      { error: 'id, name, and state are required' },
      { status: 400 }
    );
  }

  // Check for existing
  const existing = await prisma.jurisdiction.findUnique({
    where: { id },
  });

  if (existing) {
    return NextResponse.json(
      { error: 'Jurisdiction already exists' },
      { status: 409 }
    );
  }

  const jurisdiction = await prisma.jurisdiction.create({
    data: {
      id,
      name,
      state,
      type: type || 'city',
      county,
      population,
      status: 'planned',
      dataCompleteness: 0,
    },
  });

  await logAdminActivity(
    auth.user!.id,
    'created_jurisdiction',
    'jurisdiction',
    id,
    { name, state }
  );

  return NextResponse.json({ success: true, jurisdiction });
}
