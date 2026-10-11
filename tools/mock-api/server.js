// Mock implementation of the MTBS API contract (v1) for frontend development & testing.
// Seed logins: asha@x.com / password1 (patron) · partner@x.com / password1 · admin@x.com / password1
// New registrations use OTP 123456. Dev-only: POST /__dev/pay/:bookingId?result=success|fail simulates the gateway webhook.
import crypto from 'node:crypto';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 4000;
const ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const LOCK_MS = Number(process.env.LOCK_MS) || 8 * 60 * 1000;
const hex = () => crypto.randomBytes(12).toString('hex');
const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, status, code, message, details = []) => res.status(status).json({ success: false, error: { code, message, details } });

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: ORIGIN, credentials: true } });
app.use(cors({ origin: ORIGIN, credentials: true, exposedHeaders: ['X-Request-Id'] }));
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => { res.setHeader('X-Request-Id', hex()); next(); });

// ---------- seed data ----------
const users = [
  { id: hex(), name: 'Asha Kapoor', email: 'asha@x.com', phone: '+919999999999', password: 'password1', role: 'patron', verified: true },
  { id: hex(), name: 'Pranav Rao', email: 'partner@x.com', phone: '+919888888888', password: 'password1', role: 'partner', verified: true },
  { id: hex(), name: 'Admin User', email: 'admin@x.com', phone: '+919777777777', password: 'password1', role: 'admin', verified: true },
];
const venues = [
  { id: hex(), name: 'PVR Phoenix', city: 'Mumbai', address: 'Lower Parel', partnerIds: [users[1].id], screens: [] },
  { id: hex(), name: 'INOX Megaplex', city: 'Pune', address: 'Kalyani Nagar', partnerIds: [], screens: [] },
];
const mkScreen = (venue, name) => {
  const categoryMap = { A: 'Premium', B: 'Premium', C: 'Gold', D: 'Gold', E: 'Gold', F: 'Silver', G: 'Silver', H: 'Silver' };
  const s = { id: hex(), venueId: venue.id, name, rows: 8, cols: 12, categoryMap, pricing: { Silver: 15000, Gold: 25000, Premium: 40000 } };
  venue.screens.push(s); return s;
};
const screens = [mkScreen(venues[0], 'Screen 1'), mkScreen(venues[0], 'Screen 2'), mkScreen(venues[1], 'Audi 1')];
const titles = [
  ['movie', 'Midnight Express', ['Thriller', 'Drama'], ['Hindi', 'English'], 142, 'UA', 4.3, ['2D', 'IMAX'], 'A late-night train, a missing ledger and a ticket collector who knows too much.', ['Ananya Rao', 'Kabir Shah']],
  ['movie', 'Monsoon Letters', ['Romance', 'Drama'], ['Hindi'], 128, 'U', 4.6, ['2D'], 'Two strangers trade letters through one long Mumbai monsoon.', ['Isha Menon', 'Dev Kapoor']],
  ['movie', 'Orbit Zero', ['Sci-Fi', 'Action'], ['English', 'Hindi'], 155, 'UA', 4.1, ['2D', '3D', 'IMAX'], 'A salvage crew finds a station that should not exist.', ['Neil Sharma']],
  ['movie', 'The Last Tiffin', ['Comedy', 'Family'], ['Marathi', 'Hindi'], 118, 'U', 3.9, ['2D'], 'A dabbawala strike threatens a wedding lunch for four hundred.', ['Sayali Joshi']],
  ['movie', 'Paper Kites', ['Animation', 'Family'], ['English'], 96, 'U', 0, ['2D', '3D'], 'A girl and her kite chase the wind across Jaipur rooftops.', []],
  ['event', 'Sunset Sessions Live', ['Music'], ['Hindi', 'English'], 180, null, 4.8, [], 'An open-air evening of indie bands by the sea.', ['The Bandra Project', 'Meera & Co.']],
  ['event', 'Laugh Riot: Stand-up Night', ['Stand-up', 'Comedy'], ['Hindi'], 90, null, 4.2, [], 'Five comics, one stage, zero filters.', ['Rohan Gill', 'Priya Nair']],
].map(([type, title, genre, language, duration, rating, avgRating, format, synopsis, cast]) => ({ id: hex(), type, title, genre, language, duration, rating, avgRating, format, synopsis, cast, posterUrl: '' }));

