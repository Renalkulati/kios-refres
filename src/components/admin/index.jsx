import React, { useState, useEffect, useCallback } from "react";
import {
  fetchOrders, updateOrderStatus, subscribeOrders,
  fetchStaff, saveStaff, deleteStaff, subscribeStaff,
  fetchCategories, saveCategory, deleteCategory, subscribeCategories,
  loginStaff, fetchSettings, saveSettings, saveSetting,
  uploadProductImage, fetchAllVouchers, saveVoucher, deleteVoucher, subscribeVouchers,
} from "../../lib/db.js";
import { supabase } from "../../lib/supabase.js";
import { fmt } from "../../utils/index.js";
import { useToast, ToastBox, StatCard, Modal, Confirm, Empty, Field, Spinner, StatusBadge } from "../ui/index.jsx";

/* ─── helpers ─── */
const parseProducts = p => { if (!p) return []; if (Array.isArray(p)) return p; try { return JSON.parse(p); } catch { return []; } };
const fmtDate = d => { if (!d) return "–"; try { return new Date(d).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return d; } };
const normCats = arr => (arr || []).map(c => typeof c === "string" ? c : c?.name || "").filter(Boolean);

/* ─── Theme presets ─── */
const THEMES = [
  { id: "blue",   label: "Biru",   colors: ["#2563EB","#1E3A8A","#DBEAFE"] },
  { id: "purple", label: "Ungu",   colors: ["#7C3AED","#4C1D95","#EDE9FE"] },
  { id: "green",  label: "Hijau",  colors: ["#059669","#064E3B","#D1FAE5"] },
  { id: "red",    label: "Merah",  colors: ["#DC2626","#7F1D1D","#FEE2E2"] },
  { id: "orange", label: "Oranye", colors: ["#EA580C","#7C2D12","#FFF7ED"] },
  { id: "pink",   label: "Pink",   colors: ["#DB2777","#831843","#FCE7F3"] },
  { id: "teal",   label: "Teal",   colors: ["#0D9488","#134E4A","#CCFBF1"] },
  { id: "dark",   label: "Gelap",  colors: ["#818CF8","#0F172A","#1E293B"] },
];

