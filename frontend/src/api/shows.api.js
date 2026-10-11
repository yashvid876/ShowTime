import { http, unwrap } from './client';

export const getShow = (id) => http.get(`/shows/${id}`).then(unwrap).then((d) => d.show);
export const getSeatMap = (id) => http.get(`/shows/${id}/seatmap`).then(unwrap); // { showId, rows, cols, seats[], pricing }
