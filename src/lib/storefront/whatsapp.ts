// Verified business contacts; published site settings override these fallbacks.
export const MAIN_WHATSAPP = "+923217165000";
export const SECONDARY_WHATSAPP = "+923086235608";
const publicStoreOrigin = "https://murad-ecommerce.vercel.app";

export function whatsappNumber(number = MAIN_WHATSAPP): string {
  let digits = number.replace(/[\s()+-]/g, "");
  if (/^03\d{9}$/.test(digits)) digits = `92${digits.slice(1)}`;
  return /^[1-9]\d{6,14}$/.test(digits)
    ? digits
    : MAIN_WHATSAPP.slice(1);
}

export function whatsappLink(text?: string, number = MAIN_WHATSAPP): string {
  return `https://wa.me/${whatsappNumber(number)}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export type InquiryProduct = {
  name: string;
  slug: string;
  sku?: string | null;
  sales_mode?: string;
};

export function productLink(slug: string, origin = publicStoreOrigin): string {
  let base = publicStoreOrigin;
  try {
    const url = new URL(origin);
    if (["https:", "http:"].includes(url.protocol) && !url.username && !url.password)
      base = url.origin;
  } catch {}
  return new URL(`/product/${encodeURIComponent(slug)}`, base).href;
}

export function productInquiryText(product: InquiryProduct, origin?: string) {
  return [
    product.sales_mode === "quotation"
      ? "Assalam-o-Alaikum M Murad Sons. Please share today's rate for:"
      : "Assalam-o-Alaikum M Murad Sons. I would like to enquire about:",
    product.name,
    ...(product.sku?.trim() ? [`SKU: ${product.sku.trim()}`] : []),
    productLink(product.slug, origin),
    "Please confirm availability and delivery details.",
  ].join("\n");
}

export function productInquiry(product: InquiryProduct, number?: string, origin?: string) {
  return whatsappLink(productInquiryText(product, origin), number);
}
