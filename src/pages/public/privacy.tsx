import LegalPage from './terms';

export default function PrivacyPage() {
  return (
    <LegalPageWrapper
      title="Privacy Policy"
      sections={[
        { h: 'Information we collect', p: 'We collect the information you provide during registration and booking, including name, email and contact details.' },
        { h: 'How we use it', p: 'We use your information to process bookings, issue tickets and send event updates. We do not sell your data.' },
        { h: 'Security', p: 'Data is stored securely using Supabase with row-level security. Passwords are managed by Supabase Auth and never stored in plain text.' },
        { h: 'Your rights', p: 'You can request access to or deletion of your data at any time by contacting support.' },
        { h: 'Demo notice', p: 'SeatSphere is a demo. Do not enter real personal data. All data shown is sample data.' },
      ]}
    />
  );
}

function LegalPageWrapper({ title, sections }: { title: string; sections: { h: string; p: string }[] }) {
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
