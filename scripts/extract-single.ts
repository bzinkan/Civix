import { PrismaClient } from '@prisma/client';
import {
  createExtractionJob,
  runExtraction,
} from '../lib/extraction/job-manager';

const prisma = new PrismaClient();

async function extractSingle(jurisdictionId: string) {
  console.log('='.repeat(70));
  console.log(`  EXTRACTING: ${jurisdictionId}`);
  console.log('='.repeat(70));

  // Check if jurisdiction exists
  const jurisdiction = await prisma.jurisdiction.findUnique({
    where: { id: jurisdictionId },
  });

  if (!jurisdiction) {
    console.log(`\nError: Jurisdiction "${jurisdictionId}" not found in database.`);
    console.log('\nAvailable jurisdictions:');
    const all = await prisma.jurisdiction.findMany({
      select: { id: true, name: true, state: true },
      orderBy: { name: 'asc' },
    });
    all.forEach((j) => console.log(`  - ${j.id} (${j.name}, ${j.state})`));
    return;
  }

  console.log(`\n  Name: ${jurisdiction.name}`);
  console.log(`  State: ${jurisdiction.state}`);
  console.log(`  Status: ${jurisdiction.status}`);

  if (jurisdiction.status === 'live') {
    console.log('\n  This jurisdiction is already live!');
    console.log('  Use --force to re-extract anyway.');
    return;
  }

  try {
    console.log('\n  Creating extraction job...');
    const job = await createExtractionJob(jurisdictionId, {});
    console.log(`  Job ID: ${job.id}`);

    console.log('\n  Running extraction...\n');
    await runExtraction(job.id);

    console.log('\n');
    console.log('='.repeat(70));
    console.log('  EXTRACTION COMPLETE');
    console.log('='.repeat(70));
    console.log(`
  Go to /admin/extractions/${job.id} to review and approve.
    `);
  } catch (error: any) {
    console.error('\n  Extraction failed:', error.message);
  }
}

// Get jurisdiction from command line args
const jurisdictionId = process.argv[2];

if (!jurisdictionId) {
  console.log('Usage: npx tsx scripts/extract-single.ts <jurisdiction-id>');
  console.log('Example: npx tsx scripts/extract-single.ts covington-ky');
  process.exit(1);
}

extractSingle(jurisdictionId)
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
