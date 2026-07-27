export default function RefundPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Cancellation & Refund Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: July 2026 · Demo document</p>
      <div className="mt-8 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Eligibility</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Refund eligibility depends on the event-specific policy shown on each event page. Most
            events allow cancellations up to 48 hours before the show for a partial refund.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Processing time</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Refunds are processed to the original payment method within 7–10 business days. Demo
            payments are not refunded as no real money was charged.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Non-refundable cases</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            No refunds are available for cancellations within 48 hours of the event, for no-shows,
            or for events marked as non-refundable.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold">How to cancel</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Visit your dashboard, open the booking and request a cancellation. The system will
            calculate any applicable refund automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
