import { Link } from 'react-router-dom';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-ink-200 bg-white">
      <div className="container-page flex flex-col gap-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <p className="mt-2 max-w-xs text-sm text-ink-500">Real-time seat selection for movies and live events.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-ink-600">
          <Link to="/help" className="hover:text-ink-900">Help &amp; support</Link>
          <Link to="/terms" className="hover:text-ink-900">Terms of service</Link>
          <Link to="/refund-policy" className="hover:text-ink-900">Cancellation &amp; refunds</Link>
        </nav>
      </div>
      <p className="border-t border-ink-100 py-4 text-center text-xs text-ink-400">© {new Date().getFullYear()} ShowTime</p>
    </footer>
  );
}
