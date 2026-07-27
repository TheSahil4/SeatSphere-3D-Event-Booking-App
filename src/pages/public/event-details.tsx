import { useQuery } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Ticket,
  ShieldCheck,
  UtensilsCrossed,
  Car,
  AlertTriangle,
  ArrowLeft,
  Star,
  Info,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PageLoader } from '@/components/common/page-loader';
import { ErrorState } from '@/components/common/error-state';
import { EventCard } from '@/components/common/event-card';
import { formatINR, formatDate, formatTime, formatDateTime } from '@/lib/format';
import { useAuth } from '@/hooks/use-auth';
import type { Event, Venue, EventArtist, EventSeat, Review } from '@/types/database';

export default function EventDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const { data: artists } = useQuery({
    queryKey: ['event-artists', event?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_artists')
        .select('*, artist:artists(*)')
        .eq('event_id', event!.id)
        .order('performance_order');
      if (error) throw error;
      return data as EventArtist[];
    },
    enabled: !!event?.id,
  });

  const { data: seatStats } = useQuery({
    queryKey: ['event-seat-stats', event?.id],
    queryFn: async () => {
      const { count: total } = await supabase
        .from('event_seats')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event!.id);
      const { count: booked } = await supabase
        .from('event_seats')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event!.id)
        .in('status', ['booked', 'held']);
      return { total: total ?? 0, booked: booked ?? 0 };
    },
    enabled: !!event?.id,
  });

  const { data: reviews } = useQuery({
    queryKey: ['event-reviews', event?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('event_id', event!.id)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as Review[];
    },
    enabled: !!event?.id,
  });

  const { data: related } = useQuery({
    queryKey: ['related-events', event?.category, event?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*, venue:venues(id,name,city,address,venue_image_url)')
        .eq('is_published', true)
        .eq('category', event!.category)
        .neq('id', event!.id)
        .limit(3);
      if (error) throw error;
      return data;
    },
    enabled: !!event?.id,
  });

  if (isLoading) return <PageLoader />;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!event) return <ErrorState title="Event not found" message="This event may have been removed." />;

  const remaining = seatStats ? seatStats.total - seatStats.booked : 0;
  const bookedPct = seatStats && seatStats.total > 0 ? (seatStats.booked / seatStats.total) * 100 : 0;

  const handleBook = () => {
    if (!user) {
      navigate('/login', { state: { from: `/events/${slug}/book` } });
    } else {
      navigate(`/events/${slug}/book`);
    }
  };

  return (
    <div>
      {/* Banner */}
      <div className="relative h-[40vh] min-h-[280px] w-full overflow-hidden sm:h-[50vh]">
        {event.banner_url && (
          <img src={event.banner_url} alt={event.title} className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute left-4 top-4 sm:left-8 sm:top-8">
          <Button variant="ghost" size="sm" asChild className="glass text-white hover:text-white">
            <Link to="/events">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to events
            </Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Main */}
          <div className="space-y-8">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{event.category}</Badge>
                <Badge
                  className={
                    event.status === 'booking_open'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                  }
                >
                  {event.status.replace(/_/g, ' ')}
                </Badge>
                {event.is_featured && (
                  <Badge className="gradient-primary border-0 text-white">Featured</Badge>
                )}
              </div>
              <h1 className="mt-3 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                {event.title}
              </h1>
              {event.short_description && (
                <p className="mt-3 text-lg text-muted-foreground">{event.short_description}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-card p-4">
                <Calendar className="mb-2 h-5 w-5 text-primary" />
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="text-sm font-semibold">{formatDate(event.event_date)}</p>
              </Card>
              <Card className="bg-card p-4">
                <Clock className="mb-2 h-5 w-5 text-primary" />
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="text-sm font-semibold">
                  {formatTime(event.start_time)}{event.end_time ? ` – ${formatTime(event.end_time)}` : ''}
                </p>
              </Card>
              <Card className="bg-card p-4">
                <Clock className="mb-2 h-5 w-5 text-accent" />
                <p className="text-xs text-muted-foreground">Gates open</p>
                <p className="text-sm font-semibold">{formatTime(event.gate_open_time) || 'TBA'}</p>
              </Card>
              <Card className="bg-card p-4">
                <MapPin className="mb-2 h-5 w-5 text-primary" />
                <p className="text-xs text-muted-foreground">Venue</p>
                <p className="text-sm font-semibold">{event.venue?.name ?? 'TBA'}</p>
              </Card>
            </div>

            {event.description && (
              <div>
                <h2 className="mb-3 text-xl font-bold">About this event</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {event.description}
                </p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              {event.language && (
                <div>
                  <p className="text-xs text-muted-foreground">Language</p>
                  <p className="text-sm font-medium">{event.language}</p>
                </div>
              )}
              {event.age_restriction && (
                <div>
                  <p className="text-xs text-muted-foreground">Age restriction</p>
                  <p className="text-sm font-medium">{event.age_restriction}</p>
                </div>
              )}
              {event.duration_minutes && (
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-sm font-medium">{event.duration_minutes} mins</p>
                </div>
              )}
            </div>

            {/* Artists */}
            {artists && artists.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-bold">Line-up</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {artists.map((ea) => (
                    <Card key={ea.id} className="flex items-center gap-4 bg-card p-4">
                      {ea.artist?.profile_image_url && (
                        <img
                          src={ea.artist.profile_image_url}
                          alt={ea.artist.name}
                          className="h-14 w-14 rounded-xl object-cover"
                        />
                      )}
                      <div>
                        <Link
                          to={`/artists/${ea.artist?.slug}`}
                          className="font-semibold text-foreground hover:text-primary"
                        >
                          {ea.artist?.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{ea.artist?.category}</p>
                        {ea.performance_start_time && (
                          <p className="text-xs text-muted-foreground">
                            On at {formatTime(ea.performance_start_time)}
                          </p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Venue */}
            {event.venue && (
              <div>
                <h2 className="mb-4 text-xl font-bold">Venue</h2>
                <Card className="overflow-hidden bg-card p-0">
                  {event.venue.venue_image_url && (
                    <img
                      src={event.venue.venue_image_url}
                      alt={event.venue.name}
                      className="aspect-[16/6] w-full object-cover"
                    />
                  )}
                  <div className="p-5">
                    <Link
                      to={`/venues/${event.venue.slug}`}
                      className="text-lg font-semibold hover:text-primary"
                    >
                      {event.venue.name}
                    </Link>
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" /> {event.venue.address}, {event.venue.city}, {event.venue.state}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Capacity {event.venue.total_capacity.toLocaleString('en-IN')} · Parking {event.venue.parking_capacity}
                    </p>
                  </div>
                </Card>
              </div>
            )}

            {/* Policies */}
            <div className="grid gap-4 sm:grid-cols-2">
              {event.cancellation_policy && (
                <Card className="bg-card p-5">
                  <Info className="mb-2 h-5 w-5 text-primary" />
                  <h3 className="text-sm font-semibold">Cancellation</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{event.cancellation_policy}</p>
                </Card>
              )}
              {event.refund_policy && (
                <Card className="bg-card p-5">
                  <Info className="mb-2 h-5 w-5 text-primary" />
                  <h3 className="text-sm font-semibold">Refunds</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{event.refund_policy}</p>
                </Card>
              )}
            </div>

            {/* Safety */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: ShieldCheck, title: 'Emergency exits', text: 'Mapped on the 3D venue view' },
                { icon: AlertTriangle, title: 'Medical assistance', text: 'On-site medical room' },
                { icon: Car, title: 'Parking', text: `${event.venue?.parking_capacity ?? 0} spaces` },
                { icon: UtensilsCrossed, title: 'Food pre-order', text: 'Skip the interval queue' },
              ].map((f, i) => (
                <Card key={i} className="bg-card p-4">
                  <f.icon className="mb-2 h-5 w-5 text-primary" />
                  <h3 className="text-sm font-semibold">{f.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{f.text}</p>
                </Card>
              ))}
            </div>

            {/* Reviews */}
            {reviews && reviews.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-bold">Reviews</h2>
                <div className="space-y-3">
                  {reviews.map((r) => (
                    <Card key={r.id} className="bg-card p-5">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, s) => (
                            <Star
                              key={s}
                              className={`h-4 w-4 ${s < r.overall_rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`}
                            />
                          ))}
                        </div>
                      </div>
                      {r.review_text && <p className="text-sm text-foreground">{r.review_text}</p>}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Related */}
            {related && related.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-bold">Related events</h2>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {related.map((e) => (
                    <EventCard key={e.id} event={e} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sticky booking card */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <Card className="bg-card p-6">
              <h3 className="text-lg font-bold">Book this event</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{formatDate(event.event_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">{formatTime(event.start_time)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tickets from</span>
                  <span className="font-bold text-primary">{formatINR(event.minimum_ticket_price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Up to</span>
                  <span className="font-medium">{formatINR(event.maximum_ticket_price)}</span>
                </div>
              </div>

              {seatStats && seatStats.total > 0 && (
                <div className="mt-5">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">Booking progress</span>
                    <span className="font-medium">{remaining} left</span>
                  </div>
                  <Progress value={bookedPct} className="h-2" />
                </div>
              )}

              <Button
                className="mt-6 w-full gradient-primary"
                size="lg"
                onClick={handleBook}
                disabled={event.status === 'sold_out' || event.status === 'completed' || event.status === 'cancelled'}
              >
                <Ticket className="mr-2 h-5 w-5" />
                {event.status === 'sold_out' ? 'Sold out' : 'Book Seats'}
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                {user ? 'You can pick seats on the 3D map' : 'Sign in to select seats'}
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
