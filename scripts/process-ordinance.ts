/**
 * Ordinance Processing Script
 *
 * Takes an ordinance PDF/text file and processes it into the database:
 * 1. Read text from file
 * 2. Chunk into semantic sections
 * 3. Generate embeddings
 * 4. Store in database
 *
 * Usage:
 *   npx tsx scripts/process-ordinance.ts <jurisdiction> <file-path>
 *
 * Example:
 *   npx tsx scripts/process-ordinance.ts cincinnati public/ordinances/cincinnati/full-ordinances.txt
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { chunkOrdinance, chunkOrdinanceDocument } from '../lib/ordinances/chunker';
import { generateEmbeddingsBatch } from '../lib/ordinances/embeddings';

const prisma = new PrismaClient();

interface ProcessOptions {
  jurisdictionSlug: string; // e.g., "cincinnati-oh"
  filePath: string;
  title?: string;
  sourceUrl?: string;
}

async function processOrdinanceFile(options: ProcessOptions) {
  const { jurisdictionSlug, filePath, title, sourceUrl } = options;

  console.log(`\n🔄 Processing ordinance for ${jurisdictionSlug}...`);
  console.log(`📄 File: ${filePath}\n`);

  // Step 1: Find or create jurisdiction
  const [cityName, state] = jurisdictionSlug.split('-');
  let jurisdiction = await prisma.jurisdiction.findFirst({
    where: {
      name: cityName.charAt(0).toUpperCase() + cityName.slice(1),
      state: state?.toUpperCase() || 'OH',
    },
  });

  if (!jurisdiction) {
    console.log(`Creating new jurisdiction: ${cityName}, ${state}`);
    jurisdiction = await prisma.jurisdiction.create({
      data: {
        name: cityName.charAt(0).toUpperCase() + cityName.slice(1),
        state: state?.toUpperCase() || 'OH',
        type: 'city',
      },
    });
  }

  console.log(`✅ Jurisdiction: ${jurisdiction.name}, ${jurisdiction.state} (${jurisdiction.id})\n`);

  // Step 2: Read ordinance text
  const fullText = fs.readFileSync(filePath, 'utf-8');
  console.log(`📖 Read ${fullText.length} characters\n`);

  // Step 3: Check if this is a markdown file with extracted chapters
  let chunks;
  const isMarkdown = filePath.endsWith('.md');

  if (isMarkdown) {
    // Single chapter extract
    console.log('Processing single chapter markdown file...');
    chunks = chunkOrdinance(fullText, {
      maxTokens: 512,
      overlapTokens: 50,
      preserveSections: true,
    });
  } else {
    // Full ordinance text - try to extract chapters
    console.log('Processing full ordinance text...');
    // For now, treat as single document
    // TODO: Implement chapter extraction for full ordinances
    chunks = chunkOrdinance(fullText, {
      maxTokens: 512,
      overlapTokens: 50,
      preserveSections: true,
    });
  }

  console.log(`✂️  Created ${chunks.length} chunks\n`);

  // Step 4: Generate embeddings
  console.log('🧮 Generating embeddings...');
  const chunkTexts = chunks.map(c => c.content);

  const embeddings = await generateEmbeddingsBatch(chunkTexts, {
    batchSize: 100,
    onProgress: (current, total) => {
      process.stdout.write(`\r   Progress: ${current}/${total} embeddings generated`);
    },
  });

  console.log('\n✅ Embeddings generated\n');

  // Step 5: Create OrdinanceDocument record
  const documentTitle = title || `${jurisdiction.name} Code of Ordinances`;

  let document = await prisma.ordinanceDocument.findFirst({
    where: {
      jurisdictionId: jurisdiction.id,
      title: documentTitle,
    },
  });

  if (!document) {
    document = await prisma.ordinanceDocument.create({
      data: {
        jurisdictionId: jurisdiction.id,
        title: documentTitle,
        s3TextUrl: filePath, // For now, store local path
        sourceUrl,
        isActive: true,
      },
    });
  }

  console.log(`✅ Document: ${document.title} (${document.id})\n`);

  // Step 6: Store chunks in database
  console.log('💾 Storing chunks in database...');

  // Delete existing chunks for this document
  await prisma.ordinanceChunk.deleteMany({
    where: { documentId: document.id },
  });

  // Create new chunks
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = embeddings[i];

    await prisma.ordinanceChunk.create({
      data: {
        documentId: document.id,
        jurisdictionId: jurisdiction.id,
        chapter: chunk.chapter,
        section: chunk.section,
        title: chunk.title,
        content: chunk.content,
        embedding: embedding.embedding, // Store as JSON array
        chunkIndex: chunk.chunkIndex,
        tokenCount: chunk.tokenCount,
        lastVerified: new Date(),
      },
    });

    process.stdout.write(`\r   Stored ${i + 1}/${chunks.length} chunks`);
  }

  console.log('\n\n✅ Processing complete!\n');
  console.log(`📊 Summary:`);
  console.log(`   - Jurisdiction: ${jurisdiction.name}, ${jurisdiction.state}`);
  console.log(`   - Document: ${document.title}`);
  console.log(`   - Chunks created: ${chunks.length}`);
  console.log(`   - Total tokens: ${chunks.reduce((sum, c) => sum + c.tokenCount, 0)}`);
  console.log(`   - Database ID: ${document.id}\n`);
}

// CLI Entry Point
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: npx tsx scripts/process-ordinance.ts <jurisdiction-slug> <file-path> [title] [source-url]');
    console.error('\nExample:');
    console.error('  npx tsx scripts/process-ordinance.ts cincinnati-oh public/ordinances/cincinnati/chapter-856-extract.md "Chapter 856: Short Term Rentals"');
    process.exit(1);
  }

  const [jurisdictionSlug, filePath, title, sourceUrl] = args;

  // Verify file exists
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  try {
    await processOrdinanceFile({
      jurisdictionSlug,
      filePath,
      title,
      sourceUrl,
    });
  } catch (error: any) {
    console.error('\n❌ Error processing ordinance:');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
