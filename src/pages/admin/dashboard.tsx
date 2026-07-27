import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, Building2, Users, BookOpen, IndianRupee, Ticket, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/layout/admin-layout';
import { StatCard } from '@/components/common/stat-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatINR } from '@/lib/format';
import type { Booking, Event } from '@/types/database';

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [events, venues, managers, customers, bookings, confirmedBookings, revenue, tickets, checkedIn] = await Promise.all([
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('venues').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'manager'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('booking_status', 'confirmed'),
        supabase.from('bookings').select('total_amount').eq('booking_status', 'confirmed').eq('payment_status', 'paid'),
        supabase.from('tickets').select('*', { count: 'exact', head: true }),
        supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('ticket_status', 'used'),
      ]);
      const totalRevenue = (revenue.data ?? []).reduce((s, b) => s + Number(b.total_amount), 0);
      return {
        events: events.count ?? 0,
        venues: venues.count ?? 0,
        managers: managers.count ?? 0,
        customers: customers.count ?? 0,
        bookings: bookings.count ?? 0,
        confirmedBookings: confirmedBookings.count ?? 0,
        revenue: totalRevenue,
        tickets: tickets.count ?? 0,
        checkedIn: checkedIn.count ?? 0,
      };
    },
  });

  const { data: recentBookings } = useQuery({
    queryKey: ['admin-recent-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, event:events(*)')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as (Booking & { event: Event })[];
    },
  });

  return (
    <AdminLayout title="Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Events" value={stats?.events ?? '—'} icon={<Calendar className="h-5 w-5" />} />
        <StatCard label="Venues" value={stats?.venues ?? '—'} icon={<Building2 className="h-5 w-5" />} accent="accent" />
        <StatCard label="Managers" value={stats?.managers ?? '—'} icon={<Users className="h-5 w-5" />} accent="success" />
        <StatCard label="Customers" value={stats?.customers ?? '—'} icon={<Users className="h-5 w-5" />} accent="warning" />
        <StatCard label="Total Bookings" value={stats?.bookings ?? '—'} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label="Confirmed" value={stats?.confirmedBookings ?? '—'} icon={<CheckCircle2 className="h-5 w-5" />} accent="success" />
        <StatCard label="Revenue" value={stats ? formatINR(stats.revenue) : '—'} icon={<IndianRupee className="h-5 w-5" />} accent="primary" />
        <StatCard label="Checked In" value={stats?.checkedIn ?? '—'} icon={<Ticket className="h-5 w-5" />} accent="accent" />
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Recent bookings</h2>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/bookings">View all</Link>
          </Button>
        </div>
        <Card className="bg-card p-4">
          {!recentBookings || recentBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bookings yet.</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
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
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-bold">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button asChild><Link to="/admin/events/new">Create event</Link></Button>
          <Button asChild variant="outline"><Link to="/admin/venues">Manage venues</Link></Button>
          <Button asChild variant="outline"><Link to="/admin/managers">Create manager</Link></Button>
        </div>
      </div>
    </AdminLayout>
  );
}
