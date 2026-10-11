import { Compass } from 'lucide-react';
import { EmptyState, LinkButton } from '@/components/ui';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <div className="container-page max-w-2xl py-16">
      <EmptyState icon={Compass} title="We couldn't find that page" action={<LinkButton to="/">Back to home</LinkButton>}>
        The link may be broken or the page may have moved.
      </EmptyState>
    </div>
  );
}
