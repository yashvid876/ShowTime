import { getBookingStatus } from '@/api/bookings.api';
import { POLL_INTERVAL_MS, POLL_TIMEOUT_MS } from '@/utils/constants';

const TERMINAL = ['Booked', 'Failed', 'Expired', 'Cancelled'];

const sleep = (ms, signal) =>
  new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => { clearTimeout(t); resolve(); }, { once: true });
  });

/**
 * Poll GET /bookings/:id/status every 2s for up to 60s (API contract §5).
 * The payment webhook is the only source of truth (BR-5): a client-side gateway
 * callback never counts as success — we wait for `Booked` or `Failed` from the server.
 * Resolves with the final `{ status, qrPayload?, failureReason? }`, or `{ status: 'Timeout' }`.
 */
export async function pollBookingStatus(bookingId, { signal, intervalMs = POLL_INTERVAL_MS, timeoutMs = POLL_TIMEOUT_MS } = {}) {
  const started = Date.now();
  while (!signal?.aborted) {
    try {
      const s = await getBookingStatus(bookingId);
      if (TERMINAL.includes(s.status)) return s;
    } catch (e) {
      if (e.status === 401 || e.status === 403 || e.status === 404) throw e; // permanent; transient errors keep polling
    }
    if (Date.now() - started >= timeoutMs) return { status: 'Timeout' };
    await sleep(intervalMs, signal);
  }
  return { status: 'Aborted' };
}
