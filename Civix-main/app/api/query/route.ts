import { NextResponse } from "next/server";
import { answerQuery } from "../../../lib/rules";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    question?: string;
    domain?: string;
  };

  const result = answerQuery(body.question ?? "", body.domain ?? "zoning");

  return NextResponse.json({
    answer: result.answer,
    confidence: result.confidence
  });
}
