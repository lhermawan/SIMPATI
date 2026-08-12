# SIMPATI

Sistem Informasi Manajemen Pengunjung & Reservasi Terintegrasi untuk Buku Tamu dan Reservasi Diskominfo Ciamis.

## Fitur MVP

- Portal/kiosk tamu dengan tombol besar untuk Buku Tamu, Reservasi, dan Check-in Reservasi.
- Alur buku tamu untuk simulasi scan wajah, registrasi tamu baru, tamu lama, pemilihan pegawai, keperluan, dan check-in.
- Reservasi masyarakat dengan tanggal, pegawai, availability dari agenda/reservasi, data tamu, dan tiket QR demo.
- Check-in reservasi dua lapis melalui kode QR/token dan verifikasi wajah demo.
- Dashboard admin dengan statistik, tamu saat ini, reservasi hari ini, dan data tamu.
- Timeout kiosk 60 detik yang mengembalikan layar ke halaman awal.

## Menjalankan Aplikasi

Aplikasi dibuat sebagai prototipe frontend statis agar cepat dijalankan tanpa proses build.

```bash
python3 -m http.server 4173
```

Buka `http://localhost:4173` di browser.

## Catatan Integrasi Lanjutan

Face recognition pada MVP ini masih berupa alur UI/simulasi. Produksi sebenarnya perlu service terpisah untuk face detection, liveness detection, face embedding, vector search, enkripsi data biometrik, audit log, dan kebijakan retensi data sesuai regulasi perlindungan data pribadi.
