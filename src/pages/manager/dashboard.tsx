import { useQuery } from '@tanstack/react-query';
import { Calendar, Ticket, Users, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { ManagerLayout } from '@/components/layout/manager-layout';
import { StatCard } from '@/components/common/stat-card';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/empty-state';
import { formatDate, formatTime } from '@/lib/format';
import type { Event } from '@/types/database';

export default function ManagerDashboard() {
  const { user } = useAuth();

  const { data: assignments } = useQuery({
    queryKey: ['manager-assignments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_managers')
        .select('*, event:events(*)')
        .eq('manager_id', user!.id)
        .eq('is_active', true)
        .order('assigned_at', { ascending: false });
      if (error) throw error;
      return data as { id: string; event: Event }[];
    },
    enabled: !!user?.id,
  });

  const assignedEventIds = assignments?.map((a) => a.event.id) ?? [];

  const { data: seatStats } = useQuery({
    queryKey: ['manager-seat-stats', assignedEventIds],
    queryFn: async () => {
      if (assignedEventIds.length === 0) return { total: 0, booked: 0, available: 0 };
      const { data: seats } = await supabase
        .from('event_seats')
        .select('status')
        .in('event_id', assignedEventIds);
      const rows = seats ?? [];
      return {
        total: rows.length,
        booked: rows.filter((s) => s.status === 'booked').length,
        available: rows.filter((s) => s.status === 'available').length,
      };
    },
    enabled: assignedEventIds.length > 0,
  });

  const { data: checkIns } = useQuery({
    queryKey: ['manager-checkins', assignedEventIds],
    queryFn: async () => {
      if (assignedEventIds.length === 0) return 0;
      const { count } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .in('event_id', assignedEventIds)
        .eq('ticket_status', 'used');
      return count ?? 0;
    },
    enabled: assignedEventIds.length > 0,
  });

  const nearest = assignments?.find((a) => new Date(a.event.event_date) >= new Date());

  return (
    <ManagerLayout title="Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Assigned Events" value={assignments?.length ?? 0} icon={<Calendar className="h-5 w-5" />} />
        <StatCard label="Available Seats" value={seatStats?.available ?? 0} icon={<Ticket className="h-5 w-5" />} accent="success" />
        <StatCard label="Booked Seats" value={seatStats?.booked ?? 0} icon={<Users className="h-5 w-5" />} accent="accent" />
        <StatCard label="Checked In" value={checkIns ?? 0} icon={<Users className="h-5 w-5" />} accent="warning" />
      </div>

      {nearest && (
        <Card className="mt-6 bg-card p-5">
          <Badge className="mb-2 border-primary/30 bg-primary/10 text-primary">Next event</Badge>
          <h3 className="text-lg font-bold">{nearest.event.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(nearest.event.event_date)} · {formatTime(nearest.event.start_time)}
          </p>
        </Card>
      )}

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-bold">My assigned events</h2>
        {!assignments || assignments.length === 0 ? (
          <EmptyState title="No events assigned" description="Your assigned events will appear here." />
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => (
              <Card key={a.id} className="flex items-center justify-between bg-card p-4">
                <div>
                  <p className="font-semibold">{a.event.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(a.event.event_date)}</p>
                </div>
                <Badge variant={a.event.is_published ? 'secondary' : 'outline'}>
                  {a.event.status.replace(/_/g, ' ')}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}