/* ══════════ LOGIN ══════════ */
export function LoginPage({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err,  setErr]  = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const handle = async () => {
    if (!user || !pass) { setErr("Username dan password wajib diisi"); return; }
    setBusy(true);
    try {
      const acc = await loginStaff(user.trim(), pass);
      if (acc) onLogin(acc);
      else { setErr("Username atau password salah"); setBusy(false); }
    } catch { setErr("Gagal koneksi. Coba lagi."); setBusy(false); }
  };
  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "linear-gradient(135deg,#0F172A 0%,#1E3A8A 50%,#1D4ED8 100%)" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, color: "#fff" }} className="hide-mobile">
        <div style={{ maxWidth: 380 }}>
          <div style={{ width: 64, height: 64, background: "rgba(255,255,255,.1)", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, marginBottom: 20 }}>🛒</div>
          <h1 style={{ fontWeight: 900, fontSize: 26, marginBottom: 8 }}>KIOS REFRES</h1>
          <p style={{ color: "rgba(255,255,255,.55)", fontSize: 14, lineHeight: 1.8, marginBottom: 28 }}>Panel manajemen toko lengkap untuk Owner & Staff.</p>
          {["📦 Kelola Produk & Stok","📊 Dashboard Real-time","🧾 Manajemen Pesanan","🎨 Tema Warna Pembeli","🖨️ Cetak Struk Otomatis"].map(f => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,.72)", fontSize: 13, marginBottom: 10 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FCD34D", flexShrink: 0 }} />{f}
            </div>
          ))}
        </div>
      </div>
      <div style={{ width: "100%", maxWidth: 420, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 36px", borderRadius: "22px 0 0 22px" }}>
        <div style={{ width: "100%" }}>
          <h2 style={{ fontWeight: 900, fontSize: 22, marginBottom: 4 }}>Masuk ke Dashboard</h2>
          <p style={{ color: "#64748B", fontSize: 13, marginBottom: 22 }}>Masukkan kredensial akun Anda</p>
          {err && <div style={{ background: "#FEE2E2", color: "#991B1B", padding: "10px 13px", borderRadius: 10, fontSize: 13, fontWeight: 700, marginBottom: 14 }}>❌ {err}</div>}
          <Field label="Username"><input className="inp" value={user} onChange={e => { setUser(e.target.value); setErr(""); }} placeholder="Username" onKeyDown={e => e.key === "Enter" && handle()} /></Field>
          <Field label="Password">
            <div style={{ position: "relative" }}>
              <input className="inp" type={show ? "text" : "password"} value={pass} onChange={e => { setPass(e.target.value); setErr(""); }} placeholder="Password" onKeyDown={e => e.key === "Enter" && handle()} style={{ paddingRight: 44 }} />
              <button onClick={() => setShow(p => !p)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 15, opacity: .5 }}>{show ? "🙈" : "👁️"}</button>
            </div>
          </Field>
          <button onClick={handle} disabled={busy} className="btn btn-primary btn-block btn-lg" style={{ marginTop: 8, opacity: busy ? .7 : 1 }}>
            {busy ? <><Spinner size={16} /> Memverifikasi…</> : "Masuk →"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════ SIDEBAR ══════════ */
function Sidebar({ active, setActive, user, onLogout, open, onClose, alertCount }) {
  const isOwner = user?.role === "owner";
  const menus = [
    { id: "dashboard",  icon: "📊", label: "Dashboard" },
    { id: "products",   icon: "📦", label: "Produk" },
    { id: "categories", icon: "🏷️", label: "Kategori" },
    { id: "orders",     icon: "🧾", label: "Pesanan", badge: alertCount },
    { id: "vouchers",   icon: "🎟️", label: "Voucher" },
    { id: "laporan",    icon: "📈", label: "Laporan" },
    ...(isOwner ? [
      { id: "staff",    icon: "👥", label: "Staff" },
      { id: "settings", icon: "⚙️", label: "Pengaturan" },
    ] : []),
  ];
  return (
    <>
      {open && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 199 }} onClick={onClose} />}
      <div className={`admin-sidebar${open ? " open" : ""}`} style={{ zIndex: open ? 200 : 10 }}>
        <div style={{ padding: "20px 14px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 26 }}>
            <div style={{ width: 38, height: 38, background: "rgba(255,255,255,.1)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🛒</div>
            <div><p style={{ color: "#fff", fontWeight: 900, fontSize: 14 }}>KIOS REFRES</p><p style={{ color: "rgba(255,255,255,.35)", fontSize: 11 }}>Panel Admin</p></div>
          </div>
          {menus.map(m => (
            <button key={m.id} onClick={() => { setActive(m.id); onClose(); }} className={`sidebar-item${active === m.id ? " active" : ""}`}>
              <span style={{ fontSize: 16 }}>{m.icon}</span>
              <span style={{ flex: 1 }}>{m.label}</span>
              {m.badge > 0 && <span style={{ background: "#EF4444", color: "#fff", borderRadius: 99, minWidth: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, padding: "0 4px" }}>{m.badge}</span>}
            </button>
          ))}
        </div>
        <div style={{ marginTop: "auto", padding: 14, borderTop: "1px solid rgba(255,255,255,.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 13 }}>{user?.username?.[0]?.toUpperCase() || "?"}</div>
            <div><p style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>{user?.name || user?.username}</p><p style={{ color: "rgba(255,255,255,.35)", fontSize: 11, textTransform: "capitalize" }}>{user?.role}</p></div>
          </div>
          <button onClick={onLogout} style={{ width: "100%", padding: 8, borderRadius: 9, border: "1px solid rgba(255,255,255,.1)", background: "rgba(239,68,68,.12)", color: "#F87171", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🚪 Keluar</button>
        </div>
      </div>
    </>
  );
}

/* ══════════ TOPBAR ══════════ */
function Topbar({ title, onMenu, user }) {
  return (
    <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onMenu} style={{ background: "#F1F5F9", border: "none", borderRadius: 9, width: 36, height: 36, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>☰</button>
        <h1 style={{ fontWeight: 900, fontSize: 16, color: "#0F172A" }}>{title}</h1>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#1E3A8A,#2563EB)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 13 }}>{user?.username?.[0]?.toUpperCase() || "?"}</div>
        <span style={{ fontWeight: 700, fontSize: 13, color: "#334155" }} className="hide-mobile">{user?.name || user?.username}</span>
      </div>
    </div>
  );
}

/* ══════════ RECEIPT/STRUK ══════════ */
function ReceiptPrint({ order, onClose }) {
  const items = parseProducts(order.products);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const doPrint = () => {
    const sty = document.createElement("style");
    sty.id = "rp_style";
    sty.innerHTML = `@media print{body>*:not(#rp_root){display:none!important}#rp_root{display:block!important;position:fixed;inset:0;z-index:99999;background:#fff}.rp_noprint{display:none!important}@page{margin:2mm;size:80mm auto}}`;
    document.head.appendChild(sty);
    window.print();
    setTimeout(() => { try { document.head.removeChild(sty); } catch {} }, 2000);
  };
  return (
    <div id="rp_root" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 18, padding: 22, maxWidth: 380, width: "100%", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,.3)" }}>
        <div className="rp_noprint" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontWeight: 900, fontSize: 16 }}>🖨️ Cetak Struk</h3>
          <button onClick={onClose} style={{ background: "#F1F5F9", border: "none", cursor: "pointer", width: 32, height: 32, borderRadius: "50%", fontSize: 16 }}>×</button>
        </div>
        {/* Receipt paper */}
        <div style={{ fontFamily: "'Courier New',monospace", fontSize: 12, padding: "14px", border: "1px dashed #CBD5E1", borderRadius: 8 }}>
          <div style={{ textAlign: "center", paddingBottom: 10, marginBottom: 10, borderBottom: "1px dashed #CBD5E1" }}>
            <p style={{ fontWeight: 900, fontSize: 15, letterSpacing: 1 }}>★ KIOS REFRES ★</p>
            <p style={{ fontSize: 10, color: "#555", marginTop: 2 }}>Struk Pembelian</p>
            <p style={{ fontSize: 10, color: "#555" }}>{fmtDate(order.order_date)}</p>
          </div>
          <div style={{ paddingBottom: 10, marginBottom: 10, borderBottom: "1px dashed #CBD5E1" }}>
            {[["Order ID", order.order_id, true], ["Pelanggan", order.customer_name, true], order.phone && ["HP", order.phone], ["Pengiriman", order.delivery_method === "delivery" ? "Antar Rumah" : "Ambil di Toko"], order.pickup_code && ["Kode Pickup", order.pickup_code, true]].filter(Boolean).map(([l, v, bold]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                <span>{l}</span><span style={{ fontWeight: bold ? 900 : 400 }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ paddingBottom: 10, marginBottom: 10, borderBottom: "1px dashed #CBD5E1" }}>
            {items.map((item, i) => (
              <div key={i} style={{ marginBottom: 5 }}>
                <p style={{ fontWeight: 700, fontSize: 11 }}>{item.name}</p>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, paddingLeft: 8, color: "#555" }}>
                  <span>{fmt(item.price)} ×{item.qty}</span>
                  <span style={{ fontWeight: 900, color: "#000" }}>{fmt(item.price * item.qty)}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11 }}>
            {[["Subtotal", fmt(subtotal)], order.discount_amount > 0 && ["Diskon", "-" + fmt(order.discount_amount)], (order.total_price - subtotal + (order.discount_amount || 0)) > 0 && ["Ongkir", fmt(order.total_price - subtotal + (order.discount_amount || 0))]].filter(Boolean).map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span>{l}</span><span>{v}</span></div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #CBD5E1", paddingTop: 6, marginTop: 4 }}>
              <span style={{ fontWeight: 900, fontSize: 13 }}>TOTAL</span>
              <span style={{ fontWeight: 900, fontSize: 13 }}>{fmt(order.total_price)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11 }}><span>Pembayaran</span><span>{order.pay_detail || order.payment_method || "–"}</span></div>
          </div>
          <div style={{ textAlign: "center", marginTop: 12, paddingTop: 10, borderTop: "1px dashed #CBD5E1", fontSize: 11, color: "#888" }}>
            <p>Terima kasih telah berbelanja!</p>
            <p>Simpan struk ini sebagai bukti pembelian.</p>
          </div>
        </div>
        <div className="rp_noprint" style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Tutup</button>
          <button onClick={doPrint} className="btn btn-primary" style={{ flex: 2 }}>🖨️ Cetak</button>
        </div>
        <p className="rp_noprint" style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 8 }}>Kompatibel: thermal 80mm & printer biasa</p>
      </div>
    </div>
  );
}

/* ══════════ DASHBOARD ══════════ */
function Dashboard({ products, orders, onNavigate }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayOrds = (orders || []).filter(o => (o.order_date || "").slice(0, 10) === today);
  const revenue = (orders || []).filter(o => o.order_status === "selesai").reduce((s, o) => s + (o.total_price || 0), 0);
  const pending = (orders || []).filter(o => o.order_status === "diproses").length;
  const konfirmasi = (orders || []).filter(o => o.order_status === "menunggu_konfirmasi").length;
  const outStock = (products || []).filter(p => p.stock === 0).length;
  const lowStock = (products || []).filter(p => p.stock > 0 && p.stock < 10).length;
  const recent = [...(orders || [])].sort((a, b) => new Date(b.order_date || 0) - new Date(a.order_date || 0)).slice(0, 7);
  return (
    <div style={{ padding: "22px 20px 48px" }}>
      <div style={{ marginBottom: 20 }}><h2 style={{ fontWeight: 900, fontSize: 18, color: "#0F172A" }}>Selamat Datang 👋</h2><p style={{ color: "#64748B", fontSize: 13 }}>Pantau performa toko hari ini</p></div>
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <StatCard icon="🧾" label="Pesanan Hari Ini"  value={todayOrds.length}       sub="masuk hari ini"   color="#2563EB" bg="#EFF6FF" />
        <StatCard icon="💰" label="Total Pendapatan"   value={fmt(revenue)}           sub="pesanan selesai"  color="#059669" bg="#D1FAE5" />
        <StatCard icon="⏳" label="Perlu Diproses"     value={pending + konfirmasi}   sub={`${pending} baru, ${konfirmasi} konfirmasi`} color="#F59E0B" bg="#FEF3C7" />
        <StatCard icon="📦" label="Stok Bermasalah"   value={outStock + lowStock}    sub={`${outStock} habis, ${lowStock} hampir`} color="#EF4444" bg="#FEE2E2" />
      </div>
      {(outStock + lowStock) > 0 && (
        <div style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: 14, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => onNavigate("products")}>
          <span style={{ fontSize: 22 }}>⚠️</span>
          <div style={{ flex: 1 }}><p style={{ fontWeight: 900, color: "#92400E", fontSize: 14 }}>Peringatan Stok!</p><p style={{ fontSize: 13, color: "#B45309" }}>{outStock > 0 ? `${outStock} produk habis. ` : ""}{lowStock > 0 ? `${lowStock} hampir habis.` : ""}</p></div>
          <span style={{ color: "#B45309", fontWeight: 900 }}>→</span>
        </div>
      )}
      {konfirmasi > 0 && (
        <div style={{ background: "#F5F3FF", border: "1.5px solid #DDD6FE", borderRadius: 14, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => onNavigate("orders")}>
          <span style={{ fontSize: 22 }}>🔔</span>
          <div style={{ flex: 1 }}><p style={{ fontWeight: 900, color: "#5B21B6", fontSize: 14 }}>{konfirmasi} Pembeli Klaim Sudah Bayar</p><p style={{ fontSize: 13, color: "#6D28D9" }}>Verifikasi pembayaran sekarang.</p></div>
          <span style={{ color: "#7C3AED", fontWeight: 900 }}>→</span>
        </div>
      )}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontWeight: 900, fontSize: 14 }}>📋 Pesanan Terbaru</h3>
          <button onClick={() => onNavigate("orders")} style={{ background: "none", border: "none", cursor: "pointer", color: "#2563EB", fontSize: 12, fontWeight: 800 }}>Lihat Semua →</button>
        </div>
        {recent.length === 0 ? <div style={{ padding: 32, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>Belum ada pesanan</div>
          : <div style={{ overflowX: "auto" }}><table className="tbl"><thead><tr><th>Order ID</th><th>Pelanggan</th><th>Total</th><th>Tanggal</th><th>Status</th></tr></thead>
            <tbody>{recent.map(o => (<tr key={o.order_id}><td style={{ fontWeight: 800, color: "#2563EB", fontFamily: "monospace", fontSize: 12 }}>{o.order_id}</td><td style={{ fontWeight: 700 }}>{o.customer_name}</td><td style={{ fontWeight: 900 }}>{fmt(o.total_price)}</td><td style={{ color: "#64748B", fontSize: 12 }}>{fmtDate(o.order_date)}</td><td><StatusBadge status={o.order_status} /></td></tr>))}</tbody>
          </table></div>
        }
      </div>
    </div>
  );
}

/* ══════════ PRODUCTS MANAGEMENT ══════════ */
/* ✅ BUG FIX: Tidak ada useState dengan variabel non-literal sebagai initial value.
   Root cause sebelumnya: useState(catDefault) dimana catDefault dideklarasi di luar hooks */
function ProductsMgmt({ products, setProducts, toast, categories: catsProp }) {
  const catOptions = normCats(catsProp).length > 0 ? normCats(catsProp) : ["Minuman","Snack","Makanan Instan","Kebutuhan Harian"];

  // ✅ Semua useState memakai literal value — tidak ada conditional
  const [search,       setSearch]       = useState("");
  const [catF,         setCatF]         = useState("Semua");
  const [stockF,       setStockF]       = useState("semua");
  const [modal,        setModal]        = useState(false);
  const [edit,         setEdit]         = useState(null);
  const [delId,        setDelId]        = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [stockModal,   setStockModal]   = useState(null);
  const [stockAdd,     setStockAdd]     = useState("");
  const [errs,         setErrs]         = useState({});
  const [form,         setForm]         = useState({ name: "", price: "", desc: "", img: "", stock: "", cat: "" });

  const filtered = (products || []).filter(p => {
    if (catF !== "Semua" && p.cat !== catF) return false;
    if (!(p.name || "").toLowerCase().includes(search.toLowerCase())) return false;
    if (stockF === "habis"  && p.stock !== 0) return false;
    if (stockF === "hampir" && !(p.stock > 0 && p.stock < 10)) return false;
    if (stockF === "aman"   && p.stock < 10) return false;
    return true;
  });

  // ✅ catOptions hanya dipakai di dalam event handlers — aman
  const openAdd = () => {
    setEdit(null);
    setForm({ name: "", price: "", desc: "", img: "", stock: "", cat: catOptions[0] || "Minuman" });
    setErrs({});
    setModal(true);
  };
  const openEdit = p => {
    setEdit(p);
    setForm({ name: p.name, price: String(p.price), desc: p.desc || "", img: p.img || "", stock: String(p.stock), cat: p.cat || catOptions[0] || "Minuman" });
    setErrs({});
    setModal(true);
  };
  const sf = (k, v) => { setForm(prev => ({ ...prev, [k]: v })); setErrs(prev => ({ ...prev, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())                e.name  = "Nama wajib diisi";
    if (!form.price || isNaN(+form.price)) e.price = "Harga tidak valid";
    if (!form.stock || isNaN(+form.stock)) e.stock = "Stok tidak valid";
    return e;
  };

  const save = async () => {
    const e = validate(); if (Object.keys(e).length) { setErrs(e); return; }
    setSaving(true);
    const data = { name: form.name.trim(), price: +form.price, stock: +form.stock, cat: form.cat, img: form.img || "", desc: form.desc, rating: edit?.rating || 4.8, sold: edit?.sold || 0 };
    try {
      if (edit) {
        const { error } = await supabase.from("products").update(data).eq("id", edit.id);
        if (error) throw error;
        setProducts(prev => prev.map(x => x.id === edit.id ? { ...x, ...data } : x));
        toast.add("✅ Produk berhasil diperbarui");
      } else {
        const { data: inserted, error } = await supabase.from("products").insert([data]).select().single();
        if (error) throw error;
        setProducts(prev => [...prev, inserted]);
        toast.add("✅ Produk berhasil ditambahkan");
      }
      setModal(false);
    } catch (err) { toast.add("Gagal: " + err.message, "err"); }
    setSaving(false);
  };

  const del = async () => {
    try {
      const { error } = await supabase.from("products").delete().eq("id", delId);
      if (error) throw error;
      setProducts(prev => prev.filter(x => x.id !== delId));
      toast.add("Produk dihapus", "err");
    } catch (err) { toast.add("Gagal hapus: " + err.message, "err"); }
    setDelId(null);
  };

  const saveStock = async () => {
    const add = parseInt(stockAdd, 10);
    if (!add || add <= 0 || !stockModal) return;
    const newStock = (stockModal.stock || 0) + add;
    try {
      const { error } = await supabase.from("products").update({ stock: newStock }).eq("id", stockModal.id);
      if (error) throw error;
      setProducts(prev => prev.map(x => x.id === stockModal.id ? { ...x, stock: newStock } : x));
      toast.add(`✅ Stok +${add} → total ${newStock}`);
      setStockModal(null); setStockAdd("");
    } catch (err) { toast.add("Gagal: " + err.message, "err"); }
  };

  const habis  = (products || []).filter(p => p.stock === 0).length;
  const hampir = (products || []).filter(p => p.stock > 0 && p.stock < 10).length;

  return (
    <div style={{ padding: "22px 20px 48px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ fontWeight: 900, fontSize: 19, color: "#0F172A" }}>Manajemen Produk</h2>
          <p style={{ color: "#64748B", fontSize: 13, marginTop: 3 }}>
            {(products || []).length} produk
            {habis > 0 && <span style={{ color: "#EF4444", fontWeight: 700, marginLeft: 10 }}>· {habis} habis stok</span>}
            {hampir > 0 && <span style={{ color: "#F59E0B", fontWeight: 700, marginLeft: 10 }}>· {hampir} hampir habis</span>}
          </p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">+ Tambah Produk</button>
      </div>
      {(habis + hampir) > 0 && (
        <div style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: 12, padding: "11px 15px", marginBottom: 14, display: "flex", gap: 9, alignItems: "center" }}>
          <span>⚠️</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#92400E" }}>
            {habis > 0 ? `${habis} produk habis stok` : ""}
            {habis > 0 && hampir > 0 ? " · " : ""}
            {hampir > 0 ? `${hampir} hampir habis` : ""}
          </span>
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", opacity: .4, fontSize: 14 }}>🔍</span>
          <input className="inp" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari produk..." style={{ paddingLeft: 34 }} />
        </div>
        <select className="inp" value={catF} onChange={e => setCatF(e.target.value)} style={{ width: "auto", flexShrink: 0 }}>
          <option value="Semua">Semua Kategori</option>
          {catOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="inp" value={stockF} onChange={e => setStockF(e.target.value)} style={{ width: "auto", flexShrink: 0 }}>
          <option value="semua">Semua Stok</option>
          <option value="habis">❌ Habis Stok</option>
          <option value="hampir">⚠️ Hampir Habis</option>
          <option value="aman">✅ Stok Aman</option>
        </select>
      </div>
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead><tr><th>Produk</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Terjual</th><th>Aksi</th></tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#94A3B8", fontSize: 14 }}>📦 Tidak ada produk ditemukan</td></tr>
                : filtered.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 160 }}>
                        {p.img
                          ? <img src={p.img} alt={p.name} style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 10, flexShrink: 0 }} onError={e => { e.target.style.display = "none"; }} />
                          : <div style={{ width: 44, height: 44, background: "#EFF6FF", borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📦</div>
                        }
                        <div><p style={{ fontWeight: 800, fontSize: 13 }}>{p.name}</p>{p.desc && <p style={{ fontSize: 11, color: "#94A3B8", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.desc}</p>}</div>
                      </div>
                    </td>
                    <td><span className="badge b-blue">{p.cat || "–"}</span></td>
                    <td style={{ fontWeight: 900, color: "#2563EB" }}>{fmt(p.price)}</td>
                    <td>
                      <div>
                        <span className={`badge ${p.stock === 0 ? "b-red" : p.stock < 10 ? "b-amber" : "b-green"}`}>{p.stock === 0 ? "❌ HABIS" : `${p.stock} unit`}</span>
                        {p.stock === 0 && <p style={{ fontSize: 10, color: "#EF4444", fontWeight: 700, marginTop: 2 }}>Perlu restock!</p>}
                        {p.stock > 0 && p.stock < 10 && <p style={{ fontSize: 10, color: "#F59E0B", fontWeight: 700, marginTop: 2 }}>Hampir habis</p>}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700 }}>{p.sold || 0}</td>
                    <td>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        <button onClick={() => { setStockModal(p); setStockAdd(""); }} className="btn btn-green btn-sm">+Stok</button>
                        <button onClick={() => openEdit(p)} className="btn btn-secondary btn-sm">Edit</button>
                        <button onClick={() => setDelId(p.id)} className="btn btn-danger btn-sm">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={edit ? "Edit Produk" : "Tambah Produk Baru"}
        footer={<><button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}>Batal</button><button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving ? <><Spinner size={14} /> Menyimpan…</> : "💾 Simpan"}</button></>}>
        <Field label="Nama Produk" err={errs.name}><input className={`inp${errs.name ? " inp-err" : ""}`} value={form.name} onChange={e => sf("name", e.target.value)} placeholder="Nama produk" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
          <Field label="Harga (Rp)" err={errs.price}><input className={`inp${errs.price ? " inp-err" : ""}`} type="number" value={form.price} onChange={e => sf("price", e.target.value)} placeholder="0" /></Field>
          <Field label="Stok" err={errs.stock}><input className={`inp${errs.stock ? " inp-err" : ""}`} type="number" value={form.stock} onChange={e => sf("stock", e.target.value)} placeholder="0" /></Field>
        </div>
        <Field label="Kategori"><select className="inp" value={form.cat} onChange={e => sf("cat", e.target.value)}>{catOptions.map(c => <option key={c} value={c}>{c}</option>)}</select></Field>
        <Field label="Foto Produk">
          <input className="inp" value={form.img} onChange={e => sf("img", e.target.value)} placeholder="URL gambar produk" style={{ marginBottom: 8 }} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: 9, padding: "9px 13px", cursor: "pointer", fontWeight: 700, fontSize: 13, color: "#2563EB" }}>
            {uploadingImg ? "⏳ Mengupload…" : "📷 Upload Foto"}
            <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} disabled={uploadingImg} onChange={async e => {
              const file = e.target.files[0]; if (!file) return;
              if (file.size > 2 * 1024 * 1024) { toast.add("Ukuran max 2MB", "err"); return; }
              setUploadingImg(true);
              try { const url = await uploadProductImage(file); sf("img", url); toast.add("✅ Foto diupload"); }
              catch { const r = new FileReader(); r.onload = ev => sf("img", ev.target.result); r.readAsDataURL(file); }
              setUploadingImg(false);
            }} />
          </label>
          {form.img && <div style={{ marginTop: 8, textAlign: "center", background: "#F8FAFC", borderRadius: 9, padding: 8 }}><img src={form.img} alt="preview" style={{ maxHeight: 90, maxWidth: "100%", borderRadius: 8, objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} /></div>}
        </Field>
        <Field label="Deskripsi"><textarea className="inp" rows={3} value={form.desc} onChange={e => sf("desc", e.target.value)} placeholder="Deskripsi singkat…" style={{ resize: "none" }} /></Field>
      </Modal>

      <Confirm open={!!delId} onClose={() => setDelId(null)} onOk={del} danger title="Hapus Produk" msg="Yakin ingin menghapus produk ini? Tidak dapat dibatalkan." />

      <Modal open={!!stockModal} onClose={() => { setStockModal(null); setStockAdd(""); }} title="📦 Tambah Stok Cepat"
        footer={<><button className="btn btn-ghost btn-sm" onClick={() => { setStockModal(null); setStockAdd(""); }}>Batal</button><button className="btn btn-primary btn-sm" onClick={saveStock} disabled={!stockAdd || isNaN(+stockAdd) || +stockAdd <= 0}>✅ Tambahkan</button></>}>
        {stockModal && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#F8FAFC", borderRadius: 10, padding: "11px 14px", marginBottom: 16 }}>
              {stockModal.img ? <img src={stockModal.img} alt={stockModal.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} /> : <div style={{ width: 44, height: 44, background: "#EFF6FF", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📦</div>}
              <div><p style={{ fontWeight: 800, fontSize: 14 }}>{stockModal.name}</p><p style={{ fontSize: 12, color: "#64748B" }}>Stok saat ini: <strong style={{ color: stockModal.stock < 10 ? "#F59E0B" : "#10B981" }}>{stockModal.stock} unit</strong></p></div>
            </div>
            <Field label="Jumlah yang ditambahkan"><input className="inp" type="number" min="1" value={stockAdd} onChange={e => setStockAdd(e.target.value)} onKeyDown={e => e.key === "Enter" && saveStock()} placeholder="Masukkan jumlah stok tambahan" autoFocus /></Field>
            {stockAdd && +stockAdd > 0 && <div style={{ background: "#D1FAE5", border: "1px solid #A7F3D0", borderRadius: 10, padding: "9px 12px", marginTop: 8, fontSize: 13, fontWeight: 800, color: "#065F46" }}>Stok baru: {(stockModal.stock || 0) + Number(stockAdd)} unit</div>}
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ══════════ ORDERS MANAGEMENT ══════════ */
function OrdersMgmt({ orders, setOrders, toast }) {
  const [filter,  setFilter]  = useState("semua");
  const [search,  setSearch]  = useState("");
  const [detail,  setDetail]  = useState(null);
  const [busy,    setBusy]    = useState(false);
  const [receipt, setReceipt] = useState(null);

  const filtered = (orders || []).filter(o => {
    if (filter !== "semua" && o.order_status !== filter) return false;
    const q = search.toLowerCase();
    return (o.order_id || "").toLowerCase().includes(q) || (o.customer_name || "").toLowerCase().includes(q) || (o.phone || "").toLowerCase().includes(q);
  });

  const update = async (id, status) => {
    setBusy(true);
    try { await updateOrderStatus(id, status); setOrders(prev => (prev || []).map(o => o.order_id === id ? { ...o, order_status: status } : o)); if (detail?.order_id === id) setDetail(p => ({ ...p, order_status: status })); toast.add(`Status: ${status}`); }
    catch (e) { toast.add("Gagal: " + e.message, "err"); }
    setBusy(false);
  };

  const statusTabs = [
    { id: "semua", label: "Semua" }, { id: "diproses", label: "Diproses" },
    { id: "menunggu_bayar", label: "Tg. Bayar" }, { id: "menunggu_konfirmasi", label: "Konfirmasi" },
    { id: "dikirim", label: "Dikirim" }, { id: "selesai", label: "Selesai" }, { id: "dibatalkan", label: "Dibatalkan" },
  ];
  const nextAct = { diproses: { label: "Kirim", next: "dikirim", icon: "🚚" }, menunggu_bayar: { label: "Konfirmasi", next: "dikirim", icon: "✅" }, menunggu_konfirmasi: { label: "Kirim", next: "dikirim", icon: "🚚" }, dikirim: { label: "Selesai", next: "selesai", icon: "✔" } };

  const exportCSV = () => { const rows = ["Order ID,Pelanggan,Total,Status,Tanggal,Pembayaran", ...(orders || []).map(o => `${o.order_id},"${o.customer_name}",${o.total_price},${o.order_status},"${o.order_date}","${o.pay_detail || o.payment_method || ""}"`)]; const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(rows.join("\n")); a.download = "pesanan.csv"; a.click(); };

  if (detail) return (
    <div style={{ padding: "22px 20px 48px", maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <button onClick={() => setDetail(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#2563EB", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>← Kembali</button>
        <div style={{ display: "flex", gap: 8 }}><StatusBadge status={detail.order_status} /><button onClick={() => setReceipt(detail)} className="btn btn-secondary btn-sm">🖨️ Struk</button></div>
      </div>
      <div style={{ marginBottom: 16 }}><p style={{ fontSize: 11, color: "#64748B" }}>Order ID</p><p style={{ fontWeight: 900, color: "#2563EB", fontFamily: "monospace", fontSize: 18 }}>{detail.order_id}</p></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[["Pelanggan", detail.customer_name], ["Nomor HP", detail.phone], ["Tanggal", fmtDate(detail.order_date)], ["Pengiriman", detail.delivery_method === "delivery" ? "🚚 Antar Rumah" : "🏪 Ambil Toko"], ["Pembayaran", detail.pay_detail || detail.payment_method || "–"], detail.address && ["Alamat", detail.address], detail.pickup_code && ["Kode Pickup", detail.pickup_code]].filter(Boolean).map(([l, v]) => (
          <div key={l} style={{ background: "#F8FAFF", borderRadius: 11, padding: "10px 13px" }}><p style={{ fontSize: 11, color: "#64748B", fontWeight: 700, marginBottom: 3 }}>{l}</p><p style={{ fontSize: 13, fontWeight: 800 }}>{v}</p></div>
        ))}
      </div>
      <div className="card" style={{ marginBottom: 14, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #F1F5F9", fontWeight: 900, fontSize: 13 }}>🛒 Item Pesanan</div>
        {parseProducts(detail.products).map((item, i) => (
          <div key={i} style={{ padding: "11px 16px", borderBottom: "1px solid #F8FAFF", display: "flex", alignItems: "center", gap: 12 }}>
            {item.img && <img src={item.img} alt={item.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />}
            <div style={{ flex: 1 }}><p style={{ fontWeight: 800, fontSize: 13 }}>{item.name}</p><p style={{ fontSize: 12, color: "#64748B" }}>{fmt(item.price)} × {item.qty}</p></div>
            <p style={{ fontWeight: 900, color: "#2563EB" }}>{fmt(item.price * item.qty)}</p>
          </div>
        ))}
        <div style={{ padding: "12px 16px", background: "#F8FAFF", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 900 }}>TOTAL</span><span style={{ fontWeight: 900, fontSize: 18, color: "#2563EB" }}>{fmt(detail.total_price)}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {nextAct[detail.order_status] && <button onClick={() => update(detail.order_id, nextAct[detail.order_status].next)} disabled={busy} className="btn btn-primary">{nextAct[detail.order_status].icon} {nextAct[detail.order_status].label}</button>}
        {!["dibatalkan","selesai"].includes(detail.order_status) && <button onClick={() => update(detail.order_id, "dibatalkan")} disabled={busy} className="btn btn-danger">✕ Batalkan</button>}
      </div>
      {receipt && <ReceiptPrint order={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );

  return (
    <div style={{ padding: "22px 20px 48px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div><h2 style={{ fontWeight: 900, fontSize: 19, color: "#0F172A" }}>Manajemen Pesanan</h2><p style={{ color: "#64748B", fontSize: 13 }}>{(orders || []).length} total</p></div>
        <button onClick={exportCSV} className="btn btn-secondary btn-sm">⬇️ Export CSV</button>
      </div>
      <div style={{ position: "relative", marginBottom: 12 }}>
        <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", opacity: .4, fontSize: 14 }}>🔍</span>
        <input className="inp" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari Order ID, nama, HP…" style={{ paddingLeft: 34 }} />
      </div>
      <div className="noscroll" style={{ display: "flex", gap: 7, overflowX: "auto", marginBottom: 14, paddingBottom: 4 }}>
        {statusTabs.map(s => { const cnt = s.id !== "semua" ? (orders || []).filter(o => o.order_status === s.id).length : 0; return (
          <button key={s.id} onClick={() => setFilter(s.id)} style={{ flexShrink: 0, padding: "6px 14px", borderRadius: 99, border: `1.5px solid ${filter === s.id ? "#2563EB" : "#E2E8F0"}`, background: filter === s.id ? "#2563EB" : "#fff", color: filter === s.id ? "#fff" : "#64748B", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", transition: "all .15s" }}>
            {s.label}{cnt > 0 && <span style={{ background: filter === s.id ? "rgba(255,255,255,.3)" : "#DBEAFE", color: filter === s.id ? "#fff" : "#2563EB", borderRadius: 99, minWidth: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, padding: "0 4px" }}>{cnt}</span>}
          </button>
        ); })}
      </div>
      {filtered.length === 0 ? <Empty icon="🔍" title="Tidak ada pesanan" desc={filter === "semua" ? "Belum ada pesanan masuk" : "Tidak ada pesanan dengan status ini"} />
        : <div className="card" style={{ overflow: "hidden" }}><div style={{ overflowX: "auto" }}>
          <table className="tbl"><thead><tr><th>Order ID</th><th>Pelanggan</th><th>Total</th><th>Bayar</th><th>Status</th><th>Tanggal</th><th>Aksi</th></tr></thead>
            <tbody>{filtered.map(o => (
              <tr key={o.order_id} style={{ cursor: "pointer" }} onClick={() => setDetail(o)}>
                <td style={{ fontWeight: 900, color: "#2563EB", fontFamily: "monospace", fontSize: 12 }}>{o.order_id}</td>
                <td><div><p style={{ fontWeight: 800, fontSize: 13 }}>{o.customer_name}</p><p style={{ fontSize: 11, color: "#94A3B8" }}>{o.phone}</p></div></td>
                <td style={{ fontWeight: 900 }}>{fmt(o.total_price)}</td>
                <td><span className="badge b-gray" style={{ fontSize: 11 }}>{o.pay_detail || o.payment_method || "–"}</span></td>
                <td onClick={e => e.stopPropagation()}><StatusBadge status={o.order_status} /></td>
                <td style={{ color: "#64748B", fontSize: 12, whiteSpace: "nowrap" }}>{fmtDate(o.order_date)}</td>
                <td onClick={e => e.stopPropagation()}>
                  <div style={{ display: "flex", gap: 5 }}>
                    {nextAct[o.order_status] && <button onClick={() => update(o.order_id, nextAct[o.order_status].next)} disabled={busy} className="btn btn-primary btn-sm" style={{ padding: "5px 9px" }}>{nextAct[o.order_status].icon}</button>}
                    <button onClick={() => setReceipt(o)} className="btn btn-secondary btn-sm" style={{ padding: "5px 9px" }}>🖨️</button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div></div>
      }
      {receipt && <ReceiptPrint order={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}

/* ══════════ CATEGORY MANAGEMENT ══════════ */
function CatMgmt({ categories: catsProp, setCategories: setCatsExt, toast, standalone }) {
  const cats = (catsProp || []).map(c => typeof c === "string" ? { name: c, icon: "📦" } : c).filter(c => c?.name);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📦");
  const [saving,  setSaving]  = useState(false);
  const [delName, setDelName] = useState(null);
  const addCat = async () => { if (!newName.trim()) { toast.add("Nama wajib diisi", "err"); return; } setSaving(true); try { await saveCategory(newName.trim(), newIcon || "📦"); if (setCatsExt) setCatsExt([...(catsProp || []), { name: newName.trim(), icon: newIcon || "📦" }]); setNewName(""); setNewIcon("📦"); toast.add("✅ Kategori ditambahkan"); } catch (e) { toast.add("Gagal: " + e.message, "err"); } setSaving(false); };
  const delCat = async () => { if (!delName) return; try { await deleteCategory(delName); if (setCatsExt) setCatsExt((catsProp || []).filter(c => (typeof c === "string" ? c : c?.name) !== delName)); toast.add("Kategori dihapus", "err"); } catch (e) { toast.add("Gagal: " + e.message, "err"); } setDelName(null); };
  const body = (
    <div>
      <div className="card" style={{ padding: 18, marginBottom: 14 }}>
        <h3 style={{ fontWeight: 900, fontSize: 14, marginBottom: 12 }}>Tambah Kategori Baru</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input className="inp" value={newIcon} onChange={e => setNewIcon(e.target.value)} placeholder="Emoji" style={{ width: 60, textAlign: "center", fontSize: 20 }} />
          <input className="inp" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nama kategori" style={{ flex: 1, minWidth: 120 }} onKeyDown={e => e.key === "Enter" && addCat()} />
          <button onClick={addCat} disabled={saving} className="btn btn-primary">{saving ? "…" : "+ Tambah"}</button>
        </div>
      </div>
      <div className="card" style={{ overflow: "hidden" }}>
        {cats.length === 0 ? <div style={{ padding: 28, textAlign: "center", color: "#94A3B8" }}>Belum ada kategori</div>
          : <table className="tbl"><thead><tr><th>Icon</th><th>Nama</th><th>Aksi</th></tr></thead><tbody>
            {cats.map(c => (<tr key={c.name}><td style={{ fontSize: 22, textAlign: "center" }}>{c.icon || "📦"}</td><td style={{ fontWeight: 800 }}>{c.name}</td><td><button onClick={() => setDelName(c.name)} className="btn btn-danger btn-sm">Hapus</button></td></tr>))}
          </tbody></table>
        }
      </div>
      <Confirm open={!!delName} onClose={() => setDelName(null)} onOk={delCat} danger title="Hapus Kategori" msg={`Yakin hapus kategori "${delName}"?`} />
    </div>
  );
  if (standalone) return <div style={{ padding: "22px 20px 48px" }}><div style={{ marginBottom: 18 }}><h2 style={{ fontWeight: 900, fontSize: 19, color: "#0F172A" }}>Kelola Kategori</h2><p style={{ color: "#64748B", fontSize: 13 }}>{cats.length} kategori</p></div>{body}</div>;
  return body;
}

/* ══════════ VOUCHER MANAGEMENT ══════════ */
function VoucherMgmt({ toast }) {
  const [vouchers, setVouchers] = useState([]);
  const [modal,  setModal]  = useState(false);
  const [edit,   setEdit]   = useState(null);
  const [delId,  setDelId]  = useState(null);
  const [saving, setSaving] = useState(false);
  const [errs,   setErrs]   = useState({});
  const [form,   setForm]   = useState({ code: "", type: "percent", value: "", min_purchase: "", usage_limit: "", description: "", expires_at: "" });
  useEffect(() => { fetchAllVouchers().then(setVouchers).catch(() => {}); const ch = subscribeVouchers(() => fetchAllVouchers().then(setVouchers).catch(console.error)); return () => { try { ch.unsubscribe(); } catch {} }; }, []);
  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const openAdd = () => { setEdit(null); setForm({ code: "", type: "percent", value: "", min_purchase: "", usage_limit: "", description: "", expires_at: "" }); setErrs({}); setModal(true); };
  const openEdit = v => { setEdit(v); setForm({ code: v.code, type: v.type, value: String(v.value), min_purchase: String(v.min_purchase || ""), usage_limit: String(v.usage_limit || ""), description: v.description || "", expires_at: v.expires_at?.slice(0, 10) || "" }); setErrs({}); setModal(true); };
  const validate = () => { const e = {}; if (!form.code.trim()) e.code = "Wajib"; if (!form.value || isNaN(+form.value)) e.value = "Tidak valid"; return e; };
  const save = async () => { const e = validate(); if (Object.keys(e).length) { setErrs(e); return; } setSaving(true); try { const data = { code: form.code.toUpperCase().trim(), type: form.type, value: +form.value, min_purchase: +form.min_purchase || 0, usage_limit: +form.usage_limit || null, description: form.description, expires_at: form.expires_at || null, is_active: true, used_count: edit?.used_count || 0 }; if (edit) data.id = edit.id; await saveVoucher(data); toast.add(edit ? "✅ Voucher diperbarui" : "✅ Voucher ditambahkan"); setModal(false); } catch (e) { toast.add("Gagal: " + e.message, "err"); } setSaving(false); };
  const del = async () => { try { await deleteVoucher(delId); toast.add("Voucher dihapus", "err"); } catch (e) { toast.add("Gagal: " + e.message, "err"); } setDelId(null); };
  return (
    <div style={{ padding: "22px 20px 48px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div><h2 style={{ fontWeight: 900, fontSize: 19, color: "#0F172A" }}>Voucher & Promo</h2><p style={{ color: "#64748B", fontSize: 13 }}>{vouchers.length} voucher</p></div>
        <button onClick={openAdd} className="btn btn-primary">+ Tambah Voucher</button>
      </div>
      {vouchers.length === 0 ? <Empty icon="🎟️" title="Belum ada voucher" desc="Buat voucher diskon untuk pelanggan" />
        : <div className="card" style={{ overflow: "hidden" }}><div style={{ overflowX: "auto" }}><table className="tbl"><thead><tr><th>Kode</th><th>Tipe</th><th>Nilai</th><th>Min. Beli</th><th>Pakai</th><th>Kadaluarsa</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>{vouchers.map(v => (<tr key={v.id}>
            <td style={{ fontWeight: 900, color: "#7C3AED", fontFamily: "monospace" }}>{v.code}</td>
            <td><span className="badge b-purple">{v.type === "percent" ? "Persen" : "Nominal"}</span></td>
            <td style={{ fontWeight: 800 }}>{v.type === "percent" ? v.value + "%" : fmt(v.value)}</td>
            <td style={{ color: "#64748B", fontSize: 12 }}>{v.min_purchase > 0 ? fmt(v.min_purchase) : "–"}</td>
            <td style={{ color: "#64748B", fontSize: 12 }}>{v.used_count || 0}{v.usage_limit ? "/" + v.usage_limit : " (∞)"}</td>
            <td style={{ color: "#64748B", fontSize: 12 }}>{v.expires_at ? fmtDate(v.expires_at) : "–"}</td>
            <td><span className={`badge ${v.is_active ? "b-green" : "b-gray"}`}>{v.is_active ? "Aktif" : "Nonaktif"}</span></td>
            <td><div style={{ display: "flex", gap: 5 }}><button onClick={() => openEdit(v)} className="btn btn-secondary btn-sm">Edit</button><button onClick={() => setDelId(v.id)} className="btn btn-danger btn-sm">Hapus</button></div></td>
          </tr>))}</tbody>
        </table></div></div>
      }
      <Modal open={modal} onClose={() => setModal(false)} title={edit ? "Edit Voucher" : "Tambah Voucher"}
        footer={<><button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}>Batal</button><button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving ? "…" : "💾 Simpan"}</button></>}>
        <Field label="Kode" err={errs.code}><input className={`inp${errs.code ? " inp-err" : ""}`} value={form.code} onChange={e => sf("code", e.target.value.toUpperCase())} placeholder="DISKON10" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
          <Field label="Tipe"><select className="inp" value={form.type} onChange={e => sf("type", e.target.value)}><option value="percent">Persen (%)</option><option value="fixed">Nominal (Rp)</option></select></Field>
          <Field label={form.type === "percent" ? "Nilai (%)" : "Nilai (Rp)"} err={errs.value}><input className={`inp${errs.value ? " inp-err" : ""}`} type="number" value={form.value} onChange={e => sf("value", e.target.value)} placeholder="0" /></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
          <Field label="Min. Pembelian"><input className="inp" type="number" value={form.min_purchase} onChange={e => sf("min_purchase", e.target.value)} placeholder="0 = bebas" /></Field>
          <Field label="Batas Pakai"><input className="inp" type="number" value={form.usage_limit} onChange={e => sf("usage_limit", e.target.value)} placeholder="kosong = ∞" /></Field>
        </div>
        <Field label="Kadaluarsa"><input className="inp" type="date" value={form.expires_at} onChange={e => sf("expires_at", e.target.value)} /></Field>
        <Field label="Keterangan"><input className="inp" value={form.description} onChange={e => sf("description", e.target.value)} placeholder="Deskripsi singkat voucher" /></Field>
      </Modal>
      <Confirm open={!!delId} onClose={() => setDelId(null)} onOk={del} danger title="Hapus Voucher" msg="Yakin hapus voucher ini?" />
    </div>
  );
}

/* ══════════ SETTINGS — dengan Tema Warna Real-time ══════════ */
function Settings({ toast }) {
  const BANKS    = ["bca","mandiri","bni","bri","bsi"];
  const EWALLETS = ["gopay","ovo","dana","shopeepay"];
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [savingTm,  setSavingTm]  = useState(false);
  const [tab,       setTab]       = useState("info");
  const [waNum,     setWaNum]     = useState("");
  const [waName,    setWaName]    = useState("");
  const [qrisImg,   setQrisImg]   = useState("");
  const [banks,     setBanks]     = useState({});
  const [ewals,     setEwals]     = useState({});
  const [sName,     setSName]     = useState("KIOS REFRES");
  const [sAddr,     setSAddr]     = useState("");
  const [sHours,    setSHours]    = useState("07.00 – 21.00 WIB");
  const [sTag,      setSTag]      = useState("Belanja Hemat Setiap Hari");
  const [theme,     setTheme]     = useState("blue");

  useEffect(() => {
    fetchSettings().then(s => {
      if (!s) { setLoading(false); return; }
      setWaNum(s.wa_number || ""); setWaName(s.wa_name || "");
      setQrisImg(s.qris_image || "");
      const b = {}; BANKS.forEach(k => { b[k] = s["bank_" + k] || ""; b[k + "_name"] = s["bank_" + k + "_name"] || ""; }); setBanks(b);
      const ew = {}; EWALLETS.forEach(k => { ew[k] = s[k] || ""; }); setEwals(ew);
      setSName(s.store_name || "KIOS REFRES"); setSAddr(s.store_address || s.store_addr || ""); setSHours(s.store_hours || "07.00 – 21.00 WIB"); setSTag(s.store_tagline || "Belanja Hemat Setiap Hari");
      setTheme(s.store_theme || "blue");
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const saveInfo  = async () => { setSaving(true); try { await saveSettings({ store_name: sName, store_address: sAddr, store_addr: sAddr, store_hours: sHours, store_tagline: sTag }); toast.add("✅ Info toko disimpan"); } catch (e) { toast.add("Gagal: " + e.message, "err"); } setSaving(false); };
  const saveWA    = async () => { setSaving(true); try { await saveSettings({ wa_number: waNum, wa_name: waName }); toast.add("✅ WA disimpan"); } catch (e) { toast.add("Gagal: " + e.message, "err"); } setSaving(false); };
  const saveQRIS  = async () => { setSaving(true); try { await saveSetting("qris_image", qrisImg); toast.add("✅ QRIS disimpan"); } catch (e) { toast.add("Gagal: " + e.message, "err"); } setSaving(false); };
  const saveBanks = async () => { setSaving(true); try { const obj = {}; BANKS.forEach(k => { obj["bank_" + k] = banks[k] || ""; obj["bank_" + k + "_name"] = banks[k + "_name"] || ""; }); EWALLETS.forEach(k => { obj[k] = ewals[k] || ""; }); await saveSettings(obj); toast.add("✅ Rekening & E-Wallet disimpan"); } catch (e) { toast.add("Gagal: " + e.message, "err"); } setSaving(false); };

  /* ✅ Real-time theme: simpan ke Supabase → subscribeSettings di AdminStandalone & App.jsx
     akan menangkap event → applyTheme() berjalan otomatis di sisi pembeli */
  const applyTheme = async themeId => {
    setSavingTm(true);
    setTheme(themeId);
    const root = document.documentElement;
    Array.from(root.classList).filter(c => c.startsWith("theme-")).forEach(c => root.classList.remove(c));
    root.classList.add("theme-" + themeId);
    try { await saveSetting("store_theme", themeId); toast.add("✅ Tema berubah real-time di tampilan pembeli!"); }
    catch (e) { toast.add("Gagal: " + e.message, "err"); }
    setSavingTm(false);
  };

  const TABS = [
    { id: "info", icon: "🏪", label: "Info Toko" },
    { id: "tema", icon: "🎨", label: "Tema Warna" },
    { id: "wa",   icon: "💬", label: "WhatsApp" },
    { id: "bank", icon: "🏦", label: "Rekening & E-Wallet" },
    { id: "qris", icon: "📷", label: "QRIS" },
  ];

  if (loading) return <div style={{ padding: 48, textAlign: "center" }}><Spinner size={32} /><p style={{ marginTop: 12, color: "#64748B" }}>Memuat pengaturan…</p></div>;
  const curTheme = THEMES.find(t => t.id === theme) || THEMES[0];

  return (
    <div style={{ padding: "22px 20px 48px", maxWidth: 780 }}>
      <div style={{ marginBottom: 18 }}><h2 style={{ fontWeight: 900, fontSize: 19, color: "#0F172A" }}>Pengaturan Toko</h2><p style={{ color: "#64748B", fontSize: 13 }}>Kelola semua konfigurasi toko</p></div>
      <div className="noscroll" style={{ display: "flex", gap: 7, overflowX: "auto", marginBottom: 22, paddingBottom: 4 }}>
        {TABS.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ flexShrink: 0, padding: "9px 16px", borderRadius: 12, border: `1.5px solid ${tab === t.id ? "#2563EB" : "#E2E8F0"}`, background: tab === t.id ? "#2563EB" : "#fff", color: tab === t.id ? "#fff" : "#64748B", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, transition: "all .15s" }}>{t.icon} {t.label}</button>)}
      </div>

      {tab === "info" && <div className="card" style={{ padding: 22 }}>
        <h3 style={{ fontWeight: 900, fontSize: 15, marginBottom: 16 }}>🏪 Informasi Toko</h3>
        <Field label="Nama Toko"><input className="inp" value={sName} onChange={e => setSName(e.target.value)} placeholder="KIOS REFRES" /></Field>
        <Field label="Tagline / Slogan"><input className="inp" value={sTag} onChange={e => setSTag(e.target.value)} placeholder="Belanja Hemat Setiap Hari" /></Field>
        <Field label="Alamat"><textarea className="inp" value={sAddr} onChange={e => setSAddr(e.target.value)} placeholder="Alamat toko lengkap" rows={2} style={{ resize: "vertical" }} /></Field>
        <Field label="Jam Operasional"><input className="inp" value={sHours} onChange={e => setSHours(e.target.value)} placeholder="07.00 – 21.00 WIB" /></Field>
        <button onClick={saveInfo} disabled={saving} className="btn btn-primary">{saving ? <><Spinner size={14} /> Menyimpan…</> : "💾 Simpan Info Toko"}</button>
      </div>}

      {tab === "tema" && <div>
        <div className="card" style={{ padding: 22, marginBottom: 14 }}>
          <h3 style={{ fontWeight: 900, fontSize: 15, marginBottom: 6 }}>🎨 Tema Tampilan Pembeli</h3>
          <p style={{ color: "#64748B", fontSize: 13, marginBottom: 20, lineHeight: 1.65 }}>
            Pilih tema di bawah — tampilan pembeli <strong>langsung berubah secara real-time</strong> tanpa perlu reload halaman.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
            {THEMES.map(t => (
              <button key={t.id} onClick={() => applyTheme(t.id)} disabled={savingTm}
                style={{ padding: "16px 8px", borderRadius: 16, border: `2.5px solid ${theme === t.id ? "#0F172A" : "transparent"}`, background: theme === t.id ? "#F0F4FF" : "#F8FAFC", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 9, transition: "all .2s", transform: theme === t.id ? "scale(1.05)" : "scale(1)", boxShadow: theme === t.id ? "0 4px 16px rgba(0,0,0,.1)" : "none", opacity: savingTm && theme !== t.id ? .55 : 1 }}>
                <div style={{ display: "flex" }}>
                  {t.colors.map((c, i) => <div key={i} style={{ width: 20, height: 20, borderRadius: "50%", background: c, border: "2px solid #fff", marginLeft: i > 0 ? -7 : 0, boxShadow: "0 1px 4px rgba(0,0,0,.15)" }} />)}
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: theme === t.id ? "#0F172A" : "#64748B" }}>{t.label}</span>
                {theme === t.id && (savingTm ? <Spinner size={11} /> : <span style={{ fontSize: 10, color: "#059669", fontWeight: 900 }}>✓ Aktif</span>)}
              </button>
            ))}
          </div>
          <div style={{ background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: 12, padding: "13px 16px", display: "flex", gap: 11 }}>
            <span style={{ fontSize: 20 }}>💡</span>
            <div>
              <p style={{ fontWeight: 800, color: "#1D4ED8", fontSize: 13, marginBottom: 3 }}>Cara kerja real-time</p>
              <p style={{ fontSize: 12, color: "#2563EB", lineHeight: 1.65 }}>Tema tersimpan ke Supabase → <code style={{ background: "#DBEAFE", padding: "1px 5px", borderRadius: 4 }}>subscribeSettings</code> menangkap perubahan → <code style={{ background: "#DBEAFE", padding: "1px 5px", borderRadius: 4 }}>applyTheme()</code> berjalan di sisi pembeli otomatis.</p>
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <p style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>Preview Tema: <span style={{ color: curTheme.colors[0] }}>{curTheme.label}</span></p>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: "1 1 120px", height: 52, borderRadius: 12, background: `linear-gradient(135deg,${curTheme.colors[1]},${curTheme.colors[0]})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 12 }}>🛒 Hero Navbar</div>
            <div style={{ width: 80, height: 52, borderRadius: 12, background: curTheme.colors[0], display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 11 }}>Tombol</div>
            <div style={{ flex: "1 1 100px", height: 52, borderRadius: 12, background: curTheme.colors[2], border: `2px solid ${curTheme.colors[0]}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 11, color: curTheme.colors[0] }}>Card Produk</div>
          </div>
        </div>
      </div>}

      {tab === "wa" && <div className="card" style={{ padding: 22 }}>
        <h3 style={{ fontWeight: 900, fontSize: 15, marginBottom: 16 }}>💬 Integrasi WhatsApp</h3>
        <Field label="Nomor WhatsApp"><input className="inp" value={waNum} onChange={e => setWaNum(e.target.value)} placeholder="628xxxxxxxxxx" /></Field>
        <Field label="Nama Kontak"><input className="inp" value={waName} onChange={e => setWaName(e.target.value)} placeholder="Admin Toko" /></Field>
        <div style={{ background: "#F0FDF4", border: "1px solid #A7F3D0", borderRadius: 10, padding: "10px 13px", marginBottom: 14, fontSize: 12, color: "#065F46", fontWeight: 700 }}>💡 Tombol chat WA akan muncul di toko pembeli.</div>
        <button onClick={saveWA} disabled={saving} className="btn btn-primary">{saving ? "Menyimpan…" : "💾 Simpan WA"}</button>
      </div>}

      {tab === "bank" && <div>
        <div className="card" style={{ padding: 22, marginBottom: 14 }}>
          <h3 style={{ fontWeight: 900, fontSize: 15, marginBottom: 16 }}>🏦 Rekening Bank</h3>
          {BANKS.map(k => (
            <Field key={k} label={k.toUpperCase()}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <input className="inp" value={banks[k] || ""} onChange={e => setBanks(p => ({ ...p, [k]: e.target.value }))} placeholder={`No. Rek ${k.toUpperCase()}`} />
                <input className="inp" value={banks[k + "_name"] || ""} onChange={e => setBanks(p => ({ ...p, [k + "_name"]: e.target.value }))} placeholder="Nama pemilik rekening" />
              </div>
            </Field>
          ))}
        </div>
        <div className="card" style={{ padding: 22, marginBottom: 14 }}>
          <h3 style={{ fontWeight: 900, fontSize: 15, marginBottom: 16 }}>📱 E-Wallet</h3>
          {EWALLETS.map(k => <Field key={k} label={k.charAt(0).toUpperCase() + k.slice(1)}><input className="inp" value={ewals[k] || ""} onChange={e => setEwals(p => ({ ...p, [k]: e.target.value }))} placeholder={`Nomor ${k}`} /></Field>)}
        </div>
        <button onClick={saveBanks} disabled={saving} className="btn btn-primary">{saving ? "Menyimpan…" : "💾 Simpan Rekening & E-Wallet"}</button>
      </div>}

      {tab === "qris" && <div className="card" style={{ padding: 22 }}>
        <h3 style={{ fontWeight: 900, fontSize: 15, marginBottom: 16 }}>📷 QRIS Payment</h3>
        <Field label="URL atau Upload Gambar QRIS">
          <input className="inp" value={qrisImg} onChange={e => setQrisImg(e.target.value)} placeholder="https://… atau base64" style={{ marginBottom: 8 }} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: 9, padding: "9px 13px", cursor: "pointer", fontWeight: 700, fontSize: 13, color: "#2563EB" }}>📷 Upload Gambar QRIS<input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setQrisImg(ev.target.result); r.readAsDataURL(f); }} /></label>
        </Field>
        {qrisImg && <div style={{ textAlign: "center", marginBottom: 14 }}><img src={qrisImg} alt="QRIS" style={{ maxWidth: 200, borderRadius: 12, border: "2px solid #E2E8F0" }} onError={e => { e.target.style.display = "none"; }} /></div>}
        <button onClick={saveQRIS} disabled={saving} className="btn btn-primary">{saving ? "Menyimpan…" : "💾 Simpan QRIS"}</button>
      </div>}
    </div>
  );
}

/* ══════════ STAFF MANAGEMENT ══════════ */
function StaffMgmt({ currentUser, onUserUpdate, toast }) {
  const [staff,  setStaff]  = useState([]);
  const [modal,  setModal]  = useState(false);
  const [edit,   setEdit]   = useState(null);
  const [delId,  setDelId]  = useState(null);
  const [saving, setSaving] = useState(false);
  const [errs,   setErrs]   = useState({});
  const [form,   setForm]   = useState({ username: "", name: "", password: "", role: "staff", phone: "" });
  useEffect(() => { fetchStaff().then(setStaff).catch(() => {}); const ch = subscribeStaff(() => fetchStaff().then(setStaff).catch(console.error)); return () => { try { ch.unsubscribe(); } catch {} }; }, []);
  const sf = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrs(p => ({ ...p, [k]: "" })); };
  const openAdd  = () => { setEdit(null); setForm({ username: "", name: "", password: "", role: "staff", phone: "" }); setErrs({}); setModal(true); };
  const openEdit = s => { setEdit(s); setForm({ username: s.username, name: s.name || "", password: "", role: s.role || "staff", phone: s.phone || "" }); setErrs({}); setModal(true); };
  const validate = () => { const e = {}; if (!form.username.trim()) e.username = "Wajib"; if (!edit && !form.password) e.password = "Wajib"; if (!form.name.trim()) e.name = "Wajib"; return e; };
  const save = async () => { const e = validate(); if (Object.keys(e).length) { setErrs(e); return; } setSaving(true); try { const data = { username: form.username.trim(), name: form.name.trim(), role: form.role, phone: form.phone, is_active: true }; if (form.password) data.password = form.password; if (edit) data.id = edit.id; await saveStaff(data); if (edit && onUserUpdate && edit.id === currentUser?.id) onUserUpdate({ ...currentUser, ...data }); toast.add(edit ? "✅ Staff diperbarui" : "✅ Staff ditambahkan"); setModal(false); } catch (e) { toast.add("Gagal: " + e.message, "err"); } setSaving(false); };
  const del = async () => { try { await deleteStaff(delId); toast.add("Staff dihapus", "err"); } catch (e) { toast.add("Gagal: " + e.message, "err"); } setDelId(null); };
  return (
    <div style={{ padding: "22px 20px 48px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div><h2 style={{ fontWeight: 900, fontSize: 19, color: "#0F172A" }}>Staff & Akun</h2><p style={{ color: "#64748B", fontSize: 13 }}>{staff.length} akun</p></div>
        <button onClick={openAdd} className="btn btn-primary">+ Tambah Staff</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
        {staff.map(s => (
          <div key={s.id} className="card" style={{ padding: 16, display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg,#1E3A8A,#2563EB)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 18, flexShrink: 0 }}>{s.username?.[0]?.toUpperCase() || "?"}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 900, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name || s.username}</p>
              <p style={{ fontSize: 12, color: "#64748B" }}>@{s.username}</p>
              <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
                <span className={`badge ${s.role === "owner" ? "b-indigo" : "b-blue"}`} style={{ fontSize: 10 }}>{s.role}</span>
                <span className={`badge ${s.is_active ? "b-green" : "b-gray"}`} style={{ fontSize: 10 }}>{s.is_active ? "Aktif" : "Nonaktif"}</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <button onClick={() => openEdit(s)} className="btn btn-secondary btn-sm">Edit</button>
              {s.id !== currentUser?.id && <button onClick={() => setDelId(s.id)} className="btn btn-danger btn-sm">Hapus</button>}
            </div>
          </div>
        ))}
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title={edit ? "Edit Staff" : "Tambah Staff"}
        footer={<><button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}>Batal</button><button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving ? "…" : "💾 Simpan"}</button></>}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
          <Field label="Username" err={errs.username}><input className={`inp${errs.username ? " inp-err" : ""}`} value={form.username} onChange={e => sf("username", e.target.value)} placeholder="username" /></Field>
          <Field label="Nama Lengkap" err={errs.name}><input className={`inp${errs.name ? " inp-err" : ""}`} value={form.name} onChange={e => sf("name", e.target.value)} placeholder="Nama lengkap" /></Field>
        </div>
        <Field label={edit ? "Password Baru (kosong = tidak diubah)" : "Password"} err={errs.password}><input className={`inp${errs.password ? " inp-err" : ""}`} type="password" value={form.password} onChange={e => sf("password", e.target.value)} placeholder={edit ? "Kosongkan jika tidak diubah" : "Password"} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
          <Field label="Role"><select className="inp" value={form.role} onChange={e => sf("role", e.target.value)}><option value="staff">Staff</option><option value="owner">Owner</option></select></Field>
          <Field label="Nomor HP"><input className="inp" value={form.phone} onChange={e => sf("phone", e.target.value)} placeholder="08xx-xxxx-xxxx" /></Field>
        </div>
      </Modal>
      <Confirm open={!!delId} onClose={() => setDelId(null)} onOk={del} danger title="Hapus Staff" msg="Yakin hapus akun staff ini?" />
    </div>
  );
}

/* ══════════ LAPORAN & ANALITIK ══════════ */
function LaporanPage({ orders, products }) {
  const [period, setPeriod] = useState(30);
  const since = new Date(); since.setDate(since.getDate() - period);
  const fil = (orders || []).filter(o => new Date(o.created_at || o.order_date || 0) >= since);
  const revenue = fil.filter(o => o.order_status === "selesai").reduce((s, o) => s + (o.total_price || 0), 0);
  const statusCount = {}; fil.forEach(o => { statusCount[o.order_status] = (statusCount[o.order_status] || 0) + 1; });
  const payCount = {}; fil.forEach(o => { const m = o.payment_method || "Lainnya"; payCount[m] = (payCount[m] || 0) + 1; });
  const topProds = {}; fil.forEach(o => parseProducts(o.products).forEach(i => { if (!topProds[i.name]) topProds[i.name] = { qty: 0, rev: 0 }; topProds[i.name].qty += i.qty; topProds[i.name].rev += i.price * i.qty; }));
  const topList = Object.entries(topProds).sort((a, b) => b[1].rev - a[1].rev).slice(0, 10);
  return (
    <div style={{ padding: "22px 20px 48px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div><h2 style={{ fontWeight: 900, fontSize: 19, color: "#0F172A" }}>Laporan & Analitik</h2><p style={{ color: "#64748B", fontSize: 13 }}>Periode {period} hari terakhir</p></div>
        <div style={{ display: "flex", gap: 7 }}>{[7, 30, 90].map(d => <button key={d} onClick={() => setPeriod(d)} style={{ padding: "6px 14px", borderRadius: 99, border: `1.5px solid ${period === d ? "#2563EB" : "#E2E8F0"}`, background: period === d ? "#2563EB" : "#fff", color: period === d ? "#fff" : "#64748B", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{d}H</button>)}</div>
      </div>
      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <StatCard icon="🧾" label="Total Pesanan" value={fil.length}                    sub={`${period} hari`}         color="#2563EB" bg="#EFF6FF" />
        <StatCard icon="💰" label="Pendapatan"    value={fmt(revenue)}                  sub="pesanan selesai"          color="#059669" bg="#D1FAE5" />
        <StatCard icon="✅" label="Selesai"        value={statusCount.selesai || 0}      sub="pesanan"                  color="#059669" bg="#D1FAE5" />
        <StatCard icon="✕"  label="Dibatalkan"    value={statusCount.dibatalkan || 0}   sub="pesanan"                  color="#EF4444" bg="#FEE2E2" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ fontWeight: 900, fontSize: 14, marginBottom: 14 }}>📊 Status Pesanan</h3>
          {Object.entries(statusCount).length === 0 ? <p style={{ color: "#94A3B8", fontSize: 13 }}>Tidak ada data</p> : Object.entries(statusCount).map(([k, v]) => (<div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 12, fontWeight: 700 }}>{k.replace(/_/g, " ")}</span><span className="badge b-blue">{v}</span></div>))}
        </div>
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ fontWeight: 900, fontSize: 14, marginBottom: 14 }}>💳 Metode Bayar</h3>
          {Object.entries(payCount).length === 0 ? <p style={{ color: "#94A3B8", fontSize: 13 }}>Tidak ada data</p> : Object.entries(payCount).map(([k, v]) => (<div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 12, fontWeight: 700 }}>{k}</span><span className="badge b-green">{v}x</span></div>))}
        </div>
      </div>
      {topList.length > 0 && <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", fontWeight: 900, fontSize: 14 }}>🏆 Produk Terlaris</div>
        <table className="tbl"><thead><tr><th>#</th><th>Produk</th><th>Qty</th><th>Pendapatan</th></tr></thead>
          <tbody>{topList.map(([name, d], i) => (<tr key={name}><td style={{ fontWeight: 900, color: i < 3 ? "#F59E0B" : "#94A3B8" }}>{i < 3 ? "🏆" : "#"}{i + 1}</td><td style={{ fontWeight: 800 }}>{name}</td><td><span className="badge b-blue">{d.qty} pcs</span></td><td style={{ fontWeight: 900, color: "#2563EB" }}>{fmt(d.rev)}</td></tr>))}</tbody>
        </table>
      </div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   ADMIN APP — ENTRY POINT
   ✅ CRITICAL FIX: useToast() SELALU dipanggil tanpa kondisi.
   Bug sebelumnya: `const toast = toastExt || useToast()`
   → Ini conditional hook → melanggar Rules of Hooks → crash React.
   Fix: panggil useToast() tanpa syarat, lalu pilih mana yang dipakai.
══════════════════════════════════════════════════ */
export function AdminApp({
  user, onLogout, onUserUpdate,
  products, setProducts,
  orders: ordersInit, setOrders: setOrdersExt,
  categories: catsInit, setCategories: setCatsExt,
  dbError,
  toast: toastExt,
}) {
  const [menu,       setMenu]       = useState("dashboard");
  const [sOpen,      setSOpen]      = useState(false);
  const [orders,     setOrdersL]    = useState(ordersInit || []);
  const [categories, setCatsL]      = useState(catsInit || []);
  const [loadOrders, setLoadOrders] = useState(false);

  // ✅ useToast() SELALU dipanggil tanpa kondisi — tidak pernah bersyarat
  const localToast = useToast();
  // Setelah hook dipanggil, baru pilih mana yang dipakai
  const toast = toastExt || localToast;

  const setOrders = useCallback(v => { setOrdersL(v); if (setOrdersExt) setOrdersExt(v); }, [setOrdersExt]);
  const setCats   = useCallback(v => { setCatsL(v);   if (setCatsExt)   setCatsExt(v);   }, [setCatsExt]);

  useEffect(() => { if (ordersInit !== undefined) setOrdersL(ordersInit || []); }, [ordersInit]);
  useEffect(() => { if (catsInit !== undefined)   setCatsL(catsInit || []);    }, [catsInit]);

  useEffect(() => {
    // Jika orders sudah disupply dari parent, tidak perlu load sendiri
    if (ordersInit && ordersInit.length > 0) return;
    let cleanup = () => {};
    (async () => {
      setLoadOrders(true);
      try {
        const [data, cats] = await Promise.all([fetchOrders(), fetchCategories()]);
        setOrdersL(data || []);
        if (cats && cats.length) setCatsL(cats);
        const oCh = subscribeOrders(
          n   => setOrdersL(prev => prev.find(o => o.order_id === n.order_id) ? prev : [n, ...prev]),
          upd => setOrdersL(prev => prev.map(o => o.order_id === upd.order_id ? { ...o, ...upd } : o))
        );
        const cCh = subscribeCategories(() => fetchCategories().then(c => { if (c && c.length) setCatsL(c); }).catch(console.error));
        cleanup = () => { try { oCh.unsubscribe(); cCh.unsubscribe(); } catch {} };
      } catch { toast.add("Gagal memuat data", "err"); }
      setLoadOrders(false);
    })();
    return () => cleanup();
  }, []);

  const titles = { dashboard: "📊 Dashboard", products: "📦 Manajemen Produk", categories: "🏷️ Kelola Kategori", orders: "🧾 Manajemen Pesanan", vouchers: "🎟️ Voucher & Promo", laporan: "📈 Laporan & Analitik", staff: "👥 Staff & Akun", settings: "⚙️ Pengaturan" };
  const pendingCnt    = (orders || []).filter(o => o.order_status === "diproses").length;
  const konfirmasiCnt = (orders || []).filter(o => o.order_status === "menunggu_konfirmasi").length;
  const alertCount    = pendingCnt + konfirmasiCnt;

  return (
    <div className="admin-layout">
      {/* Render ToastBox lokal hanya jika toastExt tidak ada dari parent */}
      {!toastExt && <ToastBox list={localToast.list} remove={localToast.remove} />}
      <Sidebar active={menu} setActive={setMenu} user={user} onLogout={onLogout} open={sOpen} onClose={() => setSOpen(false)} alertCount={alertCount} />
      <div className="admin-main">
        <Topbar title={titles[menu] || "Dashboard"} onMenu={() => setSOpen(p => !p)} user={user} />
        <div style={{ background: "#F1F5F9", minHeight: "calc(100vh - 56px)" }}>
          <div style={{ background: dbError ? "#FEE2E2" : "#D1FAE5", borderBottom: `1px solid ${dbError ? "#FECACA" : "#6EE7B7"}`, padding: "5px 18px", fontSize: 12, fontWeight: 700, color: dbError ? "#991B1B" : "#065F46", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: dbError ? "#EF4444" : "#10B981", display: "inline-block" }} />
            {dbError ? "⚠️ Mode Offline — data dari cache lokal" : "Terhubung · Data real-time dari Supabase"}
            {konfirmasiCnt > 0 && <button onClick={() => setMenu("orders")} style={{ marginLeft: "auto", background: "#7C3AED", color: "#fff", border: "none", borderRadius: 99, padding: "2px 11px", fontSize: 11, fontWeight: 900, cursor: "pointer" }}>🔔 {konfirmasiCnt} konfirmasi bayar</button>}
          </div>
          {loadOrders
            ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 64, gap: 14, flexDirection: "column" }}><Spinner size={36} /><p style={{ fontWeight: 700, color: "#64748B" }}>Memuat data…</p></div>
            : <>
              {menu === "dashboard"  && <Dashboard    products={products || []} orders={orders}              onNavigate={setMenu} />}
              {menu === "products"   && <ProductsMgmt products={products || []} setProducts={setProducts}    toast={toast} categories={categories} />}
              {menu === "categories" && <CatMgmt      categories={categories}   setCategories={setCats}      toast={toast} standalone />}
              {menu === "vouchers"   && <VoucherMgmt  toast={toast} />}
              {menu === "laporan"    && <LaporanPage  orders={orders}           products={products || []} />}
              {menu === "orders"     && <OrdersMgmt   orders={orders}           setOrders={setOrders}        toast={toast} />}
              {menu === "staff"      && <StaffMgmt    currentUser={user}        onUserUpdate={onUserUpdate}  toast={toast} />}
              {menu === "settings"   && <Settings     toast={toast} />}
            </>
          }
        </div>
      </div>
    </div>
  );
}