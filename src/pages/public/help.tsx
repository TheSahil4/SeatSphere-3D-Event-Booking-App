import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  { q: 'How do I book a seat?', a: 'Open any event, click "Book Seats", explore the 3D venue map, pick your seats and complete checkout. Your seats are held for 8 minutes while you pay.' },
  { q: 'Can I see the view from my seat?', a: 'Yes. On the booking page, click any section to preview the stage view. Seats with limited views are clearly marked.' },
  { q: 'How long is my seat held?', a: 'Seats are held for 8 minutes once you select them. If you do not complete checkout in time, the seats are released automatically.' },
  { q: 'Can I cancel my booking?', a: 'Cancellation depends on the event policy, shown on the event page. Most events allow cancellation up to 48 hours before the show.' },
  { q: 'How do I get my ticket?', a: 'After payment, a QR ticket is generated for each seat. You can view and download it from your dashboard.' },
  { q: 'Can I pre-order food?', a: 'Yes. On the event page or during checkout, browse the food menu, add items and pick a collection time. Collect using your QR code at the stall.' },
  { q: 'Is SeatSphere a real platform?', a: 'No — SeatSphere is a demo. All events, venues, prices and bookings are sample data. Payments are simulated.' },
];

export default function HelpPage() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Help & FAQ</h1>
      <p className="mt-2 text-muted-foreground">Answers to common questions about SeatSphere.</p>
      <div className="mt-8 space-y-3">
        {faqs.map((f, i) => (
          <div key={i} className="rounded-xl border border-border bg-card">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between p-5 text-left"
            >
              <span className="font-medium">{f.q}</span>
              <ChevronDown className={cn('h-5 w-5 text-muted-foreground transition-transform', open === i && 'rotate-180')} />
            </button>
            {open === i && (
              <p className="px-5 pb-5 text-sm text-muted-foreground">{f.a}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
