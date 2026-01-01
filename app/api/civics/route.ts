import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { generateQueryEmbedding, cosineSimilarity } from '@/lib/ordinances/embeddings';
import { callAI } from '@/lib/ai/providers';

const prisma = new PrismaClient();

/**
 * Civics API - Hybrid Rules + RAG Endpoint
 *
 * GET /api/civics?question=...&jurisdiction=cincinnati-oh
 * POST /api/civics { question, jurisdiction }
 *
 * This endpoint:
 * 1. First checks structured rule files for deterministic answers
 * 2. If no rule match, falls back to RAG search of ordinance text
 * 3. Returns answer with citations to specific code sections
 */

interface TopicIndex {
  jurisdiction: string;
  topics: {
    id: string;
    file: string;
    title: string;
    keywords: string[];
    ordinance_reference: string;
  }[];
}

interface RuleMatch {
  topic: string;
  title: string;
  data: any;
  matchedKeywords: string[];
  confidence: number;
}

// Cache for loaded rules
const rulesCache: Map<string, { index: TopicIndex; rules: Map<string, any> }> = new Map();

/**
 * Load rules for a jurisdiction
 */
function loadRules(jurisdiction: string): { index: TopicIndex; rules: Map<string, any> } | null {
  // Check cache
  if (rulesCache.has(jurisdiction)) {
    return rulesCache.get(jurisdiction)!;
  }

  // Determine jurisdiction folder
  const jurisdictionFolder = jurisdiction.replace('-oh', '').toLowerCase();
  const rulesDir = path.join(process.cwd(), 'data', 'rules', jurisdictionFolder);
  const indexPath = path.join(rulesDir, 'index.json');

  if (!fs.existsSync(indexPath)) {
    return null;
  }

  try {
    const index: TopicIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    const rules = new Map<string, any>();

    // Load all topic files
    for (const topic of index.topics) {
      const topicPath = path.join(rulesDir, topic.file);
      if (fs.existsSync(topicPath)) {
        rules.set(topic.id, JSON.parse(fs.readFileSync(topicPath, 'utf-8')));
      }
    }

    const cached = { index, rules };
    rulesCache.set(jurisdiction, cached);
    return cached;
  } catch (error) {
    console.error(`Error loading rules for ${jurisdiction}:`, error);
    return null;
  }
}

/**
 * Find matching rules based on question keywords
 */
