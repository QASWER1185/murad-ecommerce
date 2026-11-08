import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
export type WorkerAction = "claim" | "ack" | "stats";
export interface WorkerConfig { url: string; key: string; origin: string; keyId: string; secret: string }
export function workerConfig(env: Record<string, string | undefined> = process.env): WorkerConfig | null {
  if (env.CATALOG_WORKER_ENABLED !== "true") return null;
  // Production scheduling is a separately reviewed release change.
  if (!["local", "staging"].includes(env.CATALOG_WORKER_ENVIRONMENT || "")) throw Error("Worker environment disabled");
  const local = env.CATALOG_WORKER_ENVIRONMENT === "local";
  const url = new URL(env.CATALOG_WORKER_SUPABASE_URL || "invalid"), origin = new URL(env.CATALOG_WORKER_SITE_ORIGIN || "invalid");
  for (const value of [url, origin]) {
    if (value.username || value.password || value.search || value.hash || value.pathname !== "/" ||
      (local ? !["127.0.0.1", "localhost", "[::1]"].includes(value.hostname) || !["http:", "https:"].includes(value.protocol) : value.protocol !== "https:")) throw Error("Invalid worker origins");
  }
  const key = env.CATALOG_WORKER_PUBLISHABLE_KEY || "", keyId = env.CATALOG_WORKER_KEY_ID || "", secret = env.CATALOG_WORKER_SECRET || "";
  if (!key || key.startsWith("sb_secret_") || !/^[a-z0-9-]{1,40}$/.test(keyId) || !/^[a-f0-9]{64,128}$/.test(secret)) throw Error("Invalid worker credentials");
  if (key.split(".").length === 3) {
    try { if (JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString()).role !== "anon") throw Error(); }
    catch { throw Error("Privileged worker database key forbidden"); }
  }
  return { url: url.origin, origin: origin.origin, key, keyId, secret };
}
export function workerEnvelope(config: Pick<WorkerConfig, "origin" | "keyId">, action: WorkerAction, fields: Record<string, unknown> = {}) {
  return JSON.stringify({ ...fields, v: "catalog-worker-v1", key_id: config.keyId, origin: config.origin, action, nonce: randomUUID(), issued: Math.floor(Date.now() / 1000) });
}
export function workerSignature(envelope: string, secret: string) {
  return createHmac("sha256", secret).update(`catalog-worker-v1:${envelope}`).digest("hex");
}
export function verifyWorkerRequest(envelope: string, signature: string, config: WorkerConfig, now = Date.now()) {
  if (Buffer.byteLength(envelope) > 4096 || !/^[a-f0-9]{64}$/.test(signature)) return false;
  try {
    const e = JSON.parse(envelope);
    return e.v === "catalog-worker-v1" && e.action === "claim" && e.limit === 25 &&
      e.key_id === config.keyId && e.origin === config.origin && /^[0-9a-f-]{36}$/i.test(e.nonce) &&
      Number.isSafeInteger(e.issued) && Math.abs(now / 1000 - e.issued) <= 60 &&
      timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(workerSignature(envelope, config.secret), "hex"));
  } catch { return false; }
}
export interface QueueHealth { pending: number; retrying: number; oldest_seconds: number; leased: number }
export function queueAlert(health: QueueHealth) {
  return health.retrying > 0 || (health.pending > 0 && health.oldest_seconds > 300);
}
