export const fmt     = n  => "Rp " + Number(n).toLocaleString("id-ID");
export const genCode = () => "REFRES-" + Math.floor(100000 + Math.random() * 900000);
export const genId   = () => "ORD-" + Date.now();
export const now     = () => new Date().toISOString();
