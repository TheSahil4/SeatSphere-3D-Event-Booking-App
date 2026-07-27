import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Boxes,
  Grid3x3,
  X,
  Clock,
  Ticket,
  Loader2,
  AlertTriangle,
  Eye,
  Accessibility,
  Filter,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { useBookingStore } from '@/stores/booking-store';
import { Venue3D } from '@/three/venue-3d';
import { Venue2D } from '@/components/booking/venue-2d';
import { SeatLegend } from '@/components/booking/seat-legend';
import { PageLoader } from '@/components/common/page-loader';
import { ErrorState } from '@/components/common/error-state';
import { formatINR } from '@/lib/format';
import type { Event, Venue, VenueSection, VenueFacility, EventSeatWithSeat } from '@/types/database';

const HOLD_DURATION_MS = 8 * 60 * 1000;

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const store = useBookingStore();

  const [view, setView] = useState<'3d' | '2d'>('3d');
  const [focusedSection, setFocusedSection] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterAccessibleOnly, setFilterAccessibleOnly] = useState(false);
  const [filterAvailableOnly, setFilterAvailableOnly] = useState(true);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const { data: event, isLoading, isError, refetch } = useQuery({
    queryKey: ['event', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*, venue:venues(*)')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data as Event & { venue: Venue | null };
    },
    enabled: !!slug,
  });

  const { data: sections } = useQuery({
    queryKey: ['venue-sections', event?.venue_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venue_sections')
        .select('*')
        .eq('venue_id', event!.venue_id!)
        .eq('is_active', true)
        .order('position_z');
      if (error) throw error;
      return data as VenueSection[];
    },
    enabled: !!event?.venue_id,
  });

  const { data: facilities } = useQuery({
    queryKey: ['venue-facilities', event?.venue_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venue_facilities')
        .select('*')
        .eq('venue_id', event!.venue_id!)
        .eq('is_active', true);
      if (error) throw error;
      return data as VenueFacility[];
    },
    enabled: !!event?.venue_id,
  });

  const { data: eventSeats, refetch: refetchSeats } = useQuery({
    queryKey: ['event-seats', event?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_seats')
        .select('*, venue_seat:venue_seats(*)')
        .eq('event_id', event!.id);
      if (error) throw error;
      return data as EventSeatWithSeat[];
    },
    enabled: !!event?.id,
  });

  // Initialize store when event loads
  useEffect(() => {
    if (event) {
      store.setEventId(event.id);
      store.clearSeats();
      store.clearFood();
      setHoldExpiresAt(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id]);

  // Realtime: listen for seat status changes
  useEffect(() => {
    if (!event) return;
    const channel = supabase
      .channel(`event-seats-${event.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'event_seats', filter: `event_id=eq.${event.id}` },
        () => refetchSeats()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'seat_holds', filter: `event_id=eq.${event.id}` },
        () => refetchSeats()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id]);

  // Countdown timer
  useEffect(() => {
    if (!holdExpiresAt) return;
    const tick = () => {
      const left = Math.max(0, new Date(holdExpiresAt).getTime() - Date.now());
      setTimeLeft(left);
      if (left <= 0) {
        setHoldExpiresAt(null);
        store.clearSeats();
        toast.error('Your seat hold has expired. The seats have been released.');
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [holdExpiresAt]);

  // Hold mutation
  const holdMutation = useMutation({
    mutationFn: async (eventSeatId: string) => {
      const { data, error } = await supabase.rpc('hold_event_seat', {
        p_event_seat_id: eventSeatId,
        p_session_id: user?.id ?? null,
      });
      if (error) throw error;
      return data as { ok: boolean; error?: string; expires_at?: string };
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : 'Could not hold seat');
    },
  });

  const releaseMutation = useMutation({
    mutationFn: async (eventSeatId: string) => {
      const { error } = await supabase.rpc('release_seat_hold', { p_event_seat_id: eventSeatId });
      if (error) throw error;
    },
    onError: () => toast.error('Could not release seat'),
  });

  const handleSeatClick = useCallback(async (eventSeatId: string) => {
    const seat = eventSeats?.find((s) => s.id === eventSeatId);
    if (!seat || seat.status !== 'available') {
      toast.error('This seat is no longer available. Please select another seat.');
      return;
    }

    // If already selected, remove
    if (store.selectedSeats.find((s) => s.id === eventSeatId)) {
      await releaseMutation.mutateAsync(eventSeatId);
      store.removeSeat(eventSeatId);
      if (store.selectedSeats.length <= 1) setHoldExpiresAt(null);
      return;
    }

    // Limit selection
    if (store.selectedSeats.length >= 8) {
      toast.error('You can select up to 8 seats per booking.');
      return;
    }

    const result = await holdMutation.mutateAsync(eventSeatId);
    if (!result?.ok) {
      toast.error(result?.error ?? 'Could not hold seat');
      refetchSeats();
      return;
    }

    if (result.expires_at) setHoldExpiresAt(result.expires_at);
    store.addSeat(seat);
  }, [eventSeats, store.selectedSeats, holdMutation, releaseMutation, refetchSeats]);

  // Filtered seats for display
  const filteredSeats = useMemo(() => {
    if (!eventSeats) return [];
    return eventSeats.filter((s) => {
      if (filterAccessibleOnly && !s.venue_seat?.is_accessible) return false;
      if (filterAvailableOnly && s.status !== 'available' && !store.selectedSeats.find((x) => x.id === s.id)) return false;
      if (maxPrice !== null && s.price > maxPrice) return false;
      return true;
    });
  }, [eventSeats, filterAccessibleOnly, filterAvailableOnly, maxPrice, store.selectedSeats]);

  // Stats
  const stats = useMemo(() => {
    if (!eventSeats) return { total: 0, available: 0, booked: 0 };
    return {
      total: eventSeats.length,
      available: eventSeats.filter((s) => s.status === 'available').length,
      booked: eventSeats.filter((s) => s.status === 'booked').length,
    };
  }, [eventSeats]);

  const subtotal = store.selectedSeats.reduce((sum, s) => sum + Number(s.price), 0);

  if (isLoading) return <PageLoader />;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!event) return <ErrorState title="Event not found" />;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 glass-strong border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/events/${slug}`}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </Link>
            </Button>
            <div>
              <h1 className="text-sm font-bold sm:text-base">{event.title}</h1>
              <p className="text-xs text-muted-foreground">{event.venue?.name} · {stats.available} of {stats.total} seats available</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {holdExpiresAt && (
              <Badge variant="outline" className="border-amber-500/40 text-amber-400">
                <Clock className="mr-1 h-3 w-3" />
                {Math.floor(timeLeft / 60000)}:{String(Math.floor((timeLeft % 60000) / 1000)).padStart(2, '0')}
              </Badge>
            )}
            <div className="flex rounded-md border border-border">
              <button
                onClick={() => setView('3d')}
                className={`p-2 ${view === '3d' ? 'bg-secondary text-primary' : 'text-muted-foreground'}`}
                aria-label="3D view"
              >
                <Boxes className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView('2d')}
                className={`p-2 ${view === '2d' ? 'bg-secondary text-primary' : 'text-muted-foreground'}`}
                aria-label="2D view"
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters((v) => !v)}>
            <Filter className="mr-1.5 h-4 w-4" /> Filters
          </Button>
          <Button
            variant={filterAvailableOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterAvailableOnly((v) => !v)}
          >
            Available only
          </Button>
          <Button
            variant={filterAccessibleOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterAccessibleOnly((v) => !v)}
          >
            <Accessibility className="mr-1.5 h-4 w-4" /> Accessible
          </Button>
          {showFilters && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Max price:</label>
              <input
                type="range"
                min={0}
                max={5000}
                step={100}
                value={maxPrice ?? 5000}
                onChange={(e) => setMaxPrice(Number(e.target.value) >= 5000 ? null : Number(e.target.value))}
                className="w-32 accent-primary"
              />
              <span className="text-xs text-muted-foreground">{maxPrice ? formatINR(maxPrice) : 'Any'}</span>
            </div>
          )}
        </div>

        {/* Section quick-focus */}
        {sections && sections.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setFocusedSection(null)}
              className={`rounded-full border px-3 py-1 text-xs ${!focusedSection ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
            >
              All
            </button>
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setFocusedSection(focusedSection === s.id ? null : s.id)}
                className={`rounded-full border px-3 py-1 text-xs ${focusedSection === s.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
                style={focusedSection === s.id ? {} : { borderColor: `${s.colour_code}40` }}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}

        {/* Venue view */}
        <Card className="relative overflow-hidden border-border bg-gradient-to-b from-card to-background">
          <div className="p-4">
            <SeatLegend className="mb-4" />
          </div>
          <div className="h-[60vh] min-h-[400px] w-full">
            {view === '3d' && sections && facilities ? (
              <Venue3D
                sections={sections}
                facilities={facilities}
                eventSeats={filteredSeats}
                selectedSeatIds={store.selectedSeats.map((s) => s.id)}
                onSeatClick={handleSeatClick}
                focusedSectionId={focusedSection}
              />
            ) : (
              <div className="h-full overflow-auto p-4 scrollbar-thin">
                {sections && (
                  <Venue2D
                    sections={sections}
                    eventSeats={filteredSeats}
                    selectedSeatIds={store.selectedSeats.map((s) => s.id)}
                    onSeatClick={handleSeatClick}
                  />
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Selected seats summary */}
        <div className="mt-6">
          <Card className="bg-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Your selection</h3>
              <span className="text-sm text-muted-foreground">
                {store.selectedSeats.length} seat{store.selectedSeats.length !== 1 ? 's' : ''} · {formatINR(subtotal)}
              </span>
            </div>
            {store.selectedSeats.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {store.selectedSeats.map((s) => (
                  <Badge key={s.id} variant="secondary" className="gap-1 py-1.5">
                    {s.venue_seat?.label} · {s.category_name} · {formatINR(Number(s.price))}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => handleSeatClick(s.id)}
                    />
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Click an available seat on the map to select it. Seats are held for 8 minutes.
              </p>
            )}
            <div className="mt-5 flex gap-3">
              <Button
                className="flex-1 gradient-primary"
                size="lg"
                disabled={store.selectedSeats.length === 0}
                onClick={() => navigate(`/checkout/${event.id}`)}
              >
                <Ticket className="mr-2 h-5 w-5" />
                Continue to checkout
              </Button>
              <Button variant="outline" size="lg" onClick={() => setDrawerOpen(true)}>
                <Eye className="mr-2 h-4 w-4" /> Details
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Details drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md glass-strong border-l border-border p-6 overflow-y-auto scrollbar-thin"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Seat details</h2>
              <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            {store.selectedSeats.length === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">No seats selected yet.</p>
            ) : (
              <div className="mt-6 space-y-4">
                {store.selectedSeats.map((s) => (
                  <Card key={s.id} className="bg-card p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">Seat {s.venue_seat?.label}</p>
                        <p className="text-xs text-muted-foreground">{s.category_name}</p>
                      </div>
                      <p className="font-bold text-primary">{formatINR(Number(s.price))}</p>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <span>Visibility: {s.visibility_score}%</span>
                      <span>Section: {sections?.find((sec) => sec.id === s.venue_seat?.section_id)?.name}</span>
                      {s.venue_seat?.is_accessible && (
                        <span className="text-blue-400">Accessible seat</span>
                      )}
                      {s.venue_seat?.has_limited_view && (
                        <span className="text-orange-400">Limited view</span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => handleSeatClick(s.id)}
                    >
                      Remove seat
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
