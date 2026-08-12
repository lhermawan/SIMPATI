# SIMPATI

Sistem Informasi Manajemen Pengunjung & Reservasi Terintegrasi untuk Buku Tamu dan Reservasi Diskominfo Ciamis.

## Stack

- Backend: Node.js native HTTP REST API tanpa dependency eksternal.
- Frontend: HTML, CSS, JavaScript SPA.
- Face recognition: `face-api.js` di browser untuk deteksi wajah, landmark, dan face descriptor; backend menyimpan descriptor sebagai face embedding sederhana di JSON database.
- Database MVP: `server/data/db.json` agar mudah dicoba. Untuk produksi, migrasikan ke PostgreSQL + pgvector dan enkripsi data sensitif.

## Fitur yang Dibuat

### Portal/Kiosk Tamu

- Halaman awal kiosk dengan tombol besar: Buku Tamu, Reservasi, dan Check-in Reservasi.
- Buku tamu dengan kamera, face-api.js, registrasi tamu baru, pengenalan tamu lama, isi keperluan, pilih pegawai, dan check-in.
- Reservasi dengan tanggal, pegawai, slot availability berdasarkan agenda + reservasi, pencegahan double booking, dan tiket kode QR/token.
- Check-in reservasi dengan validasi kode QR/token dan jalur verifikasi wajah.
- Timeout kiosk 60 detik untuk kembali ke halaman awal.

### Dashboard Admin

- Dashboard statistik tamu, reservasi, check-in, dan pegawai.
- Tamu saat ini dengan aksi check-out.
- Data reservasi dan data tamu.
- Endpoint master untuk pegawai, agenda, tamu, kunjungan, reservasi, laporan, pengaturan, dan audit log.

## Menjalankan Aplikasi

Jalankan server Node.js tanpa dependency eksternal:

```bash
npm start
```

Buka aplikasi di:

```text
http://localhost:4173
```

## Model face-api.js

Unduh model face-api.js dan letakkan di folder `models/` pada root aplikasi, minimal:

- `tiny_face_detector_model-weights_manifest.json` dan shard weights-nya.
- `face_landmark_68_model-weights_manifest.json` dan shard weights-nya.
- `face_recognition_model-weights_manifest.json` dan shard weights-nya.

Tanpa file model tersebut, UI tetap berjalan tetapi scan wajah tidak dapat menghasilkan descriptor.

## Endpoint REST Utama

- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET|POST /api/guests`, `GET|PUT /api/guests/:id`
- `POST /api/face/register`, `POST /api/face/recognize`, `POST /api/face/verify`
- `GET|POST /api/visits`, `GET /api/visits/today`, `POST /api/visits/:id/checkout`
- `GET|POST /api/employees`, `PUT|DELETE /api/employees/:id`
- `GET|POST /api/agendas`, `PUT|DELETE /api/agendas/:id`
- `GET /api/availability?employee_id=1&date=2026-08-20`
- `GET|POST /api/reservations`, `GET /api/reservations/:id`, `POST /api/reservations/:id/cancel`, `POST /api/reservations/:id/check-in`
- `GET /api/reports/summary`, `GET|PUT /api/settings`, `GET /api/audit-logs`

## Catatan Produksi

Data wajah adalah data biometrik. Implementasi produksi wajib menggunakan HTTPS, persetujuan pengguna, enkripsi, role-based access control, audit log, pembatasan percobaan recognition, kebijakan retensi, dan mekanisme penghapusan data sesuai regulasi perlindungan data pribadi.
