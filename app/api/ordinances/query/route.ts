import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateQueryEmbedding, cosineSimilarity } from '@/lib/ordinances/embeddings';
import { callAI } from '@/lib/ai/providers';

const prisma = new PrismaClient();

/**
 * Ordinance Query API
 *
 * Answers questions about ordinances using RAG (Retrieval Augmented Generation):
 * 1. Takes a question + jurisdiction
 * 2. Finds relevant ordinance chunks via semantic search
 * 3. Uses AI to synthesize an answer with citations
 *
 * Body:
 * - question: The user's question
 * - jurisdictionId: The jurisdiction ID to search in
 * - topK: Number of chunks to retrieve (default: 5)
 */

export async function POST(request: NextRequest) {
  try {
    const { question, jurisdictionId, topK = 5 } = await request.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    if (!jurisdictionId || typeof jurisdictionId !== 'string') {
      return NextResponse.json(
        { error: 'Jurisdiction ID is required' },
        { status: 400 }
      );
    }

    // Verify jurisdiction exists and has ordinances
    const jurisdiction = await prisma.jurisdiction.findUnique({
      where: { id: jurisdictionId },
      include: {
        _count: {
          select: { ordinanceChunks: true },
        },
      },
    });

    if (!jurisdiction) {
      return NextResponse.json(
        { error: 'Jurisdiction not found' },
        { status: 404 }
      );
    }

    if (jurisdiction._count.ordinanceChunks === 0) {
      return NextResponse.json({
        answer: `I don't have ordinance data for ${jurisdiction.name}, ${jurisdiction.state} yet. We're working on adding more cities!`,
        sources: [],
        jurisdiction: {
          name: jurisdiction.name,
          state: jurisdiction.state,
        },
      });
    }

    // Step 1: Generate embedding for the question
    console.log(`Generating embedding for question: "${question}"`);
    const queryEmbedding = await generateQueryEmbedding(question);

    // Step 2: Fetch all chunks for this jurisdiction
    const allChunks = await prisma.ordinanceChunk.findMany({
      where: {
        jurisdictionId,
      },
      select: {
        id: true,
        chapter: true,
        section: true,
        title: true,
        content: true,
        embedding: true,
        sourceUrl: true,
      },
    });

    // Filter to only chunks with embeddings
    const chunks = allChunks.filter(chunk => chunk.embedding !== null);

    if (chunks.length === 0) {
      return NextResponse.json({
        answer: `No ordinance data found for ${jurisdiction.name}, ${jurisdiction.state}.`,
        sources: [],
        jurisdiction: {
          name: jurisdiction.name,
          state: jurisdiction.state,
        },
      });
    }

    // Step 3: Calculate similarity scores
    const scoredChunks = chunks.map(chunk => ({
      ...chunk,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding as number[]),
    }));

    // Step 4: Get top K most relevant chunks
    const topChunks = scoredChunks
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    // Step 5: Build context for AI
    const context = topChunks.map(chunk => ({
      citation: `${jurisdiction.name} Code §${chunk.chapter}${chunk.section ? `-${chunk.section}` : ''}`,
      title: chunk.title,
      content: chunk.content,
      url: chunk.sourceUrl,
    }));

    // Step 6: Call AI to synthesize answer
    const systemPrompt = `You are a helpful assistant that answers questions about local ordinances and regulations.

CRITICAL RULES:
- Only use information from the provided ordinance sections
- Always cite specific sections using the format: [City Code §123-45]
- If the answer isn't in the provided context, say "I don't have enough information about that in the ${jurisdiction.name} ordinances"
- Never make up or hallucinate information
- Be clear, concise, and cite your sources
- If there are conditions or exceptions, mention them clearly

Format your answer in a friendly but professional tone.`;

    const userPrompt = `Question: ${question}

Location: ${jurisdiction.name}, ${jurisdiction.state}

Relevant Ordinance Sections:

${context.map((c, i) => `
[${i + 1}] ${c.citation} - ${c.title}
${c.content}
`).join('\n---\n')}

Answer the question based ONLY on the ordinance sections above. Include specific citations in your answer.`;

    const aiResponse = await callAI(
      [{ role: 'user', content: userPrompt }],
      {
        systemPrompt,
        temperature: 0.1, // Low temperature for deterministic answers
        maxTokens: 2000,
      }
    );

    // Step 7: Format response
    return NextResponse.json({
      answer: aiResponse.content,
      sources: topChunks.map(chunk => ({
        citation: `${jurisdiction.name} Code §${chunk.chapter}${chunk.section ? `-${chunk.section}` : ''}`,
        title: chunk.title,
        chapter: chunk.chapter,
        section: chunk.section,
        similarity: Math.round(chunk.similarity * 100),
        url: chunk.sourceUrl,
      })),
      jurisdiction: {
        id: jurisdiction.id,
        name: jurisdiction.name,
        state: jurisdiction.state,
      },
      metadata: {
        question,
        chunksSearched: chunks.length,
        topChunksUsed: topK,
        provider: aiResponse.provider,
        tokensUsed: aiResponse.tokensUsed,
      },
    });

  } catch (error: any) {
    console.error('Ordinance query error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process query' },
      { status: 500 }
    );
  }
}
