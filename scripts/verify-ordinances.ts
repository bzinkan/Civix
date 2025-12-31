/**
 * Verify Ordinances in Database
 *
 * Quick script to check if ordinances were loaded successfully into RDS
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyOrdinances() {
  console.log('\n🔍 Verifying Cincinnati ordinances in database...\n');

  try {
    // Check jurisdiction
    const jurisdiction = await prisma.jurisdiction.findFirst({
      where: {
        name: 'Cincinnati',
        state: 'OH',
      },
    });

    if (!jurisdiction) {
      console.log('❌ Cincinnati jurisdiction not found');
      return;
    }

    console.log(`✅ Jurisdiction: ${jurisdiction.name}, ${jurisdiction.state}`);
    console.log(`   ID: ${jurisdiction.id}\n`);

    // Check ordinance documents
    const documents = await prisma.ordinanceDocument.findMany({
      where: {
        jurisdictionId: jurisdiction.id,
      },
    });

    console.log(`📄 Documents: ${documents.length}`);
    for (const doc of documents) {
      console.log(`   - ${doc.title}`);
      console.log(`     ID: ${doc.id}`);
      console.log(`     Active: ${doc.isActive}`);
    }
    console.log('');

    // Check ordinance chunks
    const chunkCount = await prisma.ordinanceChunk.count({
      where: {
        jurisdictionId: jurisdiction.id,
      },
    });

    console.log(`📦 Total Chunks: ${chunkCount}`);

    // Check chunks with embeddings
    const chunksWithEmbeddings = await prisma.ordinanceChunk.count({
      where: {
        jurisdictionId: jurisdiction.id,
        embedding: { not: null },
      },
    });

    console.log(`🧮 Chunks with Embeddings: ${chunksWithEmbeddings}`);

    // Get sample chunks
    const sampleChunks = await prisma.ordinanceChunk.findMany({
      where: {
        jurisdictionId: jurisdiction.id,
      },
      take: 3,
      orderBy: {
        chunkIndex: 'asc',
      },
    });

    console.log('\n📋 Sample Chunks:');
    for (const chunk of sampleChunks) {
      console.log(`\n   Chunk #${chunk.chunkIndex}:`);
      console.log(`   Chapter: ${chunk.chapter}`);
      console.log(`   Section: ${chunk.section || 'N/A'}`);
      console.log(`   Title: ${chunk.title}`);
      console.log(`   Token Count: ${chunk.tokenCount}`);
      console.log(`   Has Embedding: ${chunk.embedding ? 'Yes' : 'No'}`);
      console.log(`   Content Preview: ${chunk.content.substring(0, 150)}...`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Jurisdiction: ${jurisdiction.name}, ${jurisdiction.state}`);
    console.log(`✅ Documents: ${documents.length}`);
    console.log(`✅ Total Chunks: ${chunkCount}`);
    console.log(`✅ Chunks with Embeddings: ${chunksWithEmbeddings} (${((chunksWithEmbeddings / chunkCount) * 100).toFixed(1)}%)`);

    if (chunkCount === chunksWithEmbeddings && chunkCount > 0) {
      console.log('\n🎉 SUCCESS! All ordinances loaded successfully with embeddings!');
    } else if (chunkCount > 0 && chunksWithEmbeddings === 0) {
      console.log('\n⚠️  WARNING: Chunks exist but no embeddings found!');
    } else if (chunksWithEmbeddings < chunkCount) {
      console.log(`\n⚠️  WARNING: Only ${chunksWithEmbeddings}/${chunkCount} chunks have embeddings!`);
    } else {
      console.log('\n❌ No data found in database!');
    }
    console.log('');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyOrdinances();
