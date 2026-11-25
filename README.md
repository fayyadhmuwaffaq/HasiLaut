<div align="center">
  <img src="./public/logo.png" alt="Logo HasiLaut" width="120" />
  <h1>HasiLaut</h1>
  <p>
    <strong>Platform E-Commerce Hasil Tangkap Laut Segar Langsung dari Nelayan &amp; Mitra Pesisir</strong>
  </p>
  <p>
    Transaksi grosir maupun eceran dalam satuan kilogram berbasis Next.js App Router, NextAuth v5, dan PostgreSQL Raw SQL.
  </p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-16.4.6-000000?style=flat-square&logo=next.js&logoColor=white" alt="Next.js 16.4.6" />
    <img src="https://img.shields.io/badge/React-19.3.0-149ECA?style=flat-square&logo=react&logoColor=white" alt="React 19.3.0" />
    <img src="https://img.shields.io/badge/PostgreSQL-Raw_SQL-336791?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/NextAuth-v5_JWT-0F172A?style=flat-square" alt="NextAuth v5" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
  </p>
</div>

---

## Tentang Proyek

**HasiLaut** menjembatani mitra nelayan dan pelaku usaha kuliner maupun rumah tangga dalam satu platform terpadu. Seluruh pencatatan produk, pemecahan pesanan multi-toko saat checkout, verifikasi mitra oleh admin, hingga pembaruan stok dirancang menggunakan transaksi PostgreSQL eksplisit agar integritas data tetap terjaga.

---

## Fitur Utama per Peran

| Peran | Kemampuan & Alur Utama |
| :--- | :--- |
| **Publik & Pembeli (`Buyer`)** | Pencarian katalog tunggal di bilah navigasi sticky (tekan `Enter`), filter kategori, pengurutan &amp; paginasi (`/products`), detail produk beserta ulasan terverifikasi, serta halaman profil lapak nelayan (`/stores/[id]`). Mendukung keranjang belanja, multi-alamat pengiriman, checkout multi-toko otomatis (`COD` atau `Transfer Bank Manual`), pemantauan status pesanan per tab, pembatalan pesanan sebelum diproses, konfirmasi pesanan diterima (`Selesai`), ulasan produk selesai, serta pengelolaan identitas/email dan kata sandi akun. |
| **Mitra Nelayan (`Seller`)** | Pendaftaran mitra dengan alur verifikasi admin (`pending`, `approved`, `rejected`), ringkasan statistik lapak, pengelolaan profil &amp; foto dermaga, penambahan/pembaruan produk (minimal `0,5 kg`), toggle aktif/nonaktif produk mandiri tanpa menghapus riwayat pesanan (terkunci bila dinonaktifkan Admin), pemrosesan status pesanan masuk hingga dikirim (`shipped`), serta pengelolaan identitas akun &amp; kata sandi. |
| **Administrator (`Admin`)** | Ringkasan metrik sistem, antrean persetujuan/penolakan akun mitra nelayan, CRUD master kategori hasil laut, pengawasan seluruh produk lapak beserta toggle aktif/nonaktif moderasi (mengunci pengaktifan ulang oleh penjual) dan hapus produk, moderasi pengguna (`buyer` dan `seller`), serta pengaturan identitas akun &amp; kata sandi admin sendiri. |

---

## Keunggulan Teknis

- **Keamanan Akses Berlapis**: Pemisahan konfigurasi autentikasi Edge-compatible (`src/auth.config.js`) dan Server Node (`src/auth.js`), gerbang awal berbasis JWT di `src/middleware.js`, serta verifikasi ulang data pengguna terkini ke PostgreSQL di `src/lib/auth-guards.js`.
- **Checkout Multi-Toko Atomik**: Proses checkout dibungkus transaksi database (`BEGIN` / `COMMIT` / `ROLLBACK`) dengan penguncian baris deterministik (`FOR UPDATE`) untuk mencegah stok minus saat transaksi bersamaan, sekaligus memecah keranjang multi-lapak menjadi pesanan terpisah per toko.
- **Snapshot Histori Transaksi**: Data pesanan menyimpan salinan alamat pengiriman, nama produk, dan harga per kilogram saat checkout sehingga perubahan data katalog di kemudian hari tidak mengubah nota lama.
- **Validasi Unggahan Gambar**: Pemeriksaan ukuran maksimal `2 MB`, kesesuaian MIME type, validasi *magic bytes* header JPEG/PNG/WebP, dan penamaan acak berbasis UUID.
- **Umpan Balik Antarmuka Terpusat**: Notifikasi sukses maupun validasi error (seperti batas stok keranjang) ditampilkan konsisten lewat *toast notification* global di pojok kanan atas.

---

## Tumpukan Teknologi

| Lapisan | Teknologi |
| :--- | :--- |
| **Framework & UI** | Next.js `16.4.6` (App Router, Turbopack), React `19.3.0`, Tailwind CSS `4.3.3` |
| **Autentikasi & Keamanan** | `next-auth` `v5.0.0-beta.32` (JWT + `Credentials`), `bcrypt` (cost factor `12`) |
| **Database** | PostgreSQL via driver `pg` (`Raw SQL` terparameter &amp; helper transaksi eksplisit) |
| **Quality Check** | ESLint `v9` (`eslint-config-next/core-web-vitals`) |

---

## Panduan Menjalankan di Lokal

### 1. Prasyarat
- **Node.js** (disarankan v20 atau lebih baru)
- **PostgreSQL** (lokal atau terkelola)

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Variabel Lingkungan
Buat berkas `.env.local` pada root proyek dan lengkapi variabel berikut:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/hasilaut"
AUTH_SECRET="ganti-dengan-string-acak-yang-aman"
AUTH_TRUST_HOST=true
```

### 4. Inisialisasi Skema & Data Database
Jalankan skrip [schema.sql](./schema.sql) ke database PostgreSQL target (via `psql` maupun **pgAdmin Query Tool**) untuk membuat seluruh enum, 10 tabel utama, constraint, index, beserta data awal hasil backup:

```bash
psql -d hasilaut -f schema.sql
```

### 5. Daftar Perintah Utama

| Perintah | Kegunaan |
| :--- | :--- |
| `npm run dev` | Menjalankan server pengembangan lokal (`http://localhost:3000`) |
| `npm run lint` | Menjalankan pemeriksaan ESLint pada kode sumber |
| `npm run build` | Membangun bundel produksi Next.js (Turbopack) |
| `npm start` | Menjalankan server dari hasil build produksi |
