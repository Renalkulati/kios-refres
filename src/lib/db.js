import { supabase } from "./supabase.js";
import { hashPassword, verifyPassword } from "./hash.js";

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
  const { data, error } = await supabase.from("orders").insert([payload]).select().single();
  if (error) throw error;
  return data;
}
export async function updateOrderStatus(orderId, status) {
  const { data, error } = await supabase
    .from("orders").update({ order_status: status })
    .eq("order_id", orderId).select().single();
  if (error) throw error;
  return data;
}

/* ══════ REALTIME ══════ */
export function subscribeOrders(onInsert, onUpdate) {
  const ch = "orders-" + Math.random().toString(36).slice(2, 9);
  return supabase.channel(ch)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" },
      payload => onInsert(payload.new))
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" },
      payload => onUpdate(payload.new))
    .subscribe();
}
export function subscribeProducts(onChange) {
  const ch = "products-" + Math.random().toString(36).slice(2, 9);
  return supabase.channel(ch)
    .on("postgres_changes", { event: "*", schema: "public", table: "products" },
      payload => onChange(payload))
    .subscribe();
}

/* ══════ CUSTOMER AUTH (dengan hashing) ══════ */
export async function registerCustomer({ username, phone, password }) {
  const { data: exUser } = await supabase.from("customers")
    .select("id").eq("username", username.toLowerCase().trim()).maybeSingle();
  if (exUser) throw new Error("Username sudah dipakai, coba yang lain");

  const { data: exPhone } = await supabase.from("customers")
    .select("id").eq("phone", phone.trim()).maybeSingle();
  if (exPhone) throw new Error("Nomor HP sudah terdaftar");

  const hashed = await hashPassword(password);
  const { data, error } = await supabase.from("customers")
    .insert([{ username: username.toLowerCase().trim(), phone: phone.trim(), password: hashed }])
    .select().single();
  if (error) throw error;
  return data;
}

export async function loginCustomer({ username, password }) {
  const { data, error } = await supabase.from("customers")
    .select("*")
    .eq("username", username.toLowerCase().trim())
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Username atau password salah");

  const ok = await verifyPassword(password, data.password);
  if (!ok) throw new Error("Username atau password salah");

  // Migrasi otomatis: jika password masih plain text → hash sekarang
  if (data.password.length !== 64) {
    const hashed = await hashPassword(password);
    await supabase.from("customers").update({ password: hashed }).eq("id", data.id);
    data.password = hashed;
  }
  return data;
}

export async function updateCustomerPassword(id, newPassword) {
  const hashed = await hashPassword(newPassword);
  const { error } = await supabase.from("customers").update({ password: hashed }).eq("id", id);
  if (error) throw error;
}

