// Kirim notifikasi struk ke Telegram saat pesanan baru masuk

const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const CHAT_ID   = import.meta.env.VITE_TELEGRAM_CHAT_ID;

function fmt(n) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

export async function kirimStrukTelegram(order) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn("Telegram belum dikonfigurasi");
    return;
  }

  const produkList = order.products
    .map(p => `  • ${p.name} ×${p.qty} — ${fmt(p.price * p.qty)}`)
    .join("\n");

  const pengiriman = order.delivery_method === "pickup"
    ? `🏪 Ambil di Toko\n  Kode: \`${order.pickup_code}\``
    : `🚚 Delivery\n  📍 ${order.address}`;

  const pesan = `
🛒 *PESANAN BARU — KIOS REFRES*
━━━━━━━━━━━━━━━━━━━━
📋 No: \`${order.order_id}\`
👤 Pembeli: ${order.customer_name}
📱 HP: ${order.phone}
⏰ ${order.order_date}
━━━━━━━━━━━━━━━━━━━━
📦 *PRODUK:*
${produkList}
━━━━━━━━━━━━━━━━━━━━
💰 Total: *${fmt(order.total_price)}*
💳 Bayar: ${order.payment_method}
${pengiriman}
━━━━━━━━━━━━━━━━━━━━
📝 *Update status dengan balas:*
\`1 ${order.order_id}\` → 🚚 Dikirim
\`2 ${order.order_id}\` → ✅ Selesai
\`3 ${order.order_id}\` → ❌ Dibatalkan
`.trim();

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: pesan,
        parse_mode: "Markdown",
      }),
    });
    const data = await res.json();
    if (!data.ok) console.error("Telegram error:", data);
    else console.log("Struk terkirim ke Telegram ✅");
  } catch (e) {
    console.error("Gagal kirim Telegram:", e);
  }
}