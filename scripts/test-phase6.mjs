import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { startFixture } from "./phase3/local-fixture.mjs";
import { seedCatalog } from "../tests/phase5/fixture.mjs";
import { orderFixture } from "../tests/phase6/fixture.mjs";
import { orderDatabaseTests } from "../tests/phase6/database.mjs";
let fixture = await startFixture(),
  app,
  logs = "";
try {
  let seed = await seedCatalog(fixture),
    orders = orderFixture(fixture, seed);
  console.log(`Phase 3 foundation: ${fixture.assertions} passed.`);
  await orderDatabaseTests(fixture, seed, orders);
  await fixture.close();
  fixture = await startFixture();
  seed = await seedCatalog(fixture);
  orders = orderFixture(fixture, seed);
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
    ORDER_REQUESTS_ENABLED: "true",
    ORDER_GATEWAY_KEY_ID: orders.keyId,
    ORDER_GATEWAY_SECRET: orders.secret,
    ANALYTICS_ENABLED: "true",
    GA4_MANUAL_EVENTS_ONLY_CONFIRMED: "true",
    GA4_MEASUREMENT_ID: "G-LOCALTEST6",
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
    stream.on("data", (bytes) => {
      logs = (logs + bytes).slice(-30000);
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
  const { orderBrowserTests } = await import("../tests/phase6/browser.mjs");
  await orderBrowserTests(fixture, seed, orders);
  if (logs.includes("+12025550123") || logs.includes("PRIVATE-GUEST"))
    throw Error("Synthetic customer data leaked into application logs");
  console.log(
    "Application log redaction: no synthetic customer sentinel appeared.",
  );
} catch (error) {
  console.error(logs);
  throw error;
} finally {
  app?.kill("SIGTERM");
  await fixture.close();
}
