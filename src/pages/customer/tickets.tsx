import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { useEffect, useRef } from 'react';
import { Ticket, Download, Copy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/empty-state';
import { formatDate, formatTime } from '@/lib/format';
import { toast } from 'sonner';
import type { Ticket as TicketType, Booking, Event } from '@/types/database';

export default function CustomerTickets() {
  const { user } = useAuth();
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  const { data: tickets } = useQuery({
    queryKey: ['my-tickets-full', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, booking:bookings(*, event:events(*))')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as (TicketType & { booking: Booking & { event: Event } })[];
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!tickets) return;
    for (const t of tickets) {
      const canvas = canvasRefs.current[t.id];
      if (canvas && t.qr_token) {
        QRCode.toCanvas(canvas, t.qr_token, { width: 120, margin: 1 });
      }
    }
  }, [tickets]);

  const download = (t: TicketType) => {
    const canvas = canvasRefs.current[t.id];
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `ticket-${t.ticket_number}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <DashboardLayout title="Tickets">
      {!tickets || tickets.length === 0 ? (
        <EmptyState title="No tickets yet" description="Your tickets will appear here after booking." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tickets.map((t) => (
            <Card key={t.id} className="flex bg-card p-4">
              <div className="mr-4">
                <canvas ref={(el) => { canvasRefs.current[t.id] = el; }} className="rounded-lg" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{t.booking.event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(t.booking.event.event_date)} · {formatTime(t.booking.event.start_time)}
                    </p>
                  </div>
                  <Badge variant={t.ticket_status === 'active' ? 'secondary' : 'destructive'}>
                    {t.ticket_status}
                  </Badge>
                </div>
                <p className="mt-2 font-mono text-xs">{t.ticket_number}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => download(t)}>
                    <Download className="mr-1 h-3 w-3" /> QR
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(t.ticket_number); toast.success('Copied'); }}>
                    <Copy className="mr-1 h-3 w-3" /> Copy
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
