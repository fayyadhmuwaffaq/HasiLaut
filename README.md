# HasiLaut

Platform e-commerce web hasil tangkapan laut segar langsung dari nelayan dan mitra pesisir berbasis **Next.js App Router**, **NextAuth v5**, dan **PostgreSQL** (`pg` Raw SQL) dengan satuan transaksi kilogram (minimal `0.5 kg`).

## Fitur Utama per Peran

- **Publik & Pembeli (Buyer)**:
  - Menjelajahi katalog hasil laut dengan pencarian kata kunci, filter kategori, rentang harga, pengurutan, dan paginasi (`/products`).
  - Melihat detail produk, ulasan terverifikasi, dan halaman profil lapak nelayan (`/stores/[id]`).
  - Mengelola keranjang belanja, multi-alamat pengiriman, serta checkout yang otomatis memecah pesanan per toko dengan metode pembayaran COD atau Transfer Bank Manual.
  - Memantau status pesanan pada tab terstruktur, membatalkan pesanan yang belum diproses, dan memberikan ulasan saat pesanan selesai.
  - Mengelola identitas akun (nama, email, nomor telepon), alamat pengiriman, dan kata sandi.
- **Mitra Nelayan (Seller)**:
  - Pendaftaran akun mitra dengan verifikasi status oleh Admin (`pending`, `approved`, `rejected`).
  - Ringkasan statistik lapak, pengelolaan profil toko dan foto dermaga, serta toggle aktif/nonaktif produk tanpa menghapus riwayat pesanan.
  - Mengelola pesanan masuk berdasarkan alur status (`Menunggu Pembayaran` -> `Diproses` -> `Dikirim` -> `Selesai`, atau `Dibatalkan`).
  - Mengelola identitas akun pribadi serta kata sandi.
- **Admin**:
  - Ringkasan statistik sistem, antrean persetujuan/penolakan mitra nelayan, pengelolaan kategori hasil laut, pengawasan produk, serta manajemen pengguna (`buyer` dan `seller`).
  - Mengelola identitas akun admin sendiri dan kata sandi.

## Tumpukan Teknologi

- **Framework**: Next.js `16.4.6` (App Router, Turbopack), React `19.3.0`
- **Styling**: Tailwind CSS `v4` (`@tailwindcss/turbopack`)
- **Autentikasi**: `next-auth` `v5.0.0-beta.32` (JWT + `Credentials` provider) & `bcrypt` (`salt rounds = 12`)
- **Database**: PostgreSQL dengan `pg` Pool (`Raw SQL` terparameter dan helper transaksi eksplisit `withTransaction`)

## Struktur Direktori Utama

- `schema.md`: Spesifikasi skema database dan skrip DDL PostgreSQL lengkap (10 tabel, 4 tipe ENUM, constraint, dan 8 index).
- `user-seed.js` & `scripts/`: Utilitas CLI (`env.js`, `seed-categories.js`) untuk seeding Admin awal dan kategori standar.
- `public/`: Aset statis, placeholder SVG produk/toko, dan direktori penyimpanan lokal file unggahan (`/uploads/products`, `/uploads/stores`).
- `src/app/`: Halaman App Router berdasarkan domain peran (`admin/`, `buyer/`, `seller/`, publik `/products`, `/stores/[id]`, `/login`, `/register`) serta seluruh Route Handlers di `src/app/api/`.
- `src/components/`: Komponen UI reusable (`ui/`), form autentikasi (`auth/`), tampilan manajemen per peran (`admin/`, `buyer/`, `seller/`), serta komponen navigasi & katalog (`Navbar`, `CatalogFilters`, `ProductCard`).
- `src/lib/`: Koneksi PostgreSQL (`db.js`), guard halaman & API (`auth-guards.js`), helper profil akun (`account-profile.js`), validasi/upload gambar (`upload.js`), utilitas format (`format.js`), dan modul query per domain (`queries/`).
- `src/auth.config.js`, `src/auth.js`, `src/middleware.js`: Konfigurasi Edge/Server NextAuth dan proteksi rute berbasis peran.

## Cara Menjalankan di Lokal

### 1. Prasyarat
- Node.js (disarankan v20 atau lebih baru)
- PostgreSQL (lokal atau terkelola)

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Variabel Lingkungan
Buat berkas `.env.local` di root proyek dan isi variabel berikut sesuai lingkungan PostgreSQL Anda:

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

### 4. Pembuatan Tabel Database
Jalankan seluruh perintah DDL SQL pada bagian **2. DDL Script (PostgreSQL Table Definitions)** di [schema.md](./schema.md) ke database PostgreSQL target (misalnya menggunakan `psql -d hasilaut -f schema.sql`).

### 5. Seeding Kategori & Akun Admin
```bash
npm run seed:categories
npm run seed:admin
```

### 6. Menjalankan Aplikasi
Untuk mode pengembangan:
```bash
npm run dev
```

Untuk verifikasi lint dan build produksi:
```bash
npm run lint
npm run build
npm start
```

Aplikasi dapat diakses pada `http://localhost:3000`.
