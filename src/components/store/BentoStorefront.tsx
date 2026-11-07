"use client";
import React, { useState, useMemo } from "react";
import { Search, ShoppingCart, PhoneCall, Sparkles, ChevronLeft, ChevronRight, Plus, Check, X, Trash2, Send, ShieldCheck } from "lucide-react";

const BRANDS = [
  ["all", "All Store", "Full Catalog", "Hot"],
  ["porta", "Porta", "Ceramics & Showers", "Original"],
  ["faisal", "Faisal Sanitary", "Shower Sets & Taps", "Guaranteed"],
  ["dell", "Dell Ceramics", "Gujranwala Brand", "A-Grade"],
  ["china", "Imported China", "Vanities, Sinks & Commodes", "Luxury"],
  ["pipes", "Pipes & Tanks", "Popular 40% • DuraMax 50%", "50% OFF"],
  ["electric", "Electric", "GM & New Age Cables", "Copper"],
  ["material", "Building Material", "Cement, Sand & Crush", "Live Rate"],
];

const FILTERS = [
  ["all", "All Items"],
  ["fittings", "Shower Sets & Taps"],
  ["ceramics", "Commodes & Basins"],
  ["vanity", "Vanities & Kitchen Sinks"],
  ["pipes", "Pipes & Electric"],
  ["material", "Cement & Sand"],
];

const ITEMS = [
  { id: "1", name: "Porta Rimless One-Piece Commode", price: 32500, old: 36000, badge: "Porta Original", b: "porta", bName: "Porta", cat: "ceramics", icon: "🚽" },
  { id: "2", name: "Faisal Rain Shower Set Complete", price: 18700, old: 21500, badge: "15% OFF", b: "faisal", bName: "Faisal Sanitary", cat: "fittings", icon: "🚿" },
  { id: "3", name: "Dell Ceramics Art Basin (Gujranwala)", price: 12400, old: 14500, badge: "A-Grade", b: "dell", bName: "Dell Ceramics", cat: "ceramics", icon: "🚰" },
  { id: "4", name: "Imported China Luxury Vanity Set", price: 45000, old: 52000, badge: "Imported", b: "china", bName: "Imported China", cat: "vanity", icon: "🪞" },
  { id: "5", name: "Nano Black Waterfall Kitchen Sink", price: 28500, old: 34000, badge: "Hot Deal", b: "china", bName: "Imported China", cat: "vanity", icon: "🖤" },
  { id: "6", name: "Porta Luxury Chrome Shower Mixer", price: 16500, old: 19000, badge: "Warranty", b: "porta", bName: "Porta", cat: "fittings", icon: "🚿" },
  { id: "7", name: "Faisal Single Lever Basin Mixer", price: 7800, old: 9000, badge: "15% OFF", b: "faisal", bName: "Faisal Sanitary", cat: "fittings", icon: "🚰" },
  { id: "8", name: "China Gold Digital Shower System", price: 24500, old: 29000, badge: "Gold Series", b: "china", bName: "Imported China", cat: "fittings", icon: "✨" },
  { id: "9", name: "Dell Ceramics One-Piece Toilet", price: 19500, old: 23000, badge: "Gujranwala", b: "dell", bName: "Dell Ceramics", cat: "ceramics", icon: "🚽" },
  { id: "10", name: "Popular PPR-C Pipe & Fittings", price: 4500, old: 7500, badge: "40% OFF", b: "pipes", bName: "Popular", cat: "pipes", icon: "🔧" },
  { id: "11", name: "DuraMax U-PVC 4-Inch Pipe Bundle", price: 1850, old: 3700, badge: "50% OFF", b: "pipes", bName: "DuraMax", cat: "pipes", icon: "🛠️" },
  { id: "12", name: "GM Cable 3/29 Pure Copper Coil", price: 5000, old: 5400, badge: "99.9% Copper", b: "electric", bName: "GM Cables", cat: "pipes", icon: "⚡" },
  { id: "13", name: "New Age Cable 7/29 Copper Coil", price: 8500, old: 9100, badge: "Original", b: "electric", bName: "New Age", cat: "pipes", icon: "🔌" },
  { id: "14", name: "Bestway Fresh Cement (50kg Bag)", price: 1300, old: 0, badge: "Live Rate", b: "material", bName: "Bestway", cat: "material", icon: "🏗️", wa: true },
  { id: "15", name: "Ravi Sand & Margalla Crush Trolley", price: 0, old: 0, badge: "Per Trolley", b: "material", bName: "M. Murad", cat: "material", icon: "🚛", wa: true },
];

