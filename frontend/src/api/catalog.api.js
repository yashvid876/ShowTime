import { http, unwrap, cleanParams } from './client';

const kindPath = (kind) => (kind === 'event' ? 'events' : 'movies');

export const listTitles = (kind, params) => http.get(`/${kindPath(kind)}`, { params: cleanParams(params) }).then(unwrap); // { items, total, page, limit }
export const getTitle = (kind, id, params) => http.get(`/${kindPath(kind)}/${id}`, { params: cleanParams(params) }).then(unwrap); // { movie|event, showsByVenue }
export const listCities = () => http.get('/cities').then(unwrap); // { items: [{ name }] }
export const getRecommendations = (params) => http.get('/recommendations', { params: cleanParams(params) }).then(unwrap); // { items }
