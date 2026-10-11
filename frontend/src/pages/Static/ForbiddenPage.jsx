import { ShieldX } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { EmptyState, LinkButton } from '@/components/ui';

export default function ForbiddenPage() {
  const user = useAuthStore((s) => s.user);
  const staff = user && user.role !== 'patron';
  return (
    <div className="container-page max-w-2xl py-16">
      <EmptyState icon={ShieldX} title="You don't have access to this page" action={<LinkButton to={staff ? '/admin' : '/'}>{staff ? 'Go to dashboard' : 'Back to home'}</LinkButton>}>
        {staff ? 'Booking pages are for patron accounts. Use the dashboard to manage venues and shows.' : 'Your account role does not include this area.'}
      </EmptyState>
    </div>
  );
}
