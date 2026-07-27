import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/common/stat-card';
import { formatINR } from '@/lib/format';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function AdminReports() {
  const { data: report } = useQuery({
    queryKey: ['admin-report'],
    queryFn: async () => {
      const [events, bookings, seats, tickets] = await Promise.all([
        supabase.from('events').select('id, title, category').eq('is_published', true),
        supabase.from('bookings').select('total_amount, booking_status, event_id').eq('booking_status', 'confirmed'),
        supabase.from('event_seats').select('status, category_name'),
        supabase.from('tickets').select('ticket_status'),
      ]);

      const eventRows = events.data ?? [];
      const bookingRows = bookings.data ?? [];
      const seatRows = seats.data ?? [];
      const ticketRows = tickets.data ?? [];

      const totalRevenue = bookingRows.reduce((s, b) => s + Number(b.total_amount), 0);
      const confirmedCount = bookingRows.length;
      const availableSeats = seatRows.filter((s) => s.status === 'available').length;
      const bookedSeats = seatRows.filter((s) => s.status === 'booked').length;
      const checkedIn = ticketRows.filter((t) => t.ticket_status === 'used').length;

      // bookings by event
      const byEvent = new Map<string, { title: string; count: number; revenue: number }>();
      for (const b of bookingRows) {
        const ev = eventRows.find((e) => e.id === b.event_id);
        const key = b.event_id;
        if (!byEvent.has(key)) byEvent.set(key, { title: ev?.title ?? 'Unknown', count: 0, revenue: 0 });
        const entry = byEvent.get(key)!;
        entry.count += 1;
        entry.revenue += Number(b.total_amount);
      }
      const eventChart = Array.from(byEvent.values()).slice(0, 6);

      // seats by category
      const byCategory = new Map<string, number>();
      for (const s of seatRows) {
        byCategory.set(s.category_name, (byCategory.get(s.category_name) ?? 0) + 1);
      }
      const categoryChart = Array.from(byCategory.entries()).map(([name, value]) => ({ name, value }));

      return {
        totalRevenue,
        confirmedCount,
        availableSeats,
        bookedSeats,
        checkedIn,
        totalTickets: ticketRows.length,
        eventChart,
        categoryChart,
      };
    },
  });

  return (
    <AdminLayout title="Reports">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={report ? formatINR(report.totalRevenue) : '—'} accent="primary" />
        <StatCard label="Confirmed Bookings" value={report?.confirmedCount ?? '—'} accent="success" />
        <StatCard label="Booked Seats" value={report?.bookedSeats ?? '—'} accent="accent" />
        <StatCard label="Checked In" value={report?.checkedIn ?? '—'} accent="warning" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="bg-card p-6">
          <h2 className="mb-4 text-lg font-bold">Revenue by event</h2>
          {report && report.eventChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={report.eventChart}>
                <XAxis dataKey="title" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ background: '#1e1b2e', border: '1px solid #312e4a', borderRadius: 8 }}
                  formatter={(v: number) => formatINR(v)}
                />
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          )}
        </Card>

        <Card className="bg-card p-6">
          <h2 className="mb-4 text-lg font-bold">Seats by category</h2>
          {report && report.categoryChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={report.categoryChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {report.categoryChart.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e1b2e', border: '1px solid #312e4a', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
