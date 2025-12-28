export type Plan = "free" | "pro";

export function hasReportAccess(plan: Plan): boolean {
  return plan === "pro";
}
