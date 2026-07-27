import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Users, Car, ArrowLeft, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/common/page-loader';
import { ErrorState } from '@/components/common/error-state';
import { EmptyState } from '@/components/common/empty-state';
import { EventCard } from '@/components/common/event-card';
import { formatDate } from '@/lib/format';
import type { Venue, VenueFacility, EventWithVenue } from '@/types/database';

const facilityLabels: Record<string, string> = {
  entry_gate: 'Entry Gate',
  exit_gate: 'Exit',
  emergency_exit: 'Emergency Exit',
  washroom: 'Washroom',
  accessible_washroom: 'Accessible Washroom',
  food_stall: 'Food Stall',
  medical_room: 'Medical Room',
  security_point: 'Security Point',
  parking: 'Parking',
  fire_extinguisher: 'Fire Extinguisher',
  assembly_point: 'Assembly Point',
};

export default function VenueDetailsPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: venue, isLoading, isError, refetch } = useQuery({
    queryKey: ['venue', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data as Venue | null;
    },
    enabled: !!slug,
  });

  const { data: facilities } = useQuery({
    queryKey: ['venue-facilities', venue?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venue_facilities')
        .select('*')
        .eq('venue_id', venue!.id)
        .eq('is_active', true);
      if (error) throw error;
      return data as VenueFacility[];
    },
    enabled: !!venue?.id,
  });

  const { data: events } = useQuery({
    queryKey: ['venue-events', venue?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*, venue:venues(id,name,city,address,venue_image_url)')
        .eq('venue_id', venue!.id)
        .eq('is_published', true)
        .order('event_date');
      if (error) throw error;
      return data as EventWithVenue[];
    },
    enabled: !!venue?.id,
  });

  if (isLoading) return <PageLoader />;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!venue) return <ErrorState title="Venue not found" />;

  return (
    <div>
      <div className="relative h-[36vh] min-h-[240px] overflow-hidden">
        {venue.venue_image_url && (
          <img src={venue.venue_image_url} alt={venue.name} className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute left-4 top-4 sm:left-8">
          <Button variant="ghost" size="sm" asChild className="glass text-white hover:text-white">
            <Link to="/venues">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to venues
            </Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            <div>
              <Badge variant="secondary" className="capitalize">{venue.venue_type}</Badge>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{venue.name}</h1>
              <p className="mt-2 flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" /> {venue.address}, {venue.city}, {venue.state}, {venue.country}
              </p>
            </div>

            {venue.description && (
              <p className="text-sm leading-relaxed text-muted-foreground">{venue.description}</p>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="bg-card p-4">
                <Users className="mb-2 h-5 w-5 text-primary" />
                <p className="text-xs text-muted-foreground">Capacity</p>
                <p className="text-sm font-semibold">{venue.total_capacity.toLocaleString('en-IN')}</p>
              </Card>
              <Card className="bg-card p-4">
                <Car className="mb-2 h-5 w-5 text-accent" />
                <p className="text-xs text-muted-foreground">Parking</p>
                <p className="text-sm font-semibold">{venue.parking_capacity} spaces</p>
              </Card>
              <Card className="bg-card p-4">
                <MapPin className="mb-2 h-5 w-5 text-primary" />
                <p className="text-xs text-muted-foreground">City</p>
                <p className="text-sm font-semibold">{venue.city}</p>
              </Card>
            </div>

            {facilities && facilities.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-bold">Facilities & Safety</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {facilities.map((f) => (
                    <Card key={f.id} className="bg-card p-4">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${f.is_emergency ? 'bg-destructive' : 'bg-emerald-400'}`} />
                        <h3 className="text-sm font-semibold">{f.name}</h3>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {facilityLabels[f.facility_type] ?? f.facility_type}
                      </p>
                      {f.description && (
                        <p className="mt-1 text-xs text-muted-foreground">{f.description}</p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="mb-4 text-xl font-bold">Upcoming events</h2>
              {!events || events.length === 0 ? (
                <EmptyState title="No upcoming events" description="Check back later for new events at this venue." />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {events.map((e) => (
                    <EventCard key={e.id} event={e} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
