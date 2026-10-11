import { useId, useState } from 'react';
import { X } from 'lucide-react';
import { Field } from './Fields';

/** Free-text multi-value input. Enter or comma adds a tag; backspace removes the last. */
export function TagInput({ label, value = [], onChange, suggestions = [], placeholder, error, hint, required }) {
  const id = useId();
  const [draft, setDraft] = useState('');
  const add = (raw) => {
    const t = raw.trim();
    if (t && !value.some((v) => v.toLowerCase() === t.toLowerCase())) onChange([...value, t]);
    setDraft('');
  };
  return (
    <Field id={id} label={label} error={error} hint={hint} required={required}>
      <div className={`flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border bg-white px-2 py-1.5 ${error ? 'border-danger-600' : 'border-ink-300'} focus-within:ring-2 focus-within:ring-brand-600`}>
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
            {t}
            <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((v) => v !== t))}>
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          id={id}
          list={suggestions.length ? `${id}-list` : undefined}
          value={draft}
          placeholder={value.length ? '' : placeholder}
          onChange={(e) => setDraft(e.target.value.endsWith(',') ? (add(e.target.value.slice(0, -1)), '') : e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); add(draft); }
            if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={() => add(draft)}
          className="min-w-[8rem] flex-1 border-0 bg-transparent p-1 text-sm outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        {suggestions.length > 0 && (
          <datalist id={`${id}-list`}>
            {suggestions.filter((s) => !value.includes(s)).map((s) => <option key={s} value={s} />)}
          </datalist>
        )}
      </div>
    </Field>
  );
}
