const whole = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const fractional = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });

/** API money is integer paise (₹1 = 100). */
export function formatMoney(paise) {
  if (paise === null || paise === undefined || Number.isNaN(Number(paise))) return '—';
  const rupees = Number(paise) / 100;
  return Number.isInteger(rupees) ? whole.format(rupees) : fractional.format(rupees);
}
export const rupeesToPaise = (rupees) => Math.round(Number(rupees) * 100);
export const paiseToRupees = (paise) => Number(paise) / 100;

const dateFmt = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
const dateLongFmt = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

export const formatDate = (iso) => (iso ? dateFmt.format(new Date(iso)) : '—');
export const formatDateLong = (iso) => (iso ? dateLongFmt.format(new Date(iso)) : '—');
export const formatTime = (iso) => (iso ? timeFmt.format(new Date(iso)).toLowerCase() : '—');
export const formatDateTime = (iso) => (iso ? `${formatDate(iso)}, ${formatTime(iso)}` : '—');

export function formatDuration(minutes) {
  const m = Number(minutes);
  if (!m) return '';
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h ? `${h}h${r ? ` ${r}m` : ''}` : `${r}m`;
}

export const isPast = (iso) => !!iso && new Date(iso).getTime() < Date.now();

/** Local calendar day as YYYY-MM-DD (used for the `date` query param). */
export function toDateParam(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function buildDateStrip(days = 7, from = new Date()) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    return {
      key: toDateParam(d),
      weekday: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
      day: d.getDate(),
      month: d.toLocaleDateString('en-IN', { month: 'short' }),
    };
  });
}

/** `<input type="datetime-local">` value → ISO-8601 UTC string. */
export const localInputToIso = (value) => (value ? new Date(value).toISOString() : undefined);
/** ISO string → `<input type="datetime-local">` value. */
export function isoToLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export const pluralize = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Normalise a phone entry: bare 10-digit Indian mobiles get +91. */
export function normalizePhone(value) {
  const v = String(value || '').replace(/[\s()-]/g, '');
  return /^[6-9]\d{9}$/.test(v) ? `+91${v}` : v;
}

export const seatLabel = (seat) => (seat ? `${seat.row}${seat.col}` : '');

/** Pull show/title info out of a booking in a shape-tolerant way. */
export function bookingShow(booking) {
  const s = booking?.show || {};
  return {
    title: s.movieTitle || s.title || 'Show',
    venue: s.venueName || '',
    screen: s.screenName || '',
    startTime: s.startTime,
  };
}
