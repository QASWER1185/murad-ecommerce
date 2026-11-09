import Link from "next/link";
import type { Catalog } from "@/lib/storefront/types";
import { enquiry } from "@/lib/storefront/query";
import { contacts } from "@/components/sanitary/catalog-options";
import { CartButton } from "./Shopping";
import { Freshness } from "./Freshness";
import { WhatsAppContact } from "./WhatsApp";
import { importedCollection } from "@/lib/storefront/business-site";
import styles from "@/components/sanitary/SanitaryShop.module.css";
export function ContactButtons({ catalog }: { catalog: Catalog }) {
  return (
    <div className={styles.contacts}>
      {contacts.map((contact, index) => {
        const number =
          (index === 0
            ? catalog.settings?.main_whatsapp
            : catalog.settings?.secondary_whatsapp) || contact.number;
        return (
          <a
            key={contact.label}
            href={enquiry(undefined, number)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <small>WhatsApp ({contact.label})</small>
            <b>
              {number === contact.number
                ? number
                : number
                    .replace(/^\+92/, "0")
                    .replace(/^(\d{4})(\d+)$/, "$1-$2")}
            </b>
          </a>
        );
      })}
    </div>
  );
}
export function Header({
  catalog,
  query = "",
}: {
  catalog: Catalog;
  query?: string;
}) {
  return (
    <>
      {!catalog.emptyCatalog && <Freshness generation={catalog.generation} />}
      <header className={styles.header}>
        <div className={styles.topline}>
          <span>
            Our Physical Store: M. Murad Sons Building Material Store, Lahore,
            Pakistan
          </span>
          <span className={styles.assurances}>
            <span>100% Genuine Products</span>
            <span>Trusted Brands</span>
            <span>Expert Guidance</span>
          </span>
        </div>
        <div className={styles.headerRow}>
          <Link prefetch={false} href="/" aria-label="M Murad Sons home">
            <span className={styles.logo} />
          </Link>
          <form className={styles.headerSearch} role="search" action="/search">
            <label className="sr-only" htmlFor="catalog-search">
              Search for products, brands, models
            </label>
            <input
              id="catalog-search"
              name="q"
              defaultValue={query}
              type="search"
              maxLength={120}
              placeholder="Search for products, brands, models…"
            />
            <button aria-label="Search products">Search</button>
          </form>
          <ContactButtons catalog={catalog} />
          <div className={styles.account}>
            <a
              href={enquiry(
                "account and order assistance",
                catalog.settings?.main_whatsapp,
              )}
            >
              Contact
            </a>
            {catalog.shoppingEnabled && <CartButton main={catalog.settings?.main_whatsapp} />}
          </div>
        </div>
        <nav className={styles.nav} aria-label="Shopping navigation">
          <Link
            prefetch={false}
            className={styles.allCategories}
            href="/categories"
          >
            All Categories
          </Link>
          {(catalog.emptyCatalog ? [
            ["sanitary", "Sanitary & Bathroom"], ["electric", "Electrical"],
            ["building-material", "Building Materials"], [importedCollection.slug, importedCollection.name],
          ] : [
            ["sanitary", "Sanitary & Bathroom"],
            ["kitchen", "Kitchen Appliances"],
            ["electric", "Electrical"],
            ["pipes", "Pipes & Fittings"],
            ["tanks", "Water Tanks"],
            ["building-material", "Building Materials"],
          ]).map(([slug, name]) => (
            <Link prefetch={false} key={slug} href={`/category/${slug}`}>
              {name}
            </Link>
          ))}
          <Link prefetch={false} href="/brands">
            Brands
          </Link>
          <a
            className={styles.deals}
            href={enquiry(
              "available deals and offers",
              catalog.settings?.main_whatsapp,
            )}
          >
            Deals &amp; Offers
          </a>
        </nav>
      </header>
    </>
  );
}
export function Footer({ catalog }: { catalog: Catalog }) {
  return (
    <>
      <WhatsAppContact number={catalog.settings?.main_whatsapp} />
      <section className={styles.services} aria-label="Store services">
        {[
          ["delivery", "Nationwide Delivery", "Across Pakistan"],
          ["shield", "Genuine Products", "100% Original Brands"],
          ["payment", "Secure Shopping", "Safe & Reliable"],
          ["returns", "Easy Returns", "Hassle-Free Process"],
          ["support", "Customer Support", "0308-6235608 (WhatsApp)"],
        ].map(([icon, title, text]) => (
          <div key={icon}>
            <span
              style={{ backgroundImage: `url('/homepage/icon-${icon}.png')` }}
            />
            <p>
              <strong>{title}</strong>
              <small>{text}</small>
            </p>
          </div>
        ))}
      </section>
      <footer className={styles.footer}>
        <div>
          <Link prefetch={false} href="/" aria-label="M Murad Sons home">
            <span className={styles.footerLogo} />
          </Link>
        </div>
        <div>
          <h2>Quick Links</h2>
          <Link prefetch={false} href="/">
            Home
          </Link>
          <Link prefetch={false} href="/brands">
            Shop by Brand
          </Link>
          <a href={enquiry(undefined, catalog.settings?.main_whatsapp)}>
            Contact Us
          </a>
        </div>
        <div>
          <h2>Categories</h2>
          {["sanitary", "electric", "building-material"]
            .flatMap((slug) =>
              catalog.categories.filter((item) => item.slug === slug),
            )
            .map((item) => (
              <Link
                prefetch={false}
                href={`/category/${item.slug}`}
                key={item.id}
              >
                {item.name}
              </Link>
            ))}
        </div>
        <div>
          <h2>Our Location</h2>
          <p>
            {catalog.settings?.business_name ||
              "M. Murad Sons Building Material Store"}
            <br />
            {catalog.settings?.street_address ||
              "Adda Plot, Al Kabir Town, Raiwind Road"}
            , {catalog.settings?.city || "Lahore"}
          </p>
        </div>
        <div>
          <h2>Follow Us</h2>
          <span
            className={styles.socialIcons}
            role="img"
            aria-label="Facebook, Instagram, YouTube and TikTok"
          />
        </div>
        <div>
          <h2>Contact &amp; Orders</h2>
          <ContactButtons catalog={catalog} />
        </div>
      </footer>
    </>
  );
}
