'use client';
import { useSyncExternalStore } from 'react';

type State = { cart: Record<string, number>; wishlist: string[] };
const key = 'murad-sanitary-shopping-v1';
const empty = '{"cart":{},"wishlist":[]}';
function snapshot() { try { return localStorage.getItem(key) ?? empty; } catch { return empty; } }
function read(value: string): State {
  try {
    const state = JSON.parse(value);
    return {
      cart: Object.fromEntries(Object.entries(state.cart ?? {}).filter(([id, qty]) => /^[a-z0-9-]+$/i.test(id) && Number.isInteger(qty) && Number(qty) > 0 && Number(qty) <= 999)),
      wishlist: Array.isArray(state.wishlist) ? state.wishlist.filter((id: unknown) => typeof id === 'string') : [],
    } as State;
  } catch { return { cart: {}, wishlist: [] }; }
}
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback); window.addEventListener('murad-shop-update', callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener('murad-shop-update', callback); };
}
export function useShopping() {
  const state = read(useSyncExternalStore(subscribe, snapshot, () => empty));
  function update(change: (current: State) => State) {
    try { localStorage.setItem(key, JSON.stringify(change(read(snapshot())))); window.dispatchEvent(new Event('murad-shop-update')); }
    catch { window.alert('Please enable browser storage to keep your shopping list.'); }
  }
  return {
    ...state,
    quantity: (id: string, qty: number) => update(current => {
      const cart = { ...current.cart }; if (qty > 0) cart[id] = Math.min(999, Math.max(1, Math.trunc(qty))); else delete cart[id];
      return { ...current, cart };
    }),
    add: (id: string) => update(current => ({ ...current, cart: { ...current.cart, [id]: Math.min(999, (current.cart[id] ?? 0) + 1) } })),
    toggle: (id: string) => update(current => ({ ...current, wishlist: current.wishlist.includes(id) ? current.wishlist.filter(item => item !== id) : [...current.wishlist, id] })),
  };
}
