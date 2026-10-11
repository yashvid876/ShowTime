import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { saveRefundPolicy } from '@/api/admin.api';
import { errorMessage } from '@/api/errors';
import { toast } from '@/store/toastStore';
import { Alert, Button, TextField } from '@/components/ui';

const Schema = z.object({
  cutoffHours: z.coerce.number({ invalid_type_error: 'Enter hours' }).min(0, 'Cannot be negative').max(720),
  refundTiers: z.array(z.object({
    hoursBefore: z.coerce.number({ invalid_type_error: 'Enter hours' }).min(0, 'Cannot be negative'),
    percent: z.coerce.number({ invalid_type_error: 'Enter a percent' }).int('Whole numbers only').min(0, '0–100').max(100, '0–100'),
  })).min(1, 'Add at least one refund tier'),
});

// Contract §4 suggested defaults: >24h = 100%, 2–24h = 50%, <2h = not cancellable.
const DEFAULTS = { cutoffHours: 2, refundTiers: [{ hoursBefore: 24, percent: 100 }, { hoursBefore: 2, percent: 50 }] };

export function RefundPolicyForm({ venue }) {
  const [problem, setProblem] = useState(null);
  const initial = venue.refundPolicy ? { cutoffHours: venue.refundPolicy.cutoffHours, refundTiers: venue.refundPolicy.refundTiers } : DEFAULTS;
  const { register, control, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(Schema), defaultValues: initial });
  const { fields, append, remove } = useFieldArray({ control, name: 'refundTiers' });
  const m = useMutation({
    mutationFn: (body) => saveRefundPolicy(venue.id, { cutoffHours: body.cutoffHours, refundTiers: [...body.refundTiers].sort((a, b) => b.hoursBefore - a.hoursBefore) }),
    onSuccess: () => toast.success('Refund policy saved.'),
    onError: (e) => setProblem(errorMessage(e)),
  });
  return (
    <form onSubmit={handleSubmit((v) => { setProblem(null); m.mutate(v); })} className="card space-y-5 p-5" noValidate>
      <div>
        <h3 className="text-lg font-semibold">Cancellation &amp; refund policy</h3>
        <p className="mt-1 text-sm text-ink-500">Applies to every show at {venue.name}. Saving replaces the current policy.</p>
      </div>
      <TextField label="Cancellation cut-off (hours before show)" type="number" min={0} className="max-w-xs" hint="Patrons can't cancel inside this window." error={errors.cutoffHours?.message} {...register('cutoffHours')} />
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-800">Refund tiers</legend>
        <p className="mb-3 text-xs text-ink-500">Each tier applies when a patron cancels at least this many hours before the show.</p>
        <ul className="space-y-3">
          {fields.map((f, i) => (
            <li key={f.id} className="flex flex-wrap items-start gap-3">
              <TextField label="At least (hours before)" type="number" min={0} className="w-44" error={errors.refundTiers?.[i]?.hoursBefore?.message} {...register(`refundTiers.${i}.hoursBefore`)} />
              <TextField label="Refund (%)" type="number" min={0} max={100} className="w-32" error={errors.refundTiers?.[i]?.percent?.message} {...register(`refundTiers.${i}.percent`)} />
              <Button variant="ghost" size="sm" className="mt-7" onClick={() => remove(i)} aria-label={`Remove tier ${i + 1}`} disabled={fields.length === 1}><Trash2 className="h-4 w-4" aria-hidden="true" /></Button>
            </li>
          ))}
        </ul>
        {errors.refundTiers?.message && <p role="alert" className="mt-2 text-xs font-medium text-danger-700">{errors.refundTiers.message}</p>}
        <Button variant="secondary" size="sm" className="mt-3" onClick={() => append({ hoursBefore: 0, percent: 0 })}><Plus className="h-4 w-4" aria-hidden="true" /> Add tier</Button>
      </fieldset>
      {problem && <Alert tone="error">{problem}</Alert>}
      <Button type="submit" loading={m.isPending}>Save policy</Button>
    </form>
  );
}
