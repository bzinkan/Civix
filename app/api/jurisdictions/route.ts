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
}
