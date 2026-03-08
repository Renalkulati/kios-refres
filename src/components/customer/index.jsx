import { useState, useEffect } from "react";
import { fmt, genCode, genId, now } from "../../utils/index.js";
import { CATEGORIES, CAT_ICON, ONGKIR } from "../../data/index.js";
import { Skel, Stars, Empty, Field, Spinner, StatusBadge } from "../ui/index.jsx";

/* ══════ SPLASH ══════ */
export function Splash({ onDone }) {
  const [p, setP] = useState(0);
  const [out, setOut] = useState(false);
  useEffect(() => {
    const iv = setInterval(() => setP(v => { if(v>=100){clearInterval(iv);return 100;} return v+2.2; }), 32);
    const t = setTimeout(() => { setOut(true); setTimeout(onDone,520); }, 2600);
    return () => { clearInterval(iv); clearTimeout(t); };
  }, []);
  return (
    <div style={{position:"fixed",inset:0,zIndex:9999,background:"linear-gradient(145deg,#1E3A8A,#1D4ED8 45%,#2563EB 70%,#6366F1)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",transition:"opacity .52s ease",opacity:out?0:1}}>
      <div style={{position:"absolute",width:280,height:280,background:"rgba(255,255,255,0.06)",borderRadius:"50%",top:-80,right:-60}} />
      <div style={{position:"absolute",width:180,height:180,background:"rgba(245,158,11,0.13)",borderRadius:"50%",bottom:-40,left:-40}} />
      <div style={{animation:"splashIn .65s cubic-bezier(.34,1.56,.64,1)",textAlign:"center",position:"relative"}}>
        <div className="anim-float" style={{width:96,height:96,background:"#fff",borderRadius:28,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 22px",boxShadow:"0 20px 60px rgba(0,0,0,0.2)",fontSize:50}}>🛒</div>
        <h1 style={{color:"#fff",fontSize:34,fontWeight:900,letterSpacing:"-1px",lineHeight:1}}>KIOS REFRES</h1>
        <p style={{color:"rgba(255,255,255,0.68)",fontSize:14,marginTop:9,fontWeight:500}}>Belanja Mudah · Harga Bersahabat</p>
        <div style={{marginTop:34,width:210,margin:"34px auto 0"}}>
          <div className="prog-bar">
            <div className="prog-fill" style={{width:`${p}%`,background:"linear-gradient(90deg,#FCD34D,#F59E0B)",boxShadow:"0 0 8px rgba(245,158,11,0.5)"}} />
          </div>
          <p style={{color:"rgba(255,255,255,0.4)",fontSize:12,marginTop:9,fontWeight:600}}>Memuat {Math.round(p)}%</p>
        </div>
      </div>
    </div>
  );
}

/* ══════ NAVBAR ══════ */
export function Navbar({ cartCount, page, setPage, q, setQ, customer, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 6);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <nav className={`navbar ${scrolled?"scrolled":""}`}>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"0 16px",display:"flex",alignItems:"center",gap:10,height:58}}>
        <button onClick={() => { setPage("home"); setQ(""); }} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:9,flexShrink:0}}>
          <div className="glass" style={{width:36,height:36,borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🛒</div>
          <span style={{color:"#fff",fontWeight:900,fontSize:15,letterSpacing:"-0.3px",whiteSpace:"nowrap"}}>KIOS REFRES</span>
        </button>
        <div style={{flex:1,position:"relative"}}>
          <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",fontSize:14,pointerEvents:"none",opacity:.6}}>🔍</span>
          <input className="nav-search" value={q} onChange={e=>{setQ(e.target.value);if(page!=="home")setPage("home");}} placeholder="Cari produk..." />
        </div>
        <button onClick={()=>setPage("orders")} style={{background:"rgba(255,255,255,0.14)",border:"1px solid rgba(255,255,255,0.2)",cursor:"pointer",borderRadius:10,padding:"7px 12px",color:"#fff",fontSize:12,fontWeight:800,whiteSpace:"nowrap",flexShrink:0}} className="hide-mobile">
          📦 Pesanan
        </button>
        <button onClick={()=>setPage("cart")} className="btn btn-amber" style={{flexShrink:0,padding:"7px 14px",fontSize:13,position:"relative"}}>
          🛒
          {cartCount>0 && <span style={{background:"#EF4444",color:"#fff",borderRadius:99,minWidth:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,padding:"0 4px",animation:"pop .3s ease"}}>{cartCount}</span>}
        </button>
        {customer && (
          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            <div style={{width:30,height:30,borderRadius:"50%",background:"rgba(255,255,255,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,color:"#fff",border:"1.5px solid rgba(255,255,255,0.4)"}}>
              {customer.username[0].toUpperCase()}
            </div>
            <button onClick={onLogout} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:8,padding:"4px 9px",cursor:"pointer",color:"rgba(255,255,255,0.85)",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>Keluar</button>
          </div>
        )}
      </div>
    </nav>
  );
}

/* ══════ PRODUCT CARD ══════ */
function ProductCard({ p, onDetail, onAdd }) {
  const [loaded, setLoaded] = useState(false);
  const [added,  setAdded]  = useState(false);
  const doAdd = e => { e.stopPropagation(); onAdd(p); setAdded(true); setTimeout(()=>setAdded(false),1400); };
  return (
    <div onClick={()=>onDetail(p)} className="card card-hover anim-fadeUp" style={{overflow:"hidden"}}>
      <div style={{position:"relative",paddingTop:"84%",background:"#F0F4FF",overflow:"hidden"}}>
        {!loaded && <Skel w="100%" h="100%" r={0} />}
        <img src={p.img} alt={p.name} loading="lazy" onLoad={()=>setLoaded(true)}
          style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:loaded?1:0,transition:"opacity .3s"}} />
        <span className="badge b-blue" style={{position:"absolute",top:8,left:8,fontSize:10,backdropFilter:"blur(6px)"}}>{CAT_ICON[p.cat]}</span>
        {p.stock<10&&p.stock>0 && <span className="badge b-amber" style={{position:"absolute",top:8,right:8,fontSize:10}}>⚡ Terbatas</span>}
        {p.stock===0 && <div style={{position:"absolute",inset:0,background:"rgba(255,255,255,0.72)",display:"flex",alignItems:"center",justifyContent:"center"}}><span className="badge b-gray">Habis</span></div>}
      </div>
      <div style={{padding:"12px 12px 13px"}}>
        <p style={{fontSize:13,fontWeight:700,lineHeight:1.35,marginBottom:3,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{p.name}</p>
        <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:7}}>
          <Stars val={p.rating} />
          <span style={{fontSize:11,color:"#94A3B8",fontWeight:600}}>({p.sold})</span>
        </div>
        <p style={{fontSize:15,fontWeight:900,color:"#2563EB",marginBottom:10}}>{fmt(p.price)}</p>
        <button onClick={doAdd} disabled={p.stock===0} className="btn btn-block" style={{padding:"8px 0",borderRadius:10,fontSize:12,background:added?"#10B981":p.stock===0?"#F1F5F9":"#FEF3C7",color:added?"#fff":p.stock===0?"#94A3B8":"#0F172A",cursor:p.stock===0?"not-allowed":"pointer",transition:"all .2s"}}>
          {added?"✓ Ditambahkan":p.stock===0?"Stok Habis":"+ Keranjang"}
        </button>
      </div>
    </div>
  );
}

