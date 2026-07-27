import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const schema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  phone: z.string().optional(),
  city: z.string().optional(),
  date_of_birth: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  accessibility_preferences: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function CustomerProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name,
        phone: profile.phone ?? '',
        city: profile.city ?? '',
        date_of_birth: profile.date_of_birth ?? '',
        emergency_contact_name: profile.emergency_contact_name ?? '',
        emergency_contact_phone: profile.emergency_contact_phone ?? '',
        accessibility_preferences: profile.accessibility_preferences ?? '',
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone || null,
          city: data.city || null,
          date_of_birth: data.date_of_birth || null,
          emergency_contact_name: data.emergency_contact_name || null,
          emergency_contact_phone: data.emergency_contact_phone || null,
          accessibility_preferences: data.accessibility_preferences || null,
        })
        .eq('id', user!.id);
      if (error) throw error;
      await refreshProfile();
      toast.success('Profile updated');
    } catch {
      toast.error('Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Profile">
      <Card className="max-w-2xl bg-card p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold">Personal information</h2>
          <p className="text-sm text-muted-foreground">Update your details and emergency contacts.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Full name</label>
              <Input {...register('full_name')} />
              {errors.full_name && <p className="mt-1 text-xs text-destructive">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <Input value={profile?.email ?? ''} disabled />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Phone</label>
              <Input {...register('phone')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">City</label>
              <Input {...register('city')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Date of birth</label>
              <Input type="date" {...register('date_of_birth')} />
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <h3 className="mb-3 text-sm font-semibold">Emergency contact</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Name</label>
                <Input {...register('emergency_contact_name')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Phone</label>
                <Input {...register('emergency_contact_phone')} />
              </div>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Accessibility preferences</label>
            <Textarea {...register('accessibility_preferences')} rows={3} placeholder="e.g. wheelchair access, step-free seating" />
          </div>
          <Button type="submit" disabled={saving} className="gradient-primary">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Card>
    </DashboardLayout>
  );
}
