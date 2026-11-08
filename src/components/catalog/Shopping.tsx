"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Product } from "@/lib/storefront/types";
import { canOrder, enquiry, money } from "@/lib/storefront/query";
import { useShopping } from "@/components/sanitary/shop-state";
import styles from "@/components/sanitary/SanitaryShop.module.css";
export function ProductActions({
  product,
  main = "+923217165000",
}: {
  product: Product;
  main?: string;
}) {
  const shopping = useShopping();
  const [message, setMessage] = useState("");
  return (
    <>
      <div className={styles.actions}>
        {canOrder(product) ? (
          <button
            className={styles.primary}
            onClick={() => {
              shopping.add(product.id);
              setMessage(`${product.name} added to cart`);
            }}
          >
            Add to Cart
          </button>
        ) : (
          <a
            className={styles.primary}
            href={enquiry(product.name, main)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {product.sales_mode === "quotation" ? "Request Rate" : "Enquire"}
          </a>
        )}
        <button
          aria-label={`${shopping.wishlist.includes(product.id) ? "Remove" : "Save"} ${product.name} ${shopping.wishlist.includes(product.id) ? "from" : "to"} wishlist`}
          aria-pressed={shopping.wishlist.includes(product.id)}
          onClick={() => shopping.toggle(product.id)}
        >
          <span className={styles.heart} aria-hidden="true" />
        </button>
      </div>
      <span className="sr-only" role="status">
        {message}
      </span>
    </>
  );
}
export function CartButton({
  main = "+923217165000",
  compact = false,
  className,
  icon,
}: {
  main?: string;
  compact?: boolean;
  className?: string;
  icon?: ReactNode;
}) {
  const shopping = useShopping();
  const [open, setOpen] = useState(false),
    [items, setItems] = useState<Product[]>([]),
    [message, setMessage] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const ids = Object.keys(shopping.cart).slice(0, 100).sort().join(",");
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    let active = true;
    fetch(`/api/catalog/cart?ids=${encodeURIComponent(ids)}`, {
      cache: "no-store",
    })
      .then(async (r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((rows) => {
        if (active) {
          setItems(rows);
          setMessage("");
        }
      })
      .catch(() => {
        if (active) {
          setItems([]);
          setMessage("Unable to recheck this selection. Please try again.");
        }
      });
    return () => {
      active = false;
    };
  }, [ids, open]);
  const count = Object.values(shopping.cart).reduce(
    (sum, quantity) => sum + quantity,
    0,
  );
  async function order() {
    setMessage("Rechecking current product information…");
    try {
      const response = await fetch(
        `/api/catalog/cart?ids=${encodeURIComponent(ids)}`,
        { cache: "no-store" },
      );
      if (!response.ok) throw Error();
      const current: Product[] = await response.json();
      setItems(current);
      if (!current.length) {
        setMessage("These products are no longer publicly available.");
        return;
      }
      const text = `Please confirm this selection:\n${current.map((p) => `${p.name} × ${shopping.cart[p.id]} — ${canOrder(p) ? money(p.price!, p.currency) : "Rate / availability confirmation required"}`).join("\n")}\nPlease confirm final availability, delivery and order acceptance.`;
      window.location.assign(
        enquiry(undefined, main) + `?text=${encodeURIComponent(text)}`,
      );
    } catch {
      setMessage("Unable to recheck this selection. Please try again.");
    }
  }
  return (
    <>
      <button
        className={className}
        onClick={() => {
          setItems([]);
          setOpen(true);
        }}
        aria-label={`Cart, ${count} items`}
      >
        {compact ? (
          <>
            {icon}
            <span>Cart</span>
            <b>{count}</b>
          </>
        ) : (
          `Cart (${count})`
        )}
      </button>
      <dialog
        className={styles.dialog}
        ref={dialog}
        onCancel={() => setOpen(false)}
      >
        <div className={styles.dialogHeading}>
          <h2>Your Cart</h2>
          <button onClick={() => setOpen(false)}>Close</button>
        </div>
        {items.map((item) => (
          <div className={styles.cartItem} key={item.id}>
            <strong>{item.name}</strong>
            <p>
              {item.price === null || item.sales_mode === "quotation"
                ? "Request current rate"
                : money(item.price, item.currency)}
            </p>
            <label>
              Quantity for {item.name}
              <input
                type="number"
                min="1"
                max="999"
                value={shopping.cart[item.id] || 1}
                onChange={(e) =>
                  shopping.quantity(item.id, Number(e.target.value) || 1)
                }
              />
            </label>
            <button onClick={() => shopping.quantity(item.id, 0)}>
              Remove {item.name}
            </button>
          </div>
        ))}
        {ids && items.length < Object.keys(shopping.cart).length && (
          <p>Some selections are unavailable or awaiting verification.</p>
        )}
        {!ids && <p>Your cart is empty.</p>}
        <p role="status">{message}</p>
        {ids && (
          <button className={styles.whatsappOrder} onClick={order}>
            Send selection on WhatsApp
          </button>
        )}
      </dialog>
    </>
  );
}

export function WishlistButton({
  className,
  icon,
  main = "+923217165000",
}: {
  className?: string;
  icon?: ReactNode;
  main?: string;
}) {
  const shopping = useShopping();
  const [open, setOpen] = useState(false),
    [items, setItems] = useState<Product[]>([]),
    [message, setMessage] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const ids = shopping.wishlist.slice(0, 100).sort().join(",");
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    let active = true;
    fetch(`/api/catalog/cart?ids=${encodeURIComponent(ids)}`, {
      cache: "no-store",
    })
      .then(async (r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((rows) => {
        if (active) {
          setItems(rows);
          setMessage("");
        }
      })
      .catch(() => {
        if (active) {
          setItems([]);
          setMessage("Unable to recheck saved products. Please try again.");
        }
      });
    return () => {
      active = false;
    };
  }, [ids, open]);
  return (
    <>
      <button
        type="button"
        className={className}
        aria-label={`Wishlist, ${shopping.wishlist.length} saved products`}
        onClick={() => {
          setItems([]);
          setOpen(true);
        }}
      >
        {icon}
        <span>Wishlist</span>
      </button>
      <dialog
        className={styles.dialog}
        ref={dialog}
        onCancel={() => setOpen(false)}
      >
        <div className={styles.dialogHeading}>
          <h2>Your Wishlist</h2>
          <button onClick={() => setOpen(false)}>Close</button>
        </div>
        {items.map((item) => (
          <div className={styles.cartItem} key={item.id}>
            <a href={`/product/${item.slug}`}>
              <strong>{item.name}</strong>
            </a>
            <p>
              {item.price === null || item.sales_mode === "quotation"
                ? "Request current rate"
                : money(item.price, item.currency)}
            </p>
            <button onClick={() => shopping.toggle(item.id)}>
              Remove {item.name}
            </button>
            {canOrder(item) ? (
              <button onClick={() => shopping.add(item.id)}>Add to Cart</button>
            ) : (
              <a href={enquiry(item.name, main)}>Enquire</a>
            )}
          </div>
        ))}
        {!items.length && !message && (
          <p>No publicly available products saved.</p>
        )}
        <p role="status">{message}</p>
      </dialog>
    </>
  );
}
