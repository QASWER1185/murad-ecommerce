'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { SanitaryProduct, ShopBrand } from '@/lib/sanitary-catalog';
import { contacts, formatPrice, productTypes, shopBrands, typeOf } from './catalog-options';
import { useShopping } from './shop-state';
import styles from './SanitaryShop.module.css';

type Props = { products: SanitaryProduct[]; brands: ShopBrand[]; brandSlug?: string; productSlug?: string };
export default function SanitaryShop({ products, brands, brandSlug, productSlug }: Props) {
  const router = useRouter();
  const shopping = useShopping();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [brand, setBrand] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [minimum, setMinimum] = useState(''); const [maximum, setMaximum] = useState('');
  const [finish, setFinish] = useState(''); const [availability, setAvailability] = useState('');
  const [sort, setSort] = useState('newest'); const [wishlistOnly, setWishlistOnly] = useState(false);
  const [cartOpen, setCartOpen] = useState(false); const [message, setMessage] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!cartOpen) return;
    dialog.current?.showModal();
    const previous = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [cartOpen]);
  const scope = products.filter(item => !brandSlug || item.brand?.slug === brandSlug);
  const finishes = [...new Set(scope.flatMap(item => item.finish ? [item.finish] : []))].sort();
  const rows = scope.filter(item => {
    const priceKnown = !item.is_whatsapp_inquiry && Number.isFinite(item.price) && item.price > 0;
    return (!query || `${item.name} ${item.model ?? ''} ${item.brand?.name ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()))
      && (!brand.length || brand.includes(item.brand?.slug ?? ''))
      && (!types.length || types.includes(typeOf(item) ?? ''))
      && (!minimum || (priceKnown && item.price >= Number(minimum)))
      && (!maximum || (priceKnown && item.price <= Number(maximum)))
      && (!finish || (finish === '__unknown' ? !item.finish : item.finish === finish))
      && (!availability || item.in_stock === (availability === 'in'))
      && (!wishlistOnly || shopping.wishlist.includes(item.id));
  }).sort((a, b) => {
    if (sort.startsWith('price-')) {
      const aKnown = !a.is_whatsapp_inquiry && a.price > 0;
      const bKnown = !b.is_whatsapp_inquiry && b.price > 0;
      if (aKnown !== bKnown) return aKnown ? -1 : 1;
      return (sort === 'price-low' ? a.price - b.price : b.price - a.price) || a.name.localeCompare(b.name);
    }
    return sort === 'newest' ? b.created_at.localeCompare(a.created_at) : a.name.localeCompare(b.name);
  });
  const brandInfo = shopBrands.find(item => item.slug === brandSlug);
  const detail = products.find(item => item.slug === productSlug);
  const cart = products.filter(item => shopping.cart[item.id]);
  const total = cart.reduce((sum, item) => sum + (item.in_stock && !item.is_whatsapp_inquiry ? item.price * shopping.cart[item.id] : 0), 0);
  const count = cart.reduce((sum, item) => sum + shopping.cart[item.id], 0);
  const order = `Hello M Murad Sons, please confirm this order:\n${cart.map(item => `${item.name}${item.model ? ` (${item.model})` : ''} × ${shopping.cart[item.id]} — ${item.in_stock && !item.is_whatsapp_inquiry ? formatPrice(item.price * shopping.cart[item.id]) : 'Availability / rate confirmation required'}`).join('\n')}\nListed total: ${formatPrice(total)}`;
  const toggle = (values: string[], value: string, set: (next: string[]) => void) => set(values.includes(value) ? values.filter(item => item !== value) : [...values, value]);
  const clear = () => { setQuery(''); setBrand([]); setTypes([]); setMinimum(''); setMaximum(''); setFinish(''); setAvailability(''); setWishlistOnly(false); };
  const add = (item: SanitaryProduct) => { shopping.add(item.id); setMessage(`${item.name} added to cart`); };
  const price = (item: SanitaryProduct) => item.is_whatsapp_inquiry || item.price <= 0 ? 'Request current rate' : formatPrice(item.price);
  const contactButtons = <div className={styles.contacts}>{contacts.map(contact => <a key={contact.number} href={contact.url} target="_blank" rel="noopener noreferrer" aria-label={`${contact.label} WhatsApp ${contact.number}`}><small>WhatsApp ({contact.label})</small><b>{contact.number}</b></a>)}</div>;
  const picture = (item: SanitaryProduct) => item.image_url
    // Catalog URLs come from Supabase; keep image dimensions stable while photos load.
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={item.image_url} alt={item.name} loading="lazy" />
    : <span className={styles.missingImage}>Product image not available</span>;
  const actions = (item: SanitaryProduct) => <div className={styles.actions}>
    {item.is_whatsapp_inquiry || item.price <= 0 ? <a className={styles.primary} href={`${contacts[0].url}?text=${encodeURIComponent(`Please confirm the rate for ${item.name}`)}`} target="_blank" rel="noopener noreferrer">Request Rate</a>
      : <button className={styles.primary} disabled={!item.in_stock} onClick={() => add(item)}>Add to Cart</button>}
    <button aria-label={`${shopping.wishlist.includes(item.id) ? 'Remove' : 'Save'} ${item.name} ${shopping.wishlist.includes(item.id) ? 'from' : 'to'} wishlist`} aria-pressed={shopping.wishlist.includes(item.id)} onClick={() => shopping.toggle(item.id)}><span className={styles.heart} aria-hidden="true" /></button>
  </div>;
  return <div className={styles.shop}>
    <header className={styles.header}>
      <div className={styles.topline}><span>Our Physical Store: M. Murad Sons Building Material Store, Lahore, Pakistan</span><span className={styles.assurances}><span>100% Genuine Products</span><span>Trusted Brands</span><span>Expert Guidance</span></span></div>
      <div className={styles.headerRow}><Link href="/" aria-label="M Murad Sons home"><span className={styles.logo} /></Link><form className={styles.headerSearch} role="search" onSubmit={event => { event.preventDefault(); if (productSlug) { router.push(`/category/sanitary?q=${encodeURIComponent(query)}`); return; } document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' }); }}><label className="sr-only" htmlFor="sanitary-search">Search for products, brands, models</label><input id="sanitary-search" type="search" placeholder="Search for products, brands, models…" value={query} onChange={event => setQuery(event.target.value)} /><button aria-label="Search products">Search</button></form>{contactButtons}<div className={styles.account}><a href={`${contacts[0].url}?text=Account%20and%20order%20assistance`}>Account</a><button onClick={() => setCartOpen(true)}>Cart ({count})</button></div></div>
      <nav className={styles.nav} aria-label="Shopping navigation"><Link className={styles.allCategories} href="/">All Categories</Link><Link href="/category/sanitary">Sanitary &amp; Bathroom</Link><Link href="/#featured-products">Kitchen Appliances</Link><Link href="/category/electric">Electrical</Link><Link href="/#featured-products">Pipes &amp; Fittings</Link><Link href="/#featured-products">Water Tanks</Link><Link href="/category/building-material">Building Materials</Link><Link href="/category/sanitary#brand-pages">Brands</Link><a className={styles.deals} href={`${contacts[0].url}?text=Please%20share%20available%20deals%20and%20offers`} target="_blank" rel="noopener noreferrer">Deals &amp; Offers</a></nav>
    </header>
    <main className={styles.main}>
      <div className={styles.breadcrumb}><Link href="/">Home</Link> / <Link href="/category/sanitary">Sanitary &amp; Bathroom</Link>{brandInfo && ` / ${brandInfo.name}`}{detail && ` / ${detail.name}`}</div>
      {detail ? <section className={styles.detail}><div className={styles.detailImage}>{picture(detail)}</div><div><p>{detail.brand?.name}</p><h1>{detail.name}</h1>{detail.model && <p>Model: {detail.model}</p>}<strong className={styles.price}>{price(detail)}</strong><p>{detail.description}</p><p>{detail.in_stock ? 'In stock' : 'Out of stock'}</p>{detail.finish && <p>Finish: {detail.finish}</p>}{actions(detail)}<Link href="/category/sanitary">Back to Sanitary &amp; Bathroom</Link></div></section> : <>
        <section className={styles.hero}><div><span className={styles.showerSymbol} /><p>Premium Category</p><h1>{brandInfo?.name ?? <>Sanitary &amp; Bathroom<br />Collection</>}</h1><p>Premium Sanitary Ware, Bathroom Fittings<br />and Modern Designs</p><ul className={styles.heroBadges}><li>Top Brands</li><li>Modern Designs</li><li>Durable Quality</li></ul><a className={styles.gold} href="#catalog">Shop Now</a></div><div className={styles.heroPhoto} role="img" aria-label="Bathroom collection from the approved sanitary reference" /></section>
        <section className={styles.brands}><h2>Shop by Brand:</h2><div>{shopBrands.map(item => <Link key={item.slug} href={`/brand/${item.slug}`} aria-label={`Shop ${item.name}`} aria-current={brandSlug === item.slug ? 'page' : undefined}><span style={{ backgroundImage: `url('/sanitary/${item.asset}.png')` }} /><strong className="sr-only">{item.name}</strong></Link>)}</div></section>
        <nav className={styles.types} aria-label="Product types">{productTypes.map(type => <button key={type} aria-pressed={types.includes(type)} onClick={() => toggle(types, type, setTypes)}>{type}</button>)}</nav>
        <section id="catalog" className={styles.catalog}>
          <aside className={styles.sidebar}><details open><summary>Filter Products</summary><button className={styles.clear} onClick={clear}>Clear all filters</button>
            {!brandSlug && <fieldset><legend>Brand</legend>{shopBrands.map(item => <label key={item.slug}><input type="checkbox" aria-label={item.name} checked={brand.includes(item.slug)} onChange={() => toggle(brand, item.slug, setBrand)} />{item.slug === 'imported-china' ? item.name : brands.find(row => row.slug === item.slug)?.name ?? item.name} ({scope.filter(row => row.brand?.slug === item.slug).length})</label>)}</fieldset>}
            <fieldset><legend>Product Type</legend>{productTypes.map(type => <label key={type}><input type="checkbox" aria-label={type} checked={types.includes(type)} onChange={() => toggle(types, type, setTypes)} />{type} ({scope.filter(row => typeOf(row) === type).length})</label>)}</fieldset>
            <fieldset><legend>Price (PKR)</legend><label>Minimum<input type="number" min="0" value={minimum} onChange={event => setMinimum(event.target.value)} /></label><label>Maximum<input type="number" min="0" value={maximum} onChange={event => setMaximum(event.target.value)} /></label>{minimum && maximum && Number(minimum) > Number(maximum) && <p role="status">Minimum exceeds maximum.</p>}</fieldset>
            <fieldset><legend>Availability</legend>{[['in','In stock'],['out','Out of stock']].map(([value,label]) => <label key={value}><input type="checkbox" aria-label={label} checked={availability === value} onChange={() => setAvailability(availability === value ? '' : value)} />{label} ({scope.filter(row => row.in_stock === (value === 'in')).length})</label>)}</fieldset>
            <fieldset><legend>Finish</legend>{finishes.map(value => <label key={value}><input type="checkbox" aria-label={`Finish ${value}`} checked={finish === value} onChange={() => setFinish(finish === value ? '' : value)} />{value} ({scope.filter(row => row.finish === value).length})</label>)}<label><input type="checkbox" aria-label="Finish not specified" checked={finish === '__unknown'} onChange={() => setFinish(finish === '__unknown' ? '' : '__unknown')} />Not specified ({scope.filter(row => !row.finish).length})</label></fieldset>
          </details></aside>
          <div className={styles.results}><div className={styles.toolbar}><div><h2>Showing {rows.length} Products</h2>{brandInfo && <p>{brandInfo.name}</p>}</div><label className={styles.search}>Search<input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label><label>Sort by<select aria-label="Sort by" value={sort} onChange={event => setSort(event.target.value)}><option value="name">Name</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option><option value="newest">Newest</option></select></label><button aria-pressed={wishlistOnly} onClick={() => setWishlistOnly(!wishlistOnly)}>Wishlist</button></div>
            {rows.length ? <div className={styles.grid}>{rows.map(item => <article key={item.id} className={styles.card}><Link className={styles.productImage} href={`/product/${item.slug}`}>{picture(item)}</Link><div className={styles.cardBody}><p>{item.brand?.name}</p><h3><Link href={`/product/${item.slug}`}>{item.name}</Link></h3>{item.model && <p>Model: {item.model}</p>}<strong className={styles.price}>{price(item)}</strong><p className={styles.stock}>{item.in_stock ? 'In stock' : 'Out of stock'}</p>{actions(item)}</div></article>)}</div> : <div className={styles.empty}><h3>No matching products</h3><p>{scope.length ? 'Try changing or clearing your filters.' : 'Products for this brand have not been listed yet.'}</p><button onClick={clear}>Clear filters</button></div>}
          </div>
        </section>
        <section className={styles.promotion}><div><p>PREMIUM BATHROOM SOLUTIONS</p><h2>Luxury Bathroom Solutions<br />from Genuine Brands</h2><a className={styles.gold} href="#catalog">Shop Now</a><span>Basins · Mixers · Showers · Vanities · Accessories</span></div><span className={styles.promotionArt} /></section>
        <section id="brand-pages" className={styles.explore}><h2>Explore Separate Brand Pages</h2><p>Browse the product range from each brand</p><div>{shopBrands.map(item => <Link key={item.slug} href={`/brand/${item.slug}`} aria-label={`View ${item.name} products`}><span className={styles.exploreLogo} style={{ backgroundImage: `url('/sanitary/${item.asset}.png')` }} /><span className={styles.explorePhoto} style={{ backgroundImage: `url('/sanitary/${item.card}.png')` }} /><strong>View Brand Products →</strong></Link>)}</div></section>
      </>}
    </main>
    <section className={styles.services} aria-label="Store services">{[['delivery','Nationwide Delivery','Across Pakistan'],['shield','Genuine Products','100% Original Brands'],['payment','Secure Shopping','Safe & Reliable'],['returns','Easy Returns','Hassle-Free Process'],['support','Customer Support','0308-6235608 (WhatsApp)']].map(([icon,title,text]) => <div key={icon}><span style={{ backgroundImage: `url('/homepage/icon-${icon}.png')` }} /><p><strong>{title}</strong><small>{text}</small></p></div>)}</section>
    <footer className={styles.footer}><div><Link href="/" aria-label="M Murad Sons home"><span className={styles.footerLogo} /></Link></div><div><h2>Quick Links</h2><Link href="/">Home</Link><Link href="/category/sanitary#brand-pages">Shop by Brand</Link><a href={contacts[0].url}>Contact Us</a></div><div><h2>Categories</h2><Link href="/category/sanitary">Sanitary &amp; Bathroom</Link><Link href="/category/electric">Electrical</Link><Link href="/category/building-material">Building Materials</Link></div><div><h2>Our Location</h2><p>M. Murad Sons Building Material Store<br />Adda Plot, Al Kabir Town,<br />Raiwind Road, Lahore</p></div><div><h2>Follow Us</h2><span className={styles.socialIcons} role="img" aria-label="Facebook, Instagram, YouTube and TikTok" /></div><div><h2>Contact &amp; Orders</h2>{contactButtons}</div></footer>
    <p className={styles.notice} role="status" aria-live="polite">{message}</p>
    {cartOpen && <dialog className={styles.dialog} ref={dialog} onCancel={() => setCartOpen(false)}><div className={styles.dialogHeading}><h2>Your Cart</h2><button onClick={() => setCartOpen(false)}>Close</button></div>{cart.length ? <>{cart.map(item => <div className={styles.cartItem} key={item.id}><strong>{item.name}</strong><p>{price(item)}</p>{!item.in_stock && <p>Currently out of stock — confirm availability.</p>}<label>Quantity for {item.name}<input type="number" min="1" max="999" value={shopping.cart[item.id]} onChange={event => shopping.quantity(item.id, Math.max(1, Number(event.target.value) || 1))} /></label><button onClick={() => shopping.quantity(item.id, 0)}>Remove {item.name}</button></div>)}<strong>Listed total: {formatPrice(total)}</strong><p>Final availability and order acceptance are confirmed by our team.</p><a className={styles.whatsappOrder} href={`${contacts[0].url}?text=${encodeURIComponent(order)}`} target="_blank" rel="noopener noreferrer">Send order on WhatsApp</a></> : <p>Your cart is empty.</p>}</dialog>}
  </div>;
}
