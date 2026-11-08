import { NextRequest, NextResponse } from "next/server";
import {
  mutationSession,
  readBounded,
  checked,
  requestError,
  AdminRequestError,
} from "@/lib/admin/request";
import { validCsrf, privateHeaders } from "@/lib/admin/security";
import { idSchema, versionSchema } from "@/lib/admin/validation";
import { z } from "zod";
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null);
const common = {
  name: z.string().trim().min(1).max(180),
  slug: z
    .string()
    .max(120)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  description: text(20000),
  seo_title: text(160),
  seo_description: text(320),
  canonical_path: z
    .string()
    .max(200)
    .refine((v) => !v || /^\/(brand|category)\/[a-z0-9]+(-[a-z0-9]+)*$/.test(v))
    .transform((v) => v || null),
};
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    const { client, csrf } = await mutationSession(request);
    const fields = new URLSearchParams(
      (await readBounded(request, 65536)).toString(),
    );
    if (!validCsrf(csrf, fields.get("csrf")))
      throw new AdminRequestError(
        "Security token expired. Refresh this page.",
        403,
      );
    const { action } = await params;
    const value = (key: string) => fields.get(key) || "";
    const input = Object.fromEntries(fields);
    const kind = value("kind");
    const id = value("id") ? idSchema.parse(value("id")) : null;
    const version = value("version")
      ? versionSchema.parse(value("version"))
      : null;
    let location = "/admin/catalog";
    if (action === "featured") {
      if (!id || !version) throw new AdminRequestError('A product and current version are required.');
      checked(await client.rpc('set_catalog_product_featured', {p_id:id,p_version:version,p_featured:value('featured')==='on'}));
      location = `/admin/products/${id}`;
    } else if (action === "taxonomy") {
      if (!["brand", "category"].includes(kind))
        throw new AdminRequestError("Invalid taxonomy.");
      const parsed =
        kind === "brand"
          ? z
              .object({
                ...common,
                kind: z.enum(["manufacturer", "collection"]),
              })
              .parse({ ...input, kind: value("brand_kind") })
          : z
              .object({
                ...common,
                parent_id: z
                  .string()
                  .transform((v) => v || null)
                  .pipe(z.uuid().nullable()),
                default_sales_mode: z.enum(["online", "quotation"]),
              })
              .parse(input);
      const saved = checked(
        await client.rpc("save_catalog_taxonomy", {
          p_kind: kind,
          p_id: id,
          p_version: version,
          p_input: parsed,
        }),
      );
      location = `/admin/catalog/${kind}/${saved}`;
    } else if (action === "workflow") {
      if (!id || !version || !["brand", "category"].includes(kind))
        throw new AdminRequestError(
          "A taxonomy and current version are required.",
        );
      const operation = value("operation");
      const args = { kind, entity_id: id, expected_version: version };
      if (
        ["publish", "return-draft", "archive", "rename"].includes(operation) &&
        value("confirm") !== "on"
      )
        throw new AdminRequestError("Explicit confirmation required.");
      if (operation === "review") {
        if (value("identity") !== "on" || value("content") !== "on")
          throw new AdminRequestError(
            "Verify genuine identity and useful content.",
          );
        checked(
          await client.rpc("review_catalog_entity", {
            ...args,
            verification: { identity: true, content: true },
          }),
        );
      } else if (operation === "publish")
        checked(
          await client.rpc("publish_catalog_entity", {
            ...args,
            approve_indexing: value("approve_indexing") === "on",
          }),
        );
      else if (operation === "rename") {
        const slug = z
          .string()
          .max(120)
          .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
          .parse(value("new_slug"));
        checked(
          await client.rpc("rename_catalog_slug", { ...args, new_slug: slug }),
        );
      } else {
        const rpc = {
          submit: "submit_catalog_review",
          "return-draft": "return_catalog_to_draft",
          archive: "archive_catalog_entity",
        }[operation];
        if (!rpc) throw new AdminRequestError("Unknown workflow operation.");
        checked(await client.rpc(rpc, args));
      }
      location = `/admin/catalog/${kind}/${id}`;
    } else if (action === "banner") {
      const parsed = z
        .object({
          title: z.string().trim().min(1).max(180),
          subtitle: text(1000),
          cta_label: text(100),
          cta_path: z
            .string()
            .refine((v) => !v || /^\/([a-zA-Z0-9/-]*)?$/.test(v))
            .transform((v) => v || null),
          sort_order: z.coerce.number().int().min(0).max(10000),
        })
        .parse(input);
      const saved = checked(
        await client.rpc("save_catalog_banner", {
          p_id: id,
          p_version: version,
          p_input: parsed,
        }),
      );
      location = `/admin/media?banner=${saved}`;
    } else if (action === "banner-active") {
      if (!id || !version || value("confirm") !== "on")
        throw new AdminRequestError("Explicit banner approval required.");
      checked(
        await client.rpc("set_catalog_banner_active", {
          p_id: id,
          p_version: version,
          p_active: value("active") === "true",
        }),
      );
      location = `/admin/media?banner=${id}`;
    } else if (action === "restore-product") {
      if (!id || !version || value("confirm") !== "on")
        throw new AdminRequestError(
          "A current Draft and explicit restoration approval are required.",
        );
      checked(
        await client.rpc("restore_product_revision", {
          p_id: id,
          p_version: version,
          p_revision: idSchema.parse(value("revision_id")),
        }),
      );
      location = `/admin/products/${id}`;
    } else if (action === "settings") {
      const phone = (v: string) => {
        const digits = v.replace(/[\s()-]/g, "");
        return digits.startsWith("0") ? "+92" + digits.slice(1) : digits;
      };
      const parsed = z
        .object({
          business_name: z.string().trim().min(1).max(180),
          street_address: z.string().trim().min(1).max(500),
          city: z.string().trim().min(1).max(100),
          country_code: z.literal("PK"),
          main_whatsapp: z
            .string()
            .transform(phone)
            .pipe(z.string().regex(/^\+92\d{10}$/)),
          secondary_whatsapp: z
            .string()
            .transform(phone)
            .pipe(z.string().regex(/^\+92\d{10}$/)),
        })
        .parse(input);
      checked(
        await client.rpc("save_catalog_settings", {
          p_version: version,
          p_input: parsed,
          p_approve_public: value("approve_public") === "on",
        }),
      );
      location = "/admin/settings?notice=saved";
    } else throw new AdminRequestError("Unknown management action.", 404);
    return NextResponse.json({ location }, { headers: privateHeaders });
  } catch (error) {
    return requestError(error);
  }
}