const shows = [];
const TIMES = [[10, 30], [14, 0], [18, 45], [21, 30]];
titles.forEach((t, ti) => {
  for (let d = 0; d < 7; d += 1) TIMES.forEach(([h, m], i) => {
    const sc = screens[(ti + i) % screens.length];
    const start = new Date(); start.setDate(start.getDate() + d); start.setHours(h, m, 0, 0);
    if (start.getTime() < Date.now()) return;
    shows.push({ id: hex(), titleId: t.id, screenId: sc.id, startTime: start.toISOString(), format: t.format[i % (t.format.length || 1)] || undefined, status: 'active' });
  });
});
const seatStore = new Map(); // showId -> Map(seatId -> {status, ...})
const seatsFor = (show) => {
  if (!seatStore.has(show.id)) {
    const sc = screens.find((s) => s.id === show.screenId);
    const m = new Map(); let n = 0;
    for (let r = 0; r < sc.rows; r += 1) for (let c = 1; c <= sc.cols; c += 1) {
      const row = String.fromCharCode(65 + r); n += 1;
      m.set(`${show.id.slice(0, 12)}${String(n).padStart(12, '0')}`, { id: `${show.id.slice(0, 12)}${String(n).padStart(12, '0')}`, row, col: c, category: sc.categoryMap[row], price: sc.pricing[sc.categoryMap[row]], status: (n * 7 + r) % 11 === 0 ? 'booked' : 'available' });
    }
    seatStore.set(show.id, m);
  }
  return seatStore.get(show.id);
};
const bookings = [];
const reviews = [];
const sessions = new Map(); // access token -> user id
const refreshTokens = new Map(); // refresh -> user id
const otps = new Map();

// ---------- helpers ----------
const titleOf = (id) => titles.find((t) => t.id === id);
const showView = (s) => {
  const sc = screens.find((x) => x.id === s.screenId); const v = venues.find((x) => x.id === sc.venueId); const t = titleOf(s.titleId);
  return { id: s.id, movieEventId: t.id, movieTitle: t.title, title: t.title, venueName: v.name, screenName: sc.name, startTime: s.startTime, format: s.format, status: s.status };
};
const availability = (s) => { const all = [...seatsFor(s).values()]; const free = all.filter((x) => x.status === 'available').length; return free === 0 ? 'SOLD_OUT' : free / all.length < 0.35 ? 'FILLING_FAST' : 'AVAILABLE'; };
const auth = (roles) => (req, res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const uid = sessions.get(token);
  const user = users.find((u) => u.id === uid);
  if (!user) return fail(res, 401, 'UNAUTHENTICATED', 'Missing, invalid or expired access token');
  if (roles && !roles.includes(user.role)) return fail(res, 403, 'FORBIDDEN', 'Role check failed');
  req.user = user; return next();
};
const optionalUser = (req) => users.find((u) => u.id === sessions.get((req.headers.authorization || '').replace('Bearer ', '')));
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role });
const newSession = (u, res) => {
  const at = crypto.randomBytes(16).toString('hex'); sessions.set(at, u.id);
  const rt = crypto.randomBytes(16).toString('hex'); refreshTokens.set(rt, u.id);
  res.cookie('rt', rt, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 864e5 });
  return at;
};
const room = (showId) => `show:${showId}`;
const emitSeat = (showId, seatId, status, lockedBy) => io.of('/seats').to(room(showId)).emit('seat:update', { showId, seatId, status, lockedBy });
const expireLocks = () => {
  bookings.filter((b) => b.status === 'Locked' && new Date(b.lockExpiresAt) < new Date()).forEach((b) => {
    b.status = 'Expired';
    const seats = seatsFor(shows.find((s) => s.id === b.showId));
    b.seats.forEach((x) => { seats.get(x.id).status = 'available'; delete seats.get(x.id).bookingId; emitSeat(b.showId, x.id, 'available'); });
    io.of('/seats').to(`user:${b.userId}`).emit('booking:expired', { bookingId: b.id });
  });
};
setInterval(expireLocks, 2000);
const bookingView = (b) => ({ id: b.id, showId: b.showId, status: b.status, seats: b.seats, amountBreakdown: b.amountBreakdown, qrPayload: b.qrPayload, createdAt: b.createdAt, lockExpiresAt: b.lockExpiresAt, show: (({ movieTitle, venueName, screenName, startTime }) => ({ movieTitle, venueName, screenName, startTime }))(showView(shows.find((s) => s.id === b.showId))) });
const paginate = (arr, req) => { const page = Number(req.query.page) || 1; const limit = Math.min(Number(req.query.limit) || 20, 50); return { items: arr.slice((page - 1) * limit, page * limit), total: arr.length, page, limit }; };

