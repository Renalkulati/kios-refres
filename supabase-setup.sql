-- =====================================================
-- KIOS REFRES — Script SQL untuk Supabase
-- Jalankan script ini di Supabase SQL Editor
-- =====================================================

-- ── TABEL PRODUK ──
CREATE TABLE IF NOT EXISTS products (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  price      INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  img        TEXT,
  stock      INTEGER NOT NULL DEFAULT 0,
  cat        TEXT,
  sold       INTEGER NOT NULL DEFAULT 0,
  rating     NUMERIC(3,1) DEFAULT 4.8,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABEL PESANAN ──
CREATE TABLE IF NOT EXISTS orders (
  id               BIGSERIAL PRIMARY KEY,
  order_id         TEXT UNIQUE NOT NULL,
  customer_name    TEXT NOT NULL,
  phone            TEXT,
  products         JSONB NOT NULL,
  total_price      INTEGER NOT NULL DEFAULT 0,
  delivery_method  TEXT,
  address          TEXT,
  pickup_code      TEXT,
  order_status     TEXT DEFAULT 'diproses',
  order_date       TEXT,
  payment_method   TEXT,
  pay_detail       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── AKTIFKAN REALTIME ──
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- ── IZIN AKSES (Row Level Security) ──
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Semua orang bisa baca produk
CREATE POLICY "products_read_all" ON products
  FOR SELECT USING (true);

-- Semua orang bisa baca pesanan (admin perlu ini)
CREATE POLICY "orders_read_all" ON orders
  FOR SELECT USING (true);

-- Semua orang bisa insert pesanan (pembeli checkout)
CREATE POLICY "orders_insert_all" ON orders
  FOR INSERT WITH CHECK (true);

-- Semua orang bisa update pesanan (admin ubah status)
CREATE POLICY "orders_update_all" ON orders
  FOR UPDATE USING (true);

-- Semua orang bisa insert produk (admin tambah produk)
CREATE POLICY "products_insert_all" ON products
  FOR INSERT WITH CHECK (true);

-- Semua orang bisa update produk (admin edit, stok berkurang)
CREATE POLICY "products_update_all" ON products
  FOR UPDATE USING (true);

-- Semua orang bisa hapus produk (admin hapus)
CREATE POLICY "products_delete_all" ON products
  FOR DELETE USING (true);

-- ── ISI DATA PRODUK AWAL ──
INSERT INTO products (name, price, description, img, stock, cat, sold, rating) VALUES
('Aqua Galon 19L', 22000, 'Air mineral berkualitas tinggi dalam kemasan galon 19L. Segar dan bersih untuk keluarga.', 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=500&h=500&fit=crop', 50, 'Minuman', 320, 4.9),
('Teh Botol Sosro 450ml', 5000, 'Teh manis segar dalam botol 450ml. Rasa original ikonik yang selalu menyegarkan kapan saja.', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&h=500&fit=crop', 100, 'Minuman', 580, 4.8),
('Indomie Goreng (Pack 5)', 16000, 'Mie instan goreng terpopuler Indonesia. Pack 5 bungkus, praktis dan ekonomis.', 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=500&h=500&fit=crop', 80, 'Makanan Instan', 410, 4.9),
('Chitato Sapi Panggang', 12000, 'Keripik kentang rasa sapi panggang yang gurih dan renyah. Cemilan favorit semua kalangan.', 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&h=500&fit=crop', 60, 'Snack', 290, 4.7),
('Sabun Lifebuoy 100g', 8500, 'Sabun mandi antibakteri melindungi dari kuman. Wangi segar tahan lama sepanjang hari.', 'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?w=500&h=500&fit=crop', 120, 'Kebutuhan Harian', 210, 4.6),
('Coca-Cola 330ml (6 Pcs)', 35000, 'Minuman bersoda segar dalam kaleng 330ml. Pack 6 kaleng, hemat dan praktis.', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&h=500&fit=crop', 45, 'Minuman', 175, 4.8),
('Pop Mie Ayam 75g', 4500, 'Mie cup instan rasa ayam lezat. Tambah air panas, siap 3 menit.', 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=500&h=500&fit=crop', 90, 'Makanan Instan', 390, 4.7),
('Oreo Original 137g', 18000, 'Biskuit sandwich krim vanilla kesukaan semua kalangan. Renyah, manis, sempurna.', 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=500&h=500&fit=crop', 55, 'Snack', 260, 4.8),
('Shampo Pantene 170ml', 22000, 'Shampo perawatan rambut formula Pro-V. Rambut lebih kuat, sehat, dan berkilau.', 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500&h=500&fit=crop', 40, 'Kebutuhan Harian', 145, 4.6),
('Kopi Kapal Api 165g', 19500, 'Kopi bubuk cita rasa kuat dan harum. Sempurna untuk memulai pagi Anda.', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&h=500&fit=crop', 75, 'Minuman', 340, 4.9);
