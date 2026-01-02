import { prisma } from '@/lib/db';
import {
  scrapeJurisdiction,
  getKnownSource,
  getSourceUrl,
} from '../scrapers/unified-scraper';
import {
  getZoningDistricts,
  getCountyForJurisdiction,
} from '../scrapers/county-gis';
import {
  extractZoningDistricts,
  extractPermitRequirements,
  extractBuildingCodes,
  generateCommonQuestions,
  extractIndustryPermits,
  ExtractedZone,
  ExtractedPermit,
  ExtractedCode,
  ExtractedQuestion,
} from './ai-extractor';

export interface CreateJobOptions {
  jobType?: string;
  municodeUrl?: string;
  gisUrl?: string;
  feeScheduleUrl?: string;
}

/**
 * Create a new extraction job
 */
export async function createExtractionJob(
  jurisdictionId: string,
  options: CreateJobOptions = {}
) {
  const job = await prisma.extractionJob.create({
    data: {
      jurisdictionId,
      jobType: options.jobType || 'full',
      status: 'pending',
      municodeUrl: options.municodeUrl,
      gisUrl: options.gisUrl,
      feeScheduleUrl: options.feeScheduleUrl,
    },
  });

  return job;
}

/**
 * Update job record
 */
async function updateJob(jobId: string, data: Record<string, any>) {
  return prisma.extractionJob.update({
    where: { id: jobId },
    data,
  });
}

/**
 * Save individual extraction item
 */
async function saveExtractionItem(
  jobId: string,
  itemType: string,
  itemKey: string | undefined,
  data: Record<string, any>
) {
  const confidence = data.confidence || 'medium';
  const needsReview = confidence === 'low';

  return prisma.extractionItem.create({
    data: {
      jobId,
      itemType,
      itemKey,
      extractedData: data,
      confidence,
      needsReview,
    },
  });
}

/**
 * Calculate overall confidence score
 */
function calculateConfidence(
  zones: ExtractedZone[],
  permits: ExtractedPermit[],
  codes: ExtractedCode[]
): number {
  const allItems = [...zones, ...permits, ...codes];
  if (allItems.length === 0) return 0;

  const scores: Record<string, number> = { high: 1, medium: 0.7, low: 0.4 };
  const total = allItems.reduce((sum, item) => {
    return sum + (scores[item.confidence] || 0.5);
  }, 0);

  return Math.round((total / allItems.length) * 100) / 100;
}

/**
 * Run full extraction for a jurisdiction
 */