// ---------- auth ----------
app.post('/api/v1/auth/register', (req, res) => {
  const { name, email, phone, password } = req.body || {};
  if (!name || !email || !phone || !password) return fail(res, 422, 'VALIDATION_ERROR', 'Invalid input', [{ field: 'email', message: 'Required' }]);
  if (users.some((u) => u.email === email || u.phone === phone)) return fail(res, 409, 'CONFLICT', 'Email or phone already registered');
  const u = { id: hex(), name, email, phone, password, role: 'patron', verified: false, fails: 0 }; users.push(u); otps.set(u.id, '123456');
  return ok(res, { userId: u.id, otpSent: true }, 201);
});
app.post('/api/v1/auth/verify-otp', (req, res) => { const u = users.find((x) => x.id === req.body.userId); if (!u || otps.get(u.id) !== req.body.otp) return fail(res, 400, 'BAD_REQUEST', 'Invalid or expired OTP'); u.verified = true; return ok(res, { verified: true }); });
app.post('/api/v1/auth/resend-otp', (req, res) => ok(res, { otpSent: true }));
app.post('/api/v1/auth/login', (req, res) => {
  const { identifier, password } = req.body || {};
  const u = users.find((x) => x.email === identifier || x.phone === identifier);
  if (u?.lockedUntil > Date.now()) return fail(res, 423, 'ACCOUNT_LOCKED', 'Account locked');
  if (!u || u.password !== password || !u.verified) { if (u) { u.fails = (u.fails || 0) + 1; if (u.fails >= 5) u.lockedUntil = Date.now() + 15 * 60000; } return fail(res, 401, 'UNAUTHENTICATED', 'Invalid credentials'); }
  u.fails = 0; return ok(res, { accessToken: newSession(u, res), user: publicUser(u) });
});
app.post('/api/v1/auth/refresh', (req, res) => { const uid = refreshTokens.get(req.cookies.rt); const u = users.find((x) => x.id === uid); if (!u) return fail(res, 401, 'UNAUTHENTICATED', 'Refresh token invalid'); const at = crypto.randomBytes(16).toString('hex'); sessions.set(at, u.id); return ok(res, { accessToken: at }); });
app.post('/api/v1/auth/logout', auth(), (req, res) => { refreshTokens.delete(req.cookies.rt); res.clearCookie('rt'); res.status(204).end(); });
app.post('/api/v1/auth/forgot-password', (req, res) => ok(res, { sent: true }));
app.post('/api/v1/auth/reset-password', (req, res) => (req.body.token === 'bad' ? fail(res, 400, 'BAD_REQUEST', 'Invalid token') : ok(res, { reset: true })));
app.get('/api/v1/auth/me', auth(), (req, res) => ok(res, { user: publicUser(req.user) }));

