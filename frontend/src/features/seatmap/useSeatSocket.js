import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '@/utils/constants';
import { useAuthStore } from '@/store/authStore';

/**
 * Live seat status over Socket.IO namespace `/seats` (API contract §9).
 *   client → join:show / leave:show { showId }
 *   server → seat:init { showId, seats:[{seatId,status}] }
 *            seat:update { showId, seatId, status, lockedBy? }
 *            booking:expired { bookingId }   (owning user only)
 * The token is optional (view-only for guests).
 */
export function useSeatSocket(showId, { onBookingExpired } = {}) {
  const isAuthed = !!useAuthStore((s) => s.accessToken);
  const [live, setLive] = useState({});
  const [connected, setConnected] = useState(false);
  const expiredRef = useRef(onBookingExpired);
  useEffect(() => { expiredRef.current = onBookingExpired; });

  useEffect(() => {
    if (!showId) return undefined;
    // Read the token at connect time; reconnect only when signing in/out, not on every silent refresh.
    const token = useAuthStore.getState().accessToken;
    const socket = io(`${SOCKET_URL}/seats`, {
      auth: token ? { token } : {},
      transports: ['websocket', 'polling'],
      reconnectionDelayMax: 5000,
    });
    socket.on('connect', () => { setConnected(true); socket.emit('join:show', { showId }); });
    socket.on('disconnect', () => setConnected(false));
    socket.on('seat:init', (p) => {
      if (p?.showId !== showId) return;
      setLive(Object.fromEntries((p.seats || []).map((s) => [s.seatId, { status: s.status }])));
    });
    socket.on('seat:update', (p) => {
      if (p?.showId !== showId) return;
      setLive((prev) => ({ ...prev, [p.seatId]: { status: p.status, lockedBy: p.lockedBy } }));
    });
    socket.on('booking:expired', (p) => expiredRef.current?.(p?.bookingId));
    return () => {
      socket.emit('leave:show', { showId });
      socket.disconnect();
      setConnected(false);
    };
  }, [showId, isAuthed]);

  return { live, connected };
}
