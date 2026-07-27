import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, MapPin, Phone } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  email: z.string().email('Enter a valid email'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type FormData = z.infer<typeof schema>;

export default function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from('support_tickets').insert({
        ticket_reference: 'SUP-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
        subject: `Contact form: ${data.name}`,
        category: 'general',
        description: data.message,
        priority: 'medium',
        status: 'open',
      });
      if (error) throw error;
      toast.success('Message sent. We will get back to you soon.');
      reset();
    } catch (e) {
      toast.error('Could not send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Contact us</h1>
      <p className="mt-2 text-muted-foreground">Questions, feedback or need help? Send us a message.</p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Card className="bg-card p-4">
          <Mail className="mb-2 h-5 w-5 text-primary" />
          <p className="text-xs text-muted-foreground">Email</p>
          <p className="text-sm font-medium">hello@seatsphere.demo</p>
        </Card>
        <Card className="bg-card p-4">
          <Phone className="mb-2 h-5 w-5 text-primary" />
          <p className="text-xs text-muted-foreground">Phone</p>
          <p className="text-sm font-medium">555-0100 (demo)</p>
        </Card>
        <Card className="bg-card p-4">
          <MapPin className="mb-2 h-5 w-5 text-primary" />
          <p className="text-xs text-muted-foreground">Address</p>
          <p className="text-sm font-medium">Pune, India</p>
        </Card>
      </div>

      <Card className="mt-8 bg-card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <Input {...register('name')} placeholder="Your name" />
            {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <Input type="email" {...register('email')} placeholder="you@example.com" />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Message</label>
            <Textarea {...register('message')} rows={5} placeholder="How can we help?" />
            {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message.message}</p>}
          </div>
          <Button type="submit" disabled={submitting} className="gradient-primary">
            {submitting ? 'Sending…' : 'Send message'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