// ---------- catalog ----------
const card = (t) => ({ id: t.id, type: t.type, title: t.title, posterUrl: t.posterUrl, genre: t.genre, language: t.language, duration: t.duration, rating: t.rating || undefined, avgRating: t.avgRating });
const listTitles = (type) => (req, res) => {
  const { q, genre, language, format, city } = req.query;
  let list = titles.filter((t) => t.type === type);
  if (q) list = list.filter((t) => t.title.toLowerCase().includes(String(q).toLowerCase()));
  if (genre) list = list.filter((t) => t.genre.includes(genre));
  if (language) list = list.filter((t) => t.language.includes(language));
  if (format) list = list.filter((t) => t.format.includes(format));
  if (city) list = list.filter((t) => shows.some((s) => s.titleId === t.id && venues.find((v) => v.id === screens.find((x) => x.id === s.screenId).venueId).city === city));
  const p = paginate(list.map(card), req); return ok(res, p);
};
const titleDetail = (type) => (req, res) => {
  const t = titles.find((x) => x.id === req.params.id && x.type === type);
  if (!t) return fail(res, 404, 'NOT_FOUND', 'Title not found');
  const day = req.query.date; const byVenue = new Map();
  shows.filter((s) => s.titleId === t.id && s.status === 'active' && (!day || s.startTime.slice(0, 10) === day || new Date(s.startTime).toLocaleDateString('en-CA') === day)).forEach((s) => {
    const sc = screens.find((x) => x.id === s.screenId); const v = venues.find((x) => x.id === sc.venueId);
    if (req.query.city && v.city !== req.query.city) return;
    if (!byVenue.has(v.id)) byVenue.set(v.id, { venue: { id: v.id, name: v.name, city: v.city }, shows: [] });
    byVenue.get(v.id).shows.push({ id: s.id, startTime: s.startTime, format: s.format, screenName: sc.name, priceFrom: Math.min(...Object.values(sc.pricing)), availability: availability(s) });
  });
  return ok(res, { [type]: t, showsByVenue: [...byVenue.values()] });
};
app.get('/api/v1/movies', listTitles('movie')); app.get('/api/v1/events', listTitles('event'));
app.get('/api/v1/movies/:id', titleDetail('movie')); app.get('/api/v1/events/:id', titleDetail('event'));
app.get('/api/v1/cities', (req, res) => ok(res, { items: [...new Set(venues.map((v) => v.city))].map((name) => ({ name })) }));
app.get('/api/v1/recommendations', (req, res) => ok(res, { items: titles.slice(0, 5).map(card) }));
const listReviews = (type) => (req, res) => { const list = reviews.filter((r) => r.titleId === req.params.id); const p = paginate(list, req); return ok(res, { ...p, avgRating: list.length ? list.reduce((n, r) => n + r.rating, 0) / list.length : 0 }); };
app.get('/api/v1/movies/:id/reviews', listReviews('movie')); app.get('/api/v1/events/:id/reviews', listReviews('event'));
app.post('/api/v1/reviews', auth(['patron']), (req, res) => {
  const { movieEventId, rating, comment } = req.body;
  if (!bookings.some((b) => b.userId === req.user.id && b.status === 'Booked' && shows.find((s) => s.id === b.showId).titleId === movieEventId && new Date(shows.find((s) => s.id === b.showId).startTime) < new Date())) return fail(res, 403, 'FORBIDDEN', 'You can review after attending a show');
  if (reviews.some((r) => r.userId === req.user.id && r.titleId === movieEventId)) return fail(res, 409, 'CONFLICT', 'Already reviewed');
  const r = { id: hex(), userId: req.user.id, titleId: movieEventId, userName: req.user.name, rating, comment, createdAt: new Date().toISOString() }; reviews.push(r); return ok(res, { review: r }, 201);
});

// ---------- shows & seats ----------
app.get('/api/v1/shows/:id', (req, res) => { const s = shows.find((x) => x.id === req.params.id); return s ? ok(res, { show: showView(s) }) : fail(res, 404, 'NOT_FOUND', 'Show not found'); });
app.get('/api/v1/shows/:id/seatmap', (req, res) => { const s = shows.find((x) => x.id === req.params.id); if (!s) return fail(res, 404, 'NOT_FOUND', 'Show not found'); const sc = screens.find((x) => x.id === s.screenId); return ok(res, { showId: s.id, rows: sc.rows, cols: sc.cols, seats: [...seatsFor(s).values()].map(({ id, row, col, category, price, status }) => ({ id, row, col, category, price, status })), pricing: sc.pricing }); });

