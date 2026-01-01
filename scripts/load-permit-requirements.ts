import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as csv from 'csv-parse/sync';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

/**
 * Load permit requirements from CSV file
 *
 * Usage:
 *   npx tsx scripts/load-permit-requirements.ts <csv-file-path> <jurisdiction-id>
 *
 * CSV Format Expected:
 *   activityType,activityDescription,zoneCode,requiresPermit,permitType,requirements,estimatedFee,processingDays,documents,sourceUrl,ordinanceRef
 *   "fence","Install fence over 4 feet",,"true","Zoning Certificate","{\"maxHeight\": 6, \"setback\": 3}","50","5-10","Site plan,Property survey","https://...","1421-01"
 *
 * Example:
 *   npx tsx scripts/load-permit-requirements.ts ./cincinnati-permits.csv cincinnati-oh
 */
async function loadPermitRequirements(csvPath: string, jurisdictionId: string) {
  console.log(`📦 Loading permit requirements from: ${csvPath}`);
  console.log(`   Jurisdiction: ${jurisdictionId}\n`);

  try {
    // Verify jurisdiction exists
    const jurisdiction = await prisma.jurisdiction.findUnique({
      where: { id: jurisdictionId },
    });

    if (!jurisdiction) {
      console.error(`❌ Jurisdiction not found: ${jurisdictionId}`);
      console.error('   Run: npx tsx scripts/list-jurisdictions.ts');
      process.exit(1);
    }

    console.log(`✓ Jurisdiction found: ${jurisdiction.name}, ${jurisdiction.state}\n`);

    // Read CSV file
    if (!fs.existsSync(csvPath)) {
      console.error(`❌ File not found: ${csvPath}`);
      process.exit(1);
    }

    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const records = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`📊 Found ${records.length} permit requirements in CSV\n`);

    // Process records
    let created = 0;
    let errors = 0;

    for (const record of records) {
      try {
        // Parse JSON fields
        let requirements = null;
        if (record.requirements) {
          try {
            requirements = JSON.parse(record.requirements);
          } catch {
            console.warn(`⚠ Invalid JSON in requirements for ${record.activityType}`);
          }
        }

        // Parse documents array
        let documents: string[] = [];
        if (record.documents) {
          documents = record.documents.split(',').map((d: string) => d.trim());
        }

        await prisma.permitRequirement.create({
          data: {
            jurisdictionId,
            activityType: record.activityType || '',
            activityDescription: record.activityDescription || null,
            zoneCode: record.zoneCode || null,
            requiresPermit: record.requiresPermit === 'true' || record.requiresPermit === '1',
            permitType: record.permitType || null,
            requirements,
            estimatedFee: record.estimatedFee ? parseFloat(record.estimatedFee) : null,
            processingDays: record.processingDays ? parseInt(record.processingDays) : null,
            documents,
            sourceUrl: record.sourceUrl || null,
            ordinanceRef: record.ordinanceRef || null,
          },
        });

        created++;
        process.stdout.write(`\r   Progress: ${created}/${records.length}`);
      } catch (error: any) {
        errors++;
        console.error(`\n   ⚠ Error creating permit requirement:`, error.message);
      }
    }

    console.log('\n\n✅ Permit requirements loading complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   Total records: ${records.length}`);
    console.log(`   Successfully created: ${created}`);
    console.log(`   Errors: ${errors}`);

    // Show sample data
    const samplePermits = await prisma.permitRequirement.findMany({
      where: { jurisdictionId },
      take: 5,
    });

    console.log('\n📋 Sample permit requirements loaded:');
    for (const permit of samplePermits) {
      const permitStatus = permit.requiresPermit ? '✓ Permit required' : '✗ No permit';
      console.log(`   • ${permit.activityType}: ${permitStatus} (${permit.permitType || 'N/A'})`);
      if (permit.estimatedFee) {
        console.log(`     Fee: $${permit.estimatedFee} | Processing: ${permit.processingDays || '?'} days`);
      }
    }

    // Show activity type distribution
    const activityTypes = await prisma.$queryRaw<Array<{ activityType: string; count: bigint }>>`
      SELECT "activityType", COUNT(*) as count
      FROM "PermitRequirement"
      WHERE "jurisdictionId" = ${jurisdictionId}
      GROUP BY "activityType"
      ORDER BY count DESC
    `;

    console.log('\n📈 Activity types loaded:');
    for (const activity of activityTypes) {
      console.log(`   ${activity.activityType}: ${activity.count} requirement(s)`);
    }

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// CLI interface
const csvPath = process.argv[2];
const jurisdictionId = process.argv[3] || 'cincinnati-oh';

if (!csvPath) {
  console.log(`
📦 Civix Permit Requirements Loader

Usage:
  npx tsx scripts/load-permit-requirements.ts <csv-file> [jurisdiction-id]

CSV Format:
  activityType,activityDescription,zoneCode,requiresPermit,permitType,requirements,estimatedFee,processingDays,documents,sourceUrl,ordinanceRef

Required Columns:
  - activityType: e.g., "fence", "shed", "deck", "addition"
  - requiresPermit: "true" or "false"

Optional Columns:
  - activityDescription: More detailed description
  - zoneCode: Specific zone (leave empty for all zones)
  - permitType: "Building Permit", "Zoning Certificate", etc.
  - requirements: JSON string with rules: {"maxHeight": 6, "setback": 3}
  - estimatedFee: Cost in dollars
  - processingDays: Processing time (can be range like "5-10")
  - documents: Comma-separated list: "Site plan,Property survey"
  - sourceUrl: Link to source
  - ordinanceRef: Ordinance section reference

Example CSV:
  activityType,requiresPermit,permitType,estimatedFee,processingDays,documents
  fence,true,Zoning Certificate,50,5-10,"Site plan,Property survey"
  shed,true,Building Permit,100,10-15,"Site plan,Foundation details"
  deck,true,Building Permit,125,10-15,"Structural drawings,Site plan"

Example:
  npx tsx scripts/load-permit-requirements.ts ./cincinnati-permits.csv cincinnati-oh
`);
  process.exit(0);
}

loadPermitRequirements(csvPath, jurisdictionId);
