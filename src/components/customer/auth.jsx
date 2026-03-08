import { useState } from "react";
import { registerCustomer, loginCustomer } from "../../lib/db.js";
import { Spinner } from "../ui/index.jsx";

const inp = {
  width:"100%", padding:"12px 14px", borderRadius:11,
  border:"1.5px solid #E2E8F4", fontSize:14, outline:"none",
  boxSizing:"border-box", background:"#F8FAFC", transition:"border .2s",
};
const inpFocus = { border:"1.5px solid #2563EB", background:"#fff" };

function InputField({ label, type="text", placeholder, value, onChange, icon }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{marginBottom:14}}>
      <p style={{fontSize:12,fontWeight:800,color:"#475569",marginBottom:6}}>{label}</p>
      <div style={{position:"relative"}}>
        {icon && <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:16,opacity:.5}}>{icon}</span>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          style={{...inp, ...(focused?inpFocus:{}), paddingLeft: icon?"40px":"14px"}}
          onFocus={()=>setFocused(true)}
          onBlur={()=>setFocused(false)}
        />
      </div>
    </div>
  );
}

/* ══════ LOGIN PAGE ══════ */
function LoginForm({ onLogin, onGoRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [showPass, setShowPass] = useState(false);

  const doLogin = async () => {
    if (!username.trim() || !password) { setError("Isi semua kolom"); return; }
    setLoading(true); setError("");
    try {
      const user = await loginCustomer({ username: username.trim(), password });
      onLogin(user);
    } catch(e) {
      setError(e.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{fontWeight:900,fontSize:22,marginBottom:4,color:"#0F172A"}}>Selamat Datang! 👋</h2>
      <p style={{color:"#64748B",fontSize:13,marginBottom:24}}>Login untuk mulai belanja di KIOS REFRES</p>

      {error && (
        <div style={{background:"#FEF2F2",border:"1.5px solid #FECACA",borderRadius:10,padding:"10px 13px",marginBottom:14,display:"flex",gap:8,alignItems:"center"}}>
          <span>❌</span>
          <p style={{fontSize:13,color:"#DC2626",fontWeight:700}}>{error}</p>
        </div>
      )}

      <InputField label="Username" placeholder="Masukkan username" value={username} onChange={e=>setUsername(e.target.value)} icon="👤"/>

      <div style={{marginBottom:14}}>
        <p style={{fontSize:12,fontWeight:800,color:"#475569",marginBottom:6}}>Password</p>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:16,opacity:.5}}>🔒</span>
          <input
            type={showPass?"text":"password"}
            placeholder="Masukkan password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&doLogin()}
            style={{...inp, paddingLeft:"40px", paddingRight:"44px"}}
          />
          <button onClick={()=>setShowPass(p=>!p)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,opacity:.5}}>
            {showPass?"🙈":"👁️"}
          </button>
        </div>
      </div>

      <button
        onClick={doLogin}
        disabled={loading}
        style={{width:"100%",padding:"13px",background:loading?"#94A3B8":"linear-gradient(135deg,#1E3A8A,#2563EB)",color:"#fff",border:"none",borderRadius:12,fontWeight:900,fontSize:15,cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:4}}
      >
        {loading ? <><Spinner size={18}/> Memproses...</> : "🔐 Masuk"}
      </button>

      <div style={{textAlign:"center",marginTop:20,paddingTop:18,borderTop:"1px solid #F1F5F9"}}>
        <p style={{fontSize:13,color:"#64748B"}}>Belum punya akun?{" "}
          <button onClick={onGoRegister} style={{background:"none",border:"none",cursor:"pointer",color:"#2563EB",fontWeight:800,fontSize:13}}>
            Daftar Sekarang →
          </button>
        </p>
      </div>
    </div>
  );
}