// ---------- bookings ----------
app.post('/api/v1/bookings/lock', auth(['patron']), (req, res) => {
  const { showId, seatIds } = req.body || {}; const show = shows.find((s) => s.id === showId);
  if (!show) return fail(res, 404, 'NOT_FOUND', 'Show not found');
  if (!Array.isArray(seatIds) || seatIds.length > 10) return fail(res, 422, 'MAX_SEATS_EXCEEDED', 'Too many seats');
  const store = seatsFor(show);
  if (seatIds.some((id) => !store.has(id) || store.get(id).status !== 'available')) return fail(res, 409, 'SEAT_UNAVAILABLE', 'One or more seats are no longer available');
  const seats = seatIds.map((id) => store.get(id)); const ticketTotal = seats.reduce((n, s) => n + s.price, 0); const taxes = Math.round(ticketTotal * 0.18); const convenienceFee = 5000 * seats.length / 2;
  const b = { id: hex(), userId: req.user.id, showId, status: 'Locked', seats: seats.map(({ id, row, col, category }) => ({ id, row, col, category })), lockExpiresAt: new Date(Date.now() + LOCK_MS).toISOString(), amountBreakdown: { ticketTotal, taxes, convenienceFee, grandTotal: ticketTotal + taxes + convenienceFee, currency: 'INR' }, createdAt: new Date().toISOString() };
  seats.forEach((s) => { s.status = 'locked'; s.bookingId = b.id; emitSeat(showId, s.id, 'locked', 'other'); }); bookings.push(b);
  return ok(res, { bookingId: b.id, status: 'Locked', seats: b.seats, lockExpiresAt: b.lockExpiresAt, amountBreakdown: b.amountBreakdown }, 201);
});
const own = (req, res) => { const b = bookings.find((x) => x.id === req.params.id); if (!b) { fail(res, 404, 'NOT_FOUND', 'Booking not found'); return null; } if (b.userId !== req.user.id) { fail(res, 403, 'FORBIDDEN', 'Not your booking'); return null; } return b; };
app.get('/api/v1/bookings/mine', auth(['patron']), (req, res) => {
  const { status } = req.query; const now = new Date();
  const mine = bookings.filter((b) => b.userId === req.user.id && !['Locked', 'Pending', 'Expired', 'Failed'].includes(b.status)).filter((b) => { const past = new Date(shows.find((s) => s.id === b.showId).startTime) < now; return status === 'Cancelled' ? b.status === 'Cancelled' : status === 'Completed' ? b.status === 'Booked' && past : b.status === 'Booked' && !past; });
  const p = paginate(mine.map(bookingView), req); return ok(res, p);
});
app.delete('/api/v1/bookings/:id/release', auth(['patron']), (req, res) => { const b = own(req, res); if (!b) return; if (b.status === 'Locked') { b.status = 'Expired'; const st = seatsFor(shows.find((s) => s.id === b.showId)); b.seats.forEach((x) => { st.get(x.id).status = 'available'; emitSeat(b.showId, x.id, 'available'); }); } return res.status(204).end(); });
app.get('/api/v1/bookings/:id', auth(['patron']), (req, res) => { const b = own(req, res); if (b) ok(res, { booking: bookingView(b) }); });
app.get('/api/v1/bookings/:id/status', auth(['patron']), (req, res) => { const b = own(req, res); if (b) ok(res, { status: b.status, qrPayload: b.qrPayload, failureReason: b.failureReason }); });
app.get('/api/v1/bookings/:id/refund-estimate', auth(['patron']), (req, res) => { const b = own(req, res); if (!b) return; const st = new Date(shows.find((s) => s.id === b.showId).startTime); const hrs = (st - Date.now()) / 36e5; const percent = hrs > 24 ? 100 : hrs > 2 ? 50 : 0; return ok(res, { refundAmount: Math.round(b.amountBreakdown.grandTotal * percent / 100), percent, cutoffAt: new Date(st.getTime() - 2 * 36e5).toISOString() }); });
app.post('/api/v1/bookings/:id/cancel', auth(['patron']), (req, res) => {
  const b = own(req, res); if (!b) return; const st = new Date(shows.find((s) => s.id === b.showId).startTime);
  if ((st - Date.now()) / 36e5 < 2) return fail(res, 403, 'PAST_CUTOFF', 'Past the cancellation cutoff');
  b.status = 'Cancelled'; const store = seatsFor(shows.find((s) => s.id === b.showId)); b.seats.forEach((x) => { store.get(x.id).status = 'available'; emitSeat(b.showId, x.id, 'available'); });
  const hrs = (st - Date.now()) / 36e5; const percent = hrs > 24 ? 100 : 50; return ok(res, { status: 'Cancelled', refundEstimate: { refundAmount: Math.round(b.amountBreakdown.grandTotal * percent / 100), percent } });
});
app.get('/api/v1/bookings/:id/invoice', auth(['patron']), (req, res) => { const b = own(req, res); if (!b) return; res.type('application/pdf').send(Buffer.from('%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 100]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF')); });

