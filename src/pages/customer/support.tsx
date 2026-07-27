import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/empty-state';
import { toast } from 'sonner';
import { formatDate } from '@/lib/format';
import type { SupportTicket } from '@/types/database';

const schema = z.object({
  subject: z.string().min(3, 'Subject is required'),
  category: z.string().min(1, 'Select a category'),
  description: z.string().min(10, 'Describe your issue'),
  priority: z.string().min(1, 'Select priority'),
});
type FormData = z.infer<typeof schema>;

export default function CustomerSupport() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { data: tickets, refetch } = useQuery({
    queryKey: ['my-support-tickets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SupportTicket[];
    },
    enabled: !!user?.id,
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from('support_tickets').insert({
        ticket_reference: 'SUP-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
        subject: data.subject,
        category: data.category,
        description: data.description,
        priority: data.priority,
        status: 'open',
      });
      if (error) throw error;
      toast.success('Support ticket created');
      reset();
      refetch();
    } catch {
      toast.error('Could not create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Support">
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div>
          <h2 className="mb-4 text-lg font-bold">Your tickets</h2>
          {!tickets || tickets.length === 0 ? (
            <EmptyState title="No support tickets" description="Need help? Create a ticket on the right." />
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <Card key={t.id} className="bg-card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{t.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.ticket_reference} · {formatDate(t.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{t.priority}</Badge>
                      <Badge variant={t.status === 'open' ? 'default' : 'outline'}>{t.status}</Badge>
                    </div>
                  </div>
                  {t.description && <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>}
                </Card>
              ))}
            </div>
          )}
        </div>
        <Card className="bg-card p-6">
          <h2 className="mb-4 text-lg font-bold">New ticket</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Subject</label>
              <Input {...register('subject')} />
              {errors.subject && <p className="mt-1 text-xs text-destructive">{errors.subject.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Category</label>
                <select {...register('category')} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                  <option value="" className="bg-card">Select…</option>
                  <option value="booking" className="bg-card">Booking</option>
                  <option value="payment" className="bg-card">Payment</option>
                  <option value="ticket" className="bg-card">Ticket</option>
                  <option value="food" className="bg-card">Food</option>
                  <option value="general" className="bg-card">General</option>
                </select>
                {errors.category && <p className="mt-1 text-xs text-destructive">{errors.category.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Priority</label>
                <select {...register('priority')} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                  <option value="" className="bg-card">Select…</option>
                  <option value="low" className="bg-card">Low</option>
                  <option value="medium" className="bg-card">Medium</option>
                  <option value="high" className="bg-card">High</option>
                  <option value="urgent" className="bg-card">Urgent</option>
                </select>
                {errors.priority && <p className="mt-1 text-xs text-destructive">{errors.priority.message}</p>}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <Textarea {...register('description')} rows={4} />
              {errors.description && <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>}
            </div>
            <Button type="submit" disabled={submitting} className="w-full gradient-primary">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? 'Creating…' : 'Create ticket'}
            </Button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
