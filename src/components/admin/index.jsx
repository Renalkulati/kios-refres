import { useState, useEffect } from "react";
import { fetchOrders, updateOrderStatus, subscribeOrders, fetchStaff, saveStaff, deleteStaff, subscribeStaff, fetchCategories, saveCategory, deleteCategory, subscribeCategories, loginStaff } from "../../lib/db.js";
import { supabase } from "../../lib/supabase.js";
import { fmt, now } from "../../utils/index.js";
import { useToast, ToastBox, StatCard, Modal, Confirm, Empty, Field, Spinner, StatusBadge } from "../ui/index.jsx";

/* ══════ LOGIN PAGE ══════ */
export function LoginPage({ onLogin }) {
  const [user, setUser]   = useState("");
  const [pass, setPass]   = useState("");
  const [err,  setErr]    = useState("");
  const [busy, setBusy]   = useState(false);
  const [show, setShow]   = useState(false);

  const handle = async () => {
    if(!user||!pass){setErr("Username dan password wajib diisi");return;}
    setBusy(true);
    try {
      const acc = await loginStaff(user.trim(), pass);
      if(acc) onLogin(acc);
      else { setErr("Username atau password salah"); setBusy(false); }
    } catch(e) {
      setErr("Gagal koneksi. Coba lagi."); setBusy(false);
    }
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",background:"linear-gradient(135deg,#0F172A 0%,#1E3A8A 45%,#1D4ED8 100%)"}}>
      {/* Left — branding */}
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:40,color:"#fff"}} className="hide-mobile">
        <div style={{maxWidth:400,width:"100%"}}>
          <div style={{width:72,height:72,background:"rgba(255,255,255,0.1)",borderRadius:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,marginBottom:22,border:"1px solid rgba(255,255,255,0.15)"}}>🛒</div>
          <h1 style={{fontWeight:900,fontSize:30,marginBottom:10,letterSpacing:"-0.5px"}}>KIOS REFRES</h1>
          <p style={{color:"rgba(255,255,255,0.6)",fontSize:14,lineHeight:1.75,marginBottom:30}}>Panel manajemen toko untuk Owner & Staff. Kelola produk, pesanan, dan pantau performa toko.</p>
          {["📦 Kelola Produk & Stok","📊 Dashboard Analitik Real-time","🧾 Manajemen Pesanan Lengkap","👥 Akses Multi-Staff & Owner"].map(f=>(
            <div key={f} style={{display:"flex",alignItems:"center",gap:10,color:"rgba(255,255,255,0.75)",fontSize:13,marginBottom:10}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:"#FCD34D",flexShrink:0}}/>
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div style={{width:"100%",maxWidth:420,background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",padding:"32px 34px",borderRadius:"24px 0 0 24px"}}>
        <div style={{width:"100%"}}>
          <h2 style={{fontWeight:900,fontSize:23,marginBottom:6}}>Masuk ke Dashboard</h2>
          <p style={{color:"#64748B",fontSize:13,marginBottom:26}}>Masukkan kredensial akun Anda</p>

          {err && (
            <div style={{background:"#FEE2E2",color:"#991B1B",padding:"10px 13px",borderRadius:11,fontSize:13,fontWeight:700,marginBottom:16,border:"1px solid #FECACA",display:"flex",gap:8,alignItems:"center"}}>
              ❌ {err}
            </div>
          )}

          <Field label="Username">
            <input className="inp" value={user} onChange={e=>{setUser(e.target.value);setErr("");}} placeholder="Masukkan username" onKeyDown={e=>e.key==="Enter"&&handle()}/>
          </Field>
          <Field label="Password">
            <div style={{position:"relative"}}>
              <input className="inp" type={show?"text":"password"} value={pass} onChange={e=>{setPass(e.target.value);setErr("");}} placeholder="Masukkan password" onKeyDown={e=>e.key==="Enter"&&handle()} style={{paddingRight:44}}/>
              <button onClick={()=>setShow(p=>!p)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16}}>{show?"🙈":"👁️"}</button>
            </div>
          </Field>

          <button onClick={handle} disabled={busy} className="btn btn-primary btn-block btn-lg" style={{marginTop:6,opacity:busy?.7:1}}>
            {busy?<><Spinner size={18}/> Memverifikasi...</>:"Masuk →"}
          </button>

          <div style={{marginTop:22,padding:14,background:"#F8FAFD",borderRadius:11}}>
            <p style={{fontSize:12,fontWeight:800,color:"#64748B",marginBottom:8}}>Akun Demo (klik untuk isi otomatis):</p>
            {[["owner","owner123","Owner"],["staf1","staf123","Staff"]].map(([u,p,r])=>(
              <div key={u} onClick={()=>{setUser(u);setPass(p);setErr("");}} style={{cursor:"pointer",padding:"7px 10px",borderRadius:9,display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5,background:"#fff",border:"1px solid #E2E8F4",transition:"all .15s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#2563EB"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#E2E8F4"}
              >
                <span style={{fontSize:12,fontWeight:700,color:"#334155"}}>{u} / {p}</span>
                <span className={`badge ${r==="Owner"?"b-amber":"b-indigo"}`}>{r==="Owner"?"👑":"🧑"} {r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════ ADMIN SIDEBAR ══════ */
function Sidebar({ active, setActive, user, onLogout, open, onClose }) {
  const menus = [
    {id:"dashboard",icon:"📊",label:"Dashboard"},
    {id:"products", icon:"📦",label:"Produk"},
    {id:"staff",    icon:"👥",label:"Staff & Akun"},
    {id:"orders",   icon:"🧾",label:"Pesanan"},
    {id:"settings", icon:"⚙️",label:"Pengaturan"},
  ];
  return (
    <>
      {open && <div className="overlay" onClick={onClose}/>}
      <div className={`admin-sidebar ${open?"open":""}`}>
        {/* Brand */}
        <div style={{padding:"22px 18px 16px",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <div style={{width:38,height:38,background:"#2563EB",borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19}}>🛒</div>
            <div>
              <p style={{color:"#fff",fontWeight:900,fontSize:14}}>KIOS REFRES</p>
              <p style={{color:"rgba(255,255,255,0.38)",fontSize:11}}>Admin Panel</p>
            </div>
          </div>
          {/* User pill */}
          <div style={{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.06)",borderRadius:11,padding:"9px 12px"}}>
            <div style={{width:34,height:34,borderRadius:9,background:"#2563EB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:"#fff"}}>{user.avatar}</div>
            <div>
              <p style={{color:"#fff",fontSize:13,fontWeight:800}}>{user.name}</p>
              <span className={`badge ${user.role==="owner"?"b-amber":"b-indigo"}`} style={{fontSize:10,padding:"2px 7px"}}>{user.role==="owner"?"👑 Owner":"🧑 Staff"}</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{flex:1,padding:"14px 10px",overflowY:"auto"}}>
          {menus.map(m=>(
            <button key={m.id} onClick={()=>{setActive(m.id);onClose?.();}} className={`sidebar-item ${active===m.id?"active":""}`}>
              <span style={{fontSize:18}}>{m.icon}</span>
              {m.label}
              {active===m.id && <div style={{marginLeft:"auto",width:5,height:5,borderRadius:"50%",background:"#fff"}}/>}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div style={{padding:"12px 10px",borderTop:"1px solid rgba(255,255,255,0.08)"}}>
          <button onClick={onLogout} className="sidebar-item" style={{color:"#FCA5A5",background:"rgba(239,68,68,0.13)"}}>
            <span style={{fontSize:18}}>🚪</span> Keluar
          </button>
        </div>
      </div>
    </>
  );
}

/* ══════ TOPBAR ══════ */
function Topbar({ title, onMenu, user }) {
  return (
    <div style={{background:"#fff",borderBottom:"1px solid #E2E8F4",padding:"0 18px",height:56,display:"flex",alignItems:"center",gap:13,position:"sticky",top:0,zIndex:90,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
      <button onClick={onMenu} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:"#64748B",padding:4,display:"flex"}}>☰</button>
      <h1 style={{fontWeight:900,fontSize:16,color:"#0F172A",flex:1}}>{title}</h1>
      <div style={{width:32,height:32,borderRadius:9,background:"#EFF6FF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:"#2563EB"}}>{user.avatar}</div>
    </div>
  );
}

/* ══════ DASHBOARD ══════ */
function Dashboard({ products, orders }) {
  const revenue = orders.reduce((s,o)=>s+o.total_price,0);
  const low     = products.filter(p=>p.stock<10).length;
  const recent  = [...orders].reverse().slice(0,6);
  const top5    = [...products].sort((a,b)=>b.sold-a.sold).slice(0,5);

  return (
    <div style={{padding:"20px 18px 40px"}}>
      <div style={{marginBottom:20}}>
        <h2 style={{fontWeight:900,fontSize:19,marginBottom:3}}>Selamat datang kembali 👋</h2>
        <p style={{color:"#64748B",fontSize:13}}>Ringkasan toko Anda hari ini</p>
      </div>

      <div className="stat-grid" style={{marginBottom:22}}>
        <StatCard icon="💰" label="Total Pendapatan"  value={fmt(revenue)}         color="#059669" bg="#D1FAE5" sub="Semua pesanan"/>
        <StatCard icon="🧾" label="Total Pesanan"     value={orders.length}         color="#2563EB" bg="#EFF6FF" sub="Semua status"/>
        <StatCard icon="📦" label="Total Produk"      value={products.length}       color="#6366F1" bg="#EEF2FF" sub="Produk aktif"/>
        <StatCard icon="⚠️" label="Stok Kritis"       value={low}                   color="#F59E0B" bg="#FEF3C7" sub="Produk < 10 unit"/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr",gap:18}}>
        {/* Recent Orders */}
        <div className="card" style={{overflow:"hidden"}}>
          <div style={{padding:"16px 18px 12px",borderBottom:"1px solid #F1F5F9"}}>
            <h3 style={{fontWeight:800,fontSize:15}}>🧾 Pesanan Terbaru</h3>
          </div>
          {!recent.length
            ? <Empty icon="🧾" title="Belum ada pesanan"/>
            : <div style={{overflowX:"auto"}}>
                <table className="tbl">
                  <thead><tr><th>Order ID</th><th>Pelanggan</th><th>Total</th><th>Metode</th><th>Status</th></tr></thead>
                  <tbody>
                    {recent.map(o=>(
                      <tr key={o.order_id}>
                        <td style={{fontWeight:700,color:"#2563EB",fontSize:12}}>{o.order_id}</td>
                        <td style={{fontWeight:700}}>{o.customer_name}</td>
                        <td style={{fontWeight:900,color:"#2563EB"}}>{fmt(o.total_price)}</td>
                        <td><span className="badge b-gray">{o.delivery_method==="pickup"?"🏪 Pickup":"🚚 Delivery"}</span></td>
                        <td><StatusBadge status={o.order_status}/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </div>

        {/* Top Products */}
        <div className="card" style={{overflow:"hidden"}}>
          <div style={{padding:"16px 18px 12px",borderBottom:"1px solid #F1F5F9"}}>
            <h3 style={{fontWeight:800,fontSize:15}}>🏆 Produk Terlaris</h3>
          </div>
          <div style={{padding:"6px 0"}}>
            {top5.map((p,i)=>(
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:13,padding:"10px 18px",borderBottom:i<4?"1px solid #F1F5F9":"none"}}>
                <span style={{width:22,fontWeight:900,color:"#94A3B8",fontSize:13}}>#{i+1}</span>
                <img src={p.img} alt={p.name} style={{width:42,height:42,objectFit:"cover",borderRadius:10,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontWeight:800,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</p>
                  <p style={{fontSize:11,color:"#64748B"}}>{p.sold} terjual</p>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <p style={{fontWeight:900,color:"#2563EB",fontSize:13}}>{fmt(p.price)}</p>
                  <span className={`badge ${p.stock<10?"b-amber":"b-green"}`} style={{fontSize:10}}>Stok: {p.stock}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════ PRODUCTS MANAGEMENT ══════ */
function ProductsMgmt({ products, setProducts, toast, categories=["Minuman","Snack","Makanan Instan","Kebutuhan Harian"], setCategories }) {
  const [search,  setSearch]  = useState("");
  const [catF,    setCatF]    = useState("Semua");
  const [modal,   setModal]   = useState(false);
  const [edit,    setEdit]    = useState(null);
  const [delId,   setDelId]   = useState(null);
  const [form,    setForm]    = useState({name:"",price:"",desc:"",img:"",stock:"",cat:"Minuman"});
  const [errs,    setErrs]    = useState({});
  const [saving,  setSaving]  = useState(false);
  // State tambah stok cepat
  const [stockModal, setStockModal] = useState(null); // product object
  const [stockAdd,   setStockAdd]   = useState("");

  const filtered = products.filter(p=>(catF==="Semua"||p.cat===catF)&&p.name.toLowerCase().includes(search.toLowerCase()));

  const openAdd  = () => { setEdit(null); setForm({name:"",price:"",desc:"",img:"",stock:"",cat:"Minuman"}); setErrs({}); setModal(true); };
  const openEdit = p  => { setEdit(p); setForm({name:p.name,price:String(p.price),desc:p.desc||"",img:p.img||"",stock:String(p.stock),cat:p.cat||"Minuman"}); setErrs({}); setModal(true); };

  const validate = () => {
    const e={};
    if(!form.name.trim())               e.name ="Nama wajib diisi";
    if(!form.price||isNaN(+form.price)) e.price="Harga tidak valid";
    if(!form.stock||isNaN(+form.stock)) e.stock="Stok tidak valid";
    return e;
  };

  const save = async () => {
    const e=validate(); if(Object.keys(e).length){setErrs(e);return;}
    setSaving(true);
    const data={name:form.name,price:+form.price,stock:+form.stock,cat:form.cat,img:form.img,desc:form.desc,rating:edit?.rating||4.8,sold:edit?.sold||0};
    try {
      const { supabase } = await import("../../lib/supabase.js");
      if(edit) {
        const {error} = await supabase.from("products").update(data).eq("id", edit.id);
        if(error) throw error;
        setProducts(p=>p.map(x=>x.id===edit.id?{...x,...data}:x));
        toast.add("Produk berhasil diperbarui ✅");
      } else {
        const {data:inserted, error} = await supabase.from("products").insert([data]).select().single();
        if(error) throw error;
        setProducts(p=>[...p, inserted]);
        toast.add("Produk berhasil ditambahkan ✅");
      }
      setModal(false);
    } catch(err) {
      toast.add("Gagal simpan: "+err.message, "err");
    }
    setSaving(false);
  };

  const del = async () => {
    try {
      const { supabase } = await import("../../lib/supabase.js");
      const {error} = await supabase.from("products").delete().eq("id", delId);
      if(error) throw error;
      setProducts(p=>p.filter(x=>x.id!==delId));
      toast.add("Produk dihapus","err");
    } catch(err) {
      toast.add("Gagal hapus: "+err.message,"err");
    }
    setDelId(null);
  };

  // Tambah stok cepat tanpa buka modal edit
  const saveStockAdd = async () => {
    if(!stockAdd||isNaN(+stockAdd)||+stockAdd<=0) return;
    const newStock = (stockModal.stock||0) + (+stockAdd);
    try {
      const { supabase } = await import("../../lib/supabase.js");
      const {error} = await supabase.from("products").update({stock: newStock}).eq("id", stockModal.id);
      if(error) throw error;
      setProducts(p=>p.map(x=>x.id===stockModal.id?{...x,stock:newStock}:x));
      toast.add(`Stok ${stockModal.name} +${stockAdd} → ${newStock} unit ✅`);
      setStockModal(null); setStockAdd("");
    } catch(err) {
      toast.add("Gagal update stok: "+err.message,"err");
    }
  };

  const sf  = (k,v) => { setForm(p=>({...p,[k]:v})); setErrs(p=>({...p,[k]:""})); };

  return (
    <div style={{padding:"20px 18px 40px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:10}}>
        <div>
          <h2 style={{fontWeight:900,fontSize:19}}>Manajemen Produk</h2>
          <p style={{color:"#64748B",fontSize:13}}>{products.length} produk tersedia</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">+ Tambah Produk</button>
      </div>

      {/* Filter */}
      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:1,minWidth:180}}>
          <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",opacity:.5,fontSize:14}}>🔍</span>
          <input className="inp" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari produk..." style={{paddingLeft:34}}/>
        </div>
        <select className="inp" value={catF} onChange={e=>setCatF(e.target.value)} style={{width:"auto",flexShrink:0}}>
          {["Semua",...CATEGORIES.filter(c=>c!=="Semua")].map(c=><option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="card" style={{overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table className="tbl">
            <thead><tr><th>Produk</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Terjual</th><th>Rating</th><th>Aksi</th></tr></thead>
            <tbody>
              {!filtered.length
                ? <tr><td colSpan={7} style={{textAlign:"center",padding:"40px",color:"#94A3B8"}}>Produk tidak ditemukan</td></tr>
                : filtered.map(p=>(
                  <tr key={p.id}>
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:11,minWidth:150}}>
                        <img src={p.img} alt={p.name} style={{width:42,height:42,objectFit:"cover",borderRadius:9,flexShrink:0}}/>
                        <p style={{fontWeight:800,fontSize:13,lineHeight:1.3}}>{p.name}</p>
                      </div>
                    </td>
                    <td><span className="badge b-blue">{p.cat}</span></td>
                    <td style={{fontWeight:900,color:"#2563EB"}}>{fmt(p.price)}</td>
                    <td><span className={`badge ${p.stock<10?"b-amber":p.stock===0?"b-red":"b-green"}`}>{p.stock}</span></td>
                    <td style={{fontWeight:700}}>{p.sold}</td>
                    <td style={{fontWeight:700}}>⭐ {p.rating}</td>
                    <td>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                        <button onClick={()=>{setStockModal(p);setStockAdd("");}} className="btn btn-sm" style={{background:"#ECFDF5",color:"#059669",fontWeight:800,border:"none",cursor:"pointer"}}>+Stok</button>
                        <button onClick={()=>openEdit(p)} className="btn btn-secondary btn-sm">Edit</button>
                        <button onClick={()=>setDelId(p.id)} className="btn btn-danger btn-sm">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={()=>setModal(false)} title={edit?"Edit Produk":"Tambah Produk Baru"}
        footer={<><button className="btn btn-ghost btn-sm" onClick={()=>setModal(false)}>Batal</button><button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving?"Menyimpan...":"💾 Simpan"}</button></>}
      >
        <Field label="Nama Produk" err={errs.name}>
          <input className={`inp ${errs.name?"inp-err":""}`} value={form.name} onChange={e=>sf("name",e.target.value)} placeholder="Nama produk"/>
        </Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
          <Field label="Harga (Rp)" err={errs.price}>
            <input className={`inp ${errs.price?"inp-err":""}`} type="number" value={form.price} onChange={e=>sf("price",e.target.value)} placeholder="0"/>
          </Field>
          <Field label="Stok" err={errs.stock}>
            <input className={`inp ${errs.stock?"inp-err":""}`} type="number" value={form.stock} onChange={e=>sf("stock",e.target.value)} placeholder="0"/>
          </Field>
        </div>
        <Field label="Kategori">
          <select className="inp" value={form.cat} onChange={e=>sf("cat",e.target.value)}>
            {categories.map(c=><option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Foto Produk">
          <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
            <div style={{flex:1}}>
              <input className="inp" value={form.img} onChange={e=>sf("img",e.target.value)} placeholder="URL gambar atau upload di bawah"/>
            </div>
          </div>
          <label style={{display:"flex",alignItems:"center",gap:8,background:"#EFF6FF",border:"1.5px solid #BFDBFE",borderRadius:9,padding:"9px 13px",cursor:"pointer",fontWeight:700,fontSize:13,color:"#2563EB",marginTop:8}}>
            📷 Pilih dari Galeri / Kamera
            <input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{
              const file=e.target.files[0]; if(!file) return;
              if(file.size>800000){toast.add("Ukuran max 800KB","err");return;}
              const r=new FileReader(); r.onload=ev=>sf("img",ev.target.result); r.readAsDataURL(file);
            }}/>
          </label>
          {form.img&&form.img.startsWith("data:")&&(
            <div style={{marginTop:8,textAlign:"center"}}>
              <img src={form.img} alt="preview" style={{maxHeight:100,maxWidth:"100%",borderRadius:8,objectFit:"contain"}}/>
              <p style={{fontSize:11,color:"#10B981",fontWeight:700,marginTop:4}}>✅ Foto siap diupload</p>
            </div>
          )}
        </Field>
        <Field label="Deskripsi">
          <textarea className="inp" rows={3} value={form.desc} onChange={e=>sf("desc",e.target.value)} placeholder="Deskripsi produk..." style={{resize:"none"}}/>
        </Field>
      </Modal>

      <Confirm open={!!delId} onClose={()=>setDelId(null)} onOk={del} danger title="Hapus Produk" msg="Yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan."/>

      {/* Kelola Kategori */}
      <CatMgmt categories={categories} setCategories={setCategories} toast={toast}/>

      {/* Modal Tambah Stok Cepat */}
      <Modal open={!!stockModal} onClose={()=>{setStockModal(null);setStockAdd("");}} title="📦 Tambah Stok"
        footer={<><button className="btn btn-ghost btn-sm" onClick={()=>{setStockModal(null);setStockAdd("");}}>Batal</button><button className="btn btn-primary btn-sm" onClick={saveStockAdd} disabled={!stockAdd||isNaN(+stockAdd)||+stockAdd<=0}>✅ Tambahkan</button></>}
      >
        {stockModal && (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:12,background:"#F8FAFC",borderRadius:10,padding:"10px 14px",marginBottom:16}}>
              <img src={stockModal.img} alt={stockModal.name} style={{width:44,height:44,borderRadius:8,objectFit:"cover"}}/>
              <div>
                <p style={{fontWeight:800,fontSize:14}}>{stockModal.name}</p>
                <p style={{fontSize:12,color:"#64748B"}}>Stok saat ini: <strong style={{color: stockModal.stock<10?"#F59E0B":"#10B981"}}>{stockModal.stock} unit</strong></p>
              </div>
            </div>
            <Field label="Jumlah yang ditambahkan">
              <input className="inp" type="number" min="1" value={stockAdd}
                onChange={e=>setStockAdd(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&saveStockAdd()}
                placeholder="Masukkan jumlah stok tambahan" autoFocus/>
            </Field>
            {stockAdd && !isNaN(+stockAdd) && +stockAdd>0 && (
              <div style={{background:"#EFF6FF",borderRadius:9,padding:"8px 13px",fontSize:13,color:"#1D4ED8",fontWeight:700}}>
                Stok akan menjadi: {stockModal.stock} + {stockAdd} = <strong>{stockModal.stock + (+stockAdd)} unit</strong>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ══════ ORDERS MANAGEMENT ══════ */
function OrdersMgmt({ orders, setOrders, toast }) {
  const [filter, setFilter] = useState("semua");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState(null);

  const filtered = orders.filter(o=>
    (filter==="semua"||o.order_status===filter)&&
    (o.order_id.toLowerCase().includes(search.toLowerCase())||o.customer_name.toLowerCase().includes(search.toLowerCase()))
  );

  const updateStatus = async (id, s) => {
    // Update lokal dulu supaya UI langsung responsif
    setOrders(p=>p.map(o=>o.order_id===id?{...o,order_status:s}:o));
    if(detail?.order_id===id) setDetail(p=>({...p,order_status:s}));
    toast.add(`Status diperbarui ke "${s}"`);
    // Update ke Supabase
    try {
      await updateOrderStatus(id, s);
    } catch(e) {
      console.error("Update status error:", e);
      toast.add("Gagal update status: " + e.message, "err");
    }
  };

  return (
    <div style={{padding:"20px 18px 40px"}}>
      <div style={{marginBottom:18}}>
        <h2 style={{fontWeight:900,fontSize:19}}>Manajemen Pesanan</h2>
        <p style={{color:"#64748B",fontSize:13}}>{orders.length} total pesanan</p>
      </div>

      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:1,minWidth:180}}>
          <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",opacity:.5,fontSize:14}}>🔍</span>
          <input className="inp" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari Order ID / Nama..." style={{paddingLeft:34}}/>
        </div>
        <div className="noscroll" style={{display:"flex",gap:6,overflowX:"auto"}}>
          {["semua","diproses","dikirim","selesai","dibatalkan"].map(s=>(
            <button key={s} onClick={()=>setFilter(s)} className="btn btn-sm" style={{background:filter===s?"#2563EB":"#fff",color:filter===s?"#fff":"#64748B",border:`1.5px solid ${filter===s?"#2563EB":"#E2E8F4"}`,textTransform:"capitalize",flexShrink:0}}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{overflow:"hidden"}}>
        {!filtered.length
          ? <Empty icon="🧾" title="Tidak ada pesanan" desc="Belum ada pesanan sesuai filter"/>
          : <div style={{overflowX:"auto"}}>
              <table className="tbl">
                <thead><tr><th>Order ID</th><th>Pelanggan</th><th>Total</th><th>Pengiriman</th><th>Pembayaran</th><th>Status</th><th>Update</th></tr></thead>
                <tbody>
                  {[...filtered].reverse().map(o=>(
                    <tr key={o.order_id}>
                      <td style={{fontWeight:800,color:"#2563EB",fontSize:12,cursor:"pointer"}} onClick={()=>setDetail(o)}>{o.order_id}</td>
                      <td>
                        <p style={{fontWeight:800,fontSize:13}}>{o.customer_name}</p>
                        <p style={{fontSize:11,color:"#94A3B8"}}>{o.phone}</p>
                      </td>
                      <td style={{fontWeight:900,color:"#2563EB"}}>{fmt(o.total_price)}</td>
                      <td><span className="badge b-gray">{o.delivery_method==="pickup"?"🏪 Pickup":"🚚 Delivery"}</span></td>
                      <td>
                        <span className={`badge ${
                          o.payment_method==="QRIS"?"b-indigo":
                          o.payment_method?.startsWith("Transfer")?"b-blue":
                          ["GoPay","OVO","DANA","ShopeePay"].includes(o.payment_method)?"b-green":"b-gray"
                        }`} style={{whiteSpace:"nowrap"}}>
                          {o.payment_method==="QRIS"?"⬛":o.payment_method?.startsWith("Transfer")?"🏦":["GoPay","OVO","DANA","ShopeePay"].includes(o.payment_method)?"📱":"💳"} {o.payment_method||"-"}
                        </span>
                      </td>
                      <td><StatusBadge status={o.order_status}/></td>
                      <td>
                        <select value={o.order_status} onChange={e=>updateStatus(o.order_id,e.target.value)} className="inp" style={{width:"auto",padding:"5px 8px",fontSize:12,cursor:"pointer"}}>
                          {["diproses","dikirim","selesai","dibatalkan"].map(s=><option key={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>

      {/* Detail Modal */}
      <Modal open={!!detail} onClose={()=>setDetail(null)} title="Detail Pesanan">
        {detail && (
          <div>
            <div style={{background:"#F8FAFD",borderRadius:12,padding:13,marginBottom:13}}>
              <p style={{fontWeight:900,color:"#2563EB",marginBottom:8}}>{detail.order_id}</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[["Pelanggan",detail.customer_name],["Telepon",detail.phone],["Metode Kirim",detail.delivery_method],["Metode Bayar",detail.payment_method],["Tanggal",detail.order_date],["Alamat",detail.address]].map(([l,v])=>(
                  <div key={l}><p style={{fontSize:11,color:"#94A3B8",fontWeight:700}}>{l}</p><p style={{fontSize:13,fontWeight:700}}>{v}</p></div>
                ))}
              </div>
              {detail.pickup_code && (
                <div style={{marginTop:11,background:"#2563EB",borderRadius:10,padding:"10px 13px",textAlign:"center"}}>
                  <p style={{color:"rgba(255,255,255,0.65)",fontSize:11,marginBottom:4}}>KODE PICKUP</p>
                  <p style={{color:"#FCD34D",fontWeight:900,fontSize:18,fontFamily:"monospace",letterSpacing:3}}>{detail.pickup_code}</p>
                </div>
              )}
            </div>
            <p style={{fontWeight:800,fontSize:13,marginBottom:8}}>Produk Dipesan:</p>
            {detail.products.map(p=>(
              <div key={p.id} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #F1F5F9"}}>
                <span style={{fontSize:13}}>{p.name} ×{p.qty}</span>
                <span style={{fontWeight:800}}>{fmt(p.price*p.qty)}</span>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",marginTop:10,paddingTop:10,borderTop:"1px solid #E2E8F4"}}>
              <span style={{fontWeight:900}}>TOTAL</span>
              <span style={{fontWeight:900,color:"#2563EB",fontSize:17}}>{fmt(detail.total_price)}</span>
            </div>
            <div style={{marginTop:15}}>
              <p style={{fontSize:12,fontWeight:700,color:"#64748B",marginBottom:6}}>Update Status:</p>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {["diproses","dikirim","selesai","dibatalkan"].map(s=>(
                  <button key={s} onClick={()=>updateStatus(detail.order_id,s)} className="btn btn-sm" style={{background:detail.order_status===s?"#2563EB":"#fff",color:detail.order_status===s?"#fff":"#64748B",border:`1.5px solid ${detail.order_status===s?"#2563EB":"#E2E8F4"}`,textTransform:"capitalize"}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ══════ SETTINGS ══════ */
function Settings({ user, toast }) {
  const BANKS = ["bca","mandiri","bni","bri","bsi"];
  const EWALLETS = ["gopay","ovo","dana","shopeepay"];

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [tab,     setTab]     = useState("wa"); // wa | bank | qris | info

  // State semua settings
  const [waNumber,  setWaNumber]  = useState("");
  const [waName,    setWaName]    = useState("");
  const [qrisImg,   setQrisImg]   = useState("");
  const [qrisPreview, setQrisPreview] = useState("");
  const [banks,     setBanks]     = useState({});
  const [ewallets,  setEwallets]  = useState({});
  const [storeName, setStoreName] = useState("KIOS REFRES");
  const [storeAddr, setStoreAddr] = useState("Jl. Raya Contoh No. 88, Jakarta Selatan");
  const [storeHours,setStoreHours]= useState("07.00 - 21.00 WIB");

  useEffect(() => {
    async function load() {
      try {
        const { fetchSettings } = await import("../../lib/db.js");
        const s = await fetchSettings();
        setWaNumber(s.wa_number||"");
        setWaName(s.wa_name||"");
        setQrisImg(s.qris_image||"");
        setQrisPreview(s.qris_image||"");
        setStoreName(s.store_name||"KIOS REFRES");
        setStoreAddr(s.store_addr||"Jl. Raya Contoh No. 88, Jakarta Selatan");
        setStoreHours(s.store_hours||"07.00 - 21.00 WIB");
        const b={}, e={};
        BANKS.forEach(bk => {
          b[bk] = { number: s[`bank_${bk}`]||"", name: s[`bank_${bk}_name`]||"" };
        });
        EWALLETS.forEach(ew => {
          e[ew] = s[`ewallet_${ew}`]||"";
        });
        setBanks(b); setEwallets(e);
      } catch(err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const handleQrisUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500000) { toast.add("Ukuran gambar max 500KB", "err"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setQrisImg(ev.target.result);
      setQrisPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const saveWA = async () => {
    setSaving(true);
    try {
      const { saveSettings } = await import("../../lib/db.js");
      await saveSettings({ wa_number: waNumber, wa_name: waName });
      toast.add("Nomor WA berhasil disimpan ✅");
    } catch(e) { toast.add("Gagal simpan: "+e.message, "err"); }
    setSaving(false);
  };

  const saveQris = async () => {
    setSaving(true);
    try {
      const { saveSetting } = await import("../../lib/db.js");
      await saveSetting("qris_image", qrisImg);
      toast.add("QRIS berhasil disimpan ✅");
    } catch(e) { toast.add("Gagal simpan: "+e.message, "err"); }
    setSaving(false);
  };

  const saveBanks = async () => {
    setSaving(true);
    try {
      const { saveSettings } = await import("../../lib/db.js");
      const obj = {};
      BANKS.forEach(bk => {
        obj[`bank_${bk}`]      = banks[bk]?.number||"";
        obj[`bank_${bk}_name`] = banks[bk]?.name||"";
      });
      EWALLETS.forEach(ew => {
        obj[`ewallet_${ew}`] = ewallets[ew]||"";
      });
      await saveSettings(obj);
      toast.add("Info pembayaran berhasil disimpan ✅");
    } catch(e) { toast.add("Gagal simpan: "+e.message, "err"); }
    setSaving(false);
  };

  const saveInfo = async () => {
    setSaving(true);
    try {
      const { saveSettings } = await import("../../lib/db.js");
      await saveSettings({ store_name: storeName, store_addr: storeAddr, store_hours: storeHours });
      toast.add("Informasi toko berhasil disimpan ✅");
    } catch(e) { toast.add("Gagal simpan: "+e.message, "err"); }
    setSaving(false);
  };

  const tabs = [
    {id:"wa",   icon:"💬", label:"WhatsApp"},
    {id:"qris", icon:"📱", label:"QRIS"},
    {id:"bank", icon:"🏦", label:"Bank & E-Wallet"},
    {id:"info", icon:"🏪", label:"Info Toko"},
  ];

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:60,gap:12}}>
      <Spinner size={28}/><p style={{fontWeight:700,color:"#64748B"}}>Memuat pengaturan...</p>
    </div>
  );

  // Hanya owner yang bisa ubah settings
  if (user.role !== "owner") return (
    <div style={{padding:"40px 18px",textAlign:"center"}}>
      <p style={{fontSize:32,marginBottom:12}}>🔒</p>
      <p style={{fontWeight:800,fontSize:16,color:"#0F172A"}}>Akses Terbatas</p>
      <p style={{color:"#64748B",fontSize:13,marginTop:6}}>Pengaturan hanya bisa diakses oleh Owner</p>
    </div>
  );

  return (
    <div style={{padding:"20px 18px 60px",maxWidth:640}}>
      <h2 style={{fontWeight:900,fontSize:19,marginBottom:4}}>⚙️ Pengaturan Toko</h2>
      <p style={{color:"#64748B",fontSize:13,marginBottom:20}}>Kelola semua konfigurasi KIOS REFRES</p>

      {/* Tab Menu */}
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{padding:"8px 16px",borderRadius:99,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,
              background: tab===t.id?"#2563EB":"#F1F5F9",
              color: tab===t.id?"#fff":"#64748B",
              boxShadow: tab===t.id?"0 2px 8px rgba(37,99,235,0.3)":"none",
              transition:"all .2s"
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB WhatsApp ── */}
      {tab==="wa" && (
        <div className="card" style={{padding:22}}>
          <h3 style={{fontWeight:800,fontSize:15,marginBottom:5}}>💬 Nomor WhatsApp</h3>
          <p style={{color:"#64748B",fontSize:13,marginBottom:18}}>Nomor ini akan muncul sebagai tombol "Chat WA" di halaman toko untuk pembeli</p>
          <Field label="Nomor WA (format: 628xxx)">
            <input className="inp" value={waNumber} onChange={e=>setWaNumber(e.target.value)} placeholder="628123456789"/>
          </Field>
          <Field label="Nama yang tampil">
            <input className="inp" value={waName} onChange={e=>setWaName(e.target.value)} placeholder="Admin KIOS REFRES"/>
          </Field>
          <div style={{background:"#EFF6FF",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:12,color:"#1D4ED8"}}>
            <strong>Preview tombol:</strong> 💬 Chat via WhatsApp<br/>
            akan menghubungi <strong>{waName||"Admin"}</strong> di <strong>{waNumber||"belum diisi"}</strong>
          </div>
          <button onClick={saveWA} disabled={saving} className="btn btn-primary">
            {saving?"Menyimpan...":"💾 Simpan Nomor WA"}
          </button>
        </div>
      )}

      {/* ── TAB QRIS ── */}
      {tab==="qris" && (
        <div className="card" style={{padding:22}}>
          <h3 style={{fontWeight:800,fontSize:15,marginBottom:5}}>📱 QR Code QRIS</h3>
          <p style={{color:"#64748B",fontSize:13,marginBottom:18}}>Upload foto QRIS Anda. Akan ditampilkan saat pembeli pilih metode QRIS</p>

          {qrisPreview ? (
            <div style={{textAlign:"center",marginBottom:16}}>
              <img src={qrisPreview} alt="QRIS" style={{maxWidth:220,maxHeight:220,borderRadius:12,border:"2px solid #E2E8F4",objectFit:"contain"}}/>
              <p style={{fontSize:12,color:"#10B981",fontWeight:700,marginTop:8}}>✅ QRIS sudah diupload</p>
            </div>
          ) : (
            <div style={{background:"#F8FAFC",border:"2px dashed #CBD5E1",borderRadius:12,padding:"30px 20px",textAlign:"center",marginBottom:16}}>
              <p style={{fontSize:28,marginBottom:8}}>📱</p>
              <p style={{fontSize:13,color:"#94A3B8"}}>Belum ada gambar QRIS</p>
            </div>
          )}

          <label style={{display:"block",background:"#EFF6FF",border:"1.5px solid #BFDBFE",borderRadius:10,padding:"11px 16px",textAlign:"center",cursor:"pointer",fontWeight:700,fontSize:13,color:"#2563EB",marginBottom:14}}>
            📁 Pilih Foto QRIS
            <input type="file" accept="image/*" onChange={handleQrisUpload} style={{display:"none"}}/>
          </label>
          <p style={{fontSize:11,color:"#94A3B8",marginBottom:16}}>Format: JPG/PNG. Maksimal 500KB</p>

          <button onClick={saveQris} disabled={saving||!qrisImg} className="btn btn-primary">
            {saving?"Menyimpan...":"💾 Simpan QRIS"}
          </button>
        </div>
      )}

      {/* ── TAB Bank & E-Wallet ── */}
      {tab==="bank" && (
        <div>
          <div className="card" style={{padding:22,marginBottom:14}}>
            <h3 style={{fontWeight:800,fontSize:15,marginBottom:16}}>🏦 Rekening Bank</h3>
            {BANKS.map(bk=>(
              <div key={bk} style={{marginBottom:16,paddingBottom:16,borderBottom:"1px solid #F1F5F9"}}>
                <p style={{fontWeight:800,fontSize:13,color:"#0F172A",marginBottom:8,textTransform:"uppercase"}}>{bk}</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <Field label="Nomor Rekening">
                    <input className="inp" value={banks[bk]?.number||""} placeholder="Nomor rekening"
                      onChange={e=>setBanks(p=>({...p,[bk]:{...p[bk],number:e.target.value}}))}/>
                  </Field>
                  <Field label="Nama Pemilik">
                    <input className="inp" value={banks[bk]?.name||""} placeholder="Nama a/n"
                      onChange={e=>setBanks(p=>({...p,[bk]:{...p[bk],name:e.target.value}}))}/>
                  </Field>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{padding:22,marginBottom:14}}>
            <h3 style={{fontWeight:800,fontSize:15,marginBottom:16}}>📲 E-Wallet</h3>
            {EWALLETS.map(ew=>(
              <div key={ew} style={{marginBottom:12}}>
                <Field label={ew.charAt(0).toUpperCase()+ew.slice(1)}>
                  <input className="inp" value={ewallets[ew]||""} placeholder="Nomor e-wallet"
                    onChange={e=>setEwallets(p=>({...p,[ew]:e.target.value}))}/>
                </Field>
              </div>
            ))}
          </div>

          <button onClick={saveBanks} disabled={saving} className="btn btn-primary btn-block">
            {saving?"Menyimpan...":"💾 Simpan Semua Info Pembayaran"}
          </button>
        </div>
      )}

      {/* ── TAB Info Toko ── */}
      {tab==="info" && (
        <div className="card" style={{padding:22}}>
          <h3 style={{fontWeight:800,fontSize:15,marginBottom:16}}>🏪 Informasi Toko</h3>
          <Field label="Nama Toko"><input className="inp" value={storeName} onChange={e=>setStoreName(e.target.value)}/></Field>
          <Field label="Alamat Toko"><textarea className="inp" rows={2} value={storeAddr} onChange={e=>setStoreAddr(e.target.value)} style={{resize:"none"}}/></Field>
          <Field label="Jam Operasional"><input className="inp" value={storeHours} onChange={e=>setStoreHours(e.target.value)}/></Field>
          <button onClick={saveInfo} disabled={saving} className="btn btn-primary">
            {saving?"Menyimpan...":"💾 Simpan Info Toko"}
          </button>

          <div style={{marginTop:24,paddingTop:20,borderTop:"1px solid #F1F5F9"}}>
            <h3 style={{fontWeight:800,fontSize:15,marginBottom:15}}>👤 Profil Akun</h3>
            <div style={{display:"flex",alignItems:"center",gap:13}}>
              <div style={{width:46,height:46,borderRadius:13,background:"#2563EB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:"#fff"}}>{user.avatar}</div>
              <div>
                <p style={{fontWeight:800,fontSize:15}}>{user.name}</p>
                <span className={`badge ${user.role==="owner"?"b-amber":"b-indigo"}`}>{user.role==="owner"?"👑 Owner":"🧑 Staff"}</span>
                <p style={{fontSize:12,color:"#94A3B8",marginTop:3}}>@{user.username}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════ CATEGORY MANAGEMENT (embedded in ProductsMgmt) ══════ */
function CatMgmt({ categories, setCategories, toast }) {
  const [newCat,  setNewCat]  = useState("");
  const [newIcon, setNewIcon] = useState("📦");
  const [saving,  setSaving]  = useState(false);
  const [open,    setOpen]    = useState(false);
  const ICONS = ["📦","🥤","🍿","🍜","🧴","🍎","🧃","🍕","🧹","💊","🛁","🧺","🥛","🍞","🍫","🧊"];

  const add = async ()=>{
    if(!newCat.trim()){ toast.add("Nama kategori wajib diisi","err"); return; }
    if(categories.includes(newCat.trim())){ toast.add("Kategori sudah ada","err"); return; }
    setSaving(true);
    try{
      await saveCategory(newCat.trim(), newIcon);
      setCategories(p=>[...p, newCat.trim()]);
      toast.add(`Kategori "${newCat.trim()}" ditambahkan ✅`);
      setNewCat(""); setNewIcon("📦");
    }catch(e){ toast.add("Gagal: "+e.message,"err"); }
    setSaving(false);
  };

  const del = async (name)=>{
    try{
      await deleteCategory(name);
      setCategories(p=>p.filter(c=>c!==name));
      toast.add(`Kategori "${name}" dihapus`,"err");
    }catch(e){ toast.add("Gagal hapus: "+e.message,"err"); }
  };

  const DEFAULT_CATS = ["Minuman","Snack","Makanan Instan","Kebutuhan Harian"];

  return(
    <div className="card" style={{padding:18,marginTop:14}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:open?14:0}}>
        <div>
          <h3 style={{fontWeight:800,fontSize:14}}>🏷️ Kelola Kategori</h3>
          <p style={{fontSize:12,color:"#94A3B8"}}>{categories.length} kategori tersedia</p>
        </div>
        <button onClick={()=>setOpen(p=>!p)} className="btn btn-secondary btn-sm">{open?"Tutup":"Kelola"}</button>
      </div>
      {open&&(
        <div>
          {/* Daftar kategori */}
          <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>
            {categories.map(c=>(
              <div key={c} style={{display:"flex",alignItems:"center",gap:5,background:"#EFF6FF",borderRadius:99,padding:"5px 12px",fontSize:13,fontWeight:700,color:"#1D4ED8"}}>
                {c}
                {!DEFAULT_CATS.includes(c)&&(
                  <button onClick={()=>del(c)} style={{background:"none",border:"none",cursor:"pointer",color:"#EF4444",fontSize:14,lineHeight:1,padding:0,marginLeft:3}}>×</button>
                )}
              </div>
            ))}
          </div>
          {/* Tambah kategori baru */}
          <p style={{fontSize:12,fontWeight:800,color:"#64748B",marginBottom:8}}>TAMBAH KATEGORI BARU</p>
          <div style={{display:"flex",gap:8,alignItems:"flex-start",flexWrap:"wrap"}}>
            <input className="inp" value={newCat} onChange={e=>setNewCat(e.target.value)}
              placeholder="Nama kategori baru" style={{flex:1,minWidth:160}}
              onKeyDown={e=>e.key==="Enter"&&add()}/>
            <button onClick={add} disabled={saving||!newCat.trim()} className="btn btn-primary btn-sm">
              {saving?"...":"+ Tambah"}
            </button>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:10}}>
            {ICONS.map(ic=>(
              <button key={ic} onClick={()=>setNewIcon(ic)}
                style={{width:34,height:34,borderRadius:8,border:`2px solid ${newIcon===ic?"#2563EB":"transparent"}`,background:newIcon===ic?"#EFF6FF":"#F8FAFC",cursor:"pointer",fontSize:16}}>
                {ic}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════ STAFF MANAGEMENT ══════ */
function StaffMgmt({ currentUser, toast }) {
  const [staffList, setStaffList] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [editS,     setEditS]     = useState(null);
  const [delId,     setDelId]     = useState(null);
  const [form,      setForm]      = useState({name:"",username:"",password:"",role:"staff",phone:""});
  const [saving,    setSaving]    = useState(false);
  const [myProfile, setMyProfile] = useState(false);
  const [profForm,  setProfForm]  = useState({name:"",phone:"",password:""});

  useEffect(()=>{
    async function load(){
      try{
        const list = await fetchStaff();
        setStaffList(list);
      }catch(e){ toast.add("Gagal load staff","err"); }
      finally{ setLoading(false); }
    }
    load();
    const ch = subscribeStaff(()=>fetchStaff().then(setStaffList).catch(console.error));
    return ()=>ch.unsubscribe();
  },[]);

  const openAdd  = ()=>{ setEditS(null); setForm({name:"",username:"",password:"",role:"staff",phone:""}); setModal(true); };
  const openEdit = s =>{ setEditS(s); setForm({name:s.name,username:s.username,password:s.password,role:s.role,phone:s.phone||""}); setModal(true); };

  const save = async ()=>{
    if(!form.name||!form.username||!form.password){ toast.add("Nama, username, dan password wajib diisi","err"); return; }
    setSaving(true);
    try{
      await saveStaff(editS?{...form,id:editS.id}:{...form,is_active:true});
      toast.add(editS?"Akun berhasil diperbarui ✅":"Akun berhasil ditambahkan ✅");
      setModal(false);
    }catch(e){ toast.add("Gagal: "+e.message,"err"); }
    setSaving(false);
  };

  const del = async ()=>{
    try{
      await deleteStaff(delId);
      toast.add("Akun dihapus","err");
    }catch(e){ toast.add("Gagal hapus","err"); }
    setDelId(null);
  };

  const toggleActive = async (s)=>{
    try{
      await saveStaff({...s, is_active:!s.is_active});
      toast.add(s.is_active?"Akun dinonaktifkan":"Akun diaktifkan kembali");
    }catch(e){ toast.add("Gagal","err"); }
  };

  const saveProfile = async ()=>{
    if(!profForm.name){ toast.add("Nama wajib diisi","err"); return; }
    setSaving(true);
    try{
      const upd = {id:currentUser.id, name:profForm.name, phone:profForm.phone,
        password: profForm.password||currentUser.password,
        username:currentUser.username, role:currentUser.role};
      await saveStaff(upd);
      toast.add("Profil berhasil diperbarui ✅");
      setMyProfile(false);
    }catch(e){ toast.add("Gagal: "+e.message,"err"); }
    setSaving(false);
  };

  const active = staffList.filter(s=>s.is_active);

  return(
    <div style={{padding:"20px 18px 60px",maxWidth:700}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <div>
          <h2 style={{fontWeight:900,fontSize:19}}>👥 Manajemen Staff</h2>
          <p style={{color:"#64748B",fontSize:13}}>{active.length} akun aktif dari {staffList.length} total</p>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>{setProfForm({name:currentUser.name,phone:currentUser.phone||"",password:""});setMyProfile(true);}} className="btn btn-secondary">✏️ Edit Profilku</button>
          {currentUser.role==="owner" && <button onClick={openAdd} className="btn btn-primary">+ Tambah Akun</button>}
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
        {[
          {icon:"👑",label:"Owner",val:staffList.filter(s=>s.role==="owner").length,color:"#F59E0B",bg:"#FEF3C7"},
          {icon:"🧑",label:"Staff Aktif",val:active.filter(s=>s.role==="staff").length,color:"#2563EB",bg:"#EFF6FF"},
          {icon:"⛔",label:"Nonaktif",val:staffList.filter(s=>!s.is_active).length,color:"#EF4444",bg:"#FEF2F2"},
        ].map(s=>(
          <div key={s.label} style={{background:s.bg,borderRadius:12,padding:"14px",textAlign:"center"}}>
            <p style={{fontSize:22}}>{s.icon}</p>
            <p style={{fontWeight:900,fontSize:20,color:s.color}}>{s.val}</p>
            <p style={{fontSize:11,color:"#64748B",fontWeight:700}}>{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? <div style={{textAlign:"center",padding:40}}><Spinner size={28}/></div> : (
        <div className="card" style={{overflow:"hidden"}}>
          {staffList.map((s,i)=>(
            <div key={s.id} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderBottom:i<staffList.length-1?"1px solid #F1F5F9":"none",opacity:s.is_active?1:0.5}}>
              <div style={{width:42,height:42,borderRadius:12,background:s.role==="owner"?"#F59E0B":"#2563EB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:900,color:"#fff",flexShrink:0}}>
                {(s.name||"?").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase()}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <p style={{fontWeight:800,fontSize:14}}>{s.name}</p>
                  <span className={`badge ${s.role==="owner"?"b-amber":"b-indigo"}`}>{s.role==="owner"?"👑 Owner":"🧑 Staff"}</span>
                  {!s.is_active && <span className="badge b-red">Nonaktif</span>}
                </div>
                <p style={{fontSize:12,color:"#94A3B8"}}>@{s.username} {s.phone?`· ${s.phone}`:""}</p>
              </div>
              {currentUser.role==="owner" && s.id!==currentUser.id && (
                <div style={{display:"flex",gap:6,flexShrink:0}}>
                  <button onClick={()=>toggleActive(s)} className="btn btn-sm" style={{background:s.is_active?"#FEF2F2":"#ECFDF5",color:s.is_active?"#EF4444":"#059669",border:"none",cursor:"pointer",fontWeight:800}}>
                    {s.is_active?"Nonaktifkan":"Aktifkan"}
                  </button>
                  <button onClick={()=>openEdit(s)} className="btn btn-secondary btn-sm">Edit</button>
                  <button onClick={()=>setDelId(s.id)} className="btn btn-danger btn-sm">Hapus</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah/Edit Akun */}
      <Modal open={modal} onClose={()=>setModal(false)} title={editS?"Edit Akun Staff":"Tambah Akun Baru"}
        footer={<><button className="btn btn-ghost btn-sm" onClick={()=>setModal(false)}>Batal</button><button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving?"Menyimpan...":"💾 Simpan"}</button></>}>
        <Field label="Nama Lengkap"><input className="inp" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Nama lengkap"/></Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
          <Field label="Username"><input className="inp" value={form.username} onChange={e=>setForm(p=>({...p,username:e.target.value}))} placeholder="username"/></Field>
          <Field label="Password"><input className="inp" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} placeholder="password"/></Field>
        </div>
        <Field label="No. HP (opsional)"><input className="inp" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="08xxx"/></Field>
        {currentUser.role==="owner" && (
          <Field label="Role">
            <select className="inp" value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))}>
              <option value="staff">🧑 Staff</option>
              <option value="owner">👑 Owner</option>
            </select>
          </Field>
        )}
      </Modal>

      {/* Modal Edit Profil Sendiri */}
      <Modal open={myProfile} onClose={()=>setMyProfile(false)} title="✏️ Edit Profil Saya"
        footer={<><button className="btn btn-ghost btn-sm" onClick={()=>setMyProfile(false)}>Batal</button><button className="btn btn-primary btn-sm" onClick={saveProfile} disabled={saving}>{saving?"Menyimpan...":"💾 Simpan"}</button></>}>
        <Field label="Nama Lengkap"><input className="inp" value={profForm.name} onChange={e=>setProfForm(p=>({...p,name:e.target.value}))}/></Field>
        <Field label="No. HP"><input className="inp" value={profForm.phone} onChange={e=>setProfForm(p=>({...p,phone:e.target.value}))} placeholder="08xxx"/></Field>
        <Field label="Password Baru (kosongkan jika tidak ingin ganti)"><input className="inp" type="password" value={profForm.password} onChange={e=>setProfForm(p=>({...p,password:e.target.value}))} placeholder="Password baru..."/></Field>
      </Modal>

      <Confirm open={!!delId} onClose={()=>setDelId(null)} onOk={del} danger title="Hapus Akun" msg="Yakin ingin menghapus akun ini? Akun tidak bisa dipulihkan."/>
    </div>
  );
}

/* ══════ ADMIN APP (entry) ══════ */
export function AdminApp({ user, onLogout, products, setProducts, dbError }) {
  const [menu,       setMenu]       = useState("dashboard");
  const [sOpen,      setSOpen]      = useState(false);
  const [orders,     setOrders]     = useState([]);
  const [categories, setCategories] = useState(["Minuman","Snack","Makanan Instan","Kebutuhan Harian"]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const toast = useToast();

  const titles = {dashboard:"📊 Dashboard",products:"📦 Manajemen Produk",orders:"🧾 Manajemen Pesanan",staff:"👥 Staff & Akun",settings:"⚙️ Pengaturan"};

  useEffect(()=>{
    let cleanup=()=>{};
    async function load(){
      try{
        const [data, cats] = await Promise.all([fetchOrders(), fetchCategories()]);
        setOrders(data||[]);
        if(cats.length) setCategories(cats);
        setLoadingOrders(false);
        const ch = subscribeOrders(
          (n)=>{ setOrders(prev=>{ if(prev.find(o=>o.order_id===n.order_id)) return prev; toast.add("🔔 Pesanan baru dari "+n.customer_name+"!","info"); return [n,...prev]; }); },
          (u)=>setOrders(prev=>prev.map(o=>o.order_id===u.order_id?u:o))
        );
        const catCh = subscribeCategories(()=>fetchCategories().then(c=>{if(c.length)setCategories(c);}).catch(console.error));
        cleanup=()=>{ ch.unsubscribe(); catCh.unsubscribe(); };
      }catch(e){
        console.error("Admin load error:",e);
        setLoadingOrders(false);
        toast.add("Gagal memuat data","err");
      }
    }
    load();
    return ()=>cleanup();
  },[]);

  return(
    <div className="admin-layout">
      <ToastBox list={toast.list} remove={toast.remove}/>
      <Sidebar active={menu} setActive={setMenu} user={user} onLogout={onLogout} open={sOpen} onClose={()=>setSOpen(false)}/>
      <div className="admin-main">
        <Topbar title={titles[menu]||"Dashboard"} onMenu={()=>setSOpen(p=>!p)} user={user}/>
        <div style={{background:"#F0F4FF",minHeight:"calc(100vh - 56px)"}}>
          {!dbError&&(
            <div style={{background:"#D1FAE5",borderBottom:"1px solid #6EE7B7",padding:"6px 18px",fontSize:12,fontWeight:700,color:"#065F46",display:"flex",alignItems:"center",gap:6}}>
              <span style={{width:7,height:7,borderRadius:"50%",background:"#10B981",display:"inline-block"}}/>
              Terhubung — Semua data real-time dari Supabase
            </div>
          )}
          {loadingOrders
            ?<div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:60,gap:14,flexDirection:"column"}}><Spinner size={36}/><p style={{fontWeight:700,color:"#64748B"}}>Memuat data...</p></div>
            :<>
              {menu==="dashboard" && <Dashboard products={products} orders={orders}/>}
              {menu==="products"  && <ProductsMgmt products={products} setProducts={setProducts} toast={toast} categories={categories} setCategories={setCategories}/>}
              {menu==="orders"    && <OrdersMgmt orders={orders} setOrders={setOrders} toast={toast}/>}
              {menu==="staff"     && <StaffMgmt currentUser={user} toast={toast}/>}
              {menu==="settings"  && <Settings user={user} toast={toast}/>}
            </>
          }
        </div>
      </div>
    </div>
  );
}