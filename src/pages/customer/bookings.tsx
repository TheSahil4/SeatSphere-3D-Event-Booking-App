import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { formatDate, formatINR } from '@/lib/format';
import type { Booking, Event } from '@/types/database';

export default function CustomerBookings() {
  const { user } = useAuth();

  const { data: bookings } = useQuery({
    queryKey: ['my-bookings-full', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, event:events(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as (Booking & { event: Event })[];
    },
    enabled: !!user?.id,
  });

  return (
    <DashboardLayout title="Bookings">
      {!bookings || bookings.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          description="Browse events and book your first seat."
          action={<Button asChild><Link to="/events">Browse events</Link></Button>}
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id} className="bg-card p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{b.event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.booking_reference} · {formatDate(b.event.event_date)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">{formatINR(Number(b.total_amount))}</span>
                  <Badge variant={b.booking_status === 'confirmed' ? 'secondary' : 'destructive'}>
                    {b.booking_status}
                  </Badge>
                  {b.booking_status === 'confirmed' && (
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/booking/${b.id}/confirmed`}>View tickets</Link>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
