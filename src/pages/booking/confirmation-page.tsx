import { useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { Ticket, ArrowLeft, Download, Copy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/common/page-loader';
import { ErrorState } from '@/components/common/error-state';
import { formatDate, formatTime, formatINR } from '@/lib/format';
import { toast } from 'sonner';
import type { Booking, BookingSeat, Ticket as TicketType, Event, VenueSeat, VenueSection } from '@/types/database';

interface TicketRow {
  ticket: TicketType;
  booking_seat: BookingSeat & {
    event_seat: { venue_seat: VenueSeat; section: Pick<VenueSection, 'id' | 'name' | 'code'> };
  };
}

export default function BookingConfirmationPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, event:events(*, venue:venues(*))')
        .eq('id', bookingId)
        .maybeSingle();
      if (error) throw error;
      return data as Booking & { event: Event & { venue: { name: string; address: string; city: string } | null } };
    },
    enabled: !!bookingId,
  });

  const { data: tickets } = useQuery({
    queryKey: ['booking-tickets', bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, booking_seat:booking_seats(*, event_seat:event_seats(*, venue_seat:venue_seats(*)))')
        .eq('booking_id', bookingId!)
        .order('created_at');
      if (error) throw error;
      return data as TicketRow[];
    },
    enabled: !!bookingId,
  });

  // Generate QR codes
  useEffect(() => {
    if (!tickets) return;
    for (const t of tickets) {
      const canvas = canvasRefs.current[t.ticket.id];
      if (canvas && t.ticket.qr_token) {
        QRCode.toCanvas(canvas, t.ticket.qr_token, { width: 160, margin: 1 }, (err: Error | null | undefined) => {
          if (err) console.error('QR generation failed', err);
        });
      }
    }
  }, [tickets]);

  const downloadTicket = (ticket: TicketType) => {
    const canvas = canvasRefs.current[ticket.id];
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `seatsphere-${ticket.ticket_number}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const copyTicketNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    toast.success('Ticket number copied');
  };

  if (isLoading) return <PageLoader />;
  if (!booking) return <ErrorState title="Booking not found" />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/dashboard">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to dashboard
        </Link>
      </Button>

      <div className="mb-6">
        <Badge className="mb-2 border-emerald-500/30 bg-emerald-500/10 text-emerald-400">Confirmed</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Your tickets</h1>
        <p className="mt-1 text-muted-foreground">
          Booking ref: <span className="font-mono font-semibold text-foreground">{booking.booking_reference}</span> · {formatINR(Number(booking.total_amount))}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {tickets?.map((t) => {
          const seat = t.booking_seat;
          const eventSeat = seat.event_seat;
          const venueSeat = eventSeat?.venue_seat;
          return (
            <Card key={t.ticket.id} className="overflow-hidden bg-card p-0">
              <div className="flex">
                <div className="flex-shrink-0 border-r border-border bg-secondary/30 p-5">
                  <canvas
                    ref={(el) => { canvasRefs.current[t.ticket.id] = el; }}
                    className="rounded-lg"
                  />
                </div>
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Ticket</p>
                      <p className="font-mono text-sm font-semibold">{t.ticket.ticket_number}</p>
                    </div>
                    <Ticket className="h-5 w-5 text-primary" />
                  </div>
                  <div className="mt-4 space-y-1 text-sm">
                    <p className="font-semibold">{booking.event?.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(booking.event?.event_date ?? '')} · {formatTime(booking.event?.start_time ?? null)}
                    </p>
                    <p className="text-xs text-muted-foreground">{booking.event?.venue?.name}</p>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="secondary">Seat {venueSeat?.label}</Badge>
                      <Badge variant="outline">{seat.event_seat?.section?.name ?? 'Section'}</Badge>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => downloadTicket(t.ticket)}>
                      <Download className="mr-1 h-3.5 w-3.5" /> QR
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => copyTicketNumber(t.ticket.ticket_number)}>
                      <Copy className="mr-1 h-3.5 w-3.5" /> Copy
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 flex gap-3">
        <Button onClick={() => window.print()} variant="outline">Print all</Button>
        <Button asChild className="gradient-primary"><Link to="/dashboard">Go to dashboard</Link></Button>
      </div>
    </div>
  );
}
