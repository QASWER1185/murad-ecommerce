import { ProductView, SearchEvent } from "@/components/analytics/Analytics";
import { Gallery } from "./Gallery";
import Link from "next/link";
import type { Catalog, Product, Query, Taxonomy } from "@/lib/storefront/types";
import { money, queryString, enquiry } from "@/lib/storefront/query";
import {
  shopBrands,
  productTypes,
} from "@/components/sanitary/catalog-options";
import { Header, Footer } from "./Chrome";
import { Media } from "./Media";
import { ProductActions } from "./Shopping";
import { Breadcrumbs } from "./Breadcrumbs";
import { productSchema, jsonLd } from "@/lib/storefront/seo";
import styles from "@/components/sanitary/SanitaryShop.module.css";
import "./catalog.css";
import { EmptyCatalog } from "./EmptyCatalog";
import { approvedBusinessAsset, approvedCategorySymbol, searchBusinessCollections } from "@/lib/storefront/business-site";
export function Price({ product }: { product: Product }) {
  return (
    <strong className={styles.price}>
      {product.sales_mode === "quotation" || product.price === null
        ? "Request current rate"
        : money(product.price, product.currency)}
    </strong>
  );
}
export function Stock({ product }: { product: Product }) {
  return (
    <p className={styles.stock}>
      {product.availability === "unknown"
        ? "Confirm availability"
        : product.availability === "in_stock"
          ? "In stock"
          : "Out of stock"}
    </p>
  );
}
export function ProductCard({
  product,
  catalog,
}: {
  product: Product;
  catalog: Catalog;
}) {
  return (
    <article className={styles.card}>
      <Link
        prefetch={false}
        className={styles.productImage}
        href={`/product/${product.slug}`}
        data-product-id={product.id}
      >
        <Media image={product.gallery[0]} enabled={catalog.mediaEnabled} />
      </Link>
      <div className={styles.cardBody}>
        <p>{product.brand?.name}</p>
        <h3>
          <Link
            prefetch={false}
            href={`/product/${product.slug}`}
            data-product-id={product.id}
          >
            {product.name}
          </Link>
        </h3>
        {product.model && <p>Model: {product.model}</p>}
        <Price product={product} />
        <Stock product={product} />
        <ProductActions
          requestsEnabled={catalog.ordersEnabled}
          product={product}
          main={catalog.settings?.main_whatsapp}
          origin={catalog.siteOrigin}
          shoppingEnabled={catalog.shoppingEnabled}
        />
      </div>
    </article>
  );
}
function Brands({ catalog }: { catalog: Catalog }) {
  return (
    <section className={styles.brands}>
      <h2>Shop by Brand:</h2>
      <div>
        {shopBrands.map((item) => {
          const brand = catalog.brands.find((b) => b.slug === item.slug);
          return (
            <Link
              prefetch={false}
              key={item.slug}
              href={`/brand/${item.slug}`}
              aria-label={`Shop ${item.name}`}
            >
              {brand?.asset && catalog.mediaEnabled ? (
                <span>
                  <Media image={brand.asset} enabled={true} />
                </span>
              ) : (
                <span
                  style={{
                    backgroundImage: `url('/sanitary/${item.asset}.png')`,
                  }}
                />
              )}
              <strong className="sr-only">{brand?.name || item.name}</strong>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
function Filters({
  catalog,
  query,
  path,
  sanitary,
  kind,
}: {
  catalog: Catalog;
  query: Query;
  path: string;
  sanitary: boolean;
  kind: string;
}) {
  const availableBrands = sanitary
    ? shopBrands.flatMap((item) =>
        catalog.brands.filter((brand) => brand.slug === item.slug),
      )
    : catalog.brands;
  const types = sanitary
    ? [...new Set([...productTypes, ...catalog.types])]
    : catalog.types;
  return (
    <form
      method="get"
      action={path}
      id="catalog-filter-form"
      className="catalog-filter-form"
    >
      <aside className={styles.sidebar}>
        <details open>
          <summary>Filter Products</summary>
          <Link prefetch={false} className={styles.clear} href={path}>
            Clear all filters
          </Link>
          {query.q && <input type="hidden" name="q" value={query.q} />}
          {kind !== "brand" && (
            <fieldset>
              <legend>Brand</legend>
              {availableBrands.map((brand) => (
                <label key={brand.id}>
                  <input
                    type="checkbox"
                    name="brand"
                    value={brand.slug}
                    defaultChecked={query.brand.includes(brand.slug)}
                  />
                  {brand.name}
                </label>
              ))}
            </fieldset>
          )}
          <fieldset>
            <legend>Product Type</legend>
            {types.map((type) => (
              <label key={type}>
                <input
                  type="checkbox"
                  name="type"
                  value={type}
                  defaultChecked={query.type.includes(type)}
                />
                {type}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Price (PKR)</legend>
            <label>
              Minimum
              <input
                name="min"
                type="number"
                min="0"
                step="0.01"
                defaultValue={query.min}
              />
            </label>
            <label>
              Maximum
              <input
                name="max"
                type="number"
                min="0"
                step="0.01"
                defaultValue={query.max}
              />
            </label>
            {query.min &&
              query.max &&
              Number(query.min) > Number(query.max) && (
                <p role="status">Minimum exceeds maximum.</p>
              )}
          </fieldset>
          <fieldset>
            <legend>Availability</legend>
            {[
              ["", "Any availability"],
              ["in_stock", "In stock"],
              ["out_of_stock", "Out of stock"],
              ["unknown", "Not confirmed"],
            ].map(([value, label]) => (
              <label key={value}>
                <input
                  type="radio"
                  name="availability"
                  value={value}
                  defaultChecked={query.availability === value}
                />
                {label}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Finish</legend>
            <label>
              Finish
              <select name="finish" defaultValue={query.finish}>
                <option value="">All finishes</option>
                {catalog.finishes.map((finish) => (
                  <option key={finish}>{finish}</option>
                ))}
              </select>
            </label>
          </fieldset>
          <input type="hidden" name="sort" value={query.sort} />
          <button className={styles.primary} type="submit">
            Apply filters
          </button>
        </details>
      </aside>
    </form>
  );
}
function Sort({ query, path }: { query: Query; path: string }) {
  return (
    <form method="get" action={path} className="catalog-sort">
      {Object.entries(query)
        .filter(([key]) => !["sort", "page"].includes(key))
        .flatMap(([key, value]) =>
          (Array.isArray(value) ? value : [String(value)])
            .filter(Boolean)
            .map((v, index) => (
              <input
                key={`${key}-${index}`}
                type="hidden"
                name={key}
                value={v}
              />
            )),
        )}
      <label>
        Sort by
        <select name="sort" aria-label="Sort by" defaultValue={query.sort}>
          <option value="name">Name</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="newest">Newest</option>
        </select>
      </label>
      <button type="submit">Sort</button>
    </form>
  );
}
export function CatalogPage({
  catalog,
  query,
  kind,
}: {
  catalog: Catalog;
  query: Query;
  kind: string;
}) {
  const entity = catalog.entity as Taxonomy | null;
  const sanitary = kind === "category" && entity?.slug === "sanitary";
  const path = kind === "search" ? "/search" : `/${kind}/${entity?.slug}`;
  const title =
    kind === "search" ? "Search brands and categories" : entity?.name || "Catalog";
  const heroAsset = (
    kind === "category" ? catalog.categories : catalog.brands
  ).find((item) => item.id === entity?.id)?.asset;
  const items = [{ name: title, path }];
  const businessAsset = catalog.emptyCatalog && entity ? approvedBusinessAsset(kind, entity.slug) : null;
  const businessMatches = kind === "search" && catalog.emptyCatalog ? searchBusinessCollections(query.q) : [];
  return (
    <div className={styles.shop}>
      {kind === "search" && (
        <SearchEvent count={catalog.total} length={query.q.length} />
      )}
      <Header catalog={catalog} query={query.q} />
      <main className={styles.main}>
        <Breadcrumbs items={items} />
        {kind === "search" && catalog.emptyCatalog ? <section className="business-search-results" aria-label="Brand and category search results">
          <h1>{title}</h1>
          <p>{query.q ? <>Results for “{query.q}”</> : "Explore our existing brands and categories."}</p>
          <div className="business-collection-links">
            {businessMatches.map(record => <Link key={record.id} href={record.canonical_path!}>{record.name}</Link>)}
          </div>
          {!businessMatches.length && <p>No matching brands or categories. Ask the store about “{query.q}” on WhatsApp below.</p>}
          <p>Our verified online product listings are still being prepared.</p>
        </section> : <section className={styles.hero}>
          <div>
            {(sanitary || kind === "category") && <span aria-hidden="true" data-category-icon={entity?.slug} className={styles.showerSymbol} style={!sanitary && entity ? { backgroundImage: `url('${approvedCategorySymbol(entity.slug)}')` } : undefined} />}
            <p>{kind === "brand" ? "Brand Enquiries" : "Explore Our Collections"}</p>
            <h1>
              {sanitary ? (
                <>
                  Sanitary &amp; Bathroom
                  <br />
                  Collection
                </>
              ) : (
                title
              )}
            </h1>
            <p>
              {sanitary ? (
                <>
                  Premium Sanitary Ware, Bathroom Fittings
                  <br />
                  and Modern Designs
                </>
              ) : (
                entity?.description ||
                "Explore the published product catalog from our Lahore store."
              )}
            </p>
            <ul className={styles.heroBadges}>
              <li>Lahore Store</li>
              <li>WhatsApp Enquiries</li>
              <li>Contact Our Team</li>
            </ul>
            <a className={styles.gold} href={enquiry(entity?.slug === "building-material" ? "today’s rates for cement, sand, gravel and bricks" : title, catalog.settings?.main_whatsapp)} target="_blank" rel="noopener noreferrer">
              {entity?.slug === "building-material" ? "Ask Today’s Rate" : "WhatsApp Inquiry"}
            </a>
          </div>
          <div
            className={styles.heroPhoto}
            style={
              !sanitary && businessAsset
                ? { backgroundImage: `url('${businessAsset}')`, backgroundColor: "#fff", backgroundSize: kind === "brand" ? "auto 60px" : entity?.slug === "building-material" ? "contain" : "120px auto", backgroundRepeat: "no-repeat", backgroundPosition: "center" }
                : !sanitary
                ? { backgroundImage: "none", backgroundColor: "#e9edf1" }
                : undefined
            }
          >
            {catalog.mediaEnabled && heroAsset ? (
              <Media image={heroAsset} enabled={true} sizes="55vw" />
            ) : !sanitary && !catalog.emptyCatalog ? (
              <span
                style={{
                  display: "grid",
                  placeItems: "center",
                  height: "100%",
                  color: "#526373",
                  fontSize: 12,
                }}
              >
                Collection image will be added
              </span>
            ) : (
              <span className="sr-only">
                {catalog.emptyCatalog ? title : "Bathroom collection from the approved sanitary reference"}
              </span>
            )}
          </div>
        </section>}
        {sanitary ? (
          <Brands catalog={catalog} />
        ) : (
          <nav className="catalog-links" aria-label="Browse catalog">
            <Link prefetch={false} href="/categories">
              All categories
            </Link>
            <Link prefetch={false} href="/brands">
              All brands
            </Link>
            {catalog.categories
              .filter((c) => c.parent_id === entity?.id)
              .map((c) => (
                <Link prefetch={false} key={c.id} href={`/category/${c.slug}`}>
                  {c.name}
                </Link>
              ))}
          </nav>
        )}
        <section id="catalog" className={`${styles.catalog} ${catalog.emptyCatalog ? "business-empty-catalog" : ""}`}>
          {!catalog.emptyCatalog && <Filters
            catalog={catalog}
            query={query}
            path={path}
            sanitary={sanitary}
            kind={kind}
          />}
          <div className={styles.results}>
            {!catalog.emptyCatalog && <div className={styles.toolbar}>
              <div>
                <h2>Showing {catalog.total} Products</h2>
                {query.q && <p>Matching “{query.q}”</p>}
              </div>
              <Sort query={query} path={path} />
            </div>}
            {catalog.products.length ? (
              <div className={styles.grid}>
                {catalog.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    catalog={catalog}
                  />
                ))}
              </div>
            ) : catalog.emptyCatalog ? (
              <EmptyCatalog title={kind === "search" && query.q ? query.q : title} quotation={entity?.slug === "building-material"} main={catalog.settings?.main_whatsapp} secondary={catalog.settings?.secondary_whatsapp} />
            ) : (
              <div className={styles.empty}>
                <h3>No matching products</h3>
                <p>
                  Published products will appear here when available. You can
                  ask our team for current product information.
                </p>
                <Link prefetch={false} href={path}>
                  Clear filters
                </Link>
              </div>
            )}
            {catalog.pages > 1 && (
              <nav
                className="catalog-pagination"
                aria-label="Product pagination"
              >
                {query.page > 1 && (
                  <Link
                    prefetch={false}
                    href={`${path}?${queryString(query, { page: query.page - 1 })}`}
                  >
                    Previous page
                  </Link>
                )}
                <span>
                  Page {query.page} of {catalog.pages}
                </span>
                {query.page < catalog.pages && (
                  <Link
                    prefetch={false}
                    href={`${path}?${queryString(query, { page: query.page + 1 })}`}
                  >
                    Next page
                  </Link>
                )}
              </nav>
            )}
          </div>
        </section>
        {sanitary && (
          <>
            <section className={styles.promotion}>
              <div>
                <p>PREMIUM BATHROOM SOLUTIONS</p>
                <h2>
                  Luxury Bathroom Solutions
                  <br />
                  from Genuine Brands
                </h2>
                <a className={styles.gold} href={enquiry("sanitary and bathroom requirements", catalog.settings?.main_whatsapp)} target="_blank" rel="noopener noreferrer">
                  WhatsApp Inquiry
                </a>
                <span>Basins · Mixers · Showers · Vanities · Accessories</span>
              </div>
              <span className={styles.promotionArt} />
            </section>
            <section className={styles.explore}>
              <h2>Explore Separate Brand Pages</h2>
              <p>Contact the store about each brand</p>
              <div>
                {shopBrands.map((brand) => (
                  <Link
                    prefetch={false}
                    href={`/brand/${brand.slug}`}
                    key={brand.slug}
                    aria-label={`Explore ${brand.name}`}
                  >
                    <span
                      className={styles.exploreLogo}
                      style={{
                        backgroundImage: `url('/sanitary/${brand.asset}.png')`,
                      }}
                    />
                    {!catalog.emptyCatalog && <span
                      className={styles.explorePhoto}
                      style={{
                        backgroundImage: `url('/sanitary/${brand.card}.png')`,
                      }}
                    />}
                    <strong>{catalog.emptyCatalog ? "Explore Brand →" : "View Brand Products →"}</strong>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
      <Footer catalog={catalog} />
    </div>
  );
}
export function ProductPage({ catalog, filtered = false }: { catalog: Catalog; filtered?: boolean }) {
  const product = catalog.entity as Product;
  const schema = productSchema(product, catalog, filtered);
  return (
    <div className={styles.shop}>
      <ProductView id={product.id} />
      <Header catalog={catalog} />
      <main className={styles.main}>
        <Breadcrumbs
          items={[
            ...(product.category
              ? [
                  {
                    name: product.category.name,
                    path: `/category/${product.category.slug}`,
                  },
                ]
              : []),
            { name: product.name, path: `/product/${product.slug}` },
          ]}
        />
        <section className={styles.detail}>
          <Gallery images={product.gallery} enabled={catalog.mediaEnabled} />
          <div>
            {product.brand && (
              <Link prefetch={false} href={`/brand/${product.brand.slug}`}>
                {product.brand.name}
              </Link>
            )}
            <h1>{product.name}</h1>
            {product.model && <p>Model: {product.model}</p>}
            {product.sku && <p>SKU: {product.sku}</p>}
            <Price product={product} />
            <p>{product.description}</p>
            <Stock product={product} />
            {product.finish && <p>Finish: {product.finish}</p>}
            <ProductActions
              requestsEnabled={catalog.ordersEnabled}
              product={product}
              main={catalog.settings?.main_whatsapp}
              origin={catalog.siteOrigin}
              shoppingEnabled={catalog.shoppingEnabled}
            />
            {product.category && (
              <Link
                prefetch={false}
                href={`/category/${product.category.slug}`}
              >
                Browse {product.category.name}
              </Link>
            )}
            <h2>Specifications</h2>
            {Object.keys(product.specifications).length ? (
              <dl className="catalog-specifications">
                {Object.entries(product.specifications).map(([name, value]) => (
                  <div key={name}>
                    <dt>{name}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p>Ask our team for verified specifications.</p>
            )}
          </div>
        </section>
        {catalog.products.length > 0 && (
          <section>
            <h2>Related products</h2>
            <div className={styles.grid}>
              {catalog.products.map((item) => (
                <ProductCard key={item.id} product={item} catalog={catalog} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer catalog={catalog} />
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(schema) }}
        />
      )}
    </div>
  );
}
