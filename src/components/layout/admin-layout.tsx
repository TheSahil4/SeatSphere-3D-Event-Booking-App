import { type ReactNode } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Ticket, LayoutDashboard, Calendar, Building2, Users, UserCog, BookOpen, BarChart3, LogOut, Menu, X,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/events', label: 'Events', icon: Calendar },
  { to: '/admin/venues', label: 'Venues', icon: Building2 },
  { to: '/admin/artists', label: 'Artists', icon: Users },
  { to: '/admin/managers', label: 'Managers', icon: UserCog },
  { to: '/admin/bookings', label: 'Bookings', icon: BookOpen },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
];

export function AdminLayout({ children, title }: { children: ReactNode; title: string }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 flex-col border-r border-border bg-card/40 lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <Ticket className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <p className="px-3 text-sm font-medium">{profile?.full_name}</p>
          <p className="px-3 text-xs text-muted-foreground">{profile?.email}</p>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="mt-2 w-full justify-start">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-bold">{title}</h1>
          </div>
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-64 bg-card p-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-bold">Admin</span>
                <button onClick={() => setMobileOpen(false)}><X className="h-5 w-5" /></button>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                        isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                ))}
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="mt-4 w-full justify-start">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </Button>
              </nav>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
