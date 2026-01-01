import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function listJurisdictions() {
  const jurisdictions = await prisma.jurisdiction.findMany({
    orderBy: { name: 'asc' }
  });

  console.log('\n📍 Jurisdictions in database:\n');

  if (jurisdictions.length === 0) {
    console.log('   No jurisdictions found.\n');
    console.log('   Run scripts to create Cincinnati jurisdiction first.');
  } else {
    for (const j of jurisdictions) {
      console.log(`   • ${j.id}`);
      console.log(`     Name: ${j.name}, ${j.state}`);
      console.log(`     Type: ${j.type}`);
      console.log('');
    }
    console.log(`   Total: ${jurisdictions.length} jurisdiction(s)\n`);
  }

  await prisma.$disconnect();
}

listJurisdictions();
