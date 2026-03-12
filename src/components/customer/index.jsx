import { useState, useEffect, useRef } from "react";
import { createOrder, decreaseStock, fetchMyOrders, subscribeOrders, fetchSettings, validateVoucher } from "../../lib/db.js";
import { fmt, genCode, genId, now } from "../../utils/index.js";

/* ─── helpers ─── */
const parseProducts = p => { if (!p) return []; if (Array.isArray(p)) return p; try { return JSON.parse(p); } catch { return []; } };
const sanitizeWA = n => { if (!n) return ""; const c = n.replace(/[^0-9]/g, ""); if (c.startsWith("0")) return "62" + c.slice(1); if (c.startsWith("62")) return c; return c; };
const fmtDate = d => { if (!d) return ""; try { return new Date(d).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return d; } };

/* ══════════ SPLASH ══════════ */
export function Splash({ onDone, settings }) {
  const [prog, setProg] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setProg(p => { if (p >= 100) { clearInterval(t); setTimeout(onDone, 200); return 100; } return p + 3.5; }), 35);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, var(--c-primary-dark,#1E3A8A) 0%, var(--c-primary,#2563EB) 100%)", padding: 24 }}>
      <div style={{ width: 88, height: 88, background: "rgba(255,255,255,.12)", borderRadius: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, marginBottom: 24, boxShadow: "0 8px 32px rgba(0,0,0,.25)", backdropFilter: "blur(12px)" }}>🛒</div>
      <h1 style={{ color: "#fff", fontWeight: 900, fontSize: 28, letterSpacing: "-0.5px", marginBottom: 6 }}>{settings?.store_name || "KIOS REFRES"}</h1>
      <p style={{ color: "rgba(255,255,255,.6)", fontSize: 14, marginBottom: 36 }}>{settings?.store_tagline || "Belanja Hemat Setiap Hari"}</p>
      <div style={{ width: 200, height: 4, background: "rgba(255,255,255,.2)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: prog + "%", height: "100%", background: "#fff", borderRadius: 99, transition: "width .05s linear" }} />
      </div>
      <p style={{ color: "rgba(255,255,255,.4)", fontSize: 11, marginTop: 12 }}>Memuat toko…</p>
    </div>
  );
}

/* ══════════ NAVBAR ══════════ */
export function Navbar({ cartCount, page, setPage, q, setQ, customer, onLogout, settings }) {
  const [drawer, setDrawer] = useState(false);
  return (
    <>
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "linear-gradient(135deg, var(--c-primary-dark,#1E3A8A), var(--c-primary,#2563EB))", boxShadow: "0 2px 16px rgba(0,0,0,.18)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px", height: 58, display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setPage("home")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, background: "rgba(255,255,255,.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>🛒</div>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 15 }} className="hide-mobile">{settings?.store_name || "KIOS REFRES"}</span>
          </button>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: .55, fontSize: 14, color: "#fff" }}>🔍</span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cari produk…" style={{ width: "100%", padding: "9px 14px 9px 36px", borderRadius: 99, border: "1.5px solid rgba(255,255,255,.25)", background: "rgba(255,255,255,.12)", color: "#fff", fontSize: 13, outline: "none", backdropFilter: "blur(8px)", boxSizing: "border-box" }} />
          </div>
          <button onClick={() => setPage("cart")} style={{ position: "relative", background: "rgba(255,255,255,.15)", border: "none", cursor: "pointer", width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, backdropFilter: "blur(8px)" }}>
            🛍️
            {cartCount > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "#EF4444", color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, border: "2px solid #fff" }}>{cartCount > 9 ? "9+" : cartCount}</span>}
          </button>
          {customer
            ? <button onClick={() => setDrawer(true)} style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,.2)", border: "2px solid rgba(255,255,255,.4)", cursor: "pointer", fontWeight: 900, color: "#fff", fontSize: 15, flexShrink: 0 }}>{customer.username?.[0]?.toUpperCase() || "U"}</button>
            : <button onClick={() => setPage("auth")} style={{ background: "rgba(255,255,255,.15)", border: "1.5px solid rgba(255,255,255,.3)", borderRadius: 10, padding: "7px 14px", cursor: "pointer", color: "#fff", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>Masuk</button>
          }
        </div>
      </nav>
      {drawer && customer && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)" }} onClick={() => setDrawer(false)} />
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 280, background: "#fff", padding: 24, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #F1F5F9" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, var(--c-primary-dark,#1E3A8A), var(--c-primary,#2563EB))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 22 }}>{customer.username?.[0]?.toUpperCase()}</div>
              <div><p style={{ fontWeight: 900, fontSize: 15 }}>{customer.username}</p><p style={{ fontSize: 12, color: "#64748B" }}>{customer.phone}</p></div>
            </div>
            {[["🛍️","Belanja","home"],["🧾","Pesanan Saya","orders"],["🛒","Keranjang","cart"]].map(([ico,lbl,pg]) => (
              <button key={pg} onClick={() => { setPage(pg); setDrawer(false); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 8px", background: page === pg ? "#EFF6FF" : "none", border: "none", borderRadius: 11, cursor: "pointer", fontWeight: 700, fontSize: 14, color: page === pg ? "#2563EB" : "#334155", marginBottom: 4, textAlign: "left" }}>
                <span style={{ fontSize: 18 }}>{ico}</span>{lbl}
              </button>
            ))}
            <div style={{ marginTop: "auto" }}>
              <button onClick={() => { onLogout(); setDrawer(false); }} style={{ width: "100%", padding: "11px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 11, cursor: "pointer", fontWeight: 700, fontSize: 14, color: "#EF4444" }}>🚪 Keluar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════ HOME ══════════ */
export function Home({ products, onDetail, onAdd, q, categories: catsProp, settings }) {
  const [cat,  setCat]  = useState("Semua");
  const [sort, setSort] = useState("default");
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;

  const cats = ["Semua", ...new Set(normCats(catsProp).length > 0 ? normCats(catsProp) : (products || []).map(p => p.cat).filter(Boolean))];
  function normCats(arr) { return (arr || []).map(c => typeof c === "string" ? c : c?.name || "").filter(Boolean); }

  const filtered = (products || []).filter(p => {
    if (cat !== "Semua" && p.cat !== cat) return false;
    if (q && !(p.name || "").toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }).sort((a, b) => sort === "price_asc" ? a.price - b.price : sort === "price_desc" ? b.price - a.price : sort === "popular" ? (b.sold || 0) - (a.sold || 0) : 0);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const terlaris = (products || []).filter(p => p.stock > 0).sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 8);

  useEffect(() => { setPage(1); }, [cat, sort, q]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px 80px" }}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, var(--c-primary-dark,#1E3A8A) 0%, var(--c-primary,#2563EB) 60%, #60A5FA 100%)", borderRadius: "0 0 28px 28px", padding: "32px 28px", marginBottom: 28, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -30, top: -30, width: 180, height: 180, background: "rgba(255,255,255,.07)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", right: 40, bottom: -60, width: 240, height: 240, background: "rgba(255,255,255,.05)", borderRadius: "50%" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ color: "rgba(255,255,255,.7)", fontSize: 13, marginBottom: 8 }}>👋 Selamat datang</p>
          <h2 style={{ color: "#fff", fontWeight: 900, fontSize: 22, marginBottom: 8, lineHeight: 1.3 }}>{settings?.store_tagline || "Belanja Hemat Setiap Hari"}</h2>
          <p style={{ color: "rgba(255,255,255,.65)", fontSize: 13 }}>🕐 {settings?.store_hours || "07.00 – 21.00 WIB"}</p>
        </div>
      </div>

      {/* Terlaris */}
      {terlaris.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ fontWeight: 900, fontSize: 16, color: "#0F172A", display: "flex", alignItems: "center", gap: 7 }}>🔥 Produk Terlaris</h3>
          </div>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }} className="noscroll">
            {terlaris.map(p => (
              <div key={p.id} onClick={() => onDetail(p)} style={{ flexShrink: 0, width: 140, cursor: "pointer", background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,.08)", border: "1px solid #F1F5F9", transition: "transform .2s, box-shadow .2s" }} onMouseOver={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.12)"; }} onMouseOut={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,.08)"; }}>
                <div style={{ width: "100%", height: 100, position: "relative", background: "#F8FAFC" }}>
                  {p.img ? <img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🛒</div>}
                  {(p.sold || 0) > 0 && <div style={{ position: "absolute", top: 6, left: 6, background: "#EF4444", color: "#fff", borderRadius: 6, padding: "2px 6px", fontSize: 10, fontWeight: 900 }}>🔥 {p.sold}</div>}
                </div>
                <div style={{ padding: "8px 10px" }}>
                  <p style={{ fontWeight: 800, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>{p.name}</p>
                  <p style={{ fontWeight: 900, fontSize: 13, color: "var(--c-primary,#2563EB)" }}>{fmt(p.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
        <div className="noscroll" style={{ display: "flex", gap: 8, overflowX: "auto", flex: 1, paddingBottom: 4 }}>
          {cats.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{ flexShrink: 0, padding: "7px 16px", borderRadius: 99, border: `1.5px solid ${cat === c ? "var(--c-primary,#2563EB)" : "#E2E8F0"}`, background: cat === c ? "var(--c-primary,#2563EB)" : "#fff", color: cat === c ? "#fff" : "#64748B", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", transition: "all .15s" }}>
              {c}
            </button>
          ))}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ flexShrink: 0, padding: "8px 12px", borderRadius: 10, border: "1.5px solid #E2E8F0", background: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", outline: "none" }}>
          <option value="default">Urutan Default</option>
          <option value="price_asc">Harga Termurah</option>
          <option value="price_desc">Harga Termahal</option>
          <option value="popular">Terpopuler</option>
        </select>
      </div>

      {/* Results header */}
      <div style={{ marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>{filtered.length} produk{q ? ` untuk "${q}"` : cat !== "Semua" ? ` di "${cat}"` : ""}</p>
      </div>

      {/* Product grid */}
      {visible.length === 0
        ? <div style={{ textAlign: "center", padding: "48px 20px" }}><p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p><p style={{ fontWeight: 800, fontSize: 16, color: "#0F172A", marginBottom: 6 }}>Produk tidak ditemukan</p><p style={{ color: "#64748B", fontSize: 13 }}>Coba kata kunci lain atau pilih kategori berbeda</p></div>
        : <div className="product-grid">
          {visible.map(p => <ProductCard key={p.id} p={p} onDetail={onDetail} onAdd={onAdd} />)}
        </div>
      }

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 28 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "8px 16px", borderRadius: 10, border: "1.5px solid #E2E8F0", background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? .4 : 1, fontWeight: 700, fontSize: 13 }}>← Prev</button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => { const pg = Math.max(1, Math.min(totalPages - 4, page - 2)) + i; return <button key={pg} onClick={() => setPage(pg)} style={{ width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${page === pg ? "var(--c-primary,#2563EB)" : "#E2E8F0"}`, background: page === pg ? "var(--c-primary,#2563EB)" : "#fff", color: page === pg ? "#fff" : "#334155", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{pg}</button>; })}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "8px 16px", borderRadius: 10, border: "1.5px solid #E2E8F0", background: "#fff", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? .4 : 1, fontWeight: 700, fontSize: 13 }}>Next →</button>
        </div>
      )}
    </div>
  );
}

/* ══════════ PRODUCT CARD ══════════ */
function ProductCard({ p, onDetail, onAdd }) {
  const pct = p.stock > 0 ? Math.min(100, Math.round((p.stock / Math.max(p.stock + (p.sold || 0), 1)) * 100)) : 0;
  return (
    <div onClick={() => onDetail(p)} style={{ background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,.07)", border: "1px solid #F1F5F9", cursor: "pointer", transition: "transform .2s, box-shadow .2s", display: "flex", flexDirection: "column" }} onMouseOver={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,.12)"; }} onMouseOut={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,.07)"; }}>
      <div style={{ width: "100%", paddingTop: "75%", position: "relative", background: "#F8FAFC" }}>
        {p.img ? <img src={p.img} alt={p.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} /> : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🛒</div>}
        {p.stock === 0 && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ background: "#EF4444", color: "#fff", borderRadius: 99, padding: "5px 14px", fontWeight: 900, fontSize: 12 }}>HABIS</span></div>}
        {(p.sold || 0) >= 10 && <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(239,68,68,.9)", color: "#fff", borderRadius: 8, padding: "3px 8px", fontSize: 10, fontWeight: 900 }}>🔥 LARIS</div>}
      </div>
      <div style={{ padding: "12px 13px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
        <p style={{ fontWeight: 800, fontSize: 13, lineHeight: 1.35, marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.name}</p>
        {/* Stock bar */}
        {p.stock > 0 && p.stock < 20 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ height: 4, background: "#F1F5F9", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: pct + "%", height: "100%", background: p.stock < 5 ? "#EF4444" : "#F59E0B", borderRadius: 99 }} />
            </div>
            <p style={{ fontSize: 10, color: p.stock < 5 ? "#EF4444" : "#F59E0B", fontWeight: 700, marginTop: 2 }}>Sisa {p.stock} unit</p>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
          <p style={{ fontWeight: 900, fontSize: 15, color: "var(--c-primary,#2563EB)" }}>{fmt(p.price)}</p>
          {p.stock > 0 && (
            <button onClick={e => { e.stopPropagation(); onAdd(p); }} style={{ background: "var(--c-primary,#2563EB)", color: "#fff", border: "none", borderRadius: 99, width: 30, height: 30, cursor: "pointer", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(37,99,235,.3)" }}>+</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════ DETAIL ══════════ */
export function Detail({ p, onBack, onAdd, onBuy }) {
  const [qty, setQty] = useState(1);
  const stockPct = p.stock > 0 ? Math.min(100, Math.round(p.stock / Math.max(p.stock + (p.sold || 0), 1) * 100)) : 0;
  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px 100px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-primary,#2563EB)", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", gap: 5, margin: "16px 0" }}>← Kembali</button>
      <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,.1)", border: "1px solid #F1F5F9" }}>
        <div style={{ width: "100%", paddingTop: "60%", position: "relative", background: "#F8FAFC" }}>
          {p.img ? <img src={p.img} alt={p.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} /> : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>🛒</div>}
          {p.stock === 0 && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ background: "#EF4444", color: "#fff", borderRadius: 99, padding: "8px 24px", fontWeight: 900 }}>STOK HABIS</span></div>}
        </div>
        <div style={{ padding: 22 }}>
          {p.cat && <span style={{ background: "var(--c-primary-light,#DBEAFE)", color: "var(--c-primary,#2563EB)", borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 700, marginBottom: 10, display: "inline-block" }}>{p.cat}</span>}
          <h2 style={{ fontWeight: 900, fontSize: 20, color: "#0F172A", marginBottom: 6, lineHeight: 1.3 }}>{p.name}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <p style={{ fontWeight: 900, fontSize: 24, color: "var(--c-primary,#2563EB)" }}>{fmt(p.price)}</p>
            {(p.sold || 0) > 0 && <span style={{ background: "#FEF3C7", color: "#92400E", borderRadius: 8, padding: "3px 9px", fontSize: 11, fontWeight: 700 }}>🔥 {p.sold} terjual</span>}
          </div>
          {/* Stock indicator */}
          {p.stock > 0
            ? <div style={{ background: "#F0FDF4", border: "1px solid #A7F3D0", borderRadius: 12, padding: "11px 14px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#065F46" }}>Stok Tersedia</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: p.stock < 5 ? "#EF4444" : "#059669" }}>{p.stock} unit</span>
              </div>
              <div style={{ height: 6, background: "#D1FAE5", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: stockPct + "%", height: "100%", background: p.stock < 5 ? "#EF4444" : "#10B981", borderRadius: 99 }} />
              </div>
              {p.stock < 10 && <p style={{ fontSize: 11, color: p.stock < 5 ? "#EF4444" : "#F59E0B", fontWeight: 700, marginTop: 4 }}>⚠️ Sisa {p.stock} unit — segera pesan!</p>}
            </div>
            : <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "11px 14px", marginBottom: 16 }}>
              <p style={{ fontWeight: 900, color: "#EF4444", fontSize: 14 }}>❌ Stok Habis</p>
              <p style={{ fontSize: 12, color: "#B91C1C" }}>Produk ini sedang tidak tersedia</p>
            </div>
          }
          {p.desc && <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, marginBottom: 18 }}>{p.desc}</p>}
          {p.stock > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Jumlah:</span>
                <div style={{ display: "flex", alignItems: "center", gap: 0, background: "#F8FAFC", borderRadius: 12, border: "1.5px solid #E2E8F0", overflow: "hidden" }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 38, height: 38, background: "none", border: "none", cursor: "pointer", fontSize: 18, fontWeight: 900, color: "#334155" }}>−</button>
                  <span style={{ width: 40, textAlign: "center", fontWeight: 900, fontSize: 15 }}>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(p.stock, q + 1))} style={{ width: 38, height: 38, background: "none", border: "none", cursor: "pointer", fontSize: 18, fontWeight: 900, color: "var(--c-primary,#2563EB)" }}>+</button>
                </div>
                <span style={{ fontSize: 13, color: "#64748B" }}>× {fmt(p.price)} = <strong style={{ color: "#0F172A" }}>{fmt(p.price * qty)}</strong></span>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => onAdd(p, qty)} style={{ flex: 1, padding: "13px", borderRadius: 13, border: `2px solid var(--c-primary,#2563EB)`, background: "var(--c-primary-light,#EFF6FF)", color: "var(--c-primary,#2563EB)", fontWeight: 900, fontSize: 14, cursor: "pointer" }}>🛒 Keranjang</button>
                <button onClick={() => onBuy(p, qty)} style={{ flex: 1, padding: "13px", borderRadius: 13, border: "none", background: "var(--c-primary,#2563EB)", color: "#fff", fontWeight: 900, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 14px rgba(37,99,235,.3)" }}>⚡ Beli Sekarang</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════ CART ══════════ */
export function Cart({ cart, onQty, onRemove, onCheckout, onBack }) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0 14px" }}>
        <h2 style={{ fontWeight: 900, fontSize: 18, color: "#0F172A" }}>🛍️ Keranjang ({cart.length})</h2>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-primary,#2563EB)", fontWeight: 700, fontSize: 13 }}>← Lanjut Belanja</button>
      </div>
      {cart.length === 0
        ? <div style={{ textAlign: "center", padding: "48px 20px" }}><p style={{ fontSize: 48, marginBottom: 12 }}>🛒</p><p style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Keranjang Kosong</p><p style={{ color: "#64748B", fontSize: 13 }}>Tambahkan produk untuk mulai belanja</p></div>
        : <>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
            {cart.map(item => (
              <div key={item.id} style={{ background: "#fff", borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 2px 8px rgba(0,0,0,.06)", border: "1px solid #F1F5F9" }}>
                {item.img ? <img src={item.img} alt={item.name} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 11, flexShrink: 0 }} onError={e => { e.target.style.display = "none"; }} /> : <div style={{ width: 60, height: 60, background: "#F8FAFC", borderRadius: 11, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🛒</div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 800, fontSize: 14, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                  <p style={{ fontWeight: 900, fontSize: 14, color: "var(--c-primary,#2563EB)" }}>{fmt(item.price)}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                  <button onClick={() => onRemove(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 14 }}>✕</button>
                  <div style={{ display: "flex", alignItems: "center", gap: 0, background: "#F8FAFC", borderRadius: 10, border: "1.5px solid #E2E8F0", overflow: "hidden" }}>
                    <button onClick={() => onQty(item.id, item.qty - 1)} style={{ width: 30, height: 30, background: "none", border: "none", cursor: "pointer", fontWeight: 900, fontSize: 16, color: "#334155" }}>−</button>
                    <span style={{ width: 30, textAlign: "center", fontWeight: 900, fontSize: 14 }}>{item.qty}</span>
                    <button onClick={() => onQty(item.id, item.qty + 1)} style={{ width: 30, height: 30, background: "none", border: "none", cursor: "pointer", fontWeight: 900, fontSize: 16, color: "var(--c-primary,#2563EB)" }}>+</button>
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>{fmt(item.price * item.qty)}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: "#fff", borderRadius: 18, padding: "18px 20px", boxShadow: "0 4px 20px rgba(0,0,0,.08)", border: "1px solid #F1F5F9" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontWeight: 700, color: "#64748B" }}>Subtotal ({cart.reduce((s, i) => s + i.qty, 0)} item)</span>
              <span style={{ fontWeight: 900, fontSize: 18, color: "#0F172A" }}>{fmt(total)}</span>
            </div>
            <button onClick={onCheckout} style={{ width: "100%", padding: "14px", borderRadius: 13, border: "none", background: "var(--c-primary,#2563EB)", color: "#fff", fontWeight: 900, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 16px rgba(37,99,235,.3)" }}>Lanjut Checkout →</button>
          </div>
        </>
      }
    </div>
  );
}

/* ══════════ CHECKOUT ══════════ */
export function Checkout({ cart, onBack, onSuccess, customer, settings }) {
  const [step, setStep] = useState(1); // 1=Info, 2=Bayar, 3=Konfirmasi
  const [form, setForm] = useState({
    name: customer?.username || "", phone: customer?.phone || "",
    method: "delivery", address: "", note: "",
  });
  const [payGroup,  setPayGroup]  = useState("");
  const [payDetail, setPayDetail] = useState("");
  const [payBank,   setPayBank]   = useState(null);
  const [voucher,   setVoucher]   = useState("");
  const [voucherData, setVoucherData] = useState(null);
  const [voucherErr,  setVoucherErr]  = useState("");
  const [voucherOk,   setVoucherOk]   = useState(false);
  const [checkingVoucher, setCheckingVoucher] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errs, setErrs] = useState({});
  const [qrisTimer, setQrisTimer] = useState(0);
  const qrisTimerRef = useRef(null);

  const subtotal  = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const ONGKIR    = form.method === "delivery" ? 5000 : 0;
  const discount  = voucherData ? (voucherData.type === "percent" ? Math.round(subtotal * voucherData.value / 100) : voucherData.value) : 0;
  const total     = subtotal + ONGKIR - discount;
  const qrisImg   = settings?.qris_image || "";

  /* Build bank list — mendukung key lama (bank_bca) & baru (bank1) */
  const banks = [];
  ["bca","mandiri","bni","bri","bsi"].forEach(k => {
    const num = settings?.["bank_" + k]; if (num) banks.push({ label: k.toUpperCase(), number: num, name: settings?.["bank_" + k + "_name"] || "" });
  });
  ["bank1","bank2","bank3","bank4","bank5"].forEach((k, i) => {
    const num = settings?.[k]; const lbl = ["BCA","BNI","Mandiri","BRI","BSI"][i];
    if (num && !banks.find(b => b.label === lbl)) banks.push({ label: lbl, number: num, name: settings?.[k + "_name"] || "" });
  });

  /* Build ewallet list */
  const ewallets = [];
  const ewSeen = new Set();
  [["gopay","GoPay"],["ovo","OVO"],["dana","DANA"],["shopeepay","ShopeePay"],["ewallet_gopay","GoPay"],["ewallet_ovo","OVO"],["ewallet_dana","DANA"],["ewallet_shopeepay","ShopeePay"]].forEach(([k, lbl]) => {
    if (settings?.[k] && !ewSeen.has(lbl)) { ewallets.push({ label: lbl, number: settings[k] }); ewSeen.add(lbl); }
  });

  const payGroups = [
    ...(qrisImg ? [{ id: "qris", label: "QRIS", icon: "📷", desc: "Scan & bayar instan" }] : []),
    ...(banks.length > 0 ? [{ id: "transfer", label: "Transfer Bank", icon: "🏦", desc: `${banks.length} bank tersedia` }] : []),
    ...(ewallets.length > 0 ? [{ id: "ewallet", label: "E-Wallet", icon: "📱", desc: "GoPay, OVO, DANA dll" }] : []),
    { id: "cash", label: "Bayar di Toko / COD", icon: "💵", desc: "Bayar saat ambil/terima" },
  ];

  const sf = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrs(p => ({ ...p, [k]: "" })); };

  const checkVoucher = async () => {
    if (!voucher.trim()) return;
    setCheckingVoucher(true); setVoucherErr(""); setVoucherOk(false);
    try {
      const data = await validateVoucher(voucher.trim().toUpperCase(), subtotal);
      if (!data) { setVoucherErr("Kode voucher tidak valid atau tidak aktif"); setVoucherData(null); }
      else { setVoucherData(data); setVoucherOk(true); }
    } catch { setVoucherErr("Gagal memeriksa voucher"); }
    setCheckingVoucher(false);
  };

  const next1 = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Wajib diisi";
    if (!form.phone.trim()) e.phone = "Wajib diisi";
    if (form.method === "delivery" && !form.address.trim()) e.address = "Wajib diisi";
    if (Object.keys(e).length) { setErrs(e); return; }
    setStep(2);
  };

  const next2 = () => {
    if (!payGroup) { setErrs({ pay: "Pilih metode pembayaran" }); return; }
    if ((payGroup === "transfer" || payGroup === "ewallet") && !payDetail) { setErrs({ pay: "Pilih tujuan pembayaran" }); return; }
    if (payGroup === "qris") {
      setQrisTimer(300);
      qrisTimerRef.current = setInterval(() => setQrisTimer(t => { if (t <= 1) { clearInterval(qrisTimerRef.current); return 0; } return t - 1; }), 1000);
    }
    setErrs({});
    setStep(3);
  };

  useEffect(() => () => { if (qrisTimerRef.current) clearInterval(qrisTimerRef.current); }, []);

  const submit = async () => {
    setSubmitting(true);
    try {
      const orderItems = cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, img: i.img || "" }));
      const pickupCode = form.method === "pickup" ? genCode() : null;
      const order = {
        order_id: genId(),
        customer_id: customer?.id || null,
        customer_name: form.name,
        phone: form.phone,
        products: JSON.stringify(orderItems),
        total_price: total,
        delivery_method: form.method,
        address: form.address || null,
        pickup_code: pickupCode,
        order_status: payGroup === "cash" ? "menunggu_bayar" : "diproses",
        order_date: now(),
        payment_method: payGroup,
        pay_detail: payGroup === "transfer" ? payDetail : payGroup === "ewallet" ? payDetail : payGroup,
        voucher_code: voucherData ? voucher.toUpperCase() : null,
        discount_amount: discount || 0,
      };
      await createOrder(order);
      await decreaseStock(cart);
      if (qrisTimerRef.current) clearInterval(qrisTimerRef.current);
      onSuccess(order);
    } catch (e) { alert("Gagal membuat pesanan: " + e.message); }
    setSubmitting(false);
  };

  const stepLabel = ["Info Penerima", "Metode Pembayaran", "Konfirmasi"];

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px 100px" }}>
      {/* Step indicator */}
      <div style={{ padding: "16px 0 20px", display: "flex", alignItems: "center", gap: 0 }}>
        {stepLabel.map((lbl, i) => {
          const n = i + 1, active = step === n, done = step > n;
          return (
            <React.Fragment key={i}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: done ? "#059669" : active ? "var(--c-primary,#2563EB)" : "#E2E8F0", color: done || active ? "#fff" : "#94A3B8", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, transition: "all .2s" }}>{done ? "✓" : n}</div>
                <span style={{ fontSize: 10, fontWeight: 700, color: active ? "var(--c-primary,#2563EB)" : "#94A3B8", whiteSpace: "nowrap" }}>{lbl}</span>
              </div>
              {i < 2 && <div style={{ flex: 1, height: 2, background: step > i + 1 ? "#059669" : "#E2E8F0", margin: "0 8px", marginBottom: 20, transition: "background .2s" }} />}
            </React.Fragment>
          );
        })}
      </div>

      {/* STEP 1 — Info */}
      {step === 1 && (
        <div>
          <div style={{ background: "#fff", borderRadius: 18, padding: 20, marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: "1px solid #F1F5F9" }}>
            <h3 style={{ fontWeight: 900, fontSize: 15, marginBottom: 16 }}>📋 Info Penerima</h3>
            <Field label="Nama Lengkap" err={errs.name}><input className={`inp${errs.name ? " inp-err" : ""}`} value={form.name} onChange={e => sf("name", e.target.value)} placeholder="Nama lengkap penerima" /></Field>
            <Field label="Nomor HP / WhatsApp" err={errs.phone}><input className={`inp${errs.phone ? " inp-err" : ""}`} value={form.phone} onChange={e => sf("phone", e.target.value)} placeholder="08xx-xxxx-xxxx" /></Field>
          </div>
          <div style={{ background: "#fff", borderRadius: 18, padding: 20, marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: "1px solid #F1F5F9" }}>
            <h3 style={{ fontWeight: 900, fontSize: 15, marginBottom: 14 }}>🚚 Metode Pengiriman</h3>
            {[["delivery","🚚","Antar ke Rumah",`+${fmt(5000)} ongkir`],["pickup","🏪","Ambil di Toko","Gratis · tanpa ongkir"]].map(([val,ico,lbl,sub]) => (
              <div key={val} onClick={() => sf("method", val)} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 15px", borderRadius: 13, border: `2px solid ${form.method === val ? "var(--c-primary,#2563EB)" : "#E2E8F0"}`, background: form.method === val ? "var(--c-primary-light,#EFF6FF)" : "#fff", cursor: "pointer", marginBottom: 9, transition: "all .15s" }}>
                <span style={{ fontSize: 22 }}>{ico}</span>
                <div style={{ flex: 1 }}><p style={{ fontWeight: 800, fontSize: 13 }}>{lbl}</p><p style={{ fontSize: 12, color: "#64748B" }}>{sub}</p></div>
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${form.method === val ? "var(--c-primary,#2563EB)" : "#CBD5E1"}`, background: form.method === val ? "var(--c-primary,#2563EB)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{form.method === val && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}</div>
              </div>
            ))}
            {form.method === "delivery" && (
              <Field label="Alamat Pengiriman" err={errs.address}>
                <textarea className={`inp${errs.address ? " inp-err" : ""}`} value={form.address} onChange={e => sf("address", e.target.value)} placeholder="Alamat lengkap (jalan, RT/RW, kecamatan, kota)" rows={3} style={{ resize: "none" }} />
              </Field>
            )}
          </div>
          {/* Voucher */}
          <div style={{ background: "#fff", borderRadius: 18, padding: 20, marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: "1px solid #F1F5F9" }}>
            <h3 style={{ fontWeight: 900, fontSize: 15, marginBottom: 14 }}>🎟️ Voucher Diskon</h3>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="inp" value={voucher} onChange={e => { setVoucher(e.target.value.toUpperCase()); setVoucherOk(false); setVoucherData(null); setVoucherErr(""); }} placeholder="Masukkan kode voucher" style={{ flex: 1 }} onKeyDown={e => e.key === "Enter" && checkVoucher()} />
              <button onClick={checkVoucher} disabled={checkingVoucher || !voucher.trim()} style={{ padding: "10px 16px", borderRadius: 11, background: "var(--c-primary,#2563EB)", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", flexShrink: 0, opacity: !voucher.trim() ? .5 : 1 }}>{checkingVoucher ? "…" : "Pakai"}</button>
            </div>
            {voucherOk && voucherData && <div style={{ marginTop: 8, background: "#D1FAE5", border: "1px solid #A7F3D0", borderRadius: 10, padding: "9px 12px", fontSize: 13, fontWeight: 800, color: "#065F46" }}>✅ Diskon {voucherData.type === "percent" ? voucherData.value + "%" : fmt(voucherData.value)} · Hemat {fmt(discount)}</div>}
            {voucherErr && <p style={{ color: "#EF4444", fontSize: 12, fontWeight: 700, marginTop: 6 }}>❌ {voucherErr}</p>}
          </div>
          {/* Summary */}
          <div style={{ background: "#fff", borderRadius: 18, padding: 20, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: "1px solid #F1F5F9" }}>
            {[["Subtotal", fmt(subtotal)], ONGKIR > 0 && ["Ongkir", fmt(ONGKIR)], discount > 0 && ["Diskon Voucher", "-" + fmt(discount)]].filter(Boolean).map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}><span style={{ color: "#64748B" }}>{l}</span><span style={{ fontWeight: 700 }}>{v}</span></div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #F1F5F9", paddingTop: 12, marginTop: 4 }}><span style={{ fontWeight: 900, fontSize: 15 }}>Total</span><span style={{ fontWeight: 900, fontSize: 18, color: "var(--c-primary,#2563EB)" }}>{fmt(total)}</span></div>
          </div>
          <button onClick={next1} className="btn btn-primary btn-block btn-lg">Pilih Pembayaran →</button>
        </div>
      )}

      {/* STEP 2 — Bayar */}
      {step === 2 && (
        <div>
          <div style={{ background: "#fff", borderRadius: 18, padding: 20, marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: "1px solid #F1F5F9" }}>
            <h3 style={{ fontWeight: 900, fontSize: 15, marginBottom: 16 }}>💳 Metode Pembayaran</h3>
            {errs.pay && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "9px 12px", marginBottom: 12, fontSize: 13, color: "#B91C1C", fontWeight: 700 }}>❌ {errs.pay}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {payGroups.map(pg => (
                <div key={pg.id} onClick={() => { setPayGroup(pg.id); setPayDetail(""); setPayBank(null); setErrs({}); }} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 15px", borderRadius: 14, border: `2px solid ${payGroup === pg.id ? "var(--c-primary,#2563EB)" : "#E2E8F0"}`, background: payGroup === pg.id ? "var(--c-primary-light,#EFF6FF)" : "#fff", cursor: "pointer", transition: "all .15s" }}>
                  <span style={{ fontSize: 24 }}>{pg.icon}</span>
                  <div style={{ flex: 1 }}><p style={{ fontWeight: 800, fontSize: 14 }}>{pg.label}</p><p style={{ fontSize: 12, color: "#64748B" }}>{pg.desc}</p></div>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${payGroup === pg.id ? "var(--c-primary,#2563EB)" : "#CBD5E1"}`, background: payGroup === pg.id ? "var(--c-primary,#2563EB)" : "#fff", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{payGroup === pg.id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}</div>
                </div>
              ))}
            </div>
            {/* Transfer bank sub-select */}
            {payGroup === "transfer" && banks.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: "#64748B", marginBottom: 8 }}>Pilih Bank Tujuan:</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {banks.map(b => (
                    <div key={b.label} onClick={() => { setPayBank(b); setPayDetail(`${b.label} - ${b.number}${b.name ? " (a/n " + b.name + ")" : ""}`); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 12, border: `2px solid ${payBank?.label === b.label ? "var(--c-primary,#2563EB)" : "#E2E8F0"}`, background: payBank?.label === b.label ? "var(--c-primary-light,#EFF6FF)" : "#F8FAFC", cursor: "pointer", transition: "all .15s" }}>
                      <div style={{ width: 38, height: 38, background: "var(--c-primary-light,#DBEAFE)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12, color: "var(--c-primary,#2563EB)", flexShrink: 0 }}>{b.label}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 900, fontSize: 13 }}>{b.number}</p>
                        {b.name && <p style={{ fontSize: 11, color: "#64748B" }}>a/n {b.name}</p>}
                      </div>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${payBank?.label === b.label ? "var(--c-primary,#2563EB)" : "#CBD5E1"}`, background: payBank?.label === b.label ? "var(--c-primary,#2563EB)" : "#fff", flexShrink: 0 }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* E-wallet sub-select */}
            {payGroup === "ewallet" && ewallets.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: "#64748B", marginBottom: 8 }}>Pilih E-Wallet:</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {ewallets.map(ew => (
                    <div key={ew.label} onClick={() => setPayDetail(`${ew.label} - ${ew.number}`)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 12, border: `2px solid ${payDetail === `${ew.label} - ${ew.number}` ? "var(--c-primary,#2563EB)" : "#E2E8F0"}`, background: payDetail === `${ew.label} - ${ew.number}` ? "var(--c-primary-light,#EFF6FF)" : "#F8FAFC", cursor: "pointer" }}>
                      <div style={{ width: 38, height: 38, background: "#E0E7FF", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 11, color: "#4338CA", flexShrink: 0 }}>{ew.label}</div>
                      <div style={{ flex: 1 }}><p style={{ fontWeight: 900, fontSize: 13 }}>{ew.number}</p><p style={{ fontSize: 11, color: "#64748B" }}>{ew.label}</p></div>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${payDetail === `${ew.label} - ${ew.number}` ? "var(--c-primary,#2563EB)" : "#CBD5E1"}`, background: payDetail === `${ew.label} - ${ew.number}` ? "var(--c-primary,#2563EB)" : "#fff" }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep(1)} className="btn btn-ghost" style={{ flex: 1 }}>← Kembali</button>
            <button onClick={next2} className="btn btn-primary" style={{ flex: 2 }}>Konfirmasi →</button>
          </div>
        </div>
      )}

      {/* STEP 3 — Konfirmasi */}
      {step === 3 && (
        <div>
          <div style={{ background: "#fff", borderRadius: 18, padding: 20, marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: "1px solid #F1F5F9" }}>
            <h3 style={{ fontWeight: 900, fontSize: 15, marginBottom: 16 }}>📋 Ringkasan Pesanan</h3>
            {[["Penerima", form.name], ["HP", form.phone], ["Pengiriman", form.method === "delivery" ? "🚚 " + (form.address || "–") : "🏪 Ambil di Toko"], ["Pembayaran", payGroup === "transfer" ? payDetail : payGroup === "ewallet" ? payDetail : payGroup === "qris" ? "QRIS" : "Bayar di Toko / COD"]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", gap: 14, marginBottom: 11, fontSize: 13 }}>
                <span style={{ color: "#64748B", fontWeight: 700, minWidth: 80 }}>{l}</span>
                <span style={{ fontWeight: 800, flex: 1 }}>{v}</span>
              </div>
            ))}
          </div>
          {/* QRIS display */}
          {payGroup === "qris" && qrisImg && (
            <div style={{ background: "#fff", borderRadius: 18, padding: 20, marginBottom: 14, textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: "1px solid #F1F5F9" }}>
              <p style={{ fontWeight: 900, fontSize: 15, marginBottom: 12 }}>📷 Scan QRIS untuk Bayar</p>
              <img src={qrisImg} alt="QRIS" style={{ maxWidth: 200, borderRadius: 12, border: "2px solid #E2E8F0" }} onError={e => { e.target.style.display = "none"; }} />
              {qrisTimer > 0 && <p style={{ fontSize: 13, color: "#64748B", marginTop: 10 }}>Kadaluarsa dalam <strong style={{ color: qrisTimer < 60 ? "#EF4444" : "#0F172A" }}>{Math.floor(qrisTimer / 60)}:{String(qrisTimer % 60).padStart(2, "0")}</strong></p>}
            </div>
          )}
          {/* Transfer bank instructions */}
          {payGroup === "transfer" && payBank && (
            <div style={{ background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: 16, padding: 18, marginBottom: 14 }}>
              <p style={{ fontWeight: 900, fontSize: 14, color: "#1D4ED8", marginBottom: 12 }}>🏦 Transfer ke Rekening:</p>
              <div style={{ background: "#fff", borderRadius: 12, padding: "13px 16px", marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><span style={{ color: "#64748B", fontSize: 12 }}>Bank</span><span style={{ fontWeight: 900, fontSize: 14 }}>{payBank.label}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><span style={{ color: "#64748B", fontSize: 12 }}>No. Rekening</span><span style={{ fontWeight: 900, fontFamily: "monospace", fontSize: 15 }}>{payBank.number}</span></div>
                {payBank.name && <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748B", fontSize: 12 }}>Atas Nama</span><span style={{ fontWeight: 800 }}>{payBank.name}</span></div>}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderTop: "1px dashed #BFDBFE" }}>
                <span style={{ fontWeight: 800, color: "#1D4ED8" }}>Jumlah Transfer</span>
                <span style={{ fontWeight: 900, fontSize: 16, color: "#1D4ED8" }}>{fmt(total)}</span>
              </div>
              <p style={{ fontSize: 11, color: "#3B82F6", marginTop: 8 }}>⚠️ Transfer tepat nominal di atas agar mempermudah verifikasi.</p>
            </div>
          )}
          <div style={{ background: "#fff", borderRadius: 18, padding: 18, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: "1px solid #F1F5F9" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}><span style={{ color: "#64748B" }}>Subtotal</span><span style={{ fontWeight: 700 }}>{fmt(subtotal)}</span></div>
            {ONGKIR > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}><span style={{ color: "#64748B" }}>Ongkir</span><span style={{ fontWeight: 700 }}>{fmt(ONGKIR)}</span></div>}
            {discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}><span style={{ color: "#059669" }}>Diskon</span><span style={{ fontWeight: 700, color: "#059669" }}>-{fmt(discount)}</span></div>}
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #F1F5F9", paddingTop: 10, marginTop: 4 }}><span style={{ fontWeight: 900, fontSize: 15 }}>Total Pembayaran</span><span style={{ fontWeight: 900, fontSize: 19, color: "var(--c-primary,#2563EB)" }}>{fmt(total)}</span></div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setStep(2); if (qrisTimerRef.current) clearInterval(qrisTimerRef.current); }} className="btn btn-ghost" style={{ flex: 1 }}>← Ubah</button>
            <button onClick={submit} disabled={submitting} className="btn btn-primary" style={{ flex: 2, opacity: submitting ? .7 : 1 }}>{submitting ? "⏳ Memproses…" : "✅ Pesan Sekarang"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════ SUCCESS + STRUK ══════════ */
export function Success({ order, onHome, onOrders }) {
  const [showReceipt, setShowReceipt] = useState(false);
  const items = parseProducts(order.products);
  const isCash = order.payment_method === "cash";
  const isTransfer = order.payment_method === "transfer";

  const doPrint = () => {
    const sty = document.createElement("style");
    sty.id = "rp_style";
    sty.innerHTML = `@media print{body>*:not(#rp_root){display:none!important}#rp_root{display:block!important;position:fixed;inset:0;z-index:99999;background:#fff}.rp_np{display:none!important}@page{margin:2mm;size:80mm auto}}`;
    document.head.appendChild(sty);
    window.print();
    setTimeout(() => { try { document.head.removeChild(sty); } catch {} }, 2000);
  };

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 16px 100px" }}>
      <div style={{ textAlign: "center", padding: "40px 0 28px" }}>
        <div style={{ width: 80, height: 80, background: "#D1FAE5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, margin: "0 auto 16px" }}>✅</div>
        <h2 style={{ fontWeight: 900, fontSize: 22, color: "#0F172A", marginBottom: 6 }}>Pesanan Berhasil!</h2>
        <p style={{ color: "#64748B", fontSize: 14 }}>Order ID: <strong style={{ color: "var(--c-primary,#2563EB)", fontFamily: "monospace" }}>{order.order_id}</strong></p>
      </div>
      {(isCash || isTransfer) && (
        <div style={{ background: isCash ? "#FFFBEB" : "#EFF6FF", border: `1.5px solid ${isCash ? "#FDE68A" : "#BFDBFE"}`, borderRadius: 16, padding: "16px 18px", marginBottom: 14 }}>
          <p style={{ fontWeight: 900, color: isCash ? "#92400E" : "#1D4ED8", fontSize: 14, marginBottom: 6 }}>{isCash ? "⏳ Bayar Saat Terima / di Toko" : "🏦 Segera Lakukan Transfer"}</p>
          <p style={{ fontSize: 13, color: isCash ? "#B45309" : "#2563EB" }}>{isCash ? "Pesanan akan disiapkan. Bayar saat barang diterima atau ambil di toko." : `Transfer ${fmt(order.total_price)} ke ${order.pay_detail || "rekening toko"}. Pesanan akan diproses setelah pembayaran dikonfirmasi.`}</p>
        </div>
      )}
      {/* Mini receipt */}
      <div id="rp_root" style={{ background: "#fff", borderRadius: 18, border: "1px solid #F1F5F9", overflow: "hidden", marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontWeight: 900, fontSize: 14 }}>🧾 Struk Transaksi</h3>
          <span style={{ fontFamily: "monospace", fontSize: 11, color: "#64748B" }}>{fmtDate(order.order_date)}</span>
        </div>
        {items.map((item, i) => (
          <div key={i} style={{ padding: "10px 18px", borderBottom: "1px solid #F8FAFF", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
            <span style={{ fontWeight: 700 }}>{item.name} ×{item.qty}</span>
            <span style={{ fontWeight: 900, color: "var(--c-primary,#2563EB)" }}>{fmt(item.price * item.qty)}</span>
          </div>
        ))}
        {order.discount_amount > 0 && <div style={{ padding: "8px 18px", borderBottom: "1px solid #F8FAFF", display: "flex", justifyContent: "space-between", fontSize: 12, color: "#059669", fontWeight: 700 }}><span>Diskon Voucher</span><span>-{fmt(order.discount_amount)}</span></div>}
        <div style={{ padding: "12px 18px", background: "#F8FAFF", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 900, fontSize: 15 }}>TOTAL</span>
          <span style={{ fontWeight: 900, fontSize: 17, color: "var(--c-primary,#2563EB)" }}>{fmt(order.total_price)}</span>
        </div>
        <div className="rp_np" style={{ padding: "14px 18px", borderTop: "1px solid #F1F5F9", display: "flex", gap: 10 }}>
          <button onClick={doPrint} style={{ flex: 1, padding: "11px", borderRadius: 11, border: "1.5px solid #E2E8F0", background: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", color: "#334155" }}>🖨️ Cetak Struk</button>
          <button onClick={onOrders} style={{ flex: 1, padding: "11px", borderRadius: 11, background: "var(--c-primary,#2563EB)", color: "#fff", border: "none", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>📦 Cek Pesanan</button>
        </div>
      </div>
      <button onClick={onHome} style={{ width: "100%", padding: "14px", borderRadius: 14, border: "1.5px solid #E2E8F0", background: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>← Kembali Belanja</button>
    </div>
  );
}

/* ══════════ ORDERS ══════════ */
export function Orders({ orders, customerId, onHome }) {
  const [selected, setSelected] = useState(null);
  const [claimedIds, setClaimedIds] = useState({});
  const [claiming, setClaiming] = useState(false);

  const myOrders = [...(orders || [])]
    .filter(o => !customerId || o.customer_id === customerId)
    .sort((a, b) => new Date(b.order_date || 0) - new Date(a.order_date || 0));

  const claimPaid = async (orderId) => {
    const { updateOrderStatus } = await import("../../lib/db.js");
    setClaiming(true);
    try { await updateOrderStatus(orderId, "menunggu_konfirmasi"); setClaimedIds(p => ({ ...p, [orderId]: true })); }
    catch (e) { alert("Gagal: " + e.message); }
    setClaiming(false);
  };

  const statusColor = { diproses: "#F59E0B", menunggu_bayar: "#F59E0B", menunggu_konfirmasi: "#7C3AED", dikirim: "#2563EB", selesai: "#059669", dibatalkan: "#EF4444" };
  const statusLabel = { diproses: "Diproses", menunggu_bayar: "Menunggu Bayar", menunggu_konfirmasi: "Konfirmasi Bayar", dikirim: "Sedang Dikirim", selesai: "Selesai", dibatalkan: "Dibatalkan" };

  if (selected) {
    const items = parseProducts(selected.products);
    return (
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px 100px" }}>
        <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-primary,#2563EB)", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", gap: 5, margin: "16px 0" }}>← Semua Pesanan</button>
        <div style={{ background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,.08)", border: "1px solid #F1F5F9" }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid #F1F5F9" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div><p style={{ fontSize: 11, color: "#64748B" }}>Order ID</p><p style={{ fontWeight: 900, color: "var(--c-primary,#2563EB)", fontFamily: "monospace", fontSize: 15 }}>{selected.order_id}</p></div>
              <span style={{ background: statusColor[selected.order_status] + "20", color: statusColor[selected.order_status], borderRadius: 8, padding: "4px 10px", fontWeight: 900, fontSize: 12 }}>{statusLabel[selected.order_status] || selected.order_status}</span>
            </div>
            <p style={{ fontSize: 12, color: "#64748B" }}>{fmtDate(selected.order_date)}</p>
          </div>
          {items.map((item, i) => (
            <div key={i} style={{ padding: "12px 18px", borderBottom: "1px solid #F8FAFF", display: "flex", alignItems: "center", gap: 12 }}>
              {item.img && <img src={item.img} alt={item.name} style={{ width: 42, height: 42, borderRadius: 9, objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />}
              <div style={{ flex: 1 }}><p style={{ fontWeight: 800, fontSize: 13 }}>{item.name}</p><p style={{ fontSize: 12, color: "#64748B" }}>{fmt(item.price)} ×{item.qty}</p></div>
              <p style={{ fontWeight: 900, color: "var(--c-primary,#2563EB)" }}>{fmt(item.price * item.qty)}</p>
            </div>
          ))}
          <div style={{ padding: "12px 18px", background: "#F8FAFF", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 900 }}>TOTAL</span><span style={{ fontWeight: 900, fontSize: 17, color: "var(--c-primary,#2563EB)" }}>{fmt(selected.total_price)}</span>
          </div>
          {(selected.order_status === "diproses" || selected.order_status === "menunggu_bayar") && !claimedIds[selected.order_id] && (
            <div style={{ padding: "14px 18px", borderTop: "1px solid #F1F5F9" }}>
              <button onClick={() => claimPaid(selected.order_id)} disabled={claiming} style={{ width: "100%", padding: "12px", borderRadius: 12, background: "#D1FAE5", border: "1.5px solid #6EE7B7", fontWeight: 800, fontSize: 14, color: "#065F46", cursor: "pointer" }}>{claiming ? "⏳ Memproses…" : "✅ Saya Sudah Bayar"}</button>
            </div>
          )}
          {claimedIds[selected.order_id] && <div style={{ padding: "12px 18px", background: "#F0FDF4", textAlign: "center", fontWeight: 800, fontSize: 13, color: "#059669" }}>✅ Dikonfirmasi — sedang diverifikasi penjual</div>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px 100px" }}>
      <div style={{ padding: "16px 0 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontWeight: 900, fontSize: 18, color: "#0F172A" }}>📦 Pesanan Saya</h2>
        <button onClick={onHome} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-primary,#2563EB)", fontWeight: 700, fontSize: 13 }}>← Belanja</button>
      </div>
      {myOrders.length === 0
        ? <div style={{ textAlign: "center", padding: "48px 20px" }}><p style={{ fontSize: 48, marginBottom: 12 }}>📦</p><p style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Belum Ada Pesanan</p><p style={{ color: "#64748B", fontSize: 13 }}>Yuk mulai belanja!</p></div>
        : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {myOrders.map(o => (
            <div key={o.order_id} onClick={() => setSelected(o)} style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,.06)", border: "1px solid #F1F5F9", cursor: "pointer", transition: "transform .15s, box-shadow .15s" }} onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,.1)"; }} onMouseOut={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,.06)"; }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div><p style={{ fontWeight: 900, color: "var(--c-primary,#2563EB)", fontFamily: "monospace", fontSize: 13 }}>{o.order_id}</p><p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{fmtDate(o.order_date)}</p></div>
                <span style={{ background: (statusColor[o.order_status] || "#94A3B8") + "20", color: statusColor[o.order_status] || "#94A3B8", borderRadius: 8, padding: "4px 10px", fontWeight: 900, fontSize: 11 }}>{statusLabel[o.order_status] || o.order_status}</span>
              </div>
              <p style={{ fontSize: 12, color: "#64748B", marginBottom: 8 }}>
                {parseProducts(o.products).slice(0, 2).map(i => i.name).join(", ")}
                {parseProducts(o.products).length > 2 ? ` +${parseProducts(o.products).length - 2} lainnya` : ""}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 900, color: "var(--c-primary,#2563EB)", fontSize: 15 }}>{fmt(o.total_price)}</span>
                <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600 }}>Lihat detail →</span>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

/* ══════════ BOTTOM NAV ══════════ */
export function BottomNav({ page, setPage, cartCount }) {
  const items = [["home","🏠","Toko"],["orders","📦","Pesanan"],["cart","🛍️","Keranjang"]];
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,.95)", borderTop: "1px solid #F1F5F9", padding: "6px 16px 10px", display: "flex", justifyContent: "space-around", boxShadow: "0 -4px 20px rgba(0,0,0,.08)", backdropFilter: "blur(12px)", zIndex: 100 }}>
      {items.map(([id, ico, lbl]) => (
        <button key={id} onClick={() => setPage(id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", flex: 1, padding: "4px 0", position: "relative" }}>
          <span style={{ fontSize: 22, transition: "transform .15s", transform: page === id ? "scale(1.2)" : "scale(1)" }}>{ico}</span>
          {id === "cart" && cartCount > 0 && <span style={{ position: "absolute", top: 0, right: "22%", background: "#EF4444", color: "#fff", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, border: "1.5px solid #fff" }}>{cartCount > 9 ? "9+" : cartCount}</span>}
          <span style={{ fontSize: 10, fontWeight: page === id ? 900 : 600, color: page === id ? "var(--c-primary,#2563EB)" : "#94A3B8" }}>{lbl}</span>
        </button>
      ))}
    </div>
  );
}

/* ══════════ WA FLOAT BUTTON ══════════ */
export function WAFloatButton({ settings }) {
  const num = sanitizeWA(settings?.wa_number || "");
  if (!num) return null;
  return (
    <a href={`https://wa.me/${num}?text=${encodeURIComponent("Halo, saya ingin bertanya tentang produk di " + (settings?.store_name || "Kios Refres"))}`} target="_blank" rel="noreferrer" style={{ position: "fixed", bottom: 76, right: 18, width: 52, height: 52, background: "#25D366", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, boxShadow: "0 4px 16px rgba(37,211,102,.4)", zIndex: 99, textDecoration: "none", transition: "transform .2s" }} onMouseOver={e => { e.currentTarget.style.transform = "scale(1.1)"; }} onMouseOut={e => { e.currentTarget.style.transform = "scale(1)"; }}>💬</a>
  );
}

// React needed for JSX Fragment
import React from "react";