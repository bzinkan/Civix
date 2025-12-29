import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

export const runtime = "nodejs";

export async function GET() {
  const flows = await prisma.decisionFlow.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      label: true,
      description: true,
      jurisdictionId: true
    }
  });

  return NextResponse.json(flows);
}