export async function runExtraction(jobId: string) {
  const job = await prisma.extractionJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error('Job not found');

  const jurisdictionId = job.jurisdictionId;

  try {
    // Update status
    await updateJob(jobId, { status: 'scraping', startedAt: new Date() });

    // ========================================
    // STEP 1: Scrape Code Source (Municode, AmLegal, eCode360, etc.)
    // ========================================
    const codeSource = getKnownSource(jurisdictionId);
    const sourceUrl = getSourceUrl(jurisdictionId);
    console.log(`[${jurisdictionId}] Step 1: Scraping ${codeSource}...`);
    if (sourceUrl) {
      console.log(`  Source URL: ${sourceUrl}`);
    }

    let scrapedData = null;
    try {
      scrapedData = await scrapeJurisdiction(jurisdictionId);
      console.log(`  Source: ${(scrapedData as any)?.source || 'unknown'}`);
      console.log(`  Chapters found: ${(scrapedData as any)?.chapters?.length || 0}`);
    } catch (e: any) {
      console.log(`  Scrape failed: ${e.message}`);
    }

    await updateJob(jobId, {
      scrapedData,
      progress: 20,
    });

    // ========================================
    // STEP 2: Get County GIS Data
    // ========================================
    console.log(`[${jurisdictionId}] Step 2: Fetching county GIS data...`);

    const county = getCountyForJurisdiction(jurisdictionId);
    let gisZones = null;
    if (county) {
      try {
        gisZones = await getZoningDistricts(county.countyId);
      } catch (e: any) {
        console.log(`  GIS fetch failed: ${e.message}`);
      }
    }

    await updateJob(jobId, { progress: 30, status: 'extracting' });

    // ========================================
    // STEP 3: Extract Zoning Districts
    // ========================================
    console.log(`[${jurisdictionId}] Step 3: Extracting zoning districts...`);

    const zoningChapter = (scrapedData as any)?.chapters?.find(
      (ch: any) => ch.isZoning
    );
    let zones: ExtractedZone[] = [];

    if (zoningChapter?.fullText) {
      const result = await extractZoningDistricts(
        jurisdictionId,
        zoningChapter.fullText
      );
      if (Array.isArray(result)) {
        zones = result;
      }
    }

    await updateJob(jobId, { extractedZones: zones, progress: 45 });

    // Save individual items
    for (const zone of zones) {
      await saveExtractionItem(jobId, 'zone', zone.zone_code, zone);
    }

    // ========================================
    // STEP 4: Extract Permit Requirements
    // ========================================
    console.log(`[${jurisdictionId}] Step 4: Extracting permit requirements...`);

    const buildingChapter = (scrapedData as any)?.chapters?.find(
      (ch: any) => ch.isBuilding
    );
    const businessChapter = (scrapedData as any)?.chapters?.find(
      (ch: any) => ch.isBusiness
    );
    const healthChapter = (scrapedData as any)?.chapters?.find(
      (ch: any) => ch.isHealth
    );

    // Combine all relevant chapters for permit extraction
    const permitText = [
      buildingChapter?.fullText || '',
      businessChapter?.fullText || '',
      healthChapter?.fullText || '',
    ].filter(t => t.length > 100).join('\n\n---\n\n');

    let permits: ExtractedPermit[] = [];

    if (permitText.length > 100) {
      const result = await extractPermitRequirements(
        jurisdictionId,
        permitText
      );
      if (Array.isArray(result)) {
        permits = result;
      }
    }

    await updateJob(jobId, { extractedPermits: permits, progress: 55 });

    for (const permit of permits) {
      await saveExtractionItem(jobId, 'permit', permit.permit_type, permit);
    }

    // ========================================
    // STEP 5: Extract Building Codes
    // ========================================
    console.log(`[${jurisdictionId}] Step 5: Extracting building codes...`);

    // Use building chapter if available, otherwise try business/health chapters
    const codeText = buildingChapter?.fullText || businessChapter?.fullText || healthChapter?.fullText || '';

    let codes: ExtractedCode[] = [];
    if (codeText.length > 100) {
      const result = await extractBuildingCodes(
        jurisdictionId,
        codeText,
        'local'
      );
      if (Array.isArray(result)) {
        codes = result;
      }
    }

    await updateJob(jobId, { extractedCodes: codes, progress: 65 });

    for (const code of codes) {
      await saveExtractionItem(jobId, 'code', code.section, code);
    }

    // ========================================
    // STEP 6: Extract Industry Permits
    // ========================================
    console.log(`[${jurisdictionId}] Step 6: Extracting industry permits...`);

    const industries = [
      'food',
      'beauty',
      'pet',
      'fitness',
      'childcare',
      'healthcare',
      'auto',
      'entertainment',
    ];
    const allIndustryPermits: any[] = [];

    // Reuse businessChapter and healthChapter from Step 4
    const combinedText = [
      buildingChapter?.fullText || '',
      businessChapter?.fullText || '',
      healthChapter?.fullText || '',
    ].join('\n\n');

    if (combinedText.length > 100) {
      for (const industry of industries) {
        const industryPermits = await extractIndustryPermits(
          jurisdictionId,
          combinedText,
          industry
        );
        if (Array.isArray(industryPermits)) {
          allIndustryPermits.push(...industryPermits);

          for (const permit of industryPermits) {
            await saveExtractionItem(
              jobId,
              'permit',
              permit.permit_type,
              permit
            );
          }
        }
      }
    }

    // Merge with existing permits
    permits = [...permits, ...allIndustryPermits];
    await updateJob(jobId, { extractedPermits: permits, progress: 80 });

    // ========================================
    // STEP 7: Generate Common Q&A
    // ========================================
    console.log(`[${jurisdictionId}] Step 7: Generating Q&A...`);

    let questions: ExtractedQuestion[] = [];
    if (zones.length > 0 || permits.length > 0) {
      const result = await generateCommonQuestions(
        jurisdictionId,
        zones,
        permits as any
      );
      if (Array.isArray(result)) {
        questions = result;
      }
    }

    await updateJob(jobId, { extractedQuestions: questions, progress: 95 });

    for (const q of questions) {
      await saveExtractionItem(jobId, 'question', q.category, q);
    }

    // ========================================
    // STEP 8: Complete
    // ========================================
    const itemsNeedReview = await prisma.extractionItem.count({
      where: { jobId, needsReview: true },
    });

    await updateJob(jobId, {
      status: 'review',
      progress: 100,
      completedAt: new Date(),
      itemsFound: zones.length + permits.length + codes.length + questions.length,
      itemsNeedReview,
      confidenceScore: calculateConfidence(zones, permits as any, codes),
    });

    console.log(`\n Extraction complete for ${jurisdictionId}`);
    console.log(`   Zones: ${zones.length}`);
    console.log(`   Permits: ${permits.length}`);
    console.log(`   Codes: ${codes.length}`);
    console.log(`   Questions: ${questions.length}`);
    console.log(`   Need Review: ${itemsNeedReview}`);

    return { success: true, jobId };
  } catch (error: any) {
    console.error(`Extraction failed for ${jurisdictionId}:`, error);

    await updateJob(jobId, {
      status: 'failed',
      errorMessage: error.message,
      completedAt: new Date(),
    });

    throw error;
  }
}

