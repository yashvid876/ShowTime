import { http, unwrap, cleanParams } from './client';

// 8.1 Venues & screens
export const listVenues = () => http.get('/admin/venues').then(unwrap); // { items }
export const createVenue = (body) => http.post('/admin/venues', body).then(unwrap).then((d) => d.venue);
export const createScreen = (venueId, body) => http.post(`/admin/venues/${venueId}/screens`, body).then(unwrap).then((d) => d.screen);
export const updateScreenPricing = (screenId, pricing) => http.patch(`/admin/screens/${screenId}/pricing`, pricing).then(unwrap).then((d) => d.screen);
export const saveRefundPolicy = (venueId, body) => http.put(`/admin/venues/${venueId}/refund-policy`, body).then(unwrap).then((d) => d.policy);

// 8.2 Catalog
export const createTitle = (body) => http.post('/admin/movies-events', body).then(unwrap);
export const updateTitle = (id, body) => http.patch(`/admin/movies-events/${id}`, body).then(unwrap);
export async function uploadPoster(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await http.post('/admin/uploads/poster', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return unwrap(res).url;
}

// 8.3 Shows
export const createShow = (body) => http.post('/admin/shows', body).then(unwrap).then((d) => d.show);
export const updateShow = (id, body) => http.patch(`/admin/shows/${id}`, body).then(unwrap).then((d) => d.show);
export const deleteShow = (id) => http.delete(`/admin/shows/${id}`).then(() => null);

// 8.4 Analytics, partners, disputes, audit
export const getAnalytics = (venueId, params) => http.get(`/admin/venues/${venueId}/analytics`, { params: cleanParams(params) }).then(unwrap);
export const createPartner = (body) => http.post('/admin/partners', body).then(unwrap).then((d) => d.partner);
export const updatePartnerVenues = (id, venueIds) => http.patch(`/admin/partners/${id}/venues`, { venueIds }).then(unwrap);
export const listDisputes = (params) => http.get('/admin/disputes', { params: cleanParams(params) }).then(unwrap);
export const listAuditLog = (params) => http.get('/admin/audit-log', { params: cleanParams(params) }).then(unwrap);
