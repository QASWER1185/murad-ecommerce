import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
export async function orderDatabaseTests(f, s, o) {
  let checks = 0;
  const check = (value, message) => {
      assert(value, message);
      checks++;
    },
    denied = (fn, pattern) => {
      assert.throws(fn, pattern);
      checks++;
    };
  const q = f.literal;
  const payload = o.body();
  const args = o.envelope(payload);
  denied(
    () =>
      s.rpc(
        "order_request_gateway",
        { ...args, p_signature: "0".repeat(64) },
        null,
      ),
    /GATEWAY_DENIED/,
  );
  denied(
    () =>
      s.rpc(
        "order_request_gateway",
        o.envelope(payload, { issued: Math.floor(Date.now() / 1000) - 300 }),
        null,
      ),
    /GATEWAY_EXPIRED/,
  );
  denied(
    () =>
      s.rpc(
        "order_request_gateway",
        {
          ...args,
          p_envelope: args.p_envelope.replace("Local guest", "Forged guest"),
        },
        null,
      ),
    /GATEWAY_DENIED/,
  );
  check(
    f.sql(
      `SELECT app_private.order_hmac('unicode پاکستان test','${o.secret}');`,
    ) ===
      createHmac("sha256", o.secret)
        .update("unicode پاکستان test")
        .digest("hex"),
    "Node/SQL signature interop",
  );
  const receipt = o.submit(payload);
  check(/^MMS-\d{8}-[A-F0-9]{12}$/.test(receipt.reference), "unique reference");
  check(
    receipt.request_received === true && receipt.kind === "order",
    "request is not an accepted purchase",
  );
  check(
    !JSON.stringify(receipt).includes(payload.customer_phone),
    "public receipt excludes customer data",
  );
  const id = f.sql(
    `SELECT id FROM public.order_requests WHERE reference=${q(receipt.reference)};`,
  );
  const detail = s.rpc("admin_order_request", { p_id: id });
  check(
    Number(detail.items[0].unit_price) === 100 &&
      Number(detail.items[0].line_subtotal) === 200,
    "server-calculated price snapshot",
  );
  check(
    detail.items[0].product_version > 0 &&
      detail.items[0].product_snapshot.snapshot_version === 1,
    "versioned immutable snapshot",
  );
  check(Number(detail.known_subtotals.PKR) === 200, "known subtotal only");
  check(
    o.submit(payload).reference === receipt.reference,
    "replay returns the same receipt",
  );
  check(
    f.sql(
      `SELECT count(*) FROM public.order_requests WHERE reference=${q(receipt.reference)};`,
    ) === "1",
    "no duplicate row",
  );
  denied(
    () => o.submit({ ...payload, customer_name: "Different local customer" }),
    /IDEMPOTENCY_CONFLICT/,
  );
  denied(
    () => o.submit(payload, { guest: "expired-or-different-guest" }),
    /IDEMPOTENCY_CONFLICT/,
  );
  check(
    f.sql(
      `SELECT count(*) FROM public.order_requests WHERE idempotency_key='${payload.idempotency_key}';`,
    ) === "1",
    "intent key cannot duplicate after guest-cookie rotation",
  );
  const recovered = s.rpc(
    "order_request_gateway",
    o.envelope(
      { idempotency_key: payload.idempotency_key },
      { action: "receipt" },
    ),
    null,
  );
  check(
    recovered.reference === receipt.reference,
    "same guest recovers receipt",
  );
  check(
    s.rpc(
      "order_request_gateway",
      o.envelope(
        { idempotency_key: payload.idempotency_key },
        { action: "receipt", guest: "other-guest" },
      ),
      null,
    ) === null,
    "other guest cannot retrieve receipt",
  );
  for (const role of [null, "ordinary", "editor"]) {
    denied(
      () => s.rpc("admin_order_request", { p_id: id }, role),
      /permission denied|administrator required/,
    );
    denied(
      () => s.rpc("admin_order_requests", { p_filters: {} }, role),
      /permission denied|administrator required/,
    );
    denied(
      () =>
        s.rpc(
          "update_order_request_status",
          {
            p_id: id,
            p_version: 1,
            p_status: "in_review",
            p_note: "",
            p_confirm: true,
          },
          role,
        ),
      /permission denied|administrator required/,
    );
  }
  for (const table of [
    "order_requests",
    "order_request_items",
    "order_request_events",
  ]) {
    denied(
      () => f.sql(f.as(null, `SELECT * FROM public.${table};`)),
      /permission denied/,
    );
    check(
      f.sql(f.as("editor", `SELECT count(*) FROM public.${table};`)) === "0",
      "Editor cannot read customer data",
    );
    denied(
      () => f.sql(f.as("admin", `UPDATE public.${table} SET id=id;`)),
      /permission denied/,
    );
  }
  denied(
    () => f.sql(f.as("admin", "SELECT * FROM app_private.order_gateway_keys;")),
    /permission denied/,
  );
  denied(
    () => f.sql(f.as(null, "SELECT * FROM app_private.order_rate_windows;")),
    /permission denied/,
  );
  denied(
    () =>
      s.rpc("update_order_request_status", {
        p_id: id,
        p_version: 1,
        p_status: "closed",
        p_note: "",
        p_confirm: false,
      }),
    /CONFIRMATION/,
  );
  denied(
    () =>
      s.rpc("update_order_request_status", {
        p_id: id,
        p_version: 1,
        p_status: "purchase",
        p_note: "",
        p_confirm: true,
      }),
    /TRANSITION/,
  );
  s.rpc("update_order_request_status", {
    p_id: id,
    p_version: 1,
    p_status: "in_review",
    p_note: "Local staff review",
    p_confirm: true,
  });
  denied(
    () =>
      s.rpc("update_order_request_status", {
        p_id: id,
        p_version: 1,
        p_status: "closed",
        p_note: "",
        p_confirm: true,
      }),
    /STALE_VERSION/,
  );
  const races = await Promise.allSettled(
    ["closed", "cancelled"].map((status) =>
      f.asyncSql(
        f.as(
          "admin",
          `SELECT public.update_order_request_status('${id}',2,'${status}','Concurrent local test',true);`,
        ),
      ),
    ),
  );
  check(
    races.filter((r) => r.status === "fulfilled").length === 1,
    "concurrent status updates cannot overwrite",
  );
  check(
    s.rpc("admin_order_request", { p_id: id }).history.length === 3,
    "append-only activity history",
  );
  o.resetLimits();
  const concurrentBody = o.body(),
    parallel = o.envelope(concurrentBody);
  const receipts = await Promise.all([
    f.asyncSql(f.as(null, o.sqlGateway(parallel))),
    f.asyncSql(f.as(null, o.sqlGateway(parallel))),
  ]);
  check(
    JSON.parse(receipts[0]).reference === JSON.parse(receipts[1]).reference,
    "concurrent submissions are idempotent",
  );
  check(
    f.sql(
      `SELECT count(*) FROM public.order_requests WHERE idempotency_key='${concurrentBody.idempotency_key}';`,
    ) === "1",
    "one concurrent request row",
  );
  o.resetLimits();
  const quote = o.submit(o.body([s.products[15]]));
  check(quote.kind === "quotation", "daily-rate products create quotations");
  const qid = f.sql(
    `SELECT id FROM public.order_requests WHERE reference=${q(quote.reference)};`,
  );
  const qdetail = s.rpc("admin_order_request", { p_id: qid });
  check(
    qdetail.items[0].unit_price === null &&
      qdetail.items[0].line_subtotal === null,
    "quotation has no fixed checkout price",
  );
  check(
    Object.keys(qdetail.known_subtotals).length === 0,
    "no invented zero quotation total",
  );
  const mixed = o.submit(o.body([s.products[0], s.products[1]]));
  check(mixed.kind === "mixed", "unpriced products require quotation");
  const forced = o.submit(o.body([s.products[0]], { intent: "quotation" }));
  check(
    forced.kind === "quotation",
    "explicit quotation request does not become fixed-price order",
  );
  check(
    o.submit(o.body([s.products[2]])).error === "ORDER_UNAVAILABLE",
    "verified out-of-stock item rejected",
  );
  const invalid = o.body();
  invalid.items[0].quantity = 1000;
  check(
    o.submit(invalid).error === "ORDER_INVALID_SELECTION",
    "quantity bounded in database",
  );
  o.resetLimits();
  const priceAttack = o.body();
  priceAttack.items[0].price = 1;
  check(
    o.submit(priceAttack).error === "ORDER_INVALID_SELECTION",
    "client-submitted price never trusted",
  );
  o.resetLimits();
  const stale = o.body();
  const pid = s.products[0].id;
  s.rpc("return_catalog_to_draft", {
    kind: "product",
    entity_id: pid,
    expected_version: s.version("products", pid),
  });
  check(
    o.submit(stale).error === "ORDER_UNAVAILABLE",
    "withdrawn product rejected",
  );
  s.publish("product", pid, { price: true, index: true });
  check(
    o.submit(stale).error === "ORDER_SELECTION_CHANGED",
    "changed publication requires fresh review",
  );
  const previous = s.rpc("admin_order_request", { p_id: id });
  check(
    Number(previous.items[0].unit_price) === 100,
    "catalog withdrawal does not overwrite history",
  );
  o.resetLimits();
  const locked = o.body();
  const update = f.asyncSql(
    f.as(
      "admin",
      `BEGIN;SELECT public.return_catalog_to_draft('product','${pid}',${s.version("products", pid)});SELECT pg_sleep(0.8);COMMIT;`,
    ),
  );
  let observed = false;
  for (let i = 0; i < 30; i++) {
    if (
      Number(
        f.sql(
          "SELECT count(*) FROM pg_locks WHERE relation='public.products'::regclass AND mode='RowExclusiveLock' AND pid<>pg_backend_pid();",
        ),
      ) > 0
    ) {
      observed = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 20));
  }
  check(observed, "concurrent catalog mutation lock observed");
  const afterLock = await f.asyncSql(
    f.as(null, o.sqlGateway(o.envelope(locked))),
  );
  await update;
  check(
    JSON.parse(afterLock).error === "ORDER_UNAVAILABLE",
    "blocked request rechecks withdrawal after concurrent commit",
  );
  s.publish("product", pid, { price: true, index: true });
  o.resetLimits();
  let last;
  for (let i = 0; i < 6; i++) last = o.submit(o.body());
  check(last.error === "ORDER_RATE_LIMIT", "durable guest/contact rate limit");
  check(
    f.sql(
      `SELECT count(*) FROM app_private.audit_log WHERE entity_type='order_requests' AND concat(before_data,after_data) LIKE '%12025550123%';`,
    ) === "0",
    "audit metadata excludes customer contact",
  );
  check(
    s.rpc("admin_order_requests", { p_filters: { query: receipt.reference } })
      .total === 1,
    "private reference search",
  );
  check(
    s.rpc("admin_order_requests", { p_filters: { query: "Local guest" } })
      .total > 0,
    "private customer search",
  );
  check(
    f.sql(
      "SELECT count(*) FROM public.products WHERE sku IS NULL AND publication_status='published';",
    ) === "0",
    "legacy samples remain private",
  );
  console.log(
    `Phase 6 PostgreSQL: ${checks} signature, RLS, snapshot, idempotency, quotation, concurrency and audit assertions passed.`,
  );
  return checks;
}
