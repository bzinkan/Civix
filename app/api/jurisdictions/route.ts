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
    const jurisdictions = await prisma.jurisdiction.findMany({
      orderBy: [{ name: "asc" }, { state: "asc" }],
      select: {
        id: true,
        name: true,
        state: true,
        type: true
      }
    });

    return NextResponse.json(jurisdictions);
  } catch (error) {
    console.error("Error fetching jurisdictions:", error);
    return NextResponse.json(
      { error: "Failed to fetch jurisdictions", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
