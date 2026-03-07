import { supabase } from "./supabase.js";

/* ══════════════════════════════════════
   PRODUCTS
══════════════════════════════════════ */

// Ambil semua produk
export async function fetchProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("id");
  if (error) throw error;
  return data;
}

// Tambah produk baru
export async function addProduct(product) {
  const { data, error } = await supabase
    .from("products")
    .insert([product])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Update produk
export async function updateProduct(id, updates) {
  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Hapus produk
export async function deleteProduct(id) {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// Kurangi stok setelah pesanan (dipanggil saat checkout)
export async function decreaseStock(cartItems) {
  for (const item of cartItems) {
    const { data: prod } = await supabase
      .from("products")
      .select("stock, sold")
      .eq("id", item.id)
      .single();

    if (prod) {
      await supabase
        .from("products")
        .update({
          stock: Math.max(0, prod.stock - item.qty),
          sold: (prod.sold || 0) + item.qty,
        })
        .eq("id", item.id);
    }
  }
}

/* ══════════════════════════════════════
   ORDERS
══════════════════════════════════════ */

// Ambil semua pesanan
export async function fetchOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// Buat pesanan baru
export async function createOrder(order) {
  const { data, error } = await supabase
    .from("orders")
    .insert([{
      order_id:        order.order_id,
      customer_name:   order.customer_name,
      phone:           order.phone,
      products:        order.products,       // disimpan sebagai JSON
      total_price:     order.total_price,
      delivery_method: order.delivery_method,
      address:         order.address,
      pickup_code:     order.pickup_code,
      order_status:    order.order_status,
      order_date:      order.order_date,
      payment_method:  order.payment_method,
      pay_detail:      order.pay_detail,
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Update status pesanan
export async function updateOrderStatus(orderId, status) {
  const { error } = await supabase
    .from("orders")
    .update({ order_status: status })
    .eq("order_id", orderId);
  if (error) throw error;
}

/* ══════════════════════════════════════
   REALTIME SUBSCRIPTIONS
══════════════════════════════════════ */

// Subscribe perubahan pesanan (untuk dashboard admin)
export function subscribeOrders(onInsert, onUpdate) {
  return supabase
    .channel("orders-realtime")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" },
      payload => onInsert(payload.new)
    )
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" },
      payload => onUpdate(payload.new)
    )
    .subscribe();
}

// Subscribe perubahan produk (stok real-time)
export function subscribeProducts(onChange) {
  return supabase
    .channel("products-realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "products" },
      payload => onChange(payload)
    )
    .subscribe();
}
