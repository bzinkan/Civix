/**
 * Embedding Generator using Gemini API
 *
 * Generates vector embeddings for ordinance chunks to enable semantic search.
 * Uses Google's Gemini embedding model (FREE, 1500 requests/day).
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface EmbeddingResult {
  embedding: number[];
  tokenCount: number;
}

/**
 * Generate embedding for a single text chunk
 *
 * @param text - The text to embed
 * @param taskType - Task type for embedding model (default: 'RETRIEVAL_DOCUMENT')
 * @returns Vector embedding (768 dimensions for text-embedding-004)
 */
export async function generateEmbedding(
  text: string,
  taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY' | 'SEMANTIC_SIMILARITY' = 'RETRIEVAL_DOCUMENT'
): Promise<EmbeddingResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

    // embedContent accepts just the text string directly
    const result = await model.embedContent(text);

    return {
      embedding: result.embedding.values,
      tokenCount: result.embedding.values.length,
    };
  } catch (error: any) {
    console.error('Embedding generation failed:', error.message);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Generate embeddings for multiple chunks in batch
 *
 * @param texts - Array of text chunks to embed
 * @param batchSize - Number of embeddings to generate per batch (default: 100)
 * @param onProgress - Callback for progress updates
 * @returns Array of embeddings
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  options: {
    batchSize?: number;
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<EmbeddingResult[]> {
  const { batchSize = 100, onProgress } = options;
  const results: EmbeddingResult[] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    // Generate embeddings for this batch (sequential to avoid rate limits)
    for (const text of batch) {
      const embedding = await generateEmbedding(text);
      results.push(embedding);

      if (onProgress) {
        onProgress(results.length, texts.length);
      }

      // Rate limiting: wait 100ms between requests (max 10 req/sec)
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Calculate cosine similarity between two embeddings
 *
 * @param a - First embedding vector
 * @param b - Second embedding vector
 * @returns Cosine similarity score (-1 to 1, higher = more similar)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Find top N most similar chunks to a query
 *
 * @param queryEmbedding - Embedding vector of the query
 * @param chunkEmbeddings - Array of chunk embeddings with metadata
 * @param topN - Number of top results to return (default: 10)
 * @returns Array of chunks sorted by similarity (highest first)
 */
export function findSimilarChunks<T extends { embedding: number[] }>(
  queryEmbedding: number[],
  chunkEmbeddings: T[],
  topN: number = 10
): Array<T & { similarity: number }> {
  const withScores = chunkEmbeddings.map(chunk => ({
    ...chunk,
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  // Sort by similarity (descending) and take top N
  return withScores
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topN);
}

/**
 * Generate query embedding for semantic search
 *
 * Uses RETRIEVAL_QUERY task type which is optimized for search queries.
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  const result = await generateEmbedding(query, 'RETRIEVAL_QUERY');
  return result.embedding;
}
