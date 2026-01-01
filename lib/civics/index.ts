/**
 * Civics Module
 *
 * Provides structured access to municipal code rules and regulations.
 * Supports deterministic lookups for common questions and RAG fallback.
 */

export {
  loadRulesIndex,
  getTopicData,
  findMatchingTopics,
  matchCommonQuestion,
  getNestedValue,
  formatValue,
  getAvailableJurisdictions,
  clearCache,
  type TopicInfo,
  type TopicIndex,
  type RuleMatch,
} from './rules-loader';
