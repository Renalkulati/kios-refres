/* ══════════════════════════════════════════════
   SIMPLE HASH UTILITY
   Menggunakan SHA-256 via Web Crypto API
   (bawaan browser, tidak perlu library)
   ══════════════════════════════════════════════ */

export async function hashPassword(plain) {
  const encoder = new TextEncoder();
  // Tambah salt tetap agar tidak bisa di-reverse dengan rainbow table
  const salted = "kiosrefres_salt_2024_" + plain;
  const data = encoder.encode(salted);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPassword(plain, hashed) {
  // Cek apakah hashed adalah plain text lama (migrasi)
  // Jika hashed bukan 64 karakter hex → itu password lama (plain text)
  if (!hashed || hashed.length !== 64) {
    // Password lama (plain text) - cocokkan langsung, nanti di-hash saat login
    return plain === hashed;
  }
  const computed = await hashPassword(plain);
  return computed === hashed;
}