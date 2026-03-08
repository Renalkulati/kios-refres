// api/telegram-webhook.js
// Vercel Serverless Function — menerima balasan dari Telegram

const TELEGRAM_TOKEN = process.env.VITE_TELEGRAM_BOT_TOKEN;
const SUPABASE_URL   = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY   = process.env.VITE_SUPABASE_ANON_KEY;

async function getLatestPendingOrder() {
  // Ambil pesanan terbaru yang masih "diproses"
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?order_status=eq.diproses&order=created_at.desc&limit=1`,
    {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
    }
  );
  const data = await res.json();
  return data?.[0] || null;
}

async function getAllPendingOrders() {
  // Ambil semua pesanan yang masih "diproses"
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?order_status=eq.diproses&order=created_at.desc`,
    {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
    }
  );
  return await res.json() || [];
}

async function updateOrderStatus(orderId, status) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?order_id=eq.${orderId}`,
    {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      body: JSON.stringify({ order_status: status }),
    }
  );
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

function fmt(n) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).json({ ok: true });

  try {
    const { message } = req.body;
    if (!message || !message.text) return res.status(200).json({ ok: true });

    const chatId = message.chat.id.toString();
    const text   = message.text.trim();

    const statusMap = { "1": "dikirim", "2": "selesai", "3": "dibatalkan" };
    const labelMap  = { "1": "🚚 Dikirim", "2": "✅ Selesai", "3": "❌ Dibatalkan" };

    // ── Cek format: hanya angka 1/2/3 saja ──
    if (["1","2","3"].includes(text)) {
      const order = await getLatestPendingOrder();

      if (!order) {
        await sendTelegram(chatId, "📭 Tidak ada pesanan yang sedang diproses.");
        return res.status(200).json({ ok: true });
      }

      const status = statusMap[text];
      const ok = await updateOrderStatus(order.order_id, status);

      if (ok) {
        await sendTelegram(chatId,
          `${labelMap[text]} *${order.order_id}*\n👤 ${order.customer_name}\n💰 ${fmt(order.total_price)}\n\nStatus diupdate ke *${status}* ✅`
        );
      } else {
        await sendTelegram(chatId, `❌ Gagal update pesanan. Coba lagi.`);
      }
      return res.status(200).json({ ok: true });
    }

    // ── Format lengkap: "1 ORD-xxx" tetap bisa dipakai ──
    const matchFull = text.match(/^([123])\s+(ORD-\S+)/i);
    if (matchFull) {
      const status  = statusMap[matchFull[1]];
      const orderId = matchFull[2].toUpperCase();
      const ok = await updateOrderStatus(orderId, status);
      if (ok) {
        await sendTelegram(chatId,
          `${labelMap[matchFull[1]]} *${orderId}* diupdate ke *${status}* ✅`
        );
      } else {
        await sendTelegram(chatId, `❌ Order ID *${orderId}* tidak ditemukan.`);
      }
      return res.status(200).json({ ok: true });
    }

    // ── Perintah /list — lihat semua pesanan diproses ──
    if (text === "/list" || text === "list") {
      const pending = await getAllPendingOrders();
      if (!pending.length) {
        await sendTelegram(chatId, "📭 Tidak ada pesanan yang sedang diproses.");
        return res.status(200).json({ ok: true });
      }
      const list = pending.map((o, i) =>
        `${i+1}. \`${o.order_id}\`\n   👤 ${o.customer_name} — ${fmt(o.total_price)}`
      ).join("\n\n");

      await sendTelegram(chatId,
        `📋 *Pesanan Diproses (${pending.length}):*\n\n${list}\n\n` +
        `_Balas *1/2/3* untuk update pesanan TERBARU_\n` +
        `_Atau *1 ORD-xxx* untuk pesanan spesifik_`
      );
      return res.status(200).json({ ok: true });
    }

    // ── Pesan tidak dikenali ──
    await sendTelegram(chatId,
      `📌 *Perintah yang tersedia:*\n\n` +
      `*1* → 🚚 Update pesanan terbaru ke Dikirim\n` +
      `*2* → ✅ Update pesanan terbaru ke Selesai\n` +
      `*3* → ❌ Update pesanan terbaru ke Dibatalkan\n\n` +
      `*list* → 📋 Lihat semua pesanan diproses\n\n` +
      `_Atau ketik: 1 ORD-xxx untuk pesanan spesifik_`
    );

  } catch (e) {
    console.error("Webhook error:", e);
  }

  return res.status(200).json({ ok: true });
}