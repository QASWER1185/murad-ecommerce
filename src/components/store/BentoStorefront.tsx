"use client";
import React, { useState, useMemo } from "react";
import { Search, ShoppingCart, PhoneCall, Sparkles, ChevronLeft, ChevronRight, Plus, Check, X, Trash2, Send, ShieldCheck } from "lucide-react";

const BRANDS = [
  ["all", "All Catalog", "Complete Store"],
  ["porta", "Porta Ceramics", "Commodes & Showers"],
  ["faisal", "Faisal Sanitary", "Shower Sets & Taps"],
  ["dell", "Dell Ceramics", "Gujranwala Basins"],
  ["china", "Imported China", "Vanities & Sinks"],
  ["appliances", "Geysers & Hoods", "Electric & Gas Geysers"],
  ["pipes", "Pipes & Tanks", "Popular & DuraMax"],
  ["electric", "Electric & Cables", "GM & New Age"],
  ["material", "Building Material", "Cement & Sand (Live)"],
];

const ITEMS = [
  { id: "1", name: "Porta Rimless One-Piece Commode", price: 32500, old: 36000, badge: "Porta Original", b: "porta", bName: "Porta", icon: "🚽" },
  { id: "2", name: "Faisal Rain Shower Set Complete", price: 18700, old: 21500, badge: "Best Seller", b: "faisal", bName: "Faisal Sanitary", icon: "🚿" },
  { id: "3", name: "Dell Ceramics Art Basin (Gujranwala)", price: 12400, old: 14500, badge: "A-Grade", b: "dell", bName: "Dell Ceramics", icon: "🚰" },
  { id: "4", name: "Imported China Luxury Vanity Cabinet", price: 45000, old: 52000, badge: "Luxury", b: "china", bName: "Imported China", icon: "🪞" },
  { id: "5", name: "Nano Black Waterfall Kitchen Sink", price: 28500, old: 34000, badge: "Trending", b: "china", bName: "Imported China", icon: "🖤" },
  { id: "6", name: "NASGAS Instant Electric Water Geyser", price: 16500, old: 18500, badge: "1 Year Warranty", b: "appliances", bName: "NASGAS", icon: "⚡" },
  { id: "7", name: "Modern Kitchen Hood & Chimney Glass", price: 24000, old: 27500, badge: "Smoke-Free", b: "appliances", bName: "Kitchen Appliances", icon: "🍳" },
  { id: "8", name: "Popular PPR-C Pipe & Fittings Bundle", price: 4500, old: 7500, badge: "40% OFF", b: "pipes", bName: "Popular Pipes", icon: "🔧" },
  { id: "9", name: "DuraMax U-PVC 4-Inch Drainage Pipe", price: 1850, old: 3700, badge: "50% OFF", b: "pipes", bName: "DuraMax", icon: "🛠️" },
  { id: "10", name: "GM Cable 3/29 Pure Copper Coil", price: 5000, old: 5400, badge: "99.9% Copper", b: "electric", bName: "GM Cables", icon: "⚡" },
  { id: "11", name: "Bestway Fresh Cement (50kg Bag)", price: 1300, old: 0, badge: "Live Rate", b: "material", bName: "Bestway Cement", icon: "🏗️", wa: true },
  { id: "12", name: "Ravi Sand & Margalla Crush Trolley", price: 0, old: 0, badge: "Per Trolley", b: "material", bName: "M. Murad Sons", icon: "🚛", wa: true },
];

