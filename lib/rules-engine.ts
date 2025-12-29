import { prisma } from "./db";
import type { JsonValue } from "./json";

export type DecisionAnswer = {
  questionKey: string;
  questionId?: string;
  value: JsonValue;
};

export type DecisionInput = {
  jurisdictionId: string;
  flowId: string;
  answers: DecisionAnswer[];
  address?: string;
  zoneCode?: string;
  debug?: boolean;
};

export type ComparisonOperator =
  | "eq"
  | "ne"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "not_in"
  | "contains"
  | "not_contains";

export type RuleCondition =
  | {
      type: "and";
      conditions: RuleCondition[];
    }
  | {
      type: "or";
      conditions: RuleCondition[];
    }
  | {
      type: "not";
      condition: RuleCondition;
    }
  | {
      type: "comparison";
      fact: string;
      operator: ComparisonOperator;
      value?: unknown;
    };

export type DecisionOutcome =
  | "approved"
  | "conditional"
  | "denied"
  | "needs_review"
  | "inconclusive";

export type DecisionCitation = {
  ordinanceCode?: string | null;
  sourceUrl?: string | null;
};

export type DecisionRuleApplied = {
  ruleId: string;
  name: string;
  outcome: string;
  priority: number;
};

export type DecisionOutput = {
  outcome: DecisionOutcome;
  reasoning: string[];
  citations: DecisionCitation[];
  rulesApplied: DecisionRuleApplied[];
  recommendations: string[];
  debug?: {
    matchedRuleIds: string[];
    failedRules: Array<{
      ruleId: string;
      failedCondition: RuleCondition;
    }>;
  };
};

type DecisionContext = {
  answers: Record<string, JsonValue>;
  legacyAnswers: Record<string, JsonValue>;
  address?: string;
  zoneCode?: string;
};

const outcomeSeverity: Record<DecisionOutcome, number> = {
  denied: 3,
  needs_review: 2,
  conditional: 2,
  approved: 1,
  inconclusive: 0
};

const normalizeOutcome = (value: string): DecisionOutcome => {
  switch (value) {
    case "denied":
    case "needs_review":
    case "conditional":
    case "approved":
    case "inconclusive":
      return value;
    default:
      return "inconclusive";
  }
};

const getFactValue = (fact: string, context: DecisionContext): unknown => {
  if (fact.startsWith("answers.")) {
    const key = fact.replace("answers.", "");
    if (Object.prototype.hasOwnProperty.call(context.answers, key)) {
      return context.answers[key];
    }
    // TODO: Remove legacy answer ID support after migration to question keys.
    if (Object.prototype.hasOwnProperty.call(context.legacyAnswers, key)) {
      return context.legacyAnswers[key];
    }
    return undefined;
  }

  if (fact === "address") {
    return context.address;
  }

  if (fact === "zoneCode") {
    return context.zoneCode;
  }

  return context.answers[fact];
};

const assertNever = (value: never): never => {
  throw new Error(`Unhandled operator: ${String(value)}`);
};

const compareValues = (
  operator: ComparisonOperator,
  left: unknown,
  right: unknown
): boolean => {
  switch (operator) {
    case "eq":
      return left === right;
    case "ne":
      return left !== right;
    case "gt":
      return Number(left) > Number(right);
    case "gte":
      return Number(left) >= Number(right);
    case "lt":
      return Number(left) < Number(right);
    case "lte":
      return Number(left) <= Number(right);
    case "in":
      return Array.isArray(right) ? right.includes(left) : false;
    case "not_in":
      return Array.isArray(right) ? !right.includes(left) : false;
    case "contains":
      if (Array.isArray(left)) {
        return left.includes(right);
      }
      if (typeof left === "string" && typeof right === "string") {
        return left.includes(right);
      }
      return false;
    case "not_contains":
      if (Array.isArray(left)) {
        return !left.includes(right);
      }
      if (typeof left === "string" && typeof right === "string") {
        return !left.includes(right);
      }
      return false;
    default:
      return assertNever(operator);
  }
};

