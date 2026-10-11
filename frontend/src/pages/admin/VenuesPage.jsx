import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BarChart3, Building2, Plus, Settings2 } from 'lucide-react';
import { createVenue } from '@/api/admin.api';
import { qk } from '@/api/queryKeys';
import { applyServerErrors, errorMessage } from '@/api/errors';
import { useAdminVenues } from '@/features/auth/useAdminVenues';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Alert, Button, EmptyState, ErrorState, LinkButton, Modal, PageHeader, Skeleton, TagInput, TextField } from '@/components/ui';
import { pluralize } from '@/utils/format';

const VenueForm = z.object({
  name: z.string().trim().min(2, 'Enter the venue name'),
  city: z.string().trim().min(2, 'Enter the city'),
  address: z.string().trim().min(5, 'Enter the full address'),
  partnerIds: z.array(z.string().length(24, 'Each partner ID is 24 characters')).default([]),
});

function CreateVenueModal({ open, onClose }) {
  const qc = useQueryClient();
  const [problem, setProblem] = useState(null);
  const { register, control, handleSubmit, reset, setError, formState: { errors } } = useForm({ resolver: zodResolver(VenueForm), defaultValues: { name: '', city: '', address: '', partnerIds: [] } });
  const m = useMutation({
    mutationFn: createVenue,
    onSuccess: (venue) => {
      toast.success(`${venue?.name || 'Venue'} created.`);
      qc.invalidateQueries({ queryKey: qk.adminVenues });
      reset(); setProblem(null); onClose();
    },
    onError: (e) => { if (!applyServerErrors(e, setError)) setProblem(errorMessage(e)); },
  });
  return (
    <Modal open={open} onClose={onClose} title="Add venue" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="venue-form" loading={m.isPending}>Create venue</Button></>}>
      <form id="venue-form" onSubmit={handleSubmit((v) => { setProblem(null); m.mutate(v); })} noValidate className="space-y-4">
        <TextField label="Venue name" required error={errors.name?.message} {...register('name')} />
        <TextField label="City" required error={errors.city?.message} {...register('city')} />
        <TextField label="Address" required error={errors.address?.message} {...register('address')} />
        <Controller control={control} name="partnerIds" render={({ field }) => (
          <TagInput label="Partner IDs" value={field.value} onChange={field.onChange} placeholder="Paste a partner ID and press Enter" hint="Venue partners who may manage this venue (BR-4)." error={errors.partnerIds?.message || errors.partnerIds?.[0]?.message} />
        )} />
        {problem && <Alert tone="error">{problem}</Alert>}
      </form>
    </Modal>
  );
}

export default function VenuesPage() {
  useDocumentTitle('Venues');
  const role = useAuthStore((s) => s.user?.role);
  const { venues, isLoading, isError, error, refetch } = useAdminVenues();
  const [creating, setCreating] = useState(false);
  return (
    <>
      <PageHeader title="Venues" description={role === 'admin' ? 'All venues on the platform.' : 'Venues assigned to your account.'} actions={role === 'admin' && <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" aria-hidden="true" /> Add venue</Button>} />
      {isLoading && <div className="grid gap-4 sm:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-36" />)}</div>}
      {isError && <ErrorState error={error} onRetry={refetch} title="Couldn't load venues" />}
      {!isLoading && !isError && venues.length === 0 && (
        <EmptyState icon={Building2} title="No venues yet" action={role === 'admin' ? <Button onClick={() => setCreating(true)}>Add venue</Button> : null}>
          {role === 'admin' ? 'Create a venue and assign it to a partner.' : 'A platform admin needs to assign a venue to your account before you can manage shows.'}
        </EmptyState>
      )}
      <ul className="grid gap-4 sm:grid-cols-2">
        {venues.map((v) => (
          <li key={v.id} className="card p-5">
            <h2 className="text-lg font-semibold">{v.name}</h2>
            <p className="text-sm text-ink-600">{v.city}{v.address ? `, ${v.address}` : ''}</p>
            {Array.isArray(v.screens) && <p className="mt-1 text-xs text-ink-500">{pluralize(v.screens.length, 'screen')}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <LinkButton to={`/admin/venues/${v.id}`} size="sm"><Settings2 className="h-4 w-4" aria-hidden="true" /> Manage</LinkButton>
              <Link to={`/admin/analytics?venueId=${v.id}`} className="inline-flex h-8 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-ink-700 hover:bg-ink-100"><BarChart3 className="h-4 w-4" aria-hidden="true" /> Analytics</Link>
            </div>
          </li>
        ))}
      </ul>
      <CreateVenueModal open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