/* ══════ STORE SETTINGS ══════ */
export async function fetchSettings() {
  const { data, error } = await supabase.from("store_settings").select("key, value");
  if (error) throw error;
  return Object.fromEntries((data||[]).map(r => [r.key, r.value]));
}
export async function saveSetting(key, value) {
  const { error } = await supabase.from("store_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw error;
}
export async function saveSettings(obj) {
  const rows = Object.entries(obj).map(([key, value]) => ({
    key, value, updated_at: new Date().toISOString()
  }));
  const { error } = await supabase.from("store_settings")
    .upsert(rows, { onConflict: "key" });
  if (error) throw error;
}
export function subscribeSettings(onChange) {
  const ch = "settings-" + Math.random().toString(36).slice(2,8);
  return supabase.channel(ch)
    .on("postgres_changes", { event: "*", schema: "public", table: "store_settings" },
      payload => onChange(payload))
    .subscribe();
}

/* ══════ STAFF ACCOUNTS (dengan hashing) ══════ */
export async function fetchStaff() {
  const { data, error } = await supabase.from("staff_accounts").select("*").order("created_at");
  if (error) throw error;
  return data || [];
}

export async function loginStaff(username, password) {
  const { data, error } = await supabase.from("staff_accounts")
    .select("*").eq("username", username).eq("is_active", true).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const ok = await verifyPassword(password, data.password);
  if (!ok) return null;

  // Migrasi otomatis plain text → hash
  if (data.password.length !== 64) {
    const hashed = await hashPassword(password);
    await supabase.from("staff_accounts").update({ password: hashed }).eq("id", data.id);
    data.password = hashed;
  }
  return data;
}

export async function saveStaff(staff) {
  const toSave = { ...staff };
  // Hash password jika dikirim plain text (bukan 64 char hex)
  if (toSave.password && toSave.password.length !== 64) {
    toSave.password = await hashPassword(toSave.password);
  }
  if (toSave.id) {
    const { error } = await supabase.from("staff_accounts").update(toSave).eq("id", toSave.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("staff_accounts").insert([toSave]);
    if (error) throw error;
  }
}

export async function deleteStaff(id) {
  const { error } = await supabase.from("staff_accounts").delete().eq("id", id);
  if (error) throw error;
}
export function subscribeStaff(onChange) {
  const ch = "staff-" + Math.random().toString(36).slice(2,8);
  return supabase.channel(ch)
    .on("postgres_changes", { event: "*", schema: "public", table: "staff_accounts" }, onChange)
    .subscribe();
}

/* ══════ CATEGORIES ══════ */
export async function fetchCategories() {
  const { data, error } = await supabase.from("categories").select("*").order("created_at");
  if (error) throw error;
  return (data||[]).map(c => c.name);
}
export async function saveCategory(name, icon="📦") {
  const { error } = await supabase.from("categories").insert([{ name, icon }]);
  if (error) throw error;
}
export async function deleteCategory(name) {
  const { error } = await supabase.from("categories").delete().eq("name", name);
  if (error) throw error;
}
export function subscribeCategories(onChange) {
  const ch = "cats-" + Math.random().toString(36).slice(2,8);
  return supabase.channel(ch)
    .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, onChange)
    .subscribe();
}

/* ══════ SUPABASE STORAGE (upload foto produk) ══════ */
export async function uploadProductImage(file) {
  // Validasi
  if (file.size > 2 * 1024 * 1024) throw new Error("Ukuran file maksimal 2MB");
  const ext = file.name.split(".").pop().toLowerCase();
  if (!["jpg","jpeg","png","webp"].includes(ext)) throw new Error("Format harus JPG/PNG/WebP");

  const fileName = `products/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from("product-images")
    .getPublicUrl(fileName);
  return urlData.publicUrl;
}

/* ══════ VOUCHER / PROMO ══════ */
// Untuk customer checkout - hanya aktif
export async function fetchVouchers() {
  const { data, error } = await supabase.from("vouchers").select("*").eq("is_active", true).order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

// Untuk admin panel - semua voucher
export async function fetchAllVouchers() {
  const { data, error } = await supabase.from("vouchers").select("*").order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

// Subscribe realtime perubahan voucher
export function subscribeVouchers(onChange) {
  const ch = "vouchers-" + Math.random().toString(36).slice(2,8);
  return supabase.channel(ch)
    .on("postgres_changes", { event: "*", schema: "public", table: "vouchers" }, onChange)
    .subscribe();
}

export async function validateVoucher(code, subtotal) {
  const { data, error } = await supabase.from("vouchers")
    .select("*").eq("code", code.toUpperCase().trim()).eq("is_active", true).maybeSingle();
  if (error || !data) throw new Error("Kode voucher tidak ditemukan atau sudah tidak aktif");
  if (data.min_purchase && subtotal < data.min_purchase)
    throw new Error(`Minimum pembelian ${new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",minimumFractionDigits:0}).format(data.min_purchase)}`);
  if (data.expires_at && new Date(data.expires_at) < new Date())
    throw new Error("Voucher sudah kadaluarsa");
  if (data.usage_limit && data.used_count >= data.usage_limit)
    throw new Error("Voucher sudah habis digunakan");
  return data;
}

export async function useVoucher(code) {
  // Ambil used_count sekarang lalu increment manual (aman & tidak butuh RPC)
  const { data } = await supabase.from("vouchers")
    .select("id, used_count")
    .eq("code", code.toUpperCase().trim())
    .maybeSingle();
  if (!data) return;
  await supabase.from("vouchers")
    .update({ used_count: (data.used_count || 0) + 1 })
    .eq("id", data.id);
}

export async function saveVoucher(v) {
  if (v.id) {
    const { error } = await supabase.from("vouchers").update(v).eq("id", v.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("vouchers").insert([v]);
    if (error) throw error;
  }
}
export async function deleteVoucher(id) {
  const { error } = await supabase.from("vouchers").delete().eq("id", id);
  if (error) throw error;
}