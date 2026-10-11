import { LockBody } from '@mtbs/shared-schemas';
import { http, unwrap, cleanParams } from './client';

export const lockSeats = (body) => http.post('/bookings/lock', LockBody.parse(body)).then(unwrap);
export const releaseBooking = (id) => http.delete(`/bookings/${id}/release`).then(() => null);
export const getBooking = (id) => http.get(`/bookings/${id}`).then(unwrap).then((d) => d.booking);
export const getBookingStatus = (id) => http.get(`/bookings/${id}/status`).then(unwrap); // { status, qrPayload?, failureReason? }
export const listMyBookings = (params) => http.get('/bookings/mine', { params: cleanParams(params) }).then(unwrap); // { items, total }
export const cancelBooking = (id) => http.post(`/bookings/${id}/cancel`).then(unwrap); // { status, refundEstimate }
export const getRefundEstimate = (id) => http.get(`/bookings/${id}/refund-estimate`).then(unwrap); // { refundAmount, percent, cutoffAt }

/** Invoice is a PDF stream; fetch via Axios so the Bearer token is attached, then save it. */
export async function downloadInvoice(id) {
  const res = await http.get(`/bookings/${id}/invoice`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice-${id}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
