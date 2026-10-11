import { InitiateBody } from '@mtbs/shared-schemas';
import { http, unwrap } from './client';

export const initiatePayment = (bookingId) => http.post('/payments/initiate', InitiateBody.parse({ bookingId })).then(unwrap); // { orderId, amount, currency, keyId }
export const getPayment = (bookingId) => http.get(`/payments/${bookingId}`).then(unwrap); // { status, receiptUrl }
