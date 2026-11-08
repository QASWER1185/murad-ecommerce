import { NextRequest, NextResponse } from "next/server";
import { requestAdminClient } from "@/lib/admin/supabase-server";
import { requireCatalogActor } from "@/lib/catalog/server-access";
import {
  multipartMutation,
  jsonMutation,
  checked,
  requestError,
  AdminRequestError,
} from "@/lib/admin/request";
import {
  processImage,
  imageLimit,
  descriptiveFilename,
} from "@/lib/media/images";
import { idSchema, versionSchema } from "@/lib/admin/validation";
import { privateHeaders } from "@/lib/admin/security";
const targetTables = {
  product: "products",
  brand: "brands",
  category: "categories",
  banner: "homepage_banners",
} as const;
export async function GET(request: NextRequest) {
  try {
    const client = await requestAdminClient();
    await requireCatalogActor(client, "preview");
    const kind = request.nextUrl.searchParams.get("kind") || "";
    const id = request.nextUrl.searchParams.get("id");
    if (!Object.hasOwn(targetTables, kind) || !idSchema.safeParse(id).success)
      throw new AdminRequestError("Invalid media target.");
    const target = checked(
      await client
        .from(targetTables[kind as keyof typeof targetTables])
        .select("*")
        .eq("id", id)
        .maybeSingle(),
    );
    if (!target) throw new AdminRequestError("Media target not found.", 404);
    const page = Math.min(
      10000,
      Math.max(
        1,
        Number.parseInt(request.nextUrl.searchParams.get("page") || "1", 10) ||
          1,
      ),
    );
    const columns =
      "id,original_filename,mime_type,alt_text,width,height,is_placeholder,processed_at,verified_at,previous_media_id";
    const library = checked(
      await client
        .from("catalog_media")
        .select(columns)
        .order("created_at", { ascending: false })
        .range((page - 1) * 50, page * 50 - 1),
    );
    const assetId =
      target.logo_media_id || target.hero_media_id || target.media_id;
    const asset = assetId
      ? checked(
          await client
            .from("catalog_media")
            .select(columns)
            .eq("id", assetId)
            .maybeSingle(),
        )
      : null;
    const gallery =
      kind === "product"
        ? checked(
            await client
              .from("product_images")
              .select(
                "id,media_id,sort_order,alt_text_override,archived_at,catalog_media(id,original_filename,alt_text,width,height,is_placeholder,processed_at,verified_at)",
              )
              .eq("product_id", id)
              .order("sort_order")
              .limit(200),
          )
        : [];
    return NextResponse.json(
      { target, gallery, library, asset, page },
      { headers: privateHeaders },
    );
  } catch (error) {
    return requestError(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    const { client, form } = await multipartMutation(
      request,
      imageLimit + 65536,
    );
    const file = form.get("file");
    const id = String(form.get("upload_id") || "");
    const targetId = idSchema.parse(form.get("target_id"));
    const kind = String(form.get("kind"));
    if (
      !idSchema.safeParse(id).success ||
      !(file instanceof File) ||
      !Object.hasOwn(targetTables, kind)
    )
      throw new AdminRequestError("An image and a valid target are required.");
    const version = versionSchema.parse(form.get("version"));
    const replace = String(form.get("replace_image_id") || "");
    const previousMedia = String(form.get("previous_media_id") || "");
    if (replace) idSchema.parse(replace);
    if (previousMedia) idSchema.parse(previousMedia);
    const alt = String(form.get("alt_text") || "").trim();
    if (alt.length > 500)
      throw new AdminRequestError("Alt text must not exceed 500 characters.");
    let image;
    try {
      image = await processImage(
        Buffer.from(await file.arrayBuffer()),
        file.type,
        file.name,
      );
    } catch (error) {
      throw new AdminRequestError(
        error instanceof Error ? error.message : "Invalid image.",
      );
    }
    const path = `media/${id}/original.${image.extension}`;
    const uploads = [
      { object_name: path, bytes: image.bytes, type: image.mime_type },
      ...image.variants.map((v) => ({
        object_name: `media/${id}/${v.variant_key}.webp`,
        bytes: v.bytes,
        type: "image/webp",
      })),
    ];
    for (const upload of uploads) {
      const result = await client.storage
        .from("catalog-private")
        .upload(upload.object_name, upload.bytes, {
          contentType: upload.type,
          cacheControl: "0",
          upsert: false,
        });
      if (result.error)
        throw new AdminRequestError(
          "The private upload could not be completed. Uploaded objects remain private; choose a fresh upload to retry.",
          409,
        );
    }
    checked(
      await client.rpc("register_catalog_media", {
        p_id: id,
        p_manifest: {
          object_name: path,
          mime_type: image.mime_type,
          alt_text: alt,
          width: image.width,
          height: image.height,
          is_placeholder: form.get("genuine") !== "true",
          original_filename: descriptiveFilename(file.name),
          sha256: image.sha256,
          byte_size: image.byte_size,
          previous_media_id: previousMedia || null,
          variants: image.variants.map((v) => ({
            variant_key: v.variant_key,
            width: v.width,
            height: v.height,
            byte_size: v.byte_size,
            sha256: v.sha256,
            object_name: `media/${id}/${v.variant_key}.webp`,
          })),
        },
      }),
    );
    if (kind === "product")
      checked(
        await client.rpc("edit_catalog_gallery", {
          p_product_id: targetId,
          p_version: version,
          p_operation: replace ? "replace" : "attach",
          p_input: { media_id: id, ...(replace ? { image_id: replace } : {}) },
        }),
      );
    else
      checked(
        await client.rpc("attach_catalog_asset", {
          p_kind: kind,
          p_id: targetId,
          p_version: version,
          p_media_id: id,
        }),
      );
    return NextResponse.json(
      {
        media_id: id,
        location:
          kind === "product"
            ? `/admin/products/${targetId}`
            : kind === "banner"
              ? `/admin/media?banner=${targetId}`
              : `/admin/catalog/${kind}/${targetId}`,
      },
      { headers: privateHeaders },
    );
  } catch (error) {
    return requestError(error);
  }
}
export async function PATCH(request: NextRequest) {
  try {
    const { client, input } = await jsonMutation(request);
    const id = idSchema.parse(input.id);
    const version = versionSchema.parse(input.version);
    if (input.operation === "verify") {
      if (input.confirm !== true)
        throw new AdminRequestError(
          "Explicit genuine-image verification is required.",
        );
      checked(
        await client.rpc("verify_catalog_media", {
          media_id: idSchema.parse(input.media_id),
        }),
      );
    } else if (input.operation === "alt" && input.kind === "product")
      checked(
        await client.rpc("save_product_image_alt", {
          product_id: id,
          image_id: idSchema.parse(input.image_id),
          expected_version: version,
          alt_text: String(input.alt_text || "").slice(0, 500),
        }),
      );
    else if (input.operation === "alt")
      checked(
        await client.rpc("save_catalog_asset_alt", {
          p_kind: input.kind,
          p_id: id,
          p_version: version,
          p_alt: String(input.alt_text || "").slice(0, 500),
        }),
      );
    else if (input.kind === "product")
      checked(
        await client.rpc("edit_catalog_gallery", {
          p_product_id: id,
          p_version: version,
          p_operation: input.operation,
          p_input: {
            media_id: input.media_id,
            image_id: input.image_id,
            image_ids: input.image_ids,
          },
        }),
      );
    else
      checked(
        await client.rpc("attach_catalog_asset", {
          p_kind: input.kind,
          p_id: id,
          p_version: version,
          p_media_id: idSchema.parse(input.media_id),
        }),
      );
    return NextResponse.json({ ok: true }, { headers: privateHeaders });
  } catch (error) {
    return requestError(error);
  }
}
