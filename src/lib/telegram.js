const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const CHAT_ID   = import.meta.env.VITE_TELEGRAM_CHAT_ID;

function fmt(n) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

async function kirimTelegram(pesan) {
  if (!BOT_TOKEN || !CHAT_ID) return;
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: pesan, parse_mode: "Markdown" }),
    });
    const data = await res.json();
    if (!data.ok) console.error("Telegram error:", data);
  } catch (e) {
    console.error("Gagal kirim Telegram:", e);
  }
}

/* ══════ STRUK PESANAN BARU ══════ */
export async function kirimStrukTelegram(order) {
  const products = Array.isArray(order.products) ? order.products
    : (() => { try { return JSON.parse(order.products); } catch { return []; } })();

  const produkList = products
    .map(p => `  • ${p.name} ×${p.qty}\n    ${fmt(p.price)} × ${p.qty} = *${fmt(p.price * p.qty)}*`)
    .join("\n");

  const isPengiriman = order.delivery_method !== "pickup";
  const pengirimanDetail = isPengiriman
    ? `🚚 *DELIVERY*\n📍 Alamat: ${order.address || "-"}`
    : `🏪 *AMBIL DI TOKO*\n🔑 Kode Ambil: \`${order.pickup_code}\``;

  const isCash     = order.payment_method?.includes("Tunai");
  const isTransfer = order.payment_method?.startsWith("Transfer");
  const isQris     = order.payment_method === "QRIS";

  const bayarDetail = isTransfer
    ? `💳 ${order.payment_method}\n   _(Menunggu konfirmasi transfer)_`
    : isQris
    ? `📱 QRIS\n   _(Pembayaran via QRIS)_`
    : isCash
    ? `💵 ${order.payment_method}\n   _(Pembayaran tunai — belum dibayar)_`
    : `💰 ${order.payment_method}`;

  const subtotal = products.reduce((s,p) => s + p.price * p.qty, 0);
  const ongkir   = (order.total_price || 0) - subtotal;
  const discount = order.discount_amount || 0;

  const pesan = `
🛒 *PESANAN BARU — KIOS REFRES*
━━━━━━━━━━━━━━━━━━━━━━
📋 *No. Pesanan:* \`${order.order_id}\`
⏰ *Waktu:* ${order.order_date}
━━━━━━━━━━━━━━━━━━━━━━
👤 *DATA PEMBELI*
Nama  : ${order.customer_name}
HP    : ${order.phone}
━━━━━━━━━━━━━━━━━━━━━━
📦 *PRODUK DIPESAN*
${produkList}
━━━━━━━━━━━━━━━━━━━━━━
🧾 *RINCIAN BIAYA*
Subtotal : ${fmt(subtotal)}${ongkir > 0 ? `\nOngkir   : ${fmt(ongkir)}` : ""}${discount > 0 ? `\nDiskon   : -${fmt(discount)}` : ""}
*TOTAL   : ${fmt(order.total_price)}*
━━━━━━━━━━━━━━━━━━━━━━
${pengirimanDetail}
━━━━━━━━━━━━━━━━━━━━━━
💳 *PEMBAYARAN*
${bayarDetail}
━━━━━━━━━━━━━━━━━━━━━━
📝 *Update status — balas:*
\`1\` → 🚚 Dikirim
\`2\` → ✅ Selesai
\`3\` → ❌ Dibatalkan
_(atau: \`1 ${order.order_id}\` untuk pesanan spesifik)_
`.trim();

  await kirimTelegram(pesan);
}

/* ══════ NOTIFIKASI "SAYA SUDAH BAYAR" ══════ */
export async function kirimNotifSudahBayar(order) {
  const isCash = order.payment_method?.includes("Tunai");

  const pesan = `
🔔 *KONFIRMASI PEMBAYARAN — KIOS REFRES*
━━━━━━━━━━━━━━━━━━━━━━
${isCash ? "💵 *PEMBAYARAN TUNAI DITERIMA*" : "✅ *PEMBELI KLAIM SUDAH BAYAR*"}
━━━━━━━━━━━━━━━━━━━━━━
📋 *No. Pesanan:* \`${order.order_id}\`
👤 *Pembeli:* ${order.customer_name}
📱 *HP:* ${order.phone}
💳 *Metode:* ${order.payment_method}
💰 *Total:* *${fmt(order.total_price)}*
⏰ *Waktu:* ${new Date().toLocaleString("id-ID", {dateStyle:"medium",timeStyle:"short"})}
━━━━━━━━━━━━━━━━━━━━━━
${isCash
  ? `✅ Pembeli telah mengkonfirmasi pembayaran tunai.\n_Verifikasi dan update status pesanan._`
  : `📸 Pembeli mengklaim sudah melakukan pembayaran.\n_Cek mutasi/bukti transfer lalu konfirmasi._`
}
━━━━━━━━━━━━━━━━━━━━━━
📝 *Balas untuk update status:*
\`1 ${order.order_id}\` → 🚚 Dikirim
\`2 ${order.order_id}\` → ✅ Selesai
\`3 ${order.order_id}\` → ❌ Dibatalkan
`.trim();

  await kirimTelegram(pesan);
}

/* ══════ NOTIFIKASI PESANAN DIBATALKAN ══════ */
export async function kirimNotifBatalPesanan(order) {
  const pesan = `
❌ *PESANAN DIBATALKAN — KIOS REFRES*
━━━━━━━━━━━━━━━━━━━━━━
📋 *No. Pesanan:* \`${order.order_id}\`
👤 *Pembeli:* ${order.customer_name}
💰 *Total:* ${fmt(order.total_price)}
💳 *Metode:* ${order.payment_method}
⏰ *Dibatalkan:* ${new Date().toLocaleString("id-ID", {dateStyle:"medium",timeStyle:"short"})}
━━━━━━━━━━━━━━━━━━━━━━
_Pesanan ini telah dibatalkan oleh pembeli._
`.trim();

  await kirimTelegram(pesan);
}