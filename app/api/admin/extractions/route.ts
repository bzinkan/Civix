import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, logAdminActivity } from '@/lib/auth/admin';
import {
  createExtractionJob,
  runExtraction,
} from '@/lib/extraction/job-manager';

// GET /api/admin/extractions - List all jobs
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const jurisdictionId = searchParams.get('jurisdictionId');

  const where: Record<string, any> = {};
  if (status) where.status = status;
  if (jurisdictionId) where.jurisdictionId = jurisdictionId;

  const jobs = await prisma.extractionJob.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      _count: {
        select: { items: true },
      },
    },
  });

  return NextResponse.json({ jobs });
}

// POST /api/admin/extractions - Start new extraction
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  const { jurisdictionId, municodeUrl, gisUrl, feeScheduleUrl } = body;

  if (!jurisdictionId) {
    return NextResponse.json(
      { error: 'jurisdictionId is required' },
      { status: 400 }
    );
  }

  // Check for existing running job
  const existingJob = await prisma.extractionJob.findFirst({
    where: {
      jurisdictionId,
      status: { in: ['pending', 'scraping', 'extracting'] },
    },
  });

  if (existingJob) {
    return NextResponse.json(
      { error: 'An extraction is already in progress', jobId: existingJob.id },
      { status: 409 }
    );
  }

  // Create job
  const job = await createExtractionJob(jurisdictionId, {
    municodeUrl,
    gisUrl,
    feeScheduleUrl,
  });

  // Log activity
  await logAdminActivity(
    auth.user!.id,
    'started_extraction',
    'job',
    job.id,
    { jurisdictionId }
  );

  // Run extraction in background (don't await)
  runExtraction(job.id).catch((error) => {
    console.error('Extraction failed:', error);
  });

  return NextResponse.json({ success: true, jobId: job.id });
}
