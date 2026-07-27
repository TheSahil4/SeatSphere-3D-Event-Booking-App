import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/empty-state';
import { formatINR, formatDate } from '@/lib/format';
import type { Booking, Event } from '@/types/database';

export default function AdminBookings() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: bookings } = useQuery({
    queryKey: ['admin-all-bookings', search, statusFilter],
    queryFn: async () => {
      let q = supabase
        .from('bookings')
        .select('*, event:events(*)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (statusFilter) q = q.eq('booking_status', statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      let rows = data as (Booking & { event: Event })[];
      if (search.trim()) {
        const s = search.toLowerCase();
        rows = rows.filter(
          (b) => b.booking_reference.toLowerCase().includes(s) || b.event.title.toLowerCase().includes(s)
        );
      }
      return rows;
    },
  });

  return (
    <AdminLayout title="Bookings">
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by reference or event"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="" className="bg-card">All statuses</option>
          <option value="confirmed" className="bg-card">Confirmed</option>
          <option value="pending" className="bg-card">Pending</option>
          <option value="cancelled" className="bg-card">Cancelled</option>
          <option value="refunded" className="bg-card">Refunded</option>
        </select>
      </div>

      {!bookings || bookings.length === 0 ? (
        <EmptyState title="No bookings found" />
      ) : (
        <Card className="bg-card p-4">
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-semibold">{b.event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.booking_reference} · {formatDate(b.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">{formatINR(Number(b.total_amount))}</span>
                  <Badge variant={b.booking_status === 'confirmed' ? 'secondary' : 'destructive'}>
                    {b.booking_status}
                  </Badge>
                  <Badge variant="outline">{b.payment_status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </AdminLayout>
  );
}
