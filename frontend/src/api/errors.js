export class ApiError extends Error {
  constructor({ status = 0, code = 'UNKNOWN', message = 'Something went wrong', details = [], requestId }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

/** Convert an Axios error into an ApiError using the contract's error envelope. */
export function normalizeError(error) {
  if (error instanceof ApiError) return error;
  if (error?.response) {
    const { status, data, headers } = error.response;
    const e = data?.error;
    return new ApiError({
      status,
      code: e?.code || `HTTP_${status}`,
      message: e?.message || (status >= 500 ? 'The server ran into a problem. Try again shortly.' : 'The request could not be completed.'),
      details: e?.details || [],
      requestId: headers?.['x-request-id'],
    });
  }
  if (error?.code === 'ERR_CANCELED') return new ApiError({ code: 'CANCELED', message: 'Request canceled' });
  return new ApiError({ code: 'NETWORK_ERROR', message: "Can't reach the server. Check your connection and try again." });
}

// Overrides for codes where the server message is too terse for end users.
const FRIENDLY = {
  UNAUTHENTICATED: 'Your session has expired. Log in again to continue.',
  ACCOUNT_LOCKED: 'Too many failed attempts. Your account is locked for 15 minutes.',
  RATE_LIMITED: 'Too many attempts. Wait a minute and try again.',
  SEAT_UNAVAILABLE: 'Some of those seats were just taken. Pick different seats.',
  LOCK_EXPIRED: 'Your seat hold expired before payment. Select your seats again.',
  MAX_SEATS_EXCEEDED: 'You have selected more seats than allowed in one booking.',
  PAST_CUTOFF: 'This booking can no longer be cancelled because the cancellation window has closed.',
  HAS_BOOKINGS: 'This show has bookings, so it cannot be deleted. Deactivate it instead.',
};

export function errorMessage(err, fallback = 'Something went wrong. Try again.') {
  if (!err) return fallback;
  return FRIENDLY[err.code] || err.message || fallback;
}

/** Map 422 VALIDATION_ERROR details onto react-hook-form fields. Returns true when handled. */
export function applyServerErrors(err, setError) {
  if (err?.code !== 'VALIDATION_ERROR' || !Array.isArray(err.details) || !err.details.length) return false;
  let handled = false;
  err.details.forEach((d) => {
    const field = d.field || (Array.isArray(d.path) ? d.path.join('.') : d.path);
    if (field && d.message) {
      setError(field, { type: 'server', message: d.message });
      handled = true;
    }
  });
  return handled;
}
