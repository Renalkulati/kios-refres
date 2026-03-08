import { supabase } from "./supabase.js";

/* ══════ PRODUCTS ══════ */
export async function fetchProducts() {
  const { data, error } = await supabase.from("products").select("*").order("id");
  if (error) throw error;
  return data;
}
export async function addProduct(product) {
  const { data, error } = await supabase.from("products").insert([product]).select().single();
  if (error) throw error;
  return data;
}
export async function updateProduct(id, updates) {
  const { data, error } = await supabase.from("products").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
export async function deleteProduct(id) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}
export async function decreaseStock(cartItems) {
  for (const item of cartItems) {
    const { data: prod } = await supabase.from("products").select("stock, sold").eq("id", item.id).single();
    if (prod) {
      await supabase.from("products").update({
        stock: Math.max(0, prod.stock - item.qty),
        sold: (prod.sold || 0) + item.qty,
      }).eq("id", item.id);
    }
  }
}

/* ══════ ORDERS ══════ */
export async function fetchOrders() {
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function createOrder(order) {
  const { data, error } = await supabase.from("orders").insert([{
    order_id:        order.order_id,
    customer_name:   order.customer_name,
    phone:           order.phone,
    products:        order.products,
    total_price:     order.total_price,
    delivery_method: order.delivery_method,
    address:         order.address,
    pickup_code:     order.pickup_code,
    order_status:    order.order_status,
    order_date:      order.order_date,
    payment_method:  order.payment_method,
    pay_detail:      order.pay_detail,
  }]).select().single();
  if (error) throw error;
  return data;
}
export async function updateOrderStatus(orderId, status) {
  const { error } = await supabase.from("orders").update({ order_status: status }).eq("order_id", orderId);
  if (error) throw error;
}

/* ══════ REALTIME ══════
   Setiap pemanggil mendapat channel name UNIK
   supaya tidak bertabrakan antara customer & admin
══════════════════════ */
export function subscribeOrders(onInsert, onUpdate) {
  // Nama channel unik pakai timestamp supaya customer & admin tidak bentrok
  const channelName = "orders-ch-" + Math.random().toString(36).slice(2, 8);
  return supabase
    .channel(channelName)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" },
      payload => onInsert(payload.new)
    )
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" },
      payload => onUpdate(payload.new)
    )
    .subscribe((status) => {
      console.log("[Supabase Realtime Orders]", channelName, status);
    });
}

export function subscribeProducts(onChange) {
  const channelName = "products-ch-" + Math.random().toString(36).slice(2, 8);
  return supabase
    .channel(channelName)
    .on("postgres_changes", { event: "*", schema: "public", table: "products" },
      payload => onChange(payload)
    )
    .subscribe((status) => {
      console.log("[Supabase Realtime Products]", channelName, status);
    });
}

/* ══════ CUSTOMER AUTH ══════ */

// Daftar akun baru
export async function registerCustomer({ username, phone, password }) {
  // Cek username sudah ada
  const { data: existing } = await supabase
    .from("customers")
    .select("id")
    .eq("username", username)
    .single();
  if (existing) throw new Error("Username sudah dipakai, coba yang lain");

  // Cek phone sudah ada
  const { data: existPhone } = await supabase
    .from("customers")
    .select("id")
    .eq("phone", phone)
    .single();
  if (existPhone) throw new Error("Nomor HP sudah terdaftar");

  const { data, error } = await supabase
    .from("customers")
    .insert([{ username, phone, password }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Login customer
export async function loginCustomer({ username, password }) {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .single();
  if (error || !data) throw new Error("Username atau password salah");
  return data;
}

// Ambil pesanan milik customer tertentu
export async function fetchMyOrders(customerId) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
