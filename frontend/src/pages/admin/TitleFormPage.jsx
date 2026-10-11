import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ImagePlus } from 'lucide-react';
import { createTitle, updateTitle, uploadPoster } from '@/api/admin.api';
import { getTitle } from '@/api/catalog.api';
import { qk } from '@/api/queryKeys';
import { applyServerErrors, errorMessage } from '@/api/errors';
import { toast } from '@/store/toastStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Alert, Button, ErrorState, PageHeader, Poster, SelectField, Skeleton, TagInput, TextAreaField, TextField } from '@/components/ui';
import { FORMATS, GENRES, LANGUAGES } from '@/utils/constants';

const Schema = z.object({
  type: z.enum(['movie', 'event']),
  title: z.string().trim().min(1, 'Enter a title').max(150),
  genre: z.array(z.string()).min(1, 'Add at least one genre'),
  language: z.array(z.string()).min(1, 'Add at least one language'),
  duration: z.coerce.number({ invalid_type_error: 'Enter minutes' }).int('Whole minutes only').min(1, 'Enter the running time in minutes').max(1440),
  synopsis: z.string().trim().min(10, 'Write a short synopsis (at least 10 characters)'),
  format: z.array(z.string()).default([]),
  cast: z.array(z.string()).default([]),
}).refine((v) => v.type === 'event' || v.format.length > 0, { path: ['format'], message: 'Choose at least one format' });

const blank = (type) => ({ type, title: '', genre: [], language: [], duration: '', synopsis: '', format: [], cast: [] });

export default function TitleFormPage() {
  const { id } = useParams();
  const editing = !!id;
  const [params] = useSearchParams();
  const kindParam = params.get('type') === 'event' ? 'event' : 'movie';
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [posterUrl, setPosterUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [problem, setProblem] = useState(null);
  useDocumentTitle(editing ? 'Edit title' : 'Add title');

  const existing = useQuery({ queryKey: qk.title(kindParam, id, { admin: true }), queryFn: () => getTitle(kindParam, id), enabled: editing });
  const { register, control, handleSubmit, reset, watch, setError, formState: { errors } } = useForm({ resolver: zodResolver(Schema), defaultValues: blank(kindParam) });
  const type = watch('type');

  useEffect(() => {
    const t = existing.data?.movie || existing.data?.event;
    if (!t) return;
    reset({ type: kindParam, title: t.title || '', genre: t.genre || [], language: t.language || [], duration: t.duration || '', synopsis: t.synopsis || '', format: t.format || [], cast: t.cast || t.lineup || [] });
    setPosterUrl(t.posterUrl || '');
  }, [existing.data, kindParam, reset]);

  const save = useMutation({
    mutationFn: (v) => {
      const body = { type: v.type, title: v.title, genre: v.genre, language: v.language, duration: v.duration, synopsis: v.synopsis, format: v.type === 'movie' ? v.format : [], cast: v.cast, ...(posterUrl ? { posterUrl } : {}) };
      return editing ? updateTitle(id, body) : createTitle(body);
    },
    onSuccess: () => {
      toast.success(editing ? 'Changes saved.' : 'Title added to the catalog.');
      qc.invalidateQueries({ queryKey: ['titles'] });
      qc.invalidateQueries({ queryKey: ['title'] });
      navigate('/admin/catalog');
    },
    onError: (e) => { if (!applyServerErrors(e, setError)) setProblem(errorMessage(e)); },
  });

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Choose an image file (JPG, PNG or WebP).'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('The poster must be under 5 MB.'); return; }
    setUploading(true);
    try { setPosterUrl(await uploadPoster(file)); toast.success('Poster uploaded.'); } catch (err) { toast.error(errorMessage(err)); } finally { setUploading(false); }
  };

  if (editing && existing.isLoading) return <Skeleton className="h-96" />;
  if (editing && existing.isError) return <ErrorState error={existing.error} onRetry={existing.refetch} title="Couldn't load this title" />;

  return (
    <>
      <Link to="/admin/catalog" className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-ink-900"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Movies &amp; events</Link>
      <PageHeader title={editing ? 'Edit title' : 'Add a movie or event'} />
      <form onSubmit={handleSubmit((v) => { setProblem(null); save.mutate(v); })} noValidate className="grid gap-6 lg:grid-cols-3">
        <div className="card space-y-4 p-5 lg:col-span-2">
          <SelectField label="Type" disabled={editing} {...register('type')}><option value="movie">Movie</option><option value="event">Live event</option></SelectField>
          <TextField label="Title" required error={errors.title?.message} {...register('title')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller control={control} name="genre" render={({ field }) => <TagInput label="Genres" required suggestions={GENRES} value={field.value} onChange={field.onChange} placeholder="Type and press Enter" error={errors.genre?.message} />} />
            <Controller control={control} name="language" render={({ field }) => <TagInput label="Languages" required suggestions={LANGUAGES} value={field.value} onChange={field.onChange} placeholder="Type and press Enter" error={errors.language?.message} />} />
          </div>
          <TextField label="Duration (minutes)" type="number" min={1} required className="max-w-xs" error={errors.duration?.message} {...register('duration')} />
          <TextAreaField label="Synopsis" required rows={5} error={errors.synopsis?.message} {...register('synopsis')} />
          {type === 'movie' && (
            <Controller control={control} name="format" render={({ field }) => (
              <fieldset>
                <legend className="mb-1.5 text-sm font-medium text-ink-800">Formats <span className="text-danger-600" aria-hidden="true">*</span></legend>
                <div className="flex gap-2">
                  {FORMATS.map((f) => {
                    const on = field.value.includes(f);
                    return <button key={f} type="button" aria-pressed={on} onClick={() => field.onChange(on ? field.value.filter((x) => x !== f) : [...field.value, f])} className={`h-10 rounded-lg border px-4 text-sm font-semibold ${on ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-ink-300 bg-white hover:border-ink-400'}`}>{f}</button>;
                  })}
                </div>
                {errors.format?.message && <p role="alert" className="mt-1.5 text-xs font-medium text-danger-700">{errors.format.message}</p>}
              </fieldset>
            )} />
          )}
          <Controller control={control} name="cast" render={({ field }) => <TagInput label={type === 'movie' ? 'Cast' : 'Performers / line-up'} value={field.value} onChange={field.onChange} placeholder="Type a name and press Enter" />} />
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-3 font-semibold">Poster</h2>
            <Poster src={posterUrl} title={watch('title') || 'Poster'} className="aspect-[2/3] w-full rounded-lg" />
            <label className="mt-3 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-ink-300 bg-white text-sm font-semibold hover:bg-ink-50 focus-within:ring-2 focus-within:ring-brand-600">
              <ImagePlus className="h-4 w-4" aria-hidden="true" />{uploading ? 'Uploading…' : posterUrl ? 'Replace poster' : 'Upload poster'}
              <input type="file" accept="image/*" className="sr-only" onChange={onFile} disabled={uploading} />
            </label>
          </div>
          {problem && <Alert tone="error">{problem}</Alert>}
          <Button type="submit" size="lg" className="w-full" loading={save.isPending} disabled={uploading}>{editing ? 'Save changes' : 'Add to catalog'}</Button>
        </aside>
      </form>
    </>
  );
}
