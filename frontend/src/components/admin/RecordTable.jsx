import { formatDateTime } from '@/utils/format';

const PREFERRED = ['id', 'createdAt', 'timestamp', 'actorId', 'actor', 'action', 'resource', 'bookingId', 'userId', 'status', 'type', 'reason', 'amount'];
const isDateKey = (k) => /(At|Time|time|date|Date|timestamp)$/.test(k);
const isIso = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v);

function cell(key, value) {
  if (value === null || value === undefined || value === '') return '—';
  if (isIso(value) || (isDateKey(key) && !Number.isNaN(Date.parse(value)))) return formatDateTime(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * The API contract returns `items[]` for disputes and the audit log without a field list,
 * so this renders the most useful scalar fields and keeps every record's full JSON one click away.
 */
export function RecordTable({ items, caption }) {
  const sample = items[0] || {};
  const scalar = Object.keys(sample).filter((k) => sample[k] === null || typeof sample[k] !== 'object');
  const cols = [...PREFERRED.filter((k) => scalar.includes(k)), ...scalar.filter((k) => !PREFERRED.includes(k))].slice(0, 5);
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-ink-200 bg-ink-50 text-xs text-ink-600">
          <tr>{cols.map((c) => <th key={c} scope="col" className="px-4 py-2.5 font-semibold">{c.replace(/([A-Z])/g, ' $1').replace(/^./, (m) => m.toUpperCase())}</th>)}<th className="px-4 py-2.5"><span className="sr-only">Details</span></th></tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {items.map((it, i) => (
            <tr key={it.id || i} className="align-top">
              {cols.map((c) => <td key={c} className="max-w-[14rem] truncate px-4 py-3" title={String(it[c] ?? '')}>{cell(c, it[c])}</td>)}
              <td className="px-4 py-3">
                <details><summary className="cursor-pointer text-xs font-semibold text-brand-700">View</summary>
                  <pre className="mt-2 max-h-64 max-w-md overflow-auto rounded-md bg-ink-50 p-2 text-xs">{JSON.stringify(it, null, 2)}</pre>
                </details>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
