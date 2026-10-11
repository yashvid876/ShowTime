import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Plus } from 'lucide-react';
import { createShow, deleteShow, updateShow } from '@/api/admin.api';
import { getTitle, listCities, listTitles } from '@/api/catalog.api';
import { qk } from '@/api/queryKeys';
import { errorMessage } from '@/api/errors';
import { useAdminVenues } from '@/features/auth/useAdminVenues';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { useDebounce } from '@/hooks/useDebounce';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Alert, Badge, Button, ConfirmDialog, EmptyState, ErrorState, Modal, PageHeader, SelectField, Skeleton, TextField } from '@/components/ui';
import { AVAILABILITY } from '@/utils/constants';
import { formatDateTime, isoToLocalInput, localInputToIso } from '@/utils/format';

function AddShowModal({ open, onClose, titleId, venues, onDone }) {
  const screens = venues.flatMap((v) => (v.screens || []).filter((s) => s.id).map((s) => ({ id: s.id, label: `${v.name}, ${s.name || 'Screen'}` })));
  const [screenId, setScreenId] = useState('');
  const [start, setStart] = useState('');
  const [problem, setProblem] = useState(null);
  const m = useMutation({
    mutationFn: () => createShow({ movieEventId: titleId, screenId, startTime: localInputToIso(start) }),
    onSuccess: () => { toast.success('Show added.'); setScreenId(''); setStart(''); setProblem(null); onDone(); onClose(); },
    onError: (e) => setProblem(e.code === 'CONFLICT' ? 'Another show overlaps this time on the same screen.' : errorMessage(e)),
  });
  const valid = /^[a-f0-9]{24}$/i.test(screenId) && !!start;
  return (
    <Modal open={open} onClose={onClose} title="Add show" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => { setProblem(null); m.mutate(); }} disabled={!valid} loading={m.isPending}>Add show</Button></>}>
      <div className="space-y-4">
        {screens.length > 0 ? (
          <SelectField label="Screen" required value={screenId} onChange={(e) => setScreenId(e.target.value)}>
            <option value="">Choose a screen</option>{screens.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </SelectField>
        ) : (
          <TextField label="Screen ID" required value={screenId} onChange={(e) => setScreenId(e.target.value.trim())} placeholder="24-character screen ID" hint="The venue list doesn't include screens yet, so paste the ID returned when the screen was created." />
        )}
        <TextField label="Start time" type="datetime-local" required value={start} onChange={(e) => setStart(e.target.value)} />
        {problem && <Alert tone="error">{problem}</Alert>}
      </div>
    </Modal>
  );
}

function RescheduleModal({ show, onClose, onDone }) {
  const [start, setStart] = useState(isoToLocalInput(show.startTime));
  const [problem, setProblem] = useState(null);
  const m = useMutation({
    mutationFn: () => updateShow(show.id, { startTime: localInputToIso(start) }),
    onSuccess: () => { toast.success('Show time updated.'); onDone(); onClose(); },
    onError: (e) => setProblem(e.code === 'CONFLICT' ? 'Another show overlaps this time on the same screen.' : errorMessage(e)),
  });
  return (
    <Modal open onClose={onClose} title="Change show time" size="sm" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => { setProblem(null); m.mutate(); }} loading={m.isPending} disabled={!start}>Save time</Button></>}>
      <TextField label="Start time" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
      {problem && <Alert tone="error" className="mt-3">{problem}</Alert>}
    </Modal>
  );
}

