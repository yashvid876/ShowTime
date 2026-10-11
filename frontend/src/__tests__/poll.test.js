import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/errors';

vi.mock('@/api/bookings.api', () => ({ getBookingStatus: vi.fn() }));
import { getBookingStatus } from '@/api/bookings.api';
import { pollBookingStatus } from '@/features/booking/pollBookingStatus';

// Braces matter: returning the mock from beforeEach makes Vitest call it as a teardown hook.
beforeEach(() => {
  getBookingStatus.mockReset();
});

describe('pollBookingStatus (BR-5: webhook is the source of truth)', () => {
  it('keeps polling through Locked/Pending until Booked', async () => {
    getBookingStatus.mockResolvedValueOnce({ status: 'Locked' }).mockResolvedValueOnce({ status: 'Pending' }).mockResolvedValueOnce({ status: 'Booked', qrPayload: 'qr' });
    const res = await pollBookingStatus('id', { intervalMs: 1, timeoutMs: 1000 });
    expect(res).toEqual({ status: 'Booked', qrPayload: 'qr' });
    expect(getBookingStatus).toHaveBeenCalledTimes(3);
  });
  it('stops on Failed and returns the reason', async () => {
    getBookingStatus.mockResolvedValue({ status: 'Failed', failureReason: 'Declined' });
    expect(await pollBookingStatus('id', { intervalMs: 1, timeoutMs: 1000 })).toEqual({ status: 'Failed', failureReason: 'Declined' });
  });
  it('gives up with Timeout instead of assuming success', async () => {
    getBookingStatus.mockResolvedValue({ status: 'Pending' });
    expect((await pollBookingStatus('id', { intervalMs: 5, timeoutMs: 30 })).status).toBe('Timeout');
  });
  it('survives transient network errors and keeps polling', async () => {
    getBookingStatus.mockRejectedValueOnce(new ApiError({ status: 500 })).mockResolvedValueOnce({ status: 'Booked' });
    expect((await pollBookingStatus('id', { intervalMs: 1, timeoutMs: 1000 })).status).toBe('Booked');
    expect(getBookingStatus).toHaveBeenCalledTimes(2);
  });
  it('throws immediately on a permanent 404', async () => {
    getBookingStatus.mockRejectedValue(new ApiError({ status: 404 }));
    await expect(pollBookingStatus('id', { intervalMs: 1, timeoutMs: 1000 })).rejects.toBeInstanceOf(ApiError);
    expect(getBookingStatus).toHaveBeenCalledTimes(1);
  });
  it('stops when aborted', async () => {
    getBookingStatus.mockResolvedValue({ status: 'Pending' });
    const c = new AbortController();
    const p = pollBookingStatus('id', { signal: c.signal, intervalMs: 5, timeoutMs: 5000 });
    setTimeout(() => c.abort(), 20);
    expect((await p).status).toBe('Aborted');
  });
});
