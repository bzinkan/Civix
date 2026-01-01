import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as csv from 'csv-parse/sync';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

/**
 * Load zoning data from CSV file
 *
 * Usage:
 *   npx tsx scripts/load-zoning-data.ts <csv-file-path> <jurisdiction-id>
 *
 * CSV Format Expected:
 *   address,parcelId,zoneCode,zoneDescription,latitude,longitude
 *   "123 Main St",ABC123,R-1,"Single Family Residential",39.1031,-84.5120
 *
 * Example:
 *   npx tsx scripts/load-zoning-data.ts ./cincinnati-parcels.csv cincinnati-oh
 */
async function loadZoningData(csvPath: string, jurisdictionId: string) {
  console.log(`📦 Loading zoning data from: ${csvPath}`);
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

    console.log(`📊 Found ${records.length} parcels in CSV\n`);

    // Process in batches
    const batchSize = 100;
    let processed = 0;
    let created = 0;
    let errors = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      const operations = batch.map((record: any) => {
        return prisma.zoningParcel.create({
          data: {
            jurisdictionId,
            address: record.address || '',
            parcelId: record.parcelId || null,
            zoneCode: record.zoneCode || '',
            zoneDescription: record.zoneDescription || null,
            latitude: record.latitude ? parseFloat(record.latitude) : null,
            longitude: record.longitude ? parseFloat(record.longitude) : null,
            geometry: record.geometry ? JSON.parse(record.geometry) : null,
            sourceUrl: record.sourceUrl || null,
          },
        });
      });

      try {
        await Promise.all(operations);
        created += batch.length;
        processed += batch.length;

        // Progress indicator
        const percent = ((processed / records.length) * 100).toFixed(1);
        process.stdout.write(`\r   Progress: ${processed}/${records.length} (${percent}%) - ${created} created`);
      } catch (error: any) {
        errors += batch.length;
        processed += batch.length;
        console.error(`\n   ⚠ Error in batch ${i / batchSize + 1}:`, error.message);
      }
    }

    console.log('\n\n✅ Zoning data loading complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   Total records: ${records.length}`);
    console.log(`   Successfully created: ${created}`);
    console.log(`   Errors: ${errors}`);

    // Show sample data
    const sampleParcels = await prisma.zoningParcel.findMany({
      where: { jurisdictionId },
      take: 3,
    });

    console.log('\n📋 Sample parcels loaded:');
    for (const parcel of sampleParcels) {
      console.log(`   • ${parcel.address} → ${parcel.zoneCode} (${parcel.zoneDescription || 'N/A'})`);
    }

    // Show zone code distribution
    const zoneCodes = await prisma.$queryRaw<Array<{ zoneCode: string; count: bigint }>>`
      SELECT "zoneCode", COUNT(*) as count
      FROM "ZoningParcel"
      WHERE "jurisdictionId" = ${jurisdictionId}
      GROUP BY "zoneCode"
      ORDER BY count DESC
      LIMIT 10
    `;

    console.log('\n📈 Top zone codes:');
    for (const zone of zoneCodes) {
      console.log(`   ${zone.zoneCode}: ${zone.count} parcels`);
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
📦 Civix Zoning Data Loader

Usage:
  npx tsx scripts/load-zoning-data.ts <csv-file> [jurisdiction-id]

CSV Format:
  address,parcelId,zoneCode,zoneDescription,latitude,longitude
  "123 Main St",ABC123,R-1,"Single Family Residential",39.1031,-84.5120

Required Columns:
  - address: Street address
  - zoneCode: Zoning code (e.g., R-1, C-2)

Optional Columns:
  - parcelId: City's parcel ID
  - zoneDescription: Zone description
  - latitude: Latitude coordinate
  - longitude: Longitude coordinate
  - geometry: GeoJSON polygon (as JSON string)
  - sourceUrl: Link to source

Example:
  npx tsx scripts/load-zoning-data.ts ./cincinnati-parcels.csv cincinnati-oh
`);
  process.exit(0);
}

loadZoningData(csvPath, jurisdictionId);
