import Link from "next/link";
import { whatsappLink } from "@/lib/storefront/whatsapp";
import styles from "./EmptyCatalog.module.css";

export function EmptyCatalog({ title = "our collections", quotation = false, main, secondary }: {
  title?: string; quotation?: boolean; main?: string; secondary?: string;
}) {
  const text = quotation
    ? "Assalam-o-Alaikum M Murad Sons. Please share today's rates for cement, sand, gravel (bajri) and bricks."
    : `Assalam-o-Alaikum M Murad Sons. Please help me with ${title}, current rates and delivery information.`;
  return <section className={styles.empty} aria-label="Product catalogue information">
    <h2>{quotation ? "Ask for Today’s Building Material Rates" : "Let’s Find What You Need"}</h2>
    <p>{quotation
      ? "Ask our Lahore team for today’s rates for cement, sand, gravel (bajri) and bricks on WhatsApp."
      : "We’re preparing our online product catalogue. Contact our Lahore store for product information, current rates and delivery enquiries."}</p>
    <div className={styles.contacts}>
      <a href={whatsappLink(text, main)} target="_blank" rel="noopener noreferrer">WhatsApp 0321-7165000</a>
      <a href={whatsappLink(text, secondary || "+923086235608")} target="_blank" rel="noopener noreferrer">WhatsApp 0308-6235608</a>
    </div>
    <Link prefetch={false} className={styles.imported} href="/category/imported-products">Explore Imported Kitchen &amp; Bath</Link>
  </section>;
}
