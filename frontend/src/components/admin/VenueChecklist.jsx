export function VenueChecklist({ venues, value, onChange, legend = 'Venues' }) {
  const toggle = (id) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  if (!venues.length) return <p className="text-sm text-ink-500">No venues yet. Create a venue first.</p>;
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-ink-800">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {venues.map((v) => (
          <label key={v.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm hover:border-ink-400">
            <input type="checkbox" checked={value.includes(v.id)} onChange={() => toggle(v.id)} className="h-4 w-4 accent-brand-600" />
            <span><span className="font-medium">{v.name}</span> <span className="text-ink-500">{v.city}</span></span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
