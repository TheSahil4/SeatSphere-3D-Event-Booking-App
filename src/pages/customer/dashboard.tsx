import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, Ticket, ShoppingBag, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StatCard } from '@/components/common/stat-card';
import { EmptyState } from '@/components/common/empty-state';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatTime, formatINR } from '@/lib/format';
import { safeImageUrl } from '@/lib/media';
import type { Booking, Event } from '@/types/database';

export default function CustomerDashboard() {
  const { user } = useAuth();

  const { data: bookings } = useQuery({
    queryKey: ['my-bookings', user?.id],
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

  const { data: tickets } = useQuery({
    queryKey: ['my-tickets', user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('ticket_status', 'active');
      return count ?? 0;
    },
    enabled: !!user?.id,
  });

  const { data: foodOrders } = useQuery({
    queryKey: ['my-food-orders-count', user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('food_orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);
      return count ?? 0;
    },
    enabled: !!user?.id,
  });

  const upcoming = bookings?.filter(
    (b) => b.booking_status === 'confirmed' && new Date(b.event.event_date) >= new Date()
  );
  const nearest = upcoming?.[0];

  return (
    <DashboardLayout title="Overview">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Upcoming Events" value={upcoming?.length ?? 0} icon={<Calendar className="h-5 w-5" />} />
        <StatCard label="Active Tickets" value={tickets ?? 0} icon={<Ticket className="h-5 w-5" />} accent="accent" />
        <StatCard label="Total Bookings" value={bookings?.length ?? 0} icon={<Clock className="h-5 w-5" />} accent="success" />
        <StatCard label="Food Orders" value={foodOrders ?? 0} icon={<ShoppingBag className="h-5 w-5" />} accent="warning" />
      </div>

      {nearest && (
        <Card className="mt-6 overflow-hidden bg-card p-0">
          <div className="flex flex-col sm:flex-row">
            {safeImageUrl(nearest.event.banner_url) && (
              <img src={safeImageUrl(nearest.event.banner_url) ?? undefined} alt="" className="h-40 w-full object-cover sm:w-48" />
            )}
            <div className="flex-1 p-5">
              <Badge className="mb-2 border-emerald-500/30 bg-emerald-500/10 text-emerald-400">Next event</Badge>
              <h3 className="text-lg font-bold">{nearest.event.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDate(nearest.event.event_date)} · {formatTime(nearest.event.start_time)}
              </p>
              <div className="mt-4 flex gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link to={`/booking/${nearest.id}/confirmed`}>View tickets</Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-bold">Recent bookings</h2>
        {!bookings || bookings.length === 0 ? (
          <EmptyState
            title="No bookings yet"
            description="Browse events and book your first seat."
            action={<Button asChild><Link to="/events">Browse events</Link></Button>}
          />
        ) : (
          <div className="space-y-3">
            {bookings.slice(0, 5).map((b) => (
              <Card key={b.id} className="flex items-center justify-between bg-card p-4">
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
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
