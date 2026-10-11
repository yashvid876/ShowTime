import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';
import { EmptyState, LinkButton } from '@/components/ui';

export default function RouteError() {
  const err = useRouteError();
  const notFound = isRouteErrorResponse(err) && err.status === 404;
  return (
    <div className="container-page max-w-2xl py-20">
      <EmptyState icon={TriangleAlert} title={notFound ? "We couldn't find that page" : 'Something broke on our side'} action={<LinkButton to="/" onClick={() => window.location.assign('/')}>Back to home</LinkButton>}>
        {notFound ? 'The link may be broken or the page may have moved.' : 'Reload the page. If it keeps happening, contact support.'}
      </EmptyState>
    </div>
  );
}
