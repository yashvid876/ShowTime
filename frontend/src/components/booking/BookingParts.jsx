import { useState } from 'react';
import { Download } from 'lucide-react';
import { downloadInvoice } from '@/api/bookings.api';
import { errorMessage } from '@/api/errors';
import { toast } from '@/store/toastStore';
import { Button } from '@/components/ui';
import { formatMoney, seatLabel } from '@/utils/format';

export function SeatChips({ seats = [] }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Seats">
      {seats.map((s) => (
        <li key={s.id} className="rounded-md border border-ink-200 bg-ink-50 px-2 py-1 text-xs font-semibold">
          {seatLabel(s)} <span className="font-normal text-ink-500">{s.category}</span>
        </li>
      ))}
    </ul>
  );
}

export function AmountBreakdown({ amount }) {
  if (!amount) return null;
  const rows = [['Tickets', amount.ticketTotal], ['Taxes', amount.taxes], ['Convenience fee', amount.convenienceFee]];
  return (
    <dl className="text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between py-1.5"><dt className="text-ink-600">{k}</dt><dd className="font-medium tabular-nums">{formatMoney(v)}</dd></div>
      ))}
      <div className="mt-1 flex items-baseline justify-between border-t border-ink-200 pt-3">
        <dt className="font-semibold">Total</dt>
        <dd className="font-display text-2xl font-bold tabular-nums">{formatMoney(amount.grandTotal)}</dd>
      </div>
    </dl>
  );
}

export function InvoiceButton({ bookingId, size = 'md', variant = 'secondary' }) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try { await downloadInvoice(bookingId); } catch (e) { toast.error(errorMessage(e, "Couldn't download the invoice.")); } finally { setBusy(false); }
  };
  return <Button variant={variant} size={size} onClick={run} loading={busy}><Download className="h-4 w-4" aria-hidden="true" /> Download invoice</Button>;
}
