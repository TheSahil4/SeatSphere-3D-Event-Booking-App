import { useQuery, useMutation } from '@tanstack/react-query';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/empty-state';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';
import type { Notification } from '@/types/database';

export default function CustomerNotifications() {
  const { user } = useAuth();

  const { data: notifications, refetch } = useQuery({
    queryKey: ['my-notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user?.id,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => refetch(),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user!.id)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => { refetch(); toast.success('All marked as read'); },
  });

  const unread = notifications?.filter((n) => !n.is_read).length ?? 0;

  return (
    <DashboardLayout title="Notifications">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{unread} unread</p>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
            <CheckCheck className="mr-1 h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>
      {!notifications || notifications.length === 0 ? (
        <EmptyState title="No notifications" description="You are all caught up." icon={<Bell className="h-7 w-7" />} />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`flex items-start gap-3 p-4 ${n.is_read ? 'bg-card' : 'bg-primary/5 border-primary/20'}`}
            >
              <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${n.is_read ? 'bg-secondary' : 'bg-primary/10 text-primary'}`}>
                <Bell className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(n.created_at)}</p>
              </div>
              {!n.is_read && (
                <Button variant="ghost" size="sm" onClick={() => markRead.mutate(n.id)}>
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
