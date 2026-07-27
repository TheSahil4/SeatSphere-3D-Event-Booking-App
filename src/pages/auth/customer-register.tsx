import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { Ticket, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

const schema = z.object({
  full_name: z.string().min(2, 'Please enter your name'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  city: z.string().optional(),
}).refine((d) => /[A-Z]/.test(d.password) && /[0-9]/.test(d.password), {
  message: 'Include at least one uppercase letter and one number',
  path: ['password'],
});
type FormData = z.infer<typeof schema>;

export default function CustomerRegister() {
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { full_name: data.full_name } },
      });
      if (error) throw error;
      if (res.user) {
        await supabase.from('profiles').upsert({
          id: res.user.id,
          full_name: data.full_name,
          email: data.email,
          role: 'customer',
          phone: data.phone ?? null,
          city: data.city ?? null,
        });
      }
      await refreshProfile();
      toast.success('Account created. Welcome to SeatSphere!');
      navigate('/dashboard', { replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md bg-card p-8">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <Ticket className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Seat<span className="gradient-text">Sphere</span></span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Book seats, manage tickets and pre-order food.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Full name</label>
            <Input {...register('full_name')} placeholder="Your name" />
            {errors.full_name && <p className="mt-1 text-xs text-destructive">{errors.full_name.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <Input type="email" {...register('email')} placeholder="you@example.com" />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Phone</label>
              <Input {...register('phone')} placeholder="Optional" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">City</label>
              <Input {...register('city')} placeholder="Optional" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <Input type="password" {...register('password')} placeholder="Min 6 chars, 1 uppercase, 1 number" />
            {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" disabled={loading} className="w-full gradient-primary">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? 'Creating…' : 'Create account'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
