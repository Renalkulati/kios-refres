// api/telegram-webhook.js
// Vercel Serverless Function — menerima balasan dari Telegram

const TELEGRAM_TOKEN = process.env.VITE_TELEGRAM_BOT_TOKEN;
const SUPABASE_URL   = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY   = process.env.VITE_SUPABASE_ANON_KEY;

async function updateOrderStatus(orderId, status) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?order_id=eq.${orderId}`, {
    method: "PATCH",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    body: JSON.stringify({ order_status: status }),
  });
  return res.ok;
}

async function sendTelegram(chatId, text) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).json({ ok: true });

  try {
    const { message } = req.body;
    if (!message || !message.text) return res.status(200).json({ ok: true });

    const chatId = message.chat.id.toString();
    const text   = message.text.trim();

    // Format balasan: "1 ORD-xxx" atau "2 ORD-xxx" atau "3 ORD-xxx"
    const match = text.match(/^([123])\s+(ORD-\S+)/i);
    if (!match) {
      await sendTelegram(chatId,
        "⚠️ Format salah!\n\nBalas dengan format:\n`1 ORD-xxxxx` → Dikirim\n`2 ORD-xxxxx` → Selesai\n`3 ORD-xxxxx` → Dibatalkan"
      );
      return res.status(200).json({ ok: true });
    }

    const angka   = match[1];
    const orderId = match[2].toUpperCase();
    const statusMap = { "1": "dikirim", "2": "selesai", "3": "dibatalkan" };
    const labelMap  = { "1": "🚚 Dikirim", "2": "✅ Selesai", "3": "❌ Dibatalkan" };
    const status = statusMap[angka];

    const ok = await updateOrderStatus(orderId, status);
    if (ok) {
      await sendTelegram(chatId,
        `${labelMap[angka]} *${orderId}* berhasil diupdate ke *${status}*!`
      );
    } else {
      await sendTelegram(chatId,
        `❌ Gagal update *${orderId}*. Pastikan Order ID benar.`
      );
    }
  } catch (e) {
    console.error("Webhook error:", e);
  }

  return res.status(200).json({ ok: true });
}