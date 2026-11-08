import { connection } from "next/server";
import { analyticsConfig } from "@/lib/analytics/config";
import { AnalyticsRuntime } from "./Analytics";
export async function AnalyticsSetup() {
  await connection();
  return <AnalyticsRuntime config={analyticsConfig()} />;
}
