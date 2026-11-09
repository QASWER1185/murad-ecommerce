import { productInquiry, whatsappLink, type InquiryProduct } from "@/lib/storefront/whatsapp";
import styles from "./WhatsApp.module.css";

export function WhatsAppInquiry({ product, number, origin, className = "" }: {
  product: InquiryProduct;
  number?: string;
  origin?: string;
  className?: string;
}) {
  return <a
    className={`${styles.inquiry} ${className}`}
    href={productInquiry(product, number, origin)}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={`WhatsApp inquiry for ${product.name}`}
  >{product.sales_mode === "quotation" ? "WhatsApp Today’s Rate" : "WhatsApp Inquiry"}</a>;
}

export function WhatsAppContact({ number }: { number?: string }) {
  return <a
    className={styles.contact}
    href={whatsappLink("Assalam-o-Alaikum M Murad Sons. I need help with products, current rates or delivery.", number)}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Contact M Murad Sons on WhatsApp"
  ><span aria-hidden="true" />WhatsApp</a>;
}
