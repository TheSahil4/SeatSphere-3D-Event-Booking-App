import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, ScanLine, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/empty-state';
import { formatDate } from '@/lib/format';
import type { TicketScan, Ticket, BookingSeat, EventSeat, VenueSeat } from '@/types/database';

export default function StaffHistory() {
  const { user } = useAuth();

  const { data: scans } = useQuery({
    queryKey: ['staff-scans', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_scans')
        .select('*, ticket:tickets(*, booking_seat:booking_seats(*, event_seat:event_seats(*, venue_seat:venue_seats(label))))')
        .order('scanned_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as (TicketScan & {
        ticket: Ticket & {
          booking_seat: BookingSeat & {
            event_seat: EventSeat & { venue_seat: VenueSeat };
          };
        };
      })[];
    },
    enabled: !!user?.id,
  });

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/staff"><ArrowLeft className="mr-1 h-4 w-4" /> Scanner</Link>
          </Button>
          <h1 className="flex items-center gap-2 text-lg font-bold">
            <ScanLine className="h-5 w-5 text-primary" /> Scan History
          </h1>
        </div>

        {!scans || scans.length === 0 ? (
          <EmptyState title="No scans yet" description="Validated tickets will appear here." />
        ) : (
          <div className="space-y-3">
            {scans.map((s) => (
              <Card key={s.id} className="flex items-center gap-3 bg-card p-4">
                {s.scan_result === 'valid' ? (
                  <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-emerald-400" />
                ) : s.scan_result === 'already_used' ? (
                  <AlertTriangle className="h-6 w-6 flex-shrink-0 text-amber-400" />
                ) : (
                  <XCircle className="h-6 w-6 flex-shrink-0 text-destructive" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold capitalize">{s.scan_result}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.ticket?.booking_seat?.event_seat?.venue_seat?.label ?? '—'} · {formatDate(s.scanned_at)}
                  </p>
                </div>
                <Badge variant="outline">{s.gate_name ?? '—'}</Badge>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
