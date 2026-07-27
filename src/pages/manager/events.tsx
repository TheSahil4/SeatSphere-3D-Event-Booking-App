import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { ManagerLayout } from '@/components/layout/manager-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/empty-state';
import { formatDate, formatTime, formatINR } from '@/lib/format';
import type { Event } from '@/types/database';

export default function ManagerEvents() {
  const { user } = useAuth();

  const { data: assignments } = useQuery({
    queryKey: ['manager-events', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_managers')
        .select('*, event:events(*)')
        .eq('manager_id', user!.id)
        .eq('is_active', true);
      if (error) throw error;
      return data as { id: string; is_primary_manager: boolean; event: Event }[];
    },
    enabled: !!user?.id,
  });

  return (
    <ManagerLayout title="My Events">
      {!assignments || assignments.length === 0 ? (
        <EmptyState title="No events assigned" description="Your assigned events will appear here." />
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <Card key={a.id} className="bg-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{a.event.title}</p>
                    {a.is_primary_manager && <Badge variant="default">Primary</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(a.event.event_date)} · {formatTime(a.event.start_time)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatINR(a.event.minimum_ticket_price)} – {formatINR(a.event.maximum_ticket_price)}
                  </p>
                </div>
                <Badge variant={a.event.is_published ? 'secondary' : 'outline'}>
                  {a.event.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => window.open(`/events/${a.event.slug}`, '_blank')}
                  className="text-xs text-primary hover:underline"
                >
                  View public page
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </ManagerLayout>
  );
}
