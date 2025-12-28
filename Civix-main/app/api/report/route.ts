import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    reportId: "demo-report",
    status: "queued",
    message: "Report generation is available on paid plans."
  });
}
