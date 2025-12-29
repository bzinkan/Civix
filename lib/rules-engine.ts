import { prisma } from "./db";
import type { JsonValue } from "./json";

export type DecisionAnswer = {
  questionId: string;
  value: JsonValue;
};

export type DecisionInput = {
  jurisdictionId: string;
  flowId: string;
  answers: DecisionAnswer[];
  address?: string;
  zoneCode?: string;
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
};

type DecisionContext = {
  answers: Record<string, JsonValue>;
  address?: string;
  zoneCode?: string;
};

const outcomeSeverity: Record<DecisionOutcome, number> = {
  denied: 3,
  needs_review: 2,
  approved: 1,
  inconclusive: 0
};

const normalizeOutcome = (value: string): DecisionOutcome => {
  switch (value) {
    case "denied":
    case "needs_review":
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
    return context.answers[key];
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

const evaluateCondition = (
  condition: RuleCondition,
  context: DecisionContext
): boolean => {
  switch (condition.type) {
    case "and":
      return condition.conditions.every((child) =>
        evaluateCondition(child, context)
      );
    case "or":
      return condition.conditions.some((child) =>
        evaluateCondition(child, context)
      );
    case "not":
      return !evaluateCondition(condition.condition, context);
    case "comparison": {
      const factValue = getFactValue(condition.fact, context);
      return compareValues(condition.operator, factValue, condition.value);
    }
    default:
      return false;
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
      acc[answer.questionId] = answer.value;
      return acc;
    },
    {}
  );

  const context: DecisionContext = {
    answers: answerMap,
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
    return evaluateCondition(condition, context);
  });

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
    recommendations
  };
}
