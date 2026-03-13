/* ─────────────────────────────────────────────────────────
   telegram.js  —  Notifikasi pesanan ke Telegram Bot
   parse_mode: "HTML" dipilih karena jauh lebih toleran
   dibanding Markdown v1 yang strict soal () [] _ * .
   ───────────────────────────────────────────────────────── */

const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const CHAT_ID   = import.meta.env.VITE_TELEGRAM_CHAT_ID;

/* Format Rupiah */
function fmt(n) {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}

/* Escape karakter HTML agar aman di dalam tag */
function esc(str) {
  return String(str || "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* Kirim ke Telegram — dengan log error detail */
async function kirimTelegram(text) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn("[Telegram] BOT_TOKEN atau CHAT_ID tidak ada. Cek env vars Vercel.");
    return;
  }

  const url  = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const body = JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "HTML" });

  try {
    const res  = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const data = await res.json();

    if (!data.ok) {
      console.error("[Telegram] API error:", {
        error_code:  data.error_code,
        description: data.description,
        preview:     text.substring(0, 300),
      });
    } else {
      console.log("[Telegram] Terkirim, message_id:", data.result?.message_id);
    }
  } catch (e) {
    console.error("[Telegram] Fetch gagal:", e.message);
  }
}

/* Parse products aman */
function parseProds(raw) {
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return []; }
}

/* ══════════════════════════════════════════════
   STRUK PESANAN BARU
══════════════════════════════════════════════ */
export async function kirimStrukTelegram(order) {
  const products = parseProds(order.products);

  const produkList = products.length
    ? products.map(p =>
        `  \u2022 <b>${esc(p.name)}</b> \u00d7${p.qty}\n` +
        `    ${fmt(p.price)} \u00d7 ${p.qty} = <b>${fmt(p.price * p.qty)}</b>`
      ).join("\n")
    : "  <i>(tidak ada produk)</i>";

  const isPickup   = order.delivery_method === "pickup";
  const pengiriman = isPickup
    ? `\ud83c\udfe6 <b>AMBIL DI TOKO</b>\n\ud83d\udd11 Kode: <code>${esc(order.pickup_code)}</code>`
    : `\ud83d\ude9a <b>ANTAR KE RUMAH</b>\n\ud83d\udccd ${esc(order.address || "-")}`;

  const pm         = (order.payment_method || "").toLowerCase();
  const isCash     = pm.includes("tunai") || pm.includes("cash") || pm.includes("cod");
  const isTransfer = pm.includes("transfer");
  const isQris     = pm.includes("qris");
  const isEwallet  = pm.includes("wallet") || pm.includes("gopay") ||
                     pm.includes("ovo")    || pm.includes("dana")  || pm.includes("shopee");

  const detailBayar = (order.pay_detail && order.pay_detail !== order.payment_method)
    ? `\n    \ud83d\udccb <i>${esc(order.pay_detail)}</i>` : "";

  const pembayaran = isTransfer
    ? `\ud83c\udfe6 <b>Transfer Bank</b>${detailBayar}\n    <i>Menunggu konfirmasi transfer</i>`
    : isQris
    ? `\ud83d\udcf7 <b>QRIS</b>\n    <i>Pembayaran via QRIS</i>`
    : isEwallet
    ? `\ud83d\udcf1 <b>E-Wallet</b>${detailBayar}\n    <i>Menunggu konfirmasi</i>`
    : isCash
    ? `\ud83d\udcb5 <b>Tunai / COD</b>\n    <i>Bayar saat barang diterima/diambil</i>`
    : `\ud83d\udcb0 ${esc(order.payment_method)}`;

  const subtotal = products.reduce((s, p) => s + (p.price * p.qty), 0);
  const discount = order.discount_amount || 0;
  const ongkir   = (order.total_price || 0) - subtotal + discount;

  const biayaLines = [
    `Subtotal : ${fmt(subtotal)}`,
    ongkir  > 0 ? `Ongkir   : ${fmt(ongkir)}`    : null,
    discount > 0 ? `Diskon   : -${fmt(discount)}` : null,
    `<b>TOTAL  : ${fmt(order.total_price)}</b>`,
  ].filter(Boolean).join("\n");

  const text = [
    "\ud83d\uded2 <b>PESANAN BARU \u2014 KIOS REFRES</b>",
    "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501",
    `\ud83d\udccb <b>No. Pesanan:</b> <code>${esc(order.order_id)}</code>`,
    `\u23f0 <b>Waktu:</b> ${esc(order.order_date)}`,
    "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501",
    "\ud83d\udc64 <b>DATA PEMBELI</b>",
    `Nama : ${esc(order.customer_name)}`,
    `HP   : ${esc(order.phone)}`,
    "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501",
    "\ud83d\udce6 <b>PRODUK DIPESAN</b>",
    produkList,
    "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501",
    "\ud83e\uddfe <b>RINCIAN BIAYA</b>",
    biayaLines,
    "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501",
    pengiriman,
    "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501",
    "\ud83d\udcb3 <b>PEMBAYARAN</b>",
    pembayaran,
    "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501",
    "\ud83d\udcdd <i>Update status, balas:</i>",
    "<code>1</code> \u2192 \ud83d\ude9a Dikirim",
    "<code>2</code> \u2192 \u2705 Selesai",
    "<code>3</code> \u2192 \u274c Dibatalkan",
  ].join("\n");

  await kirimTelegram(text);
}

