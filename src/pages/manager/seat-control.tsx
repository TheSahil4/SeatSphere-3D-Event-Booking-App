import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Ban, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { ManagerLayout } from '@/components/layout/manager-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/empty-state';
import { toast } from 'sonner';
import { formatINR } from '@/lib/format';
import type { Event, EventSeatWithSeat } from '@/types/database';

export default function ManagerSeatControl() {
  const { user } = useAuth();
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  const { data: assignments } = useQuery({
    queryKey: ['manager-events-seat', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('event_managers')
        .select('event:events(*)')
        .eq('manager_id', user!.id)
        .eq('is_active', true);
      return (data ?? []).map((d) => d.event as unknown as Event);
    },
    enabled: !!user?.id,
  });

  const activeEventId = selectedEventId || assignments?.[0]?.id || '';

  const { data: seats, refetch } = useQuery({
    queryKey: ['manager-event-seats', activeEventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_seats')
        .select('*, venue_seat:venue_seats(label)')
        .eq('event_id', activeEventId)
        .order('price');
      if (error) throw error;
      return data as EventSeatWithSeat[];
    },
    enabled: !!activeEventId,
  });

  const blockMutation = useMutation({
    mutationFn: async ({ seatId, action }: { seatId: string; action: 'block' | 'release' }) => {
      const fn = action === 'block' ? 'manager_block_seat' : 'manager_release_seat';
      const { error } = await supabase.rpc(fn, {
        p_event_seat_id: seatId,
        p_reason: action === 'block' ? 'Blocked by manager' : null,
      });
      if (error) throw error;
    },
    onSuccess: () => { refetch(); toast.success('Seat updated'); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed'),
  });

  return (
    <ManagerLayout title="Seat Control">
      {assignments && assignments.length > 0 && (
        <div className="mb-4">
          <select
            value={activeEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {assignments.map((e) => (
              <option key={e.id} value={e.id} className="bg-card">{e.title}</option>
            ))}
          </select>
        </div>
      )}

      {!activeEventId ? (
        <EmptyState title="No events assigned" description="You need an assigned event to control seats." />
      ) : !seats || seats.length === 0 ? (
        <EmptyState title="No seats for this event" />
      ) : (
        <Card className="bg-card p-4">
          <div className="max-h-[60vh] space-y-2 overflow-y-auto scrollbar-thin">
            {seats.slice(0, 200).map((s) => (
              <div key={s.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                <div>
                  <p className="text-sm font-medium">
                    {s.venue_seat?.label} · {s.category_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatINR(Number(s.price))}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      s.status === 'available' ? 'secondary' :
                      s.status === 'booked' ? 'default' :
                      s.status === 'blocked' ? 'destructive' : 'outline'
                    }
                  >
                    {s.status}
                  </Badge>
                  {s.status === 'available' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => blockMutation.mutate({ seatId: s.id, action: 'block' })}
                      disabled={blockMutation.isPending}
                    >
                      <Ban className="mr-1 h-3 w-3" /> Block
                    </Button>
                  ) : s.status === 'blocked' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => blockMutation.mutate({ seatId: s.id, action: 'release' })}
                      disabled={blockMutation.isPending}
                    >
                      <Check className="mr-1 h-3 w-3" /> Release
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </ManagerLayout>
  );
}
