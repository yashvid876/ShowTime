import { Link } from 'react-router-dom';

export function Logo({ className = '' }) {
  return (
    <Link to="/" aria-label="ShowTime home" className={`inline-flex items-center gap-2 ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path d="M3 8h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z" fill="#EDB84A" />
        </svg>
      </span>
      <span className="font-display text-xl font-bold tracking-tight text-ink-900">ShowTime</span>
    </Link>
  );
}
