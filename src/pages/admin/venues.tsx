import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/empty-state';
import { toast } from 'sonner';
import { slugify } from '@/lib/format';
import type { Venue } from '@/types/database';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  venue_type: z.string().min(1, 'Type is required'),
  address: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  total_capacity: z.coerce.number().min(1),
  parking_capacity: z.coerce.number().min(0),
  venue_image_url: z.string().optional(),
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function AdminVenues() {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { venue_type: 'arena', city: 'Pune', total_capacity: 1000, parking_capacity: 100 },
  });

  const { data: venues, refetch } = useQuery({
    queryKey: ['admin-venues'],
    queryFn: async () => {
      const { data, error } = await supabase.from('venues').select('*').order('name');
      if (error) throw error;
      return data as Venue[];
    },
  });

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('venues').insert({
        ...data,
        slug: slugify(data.name) + '-' + Math.random().toString(36).slice(2, 6),
        country: 'India',
        description: data.description || null,
        address: data.address || null,
        state: data.state || null,
        venue_image_url: data.venue_image_url || null,
        is_active: true,
      });
      if (error) throw error;
      toast.success('Venue created');
      reset();
      setShowForm(false);
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create venue');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Venues">
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="mr-1 h-4 w-4" /> {showForm ? 'Cancel' : 'Add venue'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6 max-w-2xl bg-card p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Name</label>
                <Input {...register('name')} />
                {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Type</label>
                <select {...register('venue_type')} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                  {['arena', 'theatre', 'stadium', 'auditorium', 'convention'].map((t) => (
                    <option key={t} value={t} className="bg-card">{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">City</label>
                <Input {...register('city')} />
                {errors.city && <p className="mt-1 text-xs text-destructive">{errors.city.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">State</label>
                <Input {...register('state')} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Address</label>
              <Input {...register('address')} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Total capacity</label>
                <Input type="number" {...register('total_capacity')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Parking capacity</label>
                <Input type="number" {...register('parking_capacity')} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Image URL</label>
              <Input {...register('venue_image_url')} placeholder="https://…" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <Textarea {...register('description')} rows={3} />
            </div>
            <Button type="submit" disabled={saving} className="gradient-primary">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? 'Saving…' : 'Create venue'}
            </Button>
          </form>
        </Card>
      )}

      {!venues || venues.length === 0 ? (
        <EmptyState title="No venues yet" description="Create your first venue." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((v) => (
            <Card key={v.id} className="overflow-hidden bg-card p-0">
              {v.venue_image_url && (
                <img src={v.venue_image_url} alt="" className="aspect-[16/9] w-full object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{v.name}</p>
                  <Badge variant={v.is_active ? 'secondary' : 'outline'}>
                    {v.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {v.city} · Capacity {v.total_capacity.toLocaleString('en-IN')}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