// ---------- payments ----------
app.post('/api/v1/payments/initiate', auth(['patron']), (req, res) => { const b = bookings.find((x) => x.id === req.body.bookingId); if (!b) return fail(res, 404, 'NOT_FOUND', 'Booking not found'); if (b.status !== 'Locked' || new Date(b.lockExpiresAt) < new Date()) return fail(res, 410, 'LOCK_EXPIRED', 'Seat hold expired'); b.status = 'Pending'; return ok(res, { orderId: `order_${hex().slice(0, 10)}`, amount: b.amountBreakdown.grandTotal, currency: 'INR', keyId: 'rzp_test_mock' }); });
app.get('/api/v1/payments/:bookingId', auth(['patron']), (req, res) => ok(res, { status: 'Pending', receiptUrl: null }));
// Dev-only stand-in for the Razorpay webhook (BR-5).
app.post('/__dev/pay/:bookingId', (req, res) => {
  const b = bookings.find((x) => x.id === req.params.bookingId); if (!b) return res.status(404).end();
  const store = seatsFor(shows.find((s) => s.id === b.showId));
  if (req.query.result === 'fail') { b.status = 'Failed'; b.failureReason = 'Your bank declined the payment.'; b.seats.forEach((x) => { store.get(x.id).status = 'available'; emitSeat(b.showId, x.id, 'available'); }); }
  else { b.status = 'Booked'; b.qrPayload = `MTBS.${b.id}.${crypto.randomBytes(6).toString('hex')}`; b.seats.forEach((x) => { store.get(x.id).status = 'booked'; emitSeat(b.showId, x.id, 'booked'); }); }
  res.json({ ok: true, status: b.status });
});
app.post('/__dev/expire/:bookingId', (req, res) => { const b = bookings.find((x) => x.id === req.params.bookingId); if (b) b.lockExpiresAt = new Date(Date.now() - 1000).toISOString(); res.json({ ok: true }); });
app.post('/__dev/past-booking', (req, res) => { // make a Booked booking for the patron on a show that already started (for review/completed tests)
  const u = users[0]; const t = titles[0]; const s = { id: hex(), titleId: t.id, screenId: screens[0].id, startTime: new Date(Date.now() - 864e5).toISOString(), format: '2D', status: 'active' }; shows.push(s);
  const st = seatsFor(s); const seat = [...st.values()].find((x) => x.status === 'available'); seat.status = 'booked';
  bookings.push({ id: hex(), userId: u.id, showId: s.id, status: 'Booked', seats: [{ id: seat.id, row: seat.row, col: seat.col, category: seat.category }], amountBreakdown: { ticketTotal: seat.price, taxes: 0, convenienceFee: 0, grandTotal: seat.price, currency: 'INR' }, qrPayload: 'MTBS.past', createdAt: new Date().toISOString() });
  res.json({ ok: true, titleId: t.id });
});