export default function ShowsPage() {
  useDocumentTitle('Shows');
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.user?.role);
  const { venues: adminVenues } = useAdminVenues();
  const [kind, setKind] = useState('movie');
  const [text, setText] = useState('');
  const search = useDebounce(text);
  const [titleId, setTitleId] = useState('');
  const [city, setCity] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type: 'deactivate'|'delete', show }

  const titles = useQuery({ queryKey: qk.titles(kind, { q: search, limit: 20, picker: true }), queryFn: () => listTitles(kind, { q: search, limit: 20 }), placeholderData: (p) => p });
  const cities = useQuery({ queryKey: qk.cities, queryFn: listCities, staleTime: 10 * 60 * 1000 });
  const params = { city };
  const detail = useQuery({ queryKey: qk.title(kind, titleId, { ...params, admin: true }), queryFn: () => getTitle(kind, titleId, params), enabled: !!titleId });
  const refresh = () => qc.invalidateQueries({ queryKey: ['title', kind, titleId] });

  const ownIds = useMemo(() => new Set(adminVenues.map((v) => v.id)), [adminVenues]);
  const canManage = (venueId) => role === 'admin' || ownIds.has(venueId);

  const act = useMutation({
    mutationFn: ({ type, show }) => (type === 'delete' ? deleteShow(show.id) : updateShow(show.id, { status: 'cancelled' })),
    onSuccess: (_, { type }) => { toast.success(type === 'delete' ? 'Show deleted.' : 'Show deactivated. Existing bookings will be refunded.'); setConfirm(null); refresh(); },
    onError: (e) => { setConfirm(null); toast.error(errorMessage(e)); },
  });

  const venues = detail.data?.showsByVenue || [];
  return (
    <>
      <PageHeader title="Shows" description="Pick a title to see and manage its showtimes." actions={titleId && <Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" aria-hidden="true" /> Add show</Button>} />
      <div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <SelectField label="Type" value={kind} onChange={(e) => { setKind(e.target.value); setTitleId(''); }}><option value="movie">Movie</option><option value="event">Event</option></SelectField>
        <TextField label="Find title" type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Start typing" />
        <SelectField label="Title" value={titleId} onChange={(e) => setTitleId(e.target.value)}>
          <option value="">{titles.isLoading ? 'Loading…' : 'Choose a title'}</option>{(titles.data?.items || []).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </SelectField>
        <SelectField label="City" value={city} onChange={(e) => setCity(e.target.value)}><option value="">All cities</option>{(cities.data?.items || []).map((c) => <option key={c.name}>{c.name}</option>)}</SelectField>
      </div>

      <div className="mt-5 space-y-4">
        {!titleId && <EmptyState icon={CalendarClock} title="Choose a title">Its showtimes will appear here.</EmptyState>}
        {titleId && detail.isLoading && <Skeleton className="h-40" />}
        {detail.isError && <ErrorState error={detail.error} onRetry={detail.refetch} />}
        {titleId && detail.data && venues.length === 0 && <EmptyState icon={CalendarClock} title="No upcoming shows" action={<Button onClick={() => setAdding(true)}>Add show</Button>}>This title has no shows{city ? ` in ${city}` : ''} yet.</EmptyState>}
        {venues.map(({ venue, shows }) => (
          <section key={venue.id} className="card overflow-x-auto" aria-label={venue.name}>
            <h2 className="border-b border-ink-100 px-4 py-3 font-semibold">{venue.name} <span className="text-sm font-normal text-ink-500">{venue.city}</span></h2>
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="text-xs text-ink-500"><tr><th className="px-4 py-2 font-semibold">Start</th><th className="px-4 py-2 font-semibold">Screen</th><th className="px-4 py-2 font-semibold">Status</th><th className="px-4 py-2"><span className="sr-only">Actions</span></th></tr></thead>
              <tbody className="divide-y divide-ink-100">
                {shows.map((s) => {
                  const av = AVAILABILITY[s.availability] || AVAILABILITY.AVAILABLE;
                  const own = canManage(venue.id);
                  return (
                    <tr key={s.id}>
                      <td className="px-4 py-3 font-medium">{formatDateTime(s.startTime)}</td>
                      <td className="px-4 py-3 text-ink-600">{[s.screenName, s.format].filter(Boolean).join(', ')}</td>
                      <td className="px-4 py-3"><Badge tone={s.status === 'cancelled' ? 'danger' : av.tone}>{s.status === 'cancelled' ? 'Deactivated' : av.label}</Badge></td>
                      <td className="px-4 py-3">
                        {own ? (
                          <div className="flex justify-end gap-1.5">
                            <Button size="sm" variant="secondary" onClick={() => setEditing(s)}>Change time</Button>
                            <Button size="sm" variant="secondary" onClick={() => setConfirm({ type: 'deactivate', show: s })} disabled={s.status === 'cancelled'}>Deactivate</Button>
                            <Button size="sm" variant="dangerOutline" onClick={() => setConfirm({ type: 'delete', show: s })}>Delete</Button>
                          </div>
                        ) : <p className="text-right text-xs text-ink-400">Not your venue</p>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        ))}
      </div>

      {titleId && <AddShowModal open={adding} onClose={() => setAdding(false)} titleId={titleId} venues={adminVenues} onDone={refresh} />}
      {editing && <RescheduleModal show={editing} onClose={() => setEditing(null)} onDone={refresh} />}
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => act.mutate(confirm)} loading={act.isPending} danger
        title={confirm?.type === 'delete' ? 'Delete this show?' : 'Deactivate this show?'}
        confirmLabel={confirm?.type === 'delete' ? 'Delete show' : 'Deactivate show'} cancelLabel="Keep show">
        {confirm?.type === 'delete'
          ? <>This permanently removes the {confirm && formatDateTime(confirm.show.startTime)} show. Shows that already have bookings can't be deleted. Deactivate them instead.</>
          : <>Patrons can no longer book this show and <b>every existing booking will be refunded</b>. This can't be undone.</>}
      </ConfirmDialog>
    </>
  );
}
