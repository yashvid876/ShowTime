import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cancelBooking, getRefundEstimate } from '@/api/bookings.api';
import { qk } from '@/api/queryKeys';
import { errorMessage } from '@/api/errors';
import { toast } from '@/store/toastStore';
import { Alert, Button, ErrorState, Modal, Skeleton } from '@/components/ui';
import { bookingShow, formatDateTime, formatMoney, isPast } from '@/utils/format';

/** Shows the server-computed refund (GET refund-estimate) before cancelling (POST cancel). */
export function CancelBookingDialog({ booking, open, onClose, onCancelled }) {
  const qc = useQueryClient();
  const est = useQuery({ queryKey: qk.refundEstimate(booking.id), queryFn: () => getRefundEstimate(booking.id), enabled: open, staleTime: 0, gcTime: 0 });
  const m = useMutation({
    mutationFn: () => cancelBooking(booking.id),
    onSuccess: (res) => {
      const amt = res?.refundEstimate?.refundAmount ?? res?.refundEstimate ?? est.data?.refundAmount;
      toast.success(typeof amt === 'number' && amt > 0 ? `Booking cancelled. ${formatMoney(amt)} will be refunded in 5–7 business days.` : 'Booking cancelled.');
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: qk.booking(booking.id) });
      onCancelled?.();
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const closed = est.data && isPast(est.data.cutoffAt);
  const { title, startTime } = bookingShow(booking);
  return (
    <Modal
      open={open}
      onClose={m.isPending ? undefined : onClose}
      title="Cancel this booking?"
      size="sm"
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={m.isPending}>Keep booking</Button>
        <Button variant="danger" onClick={() => m.mutate()} loading={m.isPending} disabled={!est.data || closed}>Cancel booking</Button>
      </>}
    >
      <p className="text-sm text-ink-700"><b>{title}</b>{startTime ? `, ${formatDateTime(startTime)}` : ''}</p>
      <div className="mt-4">
        {est.isLoading && <Skeleton className="h-24" />}
        {est.isError && <ErrorState error={est.error} onRetry={est.refetch} title="Couldn't calculate your refund" />}
        {est.data && (
          <>
            <dl className="rounded-lg bg-ink-50 p-4 text-sm">
              <div className="flex justify-between"><dt className="text-ink-600">Refund</dt><dd className="font-display text-xl font-bold">{formatMoney(est.data.refundAmount)}</dd></div>
              <div className="mt-1 flex justify-between"><dt className="text-ink-600">Share of total</dt><dd className="font-medium">{est.data.percent}%</dd></div>
              <div className="mt-1 flex justify-between"><dt className="text-ink-600">Cancel by</dt><dd className="font-medium">{formatDateTime(est.data.cutoffAt)}</dd></div>
            </dl>
            {closed
              ? <Alert tone="error" className="mt-3">The cancellation window has closed for this show.</Alert>
              : <p className="mt-3 text-xs text-ink-500">Your seats are released immediately. Refunds go back to your original payment method in 5–7 business days.</p>}
            {!closed && est.data.percent === 0 && <Alert tone="warn" className="mt-3">This cancellation is not eligible for a refund.</Alert>}
          </>
        )}
      </div>
    </Modal>
  );
}
