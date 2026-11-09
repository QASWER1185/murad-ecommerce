import Link from "next/link";
import { connection } from "next/server";
import { businessCatalog } from "@/lib/storefront/business-site";
import { Header, Footer, ContactButtons } from "./Chrome";
import { Breadcrumbs } from "./Breadcrumbs";
import { businessSchema, jsonLd } from "@/lib/storefront/seo";
import styles from "@/components/sanitary/SanitaryShop.module.css";
import "./catalog.css";

export async function BusinessPage({ kind }: { kind: "about" | "contact" }) {
  await connection();
  const catalog = businessCatalog("search", "");
  const title = kind === "about" ? "About M Murad Sons" : "Contact M Murad Sons";
  const schema = businessSchema(catalog);
  return <div className={styles.shop}>
    <Header catalog={catalog} />
    <main className={`${styles.main} business-information`}>
      <Breadcrumbs items={[{ name: kind === "about" ? "About us" : "Contact", path: `/${kind}` }]} />
      <section className="business-introduction">
        <p className="business-eyebrow">M MURAD SONS · LAHORE</p>
        <h1>{title}</h1>
        <p>M Murad Sons Building Material Store is located at Adda Plot, Al Kabir Town, Raiwind Road, Lahore, Pakistan.</p>
        {kind === "about" ? <>
          <h2>Your requirements, our store</h2>
          <p>Contact our Lahore store about sanitary and bathroom fittings, electrical products, building materials, and imported kitchen and bath requirements. Our website helps you explore these collections and get in touch directly.</p>
          <p>We are preparing our online product catalogue. Product photographs, specifications and prices will appear after verification. Until then, ask our team about your requirements, current rates and delivery arrangements on WhatsApp.</p>
          <div className="business-collection-links">
            {catalog.categories.map(category => <Link key={category.slug} href={`/category/${category.slug}`}>{category.name}</Link>)}
          </div>
          <h2>Building material enquiries</h2>
          <p>For cement, sand, gravel (bajri) and bricks, request today’s rate directly. Confirm quantities, availability and delivery details with the store before arranging a purchase.</p>
          <Link className="business-text-link" href="/contact">Contact and store location →</Link>
        </> : <>
          <h2>Message the store on WhatsApp</h2>
          <p>Use either verified business contact below. Tell us which category or brand you need, and ask about product information, current rates or delivery.</p>
          <ContactButtons catalog={catalog} />
          <h2>Visit our Lahore store</h2>
          <address>Adda Plot, Al Kabir Town, Raiwind Road,<br />Lahore, Pakistan.</address>
          <p><a className="business-text-link" href="https://www.google.com/maps/search/?api=1&query=Adda+Plot+Al+Kabir+Town+Raiwind+Road+Lahore" target="_blank" rel="noopener noreferrer">Open address in Google Maps →</a></p>
          <p>Message the store before visiting to confirm directions and visiting times.</p>
          <h2>Call the store</h2>
          <p><a href="tel:+923217165000">0321-7165000</a> · <a href="tel:+923086235608">0308-6235608</a></p>
          <h2>Before arranging a purchase</h2>
          <p>Ask the store to confirm the current price, product details, availability, delivery costs and any applicable return terms. This website does not accept checkout or online payments.</p>
          <Link className="business-text-link" href="/privacy">Read our privacy information →</Link>
        </>}
      </section>
    </main>
    <Footer catalog={catalog} />
    {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />}
  </div>;
}
