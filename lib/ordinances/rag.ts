/**
 * RAG (Retrieval Augmented Generation) for Ordinance Q&A
 *
 * Uses semantic search to find relevant ordinance sections, then generates
 * accurate answers with proper citations using an LLM.
 */

import { searchForRAG, SearchOptions } from './search';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface RAGAnswer {
  answer: string;
  citations: Array<{
    chapter: string;
    section: string | null;
    title: string;
    content: string;
    similarity: number;
  }>;
  confidence: 'high' | 'medium' | 'low';
  suggestLawyer: boolean;
}

const SYSTEM_PROMPT = `You are a legal research assistant specializing in municipal ordinances. Your role is to answer questions about local laws based ONLY on the provided ordinance text.

CRITICAL RULES:
1. Answer ONLY using information from the provided ordinance sections
2. If the ordinances don't contain enough information, say "The ordinances don't specify this"
3. Always cite specific sections when making statements (e.g., "According to Section 856-17(a)...")
4. Do NOT make up or infer rules that aren't explicitly stated
5. If the question involves legal interpretation beyond what's written, suggest consulting a lawyer
6. Be precise and direct - this is legal information, not general advice

Format your response as:
- Direct answer to the question
- Supporting citations in format: "Section XXX-YY states: [quote]"
- Any caveats or limitations

Remember: Accuracy is more important than completeness. It's better to say "I don't know" than to guess.`;

/**
 * Generate an answer to a question using RAG
 *
 * @param question - User's question about ordinances
 * @param searchOptions - Options to filter ordinance search
 * @returns Answer with citations
 */
export async function answerQuestion(
  question: string,
  searchOptions: SearchOptions = {}
): Promise<RAGAnswer> {
  console.log(`\n💬 Question: "${question}"\n`);

  // Step 1: Search for relevant ordinance sections
  const { context, results } = await searchForRAG(question, {
    ...searchOptions,
    limit: 5,
    minSimilarity: 0.5,
  });

  if (results.length === 0) {
    return {
      answer: "I couldn't find any relevant sections in the ordinances to answer this question. The ordinances may not cover this topic, or you may need to rephrase your question.",
      citations: [],
      confidence: 'low',
      suggestLawyer: true,
    };
  }

  // Step 2: Build prompt for LLM
  const userPrompt = `Based on the following ordinance sections, answer this question:

QUESTION: ${question}

ORDINANCE SECTIONS:
${context}

Please provide a clear, accurate answer with specific citations to the sections above.`;

  // Step 3: Generate answer using AI
  const aiResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const response = {
    content: aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : '',
  };

  // Step 4: Determine confidence and whether to suggest lawyer
  const confidence = determineConfidence(results, response.content);
  const suggestLawyer = shouldSuggestLawyer(question, response.content);

  return {
    answer: response.content,
    citations: results.map(r => ({
      chapter: r.chapter,
      section: r.section,
      title: r.title,
      content: r.content,
      similarity: r.similarity,
    })),
    confidence,
    suggestLawyer,
  };
}

/**
 * Determine confidence level based on search results and response
 */
function determineConfidence(
  results: any[],
  responseText: string
): 'high' | 'medium' | 'low' {
  // High confidence if:
  // - Top result has high similarity (>0.8)
  // - Multiple results confirm the answer
  // - Response doesn't contain uncertainty language

  if (results.length === 0) return 'low';

  const topSimilarity = results[0]?.similarity || 0;
  const avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;

  const uncertaintyPhrases = [
    "don't know",
    "not sure",
    "may need to",
    "consult",
    "unclear",
    "doesn't specify",
  ];

  const hasUncertainty = uncertaintyPhrases.some(phrase =>
    responseText.toLowerCase().includes(phrase)
  );

  if (topSimilarity > 0.8 && avgSimilarity > 0.7 && !hasUncertainty) {
    return 'high';
  }

  if (topSimilarity > 0.6 && avgSimilarity > 0.5) {
    return 'medium';
  }

  return 'low';
}

/**
 * Determine if user should be advised to consult a lawyer
 */
function shouldSuggestLawyer(question: string, responseText: string): boolean {
  // Suggest lawyer for:
  // - Interpretation questions
  // - "Can I..." questions (legal advice)
  // - Complex scenarios
  // - When AI isn't confident

  const legalAdviceKeywords = [
    'can i',
    'am i allowed',
    'is it legal',
    'will i get fined',
    'what happens if',
    'should i',
  ];

  const questionLower = question.toLowerCase();
  const needsAdvice = legalAdviceKeywords.some(kw => questionLower.includes(kw));

  const responseLower = responseText.toLowerCase();
  const aiSuggestsLawyer = [
    'consult',
    'lawyer',
    'attorney',
    'legal advice',
    'seek professional',
  ].some(phrase => responseLower.includes(phrase));

  return needsAdvice || aiSuggestsLawyer;
}

/**
 * Answer multiple questions in batch (for testing)
 */
export async function answerQuestionsBatch(
  questions: string[],
  searchOptions: SearchOptions = {}
): Promise<Array<{ question: string; answer: RAGAnswer }>> {
  const results: Array<{ question: string; answer: RAGAnswer }> = [];

  for (const question of questions) {
    const answer = await answerQuestion(question, searchOptions);
    results.push({ question, answer });

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}
