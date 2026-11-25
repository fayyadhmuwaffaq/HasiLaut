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
    <img src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white" alt="Next.js 16" />
    <img src="https://img.shields.io/badge/React-19-149ECA?style=flat-square&logo=react&logoColor=white" alt="React 19" />
    <img src="https://img.shields.io/badge/PostgreSQL-Raw_SQL-336791?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL Raw SQL" />
    <img src="https://img.shields.io/badge/NextAuth-v5_JWT-0F172A?style=flat-square" alt="NextAuth v5" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
  </p>
</div>

---

## Demo & Tangkapan Layar

- **Live Demo:** <!-- TODO: isi link demo/deployment (misal: https://hasilaut.vercel.app) -->
- **Pratinjau Antarmuka:**
  - <!-- TODO: tambahkan gambar katalog & detail produk (disarankan menampilkan grid katalog, filter kategori/urutan, dan halaman detail harga per kg + ulasan) -->
  - <!-- TODO: tambahkan gambar keranjang multi-toko & checkout (disarankan menampilkan pengelompokan produk per lapak dan pemilihan alamat/metode bayar) -->
  - <!-- TODO: tambahkan gambar dashboard seller & moderasi admin (disarankan menampilkan alur pesanan seller atau halaman moderasi produk/mitra admin) -->

**Akun Demo:**

| Peran | Email | Kata Sandi |
| :--- | :--- | :--- |
| **Admin** | <!-- TODO: isi email admin demo --> | <!-- TODO: isi kata sandi admin demo --> |
| **Seller (Mitra Nelayan)** | <!-- TODO: isi email seller demo --> | <!-- TODO: isi kata sandi seller demo --> |
| **Buyer (Pembeli)** | <!-- TODO: isi email buyer demo --> | <!-- TODO: isi kata sandi buyer demo --> |

---

## Tentang Proyek

**HasiLaut** menjembatani mitra nelayan dengan pelaku usaha kuliner dan pembeli rumah tangga dalam satu marketplace berbasis berat kilogram. Seluruh proses mulai dari pengelolaan katalog, pemecahan pesanan multi-toko saat checkout, hingga pengurangan stok dijalankan menggunakan transaksi PostgreSQL eksplisit agar konsistensi data tetap terjaga.

---

## Fitur per Peran

### Publik & Pembeli (`Buyer`)
- Telusuri katalog hasil laut (`/products`) dengan pencarian, filter kategori, pengurutan, dan profil lapak (`/stores/[id]`).
- Lihat detail produk lengkap dengan harga per kilogram, sisa stok, rating rata-rata, dan ulasan pembeli.
- Kelola keranjang belanja lintas lapak serta simpan beberapa alamat pengiriman.
- Lakukan checkout multi-toko otomatis dengan pilihan pembayaran `COD` atau `Transfer Bank Manual`.
- Pantau status pesanan, konfirmasi pesanan diterima, kirim ulasan, dan kelola profil akun.

### Mitra Nelayan (`Seller`)
- Daftar sebagai mitra dengan alur verifikasi admin (`pending`, `approved`, `rejected`).
- Kelola identitas lapak, lokasi dermaga, dan foto profil toko.
- Tambah, perbarui, atau nonaktifkan produk hasil tangkapan tanpa menghapus riwayat pesanan.
- Proses pesanan masuk mulai dari penyiapan hingga pengiriman barang ke pembeli.
- Pantau ringkasan statistik dan aktivitas penjualan lapak dari dashboard seller.

### Administrator (`Admin`)
- Tinjau dan verifikasi antrean pendaftaran akun mitra nelayan (setujui atau tolak).
- Kelola master kategori hasil laut (`CRUD`) yang digunakan oleh seluruh lapak.
- Awasi katalog platform dengan moderasi status tayang produk dan penghapusan item bermasalah.
- Awasi daftar pengguna (`Buyer` dan `Seller`) serta pantau statistik ringkas platform.

---

## Keunggulan Teknis

- **Otorisasi Berlapis**: Pemisahan sesi berbasis peran (`Buyer`, `Seller`, `Admin`) lewat JWT dan verifikasi ulang status akun terkini langsung ke database.
- **Checkout Multi-Toko Atomik**: Pemecahan keranjang lintas lapak menjadi pesanan per toko dibungkus transaksi `BEGIN/COMMIT` dengan penguncian baris stok untuk mencegah stok minus.
- **Snapshot Histori Transaksi**: Salinan alamat, nama produk, dan harga per kg disimpan saat checkout sehingga perubahan katalog di kemudian hari tidak mengubah riwayat nota.
- **Validasi Unggahan Gambar Ketat**: Pemeriksaan batas ukuran file, kesesuaian MIME type, validasi *magic bytes* (JPEG/PNG/WebP), dan penamaan acak berbasis UUID.
- **Umpan Balik Antarmuka Terpusat**: Status keberhasilan aksi maupun validasi error ditampilkan konsisten melalui notifikasi *toast* global dan pesan error terstruktur.

---

## Tech Stack

- **Framework & UI**: Next.js (App Router, Turbopack), React, Tailwind CSS
- **Autentikasi & Keamanan**: NextAuth v5 (JWT + `Credentials`), `bcrypt` (cost factor `12`)
- **Database**: PostgreSQL melalui driver `pg` (`Raw SQL` terparameter & helper transaksi eksplisit)
- **Quality Check**: ESLint (`eslint-config-next/core-web-vitals`)

---

## Cara Menjalankan di Lokal

### 1. Prasyarat
- **Node.js** (disarankan v20 atau lebih baru)
- **PostgreSQL** (lokal atau terkelola)

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Variabel Lingkungan
Buat berkas `.env.local` pada root proyek dan lengkapi variabel berikut:

> **Catatan Keamanan Produksi:** Contoh di bawah hanya untuk pengembangan lokal. Wajib ganti `AUTH_SECRET`, kata sandi `DATABASE_URL`, dan `ADMIN_PASSWORD` dengan nilai acak yang kuat sebelum deployment ke produksi.

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/hasilaut"
AUTH_SECRET="ganti-dengan-string-acak-yang-aman"
AUTH_TRUST_HOST=true

# Opsional untuk script seed:admin (user-seed.js)
ADMIN_NAME="Admin HasiLaut"
ADMIN_EMAIL="admin@hasilaut.id"
ADMIN_PASSWORD="AdminHasiLaut123!"
ADMIN_PHONE="081100000001"
```

### 4. Inisialisasi Skema Database
Jalankan skrip [schema.sql](./schema.sql) ke database PostgreSQL target untuk membuat seluruh enum, 10 tabel utama, constraint, dan index:

```bash
psql -d hasilaut -f schema.sql
```

### 5. Seeding Data Awal
```bash
npm run seed:categories
npm run seed:admin
```

### 6. Daftar Perintah Utama

| Perintah | Kegunaan |
| :--- | :--- |
| `npm run dev` | Menjalankan server pengembangan lokal (`http://localhost:3000`) |
| `npm run lint` | Menjalankan pemeriksaan ESLint pada kode sumber |
| `npm run build` | Membangun bundel produksi Next.js (Turbopack) |
| `npm start` | Menjalankan server dari hasil build produksi |
| `npm run seed:categories` | Mengisi 5 kategori awal hasil laut secara idempoten |
| `npm run seed:admin` | Membuat atau memperbarui akun Administrator awal |

---

## Struktur Folder

```text
hasilaut/
├── public/            # Logo, aset statis, placeholder gambar, dan folder unggahan
├── scripts/           # Helper koneksi database dan seeder kategori awal
├── src/
│   ├── app/           # Halaman App Router (publik, buyer, seller, admin) dan API routes
│   ├── components/    # Komponen UI bersama dan modul antarmuka per peran
│   ├── lib/           # Pool PostgreSQL, query SQL, auth guards, formatter, validasi upload
│   ├── auth.config.js # Konfigurasi dasar NextAuth (Edge-compatible)
│   ├── auth.js        # Provider Credentials dan callback sesi NextAuth
│   └── middleware.js  # Penjaga akses rute awal berbasis peran
├── schema.sql         # Skema DDL PostgreSQL (10 tabel, 4 enum, constraint, index)
└── user-seed.js       # Skrip inisialisasi akun Administrator awal
```

---

## Lisensi

<!-- TODO: cantumkan lisensi proyek (misal: MIT License) dan tambahkan berkas LICENSE pada root repositori -->
