import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const FAQ = [
  ['How do I book tickets?', <>Pick a movie or event, choose a date and show, select your seats on the map and continue. You'll need to be logged in to confirm seats. Pay with UPI, credit or debit card and your QR ticket appears right away.</>],
  ['How long are my seats held?', <>Once you continue to checkout your seats are held for a few minutes. A countdown shows exactly how long is left. If it runs out before you pay, the seats are released for others and you can pick again.</>],
  ['What if the seat I wanted was just taken?', <>Seat availability updates live. If someone else gets a seat first, you'll see a message and can choose a different one. Seats are never queued.</>],
  ['How many seats can I book at once?', <>Up to 10 seats per booking.</>],
  ["I paid but I don't see my ticket", <>Confirmation comes from the payment provider and normally takes a few seconds. If it takes longer, check <Link to="/my-bookings" className="font-semibold text-brand-700 underline">My bookings</Link>. A confirmation is also sent by email and SMS. If a payment fails, your seats are released and you won't be charged for them.</>],
  ['How do I cancel a booking?', <>Open <Link to="/my-bookings" className="font-semibold text-brand-700 underline">My bookings</Link>, choose Cancel on an upcoming booking and review the refund shown. Cancellation is only possible until the venue's cut-off time before the show.</>],
  ['When will I get my refund?', <>Refunds are sent to your original payment method within 5–7 business days of cancelling. The amount depends on the venue's cancellation policy and is shown before you confirm.</>],
  ['How do I get an invoice?', <>Open the booking in My bookings and choose Download invoice.</>],
  ['Why is my account locked?', <>After 5 failed log-in attempts the account is locked for 15 minutes. You can also reset your password from the log-in page.</>],
  ['Can I review a movie or event?', <>Yes, once you've attended a show you booked. Open the title's page and add your rating.</>],
];

export default function HelpPage() {
  useDocumentTitle('Help & support');
  return (
    <div className="container-page max-w-3xl py-8">
      <PageHeader title="Help & support" description="Booking, cancellation and refund questions." />
      <div className="card divide-y divide-ink-100">
        {FAQ.map(([q, a]) => (
          <details key={q} className="group p-4 sm:p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold marker:hidden">
              {q}<span className="text-ink-400 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-ink-700">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
