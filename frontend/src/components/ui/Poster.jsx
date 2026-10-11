import { useState } from 'react';
import { posterTint } from '@/utils/posterColor';

/** Poster image with a deterministic tinted fallback (no remote placeholder services). */
export function Poster({ src, title = '', className = '' }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    const initials = title.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
    return (
      <div role="img" aria-label={`${title} poster unavailable`} style={{ backgroundColor: posterTint(title) }} className={`flex items-center justify-center font-display text-3xl font-bold text-white/90 ${className}`}>
        {initials || '🎬'}
      </div>
    );
  }
  return <img src={src} alt={`${title} poster`} loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />;
}
