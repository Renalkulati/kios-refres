import { useState, useEffect, useCallback } from "react";
import { useToast, ToastBox, Spinner } from "./components/ui/index.jsx";
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

/* ── Apply theme CSS vars from settings ── */
function applyTheme(settings) {
  const root = document.documentElement;
  const theme = settings?.store_theme;
  // Remove old theme classes
  root.className = root.className.replace(/theme-\w+/g, "").trim();
  if (theme && theme !== "custom") {
    root.classList.add("theme-" + theme);
  } else if (theme === "custom" || !theme) {
    // Custom or default: apply individual vars
    const p  = settings?.theme_primary   || "#2563EB";
    const pd = settings?.theme_primary_d || adjustColor(p, -20);
    const s  = settings?.theme_secondary || "#1E3A8A";
    root.style.setProperty("--c-primary",   p);
    root.style.setProperty("--c-primary-d", pd);
    root.style.setProperty("--c-secondary", s);
    root.style.setProperty("--nav-bg",      `linear-gradient(135deg,${s},${p})`);
  }
}

function adjustColor(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r   = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g   = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b   = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return "#" + [r,g,b].map(x=>x.toString(16).padStart(2,"0")).join("");
}

export default function App() {
  const [splash,    setSplash]    = useState(true);
  const [page,      setPage]      = useState("home");
  const [product,   setProduct]   = useState(null);
  const [cart,      setCart]      = useState([]);
  const [last,      setLast]      = useState(null);
  const [q,         setQ]         = useState("");
  const [products,  setProducts]  = useState([]);
  const [orders,    setOrders]    = useState([]);
  const [myOrders,  setMyOrders]  = useState([]);
  const [settings,  setSettings]  = useState({});
  const [categories,setCategories]= useState([]);
  const [loading,   setLoading]   = useState(true);
  const [dbError,   setDbError]   = useState(false);
  const [customer,  setCustomer]  = useState(() => {
    try { const s=localStorage.getItem(SESS_KEY); return s?JSON.parse(s):null; } catch { return null; }
  });
  const toast = useToast();

  /* ── Load data ── */
  useEffect(() => {
    async function load() {
      try {
        const [prods, ords, sett, cats] = await Promise.all([
          fetchProducts(), fetchOrders(), fetchSettings(), fetchCategories()
        ]);
        setProducts(prods.length ? prods : FALLBACK);
        setOrders(ords);
        setSettings(sett || {});
        setCategories(cats || []);
        applyTheme(sett || {});
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

  /* ── Realtime ── */
  useEffect(() => {
    if (dbError) return;
    const prodCh = subscribeProducts(payload => {
      if (payload.eventType==="UPDATE") setProducts(p=>p.map(x=>x.id===payload.new.id?payload.new:x));
      if (payload.eventType==="INSERT") setProducts(p=>[payload.new,...p]);
      if (payload.eventType==="DELETE") setProducts(p=>p.filter(x=>x.id!==payload.old.id));
    });
    const orderCh = subscribeOrders(
      n  => setOrders(prev => prev.find(o=>o.order_id===n.order_id)?prev:[n,...prev]),
      upd=> setOrders(prev => prev.map(o=>o.order_id===upd.order_id?{...o,...upd}:o))
    );
    const settCh = subscribeSettings(payload => {
      if (payload.new?.key) {
        setSettings(s => {
          const next = {...s, [payload.new.key]: payload.new.value};
          applyTheme(next);
          return next;
        });
      }
    });
    const catCh = subscribeCategories(() => fetchCategories().then(setCategories).catch(console.error));
    return () => { prodCh.unsubscribe(); orderCh.unsubscribe(); settCh.unsubscribe(); catCh.unsubscribe(); };
  }, [dbError]);

  /* ── My orders ── */
  useEffect(() => {
    if (customer && !dbError) {
      fetchMyOrders(customer.id).then(setMyOrders).catch(() => setMyOrders([]));
    }
  }, [customer, dbError]);

  /* ── Realtime update myOrders ── */
  useEffect(() => {
    setOrders(prev => {
      if (!customer) return prev;
      const mine = prev.filter(o=>o.customer_id===customer.id);
      setMyOrders(mine);
      return prev;
    });
  }, [orders, customer]);

  const addCart = (p, qty=1) => {
    setCart(prev => {
      const existing = prev.find(i=>i.id===p.id);
      if (existing) return prev.map(i=>i.id===p.id?{...i,qty:Math.min(p.stock,i.qty+qty)}:i);
      return [...prev, {...p, qty}];
    });
    toast.add(`✅ ${p.name} ditambahkan ke keranjang`);
  };
  const updQty = (id, qty) => {
    if (qty<1) { setCart(p=>p.filter(i=>i.id!==id)); return; }
    setCart(p=>p.map(i=>i.id===id?{...i,qty}:i));
  };

  const onSuccess = async (order) => {
    const fullOrder = {
      ...order,
      customer_id:   customer?.id || null,
      customer_name: order.customer_name,
      phone:         order.phone,
    };
    try {
      if (!dbError) {
        await createOrder(fullOrder);
        await decreaseStock(cart);
        if (fullOrder.voucher_code) useVoucher(fullOrder.voucher_code).catch(console.error);
        kirimStrukTelegram(fullOrder).catch(console.error);
        if (customer) {
          const mine = await fetchMyOrders(customer.id);
          setMyOrders(mine);
        }
      } else {
        setMyOrders(p=>[fullOrder,...p]);
        setProducts(prev=>prev.map(p=>{
          const item=cart.find(i=>i.id===p.id);
          if(!item) return p;
          return {...p,stock:Math.max(0,p.stock-item.qty),sold:(p.sold||0)+item.qty};
        }));
      }
    } catch {
      toast.add("Pesanan tersimpan lokal","info");
      setMyOrders(p=>[fullOrder,...p]);
    }
    setLast(fullOrder); setCart([]); setPage("success");
  };

  const handleOrderUpdate = useCallback(updated => {
    setOrders(prev=>prev.map(o=>o.order_id===updated.order_id?{...o,...updated}:o));
    setMyOrders(prev=>prev.map(o=>o.order_id===updated.order_id?{...o,...updated}:o));
  }, []);

  if (loading || splash) return (
    <Splash onDone={()=>setSplash(false)} settings={settings}/>
  );

  return (
    <div>
      <ToastBox list={toast.list} remove={toast.remove}/>
      <Navbar cartCount={cart.reduce((s,i)=>s+i.qty,0)} page={page} setPage={setPage} q={q} setQ={setQ}
        customer={customer} onLogout={()=>{localStorage.removeItem(SESS_KEY);setCustomer(null);setMyOrders([]);setPage("home");}}
        settings={settings}/>

      <main>
        {page==="home"    && <Home products={products} onDetail={p=>{setProduct(p);setPage("detail");}} onAdd={addCart} q={q} categories={categories} settings={settings}/>}
        {page==="detail"  && product && <Detail p={product} onBack={()=>setPage("home")} onAdd={addCart} onBuy={(p,qty)=>{setCart([{...p,qty}]);setPage("checkout");}}/>}
        {page==="cart"    && <Cart cart={cart} onQty={updQty} onRemove={id=>setCart(p=>p.filter(i=>i.id!==id))} onCheckout={()=>setPage("checkout")} onBack={()=>setPage("home")}/>}
        {page==="checkout"&& <Checkout cart={cart} onBack={()=>setPage("cart")} onSuccess={onSuccess} customer={customer} settings={settings}/>}
        {page==="success" && <Success order={last} onHome={()=>setPage("home")} onOrders={()=>setPage("orders")}/>}
        {page==="orders"  && <Orders orders={myOrders} customerId={customer?.id} onHome={()=>setPage("home")}/>}
        {page==="auth"    && <CustomerAuth customer={customer} onLogin={u=>{localStorage.setItem(SESS_KEY,JSON.stringify(u));setCustomer(u);setPage("home");}} onLogout={()=>{localStorage.removeItem(SESS_KEY);setCustomer(null);setMyOrders([]);setPage("home");}}/>}
      </main>

      <BottomNav page={page} setPage={setPage} cartCount={cart.reduce((s,i)=>s+i.qty,0)}/>
      <WAFloatButton settings={settings}/>
    </div>
  );
}