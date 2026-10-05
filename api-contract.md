# MTBS API Contract (v1)

**Project:** Movie/Event Ticket Booking System (ShowTime)
**Source:** SRS v1.0 + Technical Blueprint
**Status:** DRAFT → freeze after both developers sign off
**Owners:** Dev 1 (Backend), Dev 2 (Frontend) — *this file is edited via PR only; both must approve.*

> Rule: any endpoint change updates this file **in the same PR** as the code change.

---

## 0. Conventions

| Item | Value |
|---|---|
| Base URL (dev) | `http://localhost:4000/api/v1` |
| WebSocket URL (dev) | `http://localhost:4000` (Socket.IO namespace `/seats`) |
| Content type | `application/json` |
| Auth | `Authorization: Bearer <accessToken>` (15 min). Refresh token = `httpOnly; Secure; SameSite=Strict` cookie (7 days) |
| Timestamps | ISO-8601 UTC strings, e.g. `2026-10-05T14:30:00.000Z` |
| IDs | MongoDB ObjectId as 24-char hex string |
| Money | Integer **paise** (₹1 = 100) in all API fields; currency `INR` |
| Pagination | `?page=1&limit=20` (max `limit` = 50). Response includes `total`, `page`, `limit` |
| Validation | Every request body/query validated by Zod schemas from `packages/shared-types` |

### 0.1 Response envelope

Success:
```json
{ "success": true, "data": { } }
```
Error:
```json
{ "success": false, "error": { "code": "SEAT_UNAVAILABLE", "message": "One or more seats are no longer available", "details": [] } }
```

### 0.2 Standard error codes

| HTTP | `code` | Meaning |
|---|---|---|
| 400 | `BAD_REQUEST` | Malformed request / invalid OTP / invalid token |
| 401 | `UNAUTHENTICATED` | Missing, invalid or expired access token |
| 403 | `FORBIDDEN` | Role or ownership check failed (RBAC, BR-4) |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Duplicate resource / state conflict |
| 409 | `SEAT_UNAVAILABLE` | Seat locked or booked (BR-1) |
| 410 | `LOCK_EXPIRED` | Seat hold expired before payment |
| 422 | `VALIDATION_ERROR` | Zod validation failed (`details[]` has field errors) |
| 422 | `MAX_SEATS_EXCEEDED` | More than `MAX_SEATS_PER_BOOKING` (REQ-3.5) |
| 423 | `ACCOUNT_LOCKED` | 5 failed logins → 15 min lock (REQ-1.6) |
| 429 | `RATE_LIMITED` | Too many requests (login, OTP, payment-initiate) |
| 500 | `INTERNAL_ERROR` | Unexpected server error (logged with `requestId`) |

Every response carries header `X-Request-Id` for log correlation.

### 0.3 Roles

| Role | Value | Notes |
|---|---|---|
| Guest | *(no token)* | Browse/search only (REQ-2.3) |
| Patron | `patron` | Lock seats, pay, cancel, review (BR-2) |
| Venue Partner | `partner` | Only venues in `Venue.partnerIds` (BR-4) |
| System Admin | `admin` | Cross-venue, onboarding, disputes |

---

## 1. Authentication — `/auth`

| Method | Endpoint | Auth | Body | Success | Errors |
|---|---|---|---|---|---|
| POST | `/auth/register` | No | `{ name, email, phone, password }` | `201 { userId, otpSent: true }` | 409 duplicate email/phone, 422 |
| POST | `/auth/verify-otp` | No | `{ userId, otp }` | `200 { verified: true }` | 400 invalid/expired OTP |
| POST | `/auth/resend-otp` | No | `{ userId }` | `200 { otpSent: true }` | 429 |
| POST | `/auth/login` | No | `{ identifier, password }` (email or phone) | `200 { accessToken, user }` + sets refresh cookie | 401, 423 |
| POST | `/auth/refresh` | Cookie | — | `200 { accessToken }` | 401 |
| POST | `/auth/logout` | Yes | — | `204` | — |
| POST | `/auth/forgot-password` | No | `{ email }` | `200 { sent: true }` | 429 |
| POST | `/auth/reset-password` | No | `{ token, newPassword }` | `200 { reset: true }` | 400 |
| GET | `/auth/me` | Yes | — | `200 { user }` | 401 |

**Rules**
- Password: min 8 chars, ≥1 letter and ≥1 number. Stored with bcrypt (cost 12).
- Account is inactive until phone OTP is verified (REQ-1.2).
- OTP: 6 digits, valid 10 min, max 5 attempts.
- `forgot-password` always returns `200` (do not reveal whether the email exists).
- Password reset invalidates all existing refresh tokens for that user.
- Rate limit: login & OTP endpoints — 5 requests / minute / IP.