export default function BentoStorefront() {
  const [brand, setBrand] = useState("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [cart, setCart] = useState<{ id: string; name: string; price: number; qty: number }[]>([]);
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState<string | null>(null);

  const list = useMemo(() => ITEMS.filter(i =>
    (brand === "all" || i.b === brand) &&
    (q === "" || i.name.toLowerCase().includes(q.toLowerCase()) || i.bName.toLowerCase().includes(q.toLowerCase()))
  ), [brand, q]);

  const pages = Math.max(1, Math.ceil(list.length / 6));
  const cur = Math.min(page, pages - 1);
  const shown = list.slice(cur * 6, cur * 6 + 6);

  const add = (i: typeof ITEMS[0]) => {
    setCart(p => p.some(x => x.id === i.id) ? p.map(x => x.id === i.id ? { ...x, qty: x.qty + 1 } : x) : [...p, { id: i.id, name: i.name, price: i.price, qty: 1 }]);
    setAdded(i.id);
    setTimeout(() => setAdded(null), 800);
  };

  const total = cart.reduce((s, x) => s + x.price * x.qty, 0);
  const sendWA = () => {
    const txt = cart.map((c, idx) => `${idx + 1}. ${c.name} x${c.qty} = Rs.${(c.price * c.qty).toLocaleString()}`).join("\n");
    window.open(`https://wa.me/923086235608?text=${encodeURIComponent(`Assalam o Alaikum M. Murad Sons!\nOrder List:\n${txt}\nTotal: Rs.${total.toLocaleString()}`)}`, "_blank");
  };

  return (
    <div className="h-dvh w-screen overflow-hidden flex flex-col bg-[#F8FAFC]">
      {/* CLEAN HEADER */}
      <header className="bg-[#185DB5] text-white px-4 py-3 shadow-sm shrink-0">
        <div className="max-w-[1600px] mx-auto flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white text-[#185DB5] font-black text-lg flex items-center justify-center shadow">MM</div>
              <div>
                <h1 className="text-base font-black tracking-tight leading-tight">M. MURAD SONS</h1>
                <p className="text-xs text-blue-100 font-medium">Sanitary, Ceramics, Geysers & Electric • Al-Kabir Town, Lahore</p>
              </div>
            </div>

            <div className="relative flex-1 max-w-lg hidden md:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={q} onChange={e => { setQ(e.target.value); setPage(0); }} placeholder="Search Porta, Faisal shower, geysers, kitchen hoods, pipes..." className="w-full pl-9 pr-4 py-2 rounded-xl bg-white text-slate-800 text-sm focus:outline-none shadow-inner" />
            </div>

            <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-white text-[#185DB5] font-extrabold text-sm px-4 py-2 rounded-xl shadow hover:bg-blue-50 transition">
              <ShoppingCart className="w-4 h-4" />
              <span>Cart ({cart.reduce((s, x) => s + x.qty, 0)})</span>
            </button>
          </div>

          {/* CLEAN BRAND TABS */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {BRANDS.map(([slug, name, sub]) => (
              <button key={slug} onClick={() => { setBrand(slug); setPage(0); }} className={`shrink-0 px-3.5 py-1.5 rounded-xl border text-left transition ${brand === slug ? "bg-white text-[#185DB5] border-white shadow font-bold scale-[1.02]" : "bg-[#134B94] text-white border-blue-400/20 hover:bg-[#1653A3]"}`}>
                <div className="text-xs font-black">{name}</div>
                <div className={`text-[10px] ${brand === slug ? "text-slate-500 font-semibold" : "text-blue-200"}`}>{sub}</div>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* SPACIOUS WORKSPACE */}
      <main className="flex-1 min-h-0 max-w-[1600px] w-full mx-auto p-3 md:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
        {/* LEFT SPOTLIGHT BANNER */}
        <section className="lg:col-span-4 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white rounded-3xl p-5 flex flex-col justify-between shadow-xl border border-slate-800 shrink-0">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 bg-amber-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Featured Showroom
            </span>
            <h2 className="text-lg lg:text-2xl font-black leading-snug">
              Premium Sanitary, Geysers & Kitchen Hoods
            </h2>
            <p className="text-xs lg:text-sm text-slate-300 leading-relaxed">
              Explore Porta ceramics, Faisal showers, Nasgas geysers, and imported china vanities with wholesale rates in Lahore.
            </p>
          </div>

          <div className="my-auto py-6 text-center text-6xl bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center justify-around">
            <span>🚿</span><span>⚡</span><span>🍳</span><span>🚽</span>
          </div>

          <div className="flex gap-2.5">
            <a href="https://wa.me/923086235608?text=Assalam%20o%20Alaikum%20M.%20Murad%20Sons!%20Mujhe%20complete%20catalog%20aur%20rates%20chahiye." target="_blank" className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-black py-3 rounded-xl text-center text-xs md:text-sm shadow flex items-center justify-center gap-2 transition">
              <PhoneCall className="w-4 h-4" /> Get Rates on WhatsApp (0308-6235608)
            </a>
          </div>
        </section>

        {/* RIGHT CLEAN PRODUCT GRID */}
        <section className="lg:col-span-8 flex flex-col min-h-0 gap-3 overflow-hidden">
          <div className="bg-white rounded-2xl px-4 py-2.5 shadow-sm border border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <span className="text-xs font-extrabold text-slate-600">
              Showing <strong className="text-[#185DB5]">{list.length}</strong> Products (Page {cur + 1} of {pages})
            </span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={cur === 0} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 transition">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={cur >= pages - 1} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 transition">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 grid grid-cols-2 md:grid-cols-3 grid-rows-2 gap-3 overflow-hidden">
            {shown.map(i => (
              <div key={i.id} className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden group">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-extrabold text-[#185DB5] bg-blue-50 px-2.5 py-1 rounded-lg truncate">{i.bName}</span>
                  <span className="text-[11px] font-extrabold bg-slate-900 text-white px-2.5 py-1 rounded-lg shrink-0">{i.badge}</span>
                </div>
                
                <div className="my-auto text-center text-4xl md:text-5xl py-3 group-hover:scale-110 transition-transform duration-300">
                  {i.icon}
                </div>

                <div>
                  <h3 className="text-xs md:text-sm font-bold text-slate-900 line-clamp-1">{i.name}</h3>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                    <div>
                      {i.old > 0 && <span className="text-[11px] text-slate-400 line-through block leading-none">Rs. {i.old.toLocaleString()}</span>}
                      <span className="text-xs md:text-base font-black text-slate-900">{i.wa ? "Live Rate" : `Rs. ${i.price.toLocaleString()}`}</span>
                    </div>

                    {i.wa ? (
                      <a href={`https://wa.me/923086235608?text=${encodeURIComponent(`Rate inquiry for ${i.name}`)}`} target="_blank" className="bg-[#25D366] text-white text-xs font-black px-3 py-2 rounded-xl flex items-center gap-1 shadow-sm">
                        <PhoneCall className="w-3.5 h-3.5" /> Rate
                      </a>
                    ) : (
                      <button onClick={() => add(i)} className={`px-3 py-2 rounded-xl text-xs font-black text-white flex items-center gap-1.5 shadow-sm transition ${added === i.id ? "bg-emerald-600" : "bg-[#185DB5] hover:bg-blue-700"}`}>
                        {added === i.id ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>{added === i.id ? "Added" : "Add"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* CLEAN FOOTER STRIP */}
      <footer className="bg-[#185DB5] text-white px-4 py-2.5 shrink-0 border-t border-blue-400/30">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-bold truncate">
            <ShieldCheck className="w-4 h-4 text-[#25D366]" />
            <span>Plaza No. 4, Al-Kabir Town, Opp. Lake City / Bahria Orchard, Raiwind Road, Lahore</span>
          </div>
          <a href="https://wa.me/923086235608?text=Assalam%20o%20Alaikum%20M.%20Murad%20Sons!" target="_blank" className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow">
            <PhoneCall className="w-3.5 h-3.5" />
            <span>WhatsApp Orders: 0308-6235608 / 0321-7165000</span>
          </a>
        </div>
      </footer>

      {/* CART DRAWER */}
      {open && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-sm bg-white h-full p-5 flex flex-col justify-between shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="font-black text-base text-slate-900">Your Selected Order</h2>
                <p className="text-xs text-slate-500">Review items before sending to WhatsApp</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-bold">Your cart is empty</p>
                  <p className="text-xs">Click "Add" on any product to build an estimate.</p>
                </div>
              ) : (
                cart.map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                    <div>
                      <p className="font-extrabold text-slate-800">{c.name}</p>
                      <p className="text-slate-500 font-medium">Rs. {c.price.toLocaleString()} x {c.qty}</p>
                    </div>
                    <button onClick={() => setCart(p => p.filter(x => x.id !== c.id))} className="text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between font-black text-sm">
                  <span>Total Amount:</span>
                  <span className="text-base text-[#185DB5]">Rs. {total.toLocaleString()}</span>
                </div>
                <button onClick={sendWA} className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold py-3 rounded-2xl flex items-center justify-center gap-2 text-xs shadow">
                  <Send className="w-4 h-4" />
                  <span>Send Order to WhatsApp (0308-6235608)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
