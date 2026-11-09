import { productSchema } from "../admin/validation";
import { importFields, type ImportField, type SourceRow } from "./fields";
export function normalizeSku(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toUpperCase();
}
export function suggestedMapping(headers: string[]) {
  const mapping: Record<string, number> = {};
  headers.forEach((h, i) => {
    const key = h.trim().toLowerCase().replace(/[ -]+/g, "_");
    if (importFields.includes(key as ImportField)) mapping[key] = i;
  });
  return mapping;
}
export function normalizeImportRow(
  row: SourceRow,
  mapping: Record<string, number>,
  clearBlanks: boolean,
) {
  const payload: Record<string, unknown> = {};
  const errors: string[] = [];
  for (const [key, index] of Object.entries(mapping)) {
    if (
      !importFields.includes(key as ImportField) ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= row.cells.length
    ) {
      errors.push("Invalid mapped column");
      continue;
    }
    let value = row.cells[index].normalize("NFKC").trim();
    if (!value && !clearBlanks && key !== "sku") continue;
    if (!value && clearBlanks) {
      if (key === "currency") value = "PKR";
      if (key === "stock_status") value = "unknown";
      if (key === "sales_mode") value = "online";
    }
    if (key === "sku") {
      payload.sku = normalizeSku(value);
      if (!payload.sku) errors.push("SKU is required");
      continue;
    }
    if (key === "brand" || key === "category") {
      payload[key] = value || null;
      continue;
    }
    if (key === "image_alt_text") {
      if (value.length > 500)
        errors.push("Image alt text exceeds 500 characters");
      else payload[key] = value || null;
      continue;
    }
    if (key === "model") value = value.replace(/\s+/g, " ");
    if (key === "price" && /^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(value))
      value = value.replaceAll(",", "");
    const field = productSchema.shape[key as keyof typeof productSchema.shape];
    const parsed = field.safeParse(value);
    if (!parsed.success)
      errors.push(
        `${key}: ${parsed.error.issues.map((i) => i.message).join(", ")}`,
      );
    else payload[key] = parsed.data;
  }
  return { payload, errors };
}
