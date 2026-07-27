import { type ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  hint?: string;
  accent?: 'primary' | 'accent' | 'success' | 'warning' | 'destructive';
}

const accentClasses: Record<string, string> = {
  primary: 'text-primary',
  accent: 'text-accent',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  destructive: 'text-destructive',
};

export function StatCard({ label, value, icon, hint, accent = 'primary' }: StatCardProps) {
  return (
    <Card className="border-border/60 bg-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {icon && <div className={cn('opacity-80', accentClasses[accent])}>{icon}</div>}
      </div>
    </Card>
  );
}
