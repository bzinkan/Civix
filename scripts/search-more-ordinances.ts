import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function search(query: string) {
  console.log(`\n=== Searching for: "${query}" ===\n`);

  const results = await prisma.ordinanceChunk.findMany({
    where: {
      OR: [
        { content: { contains: query, mode: 'insensitive' } },
        { title: { contains: query, mode: 'insensitive' } }
      ]
    },
    take: 3,
    select: { chapter: true, section: true, title: true, content: true }
  });

  console.log(`Found ${results.length} results`);
  for (const r of results) {
    const lowerContent = r.content.toLowerCase();
    const idx = lowerContent.indexOf(query.toLowerCase());
    if (idx >= 0) {
      const start = Math.max(0, idx - 50);
      const end = Math.min(r.content.length, idx + 300);
      console.log(`Ch ${r.chapter}: ...${r.content.substring(start, end)}...`);
    }
  }
}

async function main() {
  await search('sidewalk');
  await search('trash');
  await search('garbage');
  await search('sign');
  await search('tree');
  await search('decibel');
  await search('quiet');
  await search('permit');
  await search('violation');
  await search('fine');

  await prisma.$disconnect();
}

main();
