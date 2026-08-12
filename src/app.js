const employees = [
  { id: 1, name: 'Budi Santoso', role: 'Kepala Bidang Informatika', unit: 'Informatika' },
  { id: 2, name: 'Deni Setiawan', role: 'Pranata Komputer Ahli Muda', unit: 'Aptika' },
  { id: 3, name: 'Asep Supriatna', role: 'Kepala Seksi Statistik', unit: 'Statistik' },
  { id: 4, name: 'Siti Nurhayati', role: 'Analis Kebijakan', unit: 'Persandian' },
];

const guests = [
  { id: 1, name: 'Ahmad Fauzi', phone: '081234567890', company: 'PT ABC', visits: 8, lastVisit: 'Hari ini' },
  { id: 2, name: 'Siti Aminah', phone: '082112223333', company: 'CV XYZ', visits: 3, lastVisit: '10 Agustus' },
];

const agendas = [
  { employeeId: 1, date: '2026-08-20', start: '09:00', end: '10:00', title: 'Rapat Pimpinan' },
  { employeeId: 1, date: '2026-08-20', start: '11:00', end: '12:00', title: 'Agenda Bidang' },
  { employeeId: 2, date: '2026-08-20', start: '13:00', end: '14:00', title: 'Koordinasi SPBE' },
];

const reservations = [
  { id: 'RSV-20260820-0001', guest: 'Ahmad Fauzi', company: 'PT ABC', employeeId: 1, date: '2026-08-20', time: '10:00', status: 'CONFIRMED', purpose: 'Konsultasi layanan informasi' },
  { id: 'RSV-20260820-0002', guest: 'Siti Aminah', company: 'CV XYZ', employeeId: 2, date: '2026-08-20', time: '13:00', status: 'CHECKED_IN', purpose: 'Koordinasi data sektoral' },
];

const visits = [
  { guest: 'Ahmad Fauzi', company: 'PT ABC', employee: 'Budi Santoso', purpose: 'Konsultasi', in: '10:03', out: '-', status: 'CHECKED_IN' },
  { guest: 'Siti Aminah', company: 'CV XYZ', employee: 'Deni Setiawan', purpose: 'Koordinasi', in: '09:15', out: '10:20', status: 'COMPLETED' },
];

const app = document.querySelector('#app');
let idleTimer;
let ticket = null;

function resetIdleTimer() {
  clearTimeout(idleTimer);
  if (location.hash.startsWith('#kiosk') || location.hash === '') {
    idleTimer = setTimeout(() => navigate('kiosk'), 60000);
  }
}
['click', 'keydown', 'mousemove', 'touchstart'].forEach((event) => document.addEventListener(event, resetIdleTimer));

function navigate(route) {
  location.hash = route;
}

function employeeName(id) {
  return employees.find((employee) => employee.id === Number(id))?.name ?? '-';
}

function optionEmployees() {
  return employees.map((employee) => `<option value="${employee.id}">${employee.name} — ${employee.role}</option>`).join('');
}

function cameraPanel(title = 'Scan Wajah') {
  return `<div class="camera-card"><div class="camera-lens"><span>📷</span><div class="scan-line"></div></div><h3>${title}</h3><p>Demo MVP: modul kamera, face embedding, dan liveness disiapkan sebagai alur UI untuk integrasi service AI.</p></div>`;
}

function renderKiosk() {
  app.innerHTML = `<main class="kiosk hero-pattern">
    <section class="welcome-card">
      <p class="eyebrow">Pemerintah Kabupaten Ciamis</p>
      <h1>DISKOMINFO CIAMIS</h1>
      <h2>Selamat Datang</h2>
      <p class="lead">Sistem Buku Tamu & Reservasi Terintegrasi</p>
      <div class="kiosk-actions">
        <button onclick="appActions.showGuestBook()" class="big-action"><span>📷</span><strong>Buku Tamu</strong><small>Scan wajah & check-in</small></button>
        <button onclick="appActions.showReservation()" class="big-action"><span>📅</span><strong>Reservasi</strong><small>Pilih pegawai dan jadwal</small></button>
        <button onclick="appActions.showReservationCheckin()" class="big-action"><span>▣</span><strong>Check-in Reservasi</strong><small>Scan QR + verifikasi wajah</small></button>
      </div>
      <button class="admin-link" onclick="navigate('admin')">Masuk Dashboard Admin</button>
    </section>
  </main>`;
}