// ---------- admin ----------
const scoped = (req) => (req.user.role === 'admin' ? venues : venues.filter((v) => v.partnerIds.includes(req.user.id)));
const venueGuard = (req, res) => { const v = venues.find((x) => x.id === req.params.id); if (!v) { fail(res, 404, 'NOT_FOUND', 'Venue not found'); return null; } if (req.user.role !== 'admin' && !v.partnerIds.includes(req.user.id)) { fail(res, 403, 'FORBIDDEN', 'Not your venue'); return null; } return v; };
app.get('/api/v1/admin/venues', auth(['partner', 'admin']), (req, res) => ok(res, { items: scoped(req) }));
app.post('/api/v1/admin/venues', auth(['admin']), (req, res) => { const v = { id: hex(), ...req.body, screens: [] }; venues.push(v); ok(res, { venue: v }, 201); });
app.post('/api/v1/admin/venues/:id/screens', auth(['partner', 'admin']), (req, res) => { const v = venueGuard(req, res); if (!v) return; const s = { id: hex(), venueId: v.id, ...req.body, pricing: { Silver: 15000, Gold: 25000, Premium: 40000 } }; screens.push(s); v.screens.push(s); ok(res, { screen: s }, 201); });
app.patch('/api/v1/admin/screens/:id/pricing', auth(['partner', 'admin']), (req, res) => { const s = screens.find((x) => x.id === req.params.id); if (!s) return fail(res, 404, 'NOT_FOUND', 'Screen not found'); s.pricing = { ...s.pricing, ...req.body }; ok(res, { screen: s }); });
app.put('/api/v1/admin/venues/:id/refund-policy', auth(['partner', 'admin']), (req, res) => { const v = venueGuard(req, res); if (!v) return; v.refundPolicy = req.body; ok(res, { policy: req.body }); });
app.post('/api/v1/admin/movies-events', auth(['partner', 'admin']), (req, res) => { const t = { id: hex(), avgRating: 0, rating: null, ...req.body }; titles.push(t); ok(res, { movieEvent: t }, 201); });
app.patch('/api/v1/admin/movies-events/:id', auth(['partner', 'admin']), (req, res) => { const t = titles.find((x) => x.id === req.params.id); if (!t) return fail(res, 404, 'NOT_FOUND', 'Not found'); Object.assign(t, req.body); ok(res, { movieEvent: t }); });
app.post('/api/v1/admin/uploads/poster', auth(['partner', 'admin']), (req, res) => ok(res, { url: 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><rect width="200" height="300" fill="#4B3A8C"/></svg>') }, 201));
app.post('/api/v1/admin/shows', auth(['partner', 'admin']), (req, res) => {
  const { movieEventId, screenId, startTime } = req.body; const sc = screens.find((x) => x.id === screenId); if (!sc) return fail(res, 404, 'NOT_FOUND', 'Screen not found');
  const v = venues.find((x) => x.id === sc.venueId); if (req.user.role !== 'admin' && !v.partnerIds.includes(req.user.id)) return fail(res, 403, 'FORBIDDEN', 'Not your venue');
  if (shows.some((s) => s.screenId === screenId && Math.abs(new Date(s.startTime) - new Date(startTime)) < 3 * 36e5)) return fail(res, 409, 'CONFLICT', 'Overlapping show');
  const s = { id: hex(), titleId: movieEventId, screenId, startTime, format: '2D', status: 'active' }; shows.push(s); ok(res, { show: showView(s) }, 201);
});
app.patch('/api/v1/admin/shows/:id', auth(['partner', 'admin']), (req, res) => { const s = shows.find((x) => x.id === req.params.id); if (!s) return fail(res, 404, 'NOT_FOUND', 'Not found'); Object.assign(s, req.body); ok(res, { show: showView(s) }); });
app.delete('/api/v1/admin/shows/:id', auth(['partner', 'admin']), (req, res) => { const s = shows.find((x) => x.id === req.params.id); if (!s) return fail(res, 404, 'NOT_FOUND', 'Not found'); if (bookings.some((b) => b.showId === s.id && b.status === 'Booked')) return fail(res, 409, 'HAS_BOOKINGS', 'Show has bookings'); shows.splice(shows.indexOf(s), 1); res.status(204).end(); });
app.get('/api/v1/admin/venues/:id/analytics', auth(['partner', 'admin']), (req, res) => { const v = venueGuard(req, res); if (!v) return; ok(res, { occupancyRate: 0.62, revenue: 18450000, bookingsByDay: Array.from({ length: 14 }, (_, i) => ({ date: new Date(Date.now() - (13 - i) * 864e5).toISOString().slice(0, 10), bookings: 20 + ((i * 17) % 40) })) }); });
const partners = [];
app.post('/api/v1/admin/partners', auth(['admin']), (req, res) => { const p = { id: hex(), ...req.body }; partners.push(p); (req.body.venueIds || []).forEach((id) => venues.find((v) => v.id === id)?.partnerIds.push(p.id)); ok(res, { partner: p }, 201); });
app.patch('/api/v1/admin/partners/:id/venues', auth(['admin']), (req, res) => ok(res, { updated: true }));
app.get('/api/v1/admin/disputes', auth(['admin']), (req, res) => ok(res, { items: [{ id: hex(), bookingId: hex(), status: 'open', reason: 'Charged twice', amount: 64000, createdAt: new Date().toISOString() }], total: 1, page: 1, limit: 20 }));
app.get('/api/v1/admin/audit-log', auth(['admin']), (req, res) => ok(res, { items: [{ id: hex(), actorId: users[1].id, action: 'show.create', resource: 'show', createdAt: new Date().toISOString() }] }));

// ---------- sockets ----------
io.of('/seats').on('connection', (socket) => {
  const uid = sessions.get(socket.handshake.auth?.token); if (uid) socket.join(`user:${uid}`);
  socket.on('join:show', ({ showId }) => { const s = shows.find((x) => x.id === showId); if (!s) return; socket.join(room(showId)); socket.emit('seat:init', { showId, seats: [...seatsFor(s).values()].map((x) => ({ seatId: x.id, status: x.status })) }); });
  socket.on('leave:show', ({ showId }) => socket.leave(room(showId)));
});

app.use((req, res) => fail(res, 404, 'NOT_FOUND', 'Route not found'));
server.listen(PORT, () => console.log(`Mock MTBS API on http://localhost:${PORT}/api/v1`));
