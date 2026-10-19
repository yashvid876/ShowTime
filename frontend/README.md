# ShowTime frontend (updated)

A separate React/Vite frontend using plain CSS. It connects to the existing backend without changing backend files.

## Run locally

In one terminal, start the backend:

```powershell
cd backend
npm install
npm run dev
```

The backend expects its own environment configuration and working MySQL/Redis services. Its default port is `5000`.

In another terminal, start this frontend:

```powershell
cd frontend-updated
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5174`). The Vite development server proxies `/api` requests to `http://localhost:5000`, so the HTTP-only refresh cookie works without enabling cross-origin cookies. To use a different API origin or mount path, set `VITE_API_BASE_URL` in a local `.env` file; for a cross-origin API, configure credentialed CORS on the backend for the frontend origin.

Razorpay checkout requires the backend's public key ID and private credentials to be configured on the backend. No payment secret is stored in this frontend.

## Backend-supported scope

The UI uses the implemented auth, movie/city, show/seat-map, seat-lock, booking, Razorpay payment, admin dashboard, movie, theatre, screen, show, and physical screen-seat management routes. Registration creates the account and then asks the user to sign in, because the registration route does not issue the rotating refresh cookie that the login route issues. Password reset, OTP, reviews, events, and fabricated admin analytics are not included because the backend does not expose those operations. The dashboard itself only displays the live response from the implemented dashboard route; catalog, venue, show and seat administration are available separately.
