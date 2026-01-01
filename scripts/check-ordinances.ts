import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function main() {
  console.log('Checking existing ordinance data...\n');

  // Count total chunks
  const count = await prisma.ordinanceChunk.count();
  console.log(`Total ordinance chunks: ${count}`);

  // Get chapter breakdown
  const chapters = await prisma.ordinanceChunk.groupBy({
    by: ['chapter'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });

  console.log('\nChapters loaded:');
  for (const ch of chapters.slice(0, 30)) {
    console.log(`  ${ch.chapter}: ${ch._count.id} chunks`);
  }

  // Sample some chunks
  console.log('\nSample chunks:');
  const samples = await prisma.ordinanceChunk.findMany({
    take: 5,
    select: { chapter: true, section: true, title: true, content: true }
  });

  for (const s of samples) {
    console.log(`\n  Chapter ${s.chapter}, Section ${s.section || 'N/A'}`);
    console.log(`  Title: ${s.title}`);
    console.log(`  Content preview: ${s.content.substring(0, 200)}...`);
  }

  await prisma.$disconnect();
}

main();
