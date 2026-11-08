import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { startFixture } from "./phase3/local-fixture.mjs";
import { runDatabaseTests } from "../tests/phase4/database.mjs";
let fixture = await startFixture();
let app;
let logs = "";
try {
  console.log(
    `Phase 3 foundation regression: ${fixture.assertions} assertions passed.`,
  );
  await runDatabaseTests(fixture);
  await fixture.close();
  fixture = await startFixture();
  fixture.resetLimits();
  const env = {
    ...process.env,
    ADMIN_ENABLED: "true",
    ADMIN_ENVIRONMENT: "local",
    ADMIN_SITE_ORIGIN: "http://127.0.0.1:3100",
    ADMIN_SUPABASE_URL: fixture.url,
    ADMIN_SUPABASE_PUBLISHABLE_KEY: "local-test-publishable-key",
    ADMIN_RATE_LIMIT_SECRET: randomBytes(32).toString("hex"),
    NEXT_PUBLIC_SUPABASE_URL: fixture.url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-test-publishable-key",
    NEXT_TELEMETRY_DISABLED: "1",
  };
  app = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3100",
    ],
    { env, stdio: ["ignore", "pipe", "pipe"] },
  );
  for (const stream of [app.stdout, app.stderr])
    stream.on("data", (data) => {
      logs = (logs + data).slice(-30000);
    });
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (app.exitCode !== null) throw new Error(logs);
    try {
      const r = await fetch("http://127.0.0.1:3100/admin/login");
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  if (!ready) throw new Error("Local application did not start: " + logs);
  mkdirSync("docs/phase4/screenshots", { recursive: true });
  const { runBrowserTests } = await import("../tests/phase4/browser.mjs");
  await runBrowserTests(fixture);
} catch (error) {
  console.error(logs);
  throw error;
} finally {
  app?.kill("SIGTERM");
  await fixture.close();
}
