import http from 'http';
import { existsSync, mkdirSync, readFileSync, writeFileSync, createReadStream } from 'fs';
import { dirname, extname, join, normalize } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const dataDir = join(__dirname, 'data');
const dbPath = join(dataDir, 'db.json');
const port = process.env.PORT || 4173;

const defaultDb = {
  roles: [
    { id: 1, name: 'Super Admin' },
    { id: 2, name: 'Petugas Resepsionis' },
    { id: 3, name: 'Admin Agenda' },
  ],
  users: [{ id: 1, name: 'Admin Diskominfo', username: 'admin', roleId: 1, status: 'active' }],
  units: [
    { id: 1, name: 'Informatika' },
    { id: 2, name: 'Aplikasi Informatika' },
    { id: 3, name: 'Statistik dan Persandian' },
  ],
  employees: [
    { id: 1, name: 'Budi Santoso', nip: '19xxxxxxxxxx', position: 'Kepala Bidang', unitId: 1, email: 'budi@ciamiskab.go.id', phone: '08xxxx', photo: '', status: 'active' },
    { id: 2, name: 'Deni Setiawan', nip: '19xxxxxxxxxx', position: 'Pranata Komputer', unitId: 2, email: 'deni@ciamiskab.go.id', phone: '08xxxx', photo: '', status: 'active' },
    { id: 3, name: 'Asep Supriatna', nip: '19xxxxxxxxxx', position: 'Analis Statistik', unitId: 3, email: 'asep@ciamiskab.go.id', phone: '08xxxx', photo: '', status: 'active' },
  ],
  guests: [
    { id: 1, name: 'Ahmad Fauzi', phone: '081234567890', company: 'PT ABC', facePhoto: '', status: 'active', createdAt: '2026-08-12T03:00:00.000Z', updatedAt: '2026-08-12T03:00:00.000Z' },
    { id: 2, name: 'Siti Aminah', phone: '082112223333', company: 'CV XYZ', facePhoto: '', status: 'active', createdAt: '2026-08-10T03:00:00.000Z', updatedAt: '2026-08-10T03:00:00.000Z' },
  ],
  faceEmbeddings: [],
  agendas: [
    { id: 1, employeeId: 1, date: '2026-08-20', start: '09:00', end: '10:00', title: 'Rapat Pimpinan', notes: 'Ruang rapat utama' },
    { id: 2, employeeId: 1, date: '2026-08-20', start: '11:00', end: '12:00', title: 'Agenda Bidang', notes: 'Pembahasan program' },
  ],
  visits: [
    { id: 1, guestId: 1, employeeId: 1, purpose: 'Konsultasi', visitDate: '2026-08-12', checkInAt: '2026-08-12T10:03:00.000Z', checkOutAt: null, visitType: 'walk-in', status: 'CHECKED_IN' },
    { id: 2, guestId: 2, employeeId: 2, purpose: 'Koordinasi', visitDate: '2026-08-12', checkInAt: '2026-08-12T09:15:00.000Z', checkOutAt: '2026-08-12T10:20:00.000Z', visitType: 'walk-in', status: 'COMPLETED' },
  ],
  reservations: [
    { id: 1, code: 'RSV-20260820-0001', token: 'demo-token-0001', guestId: 1, employeeId: 1, date: '2026-08-20', start: '10:00', end: '11:00', purpose: 'Konsultasi layanan informasi', status: 'CONFIRMED', createdAt: '2026-08-12T04:00:00.000Z' },
  ],
  checkIns: [],
  notifications: [],
  auditLogs: [],
  settings: { serviceStart: '08:00', serviceEnd: '16:00', slotDurationMinutes: 60, maxReservationPerSlot: 1, minReservationDays: 1, maxReservationDays: 30, cancellationLimitHours: 2 },
};