/**
 * Approve extraction and import to production
 */
export async function approveExtraction(jobId: string, userId: string) {
  const job = await prisma.extractionJob.findUnique({
    where: { id: jobId },
    include: { items: true },
  });

  if (!job) throw new Error('Job not found');
  if (job.status !== 'review') throw new Error('Job not ready for approval');

  const jurisdictionId = job.jurisdictionId;

  // Import zones
  const zones = (job.extractedZones as unknown as ExtractedZone[]) || [];
  for (const zone of zones) {
    await prisma.zoningDistrict.upsert({
      where: {
        jurisdictionId_code: {
          jurisdictionId,
          code: zone.zone_code,
        },
      },
      create: {
        jurisdictionId,
        code: zone.zone_code,
        name: zone.zone_name,
        category: zone.category,
        description: zone.description,
        minLotSqft: zone.min_lot_sqft,
        maxLotCoverage: zone.max_lot_coverage,
        maxHeightFt: zone.max_height_ft,
        frontSetbackFt: zone.front_setback_ft,
        sideSetbackFt: zone.side_setback_ft,
        rearSetbackFt: zone.rear_setback_ft,
        allowedUses: zone.allowed_uses,
      },
      update: {
        name: zone.zone_name,
        category: zone.category,
        description: zone.description,
        minLotSqft: zone.min_lot_sqft,
        maxLotCoverage: zone.max_lot_coverage,
        maxHeightFt: zone.max_height_ft,
        frontSetbackFt: zone.front_setback_ft,
        sideSetbackFt: zone.side_setback_ft,
        rearSetbackFt: zone.rear_setback_ft,
        allowedUses: zone.allowed_uses,
      },
    });
  }

  // Import permits
  const permits = (job.extractedPermits as unknown as ExtractedPermit[]) || [];
  for (const permit of permits) {
    await prisma.permitRequirement.upsert({
      where: {
        jurisdictionId_activityType: {
          jurisdictionId,
          activityType: permit.permit_type,
        },
      },
      create: {
        jurisdictionId,
        activityType: permit.permit_type,
        category: permit.category,
        activityDescription: permit.description,
        feeBase: permit.fee_base,
        processingDays: permit.review_days,
        requiresPlans: permit.requires_plans,
        requiresInspection: permit.requires_inspection,
        ordinanceRef: permit.code_section,
      },
      update: {
        category: permit.category,
        activityDescription: permit.description,
        feeBase: permit.fee_base,
        processingDays: permit.review_days,
        requiresPlans: permit.requires_plans,
        requiresInspection: permit.requires_inspection,
        ordinanceRef: permit.code_section,
      },
    });
  }

  // Import codes
  const codes = (job.extractedCodes as unknown as ExtractedCode[]) || [];
  for (const code of codes) {
    await prisma.buildingCodeChunk.create({
      data: {
        jurisdictionId,
        codeType: code.code_type,
        section: code.section,
        title: code.title,
        content: code.content,
      },
    });
  }

  // Import questions
  const questions = (job.extractedQuestions as unknown as ExtractedQuestion[]) || [];
  for (const q of questions) {
    await prisma.commonQuestion.create({
      data: {
        jurisdictionId,
        question: q.question,
        category: q.category,
        answer: q.answer,
        relatedPermits: q.related_permits,
        ordinanceRef: q.code_reference,
      },
    });
  }

  // Update job status
  await prisma.extractionJob.update({
    where: { id: jobId },
    data: {
      status: 'approved',
      reviewedBy: userId,
      reviewedAt: new Date(),
    },
  });

  // Update jurisdiction status
  await prisma.jurisdiction.update({
    where: { id: jurisdictionId },
    data: {
      status: 'live',
      dataCompleteness: 100,
    },
  });

  // Log activity
  await prisma.adminActivityLog.create({
    data: {
      userId,
      action: 'approved_extraction',
      targetType: 'job',
      targetId: jobId,
      details: {
        jurisdictionId,
        zones: zones.length,
        permits: permits.length,
        codes: codes.length,
        questions: questions.length,
      },
    },
  });

  console.log(`Approved and imported: ${jurisdictionId}`);

  return { success: true };
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string) {
  return prisma.extractionJob.findUnique({
    where: { id: jobId },
    include: {
      items: {
        where: { needsReview: true },
        take: 10,
      },
    },
  });
}

/**
 * Get all jobs for a jurisdiction
 */
export async function getJurisdictionJobs(jurisdictionId: string) {
  return prisma.extractionJob.findMany({
    where: { jurisdictionId },
    orderBy: { createdAt: 'desc' },
  });
}
