import { useState, useEffect } from "react";
import { useToast, ToastBox, Spinner } from "./components/ui/index.jsx";
import { LoginPage, AdminApp } from "./components/admin/index.jsx";
import { PRODUCTS as FALLBACK } from "./data/index.js";
import { fetchProducts, subscribeProducts } from "./lib/db.js";

export default function AdminStandalone() {
  const [admin,    setAdmin]    = useState(null);
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [dbError,  setDbError]  = useState(false);
  const toast = useToast();

  useEffect(() => {
    async function load() {
      try {
        const prods = await fetchProducts();
        setProducts(prods.length ? prods : FALLBACK);
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
    const ch = subscribeProducts((payload) => {
      if (payload.eventType==="UPDATE") setProducts(p=>p.map(x=>x.id===payload.new.id?payload.new:x));
      if (payload.eventType==="INSERT") setProducts(p=>[...p,payload.new]);
      if (payload.eventType==="DELETE") setProducts(p=>p.filter(x=>x.id!==payload.old.id));
    });
    return () => ch.unsubscribe();
  }, [dbError]);

  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#0F172A",gap:16}}>
      <div style={{width:64,height:64,background:"#1E3A8A",borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30}}>⚙️</div>
      <Spinner size={32}/>
      <p style={{color:"rgba(255,255,255,0.6)",fontWeight:700,fontSize:14}}>Memuat Panel Admin...</p>
    </div>
  );

  if (!admin) return (
    <div style={{minHeight:"100vh",background:"#0F172A",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      {/* Dekorasi */}
      <div style={{position:"fixed",width:320,height:320,background:"rgba(37,99,235,0.08)",borderRadius:"50%",top:-80,right:-80,pointerEvents:"none"}}/>
      <div style={{position:"fixed",width:200,height:200,background:"rgba(245,158,11,0.06)",borderRadius:"50%",bottom:-60,left:-60,pointerEvents:"none"}}/>

      <div style={{width:"100%",maxWidth:420,position:"relative",zIndex:1}}>
        {/* Header */}
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:72,height:72,background:"linear-gradient(135deg,#1E3A8A,#2563EB)",borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,margin:"0 auto 16px",boxShadow:"0 10px 40px rgba(37,99,235,0.3)"}}>⚙️</div>
          <h1 style={{color:"#fff",fontSize:22,fontWeight:900,letterSpacing:"-0.5px"}}>KIOS REFRES</h1>
          <p style={{color:"rgba(255,255,255,0.4)",fontSize:13,marginTop:5}}>Panel Admin & Staf</p>
        </div>

        {/* Login Card */}
        <div style={{background:"#1E293B",borderRadius:20,padding:"28px 24px",border:"1px solid rgba(255,255,255,0.08)",boxShadow:"0 20px 60px rgba(0,0,0,0.4)"}}>
          <AdminLoginDark onLogin={setAdmin}/>
        </div>

        <p style={{textAlign:"center",marginTop:18,color:"rgba(255,255,255,0.2)",fontSize:12}}>
          Akses khusus staf & pemilik toko
        </p>
      </div>
    </div>
  );

  return (
    <div>
      <ToastBox list={toast.list} remove={toast.remove}/>
      <AdminApp
        user={admin}
        onLogout={() => setAdmin(null)}
        products={products}
        setProducts={setProducts}
        dbError={dbError}
      />
    </div>
  );
}

/* Login form tema gelap untuk halaman admin standalone */
function AdminLoginDark({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err,  setErr]  = useState("");
  const [show, setShow] = useState(false);
  const { ACCOUNTS } = { ACCOUNTS: [
    {id:1, username:"owner",  password:"owner123",  name:"Budi Santoso",   role:"owner", avatar:"BS"},
    {id:2, username:"staf1",  password:"staf123",   name:"Rina Wulandari", role:"staff", avatar:"RW"},
    {id:3, username:"staf2",  password:"staf456",   name:"Dani Pratama",   role:"staff", avatar:"DP"},
  ]};

  const doLogin = () => {
    const found = ACCOUNTS.find(a => a.username===user.trim() && a.password===pass);
    if (!found) { setErr("Username atau password salah"); return; }
    setErr("");
    onLogin(found);
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

      {err && (
        <div style={{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:9,padding:"9px 13px",marginBottom:14,display:"flex",gap:8,alignItems:"center"}}>
          <span>❌</span>
          <p style={{fontSize:13,color:"#FCA5A5",fontWeight:700}}>{err}</p>
        </div>
      )}

      <div style={{marginBottom:13}}>
        <p style={{fontSize:12,fontWeight:800,color:"rgba(255,255,255,0.5)",marginBottom:6}}>USERNAME</p>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",opacity:.4}}>👤</span>
          <input style={{...inp,paddingLeft:38}} placeholder="Masukkan username"
            value={user} onChange={e=>setUser(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&doLogin()}/>
        </div>
      </div>

      <div style={{marginBottom:20}}>
        <p style={{fontSize:12,fontWeight:800,color:"rgba(255,255,255,0.5)",marginBottom:6}}>PASSWORD</p>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",opacity:.4}}>🔒</span>
          <input style={{...inp,paddingLeft:38,paddingRight:42}} placeholder="Masukkan password"
            type={show?"text":"password"} value={pass}
            onChange={e=>setPass(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&doLogin()}/>
          <button onClick={()=>setShow(p=>!p)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",opacity:.4,fontSize:15}}>
            {show?"🙈":"👁️"}
          </button>
        </div>
      </div>

      <button onClick={doLogin} style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,#1E3A8A,#2563EB)",color:"#fff",border:"none",borderRadius:11,fontWeight:900,fontSize:15,cursor:"pointer",boxShadow:"0 4px 20px rgba(37,99,235,0.35)"}}>
        🔐 Masuk ke Dashboard
      </button>
    </div>
  );
}