function renderGuestBook() {
  app.innerHTML = `<main class="flow-page">
    <button class="back" onclick="navigate('kiosk')">← Kembali</button>
    <section class="two-column">${cameraPanel()}
      <form class="panel" onsubmit="appActions.checkIn(event)">
        <p class="status-pill">Wajah belum terdaftar</p>
        <h2>Registrasi Tamu Baru</h2>
        <label>Nama Lengkap<input required name="name" placeholder="Masukkan nama lengkap" /></label>
        <label>No. HP<input required name="phone" placeholder="08xxxxxxxxxx" /></label>
        <label>Instansi/Perusahaan<input required name="company" placeholder="Nama instansi/perusahaan" /></label>
        <label>Keperluan<textarea required name="purpose" placeholder="Jelaskan keperluan Anda..."></textarea></label>
        <label>Bertemu Dengan<select required name="employeeId"><option value="">Cari nama pegawai...</option>${optionEmployees()}</select></label>
        <button class="primary">Check In</button>
      </form>
      <form class="panel old-guest" onsubmit="appActions.checkIn(event)">
        <p class="status-pill success">Simulasi tamu lama dikenali</p>
        <h2>Selamat Datang, Ahmad Fauzi</h2>
        <p>PT ABC • 081234567890</p>
        <label>Keperluan<textarea required name="purpose" placeholder="Jelaskan keperluan Anda..."></textarea></label>
        <label>Bertemu Dengan<select required name="employeeId">${optionEmployees()}</select></label>
        <button class="primary">Check In sebagai Tamu Lama</button>
      </form>
    </section>
  </main>`;
}

function slotsFor(employeeId, date) {
  return ['08:00','09:00','10:00','11:00','13:00','14:00','15:00'].map((time) => {
    const busyAgenda = agendas.some((agenda) => agenda.employeeId === Number(employeeId) && agenda.date === date && agenda.start === time);
    const booked = reservations.some((reservation) => reservation.employeeId === Number(employeeId) && reservation.date === date && reservation.time === time && !['CANCELLED','EXPIRED'].includes(reservation.status));
    return { time, available: !busyAgenda && !booked, reason: busyAgenda ? 'Agenda pegawai' : booked ? 'Sudah dipesan' : 'Tersedia' };
  });
}

function renderReservation() {
  const date = '2026-08-20';
  const employeeId = 1;
  const slots = slotsFor(employeeId, date);
  app.innerHTML = `<main class="flow-page"><button class="back" onclick="navigate('kiosk')">← Kembali</button>
    <section class="panel wide"><h2>Buat Reservasi</h2><p class="lead dark">Pilih tanggal, pegawai, slot tersedia, lalu sistem membuat tiket QR berisi token acak.</p>
      <form class="reservation-grid" onsubmit="appActions.createReservation(event)">
        <label>Tanggal Kunjungan<input required type="date" name="date" value="${date}" /></label>
        <label>Pegawai<select required name="employeeId" onchange="appActions.showReservation()">${optionEmployees()}</select></label>
        <div class="availability"><h3>Ketersediaan Budi Santoso — 20 Agustus 2026</h3>${slots.map((slot) => `<label class="slot ${slot.available ? 'available' : 'busy'}"><input ${slot.available ? '' : 'disabled'} required type="radio" name="time" value="${slot.time}" /> ${slot.time} - ${slot.available ? '🟢 Tersedia' : `🔴 ${slot.reason}`}</label>`).join('')}</div>
        <label>Nama Lengkap<input required name="name" /></label><label>No. HP<input required name="phone" /></label><label>Instansi/Perusahaan<input required name="company" /></label>
        <label class="full">Keperluan<textarea required name="purpose"></textarea></label><button class="primary full">Konfirmasi & Buat Tiket</button>
      </form>${ticket ? renderTicket() : ''}</section></main>`;
}

