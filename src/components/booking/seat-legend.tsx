import { cn } from '@/lib/utils';

const legend = [
  { label: 'Available', color: 'bg-emerald-500' },
  { label: 'Selected', color: 'bg-cyan-400' },
  { label: 'Held', color: 'bg-amber-500' },
  { label: 'Booked', color: 'bg-slate-600' },
  { label: 'Reserved', color: 'bg-violet-500' },
  { label: 'Blocked', color: 'bg-red-500' },
  { label: 'Accessible', color: 'bg-blue-500' },
  { label: 'Limited view', color: 'bg-orange-500' },
];

export function SeatLegend({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      {legend.map((l) => (
        <div key={l.label} className="flex items-center gap-1.5">
          <span className={cn('h-3 w-3 rounded', l.color)} />
          <span className="text-xs text-muted-foreground">{l.label}</span>
        </div>
      ))}
    </div>
  );
}
