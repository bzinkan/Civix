/**
 * Civics Rules Loader
 *
 * Loads and queries structured rule files for Cincinnati civics topics.
 * Used by the conversation system and API endpoints.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface TopicInfo {
  id: string;
  file: string;
  title: string;
  keywords: string[];
  ordinance_reference: string;
}

export interface TopicIndex {
  jurisdiction: string;
  jurisdiction_name: string;
  state: string;
  version: string;
  last_updated: string;
  topics: TopicInfo[];
  common_questions: {
    question: string;
    topic: string;
    answer_path: string;
  }[];
  contact: {
    general_info: string;
    website: string;
    service_requests: string;
  };
}

export interface RuleMatch {
  topic: TopicInfo;
  data: any;
  matchedKeywords: string[];
  confidence: number;
}

// Cache for loaded rules
const cache: Map<string, { index: TopicIndex; rules: Map<string, any> }> = new Map();

/**
 * Get the rules directory path for a jurisdiction
 */
function getRulesDir(jurisdiction: string): string {
  // Handle various jurisdiction formats: "cincinnati-oh", "Cincinnati, OH", etc.
  const normalized = jurisdiction
    .toLowerCase()
    .replace(/,?\s*(oh|ohio)$/i, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();

  return path.join(process.cwd(), 'data', 'rules', normalized);
}

/**
 * Load rules for a jurisdiction
 */
export function loadRulesIndex(jurisdiction: string): TopicIndex | null {
  const cached = cache.get(jurisdiction);
  if (cached) {
    return cached.index;
  }

  const rulesDir = getRulesDir(jurisdiction);
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

    cache.set(jurisdiction, { index, rules });
    return index;
  } catch (error) {
    console.error(`Error loading rules for ${jurisdiction}:`, error);
    return null;
  }
}

/**
 * Get rule data for a specific topic
 */
export function getTopicData(jurisdiction: string, topicId: string): any | null {
  const cached = cache.get(jurisdiction);
  if (cached) {
    return cached.rules.get(topicId) || null;
  }

  // Try loading
  loadRulesIndex(jurisdiction);
  const newCached = cache.get(jurisdiction);
  return newCached?.rules.get(topicId) || null;
}

/**
 * Find matching topics based on question keywords
 */
export function findMatchingTopics(
  jurisdiction: string,
  question: string
): RuleMatch[] {
  const index = loadRulesIndex(jurisdiction);
  if (!index) {
    return [];
  }

  const cached = cache.get(jurisdiction);
  if (!cached) {
    return [];
  }

  const questionLower = question.toLowerCase();
  const questionWords = questionLower.split(/\s+/);
  const matches: RuleMatch[] = [];

  for (const topic of index.topics) {
    const matchedKeywords: string[] = [];

    for (const keyword of topic.keywords) {
      const keywordLower = keyword.toLowerCase();

      // Check for exact phrase match
      if (questionLower.includes(keywordLower)) {
        matchedKeywords.push(keyword);
        continue;
      }

      // Check for individual word matches
      const keywordWords = keywordLower.split(/\s+/);
      const matchCount = keywordWords.filter(w => questionWords.includes(w)).length;
      if (matchCount > 0 && matchCount >= keywordWords.length * 0.5) {
        matchedKeywords.push(keyword);
      }
    }

    if (matchedKeywords.length > 0) {
      const ruleData = cached.rules.get(topic.id);
      if (ruleData) {
        // Calculate confidence based on match quality
        const exactPhraseMatches = matchedKeywords.filter(k =>
          questionLower.includes(k.toLowerCase())
        ).length;
        const confidence = Math.min(1, (matchedKeywords.length * 0.4) + (exactPhraseMatches * 0.3));

        matches.push({
          topic,
          data: ruleData,
          matchedKeywords,
          confidence,
        });
      }
    }
  }

  // Sort by confidence descending
  return matches.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Get a nested value from an object using a dot-separated path
 */
export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

/**
 * Check if a question matches a common question pattern
 */
export function matchCommonQuestion(
  jurisdiction: string,
  question: string
): { topic: string; answerPath: string; data: any } | null {
  const index = loadRulesIndex(jurisdiction);
  if (!index) {
    return null;
  }

  const questionLower = question.toLowerCase();

  for (const cq of index.common_questions) {
    // Simple fuzzy match on common questions
    const cqWords = cq.question.toLowerCase().split(/\s+/);
    const matchCount = cqWords.filter(w => questionLower.includes(w)).length;

    if (matchCount >= cqWords.length * 0.6) {
      const topicData = getTopicData(jurisdiction, cq.topic);
      if (topicData) {
        return {
          topic: cq.topic,
          answerPath: cq.answer_path,
          data: topicData,
        };
      }
    }
  }

  return null;
}

/**
 * Format a value for display
 */
export function formatValue(value: any): string {
  if (value === null || value === undefined) return 'Not specified';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(v => `- ${formatValue(v)}`).join('\n');
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${formatValue(v)}`)
      .join('\n');
  }
  return String(value);
}

/**
 * Get available jurisdictions with civics rules
 */
export function getAvailableJurisdictions(): string[] {
  const rulesDir = path.join(process.cwd(), 'data', 'rules');

  if (!fs.existsSync(rulesDir)) {
    return [];
  }

  const jurisdictions: string[] = [];

  for (const folder of fs.readdirSync(rulesDir)) {
    const indexPath = path.join(rulesDir, folder, 'index.json');
    if (fs.existsSync(indexPath)) {
      try {
        const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
        jurisdictions.push(index.jurisdiction);
      } catch {
        // Skip invalid index files
      }
    }
  }

  return jurisdictions;
}

/**
 * Clear the cache (useful for development/testing)
 */
export function clearCache(): void {
  cache.clear();
}
