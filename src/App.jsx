import { useState } from "react";
import { PRODUCTS as INIT } from "./data/index.js";
import { useToast, ToastBox } from "./components/ui/index.jsx";
import { Splash, Navbar, Home, Detail, Cart, Checkout, Success, Orders, BottomNav } from "./components/customer/index.jsx";
import { LoginPage, AdminApp } from "./components/admin/index.jsx";

export default function App() {
  /* ── mode: splash | store | adminLogin | admin ── */
  const [mode,   setMode]   = useState("splash");
  const [admin,  setAdmin]  = useState(null);

  /* ── shared data ── */
  const [products, setProducts] = useState(INIT);
  const [orders,   setOrders]   = useState([]);

  /* ── store state ── */
  const [page,    setPage]    = useState("home");
  const [product, setProduct] = useState(null);
  const [cart,    setCart]    = useState([]);
  const [last,    setLast]    = useState(null);
  const [q,       setQ]       = useState("");
  const toast = useToast();

  const cartN = cart.reduce((s,i)=>s+i.qty,0);

  const addCart = (p, qty=1) => {
    setCart(prev=>{
      const ex=prev.find(i=>i.id===p.id);
      if(ex) return prev.map(i=>i.id===p.id?{...i,qty:Math.min(i.qty+qty,p.stock)}:i);
      return [...prev,{...p,qty}];
    });
    toast.add(`${p.name} ditambahkan ke keranjang`);
  };

  const updQty = (id,qty) => {
    if(qty<=0) setCart(p=>p.filter(i=>i.id!==id));
    else setCart(p=>p.map(i=>i.id===id?{...i,qty}:i));
  };

  const onSuccess = order => {
    setOrders(p=>[...p,order]);
    setLast(order);
    setCart([]);
    setPage("success");
  };

  /* ── SPLASH ── */
  if(mode==="splash") return <Splash onDone={()=>setMode("store")}/>;

  /* ── ADMIN LOGIN ── */
  if(mode==="adminLogin") return <LoginPage onLogin={u=>{setAdmin(u);setMode("admin");}}/>;

  /* ── ADMIN DASHBOARD ── */
  if(mode==="admin") return (
    <AdminApp
      user={admin}
      onLogout={()=>{setAdmin(null);setMode("store");}}
      products={products} setProducts={setProducts}
      orders={orders}     setOrders={setOrders}
    />
  );

  /* ── CUSTOMER STORE ── */
  return (
    <div style={{minHeight:"100vh",background:"#F0F4FF"}}>
      <ToastBox list={toast.list} remove={toast.remove}/>

      <Navbar
        cartCount={cartN}
        page={page}
        setPage={p=>{setPage(p);if(p==="home")setQ("");}}
        q={q}
        setQ={v=>{setQ(v);if(page!=="home")setPage("home");}}
      />

      <main style={{paddingBottom:70}}>
        {page==="home"     && <Home     products={products} onDetail={p=>{setProduct(p);setPage("detail");}} onAdd={addCart} q={q}/>}
        {page==="detail"   && product && <Detail p={product} onBack={()=>setPage("home")} onAdd={addCart} onBuy={(p,qty)=>{setCart([{...p,qty}]);setPage("checkout");}}/>}
        {page==="cart"     && <Cart     cart={cart} onQty={updQty} onRemove={id=>setCart(p=>p.filter(i=>i.id!==id))} onCheckout={()=>setPage("checkout")} onBack={()=>setPage("home")}/>}
        {page==="checkout" && <Checkout cart={cart} onBack={()=>setPage("cart")} onSuccess={onSuccess}/>}
        {page==="success"  && last && <Success order={last} onHome={()=>setPage("home")}/>}
        {page==="orders"   && <Orders   orders={orders} onBack={()=>setPage("home")}/>}
      </main>

      <BottomNav page={page} setPage={setPage} n={cartN}/>

      {/* Tombol akses admin — pojok kanan bawah */}
      <button
        onClick={()=>setMode("adminLogin")}
        title="Masuk sebagai Admin / Staff"
        style={{position:"fixed",bottom:78,right:14,width:42,height:42,borderRadius:"50%",background:"#0F172A",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,boxShadow:"0 4px 16px rgba(0,0,0,0.22)",zIndex:80,opacity:.65,transition:"opacity .2s"}}
        onMouseEnter={e=>e.currentTarget.style.opacity=1}
        onMouseLeave={e=>e.currentTarget.style.opacity=.65}
      >⚙️</button>
    </div>
  );
}
