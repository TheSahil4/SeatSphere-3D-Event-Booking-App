import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Eye, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/empty-state';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';
import type { Event } from '@/types/database';

export default function AdminEvents() {
  const { data: events, refetch } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*, venue:venues(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as (Event & { venue: { name: string } | null })[];
    },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase
        .from('events')
        .update({ is_published: published, status: published ? 'booking_open' : 'draft' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { refetch(); toast.success('Event updated'); },
  });

  return (
    <AdminLayout title="Events">
      <div className="mb-4 flex justify-end">
        <Button asChild><Link to="/admin/events/new"><Plus className="mr-1 h-4 w-4" /> Create event</Link></Button>
      </div>
      {!events || events.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Create your first event to get started."
          action={<Button asChild><Link to="/admin/events/new">Create event</Link></Button>}
        />
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <Card key={e.id} className="flex items-center justify-between bg-card p-4">
              <div className="flex items-center gap-4">
                {e.thumbnail_url && (
                  <img src={e.thumbnail_url} alt="" className="h-12 w-16 rounded object-cover" />
                )}
                <div>
                  <p className="font-semibold">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.venue?.name ?? 'No venue'} · {formatDate(e.event_date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={e.is_published ? 'secondary' : 'outline'}>
                  {e.is_published ? 'Published' : 'Draft'}
                </Badge>
                <Button size="sm" variant="ghost" asChild>
                  <Link to={`/events/${e.slug}`} target="_blank"><Eye className="h-4 w-4" /></Link>
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <Link to={`/admin/events/${e.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => togglePublish.mutate({ id: e.id, published: !e.is_published })}
                >
                  {e.is_published ? 'Unpublish' : 'Publish'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
