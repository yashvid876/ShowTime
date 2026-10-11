import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { FullPageSpinner } from '@/components/ui';
import ForbiddenPage from '@/pages/Static/ForbiddenPage';
import { homeFor } from './session';

/** Gate for authenticated (and optionally role-restricted) routes. */
export function RequireAuth({ roles }) {
  const { user, status } = useAuthStore();
  const location = useLocation();
  if (status === 'idle' || status === 'loading') return <FullPageSpinner label="Checking your session" />;
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  if (roles && !roles.includes(user.role)) return <ForbiddenPage />;
  return <Outlet />;
}

/** Login/register pages bounce signed-in users away. */
export function GuestOnly() {
  const { user, status } = useAuthStore();
  if (status === 'idle' || status === 'loading') return <FullPageSpinner label="Checking your session" />;
  if (user) return <Navigate to={homeFor(user)} replace />;
  return <Outlet />;
}
