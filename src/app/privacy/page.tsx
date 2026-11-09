import Link from "next/link";
import { Suspense } from "react";
import { Header, Footer } from "@/components/catalog/Chrome";
import { businessCatalog } from "@/lib/storefront/business-site";
import styles from "@/components/sanitary/SanitaryShop.module.css";
import "@/components/catalog/catalog.css";
import { connection } from "next/server";
import { AnalyticsConsent } from "@/components/analytics/Analytics";
import { analyticsConfig } from "@/lib/analytics/config";
export const metadata = {
  title: "Privacy & WhatsApp enquiries | M Murad Sons",
  description: "How M Murad Sons handles business enquiries and WhatsApp contact for the initial empty-catalog website.",
  alternates: { canonical: "https://murad-ecommerce.vercel.app/privacy" },
  robots: { index: false, follow: false },
};
async function Content() {
  await connection();
  const catalog = businessCatalog("search", "");
  return <div className={styles.shop}><Header catalog={catalog} />
    <main className={`${styles.main} business-information`}>
      <section className="business-introduction">
      <Link prefetch={false} href="/">← M Murad Sons</Link>
      <h1>Privacy &amp; WhatsApp enquiries</h1>
      <h2>This business website</h2>
      <p>This release provides store information and WhatsApp enquiry links. It does not offer account registration, checkout or online payments. Product listings are being prepared.</p>
      <h2>Contacting us</h2>
      <p>WhatsApp links open that provider with an optional pre-filled enquiry. A message is sent only when you choose to send it in WhatsApp. Its use is subject to WhatsApp’s own privacy terms.</p>
      <p>Share only the information the store needs to answer your enquiry. Do not send passwords, payment-card details or other sensitive information. Ask the store directly about correcting or removing information you shared.</p>
      <h2>Search and analytics</h2>
      <p>Search terms appear in the page URL. Do not put personal or sensitive information into the search box. Hosting services process requests needed to deliver the website; the store’s optional analytics controls are shown below.</p>
      <AnalyticsConsent configured={!!analyticsConfig()} />
      <h2>Delivery and purchase questions</h2>
      <p>Contact the store to confirm current rates, availability, delivery arrangements and any applicable return terms before purchasing. No return or delivery policy is created by this page.</p>
      <Link href="/contact" className="business-text-link">Contact the store about privacy →</Link>
      </section>
    </main><Footer catalog={catalog} /></div>;
}

export default function Page() {
  return (
    <Suspense fallback={<p>Loading privacy choices…</p>}>
      <Content />
    </Suspense>
  );
}
