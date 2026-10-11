import { ReviewBody } from '@mtbs/shared-schemas';
import { http, unwrap, cleanParams } from './client';

export const createReview = (body) => http.post('/reviews', ReviewBody.parse(body)).then(unwrap).then((d) => d.review);
export const listReviews = (kind, id, params) =>
  http.get(`/${kind === 'event' ? 'events' : 'movies'}/${id}/reviews`, { params: cleanParams(params) }).then(unwrap); // { items, avgRating, total }
