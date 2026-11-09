import { z } from "zod";
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null);
const optionalUuid = z
  .string()
  .transform((v) => v || null)
  .pipe(z.uuid().nullable());
const optionalPrice = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || /^\d{1,10}(\.\d{1,2})?$/.test(v),
    "Use a positive price with up to two decimal places",
  )
  .transform((v) => (v === "" ? null : Number(v)))
  .refine((v) => v === null || v > 0, "Price must be positive");
export const loginSchema = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(128),
});
export const productSchema = z.object({
  name: z.string().trim().min(1).max(180),
  slug: z
    .string()
    .max(120)
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Use lowercase words separated by hyphens",
    ),
  sku: optionalText(80),
  model: optionalText(120),
  description: optionalText(20000),
  category_id: optionalUuid,
  brand_id: optionalUuid,
  price: optionalPrice,
  currency: z.literal("PKR"),
  sales_mode: z.enum(["online", "quotation"]),
  stock_status: z.enum(["unknown", "in_stock", "out_of_stock"]),
  stock_quantity: z
    .string()
    .refine(
      (v) => v === "" || /^\d{1,7}$/.test(v),
      "Use a non-negative whole number",
    )
    .transform((v) => (v === "" ? null : Number(v))),
  specifications: z
    .string()
    .max(20000)
    .transform((v, ctx) => {
      try {
        const data = JSON.parse(v || "{}");
        if (
          !data ||
          Array.isArray(data) ||
          typeof data !== "object" ||
          Object.keys(data).length > 100 ||
          Object.values(data).some(
            (x) => typeof x !== "string" || x.length > 2000,
          )
        )
          throw new Error();
        return data as Record<string, string>;
      } catch {
        ctx.addIssue({
          code: "custom",
          message: "Specifications must be a JSON object of text values",
        });
        return z.NEVER;
      }
    }),
  seo_title: optionalText(160),
  seo_description: optionalText(320),
  canonical_path: z
    .string()
    .max(200)
    .refine(
      (v) => v === "" || /^\/product\/[a-z0-9]+(-[a-z0-9]+)*$/.test(v),
      "Use a same-site product path",
    )
    .transform((v) => v || null),
  product_type: optionalText(120),
  finish: optionalText(120),
});
export const versionSchema = z.coerce
  .number()
  .int()
  .positive()
  .max(Number.MAX_SAFE_INTEGER);
export const idSchema = z.uuid();
export const productFields = Object.keys(productSchema.shape);
