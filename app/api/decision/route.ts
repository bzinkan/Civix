import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import {
  DecisionInput,
  evaluateDecision
} from "../../../lib/rules-engine";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as DecisionInput;

  if (!body?.jurisdictionId || !body?.flowId) {
    return NextResponse.json(
      { error: "jurisdictionId and flowId are required." },
      { status: 400 }
    );
  }

  const normalizedBody = {
    ...body,
    answers: Array.isArray(body.answers) ? body.answers : []
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
          questionId: answer.questionId,
          value: answer.value
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
