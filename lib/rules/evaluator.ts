// Bridge between AI conversation and deterministic rules engine
import { prisma } from '@/lib/db';

export interface EvaluationRequest {
  jurisdiction: string;
  category: string;
  subcategory?: string;
  inputs: Record<string, any>;
}

export interface EvaluationResult {
  outcome: 'ALLOWED' | 'PROHIBITED' | 'CONDITIONAL' | 'RESTRICTED';
  rationale: string;
  matchedRules: any[];
  citations: any[];
  jurisdictionId: string;
}

/**
 * Main evaluation function - called after AI conversation collects all inputs
 */
export async function evaluateRules(request: EvaluationRequest): Promise<EvaluationResult> {
  const { jurisdiction, category, subcategory, inputs } = request;

  const [name, state] = jurisdiction.split(',').map(s => s.trim());

  // Find jurisdiction
  const jurisdictionRecord = await prisma.jurisdiction.findFirst({
    where: {
      name: {
        equals: name,
        mode: 'insensitive',
      },
      state: {
        equals: state,
        mode: 'insensitive',
      },
    },
  });

  if (!jurisdictionRecord) {
    throw new Error(`Jurisdiction not found: ${jurisdiction}`);
  }

  // Find ruleset
  const ruleset = await prisma.ruleset.findFirst({
    where: {
      jurisdictionId: jurisdictionRecord.id,
      category,
      isActive: true,
    },
    include: {
      aiRules: {
        where: subcategory
          ? { subcategory }
          : {},
        include: {
          citations: true,
        },
        orderBy: {
          priority: 'desc',
        },
      },
    },
  });

  if (!ruleset || ruleset.aiRules.length === 0) {
    throw new Error(`No rules found for ${category} in ${jurisdiction}`);
  }

  // Evaluate each rule
  const results = ruleset.aiRules.map(rule => {
    const matched = evaluateCondition(rule.conditions, inputs);
    return {
      matched,
      ruleKey: rule.key,
      description: rule.description,
      outcome: rule.outcome,
      citation: rule.citation,
      priority: rule.priority,
      citations: rule.citations,
    };
  });

  // Find highest priority matched rule
  const matchedRule = results.find(r => r.matched);

  if (!matchedRule) {
    // No rules matched - default to ALLOWED
    return {
      outcome: 'ALLOWED',
      rationale: 'No restrictions found based on the information provided.',
      matchedRules: [],
      citations: [],
      jurisdictionId: jurisdictionRecord.id,
    };
  }

  // Build rationale
  const rationale = matchedRule.description;

  // Collect citations
  const citations = matchedRule.citations.map(citation => ({
    ordinanceNumber: citation.ordinanceNumber,
    section: citation.section,
    title: citation.title || undefined,
    text: citation.text,
    url: citation.url || undefined,
    pageNumber: citation.pageNumber || undefined,
  }));

  return {
    outcome: matchedRule.outcome as any,
    rationale,
    matchedRules: [{
      key: matchedRule.ruleKey,
      description: matchedRule.description,
      outcome: matchedRule.outcome,
      citation: matchedRule.citation,
    }],
    citations,
    jurisdictionId: jurisdictionRecord.id,
  };
}

/**
 * Evaluate a condition against inputs
 */
function evaluateCondition(condition: any, inputs: Record<string, any>): boolean {
  if (!condition || typeof condition !== 'object') {
    return false;
  }

  // Handle AND conditions
  if (condition.type === 'and' && Array.isArray(condition.conditions)) {
    return condition.conditions.every((c: any) => evaluateCondition(c, inputs));
  }

  // Handle OR conditions
  if (condition.type === 'or' && Array.isArray(condition.conditions)) {
    return condition.conditions.some((c: any) => evaluateCondition(c, inputs));
  }

  // Handle NOT conditions
  if (condition.type === 'not' && condition.condition) {
    return !evaluateCondition(condition.condition, inputs);
  }

  // Handle comparison conditions
  if (condition.type === 'comparison') {
    const { fact, operator, value } = condition;

    // Extract value from inputs using dot notation (e.g., "answers.legal_authority")
    const factValue = getNestedValue(inputs, fact);

    switch (operator) {
      case 'eq':
      case 'equal':
        return factValue === value;
      case 'ne':
      case 'notEqual':
        return factValue !== value;
      case 'gt':
      case 'greaterThan':
        return factValue > value;
      case 'gte':
      case 'greaterThanOrEqual':
        return factValue >= value;
      case 'lt':
      case 'lessThan':
        return factValue < value;
      case 'lte':
      case 'lessThanOrEqual':
        return factValue <= value;
      case 'in':
        return Array.isArray(value) && value.includes(factValue);
      case 'notIn':
        return Array.isArray(value) && !value.includes(factValue);
      case 'contains':
        return String(factValue).includes(String(value));
      default:
        console.warn(`Unknown operator: ${operator}`);
        return false;
    }
  }

  return false;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[key];
  }

  return current;
}
