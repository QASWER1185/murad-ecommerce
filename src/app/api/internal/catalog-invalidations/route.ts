import { NextRequest, NextResponse } from "next/server";
import { workerConfig, verifyWorkerRequest, queueAlert } from "@/lib/worker/contracts";
import { processInvalidations } from "@/lib/worker/server";
import { operationalEvent } from "@/lib/monitoring/events";
import { privateHeaders } from "@/lib/admin/security";
export const maxDuration = 60;
export async function POST(request: NextRequest) {
  const response = (status: number, body: unknown) => NextResponse.json(body, { status, headers: privateHeaders });
  try {
    const config = workerConfig();
    if (!config) return response(503, { error: "Worker disabled" });
    if (request.headers.has("origin") || !request.headers.get("content-type")?.startsWith("application/json")) return response(401, { error: "Machine authentication required" });
    if (Number(request.headers.get("content-length") || 0) > 4096) return response(413, { error: "Bounded request required" });
    const reader = request.body?.getReader();
    let bytes = Buffer.alloc(0);
    if (reader) while (true) {
      const part = await reader.read(); if (part.done) break;
      if (bytes.length + part.value.byteLength > 4096) { await reader.cancel(); return response(413, { error: "Bounded request required" }); }
      bytes = Buffer.concat([bytes, part.value]);
    }
    const envelope = bytes.toString(), signature = request.headers.get("x-catalog-worker-signature") || "";
    if (!verifyWorkerRequest(envelope, signature, config)) return response(401, { error: "Machine authentication rejected" });
    const result = await processInvalidations(config, envelope, signature);
    if (queueAlert(result.health)) operationalEvent("catalog_queue_alert", { route: request.nextUrl.pathname, status: 503 });
    if (result.failed) operationalEvent("catalog_worker_partial", { route: request.nextUrl.pathname, status: 503 });
    return response(result.failed ? 503 : 200, result);
  } catch {
    operationalEvent("catalog_worker_failure", { route: request.nextUrl.pathname, status: 503 });
    return response(503, { error: "Worker unavailable; unacknowledged leases will retry" });
  }
}
