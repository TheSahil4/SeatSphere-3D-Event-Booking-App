import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Loader2, Shield, Briefcase, ScanLine } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import type { Role } from '@/types/database';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

interface PortalLoginProps {
  role: Role;
  title: string;
  subtitle: string;
  redirectPath: string;
  loginPath: string;
  icon: ReactNode;
  accent: string;
  demoEmail: string;
}

export function PortalLogin({
  role, title, subtitle, redirectPath, loginPath, icon, demoEmail,
}: PortalLoginProps) {
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? redirectPath;
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;
      await refreshProfile();
      toast.success('Signed in');
      navigate(from, { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md bg-card p-8">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              {icon}
            </div>
            <span className="text-xl font-bold">Seat<span className="gradient-text">Sphere</span></span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <Input type="email" {...register('email')} placeholder="you@example.com" />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <Input type="password" {...register('password')} placeholder="••••••••" />
            {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" disabled={loading} className="w-full gradient-primary">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <div className="mt-6 rounded-lg border border-border bg-secondary/50 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Demo {role} account</p>
          <p className="mt-1">Email: {demoEmail}</p>
          <p>Password: Demo@12345</p>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/login" className="hover:text-foreground">Customer login</Link>
          {' · '}
          <Link to="/admin/login" className="hover:text-foreground">Admin</Link>
          {' · '}
          <Link to="/manager/login" className="hover:text-foreground">Manager</Link>
          {' · '}
          <Link to="/staff/login" className="hover:text-foreground">Gate Staff</Link>
        </p>
      </Card>
    </div>
  );
}

export default PortalLogin;
