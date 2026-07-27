import { useAuth } from '@/hooks/use-auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

export default function DebugPage() {
  const { loading, user, role, profile } = useAuth();

  const rows: { label: string; value: string | boolean; badge?: string }[] = [
    { label: 'Application loaded', value: 'Yes' },
    { label: 'React mounted', value: 'Yes' },
    { label: 'Current route', value: window.location.pathname },
    { label: 'Environment mode', value: import.meta.env.MODE },
    { label: 'Supabase configured', value: isSupabaseConfigured, badge: isSupabaseConfigured ? 'Yes' : 'No' },
    { label: 'VITE_SUPABASE_URL', value: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing' },
    { label: 'VITE_SUPABASE_ANON_KEY', value: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing' },
    { label: 'Browser WebGL support', value: hasWebGL(), badge: hasWebGL() ? 'Yes' : 'No' },
    { label: 'Auth loading state', value: loading ? 'Loading' : 'Idle' },
    { label: 'Current user', value: user?.email ?? 'Not signed in' },
    { label: 'Current role', value: role ?? 'None' },
    { label: 'Profile name', value: profile?.full_name ?? 'None' },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-2 text-2xl font-bold">Diagnostics</h1>
      <p className="mb-6 text-sm text-muted-foreground">Runtime status of the SeatSphere application.</p>
      <Card className="bg-card p-6">
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
              <span className="text-sm text-muted-foreground">{r.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{String(r.value)}</span>
                {r.badge && (
                  <Badge variant={r.badge === 'Yes' || r.badge === 'Set' ? 'secondary' : 'destructive'}>
                    {r.badge}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
