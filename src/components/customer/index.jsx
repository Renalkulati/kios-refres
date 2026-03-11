import { useState, useEffect, useRef } from "react";
import { fmt, genCode, genId, now } from "../../utils/index.js";
import { validateVoucher, updateOrderStatus } from "../../lib/db.js";
import { kirimNotifSudahBayar, kirimNotifBatalPesanan } from "../../lib/telegram.js";
import { CATEGORIES, CAT_ICON, ONGKIR } from "../../data/index.js";
import { Skel, Stars, Empty, Field, Spinner, StatusBadge } from "../ui/index.jsx";

const parseProducts=(p)=>{if(!p)return[];if(Array.isArray(p))return p;try{return JSON.parse(p);}catch{return[];}};
const sanitizeWA=(n)=>{if(!n)return"";const c=n.replace(/[^0-9]/g,"");if(c.startsWith("0"))return"62"+c.slice(1);if(c.startsWith("62"))return c;return c;};

/* ══ SPLASH ══ */
export function Splash({onDone,settings}){
  const [p,setP]=useState(0);const [out,setOut]=useState(false);
  const name=settings?.store_name||"KIOS REFRES";
  const tag=settings?.store_tagline||"Belanja Mudah · Harga Bersahabat";
  useEffect(()=>{
    const iv=setInterval(()=>setP(v=>{if(v>=100){clearInterval(iv);return 100;}return v+2.5;}),30);
    const t=setTimeout(()=>{setOut(true);setTimeout(onDone,480);},2400);
    return()=>{clearInterval(iv);clearTimeout(t);};
  },[]);
  return(
    <div style={{position:"fixed",inset:0,zIndex:9999,background:"linear-gradient(145deg,var(--c-secondary,#1E3A8A),var(--c-primary,#2563EB) 55%,#6366F1)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",transition:"opacity .48s ease",opacity:out?0:1}}>
      <div style={{position:"absolute",width:300,height:300,background:"rgba(255,255,255,0.05)",borderRadius:"50%",top:-80,right:-60}}/>
      <div style={{position:"absolute",width:200,height:200,background:"rgba(245,158,11,0.12)",borderRadius:"50%",bottom:-40,left:-40}}/>
      <div style={{animation:"splashIn .65s cubic-bezier(.34,1.56,.64,1)",textAlign:"center",position:"relative",padding:"0 24px"}}>
        <div className="anim-float" style={{width:100,height:100,background:"#fff",borderRadius:30,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",boxShadow:"0 20px 60px rgba(0,0,0,0.25)",fontSize:54}}>🛒</div>
        <h1 style={{color:"#fff",fontSize:36,fontWeight:900,letterSpacing:"-1px",lineHeight:1}}>{name}</h1>
        <p style={{color:"rgba(255,255,255,0.65)",fontSize:14,marginTop:10,fontWeight:500}}>{tag}</p>
        <div style={{marginTop:36,width:220,margin:"36px auto 0"}}>
          <div className="prog-bar"><div className="prog-fill" style={{width:`${p}%`,background:"linear-gradient(90deg,#FCD34D,#F59E0B)"}}/></div>
          <p style={{color:"rgba(255,255,255,0.4)",fontSize:11,marginTop:8,fontWeight:600}}>Memuat {Math.round(p)}%</p>
        </div>
      </div>
    </div>
  );
}

/* ══ NAVBAR ══ */
export function Navbar({cartCount,page,setPage,q,setQ,customer,onLogout,settings}){
  const [scrolled,setScrolled]=useState(false);
  const [profileOpen,setProfileOpen]=useState(false);
  const searchRef=useRef(null);
  const name=settings?.store_name||"KIOS REFRES";
  useEffect(()=>{const h=()=>setScrolled(window.scrollY>6);window.addEventListener("scroll",h);return()=>window.removeEventListener("scroll",h);},[]);
  return(<>
    <nav className={`navbar ${scrolled?"scrolled":""}`}>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"0 14px",display:"flex",alignItems:"center",gap:9,height:58}}>
        <button onClick={()=>{setPage("home");setQ("");}} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <div className="glass" style={{width:36,height:36,borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🛒</div>
          <span style={{color:"#fff",fontWeight:900,fontSize:15,letterSpacing:"-0.3px",whiteSpace:"nowrap"}} className="hide-mobile">{name}</span>
        </button>
        <div style={{flex:1,position:"relative"}}>
          <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",fontSize:14,pointerEvents:"none",opacity:.6}}>🔍</span>
          <input ref={searchRef} className="nav-search" value={q} onChange={e=>{setQ(e.target.value);if(page!=="home")setPage("home");}} placeholder="Cari produk..."/>
          {q&&<button onClick={()=>setQ("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,0.2)",border:"none",borderRadius:"50%",width:20,height:20,cursor:"pointer",color:"#fff",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>}
        </div>
        <button onClick={()=>setPage("orders")} style={{background:"rgba(255,255,255,0.14)",border:"1px solid rgba(255,255,255,0.2)",cursor:"pointer",borderRadius:10,padding:"7px 11px",color:"#fff",fontSize:12,fontWeight:800,whiteSpace:"nowrap",flexShrink:0}} className="hide-mobile">📦 Pesanan</button>
        <button onClick={()=>setPage("cart")} style={{background:"rgba(245,158,11,0.9)",border:"none",borderRadius:12,padding:"7px 12px",cursor:"pointer",flexShrink:0,position:"relative",display:"flex",alignItems:"center",gap:5,color:"#1E293B",fontWeight:800,fontSize:13}}>
          🛒{cartCount>0&&<span style={{background:"#EF4444",color:"#fff",borderRadius:99,minWidth:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,padding:"0 4px",animation:"bounceIn .3s ease"}}>{cartCount}</span>}
        </button>
        {customer?(
          <button onClick={()=>setProfileOpen(true)} style={{width:34,height:34,borderRadius:"50%",background:"rgba(255,255,255,0.22)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:"#fff",border:"2px solid rgba(255,255,255,0.45)",cursor:"pointer",flexShrink:0}}>
            {customer.username[0].toUpperCase()}
          </button>
        ):(
          <button onClick={()=>setPage("auth")} style={{background:"rgba(255,255,255,0.2)",border:"1px solid rgba(255,255,255,0.3)",cursor:"pointer",borderRadius:10,padding:"7px 12px",color:"#fff",fontSize:12,fontWeight:800,whiteSpace:"nowrap",flexShrink:0}}>Masuk</button>
        )}
      </div>
    </nav>
    {profileOpen&&customer&&(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setProfileOpen(false)}>
        <div style={{background:"#fff",borderRadius:"24px 24px 0 0",padding:"20px 20px 40px",width:"100%",maxWidth:440,animation:"slideUp .3s cubic-bezier(.34,1.56,.64,1)"}} onClick={e=>e.stopPropagation()}>
          <div style={{width:40,height:4,background:"#E2E8F0",borderRadius:99,margin:"0 auto 20px"}}/>
          <div style={{textAlign:"center",marginBottom:20}}>
            <div style={{width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,var(--c-primary,#2563EB),#6366F1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:900,color:"#fff",margin:"0 auto 12px"}}>{customer.username[0].toUpperCase()}</div>
            <p style={{fontWeight:900,fontSize:17}}>{customer.username}</p>
            <p style={{color:"#64748B",fontSize:13,marginTop:3}}>📞 {customer.phone}</p>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:14}}>
            <button onClick={()=>{setPage("orders");setProfileOpen(false);}} className="btn btn-secondary btn-block">📦 Pesanan Saya</button>
          </div>
          <button onClick={()=>{onLogout();setProfileOpen(false);}} className="btn btn-danger btn-block">🚪 Keluar</button>
        </div>
      </div>
    )}
  </>);
}

/* ══ PRODUCT CARD ══ */
function ProductCard({p,onDetail,onAdd}){
  const [loaded,setLoaded]=useState(false);
  const [added,setAdded]=useState(false);
  const isOut=p.stock===0;
  const isLow=p.stock>0&&p.stock<=5;
  const doAdd=(e)=>{e.stopPropagation();if(isOut)return;onAdd(p,1);setAdded(true);setTimeout(()=>setAdded(false),1400);};
  return(
    <div onClick={()=>!isOut&&onDetail(p)} className="card card-hover anim-fadeUp" style={{overflow:"hidden",cursor:isOut?"default":"pointer",opacity:isOut?0.75:1,position:"relative"}}>
      {isOut&&<div style={{position:"absolute",top:0,left:0,right:0,bottom:0,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
        <div style={{background:"rgba(239,68,68,0.88)",color:"#fff",fontWeight:900,fontSize:11,padding:"5px 16px",borderRadius:7,letterSpacing:2,transform:"rotate(-12deg)",boxShadow:"0 4px 12px rgba(0,0,0,0.2)"}}>HABIS</div>
      </div>}
      <div style={{position:"relative",paddingTop:"82%",background:"#F0F4FF",overflow:"hidden"}}>
        {!loaded&&<Skel w="100%" h="100%" r={0}/>}
        <img src={p.img} alt={p.name} loading="lazy" onLoad={()=>setLoaded(true)} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:loaded?1:0,transition:"opacity .3s",filter:isOut?"grayscale(35%)":"none"}}/>
        <span style={{position:"absolute",top:8,left:8,background:"rgba(37,99,235,0.85)",color:"#fff",padding:"2px 8px",borderRadius:99,fontSize:10,fontWeight:700,backdropFilter:"blur(6px)"}}>{CAT_ICON[p.cat]||"🏷️"}</span>
        {isLow&&<span style={{position:"absolute",top:8,right:8,background:"rgba(245,158,11,0.92)",color:"#fff",padding:"2px 8px",borderRadius:99,fontSize:10,fontWeight:800}}>⚡ Sisa {p.stock}</span>}
        {isOut&&<span style={{position:"absolute",top:8,right:8,background:"rgba(239,68,68,0.92)",color:"#fff",padding:"2px 8px",borderRadius:99,fontSize:10,fontWeight:800}}>✕ Habis</span>}
        {!isOut&&p.sold>50&&<span style={{position:"absolute",bottom:8,left:8,background:"rgba(239,68,68,0.85)",color:"#fff",padding:"2px 8px",borderRadius:99,fontSize:10,fontWeight:800,backdropFilter:"blur(4px)"}}>🔥 Laris</span>}
      </div>
      <div style={{padding:"11px 11px 12px"}}>
        <p style={{fontSize:12,fontWeight:700,lineHeight:1.35,marginBottom:4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",color:isOut?"#94A3B8":"inherit"}}>{p.name}</p>
        <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:6}}><Stars val={p.rating}/><span style={{fontSize:10,color:"#94A3B8",fontWeight:600}}>({p.sold})</span></div>
        <p style={{fontSize:15,fontWeight:900,color:isOut?"#94A3B8":"var(--c-primary,#2563EB)",marginBottom:9}}>{fmt(p.price)}</p>
        {!isOut&&p.stock<=20&&(
          <div style={{marginBottom:8}}>
            <div className="prog-bar" style={{height:4}}>
              <div className="prog-fill" style={{width:`${Math.min(100,Math.round(p.stock/(p.stock+(p.sold||1))*100))}%`,background:p.stock<=5?"#EF4444":"#F59E0B"}}/>
            </div>
            <p style={{fontSize:10,color:p.stock<=5?"#EF4444":"#F59E0B",fontWeight:700,marginTop:3}}>Stok: {p.stock}</p>
          </div>
        )}
        <button onClick={doAdd} disabled={isOut} className="btn btn-block" style={{padding:"8px 0",borderRadius:10,fontSize:12,background:added?"#10B981":isOut?"#F1F5F9":"var(--c-primary,#2563EB)",color:added?"#fff":isOut?"#94A3B8":"#fff",cursor:isOut?"not-allowed":"pointer",transition:"all .2s"}}>
          {added?"✓ Ditambahkan":isOut?"Stok Habis":"+ Keranjang"}
        </button>
      </div>
    </div>
  );
}

/* ══ HOME PAGE ══ */
export function Home({products,onDetail,onAdd,q,categories:catsProp,settings}){
  const [cat,setCat]=useState("Semua");
  const [pg,setPg]=useState(1);
  const [sort,setSort]=useState("default");
  const PER=12;
  const name=settings?.store_name||"KIOS REFRES";
  const tagline=settings?.store_tagline||"Semua kebutuhan harian tersedia lengkap.";
  const address=settings?.store_address||"";
  const hours=settings?.store_hours||"";
  const dynCats=catsProp&&catsProp.length>0?["Semua",...catsProp]:["Semua",...CATEGORIES.filter(c=>c!=="Semua")];
  let filtered=products.filter(p=>(cat==="Semua"||p.cat===cat)&&p.name.toLowerCase().includes(q.toLowerCase()));
  if(sort==="price-asc")filtered=[...filtered].sort((a,b)=>a.price-b.price);
  if(sort==="price-desc")filtered=[...filtered].sort((a,b)=>b.price-a.price);
  if(sort==="popular")filtered=[...filtered].sort((a,b)=>b.sold-a.sold);
  if(sort==="new")filtered=[...filtered].sort((a,b)=>b.id-a.id);
  const pages=Math.ceil(filtered.length/PER);
  const shown=filtered.slice((pg-1)*PER,pg*PER);
  const top4=[...products].filter(p=>p.stock>0).sort((a,b)=>b.sold-a.sold).slice(0,4);
  const inStock=products.filter(p=>p.stock>0).length;
  const outStock=products.filter(p=>p.stock===0).length;
  useEffect(()=>setPg(1),[cat,q,sort]);
  return(
    <div className="pw" style={{paddingTop:14}}>
      {/* Hero */}
      <div className="hero-grad anim-fadeIn" style={{borderRadius:22,padding:"28px 22px",marginBottom:20,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-40,top:-40,width:240,height:240,background:"rgba(255,255,255,0.05)",borderRadius:"50%"}}/>
        <div style={{position:"absolute",right:80,bottom:-60,width:160,height:160,background:"rgba(245,158,11,0.1)",borderRadius:"50%"}}/>
        <div style={{position:"relative"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(245,158,11,0.2)",borderRadius:99,padding:"4px 13px",marginBottom:10}}>
            <span style={{fontSize:12}}>✨</span><span style={{color:"#FCD34D",fontSize:12,fontWeight:800}}>Belanja Hemat Setiap Hari</span>
          </div>
          <h1 style={{color:"#fff",fontSize:"clamp(20px,4vw,30px)",fontWeight:900,letterSpacing:"-0.5px",lineHeight:1.2,marginBottom:8}}>
            Selamat Datang di<br/><span style={{color:"#FCD34D"}}>{name}</span> 🛒
          </h1>
          <p style={{color:"rgba(255,255,255,0.72)",fontSize:13,marginBottom:14,lineHeight:1.65}}>{tagline}</p>
          <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:14}}>
            {["🚚 Antar Rumah","🏪 Ambil Toko","💳 Bayar Mudah","⚡ Proses Cepat"].map(t=>(
              <span key={t} className="glass" style={{color:"#fff",padding:"4px 11px",borderRadius:99,fontSize:11,fontWeight:700}}>{t}</span>
            ))}
          </div>
          <div style={{display:"flex",gap:9,flexWrap:"wrap"}}>
            <span style={{background:"rgba(16,185,129,0.22)",color:"#6EE7B7",padding:"4px 12px",borderRadius:99,fontSize:11,fontWeight:800,border:"1px solid rgba(16,185,129,0.3)"}}>✅ {inStock} produk tersedia</span>
            {outStock>0&&<span style={{background:"rgba(239,68,68,0.18)",color:"#FCA5A5",padding:"4px 12px",borderRadius:99,fontSize:11,fontWeight:800,border:"1px solid rgba(239,68,68,0.3)"}}>✕ {outStock} habis</span>}
            {address&&<span style={{background:"rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.75)",padding:"4px 12px",borderRadius:99,fontSize:11,fontWeight:700}}>📍 {address}</span>}
            {hours&&<span style={{background:"rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.75)",padding:"4px 12px",borderRadius:99,fontSize:11,fontWeight:700}}>🕒 {hours}</span>}
          </div>
        </div>
      </div>

      {/* Terlaris */}
      {!q&&cat==="Semua"&&top4.length>0&&(
        <div style={{marginBottom:24}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <h2 style={{fontWeight:900,fontSize:15}}>🔥 Produk Terlaris</h2>
            <button onClick={()=>setSort("popular")} style={{background:"none",border:"none",cursor:"pointer",color:"var(--c-primary,#2563EB)",fontSize:12,fontWeight:800}}>Lihat Semua →</button>
          </div>
          <div className="noscroll" style={{display:"flex",gap:11,overflowX:"auto",paddingBottom:4}}>
            {top4.map((p,i)=>(
              <div key={p.id} onClick={()=>onDetail(p)} className="card card-hover" style={{flexShrink:0,width:140,padding:11,cursor:"pointer"}}>
                <div style={{position:"relative"}}>
                  <img src={p.img} alt={p.name} style={{width:"100%",aspectRatio:"1",objectFit:"cover",borderRadius:11,marginBottom:8}}/>
                  <span style={{position:"absolute",top:5,left:5,background:"rgba(239,68,68,0.85)",color:"#fff",padding:"2px 6px",borderRadius:99,fontSize:10,fontWeight:800}}>#{i+1}</span>
                </div>
                <p style={{fontSize:12,fontWeight:800,lineHeight:1.3,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</p>
                <p style={{fontSize:13,fontWeight:900,color:"var(--c-primary,#2563EB)"}}>{fmt(p.price)}</p>
                <p style={{fontSize:10,color:"#94A3B8",marginTop:2}}>{p.sold} terjual</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category + Sort */}
      <div style={{marginBottom:14}}>
        <div className="noscroll" style={{display:"flex",gap:7,overflowX:"auto",marginBottom:10,paddingBottom:2}}>
          {dynCats.map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{flexShrink:0,padding:"7px 14px",borderRadius:99,border:`1.5px solid ${cat===c?"var(--c-primary,#2563EB)":"#E2E8F4"}`,background:cat===c?"var(--c-primary,#2563EB)":"#fff",color:cat===c?"#fff":"#64748B",fontWeight:700,fontSize:12,cursor:"pointer",boxShadow:cat===c?"0 4px 12px rgba(37,99,235,0.25)":"none",transition:"all .2s"}}>{CAT_ICON[c]||"🏷️"} {c}</button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
          <p style={{fontSize:12,color:"#64748B",fontWeight:600}}>{filtered.length} produk{outStock>0?` · ${outStock} habis`:""}</p>
          <select value={sort} onChange={e=>setSort(e.target.value)} style={{padding:"6px 10px",borderRadius:9,border:"1.5px solid #E2E8F4",fontSize:12,fontWeight:700,color:"#334155",background:"#fff",cursor:"pointer",outline:"none"}}>
            <option value="default">Default</option>
            <option value="popular">Terlaris</option>
            <option value="price-asc">Harga ↑</option>
            <option value="price-desc">Harga ↓</option>
            <option value="new">Terbaru</option>
          </select>
        </div>
      </div>

      {shown.length===0?<Empty icon="🔍" title="Produk tidak ditemukan" desc="Coba kata kunci lain"/>:
        <div className="product-grid">{shown.map((p,i)=><div key={p.id} style={{animationDelay:`${i*.04}s`}}><ProductCard p={p} onDetail={onDetail} onAdd={onAdd}/></div>)}</div>}

      {pages>1&&(
        <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:28,flexWrap:"wrap"}}>
          <button onClick={()=>setPg(p=>Math.max(1,p-1))} disabled={pg===1} className="btn btn-ghost btn-sm" style={{opacity:pg===1?.4:1}}>← Prev</button>
          {Array.from({length:Math.min(pages,7)},(_,i)=>(
            <button key={i} onClick={()=>setPg(i+1)} style={{minWidth:34,height:34,borderRadius:9,border:`1.5px solid ${pg===i+1?"var(--c-primary,#2563EB)":"#E2E8F4"}`,background:pg===i+1?"var(--c-primary,#2563EB)":"#fff",color:pg===i+1?"#fff":"#64748B",fontWeight:800,fontSize:13,cursor:"pointer"}}>{i+1}</button>
          ))}
          <button onClick={()=>setPg(p=>Math.min(pages,p+1))} disabled={pg===pages} className="btn btn-ghost btn-sm" style={{opacity:pg===pages?.4:1}}>Next →</button>
        </div>
      )}
    </div>
  );
}

/* ══ DETAIL PAGE ══ */
export function Detail({p,onBack,onAdd,onBuy}){
  const [qty,setQty]=useState(1);const [ok,setOk]=useState(false);const [load,setLoad]=useState(false);
  const isOut=p.stock===0;const isLow=p.stock>0&&p.stock<=5;
  return(
    <div style={{maxWidth:860,margin:"0 auto",padding:"18px 16px 90px"}} className="anim-fadeIn">
      <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:"var(--c-primary,#2563EB)",fontWeight:800,fontSize:13,display:"flex",alignItems:"center",gap:5,marginBottom:16}}>← Kembali belanja</button>
      <div className="card" style={{overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
          <div style={{background:"#F0F4FF",position:"relative",minHeight:280,overflow:"hidden"}}>
            {!load&&<Skel w="100%" h="100%" r={0}/>}
            <img src={p.img} alt={p.name} onLoad={()=>setLoad(true)} style={{width:"100%",height:"100%",objectFit:"cover",minHeight:280,display:"block",opacity:load?1:0,transition:"opacity .3s",filter:isOut?"grayscale(35%)":"none"}}/>
            <span style={{position:"absolute",top:12,left:12,background:"rgba(37,99,235,0.85)",color:"#fff",padding:"4px 11px",borderRadius:99,fontSize:11,fontWeight:700,backdropFilter:"blur(6px)"}}>{CAT_ICON[p.cat]||"🏷️"} {p.cat}</span>
            {isOut&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.35)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{background:"rgba(239,68,68,0.95)",color:"#fff",padding:"12px 32px",borderRadius:14,fontWeight:900,fontSize:18,letterSpacing:2}}>STOK HABIS</div>
            </div>}
          </div>
          <div style={{padding:"24px 22px",display:"flex",flexDirection:"column",gap:14}}>
            <h2 style={{fontWeight:900,fontSize:"clamp(17px,2.5vw,23px)",lineHeight:1.3}}>{p.name}</h2>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <Stars val={p.rating}/><span style={{fontSize:13,color:"#64748B",fontWeight:600}}>{p.rating} · {p.sold} terjual</span>
            </div>
            <p style={{fontSize:30,fontWeight:900,color:"var(--c-primary,#2563EB)"}}>{fmt(p.price)}</p>
            {p.desc&&<p style={{fontSize:14,color:"#64748B",lineHeight:1.75,background:"#F8FAFC",padding:"12px 14px",borderRadius:12}}>{p.desc}</p>}
            {isOut?(
              <div style={{background:"#FEE2E2",border:"1.5px solid #FECACA",borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:20}}>❌</span>
                <div><p style={{fontWeight:900,color:"#991B1B",fontSize:13}}>Stok Habis</p><p style={{fontSize:12,color:"#B91C1C"}}>Produk sedang tidak tersedia</p></div>
              </div>
            ):(
              <div style={{background:isLow?"#FEF3C7":"#D1FAE5",border:`1.5px solid ${isLow?"#FCD34D":"#A7F3D0"}`,borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:20}}>{isLow?"⚠️":"📦"}</span>
                <div>
                  <p style={{fontWeight:900,color:isLow?"#92400E":"#065F46",fontSize:13}}>{isLow?`Sisa ${p.stock} unit — Segera habis!`:`Stok tersedia: ${p.stock} unit`}</p>
                  <p style={{fontSize:12,color:isLow?"#B45309":"#047857"}}>{isLow?"Pesan sebelum kehabisan!":"Produk siap dikirim"}</p>
                </div>
              </div>
            )}
            {!isOut&&<>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:13,fontWeight:700,color:"#64748B"}}>Jumlah:</span>
                <div className="qty-wrap">
                  <button className="qty-btn" onClick={()=>setQty(q=>Math.max(1,q-1))}>−</button>
                  <span className="qty-val">{qty}</span>
                  <button className="qty-btn" onClick={()=>setQty(q=>Math.min(p.stock,q+1))}>+</button>
                </div>
                <span style={{fontSize:12,color:"#94A3B8"}}>maks. {p.stock}</span>
              </div>
              <div style={{background:"#F0F4FF",borderRadius:12,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:13,color:"#64748B",fontWeight:700}}>Subtotal</span>
                <span style={{fontSize:22,fontWeight:900,color:"var(--c-primary,#2563EB)"}}>{fmt(p.price*qty)}</span>
              </div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>{onAdd(p,qty);setOk(true);setTimeout(()=>setOk(false),1400);}} className={`btn ${ok?"btn-green":"btn-secondary"}`} style={{flex:1}}>
                  {ok?"✓ Ditambahkan":"🛒 Keranjang"}
                </button>
                <button onClick={()=>onBuy(p,qty)} className="btn btn-primary" style={{flex:1}}>⚡ Beli Sekarang</button>
              </div>
            </>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══ CART ══ */
export function Cart({cart,onQty,onRemove,onCheckout,onBack}){
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const count=cart.reduce((s,i)=>s+i.qty,0);
  if(!cart.length)return(<div className="pw"><Empty icon="🛒" title="Keranjang masih kosong" desc="Yuk, pilih produk favorit Anda!" action={<button className="btn btn-primary" onClick={onBack}>Mulai Belanja</button>}/></div>);
  return(
    <div style={{maxWidth:680,margin:"0 auto",padding:"20px 16px 90px"}}>
      <h2 style={{fontWeight:900,marginBottom:18,fontSize:18}}>🛒 Keranjang Belanja</h2>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:18}}>
        {cart.map(item=>(
          <div key={item.id} className="card anim-fadeUp" style={{padding:13,display:"flex",gap:12,alignItems:"center"}}>
            <img src={item.img} alt={item.name} style={{width:64,height:64,objectFit:"cover",borderRadius:12,flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontWeight:800,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{item.name}</p>
              <p style={{fontWeight:900,color:"var(--c-primary,#2563EB)",fontSize:14,marginBottom:8}}>{fmt(item.price)}</p>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div className="qty-wrap">
                  <button className="qty-btn" style={{width:28,height:28}} onClick={()=>onQty(item.id,item.qty-1)}>−</button>
                  <span className="qty-val" style={{width:32,fontSize:13}}>{item.qty}</span>
                  <button className="qty-btn" style={{width:28,height:28}} onClick={()=>onQty(item.id,item.qty+1)}>+</button>
                </div>
                <button className="btn btn-danger btn-sm" onClick={()=>onRemove(item.id)}>Hapus</button>
              </div>
            </div>
            <p style={{fontWeight:900,color:"var(--c-primary,#2563EB)",fontSize:14,flexShrink:0}}>{fmt(item.price*item.qty)}</p>
          </div>
        ))}
      </div>
      <div className="card" style={{padding:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4,fontSize:13}}>
          <span style={{color:"#64748B"}}>Subtotal ({count} item)</span><span style={{fontWeight:800}}>{fmt(total)}</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,paddingTop:10,borderTop:"1px solid #F1F5F9"}}>
          <span style={{fontWeight:800,fontSize:15}}>Total</span><span style={{fontWeight:900,fontSize:24,color:"var(--c-primary,#2563EB)"}}>{fmt(total)}</span>
        </div>
        <button onClick={onCheckout} className="btn btn-primary btn-block btn-lg">Lanjut ke Checkout →</button>
      </div>
    </div>
  );
}

/* ══ CHECKOUT ══ */
export function Checkout({cart,onBack,onSuccess,customer,settings}){
  const [step,setStep]=useState(1);
  const [meth,setMeth]=useState("");
  const [form,setForm]=useState({name:customer?.username||"",phone:customer?.phone||"",address:"",city:""});
  const [payGroup,setPayGroup]=useState("");
  const [payDetail,setPayDetail]=useState("");
  const [errs,setErrs]=useState({});
  const [busy,setBusy]=useState(false);
  const [qrisDone,setQrisDone]=useState(false);
  const [qrisTimer,setQrisTimer]=useState(300);
  const [voucherCode,setVoucherCode]=useState("");
  const [voucherApplied,setVoucherApplied]=useState(null);
  const [voucherErr,setVoucherErr]=useState("");
  const [voucherLoading,setVoucherLoading]=useState(false);

  const sub=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const ongkir=meth==="delivery"?(ONGKIR[form.city]||ONGKIR.Lainnya):0;
  const discount=voucherApplied?(voucherApplied.type==="percent"?Math.floor(sub*voucherApplied.value/100):voucherApplied.value):0;
  const total=Math.max(0,sub+ongkir-discount);

  const applyVoucher=async()=>{
    if(!voucherCode.trim())return;
    setVoucherLoading(true);setVoucherErr("");
    try{const v=await validateVoucher(voucherCode,sub);setVoucherApplied(v);setVoucherErr("");}
    catch(e){setVoucherErr(e.message);setVoucherApplied(null);}
    setVoucherLoading(false);
  };

  useEffect(()=>{
    if(payGroup==="qris"&&step===2){
      setQrisTimer(300);
      const iv=setInterval(()=>setQrisTimer(t=>{if(t<=1){clearInterval(iv);return 0;}return t-1;}),1000);
      return()=>clearInterval(iv);
    }
  },[payGroup,step]);

  const qrisImg=settings?.qris_image;
  const banks=[
    settings?.bank1&&{k:"BCA",n:settings.bank1,a:settings.bank1_name||""},
    settings?.bank2&&{k:"BNI",n:settings.bank2,a:settings.bank2_name||""},
    settings?.bank3&&{k:"Mandiri",n:settings.bank3,a:settings.bank3_name||""},
    settings?.bank4&&{k:"BRI",n:settings.bank4,a:settings.bank4_name||""},
    settings?.bank5&&{k:"BSI",n:settings.bank5,a:settings.bank5_name||""},
  ].filter(Boolean);
  const ewallets=[
    settings?.gopay&&{k:"GoPay",n:settings.gopay},
    settings?.ovo&&{k:"OVO",n:settings.ovo},
    settings?.dana&&{k:"DANA",n:settings.dana},
    settings?.shopeepay&&{k:"ShopeePay",n:settings.shopeepay},
  ].filter(Boolean);

  const payGroups=[
    ...(qrisImg?[{id:"qris",label:"QRIS",icon:"📷"}]:[]),
    ...(banks.length>0?[{id:"transfer",label:"Transfer Bank",icon:"🏦"}]:[]),
    ...(ewallets.length>0?[{id:"ewallet",label:"E-Wallet",icon:"📱"}]:[]),
    {id:"cash",label:"Bayar di Toko (COD/Cash)",icon:"💵"},
  ];

  const sf=(k,v)=>setForm(p=>({...p,[k]:v}));
  const validate1=()=>{
    const e={};
    if(!meth)e.meth="Pilih metode pengiriman";
    if(!form.name.trim())e.name="Nama wajib diisi";
    if(!form.phone.trim())e.phone="Nomor HP wajib diisi";
    if(meth==="delivery"&&!form.address.trim())e.address="Alamat wajib diisi";
    if(meth==="delivery"&&!form.city)e.city="Kota wajib dipilih";
    setErrs(e);return Object.keys(e).length===0;
  };
  const validate2=()=>{
    if(!payGroup){setErrs({pay:"Pilih metode pembayaran"});return false;}
    if(payGroup==="transfer"&&!payDetail){setErrs({pay:"Pilih bank tujuan"});return false;}
    if(payGroup==="ewallet"&&!payDetail){setErrs({pay:"Pilih e-wallet"});return false;}
    return true;
  };
  const submit=async()=>{
    if(!validate2())return;
    setBusy(true);
    try{
      const isCash=payGroup==="cash";
      const order={
        order_id:genCode(),customer_name:form.name.trim(),phone:form.phone.trim(),
        products:JSON.stringify(cart),total_price:total,delivery_method:meth,
        address:meth==="delivery"?form.address:null,pickup_code:meth==="pickup"?genCode().slice(0,6):null,
        order_status:isCash?"menunggu_bayar":"diproses",order_date:now(),
        payment_method:payGroup,pay_detail:payGroup==="transfer"||payGroup==="ewallet"?payDetail:payGroup,
        voucher_code:voucherApplied?.code||null,discount_amount:discount,customer_id:customer?.id||null,
      };
      await onSuccess(order);
    }catch(e){setErrs({submit:"Gagal: "+e.message});setBusy(false);}
  };

  return(
    <div style={{maxWidth:620,margin:"0 auto",padding:"18px 16px 100px"}}>
      <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:"var(--c-primary,#2563EB)",fontWeight:800,fontSize:13,display:"flex",alignItems:"center",gap:5,marginBottom:16}}>← Kembali</button>

      {/* Step indicator */}
      <div style={{display:"flex",alignItems:"center",gap:0,marginBottom:22}}>
        {[{n:1,l:"Info"},{n:2,l:"Bayar"},{n:3,l:"Review"}].map((s,i)=>(
          <div key={s.n} style={{display:"flex",alignItems:"center",flex:i<2?1:"auto"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:step>=s.n?"var(--c-primary,#2563EB)":"#E2E8F4",color:step>=s.n?"#fff":"#94A3B8",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:12,transition:"all .3s"}}>{step>s.n?"✓":s.n}</div>
              <span style={{fontSize:10,fontWeight:700,color:step===s.n?"var(--c-primary,#2563EB)":"#94A3B8"}}>{s.l}</span>
            </div>
            {i<2&&<div style={{flex:1,height:2,background:step>s.n?"var(--c-primary,#2563EB)":"#E2E8F4",margin:"0 6px",marginBottom:16,transition:"all .3s"}}/>}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step===1&&(
        <div className="anim-fadeIn">
          <div className="card" style={{padding:20,marginBottom:14}}>
            <h3 style={{fontWeight:900,fontSize:15,marginBottom:14}}>📦 Pengiriman</h3>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[{id:"delivery",icon:"🚚",label:"Antar Rumah",desc:"Dikirim ke alamat"},{id:"pickup",icon:"🏪",label:"Ambil di Toko",desc:"Gratis ongkir"}].map(m=>(
                <button key={m.id} onClick={()=>setMeth(m.id)} style={{padding:"14px 12px",borderRadius:14,border:`2px solid ${meth===m.id?"var(--c-primary,#2563EB)":"#E2E8F4"}`,background:meth===m.id?"#EFF6FF":"#fff",cursor:"pointer",textAlign:"left",transition:"all .2s"}}>
                  <div style={{fontSize:22,marginBottom:6}}>{m.icon}</div>
                  <p style={{fontWeight:800,fontSize:13,color:meth===m.id?"var(--c-primary,#2563EB)":"#0F172A"}}>{m.label}</p>
                  <p style={{fontSize:11,color:"#64748B",marginTop:2}}>{m.desc}</p>
                </button>
              ))}
            </div>
            {errs.meth&&<p style={{color:"#EF4444",fontSize:12,fontWeight:700,marginBottom:10}}>⚠️ {errs.meth}</p>}
            <Field label="Nama Lengkap" err={errs.name}>
              <input className={`inp${errs.name?" inp-err":""}`} value={form.name} onChange={e=>sf("name",e.target.value)} placeholder="Masukkan nama lengkap"/>
            </Field>
            <Field label="Nomor HP" err={errs.phone}>
              <input className={`inp${errs.phone?" inp-err":""}`} value={form.phone} onChange={e=>sf("phone",e.target.value)} placeholder="08xx-xxxx-xxxx" inputMode="tel"/>
            </Field>
            {meth==="delivery"&&<>
              <Field label="Alamat Lengkap" err={errs.address}>
                <textarea className={`inp${errs.address?" inp-err":""}`} value={form.address} onChange={e=>sf("address",e.target.value)} placeholder="Jl. Nama, No, RT/RW, Kelurahan" rows={3} style={{resize:"vertical"}}/>
              </Field>
              <Field label="Kota / Area" err={errs.city}>
                <select className={`inp${errs.city?" inp-err":""}`} value={form.city} onChange={e=>sf("city",e.target.value)}>
                  <option value="">-- Pilih Kota --</option>
                  {Object.keys(ONGKIR).map(k=><option key={k} value={k}>{k} — {fmt(ONGKIR[k])}</option>)}
                </select>
              </Field>
            </>}
          </div>

          {/* Summary + Voucher */}
          <div className="card" style={{padding:16,marginBottom:14}}>
            <h3 style={{fontWeight:900,fontSize:13,marginBottom:12}}>🛒 Ringkasan</h3>
            {cart.map(i=>(
              <div key={i.id} style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:13}}>
                <span style={{color:"#64748B"}}>{i.name} <b>×{i.qty}</b></span>
                <span style={{fontWeight:800}}>{fmt(i.price*i.qty)}</span>
              </div>
            ))}
            <div style={{borderTop:"1px solid #F1F5F9",marginTop:10,paddingTop:10}}>
              {meth==="delivery"&&form.city&&(
                <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}>
                  <span style={{color:"#64748B"}}>Ongkir ({form.city})</span><span style={{fontWeight:800}}>{fmt(ongkir)}</span>
                </div>
              )}
            </div>
            {/* Voucher */}
            <div style={{borderTop:"1px solid #F1F5F9",marginTop:8,paddingTop:12}}>
              <p style={{fontSize:12,fontWeight:800,color:"#64748B",marginBottom:7}}>🎟️ Kode Voucher</p>
              {!voucherApplied?(
                <div style={{display:"flex",gap:8}}>
                  <input className="inp" value={voucherCode} onChange={e=>{setVoucherCode(e.target.value.toUpperCase());setVoucherErr("");}} placeholder="Masukkan kode" style={{fontSize:13,padding:"9px 12px",textTransform:"uppercase",letterSpacing:1,flex:1}}/>
                  <button onClick={applyVoucher} disabled={voucherLoading} className="btn btn-secondary btn-sm" style={{flexShrink:0}}>{voucherLoading?"...":"Pakai"}</button>
                </div>
              ):(
                <div style={{background:"#D1FAE5",border:"1.5px solid #A7F3D0",borderRadius:12,padding:"10px 13px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><p style={{fontWeight:900,color:"#065F46",fontSize:13}}>✅ {voucherApplied.code}</p><p style={{fontSize:11,color:"#047857"}}>Hemat {voucherApplied.type==="percent"?voucherApplied.value+"%":fmt(voucherApplied.value)}</p></div>
                  <button onClick={()=>{setVoucherApplied(null);setVoucherCode("");}} style={{background:"none",border:"none",cursor:"pointer",color:"#065F46",fontWeight:900,fontSize:16}}>✕</button>
                </div>
              )}
              {voucherErr&&<p style={{color:"#EF4444",fontSize:12,fontWeight:700,marginTop:6}}>⚠️ {voucherErr}</p>}
            </div>
            {discount>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginTop:8}}><span style={{color:"#059669",fontWeight:700}}>Diskon</span><span style={{fontWeight:900,color:"#059669"}}>−{fmt(discount)}</span></div>}
            <div style={{borderTop:"1px solid #F1F5F9",marginTop:10,paddingTop:10,display:"flex",justifyContent:"space-between"}}>
              <span style={{fontWeight:800}}>Total</span><span style={{fontWeight:900,fontSize:18,color:"var(--c-primary,#2563EB)"}}>{fmt(total)}</span>
            </div>
          </div>
          <button onClick={()=>{if(validate1())setStep(2);}} className="btn btn-primary btn-block btn-lg">Lanjut ke Pembayaran →</button>
        </div>
      )}

      {/* Step 2 */}
      {step===2&&(
        <div className="anim-fadeIn">
          <div className="card" style={{padding:20,marginBottom:14}}>
            <h3 style={{fontWeight:900,fontSize:15,marginBottom:16}}>💳 Pembayaran</h3>
            {errs.pay&&<p style={{color:"#EF4444",fontSize:12,fontWeight:700,marginBottom:12}}>⚠️ {errs.pay}</p>}
            <div style={{display:"flex",flexDirection:"column",gap:9}}>
              {payGroups.map(g=>(
                <button key={g.id} onClick={()=>{setPayGroup(g.id);setPayDetail("");setErrs({});}} style={{padding:"13px 15px",borderRadius:14,border:`2px solid ${payGroup===g.id?"var(--c-primary,#2563EB)":"#E2E8F4"}`,background:payGroup===g.id?"#EFF6FF":"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:10,textAlign:"left",transition:"all .2s"}}>
                  <span style={{fontSize:22,flexShrink:0}}>{g.icon}</span>
                  <span style={{fontWeight:800,fontSize:14,color:payGroup===g.id?"var(--c-primary,#2563EB)":"#0F172A"}}>{g.label}</span>
                  {payGroup===g.id&&<span style={{marginLeft:"auto",color:"var(--c-primary,#2563EB)",fontSize:18}}>✓</span>}
                </button>
              ))}
            </div>
            {payGroup==="transfer"&&banks.length>0&&(
              <div style={{marginTop:14}}>
                <p style={{fontSize:12,fontWeight:800,color:"#64748B",marginBottom:8}}>Pilih Bank:</p>
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  {banks.map(b=>(
                    <button key={b.k} onClick={()=>setPayDetail(`${b.k} — ${b.n}${b.a?" (a/n "+b.a+")":""}`)} style={{padding:"11px 14px",borderRadius:12,border:`1.5px solid ${payDetail.startsWith(b.k)?"var(--c-primary,#2563EB)":"#E2E8F4"}`,background:payDetail.startsWith(b.k)?"#EFF6FF":"#fff",cursor:"pointer",textAlign:"left",transition:"all .2s"}}>
                      <p style={{fontWeight:800,fontSize:13}}>{b.k}</p>
                      <p style={{fontSize:12,color:"#64748B",fontWeight:600}}>{b.n}{b.a?" · "+b.a:""}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {payGroup==="ewallet"&&ewallets.length>0&&(
              <div style={{marginTop:14}}>
                <p style={{fontSize:12,fontWeight:800,color:"#64748B",marginBottom:8}}>Pilih E-Wallet:</p>
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  {ewallets.map(e=>(
                    <button key={e.k} onClick={()=>setPayDetail(`${e.k} — ${e.n}`)} style={{padding:"11px 14px",borderRadius:12,border:`1.5px solid ${payDetail.startsWith(e.k)?"var(--c-primary,#2563EB)":"#E2E8F4"}`,background:payDetail.startsWith(e.k)?"#EFF6FF":"#fff",cursor:"pointer",textAlign:"left",transition:"all .2s"}}>
                      <p style={{fontWeight:800,fontSize:13}}>{e.k}</p>
                      <p style={{fontSize:12,color:"#64748B",fontWeight:600}}>{e.n}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {payGroup==="qris"&&qrisImg&&(
              <div style={{marginTop:14,textAlign:"center"}}>
                <p style={{fontSize:12,fontWeight:800,color:"#64748B",marginBottom:10}}>Scan QR untuk bayar:</p>
                <img src={qrisImg} alt="QRIS" style={{maxWidth:220,margin:"0 auto",borderRadius:12,border:"2px solid #E2E8F4"}}/>
                {!qrisDone?(
                  <div style={{marginTop:12}}>
                    <p style={{fontSize:12,color:"#64748B"}}>Bayar dalam: <span style={{fontWeight:900,color:qrisTimer<60?"#EF4444":"#059669"}}>{Math.floor(qrisTimer/60)}:{String(qrisTimer%60).padStart(2,"0")}</span></p>
                    <button onClick={()=>setQrisDone(true)} className="btn btn-green" style={{marginTop:10}}>✅ Saya Sudah Bayar</button>
                  </div>
                ):(
                  <div style={{background:"#D1FAE5",borderRadius:11,padding:"10px 14px",marginTop:10}}>
                    <p style={{color:"#065F46",fontWeight:800,fontSize:13}}>✅ Konfirmasi pembayaran diterima!</p>
                  </div>
                )}
              </div>
            )}
            {payGroup==="cash"&&(
              <div style={{marginTop:14,background:"#FFFBEB",border:"1.5px solid #FDE68A",borderRadius:12,padding:"13px 15px"}}>
                <p style={{fontWeight:800,color:"#92400E",fontSize:13,marginBottom:5}}>💵 Informasi Bayar Tunai</p>
                <p style={{fontSize:12,color:"#B45309",lineHeight:1.65}}>Bayar langsung saat pesanan tiba atau saat ambil di toko.</p>
              </div>
            )}
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setStep(1)} className="btn btn-ghost" style={{flex:1}}>← Kembali</button>
            <button onClick={()=>{if(validate2())setStep(3);}} className="btn btn-primary" style={{flex:2}}>Review Pesanan →</button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step===3&&(
        <div className="anim-fadeIn">
          <div className="card" style={{padding:20,marginBottom:14}}>
            <h3 style={{fontWeight:900,fontSize:15,marginBottom:16}}>📋 Review & Konfirmasi</h3>
            <div style={{display:"flex",flexDirection:"column",gap:11}}>
              {[
                {icon:"👤",label:"Nama",value:form.name},
                {icon:"📞",label:"HP",value:form.phone},
                {icon:meth==="delivery"?"🚚":"🏪",label:"Pengiriman",value:meth==="delivery"?"Antar ke Rumah":"Ambil di Toko"},
                meth==="delivery"&&{icon:"📍",label:"Alamat",value:form.address},
                meth==="delivery"&&form.city&&{icon:"🏙️",label:"Kota",value:form.city},
                {icon:"💳",label:"Pembayaran",value:payDetail||payGroup},
                voucherApplied&&{icon:"🎟️",label:"Voucher",value:`${voucherApplied.code} (−${fmt(discount)})`},
              ].filter(Boolean).map((r,i)=>(
                <div key={i} style={{display:"flex",gap:11,alignItems:"flex-start"}}>
                  <span style={{fontSize:16,flexShrink:0,marginTop:1}}>{r.icon}</span>
                  <div style={{flex:1}}><p style={{fontSize:11,color:"#94A3B8",fontWeight:700,marginBottom:1}}>{r.label}</p><p style={{fontSize:13,fontWeight:800}}>{r.value}</p></div>
                </div>
              ))}
            </div>
            <div style={{borderTop:"1px solid #F1F5F9",marginTop:16,paddingTop:14}}>
              {ongkir>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}><span style={{color:"#64748B"}}>Ongkir</span><span style={{fontWeight:700}}>{fmt(ongkir)}</span></div>}
              {discount>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}><span style={{color:"#059669"}}>Diskon</span><span style={{fontWeight:700,color:"#059669"}}>−{fmt(discount)}</span></div>}
              <div style={{display:"flex",justifyContent:"space-between",paddingTop:10,borderTop:"1px solid #F1F5F9"}}>
                <span style={{fontWeight:800,fontSize:15}}>TOTAL</span>
                <span style={{fontWeight:900,fontSize:22,color:"var(--c-primary,#2563EB)"}}>{fmt(total)}</span>
              </div>
            </div>
            {errs.submit&&<p style={{color:"#EF4444",fontSize:12,fontWeight:700,marginTop:10}}>⚠️ {errs.submit}</p>}
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setStep(2)} className="btn btn-ghost" style={{flex:1}}>← Kembali</button>
            <button onClick={submit} disabled={busy} className="btn btn-primary" style={{flex:2,opacity:busy?.7:1}}>
              {busy?<><Spinner size={16}/> Memproses...</>:"✅ Konfirmasi Pesanan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══ SUCCESS ══ */
export function Success({order,onHome,onOrders}){
  const [paidDone,setPaidDone]=useState(false);
  const [busy,setBusy]=useState(false);
  const isCash=order?.payment_method==="cash";
  const items=parseProducts(order?.products);
  const handlePaid=async()=>{
    if(!order?.order_id||paidDone)return;
    setBusy(true);
    try{await updateOrderStatus(order.order_id,"menunggu_konfirmasi");await kirimNotifSudahBayar(order).catch(()=>{});setPaidDone(true);}
    catch(e){console.error(e);}
    setBusy(false);
  };
  return(
    <div style={{maxWidth:520,margin:"0 auto",padding:"24px 16px 90px",textAlign:"center"}} className="anim-fadeIn">
      <div style={{width:88,height:88,background:"linear-gradient(135deg,#059669,#10B981)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:42,boxShadow:"0 12px 40px rgba(5,150,105,0.3)"}}>✅</div>
      <h2 style={{fontWeight:900,fontSize:22,marginBottom:6}}>Pesanan Berhasil! 🎉</h2>
      <p style={{color:"#64748B",fontSize:13,marginBottom:20}}>Terima kasih <strong>{order?.customer_name}</strong>. Pesanan Anda sedang diproses.</p>
      <div className="card" style={{padding:18,marginBottom:14,textAlign:"left"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:12,paddingBottom:10,borderBottom:"1px solid #F1F5F9"}}>
          <span style={{color:"#64748B",fontSize:13}}>Order ID</span>
          <span style={{fontWeight:900,color:"var(--c-primary,#2563EB)",fontSize:13,fontFamily:"monospace"}}>{order?.order_id}</span>
        </div>
        {items.slice(0,3).map((i,idx)=>(
          <div key={idx} style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:5}}>
            <span style={{color:"#64748B"}}>{i.name} ×{i.qty}</span><span style={{fontWeight:800}}>{fmt(i.price*i.qty)}</span>
          </div>
        ))}
        {items.length>3&&<p style={{fontSize:12,color:"#94A3B8",marginTop:4}}>+{items.length-3} produk lainnya</p>}
        <div style={{borderTop:"1px solid #F1F5F9",marginTop:10,paddingTop:10,display:"flex",justifyContent:"space-between"}}>
          <span style={{fontWeight:800}}>Total</span><span style={{fontWeight:900,color:"var(--c-primary,#2563EB)",fontSize:16}}>{fmt(order?.total_price)}</span>
        </div>
      </div>
      {!isCash&&!paidDone&&(
        <div style={{background:"#FFFBEB",border:"1.5px solid #FDE68A",borderRadius:14,padding:"16px 18px",marginBottom:14,textAlign:"left"}}>
          <p style={{fontWeight:800,color:"#92400E",fontSize:13,marginBottom:6}}>💳 Sudah Transfer?</p>
          <p style={{fontSize:12,color:"#B45309",lineHeight:1.65,marginBottom:12}}>Klik tombol di bawah agar admin segera memproses pesanan Anda.</p>
          <button onClick={handlePaid} disabled={busy} className="btn btn-amber btn-block" style={{opacity:busy?.7:1}}>
            {busy?<><Spinner size={16}/> Mengirim...</>:"✅ Saya Sudah Bayar"}
          </button>
        </div>
      )}
      {paidDone&&<div style={{background:"#D1FAE5",border:"1.5px solid #A7F3D0",borderRadius:14,padding:"14px 16px",marginBottom:14}}>
        <p style={{fontWeight:900,color:"#065F46",fontSize:14}}>🔔 Konfirmasi dikirim ke admin!</p>
      </div>}
      {isCash&&<div style={{background:"#FFFBEB",border:"1.5px solid #FDE68A",borderRadius:14,padding:"14px 16px",marginBottom:14}}>
        <p style={{fontWeight:900,color:"#92400E",fontSize:14}}>💵 Bayar Tunai / COD</p>
        <p style={{fontSize:12,color:"#B45309",marginTop:4}}>Siapkan pembayaran sebesar <strong>{fmt(order?.total_price)}</strong> saat pesanan tiba.</p>
      </div>}
      <div style={{display:"flex",gap:10}}>
        <button onClick={onOrders} className="btn btn-secondary" style={{flex:1}}>📦 Cek Pesanan</button>
        <button onClick={onHome} className="btn btn-primary" style={{flex:1}}>🛒 Belanja Lagi</button>
      </div>
    </div>
  );
}

/* ══ ORDERS ══ */
export function Orders({orders,customerId,onHome}){
  const [detail,setDetail]=useState(null);
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("semua");
  const [cancel,setCancel]=useState(null);
  const [busy,setBusy]=useState(false);
  const [paidId,setPaidId]=useState(null);

  const myOrders=customerId?orders.filter(o=>o.customer_id===customerId):orders;
  const statuses=["semua","diproses","menunggu_bayar","menunggu_konfirmasi","dikirim","selesai","dibatalkan"];
  const statusLabel={semua:"Semua",diproses:"Diproses",menunggu_bayar:"Menunggu Bayar",menunggu_konfirmasi:"Menunggu Konfirmasi",dikirim:"Dikirim",selesai:"Selesai",dibatalkan:"Dibatalkan"};

  const filtered=myOrders.filter(o=>(filter==="semua"||o.order_status===filter)&&(o.order_id.toLowerCase().includes(search.toLowerCase())||o.customer_name?.toLowerCase().includes(search.toLowerCase())));

  const doCancel=async()=>{
    if(!cancel)return;setBusy(true);
    try{await updateOrderStatus(cancel.order_id,"dibatalkan");await kirimNotifBatalPesanan(cancel).catch(()=>{});setCancel(null);if(detail?.order_id===cancel.order_id)setDetail(p=>({...p,order_status:"dibatalkan"}));}
    catch(e){console.error(e);}
    setBusy(false);
  };
  const doPaid=async(ord)=>{
    setPaidId(ord.order_id);
    try{await updateOrderStatus(ord.order_id,"menunggu_konfirmasi");await kirimNotifSudahBayar(ord).catch(()=>{});if(detail?.order_id===ord.order_id)setDetail(p=>({...p,order_status:"menunggu_konfirmasi"}));}
    catch(e){console.error(e);}
    setPaidId(null);
  };

  if(!myOrders.length)return(<div className="pw"><Empty icon="📦" title="Belum ada pesanan" desc="Yuk mulai belanja sekarang!" action={<button className="btn btn-primary" onClick={onHome}>Mulai Belanja</button>}/></div>);

  return(
    <div style={{maxWidth:680,margin:"0 auto",padding:"18px 16px 90px"}}>
      {!detail?(
        <>
          <h2 style={{fontWeight:900,fontSize:18,marginBottom:16}}>📦 Pesanan Saya</h2>
          <div style={{position:"relative",marginBottom:12}}>
            <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",fontSize:14,color:"#94A3B8"}}>🔍</span>
            <input className="inp" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari Order ID atau nama..." style={{paddingLeft:36,fontSize:13}}/>
          </div>
          <div className="noscroll" style={{display:"flex",gap:6,overflowX:"auto",marginBottom:14,paddingBottom:2}}>
            {statuses.map(s=>(
              <button key={s} onClick={()=>setFilter(s)} style={{flexShrink:0,padding:"5px 12px",borderRadius:99,border:`1.5px solid ${filter===s?"var(--c-primary,#2563EB)":"#E2E8F4"}`,background:filter===s?"var(--c-primary,#2563EB)":"#fff",color:filter===s?"#fff":"#64748B",fontWeight:700,fontSize:11,cursor:"pointer",transition:"all .2s",whiteSpace:"nowrap"}}>{statusLabel[s]}</button>
            ))}
          </div>
          {filtered.length===0?<Empty icon="🔍" title="Tidak ada pesanan" desc={`Status: ${statusLabel[filter]}`}/>:
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {filtered.map(o=>(
                <div key={o.order_id} className="card" style={{padding:16,cursor:"pointer",transition:"all .2s"}} onClick={()=>setDetail(o)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <div>
                      <p style={{fontWeight:900,color:"var(--c-primary,#2563EB)",fontSize:13,fontFamily:"monospace",marginBottom:3}}>{o.order_id}</p>
                      <p style={{fontSize:12,color:"#94A3B8"}}>{o.order_date}</p>
                    </div>
                    <StatusBadge status={o.order_status}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <p style={{fontSize:13,color:"#64748B",fontWeight:600}}>{parseProducts(o.products).length} item</p>
                    <p style={{fontWeight:900,fontSize:15,color:"var(--c-primary,#2563EB)"}}>{fmt(o.total_price)}</p>
                  </div>
                  {o.order_status==="diproses"&&<button onClick={e=>{e.stopPropagation();setCancel(o);}} className="btn btn-danger btn-sm" style={{marginTop:10}}>Batalkan Pesanan</button>}
                  {o.order_status==="menunggu_bayar"&&<button onClick={e=>{e.stopPropagation();doPaid(o);}} disabled={paidId===o.order_id} className="btn btn-amber btn-sm" style={{marginTop:10,opacity:paidId===o.order_id?.7:1}}>{paidId===o.order_id?"...":"✅ Sudah Bayar"}</button>}
                </div>
              ))}
            </div>
          }
        </>
      ):(
        <div className="anim-fadeIn">
          <button onClick={()=>setDetail(null)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--c-primary,#2563EB)",fontWeight:800,fontSize:13,display:"flex",alignItems:"center",gap:5,marginBottom:16}}>← Kembali</button>
          <div className="card" style={{padding:20,marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div><p style={{fontSize:12,color:"#94A3B8",marginBottom:2}}>Order ID</p><p style={{fontWeight:900,color:"var(--c-primary,#2563EB)",fontFamily:"monospace"}}>{detail.order_id}</p></div>
              <StatusBadge status={detail.order_status}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
              {[{l:"Tanggal",v:detail.order_date},{l:"Pengiriman",v:detail.delivery_method==="delivery"?"🚚 Antar Rumah":"🏪 Ambil Toko"},{l:"Pembayaran",v:detail.pay_detail||detail.payment_method},detail.pickup_code&&{l:"Kode Pickup",v:detail.pickup_code}].filter(Boolean).map((r,i)=>(
                <div key={i} style={{background:"#F8FAFC",borderRadius:10,padding:"10px 12px"}}>
                  <p style={{fontSize:11,color:"#94A3B8",fontWeight:700,marginBottom:3}}>{r.l}</p>
                  <p style={{fontSize:13,fontWeight:800}}>{r.v}</p>
                </div>
              ))}
            </div>
            <h4 style={{fontWeight:800,fontSize:13,marginBottom:10}}>Produk dipesan:</h4>
            {parseProducts(detail.products).map((item,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #F1F5F9",fontSize:13}}>
                <div style={{flex:1}}><p style={{fontWeight:700}}>{item.name}</p><p style={{color:"#64748B",fontSize:12}}>{fmt(item.price)} × {item.qty}</p></div>
                <p style={{fontWeight:900,color:"var(--c-primary,#2563EB)"}}>{fmt(item.price*item.qty)}</p>
              </div>
            ))}
            <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:4}}>
              {detail.discount_amount>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13}}><span style={{color:"#059669"}}>Diskon</span><span style={{fontWeight:700,color:"#059669"}}>−{fmt(detail.discount_amount)}</span></div>}
              <div style={{display:"flex",justifyContent:"space-between",paddingTop:8,borderTop:"1px solid #F1F5F9"}}><span style={{fontWeight:800}}>TOTAL</span><span style={{fontWeight:900,fontSize:18,color:"var(--c-primary,#2563EB)"}}>{fmt(detail.total_price)}</span></div>
            </div>
          </div>
          {detail.order_status==="diproses"&&<button onClick={()=>setCancel(detail)} className="btn btn-danger btn-block" style={{marginBottom:10}}>Batalkan Pesanan</button>}
          {(detail.order_status==="diproses"||detail.order_status==="menunggu_bayar")&&detail.payment_method!=="cash"&&(
            <button onClick={()=>doPaid(detail)} disabled={paidId===detail.order_id} className="btn btn-amber btn-block" style={{marginBottom:10,opacity:paidId===detail.order_id?.7:1}}>
              {paidId===detail.order_id?<><Spinner size={16}/> Mengirim...</>:"✅ Saya Sudah Bayar"}
            </button>
          )}
        </div>
      )}
      {cancel&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setCancel(null)}>
          <div style={{background:"#fff",borderRadius:20,padding:24,maxWidth:360,width:"100%",animation:"scaleIn .3s cubic-bezier(.34,1.56,.64,1)"}} onClick={e=>e.stopPropagation()}>
            <div style={{textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:40,marginBottom:10}}>⚠️</div>
              <h3 style={{fontWeight:900,fontSize:17,marginBottom:6}}>Batalkan Pesanan?</h3>
              <p style={{color:"#64748B",fontSize:13}}>Pesanan <strong>{cancel.order_id}</strong> akan dibatalkan.</p>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setCancel(null)} className="btn btn-ghost" style={{flex:1}}>Tidak</button>
              <button onClick={doCancel} disabled={busy} className="btn btn-danger" style={{flex:1,opacity:busy?.7:1}}>{busy?"Memproses...":"Ya, Batalkan"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══ BOTTOM NAV ══ */
export function BottomNav({page,setPage,cartCount}){
  const tabs=[{id:"home",icon:"🏠",label:"Beranda"},{id:"cart",icon:"🛒",label:"Keranjang",count:cartCount},{id:"orders",icon:"📦",label:"Pesanan"},{id:"auth",icon:"👤",label:"Akun"}];
  return(
    <div className="bottom-nav">
      {tabs.map(t=>(
        <button key={t.id} onClick={()=>setPage(t.id)} className={`bnb ${page===t.id?"active":""}`} style={{position:"relative"}}>
          <span style={{fontSize:20,position:"relative"}}>
            {t.icon}{t.count>0&&<span style={{position:"absolute",top:-6,right:-8,background:"#EF4444",color:"#fff",borderRadius:99,minWidth:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:900,padding:"0 3px"}}>{t.count}</span>}
          </span>
          <span className="bnb-label">{t.label}</span>
          {page===t.id&&<div className="bnb-dot" style={{position:"absolute",bottom:3}}/>}
        </button>
      ))}
    </div>
  );
}

/* ══ WA FLOAT ══ */
export function WAFloatButton({settings}){
  const [open,setOpen]=useState(false);
  const wa=sanitizeWA(settings?.wa_number||"");
  const name=settings?.wa_name||"Admin KIOS REFRES";
  if(!wa)return null;
  return(
    <div style={{position:"fixed",bottom:80,right:16,zIndex:200}}>
      {open&&(
        <div style={{position:"absolute",bottom:60,right:0,background:"#fff",borderRadius:16,padding:16,width:240,boxShadow:"0 12px 40px rgba(0,0,0,0.15)",border:"1px solid #E2E8F4",animation:"scaleIn .2s ease"}}>
          <p style={{fontSize:12,fontWeight:800,color:"#64748B",marginBottom:5}}>Chat dengan</p>
          <p style={{fontWeight:900,fontSize:14,marginBottom:12}}>💬 {name}</p>
          <a href={`https://wa.me/${wa}?text=${encodeURIComponent("Halo, saya mau tanya mengenai produk di "+(settings?.store_name||"KIOS REFRES"))}`} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"#25D366",color:"#fff",padding:"11px 16px",borderRadius:12,fontWeight:800,fontSize:14,textDecoration:"none"}}>
            <span style={{fontSize:18}}>📱</span> Mulai Chat
          </a>
        </div>
      )}
      <button onClick={()=>setOpen(p=>!p)} style={{width:52,height:52,borderRadius:"50%",background:"#25D366",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,boxShadow:"0 6px 20px rgba(37,211,102,0.4)",transition:"all .2s",transform:open?"scale(1.1)":"scale(1)"}}>
        {open?"✕":"💬"}
      </button>
    </div>
  );
}