import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, UserCog, Copy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/empty-state';
import { toast } from 'sonner';
import type { Profile, EventManager, Event } from '@/types/database';

export default function AdminManagers() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);

  const { data: managers, refetch } = useQuery({
    queryKey: ['admin-managers-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['manager', 'gate_staff'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: events } = useQuery({
    queryKey: ['admin-events-for-assign'],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('id, title').eq('is_published', true);
      if (error) throw error;
      return data as Pick<Event, 'id' | 'title'>[];
    },
  });

  const createAccount = async () => {
    if (!email || !password || !fullName) {
      toast.error('Name, email and password are required');
      return;
    }
    setCreating(true);
    try {
      // Call the edge function to create the auth user
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-staff-account`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ email, password, fullName, phone, role: 'manager' }),
      });
      const result = await res.json();
      if (!res.ok || !result.ok) throw new Error(result.error || 'Failed to create account');
      toast.success('Manager account created');
      setEmail(''); setFullName(''); setPhone(''); setPassword('');
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create account');
    } finally {
      setCreating(false);
    }
  };

  return (
    <AdminLayout title="Managers & Staff">
      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <Card className="bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <UserCog className="h-5 w-5" /> Create manager account
          </h2>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Full name</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Manager name" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="manager@example.com" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Temporary password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 chars" />
            </div>
            <Button onClick={createAccount} disabled={creating} className="w-full gradient-primary">
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {creating ? 'Creating…' : 'Create account'}
            </Button>
            <p className="text-xs text-muted-foreground">
              The manager must change their password on first login.
            </p>
          </div>
        </Card>

        <div>
          <h2 className="mb-4 text-lg font-bold">Existing accounts</h2>
          {!managers || managers.length === 0 ? (
            <EmptyState title="No managers or staff yet" description="Create one using the form." />
          ) : (
            <div className="space-y-3">
              {managers.map((m) => (
                <Card key={m.id} className="flex items-center justify-between bg-card p-4">
                  <div>
                    <p className="font-semibold">{m.full_name}</p>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={m.role === 'manager' ? 'default' : 'secondary'}>{m.role}</Badge>
                    <Badge variant={m.is_active ? 'secondary' : 'destructive'}>
                      {m.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { navigator.clipboard.writeText(m.id); toast.success('ID copied'); }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
