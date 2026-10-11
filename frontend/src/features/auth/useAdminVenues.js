import { useQuery } from '@tanstack/react-query';
import { listVenues } from '@/api/admin.api';
import { qk } from '@/api/queryKeys';

/** GET /admin/venues — partners get their own venues, admins get all (BR-4). */
export function useAdminVenues() {
  const q = useQuery({ queryKey: qk.adminVenues, queryFn: listVenues, staleTime: 5 * 60 * 1000 });
  return { ...q, venues: q.data?.items || [] };
}
