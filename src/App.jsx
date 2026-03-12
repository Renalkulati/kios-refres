import { useState, useEffect, useCallback, useRef } from "react";
import { useToast, ToastBox } from "./components/ui/index.jsx";
import { Splash, Navbar, Home, Detail, Cart, Checkout, Success, Orders, BottomNav, WAFloatButton } from "./components/customer/index.jsx";
import { CustomerAuth } from "./components/customer/auth.jsx";
import { LoginPage } from "./components/admin/index.jsx";
import {
  fetchProducts, fetchOrders, fetchMyOrders, createOrder, decreaseStock,
  subscribeOrders, subscribeProducts, fetchSettings, subscribeSettings,
  fetchCategories, subscribeCategories, updateOrderStatus, useVoucher
} from "./lib/db.js";
import { kirimStrukTelegram } from "./lib/telegram.js";
import { PRODUCTS as FALLBACK } from "./data/index.js";

const SESS_KEY = "kios_refres_customer";

/* ── Terapkan tema ke document.documentElement ── */
export function applyTheme(settings) {
  if (!settings) return;
  const root = document.documentElement;
  // Hapus semua kelas tema lama
  const classes = Array.from(root.classList).filter(c => c.startsWith("theme-"));
  classes.forEach(c => root.classList.remove(c));
  // Terapkan preset
  const preset = settings.store_theme;
  if (preset && preset !== "custom") {
    root.classList.add("theme-" + preset);
  }
}

export default function App() {
  const [splash,     setSplash]     = useState(true);
  const [page,       setPage]       = useState("home");
  const [product,    setProduct]    = useState(null);
  const [cart,       setCart]       = useState([]);
  const [last,       setLast]       = useState(null);
  const [q,          setQ]          = useState("");
  const [products,   setProducts]   = useState([]);
  const [orders,     setOrders]     = useState([]);
  const [settings,   setSettings]   = useState({});
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [dbError,    setDbError]    = useState(false);
  const toast = useToast();
  const [customer, setCustomer] = useState(() => {
    try { const s = localStorage.getItem(SESS_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
  });

  // Load data awal
  useEffect(() => {
    async function load() {
      try {
        const [prods, ords, sett, cats] = await Promise.all([
          fetchProducts(), fetchOrders(), fetchSettings(), fetchCategories()
        ]);
        setProducts(prods.length ? prods : FALLBACK);
        setOrders(ords);
        const s = sett || {};
        setSettings(s);
        applyTheme(s);
        setCategories(cats || []);
        setDbError(false);
      } catch {
        setProducts(FALLBACK);
        setDbError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Realtime subscriptions
  useEffect(() => {
    if (dbError) return;
    const prodCh = subscribeProducts(p => {
      if (p.eventType === "UPDATE") setProducts(prev => prev.map(x => x.id === p.new.id ? p.new : x));
      if (p.eventType === "INSERT") setProducts(prev => [p.new, ...prev]);
      if (p.eventType === "DELETE") setProducts(prev => prev.filter(x => x.id !== p.old.id));
    });
    const orderCh = subscribeOrders(
      n   => setOrders(prev => prev.find(o => o.order_id === n.order_id) ? prev : [n, ...prev]),
      upd => setOrders(prev => prev.map(o => o.order_id === upd.order_id ? { ...o, ...upd } : o))
    );
    const settCh = subscribeSettings(payload => {
      if (payload.new?.key) {
        setSettings(prev => {
          const next = { ...prev, [payload.new.key]: payload.new.value };
          applyTheme(next);
          return next;
        });
      }
    });
    const catCh = subscribeCategories(() =>
      fetchCategories().then(setCategories).catch(console.error)
    );
    return () => {
      try { prodCh.unsubscribe(); orderCh.unsubscribe(); settCh.unsubscribe(); catCh.unsubscribe(); } catch {}
    };
  }, [dbError]);

  const myOrders = customer
    ? orders.filter(o => o.customer_id === customer.id)
    : orders.filter(o => !o.customer_id);

  const addCart = useCallback((p, qty = 1) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? { ...i, qty: Math.min(p.stock, i.qty + qty) } : i);
      return [...prev, { ...p, qty }];
    });
    toast.add(`✅ ${p.name} ditambahkan`);
  }, [toast]);

  const onSuccess = async (order) => {
    try {
      if (!dbError) {
        await createOrder(order);
        await decreaseStock(cart);
        if (order.voucher_code) useVoucher(order.voucher_code).catch(console.error);
        kirimStrukTelegram(order).catch(console.error);
      } else {
        setOrders(prev => [order, ...prev]);
        setProducts(prev => prev.map(p => {
          const item = cart.find(i => i.id === p.id);
          return item ? { ...p, stock: Math.max(0, p.stock - item.qty), sold: (p.sold || 0) + item.qty } : p;
        }));
      }
    } catch {
      toast.add("Pesanan tersimpan", "info");
    }
    setLast(order);
    setCart([]);
    setPage("success");
  };

  if (loading || splash) return (
    <Splash onDone={() => setSplash(false)} settings={settings} />
  );

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div>
      <ToastBox list={toast.list} remove={toast.remove} />
      <Navbar
        cartCount={cartCount} page={page} setPage={setPage}
        q={q} setQ={setQ} customer={customer}
        onLogout={() => { localStorage.removeItem(SESS_KEY); setCustomer(null); setPage("home"); }}
        settings={settings}
      />
      <main>
        {page === "home"     && <Home products={products} onDetail={p => { setProduct(p); setPage("detail"); }} onAdd={addCart} q={q} categories={categories} settings={settings} />}
        {page === "detail"   && product && <Detail p={product} onBack={() => setPage("home")} onAdd={addCart} onBuy={(p, qty) => { setCart([{ ...p, qty }]); setPage("checkout"); }} />}
        {page === "cart"     && <Cart cart={cart} onQty={(id, qty) => { if (qty < 1) setCart(p => p.filter(i => i.id !== id)); else setCart(p => p.map(i => i.id === id ? { ...i, qty } : i)); }} onRemove={id => setCart(p => p.filter(i => i.id !== id))} onCheckout={() => setPage("checkout")} onBack={() => setPage("home")} />}
        {page === "checkout" && <Checkout cart={cart} onBack={() => setPage("cart")} onSuccess={onSuccess} customer={customer} settings={settings} />}
        {page === "success"  && <Success order={last} onHome={() => setPage("home")} onOrders={() => setPage("orders")} />}
        {page === "orders"   && <Orders orders={myOrders} customerId={customer?.id} onHome={() => setPage("home")} />}
        {page === "auth"     && <CustomerAuth customer={customer} onLogin={u => { localStorage.setItem(SESS_KEY, JSON.stringify(u)); setCustomer(u); setPage("home"); }} onLogout={() => { localStorage.removeItem(SESS_KEY); setCustomer(null); setPage("home"); }} />}
      </main>
      <BottomNav page={page} setPage={setPage} cartCount={cartCount} />
      <WAFloatButton settings={settings} />
    </div>
  );
}