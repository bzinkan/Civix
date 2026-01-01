import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function search(query: string) {
  console.log(`\n========================================`);
  console.log(`Searching for: "${query}"`);
  console.log(`========================================\n`);

  const results = await prisma.ordinanceChunk.findMany({
    where: {
      OR: [
        { content: { contains: query, mode: 'insensitive' } },
        { title: { contains: query, mode: 'insensitive' } }
      ]
    },
    take: 5,
    select: {
      chapter: true,
      section: true,
      title: true,
      content: true
    }
  });

  console.log(`Found ${results.length} results:\n`);

  for (const r of results) {
    console.log(`Chapter ${r.chapter}, Section ${r.section || 'N/A'}`);
    console.log(`Title: ${r.title.substring(0, 100)}`);

    // Find the relevant portion of content
    const lowerContent = r.content.toLowerCase();
    const queryLower = query.toLowerCase();
    const idx = lowerContent.indexOf(queryLower);
    if (idx >= 0) {
      const start = Math.max(0, idx - 100);
      const end = Math.min(r.content.length, idx + query.length + 200);
      console.log(`...${r.content.substring(start, end)}...`);
    } else {
      console.log(`Content: ${r.content.substring(0, 300)}...`);
    }
    console.log('---\n');
  }
}

async function main() {
  // Search for key topics
  await search('noise');
  await search('snow removal');
  await search('rental registration');
  await search('short-term rental');
  await search('fence');
  await search('business license');
  await search('parking');
  await search('quiet hours');

  await prisma.$disconnect();
}

main();