function loadDb() {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  if (!existsSync(dbPath)) writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2));
  return JSON.parse(readFileSync(dbPath, 'utf8'));
}
let db = loadDb();
function saveDb() { writeFileSync(dbPath, JSON.stringify(db, null, 2)); }
function nextId(collection) { return Math.max(0, ...db[collection].map((item) => item.id || 0)) + 1; }
function publicEmployee(employee) { const unit = db.units.find((u) => u.id === employee.unitId)?.name || '-'; return { id: employee.id, name: employee.name, label: `${employee.position} ${unit}`, position: employee.position, unit }; }
function toMinutes(time) { const [h, m] = time.split(':').map(Number); return h * 60 + m; }
function fromMinutes(minutes) { return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`; }
function overlaps(startA, endA, startB, endB) { return toMinutes(startA) < toMinutes(endB) && toMinutes(endA) > toMinutes(startB); }
function audit(action, meta = {}) { db.auditLogs.unshift({ id: nextId('auditLogs'), userId: 1, action, meta, createdAt: new Date().toISOString() }); saveDb(); }
function cosineSimilarity(a, b) { if (!a || !b || a.length !== b.length) return -1; let dot = 0, ma = 0, mb = 0; for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; ma += a[i] ** 2; mb += b[i] ** 2; } return dot / (Math.sqrt(ma) * Math.sqrt(mb)); }
function findFaceMatch(descriptor, threshold = 0.55) { return db.faceEmbeddings.map((row) => ({ row, score: cosineSimilarity(descriptor, row.descriptor) })).sort((a, b) => b.score - a.score).find((m) => m.score >= threshold); }
function ensureGuest(payload) {
  const phone = String(payload.phone || '').trim();
  let guest = db.guests.find((g) => g.phone === phone);
  if (!guest) {
    guest = { id: nextId('guests'), name: payload.name, phone, company: payload.company, facePhoto: payload.facePhoto || '', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    db.guests.push(guest);
  } else {
    Object.assign(guest, { name: payload.name || guest.name, company: payload.company || guest.company, updatedAt: new Date().toISOString() });
  }
  return guest;
}
function availability(employeeId, date) {
  const result = [];
  const step = db.settings.slotDurationMinutes;
  for (let start = toMinutes(db.settings.serviceStart); start < toMinutes(db.settings.serviceEnd); start += step) {
    const slotStart = fromMinutes(start);
    const slotEnd = fromMinutes(start + step);
    const agenda = db.agendas.find((a) => a.employeeId === employeeId && a.date === date && overlaps(slotStart, slotEnd, a.start, a.end));
    const bookedCount = db.reservations.filter((r) => r.employeeId === employeeId && r.date === date && !['CANCELLED', 'EXPIRED', 'NO_SHOW'].includes(r.status) && overlaps(slotStart, slotEnd, r.start, r.end)).length;
    result.push({ start: slotStart, end: slotEnd, available: !agenda && bookedCount < db.settings.maxReservationPerSlot, reason: agenda ? agenda.title : bookedCount ? 'Slot sudah dipesan' : 'Tersedia' });
  }
  return result;
}


const routes = [];
function add(method, pattern, handler) {
  const keys = [];
  const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, (match) => { keys.push(match.slice(1)); return '([^/]+)'; }) + '$');
  routes.push({ method, regex, keys, handler });
}
const app = {
  get: (pattern, handler) => add('GET', pattern, handler),
  post: (pattern, handler) => add('POST', pattern, handler),
  put: (pattern, handler) => add('PUT', pattern, handler),
  delete: (pattern, handler) => add('DELETE', pattern, handler),
};
function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(body));
}
function makeRes(res) {
  return {
    json: (body) => sendJson(res, 200, body),
    status: (code) => ({ json: (body) => sendJson(res, code, body) }),
    sendStatus: (code) => { res.writeHead(code, { 'Access-Control-Allow-Origin': '*' }); res.end(); },
  };
}
async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}
function serveStatic(req, res, pathname) {
  const safePath = normalize(pathname === '/' ? '/index.html' : pathname).replace(/^\.\.(\/|\\|$)/, '');
  const filePath = join(rootDir, safePath);
  if (!filePath.startsWith(rootDir) || !existsSync(filePath)) return false;
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm' };
  res.writeHead(200, { 'Content-Type': types[extname(filePath)] || 'application/octet-stream' });
  createReadStream(filePath).pipe(res);
  return true;
}
app.get('/api/auth/me', (_req, res) => res.json({ user: db.users[0], role: db.roles.find((r) => r.id === db.users[0].roleId) }));
app.post('/api/auth/login', (req, res) => res.json({ token: 'demo-admin-token', user: db.users.find((u) => u.username === req.body.username) || db.users[0] }));
app.post('/api/auth/logout', (_req, res) => res.json({ ok: true }));
app.get('/api/dashboard', (_req, res) => res.json({ counts: { guests: db.guests.length, reservations: db.reservations.length, checkedIn: db.visits.filter((v) => v.status === 'CHECKED_IN').length, employees: db.employees.filter((e) => e.status === 'active').length }, currentVisits: db.visits.filter((v) => v.status === 'CHECKED_IN'), reservationsToday: db.reservations.slice(0, 10), auditLogs: db.auditLogs.slice(0, 10) }));
app.get('/api/employees', (req, res) => { const q = String(req.query.q || '').toLowerCase(); res.json(db.employees.filter((e) => e.status === 'active' && (!q || `${e.name} ${e.position}`.toLowerCase().includes(q))).map(publicEmployee)); });
app.post('/api/employees', (req, res) => { const employee = { id: nextId('employees'), ...req.body, status: 'active' }; db.employees.push(employee); audit('employee.created', { employeeId: employee.id }); res.status(201).json(employee); });
app.put('/api/employees/:id', (req, res) => { const employee = db.employees.find((e) => e.id === Number(req.params.id)); if (!employee) return res.sendStatus(404); Object.assign(employee, req.body); audit('employee.updated', { employeeId: employee.id }); res.json(employee); });
app.delete('/api/employees/:id', (req, res) => { const employee = db.employees.find((e) => e.id === Number(req.params.id)); if (!employee) return res.sendStatus(404); employee.status = 'inactive'; audit('employee.disabled', { employeeId: employee.id }); res.json(employee); });
app.get('/api/guests', (req, res) => { const q = String(req.query.q || '').toLowerCase(); res.json(db.guests.filter((g) => !q || `${g.name} ${g.phone} ${g.company}`.toLowerCase().includes(q)).map((g) => ({ ...g, totalVisits: db.visits.filter((v) => v.guestId === g.id).length }))); });
app.get('/api/guests/:id', (req, res) => { const guest = db.guests.find((g) => g.id === Number(req.params.id)); if (!guest) return res.sendStatus(404); res.json({ ...guest, visits: db.visits.filter((v) => v.guestId === guest.id) }); });
app.post('/api/guests', (req, res) => { const guest = ensureGuest(req.body); audit('guest.saved', { guestId: guest.id }); saveDb(); res.status(201).json(guest); });
app.put('/api/guests/:id', (req, res) => { const guest = db.guests.find((g) => g.id === Number(req.params.id)); if (!guest) return res.sendStatus(404); Object.assign(guest, req.body, { updatedAt: new Date().toISOString() }); audit('guest.updated', { guestId: guest.id }); res.json(guest); });
app.post('/api/face/register', (req, res) => { const guest = ensureGuest(req.body); if (Array.isArray(req.body.descriptor)) db.faceEmbeddings.push({ id: nextId('faceEmbeddings'), guestId: guest.id, descriptor: req.body.descriptor, createdAt: new Date().toISOString() }); audit('face.registered', { guestId: guest.id }); saveDb(); res.status(201).json({ guest }); });
app.post('/api/face/recognize', (req, res) => { const match = findFaceMatch(req.body.descriptor); if (!match) return res.json({ matched: false }); const guest = db.guests.find((g) => g.id === match.row.guestId); res.json({ matched: true, score: match.score, guest }); });
app.post('/api/face/verify', (req, res) => { const descriptors = db.faceEmbeddings.filter((e) => e.guestId === Number(req.body.guestId)); const best = descriptors.map((row) => cosineSimilarity(req.body.descriptor, row.descriptor)).sort((a, b) => b - a)[0] || -1; res.json({ verified: best >= 0.55, score: best }); });
app.post('/api/visits', (req, res) => { const guest = req.body.guestId ? db.guests.find((g) => g.id === Number(req.body.guestId)) : ensureGuest(req.body); const visit = { id: nextId('visits'), guestId: guest.id, employeeId: Number(req.body.employeeId), purpose: req.body.purpose, visitDate: new Date().toISOString().slice(0, 10), checkInAt: new Date().toISOString(), checkOutAt: null, visitType: req.body.visitType || 'walk-in', status: 'CHECKED_IN' }; db.visits.push(visit); db.notifications.unshift({ id: nextId('notifications'), type: 'guest.checkin', visitId: visit.id, createdAt: new Date().toISOString() }); audit('visit.checkin', { visitId: visit.id }); res.status(201).json({ visit, guest }); });
app.get('/api/visits', (_req, res) => res.json(db.visits));
app.get('/api/visits/today', (_req, res) => res.json(db.visits.filter((v) => v.visitDate === new Date().toISOString().slice(0, 10))));
app.post('/api/visits/:id/checkout', (req, res) => { const visit = db.visits.find((v) => v.id === Number(req.params.id)); if (!visit) return res.sendStatus(404); visit.checkOutAt = new Date().toISOString(); visit.status = 'COMPLETED'; audit('visit.checkout', { visitId: visit.id }); res.json(visit); });
app.get('/api/agendas', (_req, res) => res.json(db.agendas));
app.post('/api/agendas', (req, res) => { const agenda = { id: nextId('agendas'), ...req.body, employeeId: Number(req.body.employeeId) }; db.agendas.push(agenda); audit('agenda.created', { agendaId: agenda.id }); res.status(201).json(agenda); });
app.put('/api/agendas/:id', (req, res) => { const agenda = db.agendas.find((a) => a.id === Number(req.params.id)); if (!agenda) return res.sendStatus(404); Object.assign(agenda, req.body); audit('agenda.updated', { agendaId: agenda.id }); res.json(agenda); });
app.delete('/api/agendas/:id', (req, res) => { db.agendas = db.agendas.filter((a) => a.id !== Number(req.params.id)); audit('agenda.deleted', { agendaId: Number(req.params.id) }); res.json({ ok: true }); });
app.get('/api/availability', (req, res) => res.json(availability(Number(req.query.employee_id), String(req.query.date))));
app.get('/api/reservations', (_req, res) => res.json(db.reservations));
app.get('/api/reservations/:id', (req, res) => { const reservation = db.reservations.find((r) => r.id === Number(req.params.id) || r.code === req.params.id || r.token === req.params.id); if (!reservation) return res.sendStatus(404); res.json(reservation); });
app.post('/api/reservations', (req, res) => { const employeeId = Number(req.body.employeeId); const start = req.body.start; const end = req.body.end || fromMinutes(toMinutes(start) + db.settings.slotDurationMinutes); const slot = availability(employeeId, req.body.date).find((s) => s.start === start); if (!slot?.available) return res.status(409).json({ message: 'Slot tidak tersedia', slot }); const guest = ensureGuest(req.body); const id = nextId('reservations'); const code = `RSV-${req.body.date.replaceAll('-', '')}-${String(id).padStart(4, '0')}`; const reservation = { id, code, token: crypto.randomBytes(24).toString('hex'), guestId: guest.id, employeeId, date: req.body.date, start, end, purpose: req.body.purpose, status: 'CONFIRMED', createdAt: new Date().toISOString() }; db.reservations.push(reservation); db.notifications.unshift({ id: nextId('notifications'), type: 'reservation.created', reservationId: id, createdAt: new Date().toISOString() }); audit('reservation.created', { reservationId: id }); res.status(201).json({ reservation, guest }); });
app.post('/api/reservations/:id/cancel', (req, res) => { const reservation = db.reservations.find((r) => r.id === Number(req.params.id)); if (!reservation) return res.sendStatus(404); reservation.status = 'CANCELLED'; audit('reservation.cancelled', { reservationId: reservation.id }); res.json(reservation); });
app.post('/api/reservations/:id/check-in', (req, res) => { const reservation = db.reservations.find((r) => r.id === Number(req.params.id) || r.code === req.params.id || r.token === req.params.id); if (!reservation) return res.sendStatus(404); if (!['CONFIRMED', 'PENDING'].includes(reservation.status)) return res.status(409).json({ message: 'Reservasi tidak valid untuk check-in' }); reservation.status = 'CHECKED_IN'; const visit = { id: nextId('visits'), guestId: reservation.guestId, employeeId: reservation.employeeId, purpose: reservation.purpose, visitDate: new Date().toISOString().slice(0, 10), checkInAt: new Date().toISOString(), checkOutAt: null, visitType: 'reservation', status: 'CHECKED_IN' }; db.visits.push(visit); db.checkIns.push({ id: nextId('checkIns'), reservationId: reservation.id, visitId: visit.id, method: 'qr_face', createdAt: new Date().toISOString() }); audit('reservation.checkin', { reservationId: reservation.id, visitId: visit.id }); res.json({ reservation, visit }); });
app.get('/api/reports/summary', (_req, res) => res.json({ visits: db.visits.length, reservations: db.reservations.length, topEmployees: db.employees.map((e) => ({ employee: e.name, total: db.visits.filter((v) => v.employeeId === e.id).length })).sort((a, b) => b.total - a.total), topCompanies: Object.entries(db.guests.reduce((acc, g) => ({ ...acc, [g.company]: (acc[g.company] || 0) + 1 }), {})).map(([company, total]) => ({ company, total })) }));
app.get('/api/settings', (_req, res) => res.json(db.settings));
app.put('/api/settings', (req, res) => { db.settings = { ...db.settings, ...req.body }; audit('settings.updated'); res.json(db.settings); });
app.get('/api/audit-logs', (_req, res) => res.json(db.auditLogs));



const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS' }); return res.end(); }
  if (!url.pathname.startsWith('/api/') && serveStatic(req, res, url.pathname)) return;
  const route = routes.find((item) => item.method === req.method && item.regex.test(url.pathname));
  if (!route) return sendJson(res, 404, { message: 'Not found' });
  const match = url.pathname.match(route.regex);
  const params = Object.fromEntries(route.keys.map((key, index) => [key, decodeURIComponent(match[index + 1])]));
  const query = Object.fromEntries(url.searchParams.entries());
  const body = ['POST', 'PUT', 'PATCH'].includes(req.method) ? await readBody(req) : {};
  try { await route.handler({ params, query, body }, makeRes(res)); }
  catch (error) { sendJson(res, 500, { message: error.message }); }
});
server.listen(port, () => console.log(`SIMPATI berjalan di http://localhost:${port}`));
