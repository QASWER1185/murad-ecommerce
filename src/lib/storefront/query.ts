import type { Query } from "./types";
export type SearchValues = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v) || "";
export function parseQuery(values: SearchValues): Query {
  const many = (key: string) =>
    [
      ...new Set(
        (Array.isArray(values[key]) ? values[key] : [values[key] || ""]).filter(
          Boolean,
        ),
      ),
    ]
      .slice(0, 20)
      .map((v) => String(v).slice(0, 100));
  const price = (key: string) =>
    /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(one(values[key]))
      ? one(values[key])
      : "";
  const number = one(values.page);
  return {
    q: one(values.q).trim().slice(0, 120),
    brand: many("brand"),
    type: many("type"),
    finish: one(values.finish).slice(0, 100),
    availability: ["in_stock", "out_of_stock", "unknown"].includes(
      one(values.availability),
    )
      ? one(values.availability)
      : "",
    min: price("min"),
    max: price("max"),
    sort: ["name", "newest", "price-low", "price-high"].includes(
      one(values.sort),
    )
      ? one(values.sort)
      : "name",
    page: /^\d{1,5}$/.test(number)
      ? Math.max(1, Math.min(10000, Number(number)))
      : 1,
  };
}
export function queryString(query: Query, change: Partial<Query> = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...query, ...change })) {
    if (
      !value ||
      (key === "page" && value === 1) ||
      (key === "sort" && value === "name")
    )
      continue;
    for (const item of Array.isArray(value) ? value : [String(value)])
      params.append(key, item);
  }
  return params.toString();
}
export const filteredQuery = (values: SearchValues) =>
  Object.keys(values).some((k) => k !== "page") || Number(one(values.page)) > 1;
export const money = (value: number, currency = "PKR") =>
  `${currency} ${value.toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;
export const enquiry = (name?: string, number = "+923217165000") =>
  `https://wa.me/${number.replace(/\D/g, "")}${name ? `?text=${encodeURIComponent(`Please confirm the current rate and availability for ${name}.`)}` : ""}`;
export const canOrder = (product: {
  price: number | null;
  sales_mode: string;
  availability: string;
}) =>
  product.sales_mode === "online" &&
  product.price !== null &&
  product.price > 0 &&
  product.availability !== "out_of_stock";
