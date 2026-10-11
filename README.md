# ShowTime: Movie & Event Ticket Booking System (MTBS)

A web app for browsing movies and live events, picking seats on a **real-time seat map**, paying online, and getting a **QR e-ticket**. It also includes a dashboard where venue partners and admins manage venues, shows and pricing.

This repository contains the **frontend** (React + Vite), the shared Zod schemas, and a small mock API for developing without the backend.

> Built from the project's SRS v1.0, the technical blueprint, the class diagram and the API Contract (v1).
> The frontend is **plain JavaScript** (`.js` / `.jsx`). There is no TypeScript.

---

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Pages and routes](#pages-and-routes)
- [How the booking flow works](#how-the-booking-flow-works)
- [API integration](#api-integration)
- [Testing](#testing)
- [Mock API](#mock-api)
- [Known limitations](#known-limitations)
- [Team workflow](#team-workflow)

---

## Features

**For patrons**
- Browse and search movies and events by city, genre, language, date and format (2D/3D/IMAX)
- Showtimes grouped by venue, with live availability (Available / Filling fast / Sold out)
- Interactive seat map with live updates over WebSockets
- Seats held for a limited time with a server-driven countdown
- Secure checkout through Razorpay, with an itemised price breakdown
- QR e-ticket, PDF invoice download
- My Bookings (Upcoming / Completed / Cancelled), with cancellation and a refund preview
- Ratings and reviews after attending a show
- Registration with phone OTP, login, password reset

**For venue partners and admins**
- Venues, screens and a seat-map builder (rows, seats per row, category per row)
- Category pricing and per-venue refund policy
- Movie/event catalog with poster upload
- Create, reschedule, deactivate and delete shows
- Occupancy, revenue and bookings-per-day analytics
- Admin only: partner onboarding and venue assignment, disputes queue, audit log

**Quality**
- Responsive layout (desktop, tablet, mobile), with the seat map sized to fit phone screens
- Keyboard-navigable seat map, labelled controls, visible focus states
- Loading, empty, error and success states throughout
- Role-based route guards, matching the API's role checks

---

## Tech stack

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
| QR | qrcode.react |
| Icons | lucide-react |
| Tests | Vitest + Testing Library |
| Lint | ESLint 9 |

---

## Getting started

**Requirements:** Node.js 20 or newer (`.nvmrc` pins 20.17.0) and npm.

```bash
# 1. Clone and switch to the frontend branch
git clone https://github.com/yashvid876/ShowTime.git
cd ShowTime
git checkout frontend

# 2. Install everything (npm workspaces: frontend + packages/*)
npm install

# 3. Create the frontend env file
cp frontend/.env.example frontend/.env        # macOS / Linux
copy frontend\.env.example frontend\.env      # Windows (cmd / PowerShell)
```

### Run with the mock API (no backend needed)

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

### Run with the real backend

1. Start the backend on port 4000, or change the URLs in `frontend/.env`.
2. Set the backend's `CORS_ORIGIN` to `http://localhost:5173` with credentials enabled, because the refresh-token cookie needs it.
3. Run `npm run dev:frontend`.

> **OTP and SMS:** the frontend only calls the OTP endpoints. The backend generates the code and sends the SMS (for example through Twilio). With the mock API, no SMS is sent, so use `123456`.

> **Windows tip:** if the project sits in a OneDrive folder, syncing `node_modules` can be slow. Keeping the project outside OneDrive (for example `C:\dev`) avoids this.

---

## Environment variables

`frontend/.env` (copy from `.env.example`). Only public values belong here, never secrets.

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:4000/api/v1` | REST API base URL |
| `VITE_SOCKET_URL` | `http://localhost:4000` | Socket.IO server (namespace `/seats`) |
| `VITE_RAZORPAY_KEY_ID` | `rzp_test_xxx` | Public Razorpay key (checkout also receives `keyId` from the API) |
| `VITE_MAX_SEATS_PER_BOOKING` | `10` | Must match the backend's `MAX_SEATS_PER_BOOKING` |

Restart `npm run dev:frontend` after editing `.env`.

---

## Scripts

Run from the repo root.

| Command | What it does |
|---|---|
| `npm run dev:frontend` | Start the Vite dev server (port 5173) |
| `npm run build:frontend` | Production build into `frontend/dist` |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |

---

## Project structure

```
ShowTime/
├── frontend/                     # the React app
│   └── src/
│       ├── api/                  # Axios client + one module per API area
│       ├── app/                  # router, root layout, error boundary
│       ├── components/
│       │   ├── ui/               # design system (Button, Fields, Modal, Tabs, ...)
│       │   ├── layout/           # Header, Footer, layouts, city picker
│       │   ├── catalog/          # title cards, showtimes, reviews
│       │   ├── booking/          # seat map, price breakdown, cancel dialog
│       │   └── admin/            # tables, chart, venue checklist
│       ├── features/             # auth guards/session, seat WebSocket, payment polling
│       ├── hooks/                # useCountdown, useDebounce, ...
│       ├── pages/                # one folder per screen
│       ├── store/                # Zustand stores
│       └── utils/                # formatting, constants
├── packages/shared-schemas/      # Zod schemas shared with the backend
└── tools/mock-api/               # throw-away mock of the API contract (dev only)
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
| `/checkout/:bookingId` | Patron | Payment |
| `/bookings/:bookingId` | Patron | E-ticket, invoice, cancel |
| `/my-bookings` | Patron | Booking history |
| `/help`, `/terms`, `/refund-policy` | Public | Help and legal |
| `/admin` | Partner, Admin | Venues |
| `/admin/venues/:id` | Partner (own), Admin | Screens, seat-map builder, pricing, refund policy |
| `/admin/catalog` (+ `/new`, `/:id/edit`) | Partner, Admin | Movies and events |
| `/admin/shows` | Partner (own), Admin | Show management |
| `/admin/analytics` | Partner (own), Admin | Reports |
| `/admin/partners`, `/admin/disputes`, `/admin/audit-log` | Admin | Platform administration |

There is intentionally no Venue Staff screen. The SRS defines venue staff as scanner-only, through the ticket-validation endpoint.

---

## How the booking flow works

1. **Browse:** the guest picks a title, a date and a show.
2. **Seat map:** the map loads from `GET /shows/:id/seatmap`, then updates live over the `/seats` WebSocket.
3. **Hold seats:** guests are sent to login first (their selection is restored afterwards). Then `POST /bookings/lock` holds all selected seats or none, and returns `lockExpiresAt`. If any seat was taken, the request returns `409` and the map refreshes.
4. **Checkout:** a countdown runs from the server's `lockExpiresAt`. The user accepts the terms and pays through `POST /payments/initiate`, which opens Razorpay.
5. **Confirmation:** the Razorpay browser callback is **never** treated as success. The app polls `GET /bookings/:id/status` every 2 seconds for up to 60 seconds, and only the payment webhook can mark the booking `Booked` or `Failed`.
6. **Ticket:** on `Booked`, the user sees a QR ticket and can download an invoice. Failures show the reason and release the seats.

---

## API integration

The frontend follows the **API Contract (v1)**: base URL `/api/v1`, `{ success, data }` / `{ success, error }` envelopes, Bearer access token, httpOnly refresh cookie, and the Socket.IO events `join:show`, `leave:show`, `seat:init`, `seat:update` and `booking:expired`.

Request bodies are validated with the Zod schemas in `packages/shared-schemas` before they are sent. Keep that package and `docs/api-contract.md` in sync with the backend, and update both in the same PR as any endpoint change.

---

## Testing

```bash
npm test          # 27 unit tests
npm run lint
npm run build:frontend
```

The unit tests cover money and date formatting, the shared schemas, API error mapping, the payment-status poller (including timeout and transient errors), and seat-map behaviour (status labels, click rules, keyboard navigation).

The main journeys were also exercised end to end in a real browser against the mock API: browse, guest login redirect, live seat locking seen by a second viewer, payment success and failure, ticket and invoice, cancellation, lock expiry, registration with OTP, role guards, and the partner/admin screens.

---

## Mock API

`tools/mock-api` is a standalone Node server that implements the API contract in memory, including cookies, Socket.IO seat events and role checks. It exists only so the frontend can be developed before the backend is ready. **It is not the real backend** and its data resets whenever it restarts.

To simulate the payment gateway webhook against the mock:

```bash
curl -X POST "http://localhost:4000/__dev/pay/<bookingId>?result=success"   # or result=fail
```

---

## Known limitations

These need backend support or a contract decision:

- **Missing list endpoints:** there is no way to list screens, admin shows or partners. Screens appear only if `GET /admin/venues` embeds `screens[]` (or for screens created in the current session). Reassigning a partner's venues needs a pasted partner ID.
- **Refund policy:** there is no GET for a venue's current policy, so the form starts from suggested defaults unless `venue.refundPolicy` is returned.
- **`lockExpiresAt`:** it isn't in `GET /bookings/:id`, so the countdown comes from the lock response, kept in `sessionStorage`.
- **Reviews from bookings:** `booking.show` has no `movieEventId`, so reviews can't be opened directly from Completed bookings.
- **Disputes and audit log:** their item shapes aren't specified, so they render as generic tables.
- **Payments:** a real Razorpay sandbox key is needed to test checkout end to end.
- **Not built:** Venue Staff UI, reschedule (no requirement defined) and a profile page (only `GET /auth/me` exists).

### Assumptions made where the contract is silent
- The `date` filter is sent as `YYYY-MM-DD`; analytics `from` / `to` as ISO-8601 UTC timestamps.
- `occupancyRate` values of 1 or less are read as a fraction, anything above as a percent.
- A bare 10-digit Indian mobile number gets `+91` added.
- An uploaded poster URL is sent back as `posterUrl` when saving a title.

---

## Team workflow

- Frontend work lives in `frontend/`; the backend owner works in `backend/`.
- `packages/shared-schemas/` and `docs/api-contract.md` are shared: change them by PR and get both developers' approval.
- Branch names: `feat/<area>-<description>`, `fix/<area>-<description>`. Use Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).
- Open PRs into `dev`; `main` stays deploy-ready.

---

## Credits

Prepared for the Software Engineering course project by **Yashvi Dalal** and **Chinmay Dalvi**.
