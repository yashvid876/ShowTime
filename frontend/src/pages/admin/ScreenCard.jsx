import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { updateScreenPricing } from '@/api/admin.api';
import { errorMessage } from '@/api/errors';
import { toast } from '@/store/toastStore';
import { Alert, Badge, Button, TextField } from '@/components/ui';
import { SEAT_CATEGORIES } from '@/utils/constants';
import { paiseToRupees, rupeesToPaise } from '@/utils/format';

export function ScreenCard({ screen }) {
  const used = SEAT_CATEGORIES.filter((c) => !screen.categoryMap || Object.values(screen.categoryMap).includes(c));
  const initial = Object.fromEntries(used.map((c) => [c, screen.pricing?.[c] != null ? String(paiseToRupees(screen.pricing[c])) : '']));
  const [prices, setPrices] = useState(initial);
  const [problem, setProblem] = useState(null);
  const m = useMutation({
    mutationFn: () => updateScreenPricing(screen.id, Object.fromEntries(used.map((c) => [c, rupeesToPaise(prices[c])]))),
    onSuccess: () => toast.success(`Pricing saved for ${screen.name || 'screen'}.`),
    onError: (e) => setProblem(errorMessage(e)),
  });
  const invalid = used.some((c) => !(Number(prices[c]) > 0));
  return (
    <li className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">{screen.name || 'Screen'}</h3>
        {screen.rows && screen.cols && <Badge>{screen.rows} rows × {screen.cols} seats</Badge>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); setProblem(null); m.mutate(); }} className="mt-4" noValidate>
        <p className="mb-2 text-sm font-medium text-ink-800">Ticket price by category (₹)</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {used.map((c) => (
            <TextField key={c} label={c} type="number" min={1} step="0.01" inputMode="decimal" value={prices[c]} onChange={(e) => setPrices((p) => ({ ...p, [c]: e.target.value }))} placeholder="e.g. 250" />
          ))}
        </div>
        {problem && <Alert tone="error" className="mt-3">{problem}</Alert>}
        <Button type="submit" size="sm" className="mt-4" disabled={invalid} loading={m.isPending}>Save pricing</Button>
      </form>
    </li>
  );
}