export default function BentoStorefront() {
  const [brand, setBrand] = useState("all");
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [cart, setCart] = useState<{ id: string; name: string; price: number; qty: number }[]>([]);
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState<string | null>(null);

  const list = useMemo(() => ITEMS.filter(i =>
    (brand === "all" || i.b === brand) &&
    (cat === "all" || i.cat === cat) &&
    (q === "" || i.name.toLowerCase().includes(q.toLowerCase()) || i.bName.toLowerCase().includes(q.toLowerCase()))
  ), [brand, cat, q]);

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
    <div className="h-dvh w-screen overflow-hidden flex flex-col bg-[#EEF2F6]">
      <header className="bg-[#185DB5] text-white px-3 py-2 shadow shrink-0">
        <div className="max-w-[1600px] mx-auto flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white text-[#185DB5] font-black flex items-center justify-center">MM</div>
              <div>
                <h1 className="text-sm md:text-base font-black leading-none">M. MURAD SONS</h1>
                <p className="text-[10px] text-blue-100">Sanitary, Ceramics & Electric • Al-Kabir Town</p>
              </div>
            </div>
            <div className="relative flex-1 max-w-md hidden sm:block">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input value={q} onChange={e => { setQ(e.target.value); setPage(0); }} placeholder="Search Porta, Faisal shower, Dell basin, China vanity..." className="w-full pl-8 pr-3 py-1 rounded-lg bg-white text-slate-800 text-xs focus:outline-none" />
            </div>
            <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 bg-white text-[#185DB5] font-extrabold text-xs px-3 py-1.5 rounded-lg shadow">
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Cart ({cart.reduce((s, x) => s + x.qty, 0)})</span>
            </button>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {BRANDS.map(([slug, name, sub, bdg]) => (
              <button key={slug} onClick={() => { setBrand(slug); setPage(0); }} className={`shrink-0 px-2.5 py-1 rounded-xl border text-left transition ${brand === slug ? "bg-white text-[#185DB5] border-white shadow" : "bg-[#134B94] text-white border-blue-400/30"}`}>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-extrabold">{name}</span>
                  <span className="text-[9px] font-bold bg-amber-500 text-white px-1.5 rounded-full">{bdg}</span>
                </div>
                <p className={`text-[9px] hidden sm:block ${brand === slug ? "text-slate-500" : "text-blue-200"}`}>{sub}</p>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 max-w-[1600px] w-full mx-auto p-2 md:p-3 grid grid-cols-1 lg:grid-cols-12 gap-2.5 overflow-hidden">
        <section className="lg:col-span-4 bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-white rounded-2xl p-3 md:p-4 flex flex-row lg:flex-col justify-between items-center lg:items-stretch shadow-lg shrink-0">
          <div className="space-y-1.5 max-w-[65%] lg:max-w-full">
            <span className="inline-flex items-center gap-1 bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full"><Sparkles className="w-3 h-3" /> HOT SHOWROOM DEAL</span>
            <h2 className="text-sm sm:text-base lg:text-xl font-black leading-tight">Nano Black Kitchen Sink & Gold Shower Series</h2>
            <p className="text-[11px] text-slate-300 hidden sm:block">Porta Ceramics, Faisal Sanitary Shower Sets, Dell Ceramics & Imported China Vanities at Wholesale Rates.</p>
            <div className="hidden lg:grid grid-cols-2 gap-2 pt-2">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-2"><span className="text-amber-400 text-[11px] font-bold block">DuraMax Pipes</span><span className="text-sm font-black">50% FLAT OFF</span></div>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-2"><span className="text-sky-400 text-[11px] font-bold block">Popular PPR-C</span><span className="text-sm font-black">40% FLAT OFF</span></div>
            </div>
          </div>
          <div className="hidden lg:flex my-auto py-4 items-center justify-around bg-slate-900/70 rounded-2xl border border-slate-800 text-5xl">
            <span>🖤</span><span>🚿</span><span>🪞</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-1.5 shrink-0">
            <button onClick={() => { setBrand("china"); setPage(0); }} className="bg-white text-slate-900 font-extrabold text-xs px-3 py-2 rounded-xl flex-1">Quick Price</button>
            <a href="https://wa.me/923086235608" target="_blank" className="bg-[#185DB5] text-white font-extrabold text-xs px-3 py-2 rounded-xl text-center flex-1">WhatsApp Inquiry</a>
          </div>
        </section>

        <section className="lg:col-span-8 flex flex-col min-h-0 gap-2 overflow-hidden">
          <div className="bg-white rounded-xl px-2.5 py-1.5 shadow-sm border flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {FILTERS.map(([id, label]) => (
                <button key={id} onClick={() => { setCat(id); setPage(0); }} className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold ${cat === id ? "bg-[#185DB5] text-white" : "bg-slate-100 text-slate-700"}`}>{label}</button>
              ))}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[11px] font-bold text-slate-500">{cur + 1}/{pages}</span>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={cur === 0} className="p-1 rounded bg-slate-100 disabled:opacity-40"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={cur >= pages - 1} className="p-1 rounded bg-slate-100 disabled:opacity-40"><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          <div className="flex-1 min-h-0 grid grid-cols-2 md:grid-cols-3 grid-rows-2 gap-2 overflow-hidden">
            {shown.map(i => (
              <div key={i.id} className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-extrabold text-[#185DB5] bg-blue-50 px-2 py-0.5 rounded truncate">{i.bName}</span>
                  <span className="text-[10px] font-extrabold bg-slate-900 text-white px-2 py-0.5 rounded shrink-0">{i.badge}</span>
                </div>
                <div className="my-auto text-center text-3xl md:text-4xl py-1">{i.icon}</div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 line-clamp-1">{i.name}</h3>
                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-100">
                    <div>
                      {i.old > 0 && <span className="text-[10px] text-slate-400 line-through block leading-none">Rs. {i.old.toLocaleString()}</span>}
                      <span className="text-xs md:text-sm font-black text-slate-900">{i.wa ? "Ask Live Rate" : `Rs. ${i.price.toLocaleString()}`}</span>
                    </div>
                    {i.wa ? (
                      <a href={`https://wa.me/923086235608?text=${encodeURIComponent(`Rate for ${i.name}`)}`} target="_blank" className="bg-[#25D366] text-white text-[11px] font-extrabold px-2.5 py-1 rounded-lg">Rate</a>
                    ) : (
                      <button onClick={() => add(i)} className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold text-white flex items-center gap-1 ${added === i.id ? "bg-emerald-600" : "bg-[#185DB5]"}`}>
                        {added === i.id ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}<span>{added === i.id ? "Added" : "Add"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-[#185DB5] text-white px-3 py-1.5 shrink-0">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 font-bold truncate"><ShieldCheck className="w-4 h-4 text-[#25D366]" /><span>Plaza No. 4, Al-Kabir Town, Opp. Lake City, Raiwind Road, Lahore</span></div>
          <a href="https://wa.me/923086235608" target="_blank" className="bg-[#25D366] text-white font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1"><PhoneCall className="w-3 h-3" /><span>Get Custom Rate via WhatsApp / 0308-6235608 • 0321-7165000</span></a>
        </div>
      </footer>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex justify-end">
          <div className="w-full max-w-sm bg-white h-full p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="font-black text-sm">Selected Order List</h2>
              <button onClick={() => setOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto py-2 space-y-2">
              {cart.length === 0 ? <p className="text-xs text-slate-400 text-center py-10">Cart is empty</p> : cart.map(c => (
                <div key={c.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border text-xs">
                  <div><p className="font-bold">{c.name}</p><p className="text-slate-500">Rs. {c.price.toLocaleString()} x {c.qty}</p></div>
                  <button onClick={() => setCart(p => p.filter(x => x.id !== c.id))} className="text-rose-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <button onClick={sendWA} className="w-full bg-[#25D366] text-white font-extrabold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs">
                <Send className="w-3.5 h-3.5" /><span>Send Order on WhatsApp (Rs. {total.toLocaleString()})</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
