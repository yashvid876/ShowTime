# MTBS: ShowTime (frontend)

Plain JavaScript (`.js` / `.jsx`), **no TypeScript**. React 18 + Vite 5 + Tailwind 3.4, per the project plan.

```
mtbs/
├── frontend/                 # Developer 2: the whole app (this delivery)
├── packages/shared-schemas/  # Zod schemas from API contract §11 (jointly owned, PR both devs)
└── tools/mock-api/           # throw-away mock of the contract, for development only
```

## Run it

```bash
npm install                       # from repo root (npm workspaces)
cp frontend/.env.example frontend/.env

# Option A: real backend running on :4000
npm run dev:frontend              # http://localhost:5173

# Option B: no backend yet, use the contract mock
cd tools/mock-api && npm install && npm start     # http://localhost:4000
npm run dev:frontend
```
Mock logins (password `password1`): `asha@x.com` (patron), `partner@x.com`, `admin@x.com`. New sign-ups use OTP `123456`.

`npm run lint` · `npm test` (Vitest) · `npm run build:frontend`

> The frontend never contains fake data. It always calls `VITE_API_BASE_URL`. The mock is a separate
> process that implements `docs/api-contract.md`.

## Routes

| Route | Access | Screen |
|---|---|---|
| `/` | public | Home: city, trending/recommended, movies, events |
| `/search` | public | Search & filter (city, genre, language, date, format) |
| `/movies/:id`, `/events/:id` | public | Detail, showtimes by venue, reviews |
| `/shows/:showId/seats` | public view, login to lock | Live seat map |
| `/login` `/register` `/verify-otp` `/forgot-password` `/reset-password` | guest | Auth |
| `/checkout/:bookingId` | patron | Price breakdown, countdown, Razorpay, status polling |
| `/bookings/:bookingId` | patron | E-ticket (QR), invoice, cancel |
| `/my-bookings` | patron | Upcoming / Completed / Cancelled |
| `/help` `/terms` `/refund-policy` | public | UD-2 help, legal text (SRS §6) |
| `/admin` | partner, admin | Venues |
| `/admin/venues/:id` | partner (own), admin | Screens, seat-map builder, pricing, refund policy |
| `/admin/catalog`, `/new`, `/:id/edit` | partner, admin | Movies & events, poster upload |
| `/admin/shows` | partner (own), admin | Create / reschedule / deactivate / delete |
| `/admin/analytics` | partner (own), admin | Occupancy, revenue, bookings per day |
| `/admin/partners` `/disputes` `/audit-log` | admin | Onboarding, disputes, audit log |

## Structure (`frontend/src`)
`api/` Axios client (Bearer + single-flight refresh on 401) and one module per contract area · `store/` Zustand (auth in memory only, seat lock in sessionStorage, city, toasts) · `features/` auth guards/session, seat-map WebSocket hook, Razorpay loader, status poller · `components/ui` design system · `components/{layout,catalog,booking,admin}` · `pages/` · `utils/`.

## Business rules in the UI
- **BR-1** lock is all-or-nothing: a 409 clears the selection and refreshes the map; seats taken live are dropped from your selection.
- **BR-2 / REQ-2.3** guests browse; confirming seats redirects to login and restores the selection afterwards.
- **BR-5** the Razorpay client callback is never treated as success; the app polls `GET /bookings/:id/status` every 2 s for up to 60 s and waits for `Booked` or `Failed`.
- **BR-4** partner views come from `GET /admin/venues` (server-scoped); other venues' shows are read-only in the Shows screen.
- Lock countdown uses the server's `lockExpiresAt`; money is integer paise everywhere and shown as ₹.

## Assumptions (not defined in the contract)
1. `date` filter is sent as `YYYY-MM-DD`; analytics `from`/`to` as ISO-8601 UTC timestamps.
2. Analytics `occupancyRate` may be a 0–1 fraction or a 0–100 percent. Values ≤ 1 are treated as fractions.
3. `bookingsByDay[]` items are read as `{ date, bookings|count|total }`.
4. Uploaded poster URL is sent back as `posterUrl` when creating/editing a title.
5. `show` (from `GET /shows/:id`) is read as `{ movieTitle|title, venueName, screenName, startTime, format, status }`.
6. Genre/language option lists in filters are static UI constants (no endpoint exists).
7. Phone: bare 10-digit Indian mobiles get `+91`.

## Blocked / needs backend or contract changes
- **No "list screens", "list shows (admin)", "list partners" endpoints.** Screens appear only if `GET /admin/venues` embeds `screens[]` (or for screens created this session); shows are listed via the public title-detail endpoint; partner reassignment needs a pasted partner ID.
- **No GET for a venue's refund policy:** the form starts from suggested defaults (cutoff 2h; ≥24h 100%, ≥2h 50%) unless `venue.refundPolicy` is returned.
- `GET /bookings/:id` should include `lockExpiresAt` so the checkout countdown survives a hard refresh on another device (it is currently kept in sessionStorage from the lock response).
- `booking.show` has no `movieEventId`, so "write a review" can't deep-link from Completed bookings (reviews are on the title page).
- Disputes and audit-log item shapes are unspecified: rendered as a generic table with full JSON per row.
- Venue Staff UI and reschedule are intentionally absent (scanner-only per SRS; no reschedule requirement).
- Profile/settings page: the contract only has `GET /auth/me`, so none was built.
- Razorpay is loaded from `checkout.razorpay.com` at pay time, so a real sandbox key is needed to test payment end-to-end.
