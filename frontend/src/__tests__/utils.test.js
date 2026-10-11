import { describe, expect, it } from 'vitest';
import { RegisterBody, LockBody, ReviewBody } from '@mtbs/shared-schemas';
import { formatDuration, formatMoney, normalizePhone, paiseToRupees, rupeesToPaise, toDateParam, isoToLocalInput, localInputToIso } from '@/utils/format';
import { safeNext } from '@/features/auth/session';
import { ApiError, applyServerErrors, errorMessage, normalizeError } from '@/api/errors';
import { cleanParams } from '@/api/client';

describe('money (integer paise)', () => {
  it('formats whole rupees and fractional amounts', () => {
    expect(formatMoney(25000)).toBe('₹250');
    expect(formatMoney(15050)).toBe('₹150.50');
    expect(formatMoney(null)).toBe('—');
  });
  it('round-trips rupees ↔ paise without float drift', () => {
    expect(rupeesToPaise('180.50')).toBe(18050);
    expect(rupeesToPaise(0.1 + 0.2)).toBe(30);
    expect(paiseToRupees(18050)).toBe(180.5);
  });
});

describe('formatting helpers', () => {
  it('formats durations', () => {
    expect(formatDuration(142)).toBe('2h 22m');
    expect(formatDuration(120)).toBe('2h');
    expect(formatDuration(45)).toBe('45m');
  });
  it('adds +91 to bare Indian mobiles only', () => {
    expect(normalizePhone('9123456789')).toBe('+919123456789');
    expect(normalizePhone('+44 7700 900123')).toBe('+447700900123');
  });
  it('builds a local YYYY-MM-DD', () => expect(toDateParam(new Date(2026, 9, 5))).toBe('2026-10-05'));
  it('round-trips datetime-local ↔ ISO', () => {
    const iso = localInputToIso('2026-12-05T18:00');
    expect(iso).toMatch(/Z$/);
    expect(isoToLocalInput(iso)).toBe('2026-12-05T18:00');
  });
  it('only allows same-origin redirects', () => {
    expect(safeNext('/my-bookings')).toBe('/my-bookings');
    expect(safeNext('//evil.com')).toBe('/');
    expect(safeNext('https://evil.com', '/x')).toBe('/x');
  });
  it('drops empty query params', () => expect(cleanParams({ a: 1, b: '', c: undefined, d: null, e: 0 })).toEqual({ a: 1, e: 0 }));
});

describe('shared schemas (contract rules)', () => {
  const ok = { name: 'Asha K', email: 'asha@x.com', phone: '+919999999999', password: 'abcd1234' };
  it('accepts a valid registration', () => expect(RegisterBody.safeParse(ok).success).toBe(true));
  it('enforces password: min 8, a letter and a number', () => {
    expect(RegisterBody.safeParse({ ...ok, password: 'short1' }).success).toBe(false);
    expect(RegisterBody.safeParse({ ...ok, password: 'abcdefgh' }).success).toBe(false);
    expect(RegisterBody.safeParse({ ...ok, password: '12345678' }).success).toBe(false);
  });
  it('limits a lock request to 1–10 24-char ids', () => {
    const id = 'a'.repeat(24);
    expect(LockBody.safeParse({ showId: id, seatIds: [id] }).success).toBe(true);
    expect(LockBody.safeParse({ showId: id, seatIds: [] }).success).toBe(false);
    expect(LockBody.safeParse({ showId: id, seatIds: Array(11).fill(id) }).success).toBe(false);
    expect(LockBody.safeParse({ showId: 'short', seatIds: [id] }).success).toBe(false);
  });
  it('requires a 1–5 star rating', () => {
    const id = 'b'.repeat(24);
    expect(ReviewBody.safeParse({ movieEventId: id, rating: 5 }).success).toBe(true);
    expect(ReviewBody.safeParse({ movieEventId: id, rating: 0 }).success).toBe(false);
    expect(ReviewBody.safeParse({ movieEventId: id, rating: 3, comment: 'x'.repeat(1001) }).success).toBe(false);
  });
});

describe('API error handling (contract §0.1–0.2)', () => {
  it('normalises the error envelope', () => {
    const e = normalizeError({ response: { status: 409, data: { success: false, error: { code: 'SEAT_UNAVAILABLE', message: 'taken', details: [] } }, headers: { 'x-request-id': 'r1' } } });
    expect(e).toBeInstanceOf(ApiError);
    expect([e.status, e.code, e.requestId]).toEqual([409, 'SEAT_UNAVAILABLE', 'r1']);
  });
  it('treats a missing response as a network error', () => expect(normalizeError({ message: 'x' }).code).toBe('NETWORK_ERROR'));
  it('uses friendly copy for known codes and falls back to the server message', () => {
    expect(errorMessage(new ApiError({ code: 'ACCOUNT_LOCKED', message: 'locked' }))).toMatch(/15 minutes/);
    expect(errorMessage(new ApiError({ code: 'WHATEVER', message: 'Server says hi' }))).toBe('Server says hi');
  });
  it('maps 422 details onto form fields', () => {
    const calls = [];
    const handled = applyServerErrors(new ApiError({ code: 'VALIDATION_ERROR', details: [{ field: 'email', message: 'Bad email' }] }), (f, v) => calls.push([f, v.message]));
    expect(handled).toBe(true);
    expect(calls).toEqual([['email', 'Bad email']]);
    expect(applyServerErrors(new ApiError({ code: 'CONFLICT' }), () => {})).toBe(false);
  });
});
