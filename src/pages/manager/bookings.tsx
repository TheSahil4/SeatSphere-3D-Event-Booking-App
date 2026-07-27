import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { ManagerLayout } from '@/components/layout/manager-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/empty-state';
import { formatINR, formatDate } from '@/lib/format';
import type { Booking, Event } from '@/types/database';

export default function ManagerBookings() {
  const { user } = useAuth();

  const { data: assignments } = useQuery({
    queryKey: ['manager-assign-ids', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('event_managers')
        .select('event_id')
        .eq('manager_id', user!.id)
        .eq('is_active', true);
      return (data ?? []).map((d) => d.event_id as string);
    },
    enabled: !!user?.id,
  });

  const { data: bookings } = useQuery({
    queryKey: ['manager-bookings', assignments],
    queryFn: async () => {
      if (!assignments || assignments.length === 0) return [];
      const { data, error } = await supabase
        .from('bookings')
        .select('*, event:events(*)')
        .in('event_id', assignments)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as (Booking & { event: Event })[];
    },
    enabled: !!assignments && assignments.length > 0,
  });

  return (
    <ManagerLayout title="Bookings">
      {!bookings || bookings.length === 0 ? (
        <EmptyState title="No bookings for your events" />
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id} className="flex items-center justify-between bg-card p-4">
              <div>
                <p className="text-sm font-semibold">{b.event.title}</p>
                <p className="text-xs text-muted-foreground">{b.booking_reference} · {formatDate(b.created_at)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold">{formatINR(Number(b.total_amount))}</span>
                <Badge variant={b.booking_status === 'confirmed' ? 'secondary' : 'destructive'}>
                  {b.booking_status}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </ManagerLayout>
  );
}
