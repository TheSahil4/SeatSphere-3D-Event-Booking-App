function LegalPage({ title, sections }: { title: string; sections: { h: string; p: string }[] }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: July 2026 · Demo document</p>
      <div className="mt-8 space-y-6">
        {sections.map((s, i) => (
          <div key={i}>
            <h2 className="text-lg font-semibold">{s.h}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.p}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      sections={[
        { h: 'Acceptance of terms', p: 'By using SeatSphere you agree to these terms. SeatSphere is a demo platform and does not process real payments or real bookings.' },
        { h: 'Bookings', p: 'Bookings are made on a first-come, first-served basis. Seats are held temporarily during checkout and confirmed only after payment.' },
        { h: 'Cancellation', p: 'Cancellation and refund eligibility depends on the event policy. Please review the policy on each event page before booking.' },
        { h: 'Conduct', p: 'You agree to provide accurate information and not misuse the platform. The venue reserves the right to refuse entry.' },
        { h: 'Liability', p: 'SeatSphere is provided "as is" without warranties. We are not liable for event cancellations or changes by organisers.' },
      ]}
    />
  );
}
