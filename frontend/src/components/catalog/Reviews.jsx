import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import { createReview, listReviews } from '@/api/reviews.api';
import { qk } from '@/api/queryKeys';
import { errorMessage } from '@/api/errors';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { Alert, Button, EmptyState, ErrorState, Pagination, Skeleton, StarInput, Stars, TextAreaField } from '@/components/ui';
import { formatDate } from '@/utils/format';

function ReviewForm({ kind, titleId }) {
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [problem, setProblem] = useState(null);
  const m = useMutation({
    mutationFn: () => createReview({ movieEventId: titleId, rating, ...(comment.trim() ? { comment: comment.trim() } : {}) }),
    onSuccess: () => {
      toast.success('Thanks — your review is published.');
      setRating(0); setComment(''); setProblem(null);
      qc.invalidateQueries({ queryKey: ['reviews', kind, titleId] });
      qc.invalidateQueries({ queryKey: ['title', kind, titleId] });
    },
    onError: (e) => setProblem(
      e.code === 'CONFLICT' ? 'You have already reviewed this title.'
        : e.code === 'FORBIDDEN' ? 'You can review after attending a show you booked for this title.'
          : errorMessage(e)),
  });
  const submit = (e) => {
    e.preventDefault();
    if (!rating) { setProblem('Choose a star rating first.'); return; }
    setProblem(null);
    m.mutate();
  };
  return (
    <form onSubmit={submit} className="card mb-6 space-y-4 p-4 sm:p-5" noValidate>
      <div>
        <h3 className="font-semibold">Rate and review</h3>
        <p className="text-sm text-ink-500">Available once you have attended a show you booked for this title.</p>
      </div>
      <StarInput value={rating} onChange={setRating} />
      <TextAreaField label="Your review (optional)" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} rows={3} hint={`${comment.length}/1000`} />
      {problem && <Alert tone="error">{problem}</Alert>}
      <Button type="submit" loading={m.isPending}>Post review</Button>
    </form>
  );
}

export function ReviewsSection({ kind, titleId }) {
  const user = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const limit = 5;
  const q = useQuery({ queryKey: qk.reviews(kind, titleId, page), queryFn: () => listReviews(kind, titleId, { page, limit }), placeholderData: (p) => p });
  return (
    <section aria-labelledby="reviews-heading" className="mt-12">
      <div className="mb-4 flex items-end justify-between">
        <h2 id="reviews-heading" className="text-xl font-bold sm:text-2xl">Ratings &amp; reviews</h2>
        {q.data?.total > 0 && <div className="flex items-center gap-2 text-sm"><Stars value={q.data.avgRating} /><span className="font-semibold">{Number(q.data.avgRating).toFixed(1)}</span><span className="text-ink-500">({q.data.total})</span></div>}
      </div>
      {user?.role === 'patron' && <ReviewForm kind={kind} titleId={titleId} />}
      {!user && <Alert className="mb-6">Want to leave a review? <Link to={`/login?next=${encodeURIComponent(`/${kind}s/${titleId}`)}`} className="font-semibold text-brand-700 underline">Log in</Link> after you have attended a show.</Alert>}
      {q.isLoading && <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-24" />)}</div>}
      {q.isError && <ErrorState error={q.error} onRetry={q.refetch} title="Couldn't load reviews" />}
      {q.data && q.data.items.length === 0 && <EmptyState icon={MessageSquare} title="No reviews yet">Be the first to share what you thought after you've seen it.</EmptyState>}
      {q.data && q.data.items.length > 0 && (
        <>
          <ul className="space-y-3">
            {q.data.items.map((r) => (
              <li key={r.id} className="card p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{r.userName || r.user?.name || 'Verified patron'}</p>
                  <time className="text-xs text-ink-500" dateTime={r.createdAt}>{formatDate(r.createdAt)}</time>
                </div>
                <div className="mt-1"><Stars value={r.rating} /></div>
                {r.comment && <p className="mt-2 text-sm text-ink-700">{r.comment}</p>}
              </li>
            ))}
          </ul>
          <Pagination page={page} total={q.data.total} limit={limit} onChange={setPage} />
        </>
      )}
    </section>
  );
}
