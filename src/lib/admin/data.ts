import "server-only";
import { MfaRequired } from "./assurance";
import { redirect, notFound } from "next/navigation";
import { connection } from "next/server";
import { requestAdminClient } from "./supabase-server";
import {
  requireCatalogActor,
  getAuthorizedProductPreview,
} from "../catalog/server-access";
import { readAdminConfig } from "./config";
import { idSchema } from "./validation";
import type { PublicationStatus, WorkflowRecord } from "../catalog/publication";
export type AdminProduct = WorkflowRecord & {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  model: string | null;
  description: string | null;
  category_id: string | null;
  brand_id: string | null;
  price: number | null;
  currency: string;
  sales_mode: "online" | "quotation";
  stock_status: "unknown" | "in_stock" | "out_of_stock";
  stock_quantity: number | null;
  featured: boolean;
  specifications: Record<string, string>;
  seo_title: string | null;
  seo_description: string | null;
  canonical_path: string | null;
  product_type: string | null;
  finish: string | null;
  price_verified_at: string | null;
  stock_verified_at: string | null;
  indexing_approved: boolean;
  published_at: string | null;
  updated_at: string;
};
export type Taxonomy = {
  id: string;
  name: string;
  slug: string;
  publication_status: PublicationStatus;
  default_sales_mode?: "online" | "quotation";
};
export type GalleryImage = {
  id: string;
  media_id: string;
  sort_order: number;
  alt_text_override: string | null;
  catalog_media: {
    alt_text: string | null;
    mime_type: string;
    is_placeholder: boolean;
    verified_at: string | null;
  };
};
export async function adminPageSession() {
  // Read environment/session at request time even when builds disable admin.
  await connection();
  if (!readAdminConfig()) redirect("/admin/login?notice=disabled");
  const client = await requestAdminClient();
  const user = await client.auth.getUser();
  if (user.error || !user.data.user) redirect("/admin/login");
  let actor;
  try {
    actor = await requireCatalogActor(client, "preview");
  } catch (error) {
    if (error instanceof MfaRequired) redirect("/admin/mfa");
    redirect("/admin/login?notice=access");
  }
  return { client, actor, email: user.data.user.email || "Store team" };
}
export async function taxonomies(
  client: Awaited<ReturnType<typeof requestAdminClient>>,
) {
  const [categories, brands] = await Promise.all([
    client
      .from("categories")
      .select("id,name,slug,publication_status,default_sales_mode")
      .is("archived_at", null)
      .order("name")
      .limit(1000),
    client
      .from("brands")
      .select("id,name,slug,publication_status")
      .is("archived_at", null)
      .order("name")
      .limit(1000),
  ]);
  if (categories.error || brands.error)
    throw new Error("Catalog options unavailable");
  return {
    categories: categories.data as Taxonomy[],
    brands: brands.data as Taxonomy[],
  };
}
export async function adminProduct(id: string) {
  if (!idSchema.safeParse(id).success) notFound();
  const session = await adminPageSession();
  const product = (await getAuthorizedProductPreview(
    session.client,
    id,
  )) as AdminProduct | null;
  if (!product) notFound();
  const [options, gallery, route, revisions] = await Promise.all([
    taxonomies(session.client),
    session.client
      .from("product_images")
      .select(
        "id,media_id,sort_order,alt_text_override,catalog_media(alt_text,mime_type,is_placeholder,verified_at)",
      )
      .eq("product_id", id)
      .is("archived_at", null)
      .order("sort_order"),
    session.client
      .from("catalog_routes_public")
      .select("*")
      .eq("id", id)
      .eq("kind", "product")
      .maybeSingle(),
    session.client
      .from("product_revisions")
      .select("id,revision_no,workflow_state,created_at")
      .eq("product_id", id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);
  if (gallery.error || route.error || revisions.error)
    throw new Error("Product details unavailable");
  return {
    ...session,
    product,
    ...options,
    gallery: gallery.data as unknown as GalleryImage[],
    route: route.data,
    revisions: revisions.data,
  };
}
