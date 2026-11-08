// Operator utility. No credentials are provisioned and no service-role key is used.
// Supply a private JSON file containing an existing authorized browser session's
// [{name,value}] cookies. Never commit this file. This tool stops on auth failure.
import { readFileSync } from "node:fs";
const origin = new URL(process.env.CATALOG_WORKER_ORIGIN || "invalid");
if (
  origin.username ||
  origin.password ||
  origin.pathname !== "/" ||
  origin.search ||
  origin.hash ||
  !["https:", "http:"].includes(origin.protocol)
)
  throw Error("Trusted worker origin required");
if (
  origin.protocol === "http:" &&
  !["127.0.0.1", "localhost", "[::1]"].includes(origin.hostname)
)
  throw Error("HTTPS required outside local testing");
// This cookie utility remains a short-lived local/staging diagnostic, not a
// production scheduler identity. Production scheduling needs a reviewed worker.
if (
  !["127.0.0.1", "localhost", "[::1]"].includes(origin.hostname) &&
  process.env.CATALOG_WORKER_ENVIRONMENT !== "staging"
)
  throw Error(
    "Browser-session workers are restricted to local or explicitly authorized staging diagnostics.",
  );
const values = JSON.parse(
  readFileSync(process.env.CATALOG_WORKER_COOKIE_FILE || "", "utf8"),
);
if (!Array.isArray(values)) throw Error("Cookie array required");
const csrf = values.find((c) => c.name === "murad-admin-csrf")?.value;
if (!csrf || !values.some((c) => c.name.startsWith("murad-admin-session")))
  throw Error("Existing administrator session and CSRF cookies required");
const cookies = values
  .map((c) => {
    if (!/^[A-Za-z0-9_.-]+$/.test(c.name) || /[\r\n;]/.test(c.value))
      throw Error("Invalid cookie");
    return `${c.name}=${c.value}`;
  })
  .join("; ");
let processed = 0;
for (let batch = 0; batch < 10; batch++) {
  const response = await fetch(new URL("/admin/invalidations", origin), {
    method: "POST",
    redirect: "error",
    headers: {
      Origin: origin.origin,
      Cookie: cookies,
      "Content-Type": "application/json",
      "X-CSRF-Token": csrf,
    },
    body: "{}",
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok)
    throw Error(
      `Processing stopped (HTTP ${response.status}); retained events can be retried with a current authorized session.`,
    );
  const state = await response.json();
  processed += state.processed;
  if (state.failed)
    throw Error("Invalidation failed; durable events retained for retry.");
  if (!state.more) {
    console.log(`Processed ${processed} catalog invalidation events.`);
    process.exit(0);
  }
}
console.log(
  `Processed ${processed} events; bounded run complete. Run again to drain remaining work.`,
);
