# SIMPATI

Sistem Informasi Manajemen Pengunjung & Reservasi Terintegrasi untuk Buku Tamu dan Reservasi Diskominfo Ciamis.

## Stack Final

- Frontend kiosk/admin preview: HTML, CSS, JavaScript SPA dengan alur bertahap seperti preview Lovable: pilih layanan, scan/isi data, konfirmasi, lalu tiket atau check-in berhasil.
- Face recognition: `face-api.js` di browser untuk deteksi wajah, landmark, dan face descriptor.
- Backend utama: Laravel + Filament untuk login/admin panel.
- Database produksi/MVP backend: MySQL.
- Backend Node sebelumnya tetap ada sebagai server demo lokal ringan, tetapi target backend yang disiapkan untuk pengembangan berikutnya ada di `backend-laravel/`.

## Fitur Frontend

- Halaman awal kiosk dengan tombol besar: Buku Tamu, Reservasi, dan Check-in Reservasi.
- Stepper flow untuk Buku Tamu: Scan Wajah → Data Tamu → Keperluan → Check-in.
- Stepper flow untuk Reservasi: Tanggal → Pegawai → Slot → Data Tamu → Tiket.
- Stepper flow untuk Check-in Reservasi: Scan QR → Verifikasi Wajah → Check-in.
- Kamera dan face-api.js untuk registrasi descriptor wajah, pengenalan tamu lama, dan jalur verifikasi wajah.
- Dashboard admin preview untuk statistik, tamu saat ini, reservasi, data tamu, dan check-out.

## Backend Laravel Filament

Folder `backend-laravel/` berisi fondasi Laravel untuk backend MySQL dan login/admin Filament:

- `composer.json` membutuhkan `laravel/framework`, `filament/filament`, dan `laravel/sanctum`.
- `.env.example` sudah memakai `DB_CONNECTION=mysql`.
- `routes/api.php` menyediakan endpoint API untuk dashboard, pegawai, tamu, face recognition, kunjungan, agenda, availability, dan reservasi.
- `app/Providers/Filament/AdminPanelProvider.php` mengaktifkan panel login Filament pada `/admin`.
- Migration `database/migrations/2026_08_12_000001_create_simpati_tables.php` membuat tabel MySQL inti: units, employees, guests, face_embeddings, agendas, visits, dan reservations.
- Model Eloquent disiapkan untuk Guest, Employee, Unit, Agenda, Visit, Reservation, dan FaceEmbedding.

## Menjalankan Frontend Demo Saat Ini

```bash
npm start
```

Buka:

```text
http://localhost:4173
```

Jika backend Laravel sudah berjalan terpisah, arahkan frontend ke API Laravel dengan menyimpan base URL di browser console:

```js
localStorage.setItem('simpati_api_base', 'http://localhost:8000')
```

## Menyiapkan Backend Laravel Filament + MySQL

```bash
cd backend-laravel
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan make:filament-user
php artisan serve
```

Lalu buka login Filament:

```text
http://localhost:8000/admin
```

## Model face-api.js

Unduh model face-api.js dan letakkan di folder `models/` pada root frontend, minimal:

- `tiny_face_detector_model-weights_manifest.json` dan shard weights-nya.
- `face_landmark_68_model-weights_manifest.json` dan shard weights-nya.
- `face_recognition_model-weights_manifest.json` dan shard weights-nya.

## Endpoint REST Laravel Utama

- `GET /api/dashboard`
- `GET|POST /api/guests`, `GET|PUT|DELETE /api/guests/{guest}`
- `POST /api/face/register`, `POST /api/face/recognize`, `POST /api/face/verify`
- `GET|POST /api/visits`, `GET /api/visits/today`, `POST /api/visits/{visit}/checkout`
- `GET|POST /api/employees`, `PUT|DELETE /api/employees/{employee}`
- `GET|POST /api/agendas`, `PUT|DELETE /api/agendas/{agenda}`
- `GET /api/availability?employee_id=1&date=2026-08-20`
- `GET|POST /api/reservations`, `GET /api/reservations/{reservation}`, `POST /api/reservations/{reservation}/cancel`, `POST /api/reservations/{reservation}/check-in`

## Catatan Produksi

Data wajah adalah data biometrik. Implementasi produksi wajib menggunakan HTTPS, persetujuan pengguna, enkripsi, role-based access control, audit log, pembatasan percobaan recognition, kebijakan retensi, dan mekanisme penghapusan data sesuai regulasi perlindungan data pribadi.
