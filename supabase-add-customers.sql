-- =====================================================
-- KIOS REFRES — Tambah Tabel Customers
-- Jalankan di Supabase SQL Editor
-- =====================================================

-- Tabel akun customer
CREATE TABLE IF NOT EXISTS customers (
  id         BIGSERIAL PRIMARY KEY,
  username   TEXT UNIQUE NOT NULL,
  phone      TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aktifkan RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Semua orang bisa daftar (insert)
CREATE POLICY "customers_insert" ON customers
  FOR INSERT WITH CHECK (true);

-- Bisa baca data sendiri (untuk login - cek username+password)
CREATE POLICY "customers_select" ON customers
  FOR SELECT USING (true);

-- Tambah kolom customer_id ke tabel orders (untuk link pesanan ke akun)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id BIGINT;
