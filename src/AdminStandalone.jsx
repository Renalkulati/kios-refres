import { useState, useEffect } from "react";
import { useToast, ToastBox, Spinner } from "./components/ui/index.jsx";
import { LoginPage, AdminApp } from "./components/admin/index.jsx";
import { PRODUCTS as FALLBACK } from "./data/index.js";
import {
  fetchProducts, subscribeProducts,
  fetchOrders, subscribeOrders, updateOrderStatus,
  fetchSettings, subscribeSettings,
  fetchCategories, subscribeCategories,
  loginStaff
} from "./lib/db.js";

const SESSION_KEY = "kios_refres_admin_v2";

export default function AdminStandalone() {
  const [admin,      setAdmin]      = useState(() => {
    try { const s = localStorage.getItem(SESSION_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [products,   setProducts]   = useState([]);
  const [orders,     setOrders]     = useState([]);
  const [settings,   setSettings]   = useState({});
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [dbError,    setDbError]    = useState(false);
  const toast = useToast();

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

  useEffect(() => {
    if (dbError) return;
    const prodCh = subscribeProducts((payload) => {
      if (payload.eventType==="UPDATE") setProducts(p=>p.map(x=>x.id===payload.new.id?payload.new:x));
      if (payload.eventType==="INSERT") setProducts(p=>[...p,payload.new]);
      if (payload.eventType==="DELETE") setProducts(p=>p.filter(x=>x.id!==payload.old.id));
    });
    const orderCh = subscribeOrders(
      (n)      => setOrders(prev => prev.find(o=>o.order_id===n.order_id)?prev:[n,...prev]),
      (updated) => setOrders(prev => prev.map(o=>o.order_id===updated.order_id?{...o,...updated}:o))
    );
    const settCh = subscribeSettings((payload) => {
      if (payload.new?.key) setSettings(s=>({...s,[payload.new.key]:payload.new.value}));
    });
    const catCh = subscribeCategories(() => fetchCategories().then(setCategories).catch(console.error));
    return () => { prodCh.unsubscribe(); orderCh.unsubscribe(); settCh.unsubscribe(); catCh.unsubscribe(); };
  }, [dbError]);

  const handleLogin = (user) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    setAdmin(user);
  };
  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setAdmin(null);
  };
  const handleAdminUpdate = (updatedUser) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
    setAdmin(updatedUser);
  };

  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#0F172A",gap:16}}>
      <div style={{width:64,height:64,background:"#1E3A8A",borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30}}>⚙️</div>
      <Spinner size={32}/>
      <p style={{color:"rgba(255,255,255,0.6)",fontWeight:700,fontSize:14}}>Memuat Panel Admin...</p>
    </div>
  );

  if (!admin) return (
    <div style={{minHeight:"100vh",background:"#0F172A",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{position:"fixed",width:320,height:320,background:"rgba(37,99,235,0.08)",borderRadius:"50%",top:-80,right:-80,pointerEvents:"none"}}/>
      <div style={{position:"fixed",width:200,height:200,background:"rgba(245,158,11,0.06)",borderRadius:"50%",bottom:-60,left:-60,pointerEvents:"none"}}/>
      <div style={{width:"100%",maxWidth:420,position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:72,height:72,background:"linear-gradient(135deg,#1E3A8A,#2563EB)",borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,margin:"0 auto 16px",boxShadow:"0 10px 40px rgba(37,99,235,0.3)"}}>⚙️</div>
          <h1 style={{color:"#fff",fontSize:22,fontWeight:900,letterSpacing:"-0.5px"}}>KIOS REFRES</h1>
          <p style={{color:"rgba(255,255,255,0.4)",fontSize:13,marginTop:5}}>Panel Admin & Staf</p>
        </div>
        <div style={{background:"#1E293B",borderRadius:20,padding:"28px 24px",border:"1px solid rgba(255,255,255,0.08)",boxShadow:"0 20px 60px rgba(0,0,0,0.4)"}}>
          <AdminLoginDark onLogin={handleLogin}/>
        </div>
        <p style={{textAlign:"center",marginTop:18,color:"rgba(255,255,255,0.2)",fontSize:12}}>Akses khusus staf & pemilik toko</p>
      </div>
    </div>
  );

  return (
    <div>
      <ToastBox list={toast.list} remove={toast.remove}/>
      <AdminApp
        user={admin}
        onLogout={handleLogout}
        onUserUpdate={handleAdminUpdate}
        products={products}
        setProducts={setProducts}
        orders={orders}
        setOrders={setOrders}
        settings={settings}
        setSettings={setSettings}
        categories={categories}
        setCategories={setCategories}
        dbError={dbError}
        toast={toast}
      />
    </div>
  );
}

function AdminLoginDark({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err,  setErr]  = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const doLogin = async () => {
    if (!user.trim() || !pass) { setErr("Username dan password wajib diisi"); return; }
    setBusy(true); setErr("Memeriksa...");
    try {
      const found = await loginStaff(user.trim(), pass);
      if (!found) { setErr("Username atau password salah"); setBusy(false); return; }
      setErr("");
      onLogin(found);
    } catch {
      setErr("Gagal koneksi. Coba lagi.");
      setBusy(false);
    }
  };

  const inp = {
    width:"100%", padding:"11px 14px", borderRadius:10,
    border:"1.5px solid rgba(255,255,255,0.1)", fontSize:14,
    outline:"none", background:"rgba(255,255,255,0.06)",
    color:"#fff", boxSizing:"border-box",
  };

  return (
    <div>
      <h2 style={{color:"#fff",fontWeight:900,fontSize:19,marginBottom:4}}>Masuk ke Dashboard</h2>
      <p style={{color:"rgba(255,255,255,0.4)",fontSize:13,marginBottom:22}}>Login dengan akun staf atau owner</p>
      {err && err !== "Memeriksa..." && (
        <div style={{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:9,padding:"9px 13px",marginBottom:14,display:"flex",gap:8,alignItems:"center"}}>
          <span>❌</span><p style={{fontSize:13,color:"#FCA5A5",fontWeight:700}}>{err}</p>
        </div>
      )}
      {err === "Memeriksa..." && (
        <div style={{background:"rgba(37,99,235,0.15)",border:"1px solid rgba(37,99,235,0.3)",borderRadius:9,padding:"9px 13px",marginBottom:14,display:"flex",gap:8,alignItems:"center"}}>
          <span>⏳</span><p style={{fontSize:13,color:"#93C5FD",fontWeight:700}}>Memeriksa akun...</p>
        </div>
      )}
      <div style={{marginBottom:13}}>
        <p style={{fontSize:12,fontWeight:800,color:"rgba(255,255,255,0.5)",marginBottom:6}}>USERNAME</p>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",opacity:.4}}>👤</span>
          <input style={{...inp,paddingLeft:38}} placeholder="Masukkan username"
            value={user} onChange={e=>setUser(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()}/>
        </div>
      </div>
      <div style={{marginBottom:20}}>
        <p style={{fontSize:12,fontWeight:800,color:"rgba(255,255,255,0.5)",marginBottom:6}}>PASSWORD</p>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",opacity:.4}}>🔒</span>
          <input style={{...inp,paddingLeft:38,paddingRight:42}} placeholder="Masukkan password"
            type={show?"text":"password"} value={pass}
            onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()}/>
          <button onClick={()=>setShow(p=>!p)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",opacity:.4,fontSize:15}}>
            {show?"🙈":"👁️"}
          </button>
        </div>
      </div>
      <button onClick={doLogin} disabled={busy} style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,#1E3A8A,#2563EB)",color:"#fff",border:"none",borderRadius:11,fontWeight:900,fontSize:15,cursor:busy?"not-allowed":"pointer",boxShadow:"0 4px 20px rgba(37,99,235,0.35)",opacity:busy?.7:1}}>
        🔐 Masuk ke Dashboard
      </button>
    </div>
  );
}