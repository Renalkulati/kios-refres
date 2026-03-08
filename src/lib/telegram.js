const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const CHAT_ID   = import.meta.env.VITE_TELEGRAM_CHAT_ID;

function fmt(n) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

export async function kirimStrukTelegram(order) {
  if (!BOT_TOKEN || !CHAT_ID) return;

  const produkList = order.products
    .map(p => `  • ${p.name} ×${p.qty}\n    ${fmt(p.price)} × ${p.qty} = *${fmt(p.price * p.qty)}*`)
    .join("\n");

  const isPengiriman = order.delivery_method !== "pickup";
  const pengirimanDetail = isPengiriman
    ? `🚚 *DELIVERY*\n📍 Alamat: ${order.address || "-"}`
    : `🏪 *AMBIL DI TOKO*\n🔑 Kode Ambil: \`${order.pickup_code}\``;

  const bayarDetail = order.payment_method?.startsWith("Transfer")
    ? `💳 ${order.payment_method}\n   _(Menunggu konfirmasi transfer)_`
    : order.payment_method === "QRIS"
    ? `📱 QRIS\n   _(Pembayaran via QRIS)_`
    : `💰 ${order.payment_method}`;

  const subtotal = order.products.reduce((s,p) => s + p.price * p.qty, 0);
  const ongkir   = order.total_price - subtotal;

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
Subtotal : ${fmt(subtotal)}${ongkir > 0 ? `\nOngkir   : ${fmt(ongkir)}` : ""}
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

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: pesan, parse_mode: "Markdown" }),
    });
    const data = await res.json();
    if (!data.ok) console.error("Telegram error:", data);
    else console.log("Struk terkirim ke Telegram ✅");
  } catch (e) {
    console.error("Gagal kirim Telegram:", e);
  }
}