/* ══════════════════════════════════════════════
   NOTIFIKASI "SAYA SUDAH BAYAR"
══════════════════════════════════════════════ */
export async function kirimNotifSudahBayar(order) {
  const pm     = (order.payment_method || "").toLowerCase();
  const isCash = pm.includes("tunai") || pm.includes("cash") || pm.includes("cod");

  const text = [
    "\ud83d\udd14 <b>KONFIRMASI PEMBAYARAN \u2014 KIOS REFRES</b>",
    "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501",
    isCash ? "\ud83d\udcb5 <b>PEMBAYARAN TUNAI</b>" : "\u2705 <b>PEMBELI KLAIM SUDAH BAYAR</b>",
    "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501",
    `\ud83d\udccb <b>No. Pesanan:</b> <code>${esc(order.order_id)}</code>`,
    `\ud83d\udc64 <b>Pembeli:</b> ${esc(order.customer_name)}`,
    `\ud83d\udcf1 <b>HP:</b> ${esc(order.phone)}`,
    `\ud83d\udcb3 <b>Metode:</b> ${esc(order.payment_method)}`,
    `\ud83d\udcb0 <b>Total: ${fmt(order.total_price)}</b>`,
    `\u23f0 <b>Waktu:</b> ${new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}`,
    "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501",
    isCash
      ? "\u2705 Pembeli konfirmasi pembayaran tunai.\n<i>Verifikasi dan update status pesanan.</i>"
      : "\ud83d\udcf8 Pembeli klaim sudah transfer.\n<i>Cek mutasi/bukti lalu konfirmasi.</i>",
    "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501",
    `<code>1 ${order.order_id}</code> \u2192 \ud83d\ude9a Dikirim`,
    `<code>2 ${order.order_id}</code> \u2192 \u2705 Selesai`,
    `<code>3 ${order.order_id}</code> \u2192 \u274c Dibatalkan`,
  ].join("\n");

  await kirimTelegram(text);
}

/* ══════════════════════════════════════════════
   NOTIFIKASI PESANAN DIBATALKAN
══════════════════════════════════════════════ */
export async function kirimNotifBatalPesanan(order) {
  const text = [
    "\u274c <b>PESANAN DIBATALKAN \u2014 KIOS REFRES</b>",
    "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501",
    `\ud83d\udccb <b>No. Pesanan:</b> <code>${esc(order.order_id)}</code>`,
    `\ud83d\udc64 <b>Pembeli:</b> ${esc(order.customer_name)}`,
    `\ud83d\udcb0 <b>Total:</b> ${fmt(order.total_price)}`,
    `\ud83d\udcb3 <b>Metode:</b> ${esc(order.payment_method)}`,
    `\u23f0 <b>Dibatalkan:</b> ${new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}`,
    "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501",
    "<i>Pesanan ini telah dibatalkan oleh pembeli.</i>",
  ].join("\n");

  await kirimTelegram(text);
}