/* ══════ REGISTER PAGE ══════ */
function RegisterForm({ onRegister, onGoLogin }) {
  const [username, setUsername] = useState("");
  const [phone,    setPhone]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [showPass, setShowPass] = useState(false);

  const doRegister = async () => {
    if (!username.trim() || !phone.trim() || !password) { setError("Isi semua kolom"); return; }
    if (username.trim().length < 3) { setError("Username minimal 3 karakter"); return; }
    if (password.length < 6) { setError("Password minimal 6 karakter"); return; }
    if (!/^\d{8,15}$/.test(phone.replace(/[\s\-\+]/g,""))) { setError("Nomor HP tidak valid (8-15 digit)"); return; }

    setLoading(true); setError("");
    try {
      const user = await registerCustomer({
        username: username.trim().toLowerCase(),
        phone: phone.trim(),
        password,
      });
      onRegister(user);
    } catch(e) {
      setError(e.message || "Pendaftaran gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{fontWeight:900,fontSize:22,marginBottom:4,color:"#0F172A"}}>Buat Akun Baru 🎉</h2>
      <p style={{color:"#64748B",fontSize:13,marginBottom:24}}>Daftar untuk mulai belanja di KIOS REFRES</p>

      {error && (
        <div style={{background:"#FEF2F2",border:"1.5px solid #FECACA",borderRadius:10,padding:"10px 13px",marginBottom:14,display:"flex",gap:8,alignItems:"center"}}>
          <span>❌</span>
          <p style={{fontSize:13,color:"#DC2626",fontWeight:700}}>{error}</p>
        </div>
      )}

      <InputField label="Username" placeholder="Buat username (min. 3 huruf)" value={username} onChange={e=>setUsername(e.target.value)} icon="👤"/>
      <InputField label="Nomor HP" type="tel" placeholder="Contoh: 08123456789" value={phone} onChange={e=>setPhone(e.target.value)} icon="📱"/>

      <div style={{marginBottom:14}}>
        <p style={{fontSize:12,fontWeight:800,color:"#475569",marginBottom:6}}>Password</p>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:16,opacity:.5}}>🔒</span>
          <input
            type={showPass?"text":"password"}
            placeholder="Buat password (min. 6 karakter)"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&doRegister()}
            style={{...inp, paddingLeft:"40px", paddingRight:"44px"}}
          />
          <button onClick={()=>setShowPass(p=>!p)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,opacity:.5}}>
            {showPass?"🙈":"👁️"}
          </button>
        </div>
      </div>

      <div style={{background:"#EFF6FF",borderRadius:10,padding:"10px 13px",marginBottom:16,display:"flex",gap:8}}>
        <span style={{fontSize:14}}>ℹ️</span>
        <p style={{fontSize:12,color:"#1D4ED8",lineHeight:1.6}}>Username hanya bisa huruf kecil & angka. Nomor HP digunakan untuk menghubungi terkait pesanan.</p>
      </div>

      <button
        onClick={doRegister}
        disabled={loading}
        style={{width:"100%",padding:"13px",background:loading?"#94A3B8":"linear-gradient(135deg,#059669,#10B981)",color:"#fff",border:"none",borderRadius:12,fontWeight:900,fontSize:15,cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}
      >
        {loading ? <><Spinner size={18}/> Mendaftarkan...</> : "✅ Daftar Sekarang"}
      </button>

      <div style={{textAlign:"center",marginTop:20,paddingTop:18,borderTop:"1px solid #F1F5F9"}}>
        <p style={{fontSize:13,color:"#64748B"}}>Sudah punya akun?{" "}
          <button onClick={onGoLogin} style={{background:"none",border:"none",cursor:"pointer",color:"#2563EB",fontWeight:800,fontSize:13}}>
            Login →
          </button>
        </p>
      </div>
    </div>
  );
}

/* ══════ AUTH WRAPPER (export utama) ══════ */
export function CustomerAuth({ onAuth }) {
  const [view, setView] = useState("login"); // "login" | "register"

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(145deg,#1E3A8A,#2563EB)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      {/* Dekorasi background */}
      <div style={{position:"fixed",width:300,height:300,background:"rgba(255,255,255,0.05)",borderRadius:"50%",top:-100,right:-80,pointerEvents:"none"}}/>
      <div style={{position:"fixed",width:200,height:200,background:"rgba(245,158,11,0.1)",borderRadius:"50%",bottom:-60,left:-60,pointerEvents:"none"}}/>

      <div style={{width:"100%",maxWidth:400,position:"relative",zIndex:1}}>
        {/* Header */}
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{width:72,height:72,background:"#fff",borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,margin:"0 auto 14px",boxShadow:"0 10px 40px rgba(0,0,0,0.2)"}}>🛒</div>
          <h1 style={{color:"#fff",fontSize:22,fontWeight:900,letterSpacing:"-0.5px"}}>KIOS REFRES</h1>
          <p style={{color:"rgba(255,255,255,0.6)",fontSize:13,marginTop:4}}>Belanja Mudah · Harga Bersahabat</p>
        </div>

        {/* Card */}
        <div style={{background:"#fff",borderRadius:20,padding:"28px 24px",boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>
          {view==="login"
            ? <LoginForm onLogin={onAuth} onGoRegister={()=>setView("register")}/>
            : <RegisterForm onRegister={onAuth} onGoLogin={()=>setView("login")}/>
          }
        </div>
      </div>
    </div>
  );
}
