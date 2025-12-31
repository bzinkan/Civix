/**
 * Semantic Search for Ordinances
 *
 * Search ordinance chunks using vector similarity to find relevant sections
 * for answering user questions.
 */

import { PrismaClient } from '@prisma/client';
import { generateQueryEmbedding, cosineSimilarity } from './embeddings';

const prisma = new PrismaClient();

export interface SearchResult {
  id: string;
  chapter: string;
  section: string | null;
  title: string;
  content: string;
  similarity: number;
  jurisdiction: {
    id: string;
    name: string;
    state: string;
  };
}

export interface SearchOptions {
  jurisdictionId?: string;
  jurisdictionSlug?: string; // e.g., "cincinnati-oh"
  chapter?: string;
  minSimilarity?: number; // Minimum similarity threshold (0-1)
  limit?: number;         // Max results to return
}

/**
 * Search ordinance chunks by semantic similarity to a query
 *
 * @param query - User's natural language question
 * @param options - Search filters and options
 * @returns Array of relevant ordinance chunks with similarity scores
 */
export async function searchOrdinances(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const {
    jurisdictionId,
    jurisdictionSlug,
    chapter,
    minSimilarity = 0.5,
    limit = 10,
  } = options;

  console.log(`🔍 Searching for: "${query}"`);

  // Step 1: Generate query embedding
  const queryEmbedding = await generateQueryEmbedding(query);
  console.log(`   Generated query embedding (${queryEmbedding.length} dimensions)`);

  // Step 2: Build WHERE clause for jurisdiction/chapter filtering
  const where: any = {};

  if (jurisdictionId) {
    where.jurisdictionId = jurisdictionId;
  } else if (jurisdictionSlug) {
    const [cityName, state] = jurisdictionSlug.split('-');
    const jurisdiction = await prisma.jurisdiction.findFirst({
      where: {
        name: cityName.charAt(0).toUpperCase() + cityName.slice(1),
        state: state?.toUpperCase() || 'OH',
      },
    });

    if (!jurisdiction) {
      throw new Error(`Jurisdiction not found: ${jurisdictionSlug}`);
    }

    where.jurisdictionId = jurisdiction.id;
  }

  if (chapter) {
    where.chapter = chapter;
  }

  // Step 3: Fetch all chunks (with filters)
  const chunks = await prisma.ordinanceChunk.findMany({
    where,
    include: {
      jurisdiction: true,
    },
  });

  console.log(`   Found ${chunks.length} chunks to search`);

  // Step 4: Calculate similarity for each chunk
  const results: SearchResult[] = chunks
    .map(chunk => {
      // Parse embedding from JSON
      const embedding = chunk.embedding as any as number[];

      if (!embedding || !Array.isArray(embedding)) {
        console.warn(`Chunk ${chunk.id} has invalid embedding`);
        return null;
      }

      const similarity = cosineSimilarity(queryEmbedding, embedding);

      return {
        id: chunk.id,
        chapter: chunk.chapter,
        section: chunk.section,
        title: chunk.title,
        content: chunk.content,
        similarity,
        jurisdiction: {
          id: chunk.jurisdiction.id,
          name: chunk.jurisdiction.name,
          state: chunk.jurisdiction.state,
        },
      };
    })
    .filter((result): result is SearchResult => result !== null);

  // Step 5: Filter by similarity threshold and sort
  const filteredResults = results
    .filter(r => r.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  console.log(`   Returning ${filteredResults.length} results (similarity >= ${minSimilarity})\n`);

  return filteredResults;
}

/**
 * Search ordinances and format results for RAG (Retrieval Augmented Generation)
 *
 * Returns a context string that can be passed to an LLM.
 */
export async function searchForRAG(
  query: string,
  options: SearchOptions = {}
): Promise<{ context: string; results: SearchResult[] }> {
  const results = await searchOrdinances(query, {
    ...options,
    limit: options.limit || 5, // Use fewer chunks for RAG to avoid context overflow
  });

  if (results.length === 0) {
    return {
      context: 'No relevant ordinance sections found.',
      results: [],
    };
  }

  // Format results as context for LLM
  const context = results
    .map((result, index) => {
      const header = result.section
        ? `[${index + 1}] Section ${result.section}: ${result.title}`
        : `[${index + 1}] Chapter ${result.chapter}: ${result.title}`;

      return `${header}\n${result.content}\n\n---\n`;
    })
    .join('\n');

  return { context, results };
}

/**
 * Get statistics about ordinance coverage
 */
export async function getOrdinanceStats(jurisdictionId?: string) {
  const where = jurisdictionId ? { jurisdictionId } : {};

  const stats = await prisma.ordinanceChunk.groupBy({
    by: ['jurisdictionId', 'chapter'],
    where,
    _count: {
      id: true,
    },
  });

  const jurisdictions = await prisma.jurisdiction.findMany({
    where: jurisdictionId ? { id: jurisdictionId } : {},
    include: {
      ordinanceDocuments: true,
    },
  });

  return {
    totalChunks: stats.reduce((sum, s) => sum + s._count.id, 0),
    chaptersCovered: stats.length,
    jurisdictions: jurisdictions.map(j => ({
      id: j.id,
      name: j.name,
      state: j.state,
      documents: j.ordinanceDocuments.length,
    })),
  };
}
