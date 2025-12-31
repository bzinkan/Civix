/**
 * Test Ordinance Query System
 *
 * Interactive script to test RAG pipeline:
 * 1. User asks a question
 * 2. Generate embedding for question
 * 3. Find similar chunks via cosine similarity
 * 4. Return relevant ordinance sections with citations
 */

import { PrismaClient } from '@prisma/client';
import { generateQueryEmbedding, cosineSimilarity } from '../lib/ordinances/embeddings';
import { callAI } from '../lib/ai/providers';

const prisma = new PrismaClient();

async function queryOrdinances(question: string, jurisdictionId: string) {
  console.log(`\n📝 Question: "${question}"\n`);

  // Step 1: Generate embedding for the question
  console.log('🧮 Generating query embedding...');
  const queryEmbedding = await generateQueryEmbedding(question);
  console.log(`✅ Embedding generated (${queryEmbedding.length} dimensions)\n`);

  // Step 2: Fetch all chunks for this jurisdiction
  console.log('🔍 Searching ordinances...');
  const chunks = await prisma.ordinanceChunk.findMany({
    where: {
      jurisdictionId,
      embedding: { not: null },
    },
    select: {
      id: true,
      chapter: true,
      section: true,
      title: true,
      content: true,
      embedding: true,
    },
  });

  console.log(`   Found ${chunks.length} chunks to search\n`);

  // Step 3: Calculate similarity scores
  const scoredChunks = chunks.map(chunk => ({
    ...chunk,
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding as number[]),
  }));

  // Step 4: Get top 5 most relevant chunks
  const topChunks = scoredChunks
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);

  console.log('📊 Top 5 Most Relevant Sections:\n');
  topChunks.forEach((chunk, i) => {
    console.log(`${i + 1}. [Similarity: ${(chunk.similarity * 100).toFixed(1)}%]`);
    console.log(`   Chapter ${chunk.chapter}, Section ${chunk.section || 'N/A'}`);
    console.log(`   ${chunk.title}`);
    console.log(`   Preview: ${chunk.content.substring(0, 200)}...\n`);
  });

  // Step 5: Build context for AI
  const context = topChunks.map(chunk => ({
    citation: `Chapter ${chunk.chapter}, Section ${chunk.section || 'N/A'}`,
    title: chunk.title,
    content: chunk.content,
  }));

  // Step 6: Call AI to synthesize answer
  console.log('🤖 Generating AI response...\n');

  const systemPrompt = `You are a helpful assistant that answers questions about Cincinnati ordinances.

CRITICAL RULES:
- Only use information from the provided ordinance sections
- Always cite specific sections (Chapter and Section numbers)
- If the answer isn't in the provided context, say "I don't have enough information about that in the Cincinnati ordinances"
- Never make up or hallucinate information
- Format citations clearly like: [Cincinnati Code §123-45]

Be clear, concise, and cite your sources.`;

  const userPrompt = `Question: ${question}

Relevant Ordinance Sections:

${context.map((c, i) => `
[${i + 1}] ${c.citation} - ${c.title}
${c.content}
`).join('\n---\n')}

Answer the question based ONLY on the ordinance sections above. Include specific citations.`;

  try {
    const response = await callAI(
      [{ role: 'user', content: userPrompt }],
      {
        systemPrompt,
        temperature: 0.1, // Low temperature for deterministic answers
        maxTokens: 2000,
        provider: 'anthropic', // Use Anthropic since Gemini quota is exceeded
      }
    );

    console.log('═'.repeat(60));
    console.log('📋 ANSWER');
    console.log('═'.repeat(60));
    console.log(response.content);
    console.log('═'.repeat(60));
    console.log('\n📚 Sources Used:');
    topChunks.forEach((chunk, i) => {
      console.log(`  ${i + 1}. Chapter ${chunk.chapter}, Section ${chunk.section || 'N/A'}`);
      console.log(`     ${chunk.title}`);
    });
    console.log('');

  } catch (error: any) {
    console.error('❌ Error generating AI response:', error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: npx tsx scripts/test-ordinance-query.ts "<question>"');
    console.error('\nExample:');
    console.error('  npx tsx scripts/test-ordinance-query.ts "Can I raise chickens in Cincinnati?"');
    console.error('  npx tsx scripts/test-ordinance-query.ts "Are pitbulls allowed in Cincinnati?"');
    console.error('  npx tsx scripts/test-ordinance-query.ts "What are the fence height requirements?"');
    process.exit(1);
  }

  const question = args.join(' ');

  try {
    // Find Cincinnati jurisdiction
    const jurisdiction = await prisma.jurisdiction.findFirst({
      where: {
        name: 'Cincinnati',
        state: 'OH',
      },
    });

    if (!jurisdiction) {
      console.error('❌ Cincinnati jurisdiction not found in database');
      process.exit(1);
    }

    await queryOrdinances(question, jurisdiction.id);

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
