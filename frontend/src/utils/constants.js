export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';
export const MAX_SEATS = Number(import.meta.env.VITE_MAX_SEATS_PER_BOOKING) || 10;

export const ROLES = { PATRON: 'patron', PARTNER: 'partner', ADMIN: 'admin' };

// Filter option lists (UI only — the API contract defines no endpoint for these).
export const GENRES = ['Action', 'Comedy', 'Drama', 'Thriller', 'Romance', 'Sci-Fi', 'Horror', 'Animation', 'Family', 'Music', 'Stand-up', 'Theatre', 'Sports'];
export const LANGUAGES = ['Hindi', 'English', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Gujarati'];
export const FORMATS = ['2D', '3D', 'IMAX'];
export const SEAT_CATEGORIES = ['Silver', 'Gold', 'Premium'];

export const BOOKING_TABS = ['Upcoming', 'Completed', 'Cancelled'];

export const AVAILABILITY = {
  AVAILABLE: { label: 'Available', tone: 'ok' },
  FILLING_FAST: { label: 'Filling fast', tone: 'warn' },
  SOLD_OUT: { label: 'Sold out', tone: 'neutral' },
};

export const BOOKING_STATUS_TONE = {
  Booked: 'ok', Locked: 'warn', Pending: 'warn', Cancelled: 'neutral', Failed: 'danger', Expired: 'neutral',
};

export const POLL_INTERVAL_MS = 2000;
export const POLL_TIMEOUT_MS = 60000;