const evaluateConditionDetailed = (
  condition: RuleCondition,
  context: DecisionContext
): { matches: boolean; failedCondition?: RuleCondition } => {
  switch (condition.type) {
    case "and": {
      for (const child of condition.conditions) {
        const result = evaluateConditionDetailed(child, context);
        if (!result.matches) {
          return {
            matches: false,
            failedCondition: result.failedCondition ?? child
          };
        }
      }
      return { matches: true };
    }
    case "or": {
      let firstFailure: RuleCondition | undefined;
      for (const child of condition.conditions) {
        const result = evaluateConditionDetailed(child, context);
        if (result.matches) {
          return { matches: true };
        }
        if (!firstFailure) {
          firstFailure = result.failedCondition ?? child;
        }
      }
      return { matches: false, failedCondition: firstFailure };
    }
    case "not": {
      const result = evaluateConditionDetailed(condition.condition, context);
      if (result.matches) {
        return {
          matches: false,
          failedCondition: result.failedCondition ?? condition.condition
        };
      }
      return { matches: true };
    }
    case "comparison": {
      const factValue = getFactValue(condition.fact, context);
      const matches = compareValues(condition.operator, factValue, condition.value);
      return matches ? { matches: true } : { matches: false, failedCondition: condition };
    }
    default:
      return { matches: false, failedCondition: condition };
  }
};

const collectRecommendations = (value: unknown): string[] => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") {
    return [value];
  }
  return [];
};

export async function evaluateDecision(
  input: DecisionInput
): Promise<DecisionOutput> {
  const answerMap = input.answers.reduce<Record<string, JsonValue>>(
    (acc, answer) => {
      acc[answer.questionKey] = answer.value;
      return acc;
    },
    {}
  );
  const legacyAnswerMap = input.answers.reduce<Record<string, JsonValue>>(
    (acc, answer) => {
      if (answer.questionId) {
        acc[answer.questionId] = answer.value;
      }
      return acc;
    },
    {}
  );

  const context: DecisionContext = {
    answers: answerMap,
    legacyAnswers: legacyAnswerMap,
    address: input.address,
    zoneCode: input.zoneCode
  };

  const rules = await prisma.rule.findMany({
    where: {
      jurisdictionId: input.jurisdictionId,
      OR: [{ flowId: input.flowId }, { flowId: null }]
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }]
  });

  const matchedRules = rules.filter((rule) => {
    const condition = rule.condition as RuleCondition;
    return evaluateConditionDetailed(condition, context).matches;
  });

  const debug =
    input.debug === true
      ? rules.reduce(
          (acc, rule) => {
            const condition = rule.condition as RuleCondition;
            const result = evaluateConditionDetailed(condition, context);
            if (result.matches) {
              acc.matchedRuleIds.push(rule.id);
            } else if (result.failedCondition) {
              acc.failedRules.push({
                ruleId: rule.id,
                failedCondition: result.failedCondition
              });
            }
            return acc;
          },
          { matchedRuleIds: [], failedRules: [] } as NonNullable<
            DecisionOutput["debug"]
          >
        )
      : undefined;

  const rulesApplied: DecisionRuleApplied[] = matchedRules.map((rule) => ({
    ruleId: rule.id,
    name: rule.name,
    outcome: rule.outcome,
    priority: rule.priority
  }));

  const citations: DecisionCitation[] = matchedRules.map((rule) => ({
    ordinanceCode: rule.ordinanceCode,
    sourceUrl: rule.sourceUrl
  }));

  const reasoning = matchedRules.map(
    (rule) => rule.reasoning ?? `${rule.name} applies based on your answers.`
  );

  const recommendations = matchedRules.flatMap((rule) =>
    collectRecommendations(rule.recommendations)
  );

  const outcome = matchedRules.reduce<DecisionOutcome>((current, rule) => {
    const candidate = normalizeOutcome(rule.outcome);
    return outcomeSeverity[candidate] > outcomeSeverity[current]
      ? candidate
      : current;
  }, "inconclusive");

  return {
    outcome,
    reasoning,
    citations,
    rulesApplied,
    recommendations,
    debug
  };
}
