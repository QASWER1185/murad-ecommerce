import type { PublicRoute, PublicProduct } from "../catalog/publication";
export type Media = {
  media_id: string;
  alt_text: string;
  width: number;
  height: number;
  sort_order?: number;
};
export type Taxonomy = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id?: string | null;
  is_indexable: boolean;
  seo_title: string | null;
  seo_description: string | null;
  canonical_path: string | null;
  updated_at: string;
  asset?: Media | null;
};
export type Product = PublicProduct & {
  product_type: string | null;
  finish: string | null;
  specifications: Record<string, string>;
  featured: boolean;
  published_at: string;
  updated_at: string;
  brand: Taxonomy | null;
  category: Taxonomy | null;
  gallery: Media[];
};
export type Settings = {
  business_name: string;
  street_address: string;
  city: string;
  country_code: string;
  main_whatsapp: string;
  secondary_whatsapp: string;
};
export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  cta_label: string | null;
  cta_path: string | null;
  media_id: string;
  asset: Media;
};
export type Catalog = {
  entity: Taxonomy | Product | null;
  route: PublicRoute | null;
  products: Product[];
  total: number;
  page: number;
  pages: number;
  brands: Taxonomy[];
  categories: Taxonomy[];
  types: string[];
  finishes: string[];
  settings: Settings | null;
  banners: Banner[];
  generation: string;
  mediaEnabled: boolean;
  ordersEnabled?: boolean;
};
export type Query = {
  q: string;
  brand: string[];
  type: string[];
  finish: string;
  availability: string;
  min: string;
  max: string;
  sort: string;
  page: number;
};
