const api = (path, options = {}) => fetch(path, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options }).then(async (response) => {
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || `HTTP ${response.status}`);
  return response.json();
});

const app = document.querySelector('#app');
const state = { employees: [], dashboard: null, settings: null, ticket: null, currentDescriptor: null, faceModelsReady: false, stream: null };
let idleTimer;

async function initData() {
  const [employees, settings] = await Promise.all([api('/api/employees'), api('/api/settings')]);
  state.employees = employees;
  state.settings = settings;
}

async function loadFaceModels() {
  if (state.faceModelsReady || !window.faceapi) return state.faceModelsReady;
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  ]);
  state.faceModelsReady = true;
  return true;
}

function resetIdleTimer() {
  clearTimeout(idleTimer);
  if (!location.hash || location.hash.startsWith('#kiosk')) idleTimer = setTimeout(() => navigate('kiosk'), 60000);
}
['click', 'keydown', 'mousemove', 'touchstart'].forEach((event) => document.addEventListener(event, resetIdleTimer));
function navigate(route) { location.hash = route; }
function stopCamera() { if (state.stream) state.stream.getTracks().forEach((track) => track.stop()); state.stream = null; }
function employeeName(id) { return state.employees.find((employee) => employee.id === Number(id))?.name || '-'; }
function employeeOptions() { return state.employees.map((e) => `<option value="${e.id}">${e.name} — ${e.label}</option>`).join(''); }
function field(name, label, attrs = '') { return `<label>${label}<input name="${name}" ${attrs} /></label>`; }
function alertBox(text, type = 'info') { return `<div class="alert ${type}">${text}</div>`; }

function cameraPanel(mode) {
  return `<section class="camera-card">
    <video id="camera" autoplay muted playsinline></video>
    <canvas id="snapshot" hidden></canvas>
    <div class="camera-actions">
      <button class="secondary" onclick="appActions.startCamera('${mode}')">Aktifkan Kamera</button>
      <button class="primary" onclick="appActions.captureFace('${mode}')">Scan Wajah</button>
    </div>
    <p id="faceStatus">Model face-api.js siap digunakan jika file model tersedia di <code>/models</code>.</p>
  </section>`;
}

function renderKiosk() {
  stopCamera();
  app.innerHTML = `<main class="kiosk hero-pattern"><section class="welcome-card">
    <p class="eyebrow">Pemerintah Kabupaten Ciamis</p><h1>DISKOMINFO CIAMIS</h1><h2>Selamat Datang</h2><p class="lead">Sistem Buku Tamu & Reservasi Terintegrasi</p>
    <div class="kiosk-actions">
      <button onclick="navigate('guest-book')" class="big-action"><span>📷</span><strong>Buku Tamu</strong><small>Face recognition & check-in</small></button>
      <button onclick="navigate('reservation')" class="big-action"><span>📅</span><strong>Reservasi</strong><small>Availability, tiket QR</small></button>
      <button onclick="navigate('reservation-checkin')" class="big-action"><span>▣</span><strong>Check-in Reservasi</strong><small>QR + verifikasi wajah</small></button>
    </div><button class="admin-link" onclick="navigate('admin')">Masuk Dashboard Admin</button></section></main>`;
}

function renderGuestBook(recognizedGuest = null) {
  app.innerHTML = `<main class="flow-page"><button class="back" onclick="navigate('kiosk')">← Kembali</button><section class="two-column">${cameraPanel('recognize')}
    <form class="panel" onsubmit="appActions.submitVisit(event)">
      ${recognizedGuest ? alertBox(`Wajah dikenali. Selamat datang, ${recognizedGuest.name}.`, 'success') : alertBox('Jika wajah belum terdaftar, isi data tamu baru dan sistem akan menyimpan face embedding.', 'warning')}
      <h2>${recognizedGuest ? 'Form Tamu Lama' : 'Registrasi Tamu Baru'}</h2>
      <input type="hidden" name="guestId" value="${recognizedGuest?.id || ''}" />
      <div class="identity ${recognizedGuest ? 'hidden-fields' : ''}">${field('name', 'Nama Lengkap', `required value="${recognizedGuest?.name || ''}"`)}${field('phone', 'No. HP', `required value="${recognizedGuest?.phone || ''}"`)}${field('company', 'Instansi/Perusahaan', `required value="${recognizedGuest?.company || ''}"`)}</div>
      <label>Keperluan<textarea required name="purpose" placeholder="Jelaskan keperluan Anda..."></textarea></label>
      <label>Bertemu Dengan<select required name="employeeId"><option value="">Cari nama pegawai...</option>${employeeOptions()}</select></label>
      <button class="primary">Check In</button>
    </form></section></main>`;
}

