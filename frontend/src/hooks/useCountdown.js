import { useEffect, useState } from 'react';

/** Counts down to a server-issued ISO timestamp (`lockExpiresAt`). */
export function useCountdown(expiresAt) {
  const target = expiresAt ? new Date(expiresAt).getTime() : null;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return undefined;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (!target) return { remainingMs: null, expired: false, label: '' };
  const remainingMs = Math.max(0, target - now);
  const s = Math.ceil(remainingMs / 1000);
  const label = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return { remainingMs, expired: remainingMs === 0, label };
}