function renderTicket() {
  return `<aside class="ticket"><h3>DISKOMINFO CIAMIS</h3><h2>TIKET RESERVASI</h2><p>Nama: ${ticket.name}</p><p>Instansi: ${ticket.company}</p><p>Bertemu: ${employeeName(ticket.employeeId)}</p><p>Tanggal: ${ticket.date}</p><p>Jam: ${ticket.time} WIB</p><div class="qr">▦<br/>▣▣▣<br/>▦</div><strong>Kode: ${ticket.code}</strong></aside>`;
}

function renderReservationCheckin() {
  app.innerHTML = `<main class="flow-page"><button class="back" onclick="navigate('kiosk')">← Kembali</button><section class="two-column">${cameraPanel('Verifikasi Wajah Reservasi')}<form class="panel" onsubmit="appActions.reservationCheckin(event)"><h2>Check-in Reservasi</h2><label>Kode / Token QR<input required name="code" value="RSV-20260820-0001" /></label><p>Validasi dua lapis: kode QR reservasi dan kecocokan wajah tamu.</p><button class="primary">Scan QR & Check-in</button></form></section></main>`;
}

function renderAdmin() {
  app.innerHTML = `<main class="admin"><aside class="sidebar"><h2>DISKOMINFO CIAMIS</h2>${['Dashboard','Buku Tamu','Reservasi','Agenda','Pegawai','Data Tamu','Laporan','Pengguna','Audit Log','Pengaturan'].map((item) => `<a>${item}</a>`).join('')}<button onclick="navigate('kiosk')">Kiosk</button></aside><section class="content"><h1>Dashboard</h1><div class="stats"><article><strong>${guests.length}</strong><span>Tamu</span></article><article><strong>${reservations.length}</strong><span>Reservasi</span></article><article><strong>${visits.filter((v) => v.status === 'CHECKED_IN').length}</strong><span>Check-in</span></article><article><strong>${employees.length}</strong><span>Pegawai</span></article></div>${tableSection('Tamu Saat Ini', visits.filter((v) => v.status === 'CHECKED_IN').map((v) => [v.guest, v.company, v.employee, v.purpose, v.in, '<button>Check-out</button>']), ['Nama','Instansi','Bertemu','Keperluan','Masuk','Aksi'])}${tableSection('Reservasi Hari Ini', reservations.map((r) => [r.id, r.guest, employeeName(r.employeeId), r.time, r.status]), ['Kode','Tamu','Pegawai','Jam','Status'])}${tableSection('Data Tamu', guests.map((g) => [g.name, g.phone, g.company, g.visits, g.lastVisit]), ['Nama','HP','Instansi','Total','Terakhir'])}</section></main>`;
}

function tableSection(title, rows, headers) {
  return `<section class="panel table-panel"><h2>${title}</h2><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></section>`;
}

function renderSuccess(message) {
  app.innerHTML = `<main class="kiosk success-screen"><section class="welcome-card"><div class="success-icon">✓</div><h1>${message}</h1><p>Selamat datang di Diskominfo Ciamis.</p><button class="primary" onclick="navigate('kiosk')">Kembali ke Awal</button></section></main>`;
  setTimeout(() => navigate('kiosk'), 7000);
}

window.appActions = {
  showGuestBook: () => navigate('guest-book'),
  showReservation: () => navigate('reservation'),
  showReservationCheckin: () => navigate('reservation-checkin'),
  checkIn: (event) => { event.preventDefault(); renderSuccess('Check-in Berhasil!'); },
  reservationCheckin: (event) => { event.preventDefault(); renderSuccess('Check-in Reservasi Berhasil!'); },
  createReservation: (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    ticket = { name: form.get('name'), company: form.get('company'), employeeId: form.get('employeeId'), date: form.get('date'), time: form.get('time'), code: `RSV-${form.get('date').replaceAll('-', '')}-${Math.floor(Math.random() * 9000 + 1000)}` };
    renderReservation();
  },
};

function router() {
  resetIdleTimer();
  const route = location.hash.replace('#', '') || 'kiosk';
  ({ kiosk: renderKiosk, 'guest-book': renderGuestBook, reservation: renderReservation, 'reservation-checkin': renderReservationCheckin, admin: renderAdmin }[route] || renderKiosk)();
}
window.addEventListener('hashchange', router);
router();
