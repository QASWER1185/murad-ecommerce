import { catalogSessionAccess } from "@/lib/admin/assurance";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, randomBytes } from "node:crypto";
import { readAdminConfig } from "@/lib/admin/config";
import {
  csrfCookie,
  privateHeaders,
  validCsrf,
  validOrigin,
} from "@/lib/admin/security";
import { requestAdminClient } from "@/lib/admin/supabase-server";
import { requireCatalogActor } from "@/lib/catalog/server-access";
import {
  loginSchema,
  productSchema,
  productFields,
  idSchema,
  versionSchema,
} from "@/lib/admin/validation";
const actions = [
  "login",
  "logout",
  "save",
  "submit",
  "review",
  "publish",
  "return-draft",
  "archive",
  "rename",
  "save-alt",
];
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params;
  const config = readAdminConfig();
  const fail = (error: string, status = 400) =>
    NextResponse.json({ error }, { status, headers: privateHeaders });
  if (!config) return fail("Admin access is disabled.", 503);
  if (!actions.includes(action)) return fail("Unknown action.", 404);
  if (!validOrigin(request.headers, config.origin))
    return fail("Request origin rejected.", 403);
  if (
    !(request.headers.get("content-type") || "").startsWith(
      "application/x-www-form-urlencoded",
    )
  )
    return fail("Unsupported form encoding.", 415);
  if (Number(request.headers.get("content-length") || 0) > 65536)
    return fail("Form is too large.", 413);
  const reader = request.body?.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  if (reader)
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > 65536) {
        await reader.cancel();
        return fail("Form is too large.", 413);
      }
      chunks.push(part.value);
    }
  const fields = new URLSearchParams(Buffer.concat(chunks).toString());
  if ([...fields.keys()].some((key, i, all) => all.indexOf(key) !== i))
    return fail("Duplicate form fields are not accepted.");
  const jar = await cookies();
  if (!validCsrf(jar.get(csrfCookie)?.value, fields.get("csrf")))
    return fail(
      "Your security token has expired. Refresh this page and try again.",
      403,
    );
  const ok = (path: string) => {
    if (request.headers.get("accept")?.includes("application/json"))
      return NextResponse.json({ location: path }, { headers: privateHeaders });
    return NextResponse.redirect(new URL(path, config.origin), {
      status: 303,
      headers: privateHeaders,
    });
  };
  const rotateCsrf = () =>
    jar.set(csrfCookie, randomBytes(32).toString("hex"), {
      path: "/admin",
      httpOnly: true,
      sameSite: "strict",
      secure: config.secure,
      maxAge: 3600,
    });
  const client = await requestAdminClient(true);
  if (action === "login") {
    const parsed = loginSchema.safeParse(Object.fromEntries(fields));
    if (!parsed.success)
      return fail("Enter a valid email address and password.", 422);
    const key = createHmac("sha256", config.rateSecret)
      .update(parsed.data.email)
      .digest("hex");
    const limit = await client.rpc("consume_admin_login_attempt", {
      account_key: key,
    });
    if (limit.error)
      return fail("Sign-in protection is unavailable. Please try later.", 503);
    if (limit.data !== true) {
      const response = fail(
        "Too many sign-in attempts. Wait 15 minutes and try again.",
        429,
      );
      response.headers.set("Retry-After", "900");
      return response;
    }
    const result = await client.auth.signInWithPassword(parsed.data);
    if (result.error)
      return request.headers.get("accept")?.includes("application/json")
        ? fail(
            "Unable to sign in. Check your credentials and workspace access.",
            401,
          )
        : ok("/admin/login?notice=login");
    let needsMfa = false;
    try {
      needsMfa = (await catalogSessionAccess(client)).needsMfa;
    } catch {
      await client.auth.signOut({ scope: "local" });
      return request.headers.get("accept")?.includes("application/json")
        ? fail(
            "Unable to sign in. Check your credentials and workspace access.",
            403,
          )
        : ok("/admin/login?notice=login");
    }
    rotateCsrf();
    return ok(needsMfa ? "/admin/mfa" : "/admin");
  }
  if (action === "logout") {
    const result = await client.auth.signOut({ scope: "local" });
    for (const cookie of jar.getAll())
      if (cookie.name.startsWith("murad-admin-session"))
        jar.set(cookie.name, "", {
          path: "/admin",
          maxAge: 0,
          httpOnly: true,
          sameSite: "strict",
          secure: config.secure,
        });
    rotateCsrf();
    if (result.error)
      return fail(
        "The browser session was cleared, but remote session revocation could not be confirmed.",
        503,
      );
    return ok("/admin/login?notice=logout");
  }
  try {
    await requireCatalogActor(client, "manage");
  } catch {
    return fail(
      "Administrator access is required. Sign in again if your session has expired.",
      403,
    );
  }
  const rawId = fields.get("product_id") || "";
  const id = idSchema.safeParse(rawId);
  const version = versionSchema.safeParse(fields.get("version"));
  if (action !== "save" && (!id.success || !version.success))
    return fail("A valid product and current version are required.", 422);
  let error: { code?: string; message: string } | null = null;
  let notice = "";
  if (action === "save") {
    const allowed = [...productFields, "csrf", "product_id", "version"];
    if ([...fields.keys()].some((k) => !allowed.includes(k)))
      return fail("Unsupported product fields.", 422);
    const parsed = productSchema.safeParse(
      Object.fromEntries(
        productFields.map((key) => [key, fields.get(key) ?? ""]),
      ),
    );
    if (!parsed.success)
      return fail(
        parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(" · "),
        422,
      );
    if (rawId && (!id.success || !version.success))
      return fail("A current product version is required.", 422);
    if (!rawId && fields.get("version"))
      return fail("New products cannot supply an existing version.", 422);
    const result = await client.rpc("save_product_draft", {
      product_id: rawId || null,
      expected_version: rawId ? version.data : null,
      input: parsed.data,
    });
    if (!result.error)
      return ok(`/admin/products/${result.data.id}?notice=saved`);
    error = result.error;
  } else {
    const product_id = id.data!;
    const expected_version = version.data!;
    const args = { kind: "product", entity_id: product_id, expected_version };
    if (
      ["publish", "return-draft", "archive", "rename"].includes(action) &&
      fields.get("confirm") !== "on"
    )
      return fail("Explicit confirmation is required.", 422);
    if (action === "save-alt") {
      if (
        !idSchema.safeParse(fields.get("image_id")).success ||
        (fields.get("alt_text") || "").length > 500
      )
        return fail("Invalid image or alt text.", 422);
      const result = await client.rpc("save_product_image_alt", {
        product_id,
        image_id: fields.get("image_id"),
        expected_version,
        alt_text: fields.get("alt_text") || "",
      });
      error = result.error;
      notice = "alt";
    } else if (action === "rename") {
      const slug = fields.get("new_slug") || "";
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 120)
        return fail("Use a clean, descriptive slug.", 422);
      const result = await client.rpc("rename_catalog_slug", {
        ...args,
        new_slug: slug,
      });
      error = result.error;
      notice = "renamed";
    } else if (action === "review") {
      if (fields.get("identity") !== "on" || fields.get("content") !== "on")
        return fail(
          "Confirm genuine product identity and useful content before recording review.",
          422,
        );
      const result = await client.rpc("review_catalog_entity", {
        ...args,
        verification: Object.fromEntries(
          ["identity", "content", "price", "stock"].map((k) => [
            k,
            fields.get(k) === "on",
          ]),
        ),
      });
      error = result.error;
      notice = "reviewed";
    } else {
      const rpc = {
        submit: "submit_catalog_review",
        publish: "publish_catalog_entity",
        "return-draft": "return_catalog_to_draft",
        archive: "archive_catalog_entity",
      }[action];
      if (!rpc) return fail("Unknown action.", 404);
      const result = await client.rpc(rpc, {
        ...args,
        ...(action === "publish"
          ? { approve_indexing: fields.get("approve_indexing") === "on" }
          : {}),
      });
      error = result.error;
      notice = {
        submit: "submitted",
        publish: "published",
        "return-draft": "draft",
        archive: "archived",
      }[action]!;
    }
    if (!error) return ok(`/admin/products/${product_id}?notice=${notice}`);
  }
  if (error?.code === "40001" || error?.message.includes("Stale"))
    return fail(
      "Another change has been saved. Refresh the product before making further changes.",
      409,
    );
  if (error?.code === "23505")
    return fail(
      "This SKU or slug is already in use. Choose a unique value.",
      409,
    );
  if (error?.message.includes("Indexing requirements"))
    return fail(
      "Indexing requirements are incomplete. Publish without indexing approval, or complete verified media, taxonomy, SKU and SEO information first.",
      422,
    );
  if (error?.message.includes("description"))
    return fail(
      "Add and review a useful product description before publication.",
      422,
    );
  if (error?.message.includes("current-version review"))
    return fail(
      "Record an explicit review for this exact version before publication.",
      422,
    );
  return fail(
    "The database rejected this change. Check the current Draft status, product fields, verification and permanent URL rules.",
    422,
  );
}
