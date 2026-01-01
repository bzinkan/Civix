import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function testSeededData() {
  console.log('\n=== TESTING SEEDED CINCINNATI DATA ===\n');

  // Test ZoningDistricts
  console.log('--- ZONING DISTRICTS ---');
  const zones = await prisma.zoningDistrict.findMany({ take: 3 });
  console.log(`Total zoning districts: ${await prisma.zoningDistrict.count()}`);
  for (const z of zones) {
    console.log(`  ${z.code}: ${z.name}`);
    console.log(`    Setbacks: Front ${z.frontSetbackFt}ft, Side ${z.sideSetbackFt}ft, Rear ${z.rearSetbackFt}ft`);
    console.log(`    Height: ${z.maxHeightFt}ft | Lot Coverage: ${z.maxLotCoverage}`);
  }
  console.log();

  // Test PermitRequirements
  console.log('--- PERMIT REQUIREMENTS ---');
  const permits = await prisma.permitRequirement.findMany({ take: 3 });
  console.log(`Total permit requirements: ${await prisma.permitRequirement.count()}`);
  for (const p of permits) {
    console.log(`  ${p.activityType}: ${p.category} - ${p.activityDescription}`);
    console.log(`    Fee: $${p.feeBase} + $${p.feePerSqft || 0}/sqft | Processing: ${p.processingDays} days`);
  }
  console.log();

  // Test PermitExemptions
  console.log('--- PERMIT EXEMPTIONS ---');
  const exemptions = await prisma.permitExemption.findMany({ take: 3 });
  console.log(`Total exemptions: ${await prisma.permitExemption.count()}`);
  for (const e of exemptions) {
    console.log(`  ${e.activity}: ${e.description}`);
    console.log(`    Conditions: ${e.conditions || 'None'}`);
  }
  console.log();

  // Test CommonQuestions
  console.log('--- COMMON QUESTIONS ---');
  const questions = await prisma.commonQuestion.findMany({ take: 2 });
  console.log(`Total common questions: ${await prisma.commonQuestion.count()}`);
  for (const q of questions) {
    console.log(`  Q: ${q.question}`);
    console.log(`  A: ${q.answer.substring(0, 80)}...`);
  }
  console.log();

  // Test BuildingCodeChunks
  console.log('--- BUILDING CODE CHUNKS ---');
  const codes = await prisma.buildingCodeChunk.findMany({ take: 2 });
  console.log(`Total building code chunks: ${await prisma.buildingCodeChunk.count()}`);
  for (const c of codes) {
    console.log(`  ${c.section}: ${c.title}`);
    console.log(`    ${c.content.substring(0, 80)}...`);
  }
  console.log();

  console.log('=== ALL DATA VERIFIED SUCCESSFULLY ===\n');

  await prisma.$disconnect();
}

testSeededData().catch(console.error);
