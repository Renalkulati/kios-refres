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
  const { data, error } = await supabase
    .from("orders").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchMyOrders(customerId) {
  const { data, error } = await supabase
    .from("orders").select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createOrder(order) {
  const payload = {
    order_id:        order.order_id,
    customer_name:   order.customer_name,
    phone:           order.phone,
    products:        order.products,
    total_price:     order.total_price,
    delivery_method: order.delivery_method,
    address:         order.address || null,
    pickup_code:     order.pickup_code || null,
    order_status:    order.order_status || "diproses",
    order_date:      order.order_date,
    payment_method:  order.payment_method,
    pay_detail:      order.pay_detail || null,
    customer_id:     order.customer_id || null,
  };
  console.log("[createOrder] payload:", payload);
  const { data, error } = await supabase.from("orders").insert([payload]).select().single();
  if (error) { console.error("[createOrder] error:", error); throw error; }
  console.log("[createOrder] success:", data);
  return data;
}

export async function updateOrderStatus(orderId, status) {
  console.log("[updateOrderStatus]", orderId, "->", status);
  const { data, error } = await supabase
    .from("orders").update({ order_status: status })
    .eq("order_id", orderId).select().single();
  if (error) { console.error("[updateOrderStatus] error:", error); throw error; }
  console.log("[updateOrderStatus] success:", data);
  return data;
}

/* ══════ REALTIME ══════ */
export function subscribeOrders(onInsert, onUpdate) {
  const channelName = "orders-" + Math.random().toString(36).slice(2, 9);
  console.log("[subscribeOrders] channel:", channelName);
  return supabase
    .channel(channelName)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" },
      payload => { console.log("[realtime INSERT]", payload.new); onInsert(payload.new); }
    )
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" },
      payload => { console.log("[realtime UPDATE]", payload.new); onUpdate(payload.new); }
    )
    .subscribe((status, err) => {
      console.log("[subscribeOrders status]", channelName, status, err || "");
    });
}

export function subscribeProducts(onChange) {
  const channelName = "products-" + Math.random().toString(36).slice(2, 9);
  return supabase
    .channel(channelName)
    .on("postgres_changes", { event: "*", schema: "public", table: "products" },
      payload => onChange(payload)
    )
    .subscribe();
}

/* ══════ CUSTOMER AUTH ══════ */
export async function registerCustomer({ username, phone, password }) {
  // Cek username
  const { data: exUser } = await supabase.from("customers")
    .select("id").eq("username", username.toLowerCase().trim()).maybeSingle();
  if (exUser) throw new Error("Username sudah dipakai, coba yang lain");

  // Cek phone
  const { data: exPhone } = await supabase.from("customers")
    .select("id").eq("phone", phone.trim()).maybeSingle();
  if (exPhone) throw new Error("Nomor HP sudah terdaftar");

  const { data, error } = await supabase.from("customers")
    .insert([{ username: username.toLowerCase().trim(), phone: phone.trim(), password }])
    .select().single();
  if (error) throw error;
  return data;
}

export async function loginCustomer({ username, password }) {
  const { data, error } = await supabase.from("customers")
    .select("*")
    .eq("username", username.toLowerCase().trim())
    .eq("password", password)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Username atau password salah");
  return data;
}

/* ══════ STORE SETTINGS ══════ */

export async function fetchSettings() {
  const { data, error } = await supabase
    .from("store_settings").select("key, value");
  if (error) throw error;
  // Ubah array [{key,value}] jadi object {key: value}
  return Object.fromEntries((data||[]).map(r => [r.key, r.value]));
}

export async function saveSetting(key, value) {
  const { error } = await supabase
    .from("store_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw error;
}

export async function saveSettings(obj) {
  // Simpan banyak setting sekaligus
  const rows = Object.entries(obj).map(([key, value]) => ({
    key, value, updated_at: new Date().toISOString()
  }));
  const { error } = await supabase
    .from("store_settings")
    .upsert(rows, { onConflict: "key" });
  if (error) throw error;
}

export function subscribeSettings(onChange) {
  const ch = "settings-" + Math.random().toString(36).slice(2,8);
  return supabase.channel(ch)
    .on("postgres_changes", { event: "*", schema: "public", table: "store_settings" },
      payload => onChange(payload)
    ).subscribe();
}