import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { startFixture } from "./phase3/local-fixture.mjs";
import { seedCatalog } from "../tests/phase5/fixture.mjs";
import { databaseTests } from "../tests/phase5/database.mjs";
let fixture = await startFixture(),
  app,
  publicOnlyApp,
  logs = "";
try {
  let seed = await seedCatalog(fixture);
  console.log(`Phase 3 foundation: ${fixture.assertions} passed.`);
  await databaseTests(fixture, seed);
  await fixture.close();
  fixture = await startFixture();
  seed = await seedCatalog(fixture);
  const env = {
    ...process.env,
    ADMIN_ENABLED: "true",
    ADMIN_ENVIRONMENT: "local",
    ADMIN_SITE_ORIGIN: "http://127.0.0.1:3100",
    ADMIN_SUPABASE_URL: fixture.url,
    ADMIN_SUPABASE_PUBLISHABLE_KEY: "local-test-publishable-key",
    ADMIN_RATE_LIMIT_SECRET: randomBytes(32).toString("hex"),
    CATALOG_ENABLED: "true",
    CATALOG_ENVIRONMENT: "local",
    CATALOG_SUPABASE_URL: fixture.url,
    CATALOG_SUPABASE_PUBLISHABLE_KEY: "local-test-publishable-key",
    CATALOG_SITE_ORIGIN: "http://127.0.0.1:3100",
    CATALOG_MEDIA_ENABLED: "true",
    CATALOG_INDEXING_ENABLED: "false",
    NEXT_PUBLIC_SUPABASE_URL: fixture.url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-test-publishable-key",
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
    stream.on("data", (b) => {
      logs = (logs + b).slice(-20000);
    });
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (app.exitCode !== null) throw Error(logs);
    try {
      if ((await fetch("http://127.0.0.1:3100/admin/login")).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  if (!ready) throw Error("Local app unavailable");
  publicOnlyApp = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3102",
    ],
    {
      env: {
        ...env,
        ADMIN_ENABLED: "false",
        CATALOG_SITE_ORIGIN: "http://127.0.0.1:3102",
      },
      stdio: "ignore",
    },
  );
  let mediaReady = false;
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch("http://127.0.0.1:3102/api/catalog/generation");
      if (r.ok) {
        mediaReady = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  if (!mediaReady) throw Error("Public-only application did not start");
  const { browserTests } = await import("../tests/phase5/browser.mjs");
  await browserTests(fixture, seed);
} catch (error) {
  console.error(logs);
  throw error;
} finally {
  app?.kill("SIGTERM");
  publicOnlyApp?.kill("SIGTERM");
  await fixture.close();
}
