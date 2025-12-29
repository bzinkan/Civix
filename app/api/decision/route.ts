import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { toJsonValue } from "../../../lib/json";
import {
  DecisionInput,
  evaluateDecision
} from "../../../lib/rules-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DecisionRequest = Omit<DecisionInput, "answers"> & {
  answers?: { questionKey?: unknown; questionId?: unknown; value: unknown }[];
  debug?: unknown;
};

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL not set" },
      { status: 500 }
    );
  }
  const body = (await request.json()) as DecisionRequest;

  if (!body?.jurisdictionId || !body?.flowId) {
    return NextResponse.json(
      { error: "jurisdictionId and flowId are required." },
      { status: 400 }
    );
  }

  const incomingAnswers = Array.isArray(body.answers) ? body.answers : [];
  const questionKeys = incomingAnswers
    .map((answer) =>
      typeof answer.questionKey === "string" ? answer.questionKey : null
    )
    .filter((key): key is string => Boolean(key));
  const questionIds = incomingAnswers
    .map((answer) =>
      typeof answer.questionId === "string" ? answer.questionId : null
    )
    .filter((id): id is string => Boolean(id));

  const questions =
    questionKeys.length === 0 && questionIds.length === 0
      ? []
      : await prisma.question.findMany({
          where: {
            flowId: String(body.flowId),
            OR: [
              questionKeys.length > 0 ? { key: { in: questionKeys } } : undefined,
              questionIds.length > 0 ? { id: { in: questionIds } } : undefined
            ].filter(Boolean)
          },
          select: {
            id: true,
            key: true
          }
        });

  const keyToId = new Map(questions.map((question) => [question.key, question.id]));
  const idToKey = new Map(questions.map((question) => [question.id, question.key]));

  const normalizedAnswers = incomingAnswers.map((answer) => {
    const inputKey =
      typeof answer.questionKey === "string" ? answer.questionKey : undefined;
    const inputId =
      typeof answer.questionId === "string" ? answer.questionId : undefined;
    const hasInputKey = inputKey ? keyToId.has(inputKey) : false;
    const questionKey = hasInputKey
      ? inputKey
      : inputId
        ? idToKey.get(inputId)
        : undefined;
    const questionId = hasInputKey ? keyToId.get(inputKey) : inputId;

    return {
      questionKey,
      questionId,
      value: toJsonValue(answer.value)
    };
  });

  const unresolved = normalizedAnswers.filter(
    (answer) => !answer.questionKey || !answer.questionId
  );

  if (unresolved.length > 0) {
    return NextResponse.json(
      { error: "One or more answers reference unknown questions." },
      { status: 400 }
    );
  }

  const normalizedBody: DecisionInput = {
    ...body,
    jurisdictionId: String(body.jurisdictionId),
    flowId: String(body.flowId),
    debug: body.debug === true,
    answers: normalizedAnswers.map((answer) => ({
      questionKey: answer.questionKey as string,
      questionId: answer.questionId as string,
      value: answer.value
    }))
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
          value:
            answer.value === null
              ? Prisma.JsonNull
              : (answer.value as Prisma.InputJsonValue),
          question: {
            connect: {
              id: answer.questionId as string
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
