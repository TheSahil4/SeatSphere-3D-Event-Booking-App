import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { slugify } from '@/lib/format';

const schema = z.object({
  title: z.string().min(3, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  short_description: z.string().optional(),
  event_date: z.string().min(1, 'Date is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().optional(),
  gate_open_time: z.string().optional(),
  venue_id: z.string().min(1, 'Select a venue'),
  capacity_limit: z.coerce.number().min(1, 'Capacity must be at least 1'),
  minimum_ticket_price: z.coerce.number().min(0),
  maximum_ticket_price: z.coerce.number().min(0),
  language: z.string().optional(),
  age_restriction: z.string().optional(),
  duration_minutes: z.coerce.number().optional(),
  banner_url: z.string().optional(),
  cancellation_policy: z.string().optional(),
  refund_policy: z.string().optional(),
  terms_and_conditions: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function AdminEventEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'Concerts', language: 'English', start_time: '19:00' },
  });

  const { data: venues } = useQuery({
    queryKey: ['admin-venues-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('venues').select('id, name').eq('is_active', true);
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  // load existing event for editing
  useQuery({
    queryKey: ['admin-event-edit', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
      if (data) {
        Object.entries(data).forEach(([k, v]) => {
          if (k === 'event_date' && v) setValue(k, String(v).slice(0, 10));
          else if (typeof v === 'number') setValue(k as keyof FormData, v as never);
          else if (typeof v === 'string') setValue(k as keyof FormData, v as never);
        });
      }
      return data;
    },
    enabled: !!id,
  });

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        slug: slugify(data.title) + '-' + Math.random().toString(36).slice(2, 6),
        status: 'draft',
        is_published: false,
        is_featured: false,
        created_by: user?.id,
        description: data.description || null,
        short_description: data.short_description || null,
        end_time: data.end_time || null,
        gate_open_time: data.gate_open_time || null,
        language: data.language || 'English',
        age_restriction: data.age_restriction || null,
        duration_minutes: data.duration_minutes || null,
        banner_url: data.banner_url || null,
        cancellation_policy: data.cancellation_policy || null,
        refund_policy: data.refund_policy || null,
        terms_and_conditions: data.terms_and_conditions || null,
      };

      if (id) {
        const { error } = await supabase.from('events').update(payload).eq('id', id);
        if (error) throw error;
        toast.success('Event updated');
      } else {
        const { error } = await supabase.from('events').insert(payload);
        if (error) throw error;
        toast.success('Event created as draft');
      }
      navigate('/admin/events');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title={id ? 'Edit event' : 'New event'}>
      <Card className="max-w-3xl bg-card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <Input {...register('title')} placeholder="Event title" />
            {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Category</label>
              <select {...register('category')} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                {['Concerts', 'Theatre', 'Stand-up Comedy', 'Sports', 'College Events', 'Conferences', 'Festivals', 'Esports'].map((c) => (
                  <option key={c} value={c} className="bg-card">{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Venue</label>
              <select {...register('venue_id')} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="" className="bg-card">Select…</option>
                {venues?.map((v) => (
                  <option key={v.id} value={v.id} className="bg-card">{v.name}</option>
                ))}
              </select>
              {errors.venue_id && <p className="mt-1 text-xs text-destructive">{errors.venue_id.message}</p>}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Short description</label>
            <Input {...register('short_description')} placeholder="One-line summary" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <Textarea {...register('description')} rows={4} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Date</label>
              <Input type="date" {...register('event_date')} />
              {errors.event_date && <p className="mt-1 text-xs text-destructive">{errors.event_date.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Start time</label>
              <Input type="time" {...register('start_time')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">End time</label>
              <Input type="time" {...register('end_time')} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Gate open time</label>
              <Input type="time" {...register('gate_open_time')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Capacity</label>
              <Input type="number" {...register('capacity_limit')} />
              {errors.capacity_limit && <p className="mt-1 text-xs text-destructive">{errors.capacity_limit.message}</p>}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Min ticket price (₹)</label>
              <Input type="number" step="0.01" {...register('minimum_ticket_price')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Max ticket price (₹)</label>
              <Input type="number" step="0.01" {...register('maximum_ticket_price')} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Language</label>
              <Input {...register('language')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Age restriction</label>
              <Input {...register('age_restriction')} placeholder="e.g. 16+" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Duration (mins)</label>
              <Input type="number" {...register('duration_minutes')} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Banner image URL</label>
            <Input {...register('banner_url')} placeholder="https://…" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Cancellation policy</label>
            <Textarea {...register('cancellation_policy')} rows={2} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Refund policy</label>
            <Textarea {...register('refund_policy')} rows={2} />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={saving} className="gradient-primary">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? 'Saving…' : id ? 'Update event' : 'Create event'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/admin/events')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </AdminLayout>
  );
}
