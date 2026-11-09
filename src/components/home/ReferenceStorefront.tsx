'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { brands, categories, money, type Category, type Product } from './reference-catalog';
import { referenceAssets } from './reference-assets';
import styles from './ReferenceStorefront.module.css';

import type { Catalog } from '@/lib/storefront/types';
import { Media } from '@/components/catalog/Media';
import { Freshness } from '@/components/catalog/Freshness';
import { CartButton,WishlistButton,QuotationAction } from '@/components/catalog/Shopping';
import { useShopping } from '@/components/sanitary/shop-state';
import { canOrder } from '@/lib/storefront/query';
import { whatsappLink } from '@/lib/storefront/whatsapp';
import { WhatsAppInquiry, WhatsAppContact } from '@/components/catalog/WhatsApp';
import { EmptyCatalog } from '@/components/catalog/EmptyCatalog';
import { primaryCategorySlugs } from '@/lib/storefront/business-site';

type Panel = 'cart' | 'wishlist' | 'account' | null;
const tabs = ['Featured', 'New Arrivals', 'Imported', 'Deals'] as const;
type Tab = (typeof tabs)[number];

function Asset({ name, className = '', label }: { name: string; className?: string; label?: string }) {
  const available = referenceAssets.includes(name);
  return <span role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}
    className={`${styles.asset} ${className}`} data-reference-asset={name} data-available={available}
    style={available ? { backgroundImage: ['hero', 'hero-mobile', 'banner-pipes', 'banner-building', 'footer-decoration'].includes(name) ? `image-set(url('/homepage/${name}.webp') type('image/webp'), url('/homepage/${name}.png') type('image/png'))` : `url('/homepage/${name}.png')` } : undefined} />;
}
function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <Asset name={`icon-${name}`} className={`${styles.icon} ${className}`} />;
}
function Logo({ footer = false }: { footer?: boolean }) {
  return <Link href="/" className={`${styles.logo} ${footer ? styles.footerLogo : ''}`} aria-label="M Murad Sons home">
    <Asset name={footer ? 'logo-footer' : 'logo-header'} className={styles.logoArtwork} label="M Murad Sons — Building Material Store" />
  </Link>;
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { dialog?.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  return <dialog ref={ref} className={styles.dialog} onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }} aria-labelledby="panel-title">
    <div className={styles.dialogHeader}><h2 id="panel-title">{title}</h2><button type="button" onClick={onClose}>Close</button></div>
    {children}
  </dialog>;
}

