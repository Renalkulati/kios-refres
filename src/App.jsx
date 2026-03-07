import { useState, useEffect } from "react";
import { useToast, ToastBox, Spinner } from "./components/ui/index.jsx";
import { Splash, Navbar, Home, Detail, Cart, Checkout, Success, Orders, BottomNav } from "./components/customer/index.jsx";
import { LoginPage, AdminApp } from "./components/admin/index.jsx";
import { PRODUCTS as FALLBACK } from "./data/index.js";
import { fetchProducts, fetchOrders, createOrder, decreaseStock, subscribeOrders, subscribeProducts } from "./lib/db.js";

export default function App() {
  const [mode,     setMode]     = useState("splash");
  const [admin,    setAdmin]    = useState(null);
  const [products, setProducts] = useState([]);
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [dbError,  setDbError]  = useState(false);
  const [page,    setPage]    = useState("home");
  const [product, setProduct] = useState(null);
  const [cart,    setCart]    = useState([]);
  const [last,    setLast]    = useState(null);
  const [q,       setQ]       = useState("");
  const toast = useToast();
  const cartN = cart.reduce((s,i) => s+i.qty, 0);

  useEffect(() => {
    async function loadAll() {
      try {
        const [prods, ords] = await Promise.all([fetchProducts(), fetchOrders()]);
        setProducts(prods.length ? prods : FALLBACK);
        setOrders(ords);
        setDbError(false);
      } catch {
        setProducts(FALLBACK);
        setOrders([]);
        setDbError(true);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  useEffect(() => {
    if (dbError) return;
    const orderCh = subscribeOrders(
      (n) => {
        setOrders(prev => {
          if (prev.find(o => o.order_id === n.order_id)) return prev;
          toast.add("📦 Pesanan baru dari " + n.customer_name + "!", "info");
          return [n, ...prev];
        });
      },
      (u) => setOrders(prev => prev.map(o => o.order_id===u.order_id ? u : o))
    );
    const prodCh = subscribeProducts((payload) => {
      if (payload.eventType==="UPDATE") setProducts(p => p.map(x => x.id===payload.new.id ? payload.new : x));
      if (payload.eventType==="INSERT") setProducts(p => [...p, payload.new]);
      if (payload.eventType==="DELETE") setProducts(p => p.filter(x => x.id!==payload.old.id));
    });
    return () => { orderCh.unsubscribe(); prodCh.unsubscribe(); };
  }, [dbError]);

  const addCart = (p, qty=1) => {
    setCart(prev => {
      const ex = prev.find(i => i.id===p.id);
      if (ex) return prev.map(i => i.id===p.id ? {...i, qty: Math.min(i.qty+qty, p.stock)} : i);
      return [...prev, {...p, qty}];
    });
    toast.add(p.name + " ditambahkan ke keranjang");
  };

  const updQty = (id, qty) => {
    if (qty<=0) setCart(p => p.filter(i => i.id!==id));
    else setCart(p => p.map(i => i.id===id ? {...i, qty} : i));
  };

  const onSuccess = async (order) => {
    try {
      if (!dbError) {
        await createOrder(order);
        await decreaseStock(cart);
      } else {
        setOrders(p => [order, ...p]);
        setProducts(prev => prev.map(p => {
          const item = cart.find(i => i.id===p.id);
          if (!item) return p;
          return {...p, stock: Math.max(0, p.stock-item.qty), sold: (p.sold||0)+item.qty};
        }));
      }
    } catch {
      toast.add("Pesanan tersimpan lokal (offline mode)", "info");
      setOrders(p => [order, ...p]);
    }
    setLast(order); setCart([]); setPage("success");
  };

  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"linear-gradient(145deg,#1E3A8A,#2563EB)",gap:16}}>
      <div style={{width:72,height:72,background:"#fff",borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36}}>🛒</div>
      <Spinner size={36}/>
      <p style={{color:"rgba(255,255,255,0.8)",fontWeight:700,fontSize:15}}>Memuat KIOS REFRES...</p>
    </div>
  );

  if (mode==="splash") return <Splash onDone={() => setMode("store")}/>;
  if (mode==="adminLogin") return <LoginPage onLogin={u => { setAdmin(u); setMode("admin"); }}/>;
  if (mode==="admin") return (
    <AdminApp user={admin} onLogout={() => { setAdmin(null); setMode("store"); }}
      products={products} setProducts={setProducts}
      orders={orders} setOrders={setOrders} dbError={dbError}/>
  );

  return (
    <div style={{minHeight:"100vh",background:"#F0F4FF"}}>
      <ToastBox list={toast.list} remove={toast.remove}/>
      {dbError && (
        <div style={{background:"#FEF3C7",borderBottom:"1px solid #FCD34D",padding:"8px 16px",textAlign:"center",fontSize:12,fontWeight:700,color:"#92400E"}}>
          ⚠️ Mode Offline — Hubungkan Supabase untuk sinkronisasi real-time antar device
        </div>
      )}
      <Navbar cartCount={cartN} page={page} setPage={p=>{setPage(p);if(p==="home")setQ("");}} q={q} setQ={v=>{setQ(v);if(page!=="home")setPage("home");}}/>
      <main style={{paddingBottom:70}}>
        {page==="home"     && <Home products={products} onDetail={p=>{setProduct(p);setPage("detail");}} onAdd={addCart} q={q}/>}
        {page==="detail"   && product && <Detail p={product} onBack={()=>setPage("home")} onAdd={addCart} onBuy={(p,qty)=>{setCart([{...p,qty}]);setPage("checkout");}}/>}
        {page==="cart"     && <Cart cart={cart} onQty={updQty} onRemove={id=>setCart(p=>p.filter(i=>i.id!==id))} onCheckout={()=>setPage("checkout")} onBack={()=>setPage("home")}/>}
        {page==="checkout" && <Checkout cart={cart} onBack={()=>setPage("cart")} onSuccess={onSuccess}/>}
        {page==="success"  && last && <Success order={last} onHome={()=>setPage("home")}/>}
        {page==="orders"   && <Orders orders={orders} onBack={()=>setPage("home")}/>}
      </main>
      <BottomNav page={page} setPage={setPage} n={cartN}/>
      <button onClick={()=>setMode("adminLogin")} title="Admin" style={{position:"fixed",bottom:78,right:14,width:42,height:42,borderRadius:"50%",background:"#0F172A",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,boxShadow:"0 4px 16px rgba(0,0,0,0.22)",zIndex:80,opacity:.65,transition:"opacity .2s"}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=.65}>⚙️</button>
    </div>
  );
}
