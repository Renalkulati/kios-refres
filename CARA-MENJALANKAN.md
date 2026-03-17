# 🛒 KIOS REFRES — Panduan Lengkap

Aplikasi web marketplace modern untuk toko KIOS REFRES.
Tampilan Customer (pembeli) + Dashboard Admin/Staff lengkap.

---

## ✅ CARA MENJALANKAN (Langkah Demi Langkah)

### 📌 SYARAT AWAL — Install Node.js

Sebelum mulai, Anda WAJIB install Node.js terlebih dahulu.
Node.js adalah software gratis yang dibutuhkan untuk menjalankan project ini.

1. Buka browser, pergi ke: https://nodejs.org
2. Klik tombol hijau besar yang bertulisan "LTS" (versi stabil)
3. Download file installer (.msi untuk Windows, .pkg untuk Mac)
4. Buka file yang sudah didownload dan klik Install / Next terus sampai selesai
5. Setelah selesai, RESTART komputer Anda

Untuk memastikan Node.js sudah terinstall:
- Buka Command Prompt (Windows) atau Terminal (Mac/Linux)
- Ketik: node --version
- Harus muncul angka versi, contoh: v20.11.0
- Ketik: npm --version
- Harus muncul angka versi, contoh: 10.2.4

---

### 📌 CARA MEMBUKA COMMAND PROMPT / TERMINAL

Windows:
- Tekan tombol Windows + R pada keyboard
- Ketik "cmd" lalu tekan Enter
- Atau: klik kanan di desktop → pilih "Open in Terminal"

Mac:
- Tekan Command + Spasi
- Ketik "Terminal" lalu tekan Enter

---

### 📌 LANGKAH MENJALANKAN PROJECT

LANGKAH 1 — Ekstrak file ZIP
  - Klik kanan file kios-refres-v4.zip
  - Pilih "Extract All" (Windows) atau "Open" (Mac)
  - Pilih lokasi folder, misalnya: C:\Users\NamaAnda\Desktop\
  - Setelah diekstrak akan ada folder bernama: kios-refres-full

LANGKAH 2 — Buka Command Prompt / Terminal di folder project
  Windows (cara mudah):
    - Buka folder kios-refres-full di File Explorer
    - Klik pada address bar (kotak path di atas)
    - Hapus semua teks dan ketik: cmd
    - Tekan Enter
    - Command Prompt akan terbuka langsung di folder project

  Mac:
    - Buka Terminal
    - Ketik: cd (dengan spasi di belakang, JANGAN tekan Enter dulu)
    - Drag folder kios-refres-full ke jendela Terminal
    - Sekarang tekan Enter

  Atau cara universal (ketik langsung di Terminal/CMD):
    cd C:\Users\NamaAnda\Desktop\kios-refres-full   (Windows)
    cd /Users/NamaAnda/Desktop/kios-refres-full     (Mac/Linux)

LANGKAH 3 — Install semua yang dibutuhkan
  Ketik perintah berikut lalu tekan Enter:

    npm install

  Tunggu sampai selesai. Ini akan mengunduh semua library yang dibutuhkan.
  Proses ini membutuhkan koneksi internet dan mungkin butuh 1-3 menit.
  Normal jika ada tulisan banyak yang muncul. Tunggu sampai kembali ke prompt.

LANGKAH 4 — Jalankan aplikasi
  Ketik perintah berikut lalu tekan Enter:

    npm run dev

  Akan muncul tulisan seperti ini:
    ➜  Local:   http://localhost:5173/
    ➜  Network: http://192.168.x.x:5173/

LANGKAH 5 — Buka di browser
  - Buka browser (Chrome, Firefox, Edge, dll)
  - Ketik di address bar: http://localhost:5173
  - Tekan Enter
  - Aplikasi KIOS REFRES akan terbuka! 🎉

---

### 📌 CARA MENGHENTIKAN APLIKASI

Di jendela Command Prompt / Terminal yang sedang berjalan:
- Tekan CTRL + C pada keyboard
- Ketik Y lalu tekan Enter (jika diminta konfirmasi)

---

### 📌 CARA MENJALANKAN LAGI (sudah pernah install)

Tidak perlu npm install lagi. Cukup:
1. Buka Command Prompt / Terminal
2. Masuk ke folder project (langkah 2 di atas)
3. Ketik: npm run dev
4. Buka browser: http://localhost:5173

---

## 👤 AKUN DEMO

=== AKUN ADMIN / STAFF ===

| Username | Password  | Role  |
|----------|-----------|-------|
| owner    | owner123  | Owner |
| staf1    | staf123   | Staff |
| staf2    | staf456   | Staff |

Cara masuk ke dashboard admin:
1. Di halaman toko, lihat pojok KANAN BAWAH layar
2. Ada tombol kecil ⚙️ (ikon gerigi)
3. Klik tombol tersebut
4. Halaman login admin akan terbuka
5. Masukkan username dan password dari tabel di atas

---

## 🗂️ STRUKTUR FOLDER (Penjelasan Setiap File)

