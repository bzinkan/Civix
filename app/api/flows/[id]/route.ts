import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = {
  params: { id: string };
};

export async function GET(_request: Request, { params }: RouteParams) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL not set" },
      { status: 500 }
    );
  }
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