async function renderReservation() {
  const date = document.querySelector('[name="date"]')?.value || '2026-08-20';
  const employeeId = Number(document.querySelector('[name="employeeId"]')?.value || state.employees[0]?.id || 1);
  const slots = await api(`/api/availability?employee_id=${employeeId}&date=${date}`);
  app.innerHTML = `<main class="flow-page"><button class="back" onclick="navigate('kiosk')">← Kembali</button><section class="panel wide"><h2>Buat Reservasi</h2><p class="lead dark">Sistem mengecek agenda dan reservasi agar tidak terjadi double booking.</p>
    <form class="reservation-grid" onsubmit="appActions.createReservation(event)">
      <label>Tanggal Kunjungan<input required type="date" name="date" value="${date}" onchange="appActions.showReservation()" /></label>
      <label>Pegawai<select required name="employeeId" onchange="appActions.showReservation()">${state.employees.map((e) => `<option ${e.id === employeeId ? 'selected' : ''} value="${e.id}">${e.name} — ${e.label}</option>`).join('')}</select></label>
      <div class="availability"><h3>Ketersediaan ${employeeName(employeeId)}</h3>${slots.map((slot) => `<label class="slot ${slot.available ? 'available' : 'busy'}"><input ${slot.available ? '' : 'disabled'} required type="radio" name="start" value="${slot.start}" data-end="${slot.end}" />${slot.start} - ${slot.end} ${slot.available ? '🟢 Tersedia' : `🔴 ${slot.reason}`}</label>`).join('')}</div>
      ${field('name', 'Nama Lengkap', 'required')}${field('phone', 'No. HP', 'required')}${field('company', 'Instansi/Perusahaan', 'required')}
      <label class="full">Keperluan<textarea required name="purpose"></textarea></label><button class="primary full">Konfirmasi & Buat Tiket</button>
    </form>${state.ticket ? renderTicket() : ''}</section></main>`;
}

function renderTicket() {
  const t = state.ticket;
  return `<aside class="ticket"><h3>DISKOMINFO CIAMIS</h3><h2>TIKET RESERVASI</h2><p>Nama: ${t.guest.name}</p><p>Instansi: ${t.guest.company}</p><p>Bertemu: ${employeeName(t.reservation.employeeId)}</p><p>Tanggal: ${t.reservation.date}</p><p>Jam: ${t.reservation.start} WIB</p><div class="qr">${t.reservation.code}</div><strong>Kode: ${t.reservation.code}</strong><small>Token asli disimpan di backend, bukan data pribadi.</small></aside>`;
}

function renderReservationCheckin() {
  app.innerHTML = `<main class="flow-page"><button class="back" onclick="navigate('kiosk')">← Kembali</button><section class="two-column">${cameraPanel('verify')}
    <form class="panel" onsubmit="appActions.reservationCheckin(event)"><h2>Check-in Reservasi</h2><label>Kode / Token QR<input required name="code" value="RSV-20260820-0001" /></label><p>Untuk produksi, tombol scan wajah memanggil <code>/api/face/verify</code> sebelum check-in.</p><button class="primary">Validasi QR + Check-in</button></form></section></main>`;
}

