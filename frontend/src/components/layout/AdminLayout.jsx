import { Suspense } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, Building2, CalendarClock, Clapperboard, FileClock, ShieldAlert, Users } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { FullPageSpinner } from '@/components/ui';
import { Header } from './Header';

const links = [
  { to: '/admin', end: true, label: 'Venues', icon: Building2 },
  { to: '/admin/catalog', label: 'Movies & events', icon: Clapperboard },
  { to: '/admin/shows', label: 'Shows', icon: CalendarClock },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/partners', label: 'Partners', icon: Users, adminOnly: true },
  { to: '/admin/disputes', label: 'Disputes', icon: ShieldAlert, adminOnly: true },
  { to: '/admin/audit-log', label: 'Audit log', icon: FileClock, adminOnly: true },
];

export function AdminLayout() {
  const role = useAuthStore((s) => s.user?.role);
  const visible = links.filter((l) => !l.adminOnly || role === 'admin');
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link">Skip to content</a>
      <Header />
      <div className="container-page flex flex-1 flex-col gap-6 py-6 lg:flex-row">
        <nav aria-label="Dashboard" className="lg:w-56 lg:shrink-0">
          <ul className="flex gap-1 overflow-x-auto pb-1 lg:sticky lg:top-24 lg:flex-col lg:overflow-visible">
            {visible.map(({ to, end, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) => `flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-100'}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" /> {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <main id="main" className="min-w-0 flex-1">
          <Suspense fallback={<FullPageSpinner />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
