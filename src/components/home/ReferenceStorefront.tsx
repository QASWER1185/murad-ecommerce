'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { brands, categories, products, money, whatsapp, type Category, type Product } from './reference-catalog';
import { referenceAssets } from './reference-assets';
import styles from './ReferenceStorefront.module.css';

type CartItem = { product: Product; quantity: number };
type Panel = 'cart' | 'wishlist' | 'account' | null;
const tabs = ['Best Sellers', 'New Arrivals', 'Imported', 'Deals'] as const;
type Tab = (typeof tabs)[number];

function Asset({ name, className = '', label }: { name: string; className?: string; label?: string }) {
  const available = referenceAssets.includes(name);
  return <span role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}
    className={`${styles.asset} ${className}`} data-reference-asset={name} data-available={available}
    style={available ? { backgroundImage: `url('/homepage/${name}.png')` } : undefined} />;
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

export default function ReferenceStorefront() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('Best Sellers');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [panel, setPanel] = useState<Panel>(null);
  const [menu, setMenu] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const productRail = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const filtered = products.filter(product => {
    const text = `${product.name} ${product.brand} ${product.category}`.toLowerCase();
    return (!category || product.category === category)
      && (!brand || product.brand.includes(brand) || (brand === 'Porta' && product.id.startsWith('porta')))
      && (!query.trim() || query.toLowerCase().trim().split(/\s+/).every(word => text.includes(word)))
      && (tab !== 'Imported' || product.imported)
      && (tab !== 'Deals' || product.deal);
  });
  const visible = tab === 'New Arrivals' ? [...filtered].reverse() : filtered;

  useEffect(() => {
    if (!menu) return;
    const close = (event: PointerEvent) => { if (!menuRef.current?.contains(event.target as Node)) setMenu(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenu(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, [menu]);

  const selectCategory = (value: Category | null) => {
    setCategory(value); setBrand(null); setQuery(''); setTab('Best Sellers'); setMenu(false);
    productRail.current?.scrollTo({ left: 0 });
    document.getElementById('featured-products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const add = (product: Product) => {
    setCart(current => current.some(item => item.product.id === product.id)
      ? current.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      : [...current, { product, quantity: 1 }]);
    setAnnouncement(`${product.name} added to cart`);
  };
  const toggleWishlist = (product: Product) => {
    const saved = wishlist.includes(product.id);
    setWishlist(current => saved ? current.filter(id => id !== product.id) : [...current, product.id]);
    setAnnouncement(`${product.name} ${saved ? 'removed from' : 'added to'} wishlist`);
  };
  const changeQuantity = (id: string, delta: number) => setCart(current => current
    .map(item => item.product.id === id ? { ...item, quantity: item.quantity + delta } : item)
    .filter(item => item.quantity > 0));
  const orderText = `Assalam o Alaikum M. Murad Sons!\nOrder List:\n${cart.map((item, i) => `${i + 1}. ${item.product.name} x${item.quantity} = Rs.${money(item.product.price * item.quantity)}`).join('\n')}\nTotal: Rs.${money(total)}`;
  const nav: { label: string; category: Category; dropdown?: boolean }[] = [
    { label: 'Sanitary & Bathroom', category: 'sanitary', dropdown: true },
    { label: 'Kitchen & Appliances', category: 'kitchen', dropdown: true },
    { label: 'Pipes & Fittings', category: 'pipes', dropdown: true },
    { label: 'Water Tanks', category: 'tanks' },
    { label: 'Geysers', category: 'geysers', dropdown: true },
    { label: 'Electrical', category: 'electric', dropdown: true },
    { label: 'Building Material', category: 'building-material' },
  ];

  return <div className={styles.storefront}>
    <a className={styles.skipLink} href="#featured-products">Skip to products</a>
    <header>
      <div className={styles.topbar}><div className={styles.topbarInner}>
        <a className={styles.address} href="#footer-contact"><Icon name="pin-top" />Adda Plot, Al Kabir Town, Raiwind Road, Lahore</a>
        <div className={styles.assurances}>{['Genuine Brands', 'Quality Products', 'Nationwide Delivery'].map(text => <span key={text}><Icon name="check" />{text}</span>)}</div>
        <a href="tel:03086235608" className={styles.phone}><Icon name="phone" />0308-6235608</a>
        <a href={whatsapp()} target="_blank" rel="noopener noreferrer" className={styles.whatsapp}><Icon name="whatsapp-top" />WhatsApp</a>
      </div></div>
      <div className={styles.mainHeader}>
        <Logo />
        <form className={styles.search} role="search" onSubmit={event => { event.preventDefault(); document.getElementById('featured-products')?.scrollIntoView({ behavior: 'smooth' }); }}>
          <label className="sr-only" htmlFor="product-search">Search products, brands and categories</label>
          <input id="product-search" type="search" placeholder="Search for products, brands and categories..." value={query} onChange={event => { setQuery(event.target.value); setCategory(null); setBrand(null); setTab('Best Sellers'); productRail.current?.scrollTo({ left: 0 }); }} />
          <button type="submit" aria-label="Search"><Icon name="search" /></button>
        </form>
        <div className={styles.headerActions}>
          <button type="button" className={styles.account} aria-label="Sign Account" onClick={() => setPanel('account')}><Icon name="account" /><span>Sign<br />Account <Icon name="chevron-down" /></span></button>
          <button type="button" className={styles.headerWishlist} onClick={() => setPanel('wishlist')} aria-label={`Wishlist, ${wishlist.length} saved products`}><Icon name="heart-header" /><span>Wishlist</span></button>
          <button type="button" className={styles.cartAction} onClick={() => setPanel('cart')} aria-label={`Cart, ${count} items`}><Icon name="cart-header" /><span>Cart</span><b>{count}</b></button>
        </div>
      </div>
      <nav className={styles.navbar} aria-label="Product categories"><div className={styles.navInner}>
        <div className={styles.categoryMenu} ref={menuRef}>
          <button type="button" className={styles.allCategories} aria-expanded={menu} aria-controls="category-menu" onClick={() => setMenu(!menu)}><Icon name="list" />All Categories<Icon name="menu-chevron" /></button>
          {menu && <div id="category-menu" className={styles.dropdown}><button type="button" onClick={() => selectCategory(null)}>All Categories</button>{categories.map(item => <button type="button" key={item.id} onClick={() => selectCategory(item.id)}>{item.label}</button>)}</div>}
        </div>
        <div className={styles.navLinks}>{nav.map(item => <button type="button" key={item.label} onClick={() => selectCategory(item.category)}>{item.label}{item.dropdown && <Icon name="chevron-white" />}</button>)}</div>
      </div></nav>
    </header>
    <main>
      <section className={styles.hero} aria-label="Premium sanitary collection">
        <Asset name="hero" className={styles.heroArt} /><Asset name="hero-mobile" className={styles.heroMobileArt} />
        <div className={`${styles.heroCopy} ${referenceAssets.includes('hero') ? styles.heroCopyExtracted : ''}`}>
          <p>PREMIUM SANITARY COLLECTION</p><h1>Modern Bathroom<br />Solutions</h1>
          <div>Commodes&nbsp; | &nbsp;Wash Basins&nbsp; | &nbsp;Basin Mixers<br />Showers&nbsp; | &nbsp;Vanity Sets &amp; More</div>
          <button type="button" className={styles.goldButton} onClick={() => selectCategory('sanitary')}>Shop Sanitary Products <Icon name="chevron-right" /></button>
        </div>
        {referenceAssets.includes('hero') && <button type="button" className={styles.heroImageLink} aria-label="Shop Sanitary Products" onClick={() => selectCategory('sanitary')} />}
      </section>
      <div className={styles.content}>
        <section className={styles.categories} aria-label="Shop by category">{categories.map(item => <button type="button" key={item.id} className={styles.categoryCard} onClick={() => selectCategory(item.id)} aria-pressed={category === item.id}>
          <Asset name={item.asset} className={styles.categoryImage} /><span>{item.lines[0]}<br />{item.lines[1]}</span>
        </button>)}</section>
        <section id="brands" className={styles.brands} aria-labelledby="brand-title">
          <div className={styles.sectionHeading}><h2 id="brand-title">Shop by Top Brands</h2><span className={styles.goldRule} /><button type="button" onClick={() => { selectCategory(null); document.getElementById('brands')?.scrollIntoView({ behavior: 'smooth' }); }}>View All Brands <Icon name="view-brands" /></button></div>
          <div className={styles.brandGrid}>{brands.map(item => <button type="button" key={item.asset} aria-label={`Shop ${item.label}`} onClick={() => { setBrand(item.id); setCategory(null); setQuery(''); setTab('Best Sellers'); productRail.current?.scrollTo({ left: 0 }); document.getElementById('featured-products')?.scrollIntoView({ behavior: 'smooth' }); }}><Asset name={item.asset} className={styles.brandImage} />{!referenceAssets.includes(item.asset) && <span>{item.label}</span>}</button>)}</div>
        </section>
        <section id="featured-products" className={styles.featured} aria-labelledby="products-title">
          <div className={styles.sectionHeading}><h2 id="products-title">Featured Products</h2><span className={styles.goldRule} /><div className={styles.tabs} aria-label="Product collection">{tabs.map(item => <button type="button" key={item} aria-pressed={item === tab} className={item === tab ? styles.activeTab : ''} onClick={() => { setTab(item); productRail.current?.scrollTo({ left: 0 }); }}>{item}</button>)}</div></div>
          {(query || category || brand) && <div className={styles.filterSummary}><span>{visible.length} products{category ? ` · ${categories.find(item => item.id === category)?.label}` : brand ? ` · ${brand}` : ` matching “${query}”`}</span><button type="button" onClick={() => { setQuery(''); setCategory(null); setBrand(null); }}>Clear filters</button></div>}
          <div className={styles.productsWrapper}>
            <button type="button" className={`${styles.railArrow} ${styles.previous}`} aria-label="Previous products" onClick={() => productRail.current?.scrollBy({ left: -productRail.current.clientWidth, behavior: 'smooth' })}><Icon name="previous" /></button>
            <div className={styles.productRail} ref={productRail}>
              {visible.map(product => <article key={product.id} className={styles.productCard}>
                <div className={styles.productImage}>{product.asset && <Asset name={product.asset} className={styles.productPhoto} label={product.name} />}{product.bestseller && <span className={styles.bestseller}><Asset name="badge-bestseller" className={styles.badgeArtwork} /><span className="sr-only">Bestseller</span></span>}</div>
                <div className={styles.productInfo}><h3>{product.name}</h3><p>{product.brand}</p><strong className={styles.price}>{product.inquiry ? 'Today’s Rate' : <>PKR <b>{money(product.price)}</b></>}</strong>
                  <div className={styles.rating}>{product.rating && <><Icon name="star" /><span>{product.rating} ({product.reviews})</span></>}</div>
                  <div className={styles.productActions}>{product.inquiry ? <a href={whatsapp(`Rate inquiry for ${product.name}`)} target="_blank" rel="noopener noreferrer" className={styles.addToCart}>Request Rate</a> : <button type="button" className={styles.addToCart} onClick={() => add(product)}><Icon name="cart-button" />Add to Cart</button>}
                    <button type="button" className={`${styles.wishlistButton} ${wishlist.includes(product.id) ? styles.saved : ''}`} aria-label={`${wishlist.includes(product.id) ? 'Remove' : 'Save'} ${product.name} ${wishlist.includes(product.id) ? 'from' : 'to'} wishlist`} aria-pressed={wishlist.includes(product.id)} onClick={() => toggleWishlist(product)}><Icon name="heart-product" /></button>
                  </div>
                </div>
              </article>)}
            </div>
            {visible.length === 0 && <p className={styles.emptyResults}>No matching products. <button type="button" onClick={() => { selectCategory(null); setTab('Best Sellers'); }}>Browse all products</button></p>}
            <button type="button" className={`${styles.railArrow} ${styles.next}`} aria-label="Next products" onClick={() => productRail.current?.scrollBy({ left: productRail.current.clientWidth, behavior: 'smooth' })}><Icon name="next" /></button>
          </div>
        </section>
      </div>
      <section className={styles.banners} aria-label="Pipes and building materials">
        <button type="button" className={styles.pipesBanner} onClick={() => selectCategory('pipes')}><Asset name="banner-pipes" className={styles.bannerImage} />{!referenceAssets.includes('banner-pipes') && <span className={styles.bannerCopy}><strong>Pipes, Fittings &amp;<br />Water Tanks</strong><span>PVC | PPRC | Fittings | Storage Tanks</span><span className={styles.goldButton}>Shop Now <Icon name="chevron-right" /></span></span>}<span className="sr-only">Shop pipes, fittings and water tanks</span></button>
        <a className={styles.materialsBanner} href={whatsapp('Please share today’s rates for cement, sand, bajri and bricks.')} target="_blank" rel="noopener noreferrer"><Asset name="banner-building" className={styles.bannerImage} />{!referenceAssets.includes('banner-building') && <span className={styles.bannerCopy}><strong>Building Materials</strong><span>Cement, Sand, Bajri, Bricks &amp; More</span><span className={styles.goldButton}><Icon name="whatsapp-banner" />Request Today’s Rate<br />on WhatsApp <Icon name="chevron-right" /></span></span>}<span className="sr-only">Request today’s building material rates on WhatsApp</span></a>
      </section>
      <section className={styles.benefits} aria-label="Shopping benefits">{[
        ['delivery', 'Nationwide Delivery', 'Across Pakistan'], ['shield', 'Genuine Products', '100% Original Brands'], ['payment', 'Secure Shopping', 'Safe & Reliable'], ['returns', 'Easy Returns', 'Hassle-Free Process'], ['support', 'Customer Support', '0308-6235608 (WhatsApp)'],
      ].map(([icon, title, text]) => <div key={icon}><Icon name={icon} /><span><strong>{title}</strong><small>{text}</small></span></div>)}</section>
    </main>
    <footer id="footer-contact" className={styles.footer}>
      <Asset name="footer-decoration" className={styles.footerDecoration} />
      <div className={styles.footerInner}>
        <Logo footer />
        <div><h2>Quick Links</h2><a href="#footer-contact">About Us</a><a href="#brands">Shop by Brand</a><button type="button" onClick={() => selectCategory(null)}>All Categories</button><a href={whatsapp()} target="_blank" rel="noopener noreferrer">Contact Us</a></div>
        <div><h2>Categories</h2>{nav.filter(item => item.category !== 'tanks').map(item => <button type="button" key={item.category} onClick={() => selectCategory(item.category)}>{item.label === 'Electrical' ? 'Electrical Products' : item.label}</button>)}</div>
        <div className={styles.location}><h2>Our Location</h2><a href="https://www.google.com/maps/search/?api=1&query=Adda+Plot+Al+Kabir+Town+Raiwind+Road+Lahore" target="_blank" rel="noopener noreferrer"><Icon name="pin-footer" /><span>Adda Plot, Al Kabir Town,<br />Raiwind Road, Lahore</span></a><a href={whatsapp()} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp-footer" /><span><strong>0308-6235608</strong><br />(WhatsApp for Rates &amp; Orders)</span></a></div>
        <div className={styles.social}><h2>Follow Us</h2><Asset name="social-icons" className={styles.socialIcons} label="Facebook, Instagram, YouTube, TikTok" /></div>
      </div>
    </footer>
    <div role="status" aria-live="polite" className="sr-only">{announcement}</div>
    {panel && <Modal title={panel === 'cart' ? 'Your Selected Order' : panel === 'wishlist' ? 'Your Wishlist' : 'Account & Order Assistance'} onClose={() => setPanel(null)}>
      {panel === 'account' ? <div className={styles.panelContent}><p>Contact M. Murad Sons for help with your account, orders, and quotations.</p><a className={styles.checkout} href={whatsapp('I need assistance with my account or order.')} target="_blank" rel="noopener noreferrer">WhatsApp 0308-6235608</a></div>
        : panel === 'wishlist' ? <div className={styles.panelContent}>{wishlist.length === 0 ? <p>Your wishlist is empty.</p> : products.filter(product => wishlist.includes(product.id)).map(product => <div className={styles.cartRow} key={product.id}><div><strong>{product.name}</strong><p>PKR {money(product.price)}</p><button type="button" onClick={() => toggleWishlist(product)}>Remove</button></div><button type="button" className={styles.addToCart} onClick={() => add(product)}>Add to Cart</button></div>)}</div>
        : <div className={styles.panelContent}>{cart.length === 0 ? <p>Your cart is empty. Add products to build your order.</p> : <>{cart.map(item => <div className={styles.cartRow} key={item.product.id}><div><strong>{item.product.name}</strong><p>PKR {money(item.product.price)} × {item.quantity}</p><button type="button" onClick={() => setCart(current => current.filter(row => row.product.id !== item.product.id))}>Remove</button></div><div className={styles.quantity}><button type="button" aria-label={`Decrease quantity of ${item.product.name}`} onClick={() => changeQuantity(item.product.id, -1)}>−</button><span>{item.quantity}</span><button type="button" aria-label={`Increase quantity of ${item.product.name}`} onClick={() => changeQuantity(item.product.id, 1)}>+</button></div></div>)}<div className={styles.cartTotal}><strong>Total Amount</strong><strong>PKR {money(total)}</strong></div><a className={styles.checkout} href={whatsapp(orderText)} target="_blank" rel="noopener noreferrer">Send Order to WhatsApp (0308-6235608)</a></>}</div>}
    </Modal>}
  </div>;
}
