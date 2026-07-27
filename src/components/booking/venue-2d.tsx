import { useMemo } from 'react';
import type { VenueSection, EventSeatWithSeat } from '@/types/database';
import { cn } from '@/lib/utils';

interface Venue2DProps {
  sections: VenueSection[];
  eventSeats: EventSeatWithSeat[];
  selectedSeatIds: string[];
  onSeatClick: (eventSeatId: string) => void;
}

const statusColors: Record<string, string> = {
  available: 'bg-emerald-500 hover:bg-emerald-400',
  held: 'bg-amber-500',
  booked: 'bg-slate-600 cursor-not-allowed',
  reserved: 'bg-violet-500 cursor-not-allowed',
  blocked: 'bg-red-500 cursor-not-allowed',
  unavailable: 'bg-slate-800 cursor-not-allowed',
};

export function Venue2D({ sections, eventSeats, selectedSeatIds, onSeatClick }: Venue2DProps) {
  const seatsBySection = useMemo(() => {
    const map = new Map<string, EventSeatWithSeat[]>();
    for (const s of eventSeats) {
      const sid = s.venue_seat?.section_id ?? '';
      if (!map.has(sid)) map.set(sid, []);
      map.get(sid)!.push(s);
    }
    return map;
  }, [eventSeats]);

  const rowsBySection = useMemo(() => {
    const map = new Map<string, Map<string, EventSeatWithSeat[]>>();
    for (const [secId, seats] of seatsBySection) {
      const rows = new Map<string, EventSeatWithSeat[]>();
      for (const s of seats) {
        const rid = s.venue_seat?.row_id ?? 'default';
        if (!rows.has(rid)) rows.set(rid, []);
        rows.get(rid)!.push(s);
      }
      map.set(secId, rows);
    }
    return map;
  }, [seatsBySection]);

  return (
    <div className="space-y-6">
      {/* Stage */}
      <div className="mx-auto w-full max-w-2xl rounded-xl bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 p-3 text-center text-sm font-semibold text-white">
        STAGE
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((section) => {
          const rows = rowsBySection.get(section.id);
          if (!rows || rows.size === 0) return null;
          return (
            <div
              key={section.id}
              className="rounded-xl border border-border bg-card p-4"
              style={{ borderColor: `${section.colour_code}40` }}
            >
              <p className="mb-3 text-sm font-semibold" style={{ color: section.colour_code }}>
                {section.name}
              </p>
              <div className="space-y-1.5">
                {Array.from(rows.entries()).map(([rowId, seats], ri) => (
                  <div key={rowId} className="flex items-center gap-1">
                    <span className="w-4 text-[10px] text-muted-foreground">
                      {String.fromCharCode(65 + ri)}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {seats.map((seat) => {
                        const selected = selectedSeatIds.includes(seat.id);
                        const isAvailable = seat.status === 'available';
                        return (
                          <button
                            key={seat.id}
                            onClick={() => isAvailable && onSeatClick(seat.id)}
                            disabled={!isAvailable}
                            title={`${seat.venue_seat?.label ?? ''} · ${seat.status} · ₹${seat.price}`}
                            className={cn(
                              'h-5 w-5 rounded text-[8px] font-bold text-white transition-all',
                              selected
                                ? 'bg-cyan-400 scale-110 ring-2 ring-cyan-300'
                                : statusColors[seat.status] ?? 'bg-slate-700'
                            )}
                          >
                            {seat.venue_seat?.seat_number ?? ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
