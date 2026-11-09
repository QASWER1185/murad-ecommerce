import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { workerEnvelope, workerSignature, type WorkerConfig, type QueueHealth } from "./contracts";
export function invalidateStorefront() {
  revalidateTag("catalog", { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/sitemap.xml");
  revalidatePath("/robots.txt");
}
async function rpc(config: WorkerConfig, envelope: string, signature: string) {
  const response = await fetch(`${config.url}/rest/v1/rpc/catalog_worker_gateway`, {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(5000),
    headers: { apikey: config.key, Authorization: `Bearer ${config.key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_envelope: envelope, p_signature: signature }),
  });
  // Never propagate database error bodies or secrets into scheduler logs.
  if (!response.ok) throw Error("Worker capability unavailable");
  return response.json();
}
export async function processInvalidations(config: WorkerConfig, envelope: string, signature: string) {
  const events = await rpc(config, envelope, signature) as { id: string; token: string }[];
  if (!Array.isArray(events) || events.length > 25 || events.some(e => !/^\d+$/.test(e.id) || !/^[0-9a-f-]{36}$/i.test(e.token))) throw Error("Invalid worker lease response");
  let outcome = "ok";
  if (events.length) try { invalidateStorefront(); } catch { outcome = "retry"; }
  let processed = 0, failed = 0;
  // At most five in-flight requests; one bounded batch per scheduler invocation.
  for (let offset = 0; offset < events.length; offset += 5) {
    await Promise.all(events.slice(offset, offset + 5).map(async event => {
      try {
        const ack = workerEnvelope(config, "ack", { ...event, outcome });
        const result = await rpc(config, ack, workerSignature(ack, config.secret));
        if (result === true && outcome === "ok") processed++; else failed++;
      } catch { failed++; } // Missing ack recovers on lease expiry, no blind success.
    }));
  }
  const stats = workerEnvelope(config, "stats");
  const health = await rpc(config, stats, workerSignature(stats, config.secret)) as QueueHealth;
  if ([health.pending, health.retrying, health.oldest_seconds, health.leased].some(v => !Number.isFinite(v) || v < 0)) throw Error("Invalid queue health response");
  return { claimed: events.length, processed, failed, health };
}
