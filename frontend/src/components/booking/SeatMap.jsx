import { useMemo, useRef } from 'react';
import { Check, Lock, X } from 'lucide-react';
import { formatMoney } from '@/utils/format';

const STATUS_LABEL = { available: 'available', selected: 'selected', mine: 'held for you', locked: 'held by another person', booked: 'booked' };
const CLASS = { available: 'seat-available', selected: 'seat-selected', mine: 'seat-mine', locked: 'seat-locked', booked: 'seat-booked' };

const rowCompare = (a, b) => (a.length - b.length) || a.localeCompare(b);

export function groupSeats(seats) {
  const byRow = new Map();
  seats.forEach((s) => { if (!byRow.has(s.row)) byRow.set(s.row, []); byRow.get(s.row).push(s); });
  const rows = [...byRow.keys()].sort(rowCompare).map((row) => {
    const list = byRow.get(row).sort((a, b) => a.col - b.col);
    return { row, seats: list, category: list[0]?.category, price: list[0]?.price };
  });
  const maxCol = seats.reduce((m, s) => Math.max(m, s.col), 0);
  return { rows, maxCol };
}

export function SeatLegend() {
  const items = [['available', 'Available'], ['selected', 'Selected'], ['mine', 'Held for you'], ['locked', 'Held by someone else'], ['booked', 'Booked']];
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-600" aria-label="Seat legend">
      {items.map(([k, label]) => (
        <li key={k} className="flex items-center gap-2">
          <span className={`seat !h-5 !w-5 ${CLASS[k]}`} aria-hidden="true">{k === 'selected' ? <Check className="h-3 w-3" /> : k === 'booked' ? <X className="h-3 w-3" /> : k === 'locked' || k === 'mine' ? <Lock className="h-3 w-3" /> : null}</span>
          {label}
        </li>
      ))}
    </ul>
  );
}

/**
 * Props:
 *  seats        — [{ id, row, col, category, price, ui }] where ui ∈ available|selected|mine|locked|booked
 *  onToggle     — (seat) => void (only called for selectable seats)
 *  disabled     — freeze interaction (e.g. while locking, or holding another lock)
 */
export function SeatMap({ seats, onToggle, disabled = false }) {
  const { rows, maxCol } = useMemo(() => groupSeats(seats), [seats]);
  const gridRef = useRef(null);

  // Arrow-key navigation between seats (WCAG keyboard support)
  const onKeyDown = (e) => {
    const keys = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
    const d = keys[e.key];
    const cur = e.target.closest?.('[data-seat]');
    if (!d || !cur) return;
    e.preventDefault();
    let r = Number(cur.dataset.r) + d[0];
    let c = Number(cur.dataset.c) + d[1];
    for (let guard = 0; guard < 80; guard += 1) {
      const next = gridRef.current?.querySelector(`[data-r="${r}"][data-c="${c}"]`);
      if (next) { next.focus(); return; }
      if (r < 0 || r >= rows.length || c < 1 || c > maxCol) return;
      r += d[0]; c += d[1];
    }
  };

  let lastCategory = null;
  return (
    <div className="seat-grid overflow-x-auto pb-2" style={{ '--cols': maxCol }}>
      <div className="mx-auto w-max min-w-full px-1 sm:px-2">
        <div className="mx-auto mb-6 w-full max-w-[18rem] text-center sm:mb-8 sm:max-w-md" aria-hidden="true">
          <svg viewBox="0 0 400 36" className="w-full"><path d="M8 30 Q200 -6 392 30" fill="none" stroke="#B5B9C7" strokeWidth="4" strokeLinecap="round" /></svg>
          <p className="-mt-1 text-xs font-medium text-ink-400">Screen this way</p>
        </div>
        <div ref={gridRef} role="group" aria-label="Seat map" onKeyDown={onKeyDown} className="mx-auto flex w-max flex-col gap-1 sm:gap-1.5">
          {rows.map((r, ri) => {
            const header = r.category !== lastCategory;
            lastCategory = r.category;
            return (
              <div key={r.row}>
                {header && (
                  <div className={`flex items-baseline justify-between gap-6 border-b border-ink-200 pb-1 text-xs ${ri ? 'mt-4' : ''}`}>
                    <span className="font-semibold text-ink-800">{r.category}</span>
                    <span className="text-ink-500">{formatMoney(r.price)}</span>
                  </div>
                )}
                <div className="mt-1.5 flex items-center gap-1 sm:gap-2">
                  <span className="w-4 text-center text-xs font-semibold text-ink-500 sm:w-5" aria-hidden="true">{r.row}</span>
                  <div className="flex gap-1 sm:gap-1.5">
                    {Array.from({ length: maxCol }, (_, i) => {
                      const col = i + 1;
                      const seat = r.seats.find((s) => s.col === col);
                      if (!seat) return <span key={col} className="seat !border-transparent" aria-hidden="true" />;
                      const selectable = !disabled && (seat.ui === 'available' || seat.ui === 'selected');
                      const label = `Row ${seat.row}, seat ${seat.col}, ${seat.category}, ${formatMoney(seat.price)}, ${STATUS_LABEL[seat.ui]}`;
                      return (
                        <button
                          key={seat.id}
                          type="button"
                          data-seat
                          data-r={ri}
                          data-c={col}
                          aria-label={label}
                          aria-pressed={seat.ui === 'available' || seat.ui === 'selected' ? seat.ui === 'selected' : undefined}
                          aria-disabled={!selectable || undefined}
                          onClick={() => selectable && onToggle(seat)}
                          className={`seat ${CLASS[seat.ui]}`}
                        >
                          {seat.ui === 'selected' ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : seat.ui === 'booked' ? <X className="h-3 w-3" aria-hidden="true" /> : seat.ui === 'locked' || seat.ui === 'mine' ? <Lock className="h-3 w-3" aria-hidden="true" /> : <span aria-hidden="true">{seat.col}</span>}
                        </button>
                      );
                    })}
                  </div>
                  <span className="hidden w-5 text-center text-xs font-semibold text-ink-500 sm:block" aria-hidden="true">{r.row}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
