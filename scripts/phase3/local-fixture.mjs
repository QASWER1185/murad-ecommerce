// TEST ONLY: loopback Auth/PostgREST HTTP contracts backed by isolated real
// PostgreSQL/RLS. This is not GoTrue/JWT/Storage end-to-end certification.
import { createServer } from "node:http";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { randomUUID, createHmac } from "node:crypto";
import assert from "node:assert/strict";
export const fixtureUsers = {
  admin: "00000000-0000-0000-0000-000000000001",
  editor: "00000000-0000-0000-0000-000000000002",
  ordinary: "00000000-0000-0000-0000-000000000003",
};
export const fixturePassword = "Local-fixture-only-482!";
const literal = (v) =>
  v === null
    ? "NULL"
    : typeof v === "boolean" || typeof v === "number"
      ? String(v)
      : `'${String(typeof v === "object" ? JSON.stringify(v) : v).replaceAll("'", "''")}'`;
export async function startFixture() {
  const container = `murad-phase3-${randomUUID().slice(0, 8)}`;
  const docker = ["--host=unix:///var/run/docker.sock"];
  const env = { ...process.env };
  for (const k of [
    "DOCKER_HOST",
    "DOCKER_CONTEXT",
    "DOCKER_TLS",
    "DOCKER_TLS_VERIFY",
    "DOCKER_CERT_PATH",
  ])
    delete env[k];
  function run(args, input) {
    const r = spawnSync("docker", [...docker, ...args], {
      input,
      env,
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
    });
    if (r.status !== 0) throw new Error(r.stderr || r.stdout);
    return r.stdout.trim();
  }
  function sql(query) {
    return run(
      [
        "exec",
        "-i",
        container,
        "psql",
        "-U",
        "postgres",
        "-qAt",
        "-v",
        "ON_ERROR_STOP=1",
        "-v",
        "VERBOSITY=verbose",
      ],
      query,
    );
  }
  const as = (role, query) =>
    `SET ROLE ${role ? "authenticated" : "anon"}; SET request.jwt.claim.sub=${literal(fixtureUsers[role] || "")}; ${query}`;
  let server;
  try {
    run([
      "run",
      "-d",
      "--name",
      container,
      "--label",
      "murad.phase=3",
      "--network",
      "none",
      "-e",
      "POSTGRES_HOST_AUTH_METHOD=trust",
      "postgres:17-alpine@sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac",
    ]);
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try {
        if (
          run(["logs", container]).includes("init process complete") &&
          sql("SELECT 1;") === "1"
        ) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 400));
    }
    assert(ready, "Local PostgreSQL initialization failed");
    assert.equal(
      run(["inspect", "--format", "{{.HostConfig.NetworkMode}}", container]),
      "none",
    );
    sql(readFileSync("tests/phase2/bootstrap.sql", "utf8"));
    for (const file of readdirSync("supabase/migrations")
      .filter((f) => f.endsWith(".sql"))
      .sort())
      sql(
        `SET app.catalog_cutover_approved='yes'; ${readFileSync(`supabase/migrations/${file}`, "utf8")}`,
      );
    sql(
      `INSERT INTO app_private.user_roles(user_id,role) VALUES (${literal(fixtureUsers.admin)},'admin'),(${literal(fixtureUsers.editor)},'editor');`,
    );
    let assertions = 0;
    const denied = (q, pattern) => {
      assert.throws(() => sql(q), pattern);
      assertions++;
    };
    const check = (q, result) => {
      assert.equal(sql(q), String(result));
      assertions++;
    };
    const payload = {
      name: "RPC local fixture",
      slug: "rpc-local-fixture",
      sku: "RPC-LOCAL",
      specifications: {},
    };
    denied(
      as(
        null,
        `SELECT public.save_product_draft(NULL,NULL,${literal(payload)});`,
      ),
      /permission denied/,
    );
    denied(
      as(
        "ordinary",
        `SELECT public.save_product_draft(NULL,NULL,${literal(payload)});`,
      ),
      /administrator required/,
    );
    denied(
      as(
        "editor",
        `SELECT public.save_product_draft(NULL,NULL,${literal(payload)});`,
      ),
      /administrator required/,
    );
    denied(
      as(
        "admin",
        `INSERT INTO app_private.user_roles VALUES (${literal(fixtureUsers.ordinary)},'admin',now());`,
      ),
      /permission denied/,
    );
    denied(
      as(
        "admin",
        `SELECT public.save_product_draft(NULL,NULL,${literal({ ...payload, publication_status: "published" })});`,
      ),
      /Unsupported product fields/,
    );
    const saved = JSON.parse(
      sql(
        as(
          "admin",
          `SELECT public.save_product_draft(NULL,NULL,${literal(payload)});`,
        ),
      ),
    );
    check(
      `SELECT publication_status='draft' AND price IS NULL AND stock_status='unknown' AND NOT identity_verified AND NOT indexing_approved FROM public.products WHERE id=${literal(saved.id)};`,
      "t",
    );
    denied(
      as(
        "admin",
        `UPDATE public.products SET name='bypass' WHERE id=${literal(saved.id)};`,
      ),
      /permission denied/,
    );
    denied(
      as(
        "admin",
        `SELECT public.save_product_draft(${literal(saved.id)},NULL,${literal(payload)});`,
      ),
      /Stale/,
    );
    denied(
      as(
        "admin",
        `SELECT public.save_product_draft(${literal(saved.id)},0,${literal(payload)});`,
      ),
      /Stale/,
    );
    const changed = JSON.parse(
      sql(
        as(
          "admin",
          `SELECT public.save_product_draft(${literal(saved.id)},${saved.version},${literal({ ...payload, name: "Updated RPC fixture" })});`,
        ),
      ),
    );
    assert(changed.version > saved.version);
    assertions++;
    denied(
      as(
        "admin",
        `SELECT public.save_product_draft(${literal(saved.id)},${saved.version},${literal(payload)});`,
      ),
      /Stale/,
    );
    const image = JSON.parse(
      sql(
        `WITH m AS (INSERT INTO public.catalog_media(object_name,mime_type,alt_text,width,height) VALUES('local-contract-only.png','image/png','Unverified local test metadata',100,100) RETURNING id) INSERT INTO public.product_images(product_id,media_id) SELECT ${literal(saved.id)},id FROM m RETURNING to_jsonb(product_images);`,
      ),
    );
    const galleryVersion = Number(
      sql(`SELECT version FROM public.products WHERE id=${literal(saved.id)};`),
    );
    denied(
      as(
        "editor",
        `SELECT public.save_product_image_alt(${literal(saved.id)},${literal(image.id)},${galleryVersion},'Changed');`,
      ),
      /administrator required/,
    );
    denied(
      as(
        "admin",
        `SELECT public.save_product_image_alt(${literal(saved.id)},${literal(image.id)},0,'Changed');`,
      ),
      /Stale/,
    );
    sql(
      as(
        "admin",
        `SELECT public.save_product_image_alt(${literal(saved.id)},${literal(image.id)},${galleryVersion},'Useful local image description');`,
      ),
    );
    check(
      `SELECT alt_text_override FROM public.product_images WHERE id=${literal(image.id)};`,
      "Useful local image description",
    );
    check(
      `SELECT version>${galleryVersion} AND NOT content_verified FROM public.products WHERE id=${literal(saved.id)};`,
      "t",
    );
    check(
      `SET ROLE anon; SELECT count(*) FROM public.catalog_images_public;`,
      0,
    );
    denied(
      as(
        "ordinary",
        `SELECT public.catalog_admin_preview(${literal(saved.id)});`,
      ),
      /Authorized catalog preview/,
    );
    check(
      as(
        "editor",
        `SELECT public.catalog_admin_preview(${literal(saved.id)})->>'name';`,
      ),
      "Updated RPC fixture",
    );
    check(
      "SET ROLE anon; SELECT count(*) FROM public.catalog_products_public;",
      0,
    );
    for (let i = 0; i < 5; i++)
      check(
        `SET ROLE anon; SELECT public.consume_admin_login_attempt('${"a".repeat(64)}');`,
        "t",
      );
    check(
      `SET ROLE anon; SELECT public.consume_admin_login_attempt('${"a".repeat(64)}');`,
      "f",
    );
    check(
      `SET ROLE anon; SELECT public.consume_admin_login_attempt('not-a-hash');`,
      "f",
    );
    denied(
      "SET ROLE anon; SELECT * FROM app_private.admin_login_windows;",
      /permission denied/,
    );
    sql("TRUNCATE app_private.admin_login_windows;");
    sql(
      as(
        "admin",
        `SELECT public.archive_catalog_entity('product',${literal(saved.id)},${Number(sql(`SELECT version FROM public.products WHERE id=${literal(saved.id)};`))});`,
      ),
    );
    const sessions = new Map();
    const refreshes = new Map();
    let refreshCount = 0;
    function issue(role, expired = false) {
      const user = {
        id: fixtureUsers[role],
        aud: "authenticated",
        role: "authenticated",
        email: `${role}@murad.test`,
        email_confirmed_at: "2026-01-01T00:00:00Z",
        app_metadata: { provider: "email", providers: ["email"] },
        user_metadata: { role: "admin" },
        created_at: "2026-01-01T00:00:00Z",
      };
      const now = Math.floor(Date.now() / 1000);
      const head = Buffer.from(
        JSON.stringify({ alg: "HS256", typ: "JWT" }),
      ).toString("base64url");
      const body = Buffer.from(
        JSON.stringify({
          sub: user.id,
          role: "authenticated",
          aud: "authenticated",
          exp: expired ? now - 100 : now + 3600,
          iat: now - 200,
          session_id: randomUUID(),
        }),
      ).toString("base64url");
      const token = `${head}.${body}.${createHmac("sha256", "test-only-not-a-real-supabase-secret").update(`${head}.${body}`).digest("base64url")}`;
      const refresh = randomUUID();
      sessions.set(token, { role, user });
      refreshes.set(refresh, role);
      return {
        access_token: token,
        refresh_token: refresh,
        token_type: "bearer",
        expires_in: expired ? -100 : 3600,
        expires_at: expired ? now - 100 : now + 3600,
        user,
      };
    }
    server = createServer(async (req, res) => {
      res.setHeader("Content-Type", "application/json");
      const url = new URL(req.url, "http://127.0.0.1");
      const bearer = (req.headers.authorization || "").replace(/^Bearer /, "");
      const session = sessions.get(bearer);
      const role = session?.role;
      const send = (status, data) => {
        res.statusCode = status;
        res.end(JSON.stringify(data));
      };
      try {
        let raw = "";
        for await (const chunk of req) {
          raw += chunk;
          if (raw.length > 100000) throw new Error("Oversize test request");
        }
        const body = raw ? JSON.parse(raw) : {};
        if (url.pathname === "/auth/v1/token") {
          if (url.searchParams.get("grant_type") === "refresh_token") {
            const r = refreshes.get(body.refresh_token);
            if (!r) return send(400, { msg: "Invalid refresh token" });
            refreshCount++;
            refreshes.delete(body.refresh_token);
            return send(200, issue(r));
          }
          const r = Object.keys(fixtureUsers).find(
            (r) => body.email === `${r}@murad.test`,
          );
          if (!r || body.password !== fixturePassword)
            return send(400, {
              msg: "Invalid login credentials",
              error_code: "invalid_credentials",
            });
          return send(200, issue(r));
        }
        if (url.pathname === "/auth/v1/user")
          return session
            ? send(200, session.user)
            : send(401, { msg: "Invalid session", error_code: "bad_jwt" });
        if (url.pathname === "/auth/v1/logout") {
          sessions.delete(bearer);
          for (const [token, r] of refreshes)
            if (r === role) refreshes.delete(token);
          return send(200, {});
        }
        if (!url.pathname.startsWith("/rest/v1/"))
          return send(404, { message: "Not found" });
        const endpoint = url.pathname.slice("/rest/v1/".length);
        if (endpoint.startsWith("rpc/")) {
          const fn = endpoint.slice(4);
          if (
            !/^(current_catalog_role|catalog_admin_preview|consume_admin_login_attempt|save_product_draft|save_product_image_alt|submit_catalog_review|review_catalog_entity|publish_catalog_entity|return_catalog_to_draft|archive_catalog_entity|rename_catalog_slug)$/.test(
              fn,
            )
          )
            return send(404, { message: "RPC not available" });
          const args = Object.entries(body)
            .map(([k, v]) => {
              if (!/^[a-z_]+$/.test(k)) throw new Error("Invalid argument");
              return `${k}=>${literal(v)}`;
            })
            .join(",");
          const result = sql(
            as(
              role,
              `SELECT coalesce(to_jsonb(public.${fn}(${args}))::text,'null');`,
            ),
          );
          return send(200, JSON.parse(result || "null"));
        }
        if (
          ![
            "products",
            "categories",
            "brands",
            "product_images",
            "product_revisions",
            "catalog_routes_public",
            "import_jobs",
            "site_settings",
          ].includes(endpoint) ||
          !["GET", "HEAD"].includes(req.method)
        )
          return send(403, { message: "Not permitted" });
        const select = url.searchParams.get("select") || "*";
        let selection;
        if (endpoint === "product_images")
          selection = "t.*,to_jsonb(m) AS catalog_media";
        else {
          if (!/^(?:\*|[a-z_,]+)$/.test(select))
            throw new Error("Invalid selection");
          selection =
            select === "*"
              ? "t.*"
              : select
                  .split(",")
                  .map((s) => `t.${s}`)
                  .join(",");
        }
        let from = `public.${endpoint} t`;
        if (endpoint === "product_images")
          from += " JOIN public.catalog_media m ON m.id=t.media_id";
        const predicates = [];
        for (const [k, v] of url.searchParams) {
          if (["select", "order", "offset", "limit"].includes(k)) continue;
          if (k === "or") {
            const match = v.match(
              /^\(name\.ilike\.\*(.*?)\*,sku\.ilike\.\*.*\*,model\.ilike\.\*.*\*\)$/,
            );
            if (!match) throw new Error("Invalid fixture search");
            predicates.push(
              `(t.name ILIKE ${literal("%" + match[1] + "%")} OR t.sku ILIKE ${literal("%" + match[1] + "%")} OR t.model ILIKE ${literal("%" + match[1] + "%")})`,
            );
            continue;
          }
          if (!/^[a-z_]+$/.test(k)) throw new Error("Invalid filter");
          if (v === "is.null") predicates.push(`t.${k} IS NULL`);
          else if (v.startsWith("eq."))
            predicates.push(`t.${k}=${literal(v.slice(3))}`);
          else throw new Error("Unsupported filter");
        }
        const where = predicates.length
          ? " WHERE " + predicates.join(" AND ")
          : "";
        const order = (url.searchParams.get("order") || "")
          .split(",")
          .filter(Boolean)
          .map((v) => {
            const [key, dir] = v.split(".");
            if (!/^[a-z_]+$/.test(key) || !["asc", "desc"].includes(dir))
              throw new Error("Invalid order");
            return `t.${key} ${dir}`;
          })
          .join(",");
        const offset = Math.max(0, Number(url.searchParams.get("offset") || 0));
        const limit = Math.min(
          1000,
          Math.max(1, Number(url.searchParams.get("limit") || 1000)),
        );
        if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(limit))
          throw new Error("Invalid range");
        const count = sql(as(role, `SELECT count(*) FROM ${from}${where};`));
        res.setHeader(
          "Content-Range",
          `${offset}-${Math.max(offset, offset + limit - 1)}/${count}`,
        );
        if (req.method === "HEAD") {
          res.statusCode = 200;
          return res.end();
        }
        const result = sql(
          as(
            role,
            `SELECT coalesce(jsonb_agg(row),'[]'::jsonb) FROM (SELECT ${selection} FROM ${from}${where}${order ? " ORDER BY " + order : ""} LIMIT ${limit} OFFSET ${offset}) row;`,
          ),
        );
        const rows = JSON.parse(result);
        return send(
          200,
          req.headers.accept?.includes("vnd.pgrst.object")
            ? rows[0] || null
            : rows,
        );
      } catch (e) {
        const code = e.message.match(/ERROR:\s+([A-Z0-9]{5}):/)?.[1] || "P0001";
        return send(code === "42501" ? 403 : 400, {
          code,
          message:
            e.message
              .split("\n")
              .find((s) => s.includes("ERROR:"))
              ?.replace(/^ERROR:\s+[A-Z0-9]+:\s*/, "") ||
            "Local contract request failed",
        });
      }
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    return {
      url: `http://127.0.0.1:${server.address().port}`,
      sql,
      as,
      literal,
      assertions,
      issue,
      get refreshCount() {
        return refreshCount;
      },
      resetLimits: () => sql("TRUNCATE app_private.admin_login_windows;"),
      close: async () => {
        await new Promise((r) => server.close(r));
        run(["rm", "-f", "-v", container]);
      },
    };
  } catch (e) {
    if (server) server.close();
    run(["rm", "-f", "-v", container]);
    throw e;
  }
}