**`user` object**
```json
{ "id": "…", "name": "Asha K", "email": "asha@x.com", "phone": "+919999999999", "role": "patron" }
```

---

## 2. Catalog — public

| Method | Endpoint | Query | Success |
|---|---|---|---|
| GET | `/movies` | `city`, `genre`, `language`, `date`, `format` (2D/3D/IMAX), `q`, `page`, `limit` | `200 { items: MovieCard[], total, page, limit }` |
| GET | `/movies/:id` | `city`, `date` | `200 { movie, showsByVenue }` |
| GET | `/events` | same as `/movies` | `200 { items: EventCard[], total, page, limit }` |
| GET | `/events/:id` | `city`, `date` | `200 { event, showsByVenue }` |
| GET | `/cities` | — | `200 { items: [{ name }] }` |
| GET | `/recommendations` | `city` (Auth optional) | `200 { items: MovieCard[] }` — **v1.0 stub:** returns trending; personalised if logged in with history |

Search must respond ≤ 2 s for 10,000 active shows (REQ-2.4).

**`MovieCard`**
```json
{ "id": "…", "type": "movie", "title": "…", "posterUrl": "…", "genre": ["Action"], "language": ["Hindi"], "duration": 142, "rating": "UA", "avgRating": 4.3 }
```

**`showsByVenue`** (in detail response)
```json
[
  {
    "venue": { "id": "…", "name": "PVR Phoenix", "city": "Mumbai" },
    "shows": [
      { "id": "…", "startTime": "2026-10-05T14:30:00.000Z", "format": "IMAX", "screenName": "Screen 2",
        "priceFrom": 15000, "availability": "FILLING_FAST" }
    ]
  }
]
```
`availability` ∈ `AVAILABLE | FILLING_FAST | SOLD_OUT`.

---

## 3. Seat map — `/shows`

| Method | Endpoint | Auth | Success |
|---|---|---|---|
| GET | `/shows/:id` | No | `200 { show }` |
| GET | `/shows/:id/seatmap` | No (view) | `200 { showId, rows, cols, seats[], pricing }` |

**Seat**
```json
{ "id": "…", "row": "A", "col": 5, "category": "Gold", "price": 25000, "status": "available" }
```
`status` ∈ `available | locked | booked`. (`selected` is client-only UI state.)

`seatmap` merges MongoDB bookings with live Redis locks. Interacting (locking) requires login (REQ-2.3).

---

## 4. Booking & Seat Locking — `/bookings`

| Method | Endpoint | Auth / Role | Body | Success | Errors |
|---|---|---|---|---|---|
| POST | `/bookings/lock` | Patron | `{ showId, seatIds: [] }` | `201 { bookingId, status: "Locked", seats[], lockExpiresAt, amountBreakdown }` | 409 `SEAT_UNAVAILABLE`, 422 `MAX_SEATS_EXCEEDED` |
| DELETE | `/bookings/:id/release` | Patron (own) | — | `204` | 404 |
| GET | `/bookings/:id` | Patron (own) | — | `200 { booking }` | 404 |
| GET | `/bookings/:id/status` | Patron (own) | — | `200 { status, qrPayload?, failureReason? }` | 404 |
| GET | `/bookings/mine` | Patron | `?status=Upcoming\|Completed\|Cancelled&page&limit` | `200 { items[], total }` | — |
| POST | `/bookings/:id/cancel` | Patron (own) | — | `200 { status: "Cancelled", refundEstimate }` | 403 `PAST_CUTOFF` |
| GET | `/bookings/:id/refund-estimate` | Patron (own) | — | `200 { refundAmount, percent, cutoffAt }` | — |
| GET | `/bookings/:id/invoice` | Patron (own) | — | `200` PDF stream (`application/pdf`) | 404 |

**Lock behaviour**
- All-or-nothing: if any one seat conflicts, **no** seats are locked → `409`, never queued (BR-1).
- Hold duration: `SEAT_LOCK_TTL_MINUTES` (default 8). The **server** is authoritative — frontend countdown uses `lockExpiresAt`.
- Max `MAX_SEATS_PER_BOOKING` (default 10) seats per transaction.
- Re-posting for seats the same user already holds returns the existing lock.

**`amountBreakdown`**
```json
{ "ticketTotal": 50000, "taxes": 9000, "convenienceFee": 5000, "grandTotal": 64000, "currency": "INR" }
```

**Booking status enum:** `Pending | Locked | Booked | Cancelled | Failed | Expired`

**`booking` object**
```json
{
  "id": "…", "showId": "…", "status": "Booked",
  "seats": [{ "id": "…", "row": "A", "col": 5, "category": "Gold" }],
  "amountBreakdown": { },
  "qrPayload": "signed-token-string",
  "createdAt": "…",
  "show": { "movieTitle": "…", "venueName": "…", "screenName": "…", "startTime": "…" }
}
```

