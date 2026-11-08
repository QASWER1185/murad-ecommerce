export const importFields = [
  "sku",
  "name",
  "slug",
  "model",
  "description",
  "brand",
  "category",
  "price",
  "currency",
  "stock_status",
  "stock_quantity",
  "sales_mode",
  "product_type",
  "finish",
  "specifications",
  "seo_title",
  "seo_description",
  "image_alt_text",
] as const;
export type ImportField = (typeof importFields)[number];
export type SourceRow = { cells: string[]; errors: string[] };
