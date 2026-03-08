import { useState, useEffect, useCallback } from "react";
import { useToast, ToastBox, Spinner } from "./components/ui/index.jsx";
import { Splash, Navbar, Home, Detail, Cart, Checkout, Success, Orders, BottomNav, WAFloatButton } from "./components/customer/index.jsx";
import { CustomerAuth } from "./components/customer/auth.jsx";
import { LoginPage, AdminApp } from "./components/admin/index.jsx";
import { PRODUCTS as FALLBACK } from "./data/index.js";
import {
  fetchProducts, fetchOrders, fetchMyOrders, createOrder, decreaseStock,
  subscribeOrders, subscribeProducts, fetchSettings, subscribeSettings
} from "./lib/db.js";
import { kirimStrukTelegram } from "./lib/telegram.js";

const SESSION_KEY = "kios_refres_customer";

export default function App() {
  const [mode,     setMode]     = useState("splash");
  const [admin,    setAdmin]    = useState(null);

  // Customer yang sedang login
  const [customer, setCustomer] = useState(() => {
    try { const s = localStorage.getItem(SESSION_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
  });

  const [products, setProducts] = useState([]);
  const [orders,   setOrders]   = useState([]);    // semua pesanan (untuk admin)
  const [myOrders, setMyOrders] = useState([]);    // pesanan milik customer ini saja
  const [loading,  setLoading]  = useState(true);
  const [dbError,  setDbError]  = useState(false);

  const [settings, setSettings] = useState({wa_number:"6281234567890", wa_name:"Admin KIOS REFRES", qris_image:""});
  const [page,    setPage]    = useState("home");
  const [product, setProduct] = useState(null);
  const [cart,    setCart]    = useState([]);
  const [last,    setLast]    = useState(null);
  const [q,       setQ]       = useState("");
  const toast = useToast();
  const cartN = cart.reduce((s,i) => s+i.qty, 0);

  /* ── Load produk & pesanan awal ── */
  useEffect(() => {
    async function loadAll() {
      try {
        const [prods, allOrds, sett] = await Promise.all([fetchProducts(), fetchOrders(), fetchSettings()]);
        setProducts(prods.length ? prods : FALLBACK);
        setOrders(allOrds);
        if (sett && Object.keys(sett).length) setSettings(s=>({...s,...sett}));
        if (customer) {
          const mine = await fetchMyOrders(customer.id);
          setMyOrders(mine);
        }
        setDbError(false);
      } catch {
        setProducts(FALLBACK);
        setDbError(true);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  /* ── Realtime subscribe ── */
  useEffect(() => {
    if (dbError) return;
    const orderCh = subscribeOrders(
      (n) => {
        setOrders(prev => prev.find(o=>o.order_id===n.order_id) ? prev : [n,...prev]);
        // Kalau pesanan ini milik customer yg login, tambah ke myOrders juga
        if (customer && n.customer_id === customer.id) {
          setMyOrders(prev => prev.find(o=>o.order_id===n.order_id) ? prev : [n,...prev]);
        }
      },
      (updated) => {
        setOrders(prev => prev.map(o => o.order_id===updated.order_id ? {...o,...updated} : o));
        setMyOrders(prev => prev.map(o => o.order_id===updated.order_id ? {...o,...updated} : o));
        setLast(prev => prev?.order_id===updated.order_id ? {...prev,...updated} : prev);

        // Notifikasi ke customer kalau pesanan miliknya berubah status
        if (customer && updated.customer_id===customer.id) {
          const label = {
            dikirim:    "🚚 Pesanan Anda sedang dikirim!",
            selesai:    "✅ Pesanan Anda telah selesai!",
            dibatalkan: "❌ Pesanan Anda dibatalkan.",
          };
          if (label[updated.order_status]) toast.add(label[updated.order_status]);
        }
      }
    );
    // Subscribe settings changes
    const settCh = subscribeSettings((payload) => {
      if (payload.new?.key) {
        setSettings(s => ({...s, [payload.new.key]: payload.new.value}));
      }
    });
    const prodCh = subscribeProducts((payload) => {
      if (payload.eventType==="UPDATE") setProducts(p=>p.map(x=>x.id===payload.new.id?payload.new:x));
      if (payload.eventType==="INSERT") setProducts(p=>[...p,payload.new]);
      if (payload.eventType==="DELETE") setProducts(p=>p.filter(x=>x.id!==payload.old.id));
    });
    return () => { orderCh.unsubscribe(); prodCh.unsubscribe(); settCh.unsubscribe(); };
  }, [dbError, customer]);

  /* ── Login customer ── */
  const handleCustomerAuth = (user) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    setCustomer(user);
    // Langsung load pesanan miliknya
    fetchMyOrders(user.id).then(setMyOrders).catch(()=>{});
    setMode("store");
  };

  /* ── Logout customer ── */
  const handleCustomerLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setCustomer(null);
    setMyOrders([]);
    setCart([]);
    setPage("home");
  };

  /* ── Buka halaman pesanan: refresh dari DB ── */
  const handleSetPage = useCallback(async (p) => {
    setPage(p);
    if (p==="home") setQ("");
    if (p==="orders" && !dbError && customer) {
      try { const mine = await fetchMyOrders(customer.id); setMyOrders(mine); } catch {}
    }
  }, [dbError, customer]);

  const addCart = (p, qty=1) => {
    setCart(prev => {
      const ex = prev.find(i=>i.id===p.id);
      if (ex) return prev.map(i=>i.id===p.id?{...i,qty:Math.min(i.qty+qty,p.stock)}:i);
      return [...prev,{...p,qty}];
    });
    toast.add(p.name + " ditambahkan ke keranjang");
  };

  const updQty = (id, qty) => {
    if (qty<=0) setCart(p=>p.filter(i=>i.id!==id));
    else setCart(p=>p.map(i=>i.id===id?{...i,qty}:i));
  };

  const onSuccess = async (order) => {
    // Sertakan customer_id & phone dari akun customer yang login
    const fullOrder = {
      ...order,
      customer_id:   customer?.id || null,
      customer_name: order.customer_name,  // pakai nama lengkap dari form checkout
      phone:         order.phone,          // pakai nomor dari form checkout
    };
    try {
      if (!dbError) {
        await createOrder(fullOrder);
        await decreaseStock(cart);
        // Kirim struk ke Telegram
        kirimStrukTelegram(fullOrder).catch(console.error);
        // Refresh myOrders setelah berhasil
        if (customer) {
          const mine = await fetchMyOrders(customer.id);
          setMyOrders(mine);
        }
      } else {
        setMyOrders(p => [fullOrder, ...p]);
        setProducts(prev => prev.map(p => {
          const item = cart.find(i=>i.id===p.id);
          if (!item) return p;
          return {...p, stock:Math.max(0,p.stock-item.qty), sold:(p.sold||0)+item.qty};
        }));
      }
    } catch {
      toast.add("Pesanan tersimpan lokal", "info");
      setMyOrders(p => [fullOrder, ...p]);
    }
    setLast(fullOrder); setCart([]); setPage("success");
  };

  /* ── Loading screen ── */
  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"linear-gradient(145deg,#1E3A8A,#2563EB)",gap:16}}>
      <div style={{width:72,height:72,background:"#fff",borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36}}>🛒</div>
      <Spinner size={36}/>
      <p style={{color:"rgba(255,255,255,0.8)",fontWeight:700,fontSize:15}}>Memuat KIOS REFRES...</p>
    </div>
  );

  if (mode==="splash") return <Splash onDone={() => {
    if (!customer) setMode("auth");
    else setMode("store");
  }}/>;

  /* ── Customer Auth (Login/Register) ── */
  if (mode==="auth") return <CustomerAuth onAuth={handleCustomerAuth}/>;

  /* ── Admin Login ── */
  if (mode==="adminLogin") return <LoginPage onLogin={u=>{setAdmin(u);setMode("admin");}}/>;

  /* ── Admin Dashboard ── */
  if (mode==="admin") return (
    <AdminApp user={admin} onLogout={()=>{setAdmin(null);setMode("store");}}
      products={products} setProducts={setProducts}
      orders={orders} setOrders={setOrders} dbError={dbError}/>
  );

  /* ── Customer Store ── */
  return (
    <div style={{minHeight:"100vh",background:"#F0F4FF"}}>
      <ToastBox list={toast.list} remove={toast.remove}/>
      {dbError && (
        <div style={{background:"#FEF3C7",borderBottom:"1px solid #FCD34D",padding:"8px 16px",textAlign:"center",fontSize:12,fontWeight:700,color:"#92400E"}}>
          ⚠️ Mode Offline
        </div>
      )}

      <Navbar cartCount={cartN} page={page} setPage={handleSetPage} q={q} setQ={v=>{setQ(v);if(page!=="home")setPage("home");}}
        customer={customer} onLogout={handleCustomerLogout}/>

      <main style={{paddingBottom:70}}>
        {page==="home"     && <Home products={products} onDetail={p=>{setProduct(p);setPage("detail");}} onAdd={addCart} q={q}/>}
        {page==="detail"   && product && <Detail p={product} onBack={()=>setPage("home")} onAdd={addCart} onBuy={(p,qty)=>{setCart([{...p,qty}]);setPage("checkout");}}/>}
        {page==="cart"     && <Cart cart={cart} onQty={updQty} onRemove={id=>setCart(p=>p.filter(i=>i.id!==id))} onCheckout={()=>setPage("checkout")} onBack={()=>setPage("home")}/>}
        {page==="checkout" && <Checkout cart={cart} onBack={()=>setPage("cart")} onSuccess={onSuccess} customer={customer} settings={settings}/>}
        {page==="success"  && last && <Success order={last} onHome={()=>handleSetPage("home")}/>}
        {page==="orders"   && <Orders orders={myOrders} onBack={()=>handleSetPage("home")} customer={customer} waNumber={settings.wa_number} waName={settings.wa_name}/>}
      </main>

      <BottomNav page={page} setPage={handleSetPage} n={cartN}/>
      <WAFloatButton waNumber={settings.wa_number} waName={settings.wa_name}/>
    </div>
  );
}