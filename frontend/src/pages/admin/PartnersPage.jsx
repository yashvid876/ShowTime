import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Check, UserPlus } from 'lucide-react';
import { createPartner, updatePartnerVenues } from '@/api/admin.api';
import { errorMessage } from '@/api/errors';
import { useAdminVenues } from '@/features/auth/useAdminVenues';
import { toast } from '@/store/toastStore';
import { normalizePhone } from '@/utils/format';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { VenueChecklist } from '@/components/admin/VenueChecklist';
import { Alert, Button, PageHeader, TextField } from '@/components/ui';

const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v);

function CreatePartner({ venues }) {
  const [f, setF] = useState({ name: '', email: '', phone: '' });
  const [venueIds, setVenueIds] = useState([]);
  const [created, setCreated] = useState(null);
  const [problem, setProblem] = useState(null);
  const phone = normalizePhone(f.phone);
  const valid = f.name.trim().length > 1 && isEmail(f.email) && /^\+?[1-9]\d{9,14}$/.test(phone);
  const m = useMutation({
    mutationFn: () => createPartner({ name: f.name.trim(), email: f.email.trim(), phone, venueIds }),
    onSuccess: (p) => { setCreated(p); setF({ name: '', email: '', phone: '' }); setVenueIds([]); toast.success('Partner account created.'); },
    onError: (e) => setProblem(e.code === 'CONFLICT' ? 'A user with this email or phone already exists.' : errorMessage(e)),
  });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); setProblem(null); setCreated(null); m.mutate(); }} className="card space-y-4 p-5" noValidate>
      <h2 className="text-lg font-semibold">Onboard a venue partner</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label="Name" required value={f.name} onChange={set('name')} />
        <TextField label="Email" type="email" required value={f.email} onChange={set('email')} />
        <TextField label="Phone" type="tel" required value={f.phone} onChange={set('phone')} placeholder="9999999999" />
      </div>
      <VenueChecklist venues={venues} value={venueIds} onChange={setVenueIds} legend="Assign venues" />
      {problem && <Alert tone="error">{problem}</Alert>}
      {created && <Alert tone="success" title="Partner created">{created.name || 'The partner'} can now manage the assigned venues. Partner ID: <code className="select-all rounded bg-white px-1.5 py-0.5 font-mono text-xs">{created.id}</code></Alert>}
      <Button type="submit" disabled={!valid} loading={m.isPending}><UserPlus className="h-4 w-4" aria-hidden="true" /> Create partner</Button>
    </form>
  );
}

function AssignVenues({ venues }) {
  const [partnerId, setPartnerId] = useState('');
  const [venueIds, setVenueIds] = useState([]);
  const [problem, setProblem] = useState(null);
  const valid = /^[a-f0-9]{24}$/i.test(partnerId);
  const m = useMutation({
    mutationFn: () => updatePartnerVenues(partnerId, venueIds),
    onSuccess: () => toast.success('Venue assignments updated.'),
    onError: (e) => setProblem(e.code === 'NOT_FOUND' ? 'No partner found with that ID.' : errorMessage(e)),
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); setProblem(null); m.mutate(); }} className="card space-y-4 p-5" noValidate>
      <div>
        <h2 className="text-lg font-semibold">Change a partner's venues</h2>
        <p className="mt-1 text-sm text-ink-500">The selection below replaces the partner's current assignments.</p>
      </div>
      <TextField label="Partner ID" className="max-w-md" value={partnerId} onChange={(e) => setPartnerId(e.target.value.trim())} placeholder="24-character partner ID" error={partnerId && !valid ? 'Partner IDs are 24 characters' : undefined} />
      <VenueChecklist venues={venues} value={venueIds} onChange={setVenueIds} legend="Assigned venues" />
      {problem && <Alert tone="error">{problem}</Alert>}
      <Button type="submit" variant="secondary" disabled={!valid} loading={m.isPending}><Check className="h-4 w-4" aria-hidden="true" /> Update assignments</Button>
    </form>
  );
}

export default function PartnersPage() {
  useDocumentTitle('Partners');
  const { venues } = useAdminVenues();
  return (
    <>
      <PageHeader title="Venue partners" description="Create partner accounts and control which venues they can manage." />
      <div className="space-y-6"><CreatePartner venues={venues} /><AssignVenues venues={venues} /></div>
    </>
  );
}