kios-refres-full/
│
├── index.html              ← File HTML utama (jangan diedit)
├── package.json            ← Daftar library yang dibutuhkan
├── vite.config.js          ← Konfigurasi Vite (jangan diedit)
│
└── src/
    ├── main.jsx            ← Titik awal aplikasi (jangan diedit)
    ├── App.jsx             ← Komponen utama — gabungan semua halaman
    │
    ├── styles/
    │   └── global.css      ← Semua style / tampilan (warna, font, animasi)
    │
    ├── data/
    │   └── index.js        ← Data produk awal + akun staff
    │                         ← EDIT DI SINI untuk tambah/ubah produk awal
    │
    ├── utils/
    │   └── index.js        ← Fungsi pembantu (format Rupiah, generate kode, dll)
    │
    └── components/
        ├── ui/
        │   └── index.jsx   ← Komponen UI bersama (Toast, Modal, Spinner, dll)
        │
        ├── customer/
        │   └── index.jsx   ← Semua halaman toko (Home, Detail, Cart, Checkout, dll)
        │
        └── admin/
            └── index.jsx   ← Semua halaman admin (Login, Dashboard, Produk, dll)

---

## ✨ FITUR LENGKAP

=== TAMPILAN CUSTOMER (PEMBELI) ===
✅ Splash screen animasi dengan loading bar
✅ Navbar sticky dengan pencarian real-time
✅ Hero banner menarik dengan animasi gradient
✅ Produk terlaris (top 4 berdasarkan penjualan)
✅ Filter kategori (Minuman, Snack, Makanan Instan, Kebutuhan Harian)
✅ Grid produk responsif (2 kolom HP kecil → 5 kolom desktop)
✅ Lazy loading gambar dengan efek shimmer
✅ Halaman detail produk (gambar, deskripsi, stok, rating)
✅ Keranjang belanja dengan update jumlah / hapus item
✅ Checkout 3 langkah (Pengiriman → Detail → Bayar)
✅ Pilih Delivery atau Pickup
✅ Ongkir otomatis berdasarkan kota tujuan
✅ Simulasi 3 metode pembayaran (Transfer / E-Wallet / Kartu)
✅ Kode pickup unik (REFRES-XXXXXX) setelah checkout
✅ Halaman sukses dengan ringkasan pesanan
✅ Riwayat semua pesanan
✅ Toast notification (notifikasi pop-up)
✅ Bottom navigation untuk mobile
✅ Tombol akses admin tersembunyi (⚙️ pojok kanan bawah)

=== DASHBOARD ADMIN / STAFF ===
✅ Halaman login profesional dengan demo akun
✅ Sidebar navigasi dengan info user + role
✅ Dashboard analitik (revenue, total pesanan, stok kritis)
✅ Tabel pesanan terbaru
✅ Tabel produk terlaris
✅ Manajemen produk lengkap:
   - Lihat semua produk dalam tabel
   - Filter dan cari produk
   - Tambah produk baru (dengan validasi)
   - Edit produk yang ada
   - Hapus produk (dengan konfirmasi)
✅ Manajemen pesanan lengkap:
   - Filter berdasarkan status
   - Cari berdasarkan Order ID / nama pelanggan
   - Update status pesanan (dropdown langsung di tabel)
   - Modal detail pesanan lengkap
✅ Halaman pengaturan toko
✅ Toast notification untuk setiap aksi
✅ Responsive sidebar (drawer di mobile)
✅ Tombol keluar (kembali ke toko)

---

## 🎨 DESAIN & TEKNOLOGI

- Framework    : React 18 + Vite 5
- Styling      : CSS murni dengan design system (tanpa library)
- Font         : Plus Jakarta Sans (Google Fonts)
- Animasi      : CSS keyframes (fadeIn, fadeUp, shimmer, dll)
- Warna Utama  : Biru #2563EB · Amber #F59E0B · Hijau #10B981
- Responsif    : Mobile-first, bekerja di semua ukuran layar

---

## 🔮 PENGEMBANGAN SELANJUTNYA

Jika ingin dikembangkan lebih lanjut, bisa ditambahkan:

1. DATABASE REAL — Supabase (gratis) atau Firebase
   - Produk & pesanan tersimpan permanen
   - Tidak hilang saat browser ditutup

2. PAYMENT GATEWAY — Midtrans (Indonesia)
   - Pembayaran nyata via transfer/e-wallet
   - Konfirmasi otomatis

3. UPLOAD GAMBAR — Supabase Storage atau Cloudinary
   - Upload foto produk langsung dari dashboard

4. NOTIFIKASI — Firebase Cloud Messaging
   - Notifikasi pesanan baru untuk admin
   - Update status ke pembeli

5. DEPLOY ONLINE — Vercel (gratis)
   - Website bisa diakses dari mana saja
   - Perintah: npx vercel

---

## 🆘 TROUBLESHOOTING (Jika Ada Masalah)

MASALAH: "npm tidak dikenali" atau "npm is not recognized"
SOLUSI : Node.js belum terinstall atau perlu restart komputer.
         Install Node.js dari https://nodejs.org lalu restart komputer.

MASALAH: "Cannot find module" atau error saat npm install
SOLUSI : Pastikan Anda berada di folder yang benar (ada file package.json).
         Coba hapus folder node_modules lalu jalankan npm install lagi.

MASALAH: Port 5173 already in use
SOLUSI : Ada aplikasi lain yang menggunakan port tersebut.
         Ketik: npm run dev -- --port 3000
         Lalu buka: http://localhost:3000

MASALAH: Gambar produk tidak muncul
SOLUSI : Pastikan koneksi internet aktif (gambar diambil dari Unsplash).

MASALAH: Halaman error setelah edit kode
SOLUSI : Periksa apakah ada tanda kurung atau tanda kutip yang tidak lengkap.
         Lihat pesan error di Command Prompt untuk petunjuk lebih lanjut.

---

Dibuat dengan ❤️ untuk KIOS REFRES
