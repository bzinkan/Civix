import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL not set" },
      { status: 500 }
    );
  }

  try {
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
  } catch (error) {
    console.error("Error fetching flows:", error);
    return NextResponse.json(
      { error: "Failed to fetch flows", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