export default function ReferenceStorefront({ catalog }: { catalog: Catalog }) {
  // Keep the approved geometry while routing contacts through verified settings.
  const whatsapp = (text?: string, main = false) => {
    const number = main ? (catalog.settings?.main_whatsapp || '+923217165000') : (catalog.settings?.secondary_whatsapp || '+923086235608');
    return whatsappLink(text, number);
  };
  const products: Product[] = catalog.products.map(product => ({ id:product.id,slug:product.slug,name:product.name,brand:product.brand?.name||'',category:(product.category?.slug||'sanitary') as Category,price:product.price??0,currency:product.currency,publishedAt:product.published_at,inquiry:!canOrder(product),imported:product.brand?.slug==='imported-china' }));
  const shopping=useShopping();
  const router=useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('Featured');

  const wishlist=shopping.wishlist;
  const [panel, setPanel] = useState<Panel>(null);
  const [menu, setMenu] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const productRail = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = products.filter(product => {
    const text = `${product.name} ${product.brand} ${product.category}`.toLowerCase();
    return (!category || product.category === category)
      && (!brand || product.brand.includes(brand) || (brand === 'Porta' && product.id.startsWith('porta')))
      && (!query.trim() || query.toLowerCase().trim().split(/\s+/).every(word => text.includes(word)))
      && (tab !== 'Imported' || product.imported)
      && (tab !== 'Deals' || product.deal);
  });
  const visible = tab === 'New Arrivals' ? [...filtered].sort((a,b)=>Date.parse(b.publishedAt||'1970-01-01')-Date.parse(a.publishedAt||'1970-01-01')) : filtered;

  useEffect(() => {
    if (!menu) return;
    const close = (event: PointerEvent) => { if (!menuRef.current?.contains(event.target as Node)) setMenu(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenu(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, [menu]);

  const selectCategory = (value: Category | null) => {
    setCategory(value); setBrand(null); setQuery(''); setTab('Featured'); setMenu(false);
    productRail.current?.scrollTo({ left: 0 });
    document.getElementById('featured-products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const add = (product: Product) => {
    if(product.inquiry){setAnnouncement("Please request the current rate and availability.");return;}
    shopping.add(product.id);
    setAnnouncement(`${product.name} added to cart`);
  };
  const toggleWishlist = (product: Product) => {
    const saved = wishlist.includes(product.id);
    shopping.toggle(product.id);
    setAnnouncement(`${product.name} ${saved ? 'removed from' : 'added to'} wishlist`);
  };
  const homeCategories = catalog.emptyCatalog ? [
    ...primaryCategorySlugs.map(slug => categories.find(c => c.id === slug)!),
    ...categories.filter(c => !primaryCategorySlugs.some(slug => slug === c.id)),
  ] : categories;
  const nav: { label: string; category: Category; dropdown?: boolean }[] = catalog.emptyCatalog ? [
    { label: 'Sanitary & Bathroom', category: 'sanitary' },
    { label: 'Electrical', category: 'electric' },
    { label: 'Building Materials', category: 'building-material' },
    { label: 'Imported Kitchen & Bath', category: 'imported-products' },
  ] : [
    { label: 'Sanitary & Bathroom', category: 'sanitary', dropdown: true },
    { label: 'Kitchen & Appliances', category: 'kitchen', dropdown: true },
    { label: 'Pipes & Fittings', category: 'pipes', dropdown: true },
    { label: 'Water Tanks', category: 'tanks' },
    { label: 'Geysers', category: 'geysers', dropdown: true },
    { label: 'Electrical', category: 'electric', dropdown: true },
    { label: 'Building Material', category: 'building-material' },
  ];

  return <div className={`${styles.storefront} ${!catalog.shoppingEnabled ? styles.inquiryStore : ''}`}>{!catalog.emptyCatalog && <Freshness generation={catalog.generation} />}
    <a className={styles.skipLink} href="#featured-products">Skip to products</a>
    <header>
      <div className={styles.topbar}><div className={styles.topbarInner}>
        <a className={styles.address} href="#footer-contact"><Icon name="pin-top" />Adda Plot, Al Kabir Town, Raiwind Road, Lahore</a>
        <div className={styles.assurances}>{['Sanitary & Electrical', 'Building Materials', 'WhatsApp Enquiries'].map(text => <span key={text}><Icon name="check" />{text}</span>)}</div>
        <a href="tel:03086235608" className={styles.phone}><Icon name="phone" />0308-6235608</a>
        <a href={whatsapp(undefined, true)} aria-label="Main WhatsApp contact" target="_blank" rel="noopener noreferrer" className={styles.whatsapp}><Icon name="whatsapp-top" />WhatsApp</a>
      </div></div>
      <div className={styles.mainHeader}>
        <Logo />
        <form className={styles.search} role="search" action="/search">
          <label className="sr-only" htmlFor="product-search">{catalog.emptyCatalog ? "Search brands and categories" : "Search products, brands and categories"}</label>
          <input id="product-search" name="q" type="search" placeholder={catalog.emptyCatalog ? "Search brands and categories…" : "Search for products, brands and categories..."} value={query} onChange={event => { setQuery(event.target.value); setCategory(null); setBrand(null); setTab('Featured'); productRail.current?.scrollTo({ left: 0 }); }} />
          <button type="submit" aria-label="Search"><Icon name="search" /></button>
        </form>
        <div className={styles.headerActions}>
          <button type="button" className={styles.account} aria-label={catalog.shoppingEnabled ? "Sign Account" : "Contact the store"} onClick={() => setPanel('account')}><Icon name={catalog.shoppingEnabled ? "account" : "support"} /><span>{catalog.shoppingEnabled ? <>Sign<br />Account</> : <>Contact<br />Store</>} <Icon name="chevron-down" /></span></button>
          {catalog.shoppingEnabled ? <>
            <WishlistButton className={styles.headerWishlist} icon={<Icon name="heart-header" />} main={catalog.settings?.main_whatsapp} />
            <CartButton compact className={styles.cartAction} icon={<Icon name="cart-header" />} main={catalog.settings?.main_whatsapp} />
          </> : <>
            <a className={styles.headerWishlist} href={whatsapp()} target="_blank" rel="noopener noreferrer" aria-label="Secondary WhatsApp contact"><Icon name="whatsapp-top" /><span><small>WhatsApp (Secondary)</small><strong>0308-6235608</strong></span></a>
            <a className={styles.cartAction} href={whatsapp(undefined, true)} target="_blank" rel="noopener noreferrer" aria-label="Main WhatsApp contact"><Icon name="whatsapp-top" /><span><small>WhatsApp (Main)</small><strong>0321-7165000</strong></span></a>
          </>}
        </div>
      </div>
      <nav className={styles.navbar} aria-label="Product categories"><div className={styles.navInner}>
        <div className={styles.categoryMenu} ref={menuRef}>
          <button type="button" className={styles.allCategories} aria-expanded={menu} aria-controls="category-menu" onClick={() => setMenu(!menu)}><Icon name="list" />All Categories<Icon name="menu-chevron" /></button>
          {menu && <div id="category-menu" className={styles.dropdown}><Link prefetch={false} href="/categories">All Categories</Link>{homeCategories.map(item => <Link prefetch={false} key={item.id} href={`/category/${item.id}`}>{item.label}</Link>)}{catalog.emptyCatalog && <Link prefetch={false} href="/category/imported-products">Imported Kitchen &amp; Bath</Link>}</div>}
        </div>
        <div className={styles.navLinks}>{nav.map(item => <Link prefetch={false} href={`/category/${item.category}`} key={item.label}>{item.label}{item.dropdown && <Icon name="chevron-white" />}</Link>)}</div>
      </div></nav>
    </header>
    <main>
      <section className={styles.hero} aria-label="Premium sanitary collection">
        <Asset name="hero" className={styles.heroArt} /><Asset name="hero-mobile" className={styles.heroMobileArt} />
        <div className={styles.heroCopy}>
          <p>PREMIUM SANITARY COLLECTION</p><h1>Modern Bathroom<br />Solutions</h1>
          <div>Commodes&nbsp; | &nbsp;Wash Basins&nbsp; | &nbsp;Basin Mixers<br />Showers&nbsp; | &nbsp;Vanity Sets &amp; More</div>
          <a className={styles.goldButton} href={whatsapp("Please help me with sanitary and bathroom requirements.", true)} target="_blank" rel="noopener noreferrer">WhatsApp Inquiry <Icon name="chevron-right" /></a>
        </div>
      </section>
      <div className={styles.content}>
        <section className={styles.categories} aria-label="Shop by category">{homeCategories.map(item => <Link prefetch={false} href={`/category/${item.id}`} key={item.id} className={styles.categoryCard}>
          <Asset name={item.asset} className={styles.categoryImage} /><span>{item.lines[0]}<br />{item.lines[1]}</span>
        </Link>)}</section>
        <section id="brands" className={styles.brands} aria-labelledby="brand-title">
          <div className={styles.sectionHeading}><h2 id="brand-title">Shop by Top Brands</h2><span className={styles.goldRule} /><button type="button" onClick={() => { router.push("/brands"); }}>View All Brands <Icon name="view-brands" /></button></div>
          <div className={styles.brandGrid}>{brands.map(item => <Link prefetch={false} href={`/brand/${item.slug}`} key={item.asset} aria-label={`Shop ${item.label}`}>{catalog.mediaEnabled && catalog.brands.find(brand=>brand.slug===item.slug)?.asset ? <span className={styles.brandImage}><Media image={catalog.brands.find(brand=>brand.slug===item.slug)?.asset} enabled={true}/></span> : <Asset name={item.asset} className={styles.brandImage} />}{!referenceAssets.includes(item.asset) && <span>{item.label}</span>}</Link>)}</div>
        </section>
        <section id="featured-products" className={styles.featured} aria-labelledby="products-title">
          <div className={styles.sectionHeading}><h2 id="products-title">{catalog.emptyCatalog ? 'Our Product Catalogue' : 'Featured Products'}</h2><span className={styles.goldRule} />{catalog.emptyCatalog ? <Link prefetch={false} href="/category/imported-products">Imported Kitchen &amp; Bath</Link> : <div className={styles.tabs} aria-label="Product collection">{tabs.map(item => <button type="button" key={item} aria-pressed={item === tab} className={item === tab ? styles.activeTab : ''} onClick={() => { setTab(item); productRail.current?.scrollTo({ left: 0 }); }}>{item}</button>)}</div>}</div>
          {!catalog.emptyCatalog && (query || category || brand) && <div className={styles.filterSummary}><span>{visible.length} products{category ? ` · ${categories.find(item => item.id === category)?.label}` : brand ? ` · ${brand}` : ` matching “${query}”`}</span><button type="button" onClick={() => { setQuery(''); setCategory(null); setBrand(null); }}>Clear filters</button></div>}
          <div className={styles.productsWrapper}>
            {catalog.emptyCatalog ? <EmptyCatalog title="sanitary, electrical, building materials or imported kitchen and bath products" main={catalog.settings?.main_whatsapp} secondary={catalog.settings?.secondary_whatsapp} /> : <>
            <button type="button" className={`${styles.railArrow} ${styles.previous}`} aria-label="Previous products" onClick={() => productRail.current?.scrollBy({ left: -productRail.current.clientWidth, behavior: 'smooth' })}><Icon name="previous" /></button>
            <div className={styles.productRail} ref={productRail}>
              {visible.map(product => <article key={product.id} className={styles.productCard}>
                <Link prefetch={false} href={`/product/${product.slug}`} data-product-id={product.id} className={styles.productImage}><Media image={catalog.products.find(item=>item.id===product.id)?.gallery[0]} enabled={catalog.mediaEnabled} className={styles.productPhoto}/></Link>
                <div className={styles.productInfo}><h3><Link prefetch={false} href={`/product/${product.slug}`} data-product-id={product.id}>{product.name}</Link></h3><p>{product.brand}</p><strong className={styles.price}>{product.inquiry ? 'Request current rate' : <>{product.currency||"PKR"} <b>{money(product.price)}</b></>}</strong>
                  <WhatsAppInquiry product={catalog.products.find(item=>item.id===product.id)!} number={catalog.settings?.main_whatsapp} origin={catalog.siteOrigin} className={`${styles.productInquiry} ${!catalog.shoppingEnabled ? styles.inquiryOnly : ''}`} />
                  {catalog.shoppingEnabled && <div className={styles.productActions}>{product.inquiry ? <QuotationAction product={catalog.products.find(item=>item.id===product.id)!} enabled={catalog.ordersEnabled} className={styles.addToCart} main={catalog.settings?.main_whatsapp} origin={catalog.siteOrigin} /> : <button type="button" className={styles.addToCart} onClick={() => add(product)}><Icon name="cart-button" />Add to Cart</button>}
                    <button type="button" className={`${styles.wishlistButton} ${wishlist.includes(product.id) ? styles.saved : ''}`} aria-label={`${wishlist.includes(product.id) ? 'Remove' : 'Save'} ${product.name} ${wishlist.includes(product.id) ? 'from' : 'to'} wishlist`} aria-pressed={wishlist.includes(product.id)} onClick={() => toggleWishlist(product)}><Icon name="heart-product" /></button>
                  </div>}
                </div>
              </article>)}
            </div>
            {visible.length === 0 && <p className={styles.emptyResults}>No matching products. <button type="button" onClick={() => { selectCategory(null); setTab('Featured'); }}>Browse all products</button></p>}
            <button type="button" className={`${styles.railArrow} ${styles.next}`} aria-label="Next products" onClick={() => productRail.current?.scrollBy({ left: productRail.current.clientWidth, behavior: 'smooth' })}><Icon name="next" /></button>
            </>}
          </div>
        </section>
      </div>
      <section className={styles.banners} aria-label="Pipes and building materials">
        <a className={styles.pipesBanner} href={catalog.banners[0]?.cta_path || whatsapp('Please help me with pipes, fittings and water tanks.', true)} target="_blank" rel="noopener noreferrer">{catalog.mediaEnabled && catalog.banners[0] ? <span className={styles.bannerImage}><Media image={catalog.banners[0].asset} enabled={true} sizes="50vw"/></span> : <Asset name="banner-pipes" className={styles.bannerImage} />}<span className={styles.bannerEnquiry}>WhatsApp Inquiry <Icon name="chevron-right" /></span><span className="sr-only">Ask about pipes, fittings and water tanks</span></a>
        <a className={styles.materialsBanner} href={catalog.banners[1]?.cta_path||whatsapp('Please share today’s rates for cement, sand, bajri and bricks.')} target="_blank" rel="noopener noreferrer">{catalog.mediaEnabled && catalog.banners[1] ? <span className={styles.bannerImage}><Media image={catalog.banners[1].asset} enabled={true} sizes="50vw"/></span> : <Asset name="banner-building" className={styles.bannerImage} />}{!referenceAssets.includes('banner-building') && <span className={styles.bannerCopy}><strong>Building Materials</strong><span>Cement, Sand, Bajri, Bricks &amp; More</span><span className={styles.goldButton}><Icon name="whatsapp-banner" />Request Today’s Rate<br />on WhatsApp <Icon name="chevron-right" /></span></span>}<span className="sr-only">Request today’s building material rates on WhatsApp</span></a>
      </section>
      <section className={styles.benefits} aria-label="Shopping benefits">{[
        ['delivery', 'Delivery Enquiries', 'Ask about your location'], ['shield', 'Brand Enquiries', 'Discuss your requirements'], ['payment', 'WhatsApp Enquiries', 'Speak with our team'], ['returns', 'Purchase Assistance', 'Ask before ordering'], ['support', 'Customer Support', '0308-6235608 (WhatsApp)'],
      ].map(([icon, title, text]) => <div key={icon}><Icon name={icon} /><span><strong>{title}</strong><small>{text}</small></span></div>)}</section>
    </main>
    <footer id="footer-contact" className={styles.footer}>
      <Asset name="footer-decoration" className={styles.footerDecoration} />
      <div className={styles.footerInner}>
        <Logo footer />
        <div><h2>Quick Links</h2><Link prefetch={false} href="/about">About Us</Link><Link prefetch={false} href="/brands">Shop by Brand</Link><Link prefetch={false} href="/categories">All Categories</Link><Link prefetch={false} href="/contact">Contact Us</Link></div>
        <div><h2>Categories</h2>{nav.filter(item => item.category !== 'tanks').map(item => <Link prefetch={false} key={item.category} href={`/category/${item.category}`}>{item.label === 'Electrical' ? 'Electrical Products' : item.label}</Link>)}</div>
        <div className={styles.location}><h2>Our Location</h2><a href="https://www.google.com/maps/search/?api=1&query=Adda+Plot+Al+Kabir+Town+Raiwind+Road+Lahore" target="_blank" rel="noopener noreferrer"><Icon name="pin-footer" /><span>Adda Plot, Al Kabir Town,<br />Raiwind Road, Lahore</span></a>{catalog.emptyCatalog ? <div className={styles.footerContact}><Icon name="whatsapp-footer" /><span><a href={whatsapp(undefined, true)} target="_blank" rel="noopener noreferrer">0321-7165000</a><a href={whatsapp()} target="_blank" rel="noopener noreferrer">0308-6235608</a></span></div> : <a href={whatsapp()} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp-footer" /><span><strong>0308-6235608</strong><br />(WhatsApp for Rates &amp; Orders)</span></a>}</div>
        <div className={styles.social}><h2>Store Information</h2><Link prefetch={false} href="/contact">Contact &amp; Location</Link><Link prefetch={false} href="/privacy">Privacy</Link><a href="tel:+923217165000">Call 0321-7165000</a></div>
      </div>
    </footer>
    <WhatsAppContact number={catalog.settings?.main_whatsapp} />
    <div role="status" aria-live="polite" className="sr-only">{announcement}</div>
    {panel && <Modal title={panel === 'cart' ? 'Your Selected Order' : panel === 'wishlist' ? 'Your Wishlist' : catalog.emptyCatalog ? 'Contact M Murad Sons' : 'Account & Order Assistance'} onClose={() => setPanel(null)}>
      {panel === 'account' ? <div className={styles.panelContent}><p>{catalog.emptyCatalog ? 'Ask our Lahore team about products, current rates and delivery.' : 'Contact M. Murad Sons for help with your account, orders, and quotations.'}</p><a className={styles.checkout} href={whatsapp(catalog.emptyCatalog ? 'Please help me with product information, current rates and delivery.' : 'I need assistance with my account or order.')} target="_blank" rel="noopener noreferrer">WhatsApp 0308-6235608</a><a className={styles.checkout} href={whatsapp('Please help me with product information and current rates.', true)} target="_blank" rel="noopener noreferrer">WhatsApp 0321-7165000</a><Link href="/contact">Store location and contact information</Link></div>
        : panel === 'wishlist' ? <div className={styles.panelContent}>{wishlist.length === 0 ? <p>Your wishlist is empty.</p> : products.filter(product => wishlist.includes(product.id)).map(product => <div className={styles.cartRow} key={product.id}><div><strong>{product.name}</strong><p>{product.inquiry?"Request current rate":`${product.currency||"PKR"} ${money(product.price)}`}</p><button type="button" onClick={() => toggleWishlist(product)}>Remove</button></div><button type="button" disabled={product.inquiry} className={styles.addToCart} onClick={() => add(product)}>{product.inquiry?"Enquire":"Add to Cart"}</button></div>)}</div>
        : null}
    </Modal>}
  </div>;
}
