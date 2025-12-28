import { zoningRules } from "./zoning";
import { animalRules } from "./animals";
import { businessRules } from "./business";

export type RuleAnswer = {
  answer: string;
  confidence: "low" | "medium" | "high";
};

export function answerQuery(question: string, domain: string): RuleAnswer {
  const normalized = question.trim().toLowerCase();
  const rules =
    {
      zoning: zoningRules,
      animals: animalRules,
      business: businessRules
    }[domain] ?? zoningRules;

  const matched = rules.find((rule) => normalized.includes(rule.keyword));

  if (matched) {
    return { answer: matched.answer, confidence: "medium" };
  }

  return {
    answer: "We need more details to answer that question accurately.",
    confidence: "low"
  };
}
