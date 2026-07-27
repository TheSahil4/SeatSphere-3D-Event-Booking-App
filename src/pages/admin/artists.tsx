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
import { safeImageUrl } from '@/lib/media';
import type { Artist } from '@/types/database';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  biography: z.string().optional(),
  profile_image_url: z.string().optional(),
  cover_image_url: z.string().optional(),
  contact_email: z.string().optional(),
  contact_phone: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function AdminArtists() {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'Concerts' },
  });

  const { data: artists, refetch } = useQuery({
    queryKey: ['admin-artists'],
    queryFn: async () => {
      const { data, error } = await supabase.from('artists').select('*').order('name');
      if (error) throw error;
      return data as Artist[];
    },
  });

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('artists').insert({
        ...data,
        slug: slugify(data.name) + '-' + Math.random().toString(36).slice(2, 6),
        biography: data.biography || null,
        profile_image_url: data.profile_image_url || null,
        cover_image_url: data.cover_image_url || null,
        contact_email: data.contact_email || null,
        contact_phone: data.contact_phone || null,
        is_active: true,
      });
      if (error) throw error;
      toast.success('Artist created');
      reset();
      setShowForm(false);
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create artist');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Artists">
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="mr-1 h-4 w-4" /> {showForm ? 'Cancel' : 'Add artist'}
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
                <label className="mb-1 block text-sm font-medium">Category</label>
                <Input {...register('category')} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Biography</label>
              <Textarea {...register('biography')} rows={3} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Profile image URL</label>
                <Input {...register('profile_image_url')} placeholder="https://…" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Cover image URL</label>
                <Input {...register('cover_image_url')} placeholder="https://…" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Contact email</label>
                <Input type="email" {...register('contact_email')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Contact phone</label>
                <Input {...register('contact_phone')} />
              </div>
            </div>
            <Button type="submit" disabled={saving} className="gradient-primary">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? 'Saving…' : 'Create artist'}
            </Button>
          </form>
        </Card>
      )}

      {!artists || artists.length === 0 ? (
        <EmptyState title="No artists yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {artists.map((a) => (
            <Card key={a.id} className="overflow-hidden bg-card p-0">
              {safeImageUrl(a.profile_image_url) && (
                <img src={safeImageUrl(a.profile_image_url) ?? undefined} alt="" className="aspect-square w-full object-cover" />
              )}
              <div className="p-3">
                <p className="text-sm font-semibold">{a.name}</p>
                <Badge variant="secondary" className="mt-1 text-xs">{a.category}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
