import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { toJsonValue } from "../../../lib/json";
import {
  DecisionInput,
  evaluateDecision
} from "../../../lib/rules-engine";

export const runtime = "nodejs";

type DecisionRequest = Omit<DecisionInput, "answers"> & {
  answers?: { questionId: unknown; value: unknown }[];
};

export async function POST(request: Request) {
  const body = (await request.json()) as DecisionRequest;

  if (!body?.jurisdictionId || !body?.flowId) {
    return NextResponse.json(
      { error: "jurisdictionId and flowId are required." },
      { status: 400 }
    );
  }

  const normalizedBody: DecisionInput = {
    ...body,
    jurisdictionId: String(body.jurisdictionId),
    flowId: String(body.flowId),
    answers: Array.isArray(body.answers)
      ? body.answers.map((answer) => ({
          questionId: String(answer.questionId),
          value: toJsonValue(answer.value)
        }))
      : []
  };

  const result = await evaluateDecision(normalizedBody);

  const decision = await prisma.decision.create({
    data: {
      flowId: normalizedBody.flowId,
      jurisdictionId: normalizedBody.jurisdictionId,
      outcome: result.outcome,
      reasoning: result.reasoning,
      citations: result.citations,
      rulesApplied: result.rulesApplied,
      recommendations: result.recommendations,
      address: normalizedBody.address,
      zoneCode: normalizedBody.zoneCode,
      answers: {
        create: normalizedBody.answers.map((answer) => ({
          value: answer.value,
          question: {
            connect: {
              id: answer.questionId
            }
          }
        }))
      },
      decisionRules: {
        create: result.rulesApplied.map((rule) => ({
          ruleId: rule.ruleId,
          outcome: rule.outcome,
          priority: rule.priority
        }))
      }
    }
  });

  return NextResponse.json({ ...result, decisionId: decision.id });
}
