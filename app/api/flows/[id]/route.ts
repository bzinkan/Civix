import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export const runtime = "nodejs";

type RouteParams = {
  params: { id: string };
};

export async function GET(_request: Request, { params }: RouteParams) {
  const flow = await prisma.decisionFlow.findUnique({
    where: { id: params.id },
    include: {
      questions: {
        orderBy: { order: "asc" }
      }
    }
  });

  if (!flow) {
    return NextResponse.json({ error: "Flow not found." }, { status: 404 });
  }

  return NextResponse.json(flow);
}
