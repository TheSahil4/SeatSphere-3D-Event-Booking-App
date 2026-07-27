import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/empty-state';
import { formatINR, formatDate } from '@/lib/format';
import type { FoodOrder, Event } from '@/types/database';

export default function CustomerFoodOrders() {
  const { user } = useAuth();

  const { data: orders } = useQuery({
    queryKey: ['my-food-orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_orders')
        .select('*, event:events(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as (FoodOrder & { event: Event })[];
    },
    enabled: !!user?.id,
  });

  return (
    <DashboardLayout title="Food Orders">
      {!orders || orders.length === 0 ? (
        <EmptyState title="No food orders yet" description="Pre-order food during checkout for your next event." />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Card key={o.id} className="flex items-center justify-between bg-card p-4">
              <div>
                <p className="font-semibold">{o.order_number}</p>
                <p className="text-xs text-muted-foreground">
                  {o.event.title} · {formatDate(o.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold">{formatINR(Number(o.total_amount))}</span>
                <Badge variant="secondary">{o.order_status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
