import { z } from "zod";
export const orderStatuses = [
  "received",
  "in_review",
  "awaiting_customer",
  "quoted",
  "closed",
  "cancelled",
] as const;
export const orderKinds = ["order", "quotation", "mixed"] as const;
export function normalizePhone(value: string) {
  const text = value.trim().replace(/[\s()-]/g, "");
  return /^03\d{9}$/.test(text)
    ? `+92${text.slice(1)}`
    : /^923\d{9}$/.test(text)
      ? `+${text}`
      : text;
}
export const selectionSchema = z
  .array(
    z
      .object({
        product_id: z.uuid(),
        quantity: z.number().int().min(1).max(999),
        order_token: z.string().regex(/^[a-f0-9]{64}$/),
      })
      .strict(),
  )
  .min(1)
  .max(50)
  .refine(
    (items) => new Set(items.map((i) => i.product_id)).size === items.length,
    "Duplicate product",
  );
export const requestSchema = z
  .object({
    idempotency_key: z.uuid(),
    customer_name: z.string().trim().min(2).max(100),
    customer_phone: z
      .string()
      .transform(normalizePhone)
      .pipe(z.string().regex(/^\+[1-9]\d{6,14}$/)),
    customer_note: z.string().trim().max(500).default(""),
    consent: z.literal(true),
    intent: z.enum(["order", "quotation"]),
    items: selectionSchema,
  })
  .strict();
export const submissionSchema = z
  .object({
    request: requestSchema,
    challenge: z.string().max(300),
    website: z.literal("").default(""),
  })
  .strict();
export const statusSchema = z
  .object({
    id: z.uuid(),
    version: z.number().int().positive(),
    status: z.enum(orderStatuses),
    note: z.string().trim().max(500).default(""),
    confirm: z.literal(true),
  })
  .strict();
export const searchSchema = z
  .object({
    query: z.string().trim().max(100).default(""),
    status: z.union([z.enum(orderStatuses), z.literal("")]).default(""),
    kind: z.union([z.enum(orderKinds), z.literal("")]).default(""),
    page: z.number().int().min(1).max(10000).default(1),
  })
  .strict();
export type OrderInput = z.infer<typeof requestSchema>;
export type Receipt = {
  reference: string;
  kind: (typeof orderKinds)[number];
  submitted_at: string;
  request_received: true;
};
export type OrderLine = {
  id: string;
  product_id: string;
  quantity: number;
  product_version: number;
  pricing_mode: "listed" | "quotation";
  currency: string;
  unit_price: number | null;
  line_subtotal: number | null;
  product_snapshot: {
    snapshot_version: number;
    name: string;
    slug: string;
    sku: string | null;
    model: string | null;
    availability: string;
    catalog_updated_at: string;
  };
};
export type OrderDetail = {
  id: string;
  reference: string;
  request_kind: (typeof orderKinds)[number];
  request_status: (typeof orderStatuses)[number];
  customer_name: string;
  customer_phone: string;
  customer_note: string | null;
  known_subtotals: Record<string, number>;
  version: number;
  created_at: string;
  items: OrderLine[];
  history: {
    id: string;
    from_status: string | null;
    to_status: string;
    request_version: number;
    note: string | null;
    created_at: string;
  }[];
};
export type OrderRows = {
  rows: Pick<
    OrderDetail,
    | "id"
    | "reference"
    | "request_kind"
    | "request_status"
    | "customer_name"
    | "version"
    | "created_at"
  >[];
  total: number;
  page: number;
  report: {
    received_today: number;
    open_requests: number;
    quotation_requests: number;
    closed_requests: number;
  };
};