function findMatchingRules(question: string, index: TopicIndex, rules: Map<string, any>): RuleMatch[] {
  const questionLower = question.toLowerCase();
  const questionWords = questionLower.split(/\s+/);
  const matches: RuleMatch[] = [];

  for (const topic of index.topics) {
    const matchedKeywords: string[] = [];

    // Check for keyword matches
    for (const keyword of topic.keywords) {
      const keywordLower = keyword.toLowerCase();
      // Check if keyword or any word in the keyword phrase is in the question
      if (questionLower.includes(keywordLower)) {
        matchedKeywords.push(keyword);
      } else {
        // Check individual words of multi-word keywords
        const keywordWords = keywordLower.split(/\s+/);
        if (keywordWords.length > 1 && keywordWords.some(w => questionWords.includes(w))) {
          matchedKeywords.push(keyword);
        }
      }
    }

    if (matchedKeywords.length > 0) {
      const ruleData = rules.get(topic.id);
      if (ruleData) {
        // Calculate confidence based on keyword matches
        const confidence = Math.min(1, matchedKeywords.length / 2);
        matches.push({
          topic: topic.id,
          title: topic.title,
          data: ruleData,
          matchedKeywords,
          confidence,
        });
      }
    }
  }

  // Sort by confidence
  return matches.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Extract relevant sections from rule data based on question
 */
function extractRelevantSections(question: string, ruleData: any): any {
  const questionLower = question.toLowerCase();
  const relevant: any = {
    topic: ruleData.topic,
    title: ruleData.title,
    ordinance_reference: ruleData.ordinance_reference,
    summary: ruleData.summary,
  };

  // Common question patterns and what to extract
  const patterns = [
    { pattern: /permit|need|require/i, keys: ['permit', 'permit_required', 'permit_requirements', 'requirements'] },
    { pattern: /fee|cost|price/i, keys: ['fee', 'fees', 'penalties', 'fine', 'fines'] },
    { pattern: /time|hour|when/i, keys: ['hours', 'timeframe', 'schedule', 'prohibited_hours', 'quiet_hours'] },
    { pattern: /height|tall|high/i, keys: ['max_height', 'height', 'residential_zones', 'commercial_zones'] },
    { pattern: /where|location/i, keys: ['location', 'placement', 'setback', 'placement'] },
    { pattern: /how|process|step/i, keys: ['process', 'registration', 'application', 'how_to'] },
    { pattern: /penalty|fine|violation/i, keys: ['penalties', 'fines', 'enforcement', 'violations'] },
    { pattern: /contact|phone|help/i, keys: ['contact', 'department', 'phone'] },
  ];

  // Extract matching sections
  for (const { pattern, keys } of patterns) {
    if (pattern.test(questionLower)) {
      for (const key of keys) {
        if (ruleData[key] !== undefined) {
          relevant[key] = ruleData[key];
        }
        // Also check nested objects
        for (const topKey of Object.keys(ruleData)) {
          if (typeof ruleData[topKey] === 'object' && ruleData[topKey] !== null) {
            if (ruleData[topKey][key] !== undefined) {
              if (!relevant[topKey]) relevant[topKey] = {};
              relevant[topKey][key] = ruleData[topKey][key];
            }
          }
        }
      }
    }
  }

  // If no specific patterns matched, include top-level keys
  if (Object.keys(relevant).length <= 4) {
    for (const key of Object.keys(ruleData)) {
      if (!['jurisdiction', 'topic'].includes(key)) {
        relevant[key] = ruleData[key];
      }
    }
  }

  return relevant;
}

/**
 * Format rule data into a readable answer
 */
function formatRuleAnswer(question: string, match: RuleMatch): string {
  const data = match.data;
  const sections = extractRelevantSections(question, data);

  let answer = `Based on ${data.title} (${data.ordinance_reference}):\n\n`;

  if (data.summary) {
    answer += `${data.summary}\n\n`;
  }

  // Format key information
  const formatValue = (value: any, indent = 0): string => {
    const prefix = '  '.repeat(indent);
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return `$${value}` ; // Assume numbers are often fees
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
      return value.map(v => `${prefix}- ${formatValue(v, indent)}`).join('\n');
    }
    if (typeof value === 'object') {
      return Object.entries(value)
        .filter(([k, v]) => v !== null && v !== undefined)
        .map(([k, v]) => {
          const label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          const formattedValue = formatValue(v, indent + 1);
          if (typeof v === 'object' && !Array.isArray(v)) {
            return `${prefix}**${label}:**\n${formattedValue}`;
          }
          return `${prefix}**${label}:** ${formattedValue}`;
        })
        .join('\n');
    }
    return String(value);
  };

  // Include relevant sections
  for (const [key, value] of Object.entries(sections)) {
    if (['topic', 'title', 'ordinance_reference', 'summary', 'jurisdiction'].includes(key)) continue;
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    answer += `### ${label}\n${formatValue(value)}\n\n`;
  }

  // Add contact info if available
  if (data.contact) {
    answer += `### Contact\n`;
    if (data.contact.phone) answer += `Phone: ${data.contact.phone}\n`;
    if (data.contact.online) answer += `Online: ${data.contact.online}\n`;
    if (data.contact.department) answer += `Department: ${data.contact.department}\n`;
  }

  return answer;
}

/**
 * Fall back to RAG search
 */
