import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin';

// GET /api/admin/extractions/[id] - Get job details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await params;

  const job = await prisma.extractionJob.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: [{ itemType: 'asc' }, { createdAt: 'asc' }],
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ job });
}

// DELETE /api/admin/extractions/[id] - Delete a job
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await params;

  const job = await prisma.extractionJob.findUnique({
    where: { id },
  });

  if (!job) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Only allow deleting failed or pending jobs
  if (!['failed', 'pending'].includes(job.status)) {
    return NextResponse.json(
      { error: 'Cannot delete job in this status' },
      { status: 400 }
    );
  }

  await prisma.extractionJob.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
