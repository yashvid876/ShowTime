import { formatDate } from '@/utils/format';

/** Simple accessible bar chart; the same data is available as a visually-hidden table. */
export function BarChart({ data, label = 'Bookings per day' }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <figure>
      <div className="flex h-48 items-end gap-1 overflow-x-auto pb-1" aria-hidden="true">
        {data.map((d) => (
          <div key={d.key} className="flex h-full min-w-[1.25rem] flex-1 flex-col items-center justify-end" title={`${d.label}: ${d.value}`}>
            <span className="mb-1 text-[10px] font-semibold text-ink-600">{d.value}</span>
            <div className="w-full rounded-t bg-brand-600" style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-ink-500" aria-hidden="true">
        <span>{data[0]?.label}</span><span>{data[data.length - 1]?.label}</span>
      </div>
      <table className="sr-only"><caption>{label}</caption><thead><tr><th>Date</th><th>Bookings</th></tr></thead>
        <tbody>{data.map((d) => <tr key={d.key}><td>{formatDate(d.key)}</td><td>{d.value}</td></tr>)}</tbody></table>
    </figure>
  );
}
