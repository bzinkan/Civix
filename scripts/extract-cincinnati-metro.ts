import { PrismaClient } from '@prisma/client';
import {
  createExtractionJob,
  runExtraction,
} from '../lib/extraction/job-manager';

const prisma = new PrismaClient();

// Priority order - largest/most important cities first
const EXTRACTION_ORDER = [
  // Tier 1: Major cities (>30K population)
  'covington-ky',
  'florence-ky',
  'mason-oh',
  'fairfield-oh',
  'hamilton-oh',
  'middletown-oh',

  // Tier 2: Medium cities (15K-30K)
  'newport-ky',
  'independence-ky',
  'lebanon-oh',
  'forest-park-oh',
  'norwood-oh',
  'erlanger-ky',
  'springboro-oh',
  'fort-thomas-ky',
  'springdale-oh',
  'sharonville-oh',
  'monroe-oh',
  'loveland-oh',
  'trenton-oh',
  'blue-ash-oh',

  // Tier 3: Small cities (5K-15K)
  'oxford-oh',
  'reading-oh',
  'montgomery-oh',
  'alexandria-ky',
  'madeira-oh',
  'wyoming-oh',
  'edgewood-ky',
  'elsmere-ky',
  'fort-mitchell-ky',
  'villa-hills-ky',
  'highland-heights-ky',
  'milford-oh',
  'taylor-mill-ky',
  'cold-spring-ky',
  'union-ky',
  'indian-hill-oh',
  'deer-park-oh',
  'bellevue-ky',
  'dayton-ky',
  'evendale-oh',

  // Tier 4: Smaller municipalities (<5K)
  'silverton-oh',
  'walton-ky',
  'southgate-ky',
  'golf-manor-oh',
  'woodlawn-oh',
  'amberley-village-oh',
  'lockland-oh',
  'mariemont-oh',
  'lincoln-heights-oh',
  'crestview-hills-ky',
  'lakeside-park-ky',
  'glendale-oh',
  'batavia-oh',
  'franklin-oh',
];

interface ExtractionResult {
  jurisdictionId: string;
  reason?: string;
  error?: string;
}

interface Results {
  success: string[];
  failed: ExtractionResult[];
  skipped: ExtractionResult[];
}

async function extractAll() {
  console.log('='.repeat(70));
  console.log('  CINCINNATI METRO AREA EXTRACTION');
  console.log('='.repeat(70));
  console.log(`\n  Total jurisdictions: ${EXTRACTION_ORDER.length}`);
  console.log('  Estimated time: 4-8 hours (running overnight recommended)\n');
  console.log('='.repeat(70));

  const results: Results = {
    success: [],
    failed: [],
    skipped: [],
  };

  for (let i = 0; i < EXTRACTION_ORDER.length; i++) {
    const jurisdictionId = EXTRACTION_ORDER[i];
    const progress = `[${i + 1}/${EXTRACTION_ORDER.length}]`;

    console.log(`\n${progress} Processing: ${jurisdictionId}`);
    console.log('-'.repeat(50));

    // Check if jurisdiction exists
    const jurisdiction = await prisma.jurisdiction.findUnique({
      where: { id: jurisdictionId },
    });

    if (!jurisdiction) {
      console.log(`  Skipped: Not in database`);
      results.skipped.push({ jurisdictionId, reason: 'Not in database' });
      continue;
    }

    if (jurisdiction.status === 'live') {
      console.log(`  Skipped: Already live`);
      results.skipped.push({ jurisdictionId, reason: 'Already live' });
      continue;
    }

    // Check for existing running job
    const existingJob = await prisma.extractionJob.findFirst({
      where: {
        jurisdictionId,
        status: { in: ['pending', 'scraping', 'extracting'] },
      },
    });

    if (existingJob) {
      console.log(`  Skipped: Job already in progress`);
      results.skipped.push({ jurisdictionId, reason: 'Job already running' });
      continue;
    }

    try {
      // Create and run extraction job
      const job = await createExtractionJob(jurisdictionId, {});

      console.log(`  Started job: ${job.id}`);
      await runExtraction(job.id);

      results.success.push(jurisdictionId);
      console.log(`  Complete - Ready for review`);
    } catch (error: any) {
      console.log(`  Failed: ${error.message}`);
      results.failed.push({
        jurisdictionId,
        error: error.message,
      });
    }

    // Rate limiting - wait between extractions
    console.log(`  Waiting 10 seconds before next...`);
    await new Promise((r) => setTimeout(r, 10000));
  }

  // ========================================
  // SUMMARY
  // ========================================

  console.log('\n');
  console.log('='.repeat(70));
  console.log('  EXTRACTION COMPLETE');
  console.log('='.repeat(70));
  console.log(`\n  Success: ${results.success.length}`);
  console.log(`  Failed:  ${results.failed.length}`);
  console.log(`  Skipped: ${results.skipped.length}`);

  if (results.success.length > 0) {
    console.log('\n  Successful extractions:');
    results.success.forEach((j) => console.log(`    - ${j}`));
  }

  if (results.failed.length > 0) {
    console.log('\n  Failed extractions:');
    results.failed.forEach((f) =>
      console.log(`    - ${f.jurisdictionId}: ${f.error}`)
    );
  }

  if (results.skipped.length > 0) {
    console.log('\n  Skipped:');
    results.skipped.forEach((s) =>
      console.log(`    - ${s.jurisdictionId}: ${s.reason}`)
    );
  }

  console.log('\n');
  console.log('='.repeat(70));
  console.log('  NEXT STEPS');
  console.log('='.repeat(70));
  console.log(`
  1. Go to /admin/extractions to see all jobs
  2. Review each extraction
  3. Fix any low-confidence items
  4. Click "Approve" to make data live
  5. Users can then search these cities!
  `);
  console.log('='.repeat(70));

  // Save results to file
  const fs = await import('fs');
  fs.writeFileSync(
    'extraction-results.json',
    JSON.stringify(results, null, 2)
  );
  console.log('\n  Results saved to: extraction-results.json\n');
}

// Run
extractAll()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