**Cancellation:** allowed only until `RefundPolicy.cutoffHours` before show (REQ-5.2). Seats return to `available` immediately (REQ-5.4); refund is initiated via gateway (5–7 business days, REQ-5.3).
Suggested default tiers (TBD #4, per-venue configurable): `>24h = 100%`, `2–24h = 50%`, `<2h = not cancellable`.

---

## 5. Payments — `/payments`

| Method | Endpoint | Auth | Body | Success |
|---|---|---|---|---|
| POST | `/payments/initiate` | Patron | `{ bookingId }` | `200 { orderId, amount, currency, keyId }` |
| POST | `/payments/webhook` | **No user auth** — HMAC signature | Gateway payload | `200` ack |
| GET | `/payments/:bookingId` | Patron (own) | — | `200 { status, receiptUrl }` |

**Rules**
- `initiate` fails with `410 LOCK_EXPIRED` if the hold has lapsed.
- Rate limited (extends §5.3 of SRS to payment-initiate).
- **Webhook is the only source of truth (BR-5).** The frontend must never treat the Razorpay client callback as success — it polls `GET /bookings/:id/status` until `Booked` or `Failed`.
- Webhook handler order: (1) verify HMAC signature using raw body → (2) idempotency check on gateway event ID → (3) single Mongo transaction: Payment→success, Booking→Booked, Seats→Booked → (4) delete Redis locks → (5) generate QR → (6) enqueue email/SMS.
- Failure/timeout: release lock within 30 s, `status = Failed`, include `failureReason` (REQ-4.4).
- Gateway is wrapped by an adapter interface (`createOrder`, `verifyWebhook`, `refund`) so Stripe can replace Razorpay (TBD #1).

**Polling contract:** poll every 2 s, up to 60 s; `status` ∈ `Locked | Pending | Booked | Failed | Expired`.

---

## 6. Tickets (venue scanner)

| Method | Endpoint | Auth | Body | Success |
|---|---|---|---|---|
| POST | `/tickets/validate` | Scanner API key (`X-Scanner-Key`) | `{ qrPayload, venueId }` | `200 { valid: true, bookingId, seats[], showTime }` |

Errors: `404 INVALID_TICKET`, `409 ALREADY_REDEEMED`, `403 WRONG_VENUE_OR_SHOW`. Marks ticket `redeemed` atomically on first valid scan.
*(SRS defines no Venue Staff login — scanner-only. Confirm before building any staff UI.)*

---

## 7. Reviews — `/reviews` *(gap-filled; not in SRS requirements)*

| Method | Endpoint | Auth | Body / Query | Success |
|---|---|---|---|---|
| POST | `/reviews` | Patron | `{ movieEventId, rating (1–5), comment? (≤1000) }` | `201 { review }` |
| GET | `/movies/:id/reviews` | No | `?page&limit` | `200 { items[], avgRating, total }` |
| GET | `/events/:id/reviews` | No | `?page&limit` | `200 { items[], avgRating, total }` |

Allowed only if the user has a `Booked` booking for a show of that title **and** the show start time has passed. One review per user per title (`409` otherwise).

---

## 8. Partner / Admin — `/admin`

All routes need role `partner` or `admin`. Partners are additionally restricted to venues listing them in `partnerIds` (BR-4) → otherwise `403 FORBIDDEN`.

### 8.1 Venues & screens
| Method | Endpoint | Role | Body | Success |
|---|---|---|---|---|
| GET | `/admin/venues` | Partner (own) / Admin (all) | — | `200 { items[] }` |
| POST | `/admin/venues` | Admin | `{ name, city, address, partnerIds[] }` | `201 { venue }` |
| POST | `/admin/venues/:id/screens` | Partner (own) | `{ name, rows, cols, categoryMap }` | `201 { screen }` |
| PATCH | `/admin/screens/:id/pricing` | Partner (own) | `{ Silver: 15000, Gold: 25000, Premium: 40000 }` | `200 { screen }` |
| PUT | `/admin/venues/:id/refund-policy` | Partner (own) | `{ cutoffHours, refundTiers: [{ hoursBefore, percent }] }` | `200 { policy }` |

`categoryMap` example: `{ "A": "Premium", "B": "Gold", "C": "Silver" }` (row letter → category).

### 8.2 Movies/events (catalog)
| Method | Endpoint | Role | Body | Success |
|---|---|---|---|---|
| POST | `/admin/movies-events` | Partner/Admin | `{ type, title, genre[], language[], duration, synopsis, format[], cast[] }` | `201` |
| PATCH | `/admin/movies-events/:id` | Partner/Admin | partial fields | `200` |
| POST | `/admin/uploads/poster` | Partner/Admin | `multipart/form-data` (`file`) | `201 { url }` |

### 8.3 Shows
| Method | Endpoint | Role | Body | Success | Errors |
|---|---|---|---|---|---|
| POST | `/admin/shows` | Partner (own) | `{ movieEventId, screenId, startTime }` | `201 { show }` | 409 overlapping show on screen |
| PATCH | `/admin/shows/:id` | Partner (own) | `{ startTime?, status? }` | `200 { show }` | — |
| DELETE | `/admin/shows/:id` | Partner (own) | — | `204` | 409 `HAS_BOOKINGS` → use deactivate (REQ-6.3) |

Deactivate = `PATCH { status: "cancelled" }`; triggers refund for existing bookings.

### 8.4 Analytics, partners, disputes
| Method | Endpoint | Role | Query | Success |
|---|---|---|---|---|
| GET | `/admin/venues/:id/analytics` | Partner (own) / Admin | `from`, `to`, `showId?` | `200 { occupancyRate, revenue, bookingsByDay[] }` |
| POST | `/admin/partners` | Admin | `{ name, email, phone, venueIds[] }` | `201 { partner }` |
| PATCH | `/admin/partners/:id/venues` | Admin | `{ venueIds[] }` | `200` |
| GET | `/admin/disputes` | Admin | `?status&page` | `200 { items[] }` |
| GET | `/admin/audit-log` | Admin | `?actorId&from&to` | `200 { items[] }` |

---

## 9. WebSocket Contract — Socket.IO namespace `/seats` (CO-4, REQ-3.1)

**Connect:** `io(VITE_SOCKET_URL + "/seats", { auth: { token: accessToken } })` (token optional for view-only).

| Direction | Event | Payload |
|---|---|---|
| Client → Server | `join:show` | `{ showId }` |
| Client → Server | `leave:show` | `{ showId }` |
| Server → Client | `seat:init` | `{ showId, seats: [{ seatId, status }] }` (sent after join) |
| Server → Client | `seat:update` | `{ showId, seatId, status, lockedBy?: "me" \| "other" }` |
| Server → Client | `booking:expired` | `{ bookingId }` (to the owning user only) |

`seat:update` is emitted on **lock / release / booked / cancelled**, within **1 second** of the change. `status` ∈ `available | locked | booked`.

---

## 10. Redis Key Schema (backend-internal, documented for both devs)

| Key | Value | TTL |
|---|---|---|
| `lock:{showId}:{seatId}` | `{ "userId": "…", "bookingId": "…", "expiresAt": "ISO" }` | `SEAT_LOCK_TTL_MINUTES` |
| `blacklist:{jti}` | `1` (revoked token) | remaining token life |
| `otp:{userId}` | hashed OTP + attempts | 10 min |
| `webhook:{eventId}` | `1` (processed) | 24 h |

Acquired via atomic `SET key value NX EX ttl`. Redis is **never** the source of truth; MongoDB partial unique index on `(showId, seatId)` for status `Locked|Booked` is the backstop (BR-1).

---

## 11. Shared Types (`packages/shared-types`)

Zod schemas that must be agreed before coding:

| File | Schemas |
|---|---|
| `auth.schema.ts` | `RegisterBody`, `LoginBody`, `User`, `Role` |
| `show.schema.ts` | `MovieCard`, `ShowSummary`, `ShowsByVenue`, `Seat`, `SeatStatus` |
| `booking.schema.ts` | `LockBody`, `Booking`, `BookingStatus`, `AmountBreakdown` |
| `payment.schema.ts` | `InitiateBody`, `InitiateResponse`, `PaymentStatus` |
| `review.schema.ts` | `ReviewBody`, `Review` |
| `common.schema.ts` | `ApiSuccess<T>`, `ApiError`, `Pagination` |

---

## 12. Data Notes

- **Booking storage:** the API exposes one Booking with `seats[]`; in MongoDB it is stored one row per seat linked by `groupBookingId` so the partial unique index can enforce seat exclusivity.
- **Seat pricing:** flat per category per screen in v1.0 (IMAX/3D surcharge deferred, TBD #3).
- **Reschedule:** not in v1.0 (no requirement defined). Users cancel and rebook.

---

## 13. Open Items (resolve before freezing)

| # | Item | Default used here |
|---|---|---|
| 1 | Payment gateway | Razorpay (adapter-based) |
| 2 | Seat-lock TTL | 8 min, env-configurable |
| 3 | Cancellation tiers | 100% >24h / 50% 2–24h / none <2h |
| 4 | Reviews & recommendations in v1.0? | Reviews in, recommendations = trending stub |
| 5 | Venue Staff UI | Scanner-only |
| 6 | Max seats: per venue or platform-wide? | Platform-wide, 10 |

## 14. Change Log

| Date | Version | Author | Change |
|---|---|---|---|
| 2026-10-05 | 0.1 | — | Initial draft from SRS v1.0 |