async function renderAdmin() {
  state.dashboard = await api('/api/dashboard');
  const guests = await api('/api/guests');
  app.innerHTML = `<main class="admin"><aside class="sidebar"><h2>DISKOMINFO CIAMIS</h2>${['Dashboard','Buku Tamu','Reservasi','Agenda','Pegawai','Data Tamu','Laporan','Pengguna','Audit Log','Pengaturan'].map((item) => `<a>${item}</a>`).join('')}<button onclick="navigate('kiosk')">Kiosk</button></aside><section class="content"><h1>Dashboard Admin</h1><div class="stats"><article><strong>${state.dashboard.counts.guests}</strong><span>Tamu</span></article><article><strong>${state.dashboard.counts.reservations}</strong><span>Reservasi</span></article><article><strong>${state.dashboard.counts.checkedIn}</strong><span>Check-in</span></article><article><strong>${state.dashboard.counts.employees}</strong><span>Pegawai</span></article></div>${table('Tamu Saat Ini', state.dashboard.currentVisits.map((v) => [v.id, v.guestId, employeeName(v.employeeId), v.purpose, v.status, `<button onclick="appActions.checkout(${v.id})">Check-out</button>`]), ['ID','Guest','Pegawai','Keperluan','Status','Aksi'])}${table('Reservasi', state.dashboard.reservationsToday.map((r) => [r.code, r.guestId, employeeName(r.employeeId), `${r.date} ${r.start}`, r.status]), ['Kode','Guest','Pegawai','Jadwal','Status'])}${table('Data Tamu', guests.map((g) => [g.name, g.phone, g.company, g.totalVisits, g.status]), ['Nama','HP','Instansi','Total Kunjungan','Status'])}</section></main>`;
}
function table(title, rows, headers) { return `<section class="panel table-panel"><h2>${title}</h2><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></section>`; }
function renderSuccess(message) { stopCamera(); app.innerHTML = `<main class="kiosk success-screen"><section class="welcome-card"><div class="success-icon">✓</div><h1>${message}</h1><p>Selamat datang di Diskominfo Ciamis.</p><button class="primary" onclick="navigate('kiosk')">Kembali ke Awal</button></section></main>`; setTimeout(() => navigate('kiosk'), 7000); }

window.appActions = {
  showReservation: () => renderReservation(),
  startCamera: async () => {
    const video = document.querySelector('#camera');
    state.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    video.srcObject = state.stream;
    document.querySelector('#faceStatus').textContent = 'Kamera aktif. Arahkan wajah ke kamera.';
  },
  captureFace: async (mode) => {
    const status = document.querySelector('#faceStatus');
    status.textContent = 'Memuat model face-api.js dan mendeteksi wajah...';
    await loadFaceModels();
    const detection = await faceapi.detectSingleFace(document.querySelector('#camera'), new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
    if (!detection) { status.textContent = 'Wajah tidak terdeteksi atau kurang jelas.'; return; }
    state.currentDescriptor = Array.from(detection.descriptor);
    if (mode === 'recognize') {
      const result = await api('/api/face/recognize', { method: 'POST', body: JSON.stringify({ descriptor: state.currentDescriptor }) });
      if (result.matched) renderGuestBook(result.guest); else status.textContent = 'Wajah belum terdaftar. Silakan isi data tamu baru.';
    } else status.textContent = 'Wajah berhasil dipindai untuk verifikasi.';
  },
  submitVisit: async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    if (!data.guestId && state.currentDescriptor) await api('/api/face/register', { method: 'POST', body: JSON.stringify({ ...data, descriptor: state.currentDescriptor }) });
    await api('/api/visits', { method: 'POST', body: JSON.stringify(data) });
    renderSuccess('Check-in Berhasil!');
  },
  createReservation: async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    const selected = event.target.querySelector('[name="start"]:checked');
    data.end = selected?.dataset.end;
    state.ticket = await api('/api/reservations', { method: 'POST', body: JSON.stringify(data) });
    await renderReservation();
  },
  reservationCheckin: async (event) => {
    event.preventDefault();
    const code = new FormData(event.target).get('code');
    await api(`/api/reservations/${encodeURIComponent(code)}/check-in`, { method: 'POST', body: '{}' });
    renderSuccess('Check-in Reservasi Berhasil!');
  },
  checkout: async (id) => { await api(`/api/visits/${id}/checkout`, { method: 'POST', body: '{}' }); await renderAdmin(); },
};

async function router() {
  resetIdleTimer();
  const route = location.hash.replace('#', '') || 'kiosk';
  await initData();
  if (route !== 'guest-book' && route !== 'reservation-checkin') stopCamera();
  if (route === 'guest-book') return renderGuestBook();
  if (route === 'reservation') return renderReservation();
  if (route === 'reservation-checkin') return renderReservationCheckin();
  if (route === 'admin') return renderAdmin();
  return renderKiosk();
}
window.addEventListener('hashchange', router);
router();
