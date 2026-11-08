import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import ExcelJS from "exceljs";
import { parseSessionAccess } from "../../src/lib/admin/session-policy";
import { readSpreadsheet } from "../../src/lib/imports/spreadsheets";
async function spreadsheet(extra: unknown, formattingOnly = false) {
  const book = new ExcelJS.Workbook(), sheet = book.addWorksheet("Synthetic local test");
  sheet.addRow(["sku", "name"]);
  const row = sheet.addRow(["SYNTHETIC-ONLY", "Synthetic local fixture", extra]);
  if (formattingOnly) { row.getCell(3).value = null; row.getCell(3).numFmt = "@"; }
  return readSpreadsheet(Buffer.from(await book.xlsx.writeBuffer()), "synthetic.xlsx");
}
test("XLSX populated columns without headers are row errors instead of silent truncation", async () => {
  for (const value of ["Unmapped source data", 0, false]) {
    const parsed = await spreadsheet(value);
    assert.equal(parsed.rows[0].cells.length, 2);
    assert(parsed.rows[0].errors.some(e => /no column header/.test(e)));
  }
});
test("XLSX formulas and error cells outside header width remain invalid rows", async () => {
  const formula = await spreadsheet({ formula: "1+1", result: 2 });
  assert(formula.rows[0].errors.some(e => /Formula in column 3/.test(e)));
  const error = await spreadsheet({ error: "#VALUE!" });
  assert(error.rows[0].errors.some(e => /Spreadsheet error/.test(e)));
});
test("formatting-only trailing XLSX cells and normal text identifiers stay compatible", async () => {
  const parsed = await spreadsheet(null, true);
  assert.deepEqual(parsed.rows[0].errors, []);
  assert.equal(parsed.rows[0].cells[0], "SYNTHETIC-ONLY");
});
test("Admin session projection fails closed on malformed or missing assurance policy", () => {
  const valid = { role: "admin", aal: "aal1", mfa_required: true };
  assert.deepEqual(parseSessionAccess(valid), { role: "admin", needsMfa: true });
  assert.equal(parseSessionAccess({ ...valid, aal: "aal2" }).needsMfa, false);
  assert.equal(parseSessionAccess({ ...valid, role: "editor" }).role, "editor");
  for (const value of [null, [], {}, { role: "admin" }, { ...valid, mfa_required: "false" }, { ...valid, aal: "unexpected" }, { ...valid, role: "ordinary" }]) assert.throws(() => parseSessionAccess(value));
});
const config = (): NodeJS.ProcessEnv => {
  const env: NodeJS.ProcessEnv = { ...process.env, STAGING_PROJECT_REF: "synthetic-only", PRODUCTION_PROJECT_REF: "production-deny", PRODUCTION_SITE_ORIGIN: "https://production.test.invalid", ADMIN_ENVIRONMENT: "staging", CATALOG_ENVIRONMENT: "staging", CATALOG_WORKER_ENVIRONMENT: "staging", ADMIN_RATE_LIMIT_SECRET: "0123456789abcdef".repeat(4), ORDER_GATEWAY_SECRET: "abcdef0123456789".repeat(4), CATALOG_WORKER_SECRET: "fedcba9876543210".repeat(4), CATALOG_INDEXING_ENABLED: "false", ANALYTICS_ENABLED: "false", CATALOG_WORKER_ENABLED: "true", ORDER_REQUESTS_ENABLED: "true", CATALOG_WORKER_KEY_ID: "synthetic-worker", ORDER_GATEWAY_KEY_ID: "synthetic-orders" };
  for (const prefix of ["ADMIN", "CATALOG", "CATALOG_WORKER"]) { env[prefix + "_SUPABASE_URL"] = "https://synthetic-only.supabase.co"; env[prefix + "_SITE_ORIGIN"] = "https://staging.test.invalid"; }
  env.ADMIN_SUPABASE_PUBLISHABLE_KEY = env.CATALOG_SUPABASE_PUBLISHABLE_KEY = env.CATALOG_WORKER_PUBLISHABLE_KEY = "synthetic-anon-only";
  return env;
};
const preflight = (env: NodeJS.ProcessEnv) => spawnSync(process.execPath, ["scripts/phase7/check-config.mjs"], { env, encoding: "utf8" });
test("offline preflight rejects normalized production aliases, not just equal URL strings", () => {
  for (const production of ["https://staging.test.invalid/", "https://STAGING.test.invalid:443", "https://staging.test.invalid:443/"]) {
    const result = preflight({ ...config(), PRODUCTION_SITE_ORIGIN: production });
    assert.notEqual(result.status, 0);
    assert(result.stdout.includes("staging and production origins must differ"));
  }
});
test("enabled worker/order capabilities require valid identifiers and diagnostics redact values", () => {
  const valid = config(), good = preflight(valid); assert.equal(good.status, 0, good.stdout);
  for (const key of ["CATALOG_WORKER_KEY_ID", "ORDER_GATEWAY_KEY_ID"]) assert.notEqual(preflight({ ...valid, [key]: "" }).status, 0);
  assert(!good.stdout.includes(valid.CATALOG_WORKER_SECRET!));
});
import { readFileSync } from "node:fs";
test("staging template uses the real disabled trusted-IP selector", () => {
  const template = readFileSync("ops/staging/environment.example", "utf8");
  assert(template.includes("ORDER_TRUSTED_IP_SOURCE=none"));
  assert(!template.includes("ORDER_TRUST_VERCEL_IP="));
});
