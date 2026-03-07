import { useState, useEffect } from "react";

/* ── TOAST SYSTEM ── */
export function useToast() {
  const [list, setList] = useState([]);
  const add = (msg, type="ok") => {
    const id = Date.now();
    setList(p => [...p, {id, msg, type}]);
    setTimeout(() => setList(p => p.filter(t => t.id !== id)), 3200);
  };
  const remove = id => setList(p => p.filter(t => t.id !== id));
  return { list, add, remove };
}
export function ToastBox({ list, remove }) {
  const icons = { ok:"✅", err:"❌", info:"ℹ️" };
  return (
    <div className="toast-box">
      {list.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => remove(t.id)} style={{cursor:"pointer"}}>
          <span>{icons[t.type]||"ℹ️"}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

/* ── SPINNER ── */
export function Spinner({ size=28 }) {
  return <div style={{width:size,height:size,border:"3px solid #E2E8F4",borderTopColor:"#2563EB",borderRadius:"50%",animation:"spin .7s linear infinite",flexShrink:0}} />;
}

/* ── SKELETON ── */
export function Skel({ w="100%", h=16, r=8 }) {
  return <div className="skel" style={{width:w,height:h,borderRadius:r}} />;
}

/* ── MODAL ── */
export function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  if (!open) return null;
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="modal-wrap">
        <div className="modal">
          <div style={{padding:"20px 22px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            {title && <h3 style={{fontWeight:900,fontSize:17}}>{title}</h3>}
            <button onClick={onClose} style={{background:"#F1F5F9",border:"none",cursor:"pointer",width:32,height:32,borderRadius:"50%",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",color:"#64748B",marginLeft:"auto"}}>×</button>
          </div>
          <div style={{padding:"16px 22px"}}>{children}</div>
          {footer && <div style={{padding:"0 22px 20px",display:"flex",gap:8,justifyContent:"flex-end"}}>{footer}</div>}
        </div>
      </div>
    </>
  );
}

/* ── CONFIRM ── */
export function Confirm({ open, onClose, onOk, title, msg, danger }) {
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Batal</button>
        <button className={`btn btn-sm ${danger?"btn-danger":"btn-primary"}`} onClick={() => { onOk(); onClose(); }}>
          {danger ? "Hapus" : "OK"}
        </button>
      </>}
    >
      <p style={{color:"#64748B",fontSize:14,lineHeight:1.65}}>{msg}</p>
    </Modal>
  );
}

/* ── EMPTY STATE ── */
export function Empty({ icon="📦", title, desc, action }) {
  return (
    <div style={{textAlign:"center",padding:"56px 20px"}} className="anim-fadeIn">
      <div style={{fontSize:50,marginBottom:12}}>{icon}</div>
      <p style={{fontWeight:800,fontSize:16,marginBottom:4}}>{title}</p>
      {desc && <p style={{color:"#64748B",fontSize:13,marginBottom:18}}>{desc}</p>}
      {action}
    </div>
  );
}

/* ── STARS ── */
export function Stars({ val=5 }) {
  return (
    <span style={{display:"inline-flex",gap:1}}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{fontSize:11}}>{i<=Math.round(val)?"⭐":"☆"}</span>
      ))}
    </span>
  );
}

/* ── FIELD ── */
export function Field({ label, err, children, style }) {
  return (
    <div style={{marginBottom:13,...style}}>
      {label && <label style={{display:"block",fontSize:12,fontWeight:800,color:"#64748B",marginBottom:5}}>{label}</label>}
      {children}
      {err && <p style={{color:"#EF4444",fontSize:11,marginTop:3,fontWeight:700}}>{err}</p>}
    </div>
  );
}

/* ── STAT CARD ── */
export function StatCard({ icon, label, value, sub, color="#2563EB", bg="#EFF6FF" }) {
  return (
    <div className="card anim-fadeUp" style={{padding:18}}>
      <div style={{width:44,height:44,background:bg,borderRadius:13,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,marginBottom:12}}>{icon}</div>
      <p style={{fontSize:22,fontWeight:900,color,marginBottom:2}}>{value}</p>
      <p style={{fontSize:12,fontWeight:700,color:"#64748B"}}>{label}</p>
      {sub && <p style={{fontSize:11,color:"#94A3B8",marginTop:2}}>{sub}</p>}
    </div>
  );
}

/* ── ORDER STATUS BADGE ── */
export function StatusBadge({ status }) {
  const map = {diproses:{c:"b-amber",i:"🟡"},dikirim:{c:"b-blue",i:"🔵"},selesai:{c:"b-green",i:"🟢"},dibatalkan:{c:"b-red",i:"🔴"}};
  const s = map[status] || map.diproses;
  return <span className={`badge ${s.c}`}>{s.i} {status}</span>;
}
