import { Ticket, Boxes, ShieldCheck, Users } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">About SeatSphere</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        SeatSphere is a 3D event seat booking and venue management platform. We help guests choose
        the perfect seat by letting them preview the stage from any section — and we help organisers
        run events safely with real-time seat control and gate check-in.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {[
          { icon: Boxes, title: '3D venue preview', text: 'Explore the venue and preview your view before booking.' },
          { icon: Ticket, title: 'Instant seat holds', text: 'Hold seats for 8 minutes while you check out — no double bookings.' },
          { icon: ShieldCheck, title: 'Safety first', text: 'Emergency exits and facilities mapped on every venue.' },
          { icon: Users, title: 'For organisers', text: 'Admin, manager and gate staff portals for smooth operations.' },
        ].map((f, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-6">
            <f.icon className="mb-3 h-6 w-6 text-primary" />
            <h3 className="font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </div>
      <p className="mt-10 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-300">
        SeatSphere is a demo platform. All events, venues, artists and bookings are sample data.
      </p>
    </div>
  );
}
