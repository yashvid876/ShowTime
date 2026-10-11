import { useState } from 'react';
import { Star } from 'lucide-react';

export function Stars({ value = 0, size = 'h-4 w-4' }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${Number(value).toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} aria-hidden="true" className={`${size} ${n <= Math.round(value) ? 'fill-gold-400 text-gold-500' : 'text-ink-300'}`} />
      ))}
    </span>
  );
}

export function StarInput({ value = 0, onChange, label = 'Rating' }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          className="rounded p-0.5"
        >
          <Star aria-hidden="true" className={`h-7 w-7 ${n <= shown ? 'fill-gold-400 text-gold-500' : 'text-ink-300'}`} />
        </button>
      ))}
    </div>
  );
}
