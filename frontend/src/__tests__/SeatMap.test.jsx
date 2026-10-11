import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SeatMap, groupSeats } from '@/components/booking/SeatMap';

const seat = (row, col, ui, category = 'Gold', price = 25000) => ({ id: `${row}${col}`.padEnd(24, '0'), row, col, category, price, ui });
const seats = [seat('A', 1, 'available'), seat('A', 2, 'booked'), seat('A', 4, 'selected'), seat('B', 1, 'locked'), seat('B', 2, 'mine'), seat('B', 3, 'available')];

describe('groupSeats', () => {
  it('orders rows, sorts columns and finds the widest row', () => {
    const { rows, maxCol } = groupSeats([seat('B', 3, 'available'), seat('A', 2, 'available'), seat('A', 1, 'available'), seat('AA', 1, 'available')]);
    expect(rows.map((r) => r.row)).toEqual(['A', 'B', 'AA']);
    expect(rows[0].seats.map((s) => s.col)).toEqual([1, 2]);
    expect(maxCol).toBe(3);
  });
});

describe('SeatMap', () => {
  it('announces status and price for every seat', () => {
    render(<SeatMap seats={seats} onToggle={() => {}} />);
    expect(screen.getByLabelText('Row A, seat 1, Gold, ₹250, available')).toBeInTheDocument();
    expect(screen.getByLabelText(/Row A, seat 2.*booked/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Row B, seat 1.*held by another person/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Row B, seat 2.*held for you/)).toBeInTheDocument();
  });
  it('toggles only available/selected seats', () => {
    const onToggle = vi.fn();
    render(<SeatMap seats={seats} onToggle={onToggle} />);
    ['available', 'booked', 'held by another person', 'held for you'].forEach((s) => fireEvent.click(screen.getAllByLabelText(new RegExp(`${s}$`))[0]));
    fireEvent.click(screen.getByLabelText(/seat 4.*selected/));
    expect(onToggle.mock.calls.map(([s]) => s.ui)).toEqual(['available', 'selected']);
  });
  it('ignores clicks while disabled', () => {
    const onToggle = vi.fn();
    render(<SeatMap seats={seats} onToggle={onToggle} disabled />);
    fireEvent.click(screen.getByLabelText(/Row A, seat 1/));
    expect(onToggle).not.toHaveBeenCalled();
  });
  it('supports arrow-key navigation between seats', () => {
    render(<SeatMap seats={seats} onToggle={() => {}} />);
    const first = screen.getByLabelText(/Row A, seat 1/);
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(screen.getByLabelText(/Row B, seat 1/));
    fireEvent.keyDown(document.activeElement, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(screen.getByLabelText(/Row B, seat 2/));
  });
});