async function ragSearch(
  question: string,
  jurisdictionId: string,
  jurisdiction: { name: string; state: string }
): Promise<{ answer: string; sources: any[] }> {
  // Generate embedding
  const queryEmbedding = await generateQueryEmbedding(question);

  // Fetch chunks
  const allChunks = await prisma.ordinanceChunk.findMany({
    where: { jurisdictionId },
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

  const chunks = allChunks.filter(chunk => chunk.embedding !== null);

  if (chunks.length === 0) {
    return {
      answer: `I don't have detailed ordinance data for ${jurisdiction.name} to answer this question.`,
      sources: [],
    };
  }

  // Calculate similarity
  const scoredChunks = chunks.map(chunk => ({
    ...chunk,
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding as number[]),
  }));

  const topChunks = scoredChunks
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);

  // Build AI prompt
  const context = topChunks.map(chunk => ({
    citation: `${jurisdiction.name} Code ${chunk.chapter}${chunk.section ? `-${chunk.section}` : ''}`,
    title: chunk.title,
    content: chunk.content,
  }));

  const systemPrompt = `You are a helpful assistant that answers questions about local ordinances.
Answer based ONLY on the provided ordinance sections. Cite specific sections.
If the answer isn't in the context, say "I don't have specific information about that."`;

  const userPrompt = `Question: ${question}

Relevant Ordinance Sections:
${context.map((c, i) => `[${i + 1}] ${c.citation} - ${c.title}\n${c.content}`).join('\n\n')}

Provide a clear, concise answer with citations.`;

  const aiResponse = await callAI(
    [{ role: 'user', content: userPrompt }],
    { systemPrompt, temperature: 0.1, maxTokens: 1500 }
  );

  return {
    answer: aiResponse.content,
    sources: topChunks.map(chunk => ({
      citation: `${jurisdiction.name} Code ${chunk.chapter}${chunk.section ? `-${chunk.section}` : ''}`,
      title: chunk.title,
      similarity: Math.round(chunk.similarity * 100),
    })),
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const question = searchParams.get('question');
  const jurisdictionParam = searchParams.get('jurisdiction') || 'cincinnati-oh';

  if (!question) {
    return NextResponse.json({ error: 'Question parameter is required' }, { status: 400 });
  }

  return handleQuery(question, jurisdictionParam);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { question, jurisdiction = 'cincinnati-oh' } = body;

  if (!question) {
    return NextResponse.json({ error: 'Question is required' }, { status: 400 });
  }

  return handleQuery(question, jurisdiction);
}

async function handleQuery(question: string, jurisdictionParam: string) {
  try {
    // Look up jurisdiction
    const jurisdiction = await prisma.jurisdiction.findFirst({
      where: {
        OR: [
          { id: jurisdictionParam },
          { name: { contains: jurisdictionParam.split('-')[0], mode: 'insensitive' } },
        ],
      },
    });

    if (!jurisdiction) {
      return NextResponse.json({ error: 'Jurisdiction not found' }, { status: 404 });
    }

    // Step 1: Try structured rules first
    const rules = loadRules(jurisdictionParam);
    let ruleMatch: RuleMatch | null = null;
    let answer: string = '';
    let sources: any[] = [];
    let source: 'rules' | 'rag' = 'rules';

    if (rules) {
      const matches = findMatchingRules(question, rules.index, rules.rules);
      if (matches.length > 0 && matches[0].confidence >= 0.5) {
        ruleMatch = matches[0];
        answer = formatRuleAnswer(question, ruleMatch);
        sources = [{
          type: 'structured_rule',
          topic: ruleMatch.topic,
          title: ruleMatch.title,
          ordinance_reference: ruleMatch.data.ordinance_reference,
          confidence: Math.round(ruleMatch.confidence * 100),
        }];
      }
    }

    // Step 2: Fall back to RAG if no rule match
    if (!ruleMatch) {
      source = 'rag';
      const ragResult = await ragSearch(question, jurisdiction.id, jurisdiction);
      answer = ragResult.answer;
      sources = ragResult.sources.map(s => ({ ...s, type: 'ordinance_text' }));
    }

    return NextResponse.json({
      answer,
      sources,
      jurisdiction: {
        id: jurisdiction.id,
        name: jurisdiction.name,
        state: jurisdiction.state,
      },
      metadata: {
        question,
        source,
        matchedTopic: ruleMatch?.topic || null,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('Civics API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process query' },
      { status: 500 }
    );
  }
}
