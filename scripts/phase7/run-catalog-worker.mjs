// One invocation, no browser cookie, no service role. Load secrets with the
// operator's secret runner / node --env-file; never put secrets in arguments.
import { createHmac, randomUUID } from "node:crypto";
const env = process.env;
try {
  if (env.CATALOG_WORKER_ENABLED !== "true" || !["local", "staging"].includes(env.CATALOG_WORKER_ENVIRONMENT)) throw Error();
  const origin = new URL(env.CATALOG_WORKER_SITE_ORIGIN);
  if (origin.pathname !== "/" || origin.search || origin.hash || origin.username || origin.password ||
    (env.CATALOG_WORKER_ENVIRONMENT === "local" ? !["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname) || !["http:", "https:"].includes(origin.protocol) : origin.protocol !== "https:")) throw Error();
  if (!/^[a-f0-9]{64,128}$/.test(env.CATALOG_WORKER_SECRET || "") || !/^[a-z0-9-]{1,40}$/.test(env.CATALOG_WORKER_KEY_ID || "")) throw Error();
  const body = JSON.stringify({ v: "catalog-worker-v1", key_id: env.CATALOG_WORKER_KEY_ID, origin: origin.origin, action: "claim", limit: 25, nonce: randomUUID(), issued: Math.floor(Date.now() / 1000) });
  const signature = createHmac("sha256", env.CATALOG_WORKER_SECRET).update(`catalog-worker-v1:${body}`).digest("hex");
  const response = await fetch(new URL("/api/internal/catalog-invalidations", origin), { method: "POST", redirect: "error", signal: AbortSignal.timeout(55000), headers: { "Content-Type": "application/json", "X-Catalog-Worker-Signature": signature }, body });
  const result = await response.json();
  if (!response.ok || ![result.claimed, result.processed, result.failed].every(v => Number.isSafeInteger(v) && v >= 0 && v <= 25)) throw Error();
  // Whitelist counts, never arbitrary server responses.
  console.log(JSON.stringify({ event: "catalog_worker_run", claimed: result.claimed, processed: result.processed, failed: result.failed }));
} catch {
  console.error(JSON.stringify({ event: "catalog_worker_run_failed" }));
  process.exitCode = 1;
}
