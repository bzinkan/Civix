import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminActivity } from '@/lib/auth/admin';
import { approveExtraction } from '@/lib/extraction/job-manager';

// POST /api/admin/extractions/[id]/approve
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    await approveExtraction(id, auth.user!.id);

    await logAdminActivity(
      auth.user!.id,
      'approved_extraction',
      'job',
      id,
      {}
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to approve extraction' },
      { status: 400 }
    );
  }
}
