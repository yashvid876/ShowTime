# ShowTime: Movie & Event Ticket Booking System (MTBS)

ShowTime is a web platform for browsing movies and live events, choosing seats on a **real-time seat map**, paying online, and receiving a **QR e-ticket**. Venue partners and admins get a dashboard to manage venues, screens, shows and pricing.

It is built from the project's SRS v1.0, technical blueprint, class diagram and API Contract (v1).

> The project uses **plain JavaScript** (`.js` / `.jsx`). There is no TypeScript.

---

## Contents

- [Repository layout](#repository-layout)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Frontend structure](#frontend-structure)
- [Pages and routes](#pages-and-routes)
- [How the booking flow works](#how-the-booking-flow-works)
- [API contract and shared schemas](#api-contract-and-shared-schemas)
- [Testing](#testing)
- [Mock API](#mock-api)
- [Known limitations and assumptions](#known-limitations-and-assumptions)
- [Team workflow](#team-workflow)
- [Credits](#credits)

---

## Repository layout

```
ShowTime/
├── backend/                  # Express + MongoDB + Redis API (Developer 1)
├── frontend/                 # React + Vite app (Developer 2)
├── packages/shared-schemas/  # Zod schemas shared by both apps (jointly owned)
├── tools/mock-api/           # dev-only mock of the API contract
├── docs/                     # api-contract.md, SRS, blueprint, diagrams
├── .github/workflows/        # CI (lint + tests on pull requests)
└── package.json              # npm workspaces root
```

Folders that are not in the repository yet are still part of the plan. Check the current branch for what exists.

---

## Features

**Patrons**
- Browse and search movies and events by city, genre, language, date and format (2D / 3D / IMAX)
- Showtimes grouped by venue, with live availability
- Interactive seat map with live updates over WebSockets
- Seats held for a limited time, with a server-driven countdown
- Secure checkout through Razorpay, with an itemised price breakdown
- QR e-ticket and PDF invoice
- My Bookings (Upcoming / Completed / Cancelled), cancellation with a refund preview
- Ratings and reviews after attending a show
- Registration with phone OTP, login, password reset

**Venue partners and admins**
- Venues, screens, and a seat-map builder (rows, seats per row, category per row)
- Category pricing and a per-venue refund policy
- Movie/event catalog with poster upload
- Create, reschedule, deactivate and delete shows
- Occupancy, revenue and bookings-per-day analytics
- Admin only: partner onboarding, venue assignment, disputes queue, audit log

**Quality**
- Responsive layout for desktop, tablet and mobile (the seat map is sized to fit phone screens)
- Keyboard-navigable seat map, labelled controls, visible focus states
- Loading, empty, error and success states throughout
- Role-based route guards that mirror the API's role checks

---

## Tech stack

**Frontend (implemented)**

| Area | Choice |
|---|---|
| UI | React 18, Vite 5 |
| Styling | Tailwind CSS 3.4 |
| Routing | React Router 6 |
| Server state | TanStack Query 5 |
| Client state | Zustand |
| HTTP | Axios (Bearer token, automatic refresh on 401) |
| Forms and validation | React Hook Form + Zod (shared schemas) |
| Real time | socket.io-client (`/seats` namespace) |
| Payments | Razorpay Checkout (loaded when you click Pay) |
| QR codes | qrcode.react |
| Icons | lucide-react |
| Tests and lint | Vitest, Testing Library, ESLint 9 |

**Backend (per the project plan, Developer 1)**

Node.js 20, Express 4, Mongoose, MongoDB Atlas, Redis (ioredis) for seat locks, Socket.IO, JWT access and refresh tokens, bcrypt, Zod, Razorpay, SendGrid, Twilio.

---

## Getting started

**Requirements:** Node.js 20 or newer (`.nvmrc` pins 20.17.0) and npm.

```bash
# 1. Clone
git clone https://github.com/yashvid876/ShowTime.git
cd ShowTime

# 2. Install everything (npm workspaces)
npm install

# 3. Create the frontend env file
cp frontend/.env.example frontend/.env        # macOS / Linux
copy frontend\.env.example frontend\.env      # Windows (cmd / PowerShell)
```

### Option A: run with the mock API (no backend needed)

Use two terminals.

```bash
# Terminal 1: mock API on http://localhost:4000
cd tools/mock-api
npm install
npm start
```

```bash
# Terminal 2: from the repo root, frontend on http://localhost:5173
npm run dev:frontend
```

Mock logins (password `password1`):

| Role | Email |
|---|---|
| Patron | `asha@x.com` |
| Venue partner | `partner@x.com` |
| Admin | `admin@x.com` |

New sign-ups use the OTP **`123456`**.

### Option B: run with the real backend

1. Create `backend/.env` from `backend/.env.example` and start the backend on port 4000.
2. Set the backend's `CORS_ORIGIN` to `http://localhost:5173` with credentials enabled, because the refresh-token cookie needs it.
3. Run `npm run dev:frontend`.

> **OTP and SMS:** the frontend only calls the OTP endpoints. The backend generates the code and sends the SMS (for example through Twilio). The mock API sends no SMS, so use `123456` with it.

> **Payments:** Razorpay needs real test keys and a real order created by the backend. With the mock API, simulate the webhook instead (see [Mock API](#mock-api)).

> **Windows tip:** if the project sits inside a OneDrive folder, syncing `node_modules` can be slow. Keeping it outside OneDrive (for example `C:\dev`) avoids this.

---

## Environment variables

**`frontend/.env`** (copy from `.env.example`). Only public values belong here, never secrets.

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:4000/api/v1` | REST API base URL |
| `VITE_SOCKET_URL` | `http://localhost:4000` | Socket.IO server (namespace `/seats`) |
| `VITE_RAZORPAY_KEY_ID` | `rzp_test_xxx` | Public Razorpay key (checkout also receives `keyId` from the API) |
| `VITE_MAX_SEATS_PER_BOOKING` | `10` | Must match the backend's `MAX_SEATS_PER_BOOKING` |

Restart `npm run dev:frontend` after editing `.env`.

**`backend/.env`** (secret, backend only, see `backend/.env.example`): `PORT`, `NODE_ENV`, `MONGODB_URI`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES`, `JWT_REFRESH_EXPIRES`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `SENDGRID_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `SEAT_LOCK_TTL_MINUTES`, `MAX_SEATS_PER_BOOKING`, `CORS_ORIGIN`. Never commit real values.

---

## Scripts

Run from the repo root.

| Command | What it does |
|---|---|
| `npm run dev:frontend` | Start the Vite dev server (port 5173) |
| `npm run build:frontend` | Production build into `frontend/dist` |
| `npm run lint` | ESLint (frontend) |
| `npm test` | Unit tests with Vitest (frontend) |

---

## Frontend structure

```
frontend/src/
├── api/          # Axios client + one module per API area
├── app/          # router, root layout, error boundary
├── components/
│   ├── ui/       # design system (Button, Fields, Modal, Tabs, ...)
│   ├── layout/   # Header, Footer, layouts, city picker
│   ├── catalog/  # title cards, showtimes, reviews
│   ├── booking/  # seat map, price breakdown, cancel dialog
│   └── admin/    # tables, chart, venue checklist
├── features/     # auth guards/session, seat WebSocket, payment polling
├── hooks/        # useCountdown, useDebounce, ...
├── pages/        # one folder per screen
├── store/        # Zustand stores
└── utils/        # formatting, constants
```

Rules of thumb:
- API calls live in `src/api`, never inside components.
- The access token is kept in memory only. The refresh token is an httpOnly cookie set by the backend.
- Money is **integer paise** everywhere and formatted as ₹ only for display.

---

## Pages and routes

| Route | Access | Screen |
|---|---|---|
| `/` | Public | Home: city, trending/recommended, movies, events |
| `/search` | Public | Search and filters |
| `/movies/:id`, `/events/:id` | Public | Details, showtimes by venue, reviews |
| `/shows/:showId/seats` | Public to view, login to hold seats | Live seat map |
| `/login`, `/register`, `/verify-otp`, `/forgot-password`, `/reset-password` | Guests | Authentication |
| `/checkout/:bookingId` | Patron | Price breakdown, countdown, Razorpay, status polling |
| `/bookings/:bookingId` | Patron | E-ticket (QR), invoice, cancel |
| `/my-bookings` | Patron | Upcoming / Completed / Cancelled |
| `/help`, `/terms`, `/refund-policy` | Public | Help and legal pages |
| `/admin` | Partner, Admin | Venues |
| `/admin/venues/:id` | Partner (own), Admin | Screens, seat-map builder, pricing, refund policy |
| `/admin/catalog` (+ `/new`, `/:id/edit`) | Partner, Admin | Movies and events, poster upload |
| `/admin/shows` | Partner (own), Admin | Create / reschedule / deactivate / delete shows |
| `/admin/analytics` | Partner (own), Admin | Occupancy, revenue, bookings per day |
| `/admin/partners`, `/admin/disputes`, `/admin/audit-log` | Admin | Platform administration |

There is intentionally no Venue Staff screen. The SRS defines venue staff as scanner-only, through the ticket-validation endpoint.

---

## How the booking flow works

1. **Browse:** the guest picks a title, a date and a show.
2. **Seat map:** loads from `GET /shows/:id/seatmap`, then updates live over the `/seats` WebSocket.
3. **Hold seats (BR-1, BR-2):** guests are sent to login first and their selection is restored afterwards. `POST /bookings/lock` holds all selected seats or none and returns `lockExpiresAt`. If any seat was taken, it returns `409` and the map refreshes.
4. **Checkout:** a countdown runs from the server's `lockExpiresAt`. The user accepts the terms and pays through `POST /payments/initiate`, which opens Razorpay.
5. **Confirmation (BR-5):** the Razorpay browser callback is **never** treated as success. The app polls `GET /bookings/:id/status` every 2 seconds for up to 60 seconds, and only the payment webhook can mark the booking `Booked` or `Failed`.
6. **Ticket:** on `Booked`, the user sees a QR ticket and can download an invoice. Failures show the reason and release the seats.

Business rules reflected in the UI:
- **BR-4:** partner views come from `GET /admin/venues` (server-scoped). Other venues' shows are read-only on the Shows screen.
- Money is integer paise throughout; the lock countdown always uses the server's `lockExpiresAt`.

---

## API contract and shared schemas

Both apps follow the **API Contract (v1)**: base URL `/api/v1`, `{ success, data }` / `{ success, error }` envelopes, Bearer access token (15 min), httpOnly refresh cookie (7 days), and the Socket.IO events `join:show`, `leave:show`, `seat:init`, `seat:update` and `booking:expired`.

Zod schemas in `packages/shared-schemas` are the shared source of truth for request shapes, and the frontend validates request bodies with them before sending. **Any endpoint change must update `docs/api-contract.md` and the schemas in the same PR**, with approval from both developers.

---

## Testing

```bash
npm test                  # 27 unit tests
npm run lint
npm run build:frontend
```

The unit tests cover money and date formatting, the shared schemas, API error mapping, the payment-status poller (timeouts and transient errors included) and seat-map behaviour (status labels, click rules, keyboard navigation).

The main journeys were also exercised end to end in a real browser against the mock API: browsing, guest login redirect, live seat locking seen by a second viewer, payment success and failure, ticket and invoice, cancellation, lock expiry, registration with OTP, role guards, and the partner and admin screens.

---

## Mock API

`tools/mock-api` is a standalone Node server that implements the API contract in memory, including cookies, Socket.IO seat events and role checks. It exists only so the frontend can be developed before the backend is ready. **It is not the real backend**, and its data resets whenever it restarts.

To simulate the payment gateway webhook against the mock (use the booking ID from the checkout URL):

```bash
curl -X POST "http://localhost:4000/__dev/pay/<bookingId>?result=success"   # or result=fail
```

On Windows PowerShell, use `curl.exe` instead of `curl`.

---

## Known limitations and assumptions

Items that need backend support or a contract decision:

- **Missing list endpoints:** there is no way to list screens, admin shows or partners. Screens appear only if `GET /admin/venues` embeds `screens[]` (or for screens created in the current session). Reassigning a partner's venues needs a pasted partner ID.
- **Refund policy:** there is no GET for a venue's current policy, so the form starts from suggested defaults (cut-off 2 h; at least 24 h before the show 100%, at least 2 h before 50%) unless `venue.refundPolicy` is returned.
- **`lockExpiresAt`:** it is not in `GET /bookings/:id`, so the countdown comes from the lock response, kept in `sessionStorage`.
- **Reviews from bookings:** `booking.show` has no `movieEventId`, so reviews cannot be opened directly from Completed bookings (reviews live on the title page).
- **Disputes and audit log:** their item shapes are unspecified, so they render as generic tables with the full JSON per row.
- **Payments:** a real Razorpay sandbox key and a real order are needed to test checkout end to end.
- **Not built:** Venue Staff UI, reschedule (no requirement defined) and a profile page (the contract only has `GET /auth/me`).

Assumptions made where the contract is silent:
- The `date` filter is sent as `YYYY-MM-DD`; analytics `from` / `to` as ISO-8601 UTC timestamps.
- `occupancyRate` values of 1 or less are read as a fraction, anything above as a percent.
- `bookingsByDay[]` items are read as `{ date, bookings | count | total }`.
- A bare 10-digit Indian mobile number gets `+91` added.
- An uploaded poster URL is sent back as `posterUrl` when saving a title.
- Genre and language filter options are static UI constants (no endpoint exists).

---

## Team workflow

- Backend work lives in `backend/` (Developer 1), frontend work in `frontend/` (Developer 2).
- `packages/shared-schemas/` and `docs/api-contract.md` are shared: change them by PR and get both developers' approval.
- Branch names: `feat/<area>-<description>`, `fix/<area>-<description>`. Use Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).
- Open PRs into `dev`; `main` stays deploy-ready, and every PR is reviewed by the other developer.

---

## Credits

Prepared for the Software Engineering course project by **Yashvi Dalal** and **Chinmay Dalvi**.