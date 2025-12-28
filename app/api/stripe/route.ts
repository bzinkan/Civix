import { NextResponse } from "next/server";
import { getStripeStatus } from "../../../lib/stripe";

export async function GET() {
  return NextResponse.json(getStripeStatus());
}
