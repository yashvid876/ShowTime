import { PageHeader } from '@/components/ui';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const DOCS = {
  terms: {
    title: 'Terms of service',
    sections: [
      ['Using ShowTime', 'ShowTime lets you browse movies and live events, select seats and book tickets. You can browse without an account; booking requires a verified account.'],
      ['Seat holds', 'When you continue to checkout, your seats are held for a limited time. If payment is not completed before the hold ends, the seats are released automatically.'],
      ['Payments', 'Payments are processed by our PCI-DSS compliant payment provider. ShowTime does not store card numbers, CVV or full payment credentials. A booking is confirmed only after the provider confirms your payment.'],
      ['Tickets', 'Each confirmed booking has a unique QR ticket. A ticket can be redeemed once at the venue and is only valid for the show, screen and venue printed on it.'],
      ['Cancellations and refunds', 'Cancellation and refund eligibility are set by each venue. See the Cancellation & refund policy.'],
      ['Your data', 'We collect only the information needed to run your account and bookings and handle it in line with applicable privacy regulations.'],
    ],
  },
  'refund-policy': {
    title: 'Cancellation & refund policy',
    sections: [
      ['Who sets the policy', 'Each venue configures its own cancellation window and refund percentages. ShowTime applies the venue\'s policy; it does not override it.'],
      ['How much you get back', 'Before you confirm a cancellation, we show the exact refund amount, the percentage of your total it represents and the last time you can cancel. Many venues refund more the earlier you cancel, and do not allow cancellation close to showtime.'],
      ['Cancelled shows', 'If a venue cancels a show, bookings for it are refunded.'],
      ['When refunds arrive', 'Refunds go back to your original payment method within 5–7 business days of cancelling.'],
      ['Seats', 'Cancelled seats are released immediately so others can book them.'],
    ],
  },
};

export default function LegalPage({ doc }) {
  const d = DOCS[doc];
  useDocumentTitle(d.title);
  return (
    <div className="container-page max-w-3xl py-8">
      <PageHeader title={d.title} />
      <div className="card space-y-6 p-5 sm:p-8">
        {d.sections.map(([h, p]) => (
          <section key={h}><h2 className="text-lg font-semibold">{h}</h2><p className="mt-1.5 max-w-prose text-sm leading-relaxed text-ink-700">{p}</p></section>
        ))}
      </div>
    </div>
  );
}