/* ══════ HOME PAGE ══════ */
export function Home({ products, onDetail, onAdd, q }) {
  const [cat, setCat] = useState("Semua");
  const [pg,  setPg]  = useState(1);
  const PER = 10;

  const filtered = products.filter(p => (cat==="Semua"||p.cat===cat) && p.name.toLowerCase().includes(q.toLowerCase()));
  const pages = Math.ceil(filtered.length/PER);
  const shown  = filtered.slice((pg-1)*PER, pg*PER);
  const top4   = [...products].sort((a,b)=>b.sold-a.sold).slice(0,4);

  useEffect(()=>setPg(1),[cat,q]);

  return (
    <div className="pw">
      {/* Hero */}
      <div className="hero-grad anim-fadeIn" style={{borderRadius:22,padding:"30px 24px",marginBottom:22,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-50,top:-50,width:220,height:220,background:"rgba(255,255,255,0.06)",borderRadius:"50%"}} />
        <div style={{position:"absolute",right:70,bottom:-70,width:170,height:170,background:"rgba(245,158,11,0.12)",borderRadius:"50%"}} />
        <div style={{position:"relative"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(245,158,11,0.2)",borderRadius:99,padding:"4px 13px",marginBottom:11}}>
            <span style={{fontSize:12}}>✨</span>
            <span style={{color:"#FCD34D",fontSize:12,fontWeight:800}}>Belanja Hemat Setiap Hari</span>
          </div>
          <h1 style={{color:"#fff",fontSize:"clamp(20px,4vw,32px)",fontWeight:900,letterSpacing:"-0.5px",lineHeight:1.18,marginBottom:10}}>
            Selamat Datang di<br/><span style={{color:"#FCD34D"}}>KIOS REFRES</span> 🛒
          </h1>
          <p style={{color:"rgba(255,255,255,0.72)",fontSize:"clamp(12px,2vw,14px)",marginBottom:16,lineHeight:1.65}}>
            Semua kebutuhan harian tersedia lengkap.<br/>Pesan sekarang, antar ke rumah atau ambil di toko!
          </p>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            {["🚚 Antar Rumah","🏪 Ambil Toko","💳 Bayar Online","⚡ Proses Cepat"].map(t=>(
              <span key={t} className="glass" style={{color:"#fff",padding:"5px 12px",borderRadius:99,fontSize:12,fontWeight:700}}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Top Sellers */}
      {!q && cat==="Semua" && (
        <div style={{marginBottom:26}}>
          <h2 style={{fontWeight:900,fontSize:16,marginBottom:13}}>🔥 Produk Terlaris</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:11}}>
            {top4.map((p,i)=>(
              <div key={p.id} onClick={()=>onDetail(p)} className="card card-hover anim-fadeUp" style={{padding:11,animationDelay:`${i*.06}s`}}>
                <img src={p.img} alt={p.name} style={{width:"100%",aspectRatio:"1",objectFit:"cover",borderRadius:11,marginBottom:8}} />
                <p style={{fontSize:12,fontWeight:800,lineHeight:1.3,marginBottom:3}}>{p.name}</p>
                <p style={{fontSize:13,fontWeight:900,color:"#2563EB"}}>{fmt(p.price)}</p>
                <div style={{display:"flex",alignItems:"center",gap:3,marginTop:3}}>
                  <span style={{fontSize:10}}>⭐</span>
                  <span style={{fontSize:10,color:"#94A3B8",fontWeight:600}}>{p.rating} · {p.sold} terjual</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Chips */}
      <div className="noscroll" style={{display:"flex",gap:7,overflowX:"auto",marginBottom:14,paddingBottom:2}}>
        {CATEGORIES.map(c=>(
          <button key={c} onClick={()=>setCat(c)} className="btn btn-sm" style={{flexShrink:0,borderRadius:99,background:cat===c?"#2563EB":"#fff",color:cat===c?"#fff":"#64748B",border:`1.5px solid ${cat===c?"#2563EB":"#E2E8F4"}`,boxShadow:cat===c?"0 4px 12px rgba(37,99,235,0.25)":"none"}}>
            {CAT_ICON[c]} {c}
          </button>
        ))}
      </div>

      <p style={{fontSize:13,color:"#64748B",marginBottom:13,fontWeight:600}}>{filtered.length} produk {q&&`untuk "${q}"`}</p>

      {shown.length===0
        ? <Empty icon="🔍" title="Produk tidak ditemukan" desc="Coba kata kunci lain atau ubah kategori" />
        : <div className="product-grid">{shown.map((p,i)=><div key={p.id} style={{animationDelay:`${i*.04}s`}}><ProductCard p={p} onDetail={onDetail} onAdd={onAdd}/></div>)}</div>
      }

      {/* Pagination */}
      {pages>1 && (
        <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:28}}>
          <button onClick={()=>setPg(p=>Math.max(1,p-1))} disabled={pg===1} className="btn btn-ghost btn-sm" style={{opacity:pg===1?.4:1}}>← Prev</button>
          {Array.from({length:pages},(_,i)=>(
            <button key={i} onClick={()=>setPg(i+1)} className="btn btn-sm" style={{minWidth:34,background:pg===i+1?"#2563EB":"#fff",color:pg===i+1?"#fff":"#64748B",border:`1.5px solid ${pg===i+1?"#2563EB":"#E2E8F4"}`}}>{i+1}</button>
          ))}
          <button onClick={()=>setPg(p=>Math.min(pages,p+1))} disabled={pg===pages} className="btn btn-ghost btn-sm" style={{opacity:pg===pages?.4:1}}>Next →</button>
        </div>
      )}
    </div>
  );
}

/* ══════ DETAIL PAGE ══════ */
export function Detail({ p, onBack, onAdd, onBuy }) {
  const [qty,  setQty]   = useState(1);
  const [ok,   setOk]    = useState(false);
  const [load, setLoad]  = useState(false);
  return (
    <div style={{maxWidth:860,margin:"0 auto",padding:"18px 16px 90px"}} className="anim-fadeIn">
      <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:"#2563EB",fontWeight:800,fontSize:13,display:"flex",alignItems:"center",gap:5,marginBottom:16}}>← Kembali belanja</button>
      <div className="card detail-grid" style={{overflow:"hidden"}}>
        <div style={{background:"#F0F4FF",position:"relative",minHeight:300}}>
          {!load && <Skel w="100%" h="100%" r={0}/>}
          <img src={p.img} alt={p.name} onLoad={()=>setLoad(true)} style={{width:"100%",height:"100%",objectFit:"cover",minHeight:300,display:"block",opacity:load?1:0,transition:"opacity .3s"}}/>
          <span className="badge b-blue" style={{position:"absolute",top:12,left:12,backdropFilter:"blur(6px)"}}>{CAT_ICON[p.cat]} {p.cat}</span>
        </div>
        <div style={{padding:"24px 22px",display:"flex",flexDirection:"column",gap:13}}>
          <h2 style={{fontWeight:900,fontSize:"clamp(17px,2.5vw,23px)",lineHeight:1.3}}>{p.name}</h2>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <Stars val={p.rating}/>
            <span style={{fontSize:13,color:"#64748B",fontWeight:600}}>{p.rating} · {p.sold} terjual</span>
          </div>
          <p style={{fontSize:27,fontWeight:900,color:"#2563EB"}}>{fmt(p.price)}</p>
          <p style={{fontSize:14,color:"#64748B",lineHeight:1.75}}>{p.desc}</p>
          <div style={{display:"flex",gap:8}}>
            <span className={`badge ${p.stock>10?"b-green":p.stock>0?"b-amber":"b-red"}`}>
              {p.stock>0?`📦 Stok: ${p.stock}`:"❌ Habis"}
            </span>
          </div>
          {p.stock>0 && <>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:13,fontWeight:700,color:"#64748B"}}>Jumlah:</span>
              <div className="qty-wrap">
                <button className="qty-btn" onClick={()=>setQty(q=>Math.max(1,q-1))}>−</button>
                <span className="qty-val">{qty}</span>
                <button className="qty-btn" onClick={()=>setQty(q=>Math.min(p.stock,q+1))}>+</button>
              </div>
            </div>
            <div style={{background:"#F0F4FF",borderRadius:12,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:13,color:"#64748B",fontWeight:600}}>Subtotal</span>
              <span style={{fontSize:18,fontWeight:900,color:"#2563EB"}}>{fmt(p.price*qty)}</span>
            </div>
            <div style={{display:"flex",gap:9}}>
              <button onClick={()=>{onAdd(p,qty);setOk(true);setTimeout(()=>setOk(false),1400);}} className={`btn ${ok?"btn-green":"btn-secondary"}`} style={{flex:1}}>
                {ok?"✓ Ditambahkan":"🛒 Keranjang"}
              </button>
              <button onClick={()=>onBuy(p,qty)} className="btn btn-primary" style={{flex:1}}>⚡ Beli Sekarang</button>
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}

/* ══════ CART PAGE ══════ */
export function Cart({ cart, onQty, onRemove, onCheckout, onBack }) {
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  if(!cart.length) return (
    <div className="pw"><Empty icon="🛒" title="Keranjang masih kosong" desc="Yuk, pilih produk favorit Anda!" action={<button className="btn btn-primary" onClick={onBack}>Mulai Belanja</button>}/></div>
  );
  return (
    <div style={{maxWidth:680,margin:"0 auto",padding:"20px 16px 90px"}}>
      <h2 style={{fontWeight:900,marginBottom:18,fontSize:18}}>🛒 Keranjang Belanja</h2>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:18}}>
        {cart.map(item=>(
          <div key={item.id} className="card anim-fadeUp" style={{padding:14,display:"flex",gap:12,alignItems:"center"}}>
            <img src={item.img} alt={item.name} style={{width:66,height:66,objectFit:"cover",borderRadius:12,flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontWeight:800,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{item.name}</p>
              <p style={{fontWeight:900,color:"#2563EB",fontSize:14,marginBottom:8}}>{fmt(item.price)}</p>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div className="qty-wrap">
                  <button className="qty-btn" style={{width:28,height:28}} onClick={()=>onQty(item.id,item.qty-1)}>−</button>
                  <span className="qty-val" style={{width:32,fontSize:13}}>{item.qty}</span>
                  <button className="qty-btn" style={{width:28,height:28}} onClick={()=>onQty(item.id,item.qty+1)}>+</button>
                </div>
                <button className="btn btn-danger btn-sm" onClick={()=>onRemove(item.id)}>Hapus</button>
              </div>
            </div>
            <p style={{fontWeight:900,color:"#2563EB",fontSize:14,flexShrink:0,whiteSpace:"nowrap"}}>{fmt(item.price*item.qty)}</p>
          </div>
        ))}
      </div>
      <div className="card" style={{padding:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:14,marginBottom:14,borderBottom:"1px solid #F1F5F9"}}>
          <span style={{color:"#64748B",fontWeight:600,fontSize:14}}>Total ({cart.reduce((s,i)=>s+i.qty,0)} item)</span>
          <span style={{fontWeight:900,fontSize:22,color:"#2563EB"}}>{fmt(total)}</span>
        </div>
        <button onClick={onCheckout} className="btn btn-primary btn-block btn-lg">Lanjut ke Checkout →</button>
      </div>
    </div>
  );
}

/* ══════ CHECKOUT PAGE ══════ */
export function Checkout({ cart, onBack, onSuccess, customer }) {
  const [step,      setStep]     = useState(1);
  const [meth,      setMeth]     = useState("");
  const [form,      setForm]     = useState({name: customer?.username||"", phone: customer?.phone||"", address:"", city:""});
  const [payGroup,  setPayGroup] = useState("");   // transfer | ewallet | qris | card
  const [payDetail, setPayDetail]= useState("");   // bank/wallet spesifik
  const [errs,      setErrs]     = useState({});
  const [busy,      setBusy]     = useState(false);
  const [qrisDone,  setQrisDone] = useState(false);
  const [qrisTimer, setQrisTimer]= useState(300); // 5 menit countdown

  const sub    = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const ongkir = meth==="delivery"?(ONGKIR[form.city]||ONGKIR.Lainnya):0;
  const total  = sub+ongkir;

  // Data bank & e-wallet
  const BANKS = [
    {id:"bca",    logo:"🏦", name:"BCA",     norek:"1234567890",   an:"Budi Santoso - KIOS REFRES"},
    {id:"mandiri",logo:"🏦", name:"Mandiri", norek:"1110009988771",an:"Budi Santoso - KIOS REFRES"},
    {id:"bni",    logo:"🏦", name:"BNI",     norek:"0987654321",   an:"Budi Santoso - KIOS REFRES"},
    {id:"bri",    logo:"🏦", name:"BRI",     norek:"0081234567890",an:"Budi Santoso - KIOS REFRES"},
    {id:"bsi",    logo:"🏦", name:"BSI",     norek:"7112345678",   an:"Budi Santoso - KIOS REFRES"},
  ];
  const EWALLETS = [
    {id:"gopay",     logo:"💚", name:"GoPay",      no:"0812-3456-7890", an:"KIOS REFRES"},
    {id:"ovo",       logo:"💜", name:"OVO",         no:"0812-3456-7890", an:"KIOS REFRES"},
    {id:"dana",      logo:"💙", name:"DANA",        no:"0812-3456-7890", an:"KIOS REFRES"},
    {id:"shopeepay", logo:"🧡", name:"ShopeePay",   no:"0812-3456-7890", an:"KIOS REFRES"},
  ];

  const selectedBank   = BANKS.find(b=>b.id===payDetail);
  const selectedWallet = EWALLETS.find(w=>w.id===payDetail);

  const validate = () => {
    const e={};
    if(!form.name.trim())  e.name="Nama wajib diisi";
    if(!form.phone.trim()) e.phone="No. HP wajib diisi";
    if(meth==="delivery"&&!form.city)           e.city="Pilih kota";
    if(meth==="delivery"&&!form.address.trim()) e.address="Alamat wajib diisi";
    return e;
  };

  const doPayment = () => {
    const e=validate(); if(Object.keys(e).length){setErrs(e);return;}
    if(!payGroup){alert("Pilih metode pembayaran!");return;}
    if((payGroup==="transfer"||payGroup==="ewallet")&&!payDetail){
      alert(payGroup==="transfer"?"Pilih bank tujuan transfer!":"Pilih aplikasi e-wallet!");return;
    }
    setBusy(true);
    const payLabel =
      payGroup==="qris"    ? "QRIS" :
      payGroup==="transfer"? `Transfer ${selectedBank?.name||""}` :
      payGroup==="ewallet" ? selectedWallet?.name||"" :
      "Kartu Debit/Kredit";
    setTimeout(()=>{
      onSuccess({order_id:genId(),customer_name:form.name,phone:form.phone,products:cart,total_price:total,delivery_method:meth,address:meth==="delivery"?`${form.address}, ${form.city}`:"Ambil di Toko",pickup_code:meth==="pickup"?genCode():null,order_status:"diproses",order_date:now(),payment_method:payLabel,pay_detail:payDetail});
    },2400);
  };

  const sf = (k,v) => { setForm(p=>({...p,[k]:v})); setErrs(p=>({...p,[k]:""})); };

  // QRIS countdown
  useState(()=>{
    if(payGroup!=="qris") return;
    const iv=setInterval(()=>setQrisTimer(t=>t>0?t-1:0),1000);
    return ()=>clearInterval(iv);
  });
  const qrisMM = String(Math.floor(qrisTimer/60)).padStart(2,"0");
  const qrisSS = String(qrisTimer%60).padStart(2,"0");

  if(busy) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"80px 20px",gap:18}}>
      <Spinner size={52}/>
      <p style={{fontWeight:900,fontSize:17}}>Memproses Pembayaran...</p>
      <p style={{color:"#64748B",fontSize:13}}>Sedang memverifikasi transaksi Anda</p>
    </div>
  );

  const STEPS=["Pengiriman","Detail","Bayar"];
  return (
    <div style={{maxWidth:640,margin:"0 auto",padding:"20px 16px 90px"}}>
      <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:"#2563EB",fontWeight:800,fontSize:13,marginBottom:16}}>← Kembali</button>
      <h2 style={{fontWeight:900,marginBottom:20,fontSize:18}}>Checkout</h2>

      {/* Step Indicator */}
      <div style={{display:"flex",marginBottom:26}}>
        {STEPS.map((s,i)=>(
          <div key={s} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",position:"relative"}}>
            {i<STEPS.length-1 && <div style={{position:"absolute",left:"50%",top:15,width:"100%",height:2,background:step>i+1?"#2563EB":"#E2E8F4",zIndex:0,transition:"background .3s"}}/>}
            <div style={{width:30,height:30,borderRadius:"50%",background:step>=i+1?"#2563EB":"#E2E8F4",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,zIndex:1,transition:"all .3s",boxShadow:step===i+1?"0 4px 12px rgba(37,99,235,0.4)":"none"}}>
              {step>i+1?"✓":i+1}
            </div>
            <span style={{fontSize:11,fontWeight:700,marginTop:5,color:step===i+1?"#2563EB":"#94A3B8"}}>{s}</span>
          </div>
        ))}
      </div>

      {/* Step 1 — Metode */}
      {step===1 && (
        <div style={{display:"flex",flexDirection:"column",gap:11}}>
          <p style={{fontSize:13,fontWeight:800,color:"#64748B",marginBottom:4}}>Pilih cara mendapatkan barang:</p>
          {[
            {v:"delivery",icon:"🚚",title:"Antar ke Rumah",desc:"Kami antar ke alamat Anda",tag:"Ongkir mulai Rp 10.000",tc:"b-blue"},
            {v:"pickup",  icon:"🏪",title:"Ambil di Toko", desc:"Ambil sendiri di KIOS REFRES",tag:"📍 Jl. Raya Contoh No.88 · 07.00–21.00 WIB",tc:"b-green"},
          ].map(opt=>(
            <div key={opt.v} onClick={()=>setMeth(opt.v)} style={{padding:17,borderRadius:17,border:`2px solid ${meth===opt.v?"#2563EB":"#E2E8F4"}`,background:meth===opt.v?"#EFF6FF":"#fff",cursor:"pointer",display:"flex",gap:13,alignItems:"flex-start",transition:"all .18s"}}>
              <div style={{width:46,height:46,background:meth===opt.v?"#DBEAFE":"#F0F4FF",borderRadius:13,display:"flex",alignItems:"center",justifyContent:"center",fontSize:23,flexShrink:0}}>{opt.icon}</div>
              <div style={{flex:1}}>
                <p style={{fontWeight:800,fontSize:14,marginBottom:3}}>{opt.title}</p>
                <p style={{fontSize:12,color:"#64748B",marginBottom:7}}>{opt.desc}</p>
                <span className={`badge ${opt.tc}`} style={{fontSize:11}}>{opt.tag}</span>
              </div>
              {meth===opt.v && <span style={{color:"#2563EB",fontSize:20,fontWeight:900}}>✓</span>}
            </div>
          ))}
          <button onClick={()=>{if(!meth){alert("Pilih metode dulu!");return;}setStep(2);}} className="btn btn-primary btn-block btn-lg" style={{marginTop:6}}>Lanjut →</button>
        </div>
      )}

      {/* Step 2 — Detail */}
      {step===2 && (
        <div>
          <Field label="Nama Lengkap" err={errs.name}>
            <input className={`inp ${errs.name?"inp-err":""}`} value={form.name} onChange={e=>sf("name",e.target.value)} placeholder="Masukkan nama Anda"/>
          </Field>
          <Field label="Nomor Telepon" err={errs.phone}>
            <input className={`inp ${errs.phone?"inp-err":""}`} type="tel" value={form.phone} onChange={e=>sf("phone",e.target.value)} placeholder="08xxxxxxxxxx"/>
          </Field>
          {meth==="delivery" && <>
            <Field label="Kota / Wilayah" err={errs.city}>
              <select className={`inp ${errs.city?"inp-err":""}`} value={form.city} onChange={e=>sf("city",e.target.value)}>
                <option value="">— Pilih Kota —</option>
                {Object.keys(ONGKIR).map(k=><option key={k} value={k}>{k} · Ongkir {fmt(ONGKIR[k])}</option>)}
              </select>
            </Field>
            <Field label="Alamat Lengkap" err={errs.address}>
              <textarea className={`inp ${errs.address?"inp-err":""}`} rows={3} value={form.address} onChange={e=>sf("address",e.target.value)} placeholder="Jl. Nama Jalan No. XX, RT/RW, Kelurahan, Kecamatan" style={{resize:"none"}}/>
            </Field>
          </>}
          {meth==="pickup" && (
            <div style={{background:"#F0FDF4",borderRadius:13,padding:15,border:"1.5px solid #BBF7D0",marginBottom:14}}>
              <p style={{fontWeight:800,color:"#059669",marginBottom:5,fontSize:14}}>📍 Lokasi Toko KIOS REFRES</p>
              <p style={{fontSize:13,color:"#64748B",lineHeight:1.6}}>Jl. Raya Contoh No. 88, Jakarta Selatan<br/>Buka: Senin–Minggu, 07.00–21.00 WIB</p>
              <p style={{fontSize:12,color:"#94A3B8",marginTop:7}}>Kode unik pengambilan akan diberikan setelah checkout.</p>
            </div>
          )}
          <div style={{display:"flex",gap:9,marginTop:4}}>
            <button onClick={()=>setStep(1)} className="btn btn-ghost" style={{flex:1}}>← Kembali</button>
            <button onClick={()=>{const e=validate();if(Object.keys(e).length){setErrs(e);return;}setStep(3);}} className="btn btn-primary" style={{flex:2}}>Lanjut →</button>
          </div>
        </div>
      )}

      {/* Step 3 — Bayar */}
      {step===3 && (
        <div>
          {/* Ringkasan */}
          <div className="card" style={{padding:17,marginBottom:13}}>
            <p style={{fontWeight:800,marginBottom:11,fontSize:14}}>📋 Ringkasan Pesanan</p>
            {cart.map(i=>(
              <div key={i.id} style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontSize:13,color:"#64748B"}}>{i.name} ×{i.qty}</span>
                <span style={{fontSize:13,fontWeight:700}}>{fmt(i.price*i.qty)}</span>
              </div>
            ))}
            <div className="divider"/>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:13,color:"#64748B"}}>Subtotal</span><span style={{fontSize:13}}>{fmt(sub)}</span>
            </div>
            {meth==="delivery" && (
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:13,color:"#64748B"}}>Ongkir ({form.city})</span><span style={{fontSize:13}}>{fmt(ongkir)}</span>
              </div>
            )}
            <div style={{display:"flex",justifyContent:"space-between",paddingTop:9,borderTop:"1px solid #F1F5F9",marginTop:6}}>
              <span style={{fontWeight:900,fontSize:15}}>Total Pembayaran</span>
              <span style={{fontWeight:900,fontSize:21,color:"#2563EB"}}>{fmt(total)}</span>
            </div>
          </div>

          {/* ── PILIH METODE PEMBAYARAN ── */}
          <div className="card" style={{padding:17,marginBottom:13}}>
            <p style={{fontWeight:800,marginBottom:13,fontSize:14}}>💳 Pilih Metode Pembayaran</p>

            {/* Group tabs */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
              {[
                {v:"qris",    icon:"⬛", label:"QRIS",          sub:"Semua aplikasi"},
                {v:"transfer",icon:"🏦", label:"Transfer Bank", sub:"BCA · Mandiri · BNI · BRI · BSI"},
                {v:"ewallet", icon:"📱", label:"E-Wallet",      sub:"GoPay · OVO · DANA · dll"},
                {v:"card",    icon:"💳", label:"Kartu Kredit",  sub:"Visa · Mastercard"},
              ].map(g=>(
                <div key={g.v} onClick={()=>{setPayGroup(g.v);setPayDetail("");}} style={{
                  padding:"12px 13px",borderRadius:13,
                  border:`2px solid ${payGroup===g.v?"#2563EB":"#E2E8F4"}`,
                  background:payGroup===g.v?"#EFF6FF":"#FAFBFF",
                  cursor:"pointer",transition:"all .18s",
                  display:"flex",flexDirection:"column",gap:4,
                }}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:20}}>{g.icon}</span>
                    {payGroup===g.v&&<span style={{color:"#2563EB",fontWeight:900,fontSize:14}}>✓</span>}
                  </div>
                  <p style={{fontWeight:800,fontSize:13,color:payGroup===g.v?"#2563EB":"#0F172A"}}>{g.label}</p>
                  <p style={{fontSize:10,color:"#94A3B8"}}>{g.sub}</p>
                </div>
              ))}
            </div>

            {/* ── QRIS DETAIL ── */}
            {payGroup==="qris" && (
              <div style={{background:"linear-gradient(135deg,#0F172A,#1E293B)",borderRadius:16,padding:20,textAlign:"center"}} className="anim-scaleIn">
                <p style={{color:"rgba(255,255,255,0.6)",fontSize:11,fontWeight:800,letterSpacing:2,marginBottom:14}}>SCAN QRIS UNTUK MEMBAYAR</p>
                {/* Mock QRIS pattern */}
                <div style={{width:180,height:180,background:"#fff",borderRadius:14,margin:"0 auto 14px",padding:12,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 0 4px rgba(255,255,255,0.1)"}}>
                  <div style={{width:"100%",height:"100%",display:"grid",gridTemplateColumns:"repeat(9,1fr)",gap:2}}>
                    {Array.from({length:81},(_,i)=>{
                      // Corner squares
                      const r=Math.floor(i/9),c=i%9;
                      const corner=(r<3&&c<3)||(r<3&&c>5)||(r>5&&c<3);
                      const rand=((i*17+r*7+c*13)%3)===0;
                      return <div key={i} style={{borderRadius:1,background:corner||rand?"#0F172A":"transparent"}}/>;
                    })}
                  </div>
                </div>
                <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.1)",borderRadius:99,padding:"5px 14px",marginBottom:10}}>
                  <span style={{color:"#FCD34D",fontSize:18}}>⏱</span>
                  <span style={{color:"#FCD34D",fontWeight:900,fontSize:16,fontFamily:"monospace"}}>{qrisMM}:{qrisSS}</span>
                  <span style={{color:"rgba(255,255,255,0.5)",fontSize:11}}>tersisa</span>
                </div>
                <p style={{color:"rgba(255,255,255,0.85)",fontWeight:800,fontSize:14,marginBottom:4}}>Total: {fmt(total)}</p>
                <p style={{color:"rgba(255,255,255,0.45)",fontSize:11,lineHeight:1.6}}>Buka aplikasi apapun (GoPay, OVO, DANA,<br/>ShopeePay, BCA mobile, dll) → Scan QR</p>
                <div style={{marginTop:14,display:"flex",justifyContent:"center",gap:6,flexWrap:"wrap"}}>
                  {["GoPay","OVO","DANA","ShopeePay","BCA","Mandiri","LinkAja"].map(a=>(
                    <span key={a} style={{background:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.7)",padding:"3px 9px",borderRadius:99,fontSize:10,fontWeight:700}}>{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* ── TRANSFER BANK DETAIL ── */}
            {payGroup==="transfer" && (
              <div className="anim-fadeUp">
                <p style={{fontSize:12,fontWeight:800,color:"#64748B",marginBottom:9}}>Pilih bank tujuan transfer:</p>
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  {BANKS.map(b=>(
                    <div key={b.id} onClick={()=>setPayDetail(b.id)} style={{
                      borderRadius:13,border:`2px solid ${payDetail===b.id?"#2563EB":"#E2E8F4"}`,
                      background:payDetail===b.id?"#EFF6FF":"#fff",cursor:"pointer",transition:"all .18s",overflow:"hidden",
                    }}>
                      {/* Bank header */}
                      <div style={{padding:"11px 14px",display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:40,height:40,borderRadius:11,background:payDetail===b.id?"#DBEAFE":"#F1F5F9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🏦</div>
                        <div style={{flex:1}}>
                          <p style={{fontWeight:800,fontSize:14,color:payDetail===b.id?"#2563EB":"#0F172A"}}>Bank {b.name}</p>
                          <p style={{fontSize:11,color:"#94A3B8"}}>Transfer antar bank</p>
                        </div>
                        {payDetail===b.id
                          ? <span style={{color:"#2563EB",fontWeight:900,fontSize:18}}>✓</span>
                          : <span style={{color:"#CBD5E1",fontSize:18}}>›</span>
                        }
                      </div>
                      {/* Nomor rekening — tampil saat dipilih */}
                      {payDetail===b.id && (
                        <div style={{background:"linear-gradient(135deg,#1E40AF,#2563EB)",padding:"14px 16px"}} className="anim-fadeUp">
                          <p style={{color:"rgba(255,255,255,0.6)",fontSize:10,fontWeight:800,letterSpacing:1.5,marginBottom:8}}>NOMOR REKENING TUJUAN</p>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                            <p style={{color:"#FCD34D",fontSize:22,fontWeight:900,letterSpacing:3,fontFamily:"monospace"}}>{b.norek}</p>
                            <button onClick={e=>{e.stopPropagation();navigator.clipboard?.writeText(b.norek);}} style={{background:"rgba(255,255,255,0.15)",border:"none",cursor:"pointer",color:"#fff",fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:7}}>Salin</button>
                          </div>
                          <p style={{color:"rgba(255,255,255,0.75)",fontSize:12,marginBottom:10}}>a/n: <strong style={{color:"#fff"}}>{b.an}</strong></p>
                          <div style={{background:"rgba(255,255,255,0.1)",borderRadius:10,padding:"10px 12px"}}>
                            <p style={{color:"rgba(255,255,255,0.5)",fontSize:10,fontWeight:800,letterSpacing:1,marginBottom:4}}>JUMLAH TRANSFER</p>
                            <p style={{color:"#FCD34D",fontSize:18,fontWeight:900}}>{fmt(total)}</p>
                            <p style={{color:"rgba(255,255,255,0.45)",fontSize:10,marginTop:3}}>Transfer sesuai nominal di atas (termasuk angka unik jika ada)</p>
                          </div>
                          <div style={{marginTop:10,background:"rgba(245,158,11,0.2)",borderRadius:8,padding:"8px 10px",display:"flex",gap:7,alignItems:"flex-start"}}>
                            <span style={{fontSize:14}}>⚠️</span>
                            <p style={{color:"#FCD34D",fontSize:11,lineHeight:1.55}}>Pesanan akan diproses setelah transfer dikonfirmasi oleh admin. Simpan bukti transfer Anda.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── E-WALLET DETAIL ── */}
            {payGroup==="ewallet" && (
              <div className="anim-fadeUp">
                <p style={{fontSize:12,fontWeight:800,color:"#64748B",marginBottom:9}}>Pilih aplikasi e-wallet:</p>
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  {EWALLETS.map(w=>{
                    const colors={gopay:"#00AED6",ovo:"#4C3494",dana:"#118EEA",shopeepay:"#EE4D2D"};
                    const clr=colors[w.id]||"#2563EB";
                    return (
                      <div key={w.id} onClick={()=>setPayDetail(w.id)} style={{
                        borderRadius:13,border:`2px solid ${payDetail===w.id?clr:"#E2E8F4"}`,
                        background:payDetail===w.id?`${clr}10`:"#fff",cursor:"pointer",transition:"all .18s",overflow:"hidden",
                      }}>
                        <div style={{padding:"11px 14px",display:"flex",alignItems:"center",gap:10}}>
                          <div style={{width:40,height:40,borderRadius:11,background:payDetail===w.id?`${clr}20`:"#F1F5F9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{w.logo}</div>
                          <div style={{flex:1}}>
                            <p style={{fontWeight:800,fontSize:14,color:payDetail===w.id?clr:"#0F172A"}}>{w.name}</p>
                            <p style={{fontSize:11,color:"#94A3B8"}}>Transfer ke nomor terdaftar</p>
                          </div>
                          {payDetail===w.id
                            ? <span style={{color:clr,fontWeight:900,fontSize:18}}>✓</span>
                            : <span style={{color:"#CBD5E1",fontSize:18}}>›</span>
                          }
                        </div>
                        {/* Detail nomor — tampil saat dipilih */}
                        {payDetail===w.id && (
                          <div style={{background:`linear-gradient(135deg,${clr}dd,${clr})`,padding:"14px 16px"}} className="anim-fadeUp">
                            <p style={{color:"rgba(255,255,255,0.65)",fontSize:10,fontWeight:800,letterSpacing:1.5,marginBottom:8}}>NOMOR {w.name.toUpperCase()} TUJUAN</p>
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
                              <p style={{color:"#fff",fontSize:22,fontWeight:900,letterSpacing:2,fontFamily:"monospace"}}>{w.no}</p>
                              <button onClick={e=>{e.stopPropagation();navigator.clipboard?.writeText(w.no.replace(/-/g,""));}} style={{background:"rgba(255,255,255,0.2)",border:"none",cursor:"pointer",color:"#fff",fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:7}}>Salin</button>
                            </div>
                            <p style={{color:"rgba(255,255,255,0.8)",fontSize:12,marginBottom:10}}>a/n: <strong style={{color:"#fff"}}>{w.an}</strong></p>
                            <div style={{background:"rgba(255,255,255,0.15)",borderRadius:10,padding:"10px 12px"}}>
                              <p style={{color:"rgba(255,255,255,0.6)",fontSize:10,fontWeight:800,letterSpacing:1,marginBottom:4}}>JUMLAH TRANSFER</p>
                              <p style={{color:"#fff",fontSize:18,fontWeight:900}}>{fmt(total)}</p>
                            </div>
                            <div style={{marginTop:10,background:"rgba(0,0,0,0.15)",borderRadius:8,padding:"8px 10px",display:"flex",gap:7,alignItems:"flex-start"}}>
                              <span style={{fontSize:13}}>📸</span>
                              <p style={{color:"rgba(255,255,255,0.85)",fontSize:11,lineHeight:1.55}}>Kirim screenshot bukti transfer ke admin. Pesanan diproses setelah pembayaran dikonfirmasi.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── KARTU KREDIT/DEBIT ── */}
            {payGroup==="card" && (
              <div className="anim-fadeUp" style={{background:"linear-gradient(135deg,#0F172A,#1E3A8A)",borderRadius:16,padding:20}}>
                <p style={{color:"rgba(255,255,255,0.6)",fontSize:11,fontWeight:800,letterSpacing:2,marginBottom:14}}>KARTU DEBIT / KREDIT</p>
                <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
                  {["💳 Visa","💳 Mastercard","💳 JCB","💳 Amex"].map(c=>(
                    <span key={c} style={{background:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.75)",padding:"4px 11px",borderRadius:99,fontSize:11,fontWeight:700}}>{c}</span>
                  ))}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:9}}>
                  <div>
                    <p style={{color:"rgba(255,255,255,0.5)",fontSize:10,fontWeight:800,marginBottom:5}}>NOMOR KARTU</p>
                    <input className="inp" placeholder="1234 5678 9012 3456" maxLength={19} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",color:"#fff",letterSpacing:2}}
                      onChange={e=>{const v=e.target.value.replace(/\D/g,"").replace(/(.{4})/g,"$1 ").trim();e.target.value=v;setPayDetail("card_filled");}} />
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
                    <div>
                      <p style={{color:"rgba(255,255,255,0.5)",fontSize:10,fontWeight:800,marginBottom:5}}>MASA BERLAKU</p>
                      <input className="inp" placeholder="MM/YY" maxLength={5} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",color:"#fff"}}
                        onChange={e=>{let v=e.target.value.replace(/\D/g,"");if(v.length>=3)v=v.slice(0,2)+"/"+v.slice(2);e.target.value=v;}} />
                    </div>
                    <div>
                      <p style={{color:"rgba(255,255,255,0.5)",fontSize:10,fontWeight:800,marginBottom:5}}>CVV</p>
                      <input className="inp" placeholder="•••" maxLength={4} type="password" style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",color:"#fff"}}/>
                    </div>
                  </div>
                </div>
                <div style={{marginTop:12,display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:14}}>🔒</span>
                  <p style={{color:"rgba(255,255,255,0.4)",fontSize:11}}>Data kartu dienkripsi & aman (SSL 256-bit)</p>
                </div>
              </div>
            )}
          </div>

          <div style={{display:"flex",gap:9}}>
            <button onClick={()=>setStep(2)} className="btn btn-ghost" style={{flex:1}}>← Kembali</button>
            <button onClick={doPayment} className="btn btn-amber btn-lg" style={{flex:2}}>
              {payGroup==="qris"?"✅ Saya Sudah Bayar QRIS":payGroup==="transfer"?"✅ Saya Sudah Transfer":payGroup==="ewallet"?"✅ Saya Sudah Transfer":"💳 Bayar"} {fmt(total)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════ SUCCESS PAGE ══════ */
export function Success({ order, onHome }) {
  const isTransfer = order.payment_method?.startsWith("Transfer");
  const isEwallet  = ["GoPay","OVO","DANA","ShopeePay"].includes(order.payment_method);
  const isQris     = order.payment_method==="QRIS";
  return (
    <div style={{maxWidth:540,margin:"0 auto",padding:"38px 16px 90px",textAlign:"center"}} className="anim-fadeIn">
      <div className="anim-bounce" style={{width:84,height:84,background:"#D1FAE5",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:42,margin:"0 auto 18px"}}>🎉</div>
      <h2 style={{fontWeight:900,fontSize:21,marginBottom:6}}>Pesanan Berhasil!</h2>
      <p style={{color:"#64748B",fontSize:14,marginBottom:26}}>Terima kasih sudah belanja di KIOS REFRES</p>

      {/* Peringatan konfirmasi pembayaran */}
      {(isTransfer||isEwallet) && (
        <div style={{background:"#FEF3C7",border:"1.5px solid #FCD34D",borderRadius:14,padding:"13px 16px",marginBottom:14,textAlign:"left",display:"flex",gap:10,alignItems:"flex-start"}}>
          <span style={{fontSize:20}}>⏳</span>
          <div>
            <p style={{fontWeight:800,color:"#92400E",fontSize:13,marginBottom:3}}>Menunggu Konfirmasi Pembayaran</p>
            <p style={{fontSize:12,color:"#78350F",lineHeight:1.6}}>Pesanan akan diproses setelah admin mengkonfirmasi {isTransfer?"transfer bank":"transfer e-wallet"} Anda. Pastikan Anda sudah melakukan transfer.</p>
          </div>
        </div>
      )}
      {isQris && (
        <div style={{background:"#D1FAE5",border:"1.5px solid #6EE7B7",borderRadius:14,padding:"13px 16px",marginBottom:14,textAlign:"left",display:"flex",gap:10,alignItems:"flex-start"}}>
          <span style={{fontSize:20}}>✅</span>
          <div>
            <p style={{fontWeight:800,color:"#065F46",fontSize:13,marginBottom:3}}>Pembayaran QRIS Dikonfirmasi</p>
            <p style={{fontSize:12,color:"#047857",lineHeight:1.6}}>Pembayaran QRIS biasanya langsung terkonfirmasi otomatis. Pesanan Anda sedang diproses.</p>
          </div>
        </div>
      )}

      <div className="card anim-slideUp" style={{padding:22,textAlign:"left",marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",paddingBottom:13,marginBottom:13,borderBottom:"1px solid #F1F5F9"}}>
          <span style={{fontSize:12,color:"#64748B",fontWeight:700}}>No. Pesanan</span>
          <span style={{fontWeight:900,color:"#2563EB",fontSize:13}}>{order.order_id}</span>
        </div>
        {order.pickup_code && (
          <div className="hero-grad" style={{borderRadius:15,padding:20,textAlign:"center",marginBottom:15}}>
            <p style={{color:"rgba(255,255,255,0.65)",fontSize:11,marginBottom:7,fontWeight:800,letterSpacing:2}}>KODE PENGAMBILAN</p>
            <p style={{color:"#FCD34D",fontSize:26,fontWeight:900,letterSpacing:4,fontFamily:"monospace"}}>{order.pickup_code}</p>
            <p style={{color:"rgba(255,255,255,0.55)",fontSize:12,marginTop:7}}>Tunjukkan kode ini kepada kasir saat ambil barang</p>
          </div>
        )}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13,marginBottom:14}}>
          {[
            ["Pelanggan",   order.customer_name],
            ["Telepon",     order.phone],
            ["Pengiriman",  order.delivery_method==="pickup"?"Ambil di Toko":"Delivery"],
            ["Metode Bayar",order.payment_method],
            ["Status",      "🟡 "+order.order_status],
            ["Tanggal",     order.order_date],
          ].map(([l,v])=>(
            <div key={l}>
              <p style={{fontSize:11,color:"#94A3B8",fontWeight:700,marginBottom:2}}>{l}</p>
              <p style={{fontSize:13,fontWeight:800}}>{v}</p>
            </div>
          ))}
        </div>

        {/* Produk */}
        <div style={{borderTop:"1px solid #F1F5F9",paddingTop:12,marginBottom:12}}>
          {order.products.map(p=>(
            <div key={p.id} style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:12,color:"#64748B"}}>{p.name} ×{p.qty}</span>
              <span style={{fontSize:12,fontWeight:700}}>{fmt(p.price*p.qty)}</span>
            </div>
          ))}
        </div>

        <div style={{borderTop:"1px solid #F1F5F9",paddingTop:13,display:"flex",justifyContent:"space-between"}}>
          <span style={{fontWeight:900,fontSize:14}}>Total Dibayar</span>
          <span style={{fontWeight:900,fontSize:20,color:"#2563EB"}}>{fmt(order.total_price)}</span>
        </div>
      </div>

      {/* Langkah selanjutnya untuk transfer */}
      {(isTransfer||isEwallet) && (
        <div className="card" style={{padding:18,textAlign:"left",marginBottom:14}}>
          <p style={{fontWeight:800,fontSize:13,marginBottom:11}}>📋 Langkah Selanjutnya</p>
          {[
            `Lakukan transfer sejumlah ${fmt(order.total_price)} ke rekening/nomor ${order.payment_method} KIOS REFRES`,
            "Simpan bukti transfer/screenshot pembayaran Anda",
            "Hubungi admin via WhatsApp dengan menyertakan No. Pesanan & bukti bayar",
            "Admin akan mengkonfirmasi dan pesanan segera diproses",
          ].map((s,i)=>(
            <div key={i} style={{display:"flex",gap:10,marginBottom:9,alignItems:"flex-start"}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:"#EFF6FF",color:"#2563EB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,flexShrink:0}}>{i+1}</div>
              <p style={{fontSize:12,color:"#475569",lineHeight:1.6}}>{s}</p>
            </div>
          ))}
          <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"#22C55E",color:"#fff",borderRadius:11,padding:"10px 0",fontWeight:800,fontSize:13,marginTop:4}}>
            <span style={{fontSize:18}}>💬</span> Hubungi Admin WhatsApp
          </a>
        </div>
      )}

      <button onClick={onHome} className="btn btn-primary btn-block btn-lg">🏠 Kembali Belanja</button>
    </div>
  );
}

/* ══════ ORDERS PAGE ══════ */
export function Orders({ orders, onBack, customer, waNumber, waName }) {
  // orders sudah difilter per customer dari App.jsx (fetchMyOrders)
  return (
    <div style={{maxWidth:680,margin:"0 auto",padding:"20px 16px 90px"}}>
      <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:"#2563EB",fontWeight:800,fontSize:13,marginBottom:16}}>← Kembali</button>
      <h2 style={{fontWeight:900,marginBottom:18,fontSize:18}}>📦 Riwayat Pesanan</h2>
      {customer && (
        <div style={{background:"#EFF6FF",borderRadius:11,padding:"9px 13px",marginBottom:14,display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:14}}>👤</span>
          <p style={{fontSize:12,color:"#1D4ED8",fontWeight:700}}>Pesanan untuk: <strong>{customer.username}</strong></p>
        </div>
      )}
      {/* Tombol Chat WA */}
      {waNumber && (
        <a href={`https://wa.me/${waNumber}?text=Halo%20${encodeURIComponent(waName||"Admin")}%2C%20saya%20ingin%20bertanya%20tentang%20pesanan%20saya.`}
          target="_blank" rel="noreferrer"
          style={{display:"flex",alignItems:"center",justifyContent:"center",gap:9,background:"#22C55E",color:"#fff",borderRadius:12,padding:"12px 0",fontWeight:800,fontSize:14,marginBottom:16,textDecoration:"none",boxShadow:"0 4px 12px rgba(34,197,94,0.3)"}}>
          <span style={{fontSize:20}}>💬</span> Chat WhatsApp {waName||"Admin"}
        </a>
      )}
      {!orders.length
        ? <Empty icon="📦" title="Belum ada pesanan" desc="Pesanan Anda akan tampil di sini"/>
        : <div style={{display:"flex",flexDirection:"column",gap:11}}>
            {[...orders].map(o=>(
              <div key={o.order_id} className="card anim-fadeUp" style={{padding:17}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:11}}>
                  <div>
                    <p style={{fontWeight:900,fontSize:13,color:"#2563EB",marginBottom:2}}>{o.order_id}</p>
                    <p style={{fontSize:11,color:"#94A3B8"}}>{o.order_date}</p>
                  </div>
                  <StatusBadge status={o.order_status}/>
                </div>
                <div style={{marginBottom:11,paddingBottom:11,borderBottom:"1px solid #F1F5F9"}}>
                  {o.products.map(p=>(
                    <div key={p.id} style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:13,color:"#64748B"}}>{p.name} ×{p.qty}</span>
                      <span style={{fontSize:13,fontWeight:700}}>{fmt(p.price*p.qty)}</span>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <p style={{fontSize:12,color:"#64748B",marginBottom:2}}>{o.delivery_method==="pickup"?"🏪 Ambil di Toko":"🚚 Delivery"}</p>
                    {o.pickup_code && <p style={{fontSize:13,fontWeight:900,color:"#2563EB",fontFamily:"monospace",letterSpacing:1}}>{o.pickup_code}</p>}
                  </div>
                  <div style={{textAlign:"right"}}>
                    <p style={{fontSize:11,color:"#94A3B8",marginBottom:2}}>Total</p>
                    <p style={{fontWeight:900,fontSize:17,color:"#2563EB"}}>{fmt(o.total_price)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  );
}

/* ══════ BOTTOM NAV ══════ */
export function WAFloatButton({ waNumber, waName }) {
  if (!waNumber) return null;
  return (
    <a href={`https://wa.me/${waNumber}?text=Halo%20${encodeURIComponent(waName||"Admin")}%2C%20saya%20mau%20tanya%20tentang%20produk.`}
      target="_blank" rel="noreferrer"
      title={"Chat " + (waName||"Admin")}
      style={{position:"fixed",bottom:82,left:14,width:46,height:46,borderRadius:"50%",background:"#22C55E",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:"0 4px 16px rgba(34,197,94,0.4)",zIndex:80,textDecoration:"none",animation:"pop .3s ease"}}>
      💬
    </a>
  );
}

export function BottomNav({ page, setPage, n }) {
  const items=[{p:"home",icon:"🏠",label:"Beranda"},{p:"orders",icon:"📦",label:"Pesanan"},{p:"cart",icon:"🛒",label:n>0?`Keranjang (${n})`:"Keranjang"}];
  return (
    <div className="bottom-nav">
      {items.map(b=>(
        <button key={b.p} onClick={()=>setPage(b.p)} className={`bnb ${page===b.p?"active":""}`}>
          <span style={{fontSize:22}}>{b.icon}</span>
          <span className="bnb-label">{b.label}</span>
          {page===b.p && <div className="bnb-dot"/>}
        </button>
      ))}
    </div>
  );
}