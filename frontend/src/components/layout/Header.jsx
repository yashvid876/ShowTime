import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { LayoutDashboard, LogOut, MapPin, Menu, Search, Ticket, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { logoutUser } from '@/features/auth/session';
import { toast } from '@/store/toastStore';
import { buttonClasses } from '@/components/ui';
import { Logo } from './Logo';

const navCls = ({ isActive }) => `rounded-md px-3 py-2 text-sm font-semibold transition-colors ${isActive ? 'text-brand-700' : 'text-ink-600 hover:text-ink-900'}`;

function SearchBox({ onDone }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        navigate(`/search${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
        onDone?.();
      }}
      className="relative w-full"
    >
      <label htmlFor="header-search" className="sr-only">Search movies and events</label>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
      <input id="header-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search movies and events" className="h-10 w-full rounded-lg border border-ink-200 bg-ink-50 pl-9 pr-3 text-sm placeholder:text-ink-400 focus:bg-white" />
    </form>
  );
}

function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);
  const initials = user.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const logout = async () => {
    setOpen(false);
    await logoutUser(queryClient);
    toast.info('You have been logged out.');
    navigate('/');
  };
  const item = 'flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-ink-700 hover:bg-ink-50';
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)} className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white hover:bg-brand-700" aria-label="Account menu">
        {initials}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-pop">
          <div className="border-b border-ink-100 px-4 py-3">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-ink-500">{user.email}</p>
          </div>
          {user.role === 'patron' && (
            <Link role="menuitem" to="/my-bookings" onClick={() => setOpen(false)} className={item}><Ticket className="h-4 w-4" aria-hidden="true" /> My bookings</Link>
          )}
          {user.role !== 'patron' && (
            <Link role="menuitem" to="/admin" onClick={() => setOpen(false)} className={item}><LayoutDashboard className="h-4 w-4" aria-hidden="true" /> {user.role === 'admin' ? 'Admin dashboard' : 'Partner dashboard'}</Link>
          )}
          <button role="menuitem" type="button" onClick={logout} className={`${item} border-t border-ink-100`}><LogOut className="h-4 w-4" aria-hidden="true" /> Log out</button>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { user, status } = useAuthStore();
  const city = useUiStore((s) => s.city);
  const openCityModal = useUiStore((s) => s.openCityModal);
  const [menu, setMenu] = useState(false);

  const cityBtn = (
    <button type="button" onClick={() => { openCityModal(); setMenu(false); }} className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-ink-700 hover:bg-ink-100" aria-label={`City: ${city || 'All cities'}. Change city`}>
      <MapPin className="h-4 w-4 text-brand-600" aria-hidden="true" />
      {city || 'All cities'}
    </button>
  );
  const authArea =
    status === 'idle' || status === 'loading' ? <div className="h-10 w-10" aria-hidden="true" /> : user ? (
      <UserMenu />
    ) : (
      <div className="flex items-center gap-2">
        <Link to="/login" className={buttonClasses('ghost', 'md')}>Log in</Link>
        <Link to="/register" className={buttonClasses('primary', 'md', 'hidden sm:inline-flex')}>Sign up</Link>
      </div>
    );

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-3">
        <Logo />
        <nav aria-label="Main" className="ml-4 hidden items-center md:flex">
          <NavLink to="/search?type=movie" className={navCls}>Movies</NavLink>
          <NavLink to="/search?type=event" className={navCls}>Events</NavLink>
        </nav>
        <div className="mx-4 hidden max-w-xs flex-1 lg:block"><SearchBox /></div>
        <div className="ml-auto flex items-center gap-1">
          <span className="hidden sm:block">{cityBtn}</span>
          {authArea}
          <button type="button" className="ml-1 rounded-md p-2 text-ink-700 hover:bg-ink-100 md:hidden" aria-expanded={menu} aria-controls="mobile-menu" aria-label={menu ? 'Close menu' : 'Open menu'} onClick={() => setMenu(!menu)}>
            {menu ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>
      {menu && (
        <div id="mobile-menu" className="space-y-3 border-t border-ink-100 bg-white px-4 py-4 md:hidden">
          <SearchBox onDone={() => setMenu(false)} />
          <div className="flex flex-col">
            <NavLink to="/search?type=movie" onClick={() => setMenu(false)} className={navCls}>Movies</NavLink>
            <NavLink to="/search?type=event" onClick={() => setMenu(false)} className={navCls}>Events</NavLink>
            <NavLink to="/help" onClick={() => setMenu(false)} className={navCls}>Help</NavLink>
          </div>
          <div className="flex items-center justify-between border-t border-ink-100 pt-3">
            {cityBtn}
            {!user && status === 'guest' && <Link to="/register" onClick={() => setMenu(false)} className={buttonClasses('primary', 'md')}>Sign up</Link>}
          </div>
        </div>
      )}
    </header>
  );
}
