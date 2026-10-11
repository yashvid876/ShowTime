import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createScreen } from '@/api/admin.api';
import { qk } from '@/api/queryKeys';
import { errorMessage } from '@/api/errors';
import { toast } from '@/store/toastStore';
import { Alert, Button, SelectField, TextField } from '@/components/ui';
import { SEAT_CATEGORIES } from '@/utils/constants';

const letter = (i) => String.fromCharCode(65 + i);
const TONE = { Silver: 'bg-ink-200 border-ink-300', Gold: 'bg-gold-300 border-gold-500', Premium: 'bg-brand-300 border-brand-600' };

/** Seat-map builder: rows × columns grid, each row assigned a pricing category (categoryMap). */
export function ScreenBuilder({ venueId, onCreated, onCancel }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [rows, setRows] = useState(8);
  const [cols, setCols] = useState(12);
  const [cats, setCats] = useState({}); // row letter → category
  const [problem, setProblem] = useState(null);

  const rowLetters = useMemo(() => Array.from({ length: rows }, (_, i) => letter(i)), [rows]);
  const catOf = (r, i) => cats[r] || (i < Math.ceil(rows * 0.25) ? 'Premium' : i < Math.ceil(rows * 0.6) ? 'Gold' : 'Silver');
  const categoryMap = Object.fromEntries(rowLetters.map((r, i) => [r, catOf(r, i)]));

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Number(v) || lo));
  const valid = name.trim().length > 0 && rows >= 1 && cols >= 1;

  const m = useMutation({
    mutationFn: () => createScreen(venueId, { name: name.trim(), rows, cols, categoryMap }),
    onSuccess: (screen) => {
      toast.success('Screen created. Set its category prices next.');
      // The contract has no "list screens" endpoint, so keep new screens in the cached venue list for this session.
      qc.setQueryData(qk.adminVenues, (old) => old && ({ ...old, items: old.items.map((v) => (v.id === venueId ? { ...v, screens: [...(v.screens || []), { rows, cols, categoryMap, name: name.trim(), ...screen }] } : v)) }));
      onCreated?.(screen);
    },
    onError: (e) => setProblem(errorMessage(e)),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); setProblem(null); m.mutate(); }} className="card space-y-5 p-5" noValidate>
      <h3 className="text-lg font-semibold">New screen</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label="Screen name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Screen 1" />
        <TextField label="Rows (A–Z)" type="number" min={1} max={26} value={rows} onChange={(e) => setRows(clamp(e.target.value, 1, 26))} />
        <TextField label="Seats per row" type="number" min={1} max={40} value={cols} onChange={(e) => setCols(clamp(e.target.value, 1, 40))} />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-ink-800">Category by row</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {rowLetters.map((r, i) => (
            <SelectField key={r} label={`Row ${r}`} value={catOf(r, i)} onChange={(e) => setCats((c) => ({ ...c, [r]: e.target.value }))}>
              {SEAT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </SelectField>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-ink-800">Preview <span className="font-normal text-ink-500">({rows * cols} seats)</span></p>
        <div className="overflow-x-auto rounded-lg bg-ink-50 p-4" role="img" aria-label={`Seat layout preview: ${rows} rows of ${cols} seats`}>
          <div className="mx-auto w-max space-y-1">
            {rowLetters.map((r, i) => (
              <div key={r} className="flex items-center gap-1">
                <span className="w-4 text-[10px] font-semibold text-ink-500">{r}</span>
                {Array.from({ length: cols }, (_, c) => <span key={c} className={`h-4 w-4 rounded-t-md rounded-b-sm border ${TONE[catOf(r, i)]}`} />)}
              </div>
            ))}
          </div>
        </div>
        <ul className="mt-2 flex gap-4 text-xs text-ink-600">{SEAT_CATEGORIES.map((c) => <li key={c} className="flex items-center gap-1.5"><span className={`h-3 w-3 rounded-sm border ${TONE[c]}`} />{c}</li>)}</ul>
      </div>

      {problem && <Alert tone="error">{problem}</Alert>}
      <div className="flex justify-end gap-2">
        {onCancel && <Button variant="secondary" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" disabled={!valid} loading={m.isPending}>Create screen</Button>
      </div>
    </form>
  );
}
