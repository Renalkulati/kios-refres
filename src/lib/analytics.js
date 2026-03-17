/* ══════════════════════════════════════════════
   ANALYTICS & LAPORAN
   Fungsi-fungsi untuk dashboard laporan owner
   ══════════════════════════════════════════════ */
import { supabase } from "./supabase.js";

export async function fetchOrderStats(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  if (error) return null;
  const orders = data || [];

  // Omzet per hari
  const byDay = {};
  orders.forEach(o => {
    const d = (o.created_at || o.order_date || "").slice(0, 10);
    if (!d) return;
    if (!byDay[d]) byDay[d] = { date: d, revenue: 0, count: 0 };
    byDay[d].revenue += o.total_price || 0;
    byDay[d].count   += 1;
  });

  // Status breakdown
  const statusCount = { diproses: 0, dikirim: 0, selesai: 0, dibatalkan: 0 };
  orders.forEach(o => { if (statusCount[o.order_status] !== undefined) statusCount[o.order_status]++; });

  // Metode pembayaran
  const paymentCount = {};
  orders.forEach(o => {
    const m = o.payment_method || "Lainnya";
    paymentCount[m] = (paymentCount[m] || 0) + 1;
  });

  // Total revenue hanya dari order selesai
  const totalRevenue  = orders.filter(o => o.order_status === "selesai").reduce((s,o) => s + o.total_price, 0);
  const totalOrders   = orders.length;
  const successRate   = totalOrders ? Math.round((statusCount.selesai / totalOrders) * 100) : 0;
  const avgOrderValue = statusCount.selesai ? Math.round(totalRevenue / statusCount.selesai) : 0;

  return {
    dailyData:    Object.values(byDay).slice(-days),
    statusCount,
    paymentCount,
    totalRevenue,
    totalOrders,
    successRate,
    avgOrderValue,
  };
}

export async function fetchProductStats() {
  const { data, error } = await supabase.from("products").select("*");
  if (error) return null;
  const products = data || [];

  const totalProducts  = products.length;
  const outOfStock     = products.filter(p => p.stock === 0).length;
  const lowStock       = products.filter(p => p.stock > 0 && p.stock < 10).length;
  const topSelling     = [...products].sort((a,b) => b.sold - a.sold).slice(0, 5);
  const totalInventory = products.reduce((s,p) => s + p.stock, 0);

  return { totalProducts, outOfStock, lowStock, topSelling, totalInventory };
}