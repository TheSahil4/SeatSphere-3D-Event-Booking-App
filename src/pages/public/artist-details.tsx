import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/common/page-loader';
import { ErrorState } from '@/components/common/error-state';
import { EventCard } from '@/components/common/event-card';
import { formatDate, formatTime } from '@/lib/format';
import { safeImageUrl } from '@/lib/media';
import type { Artist, EventArtist, EventWithVenue } from '@/types/database';

export default function ArtistDetailsPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: artist, isLoading, isError, refetch } = useQuery({
    queryKey: ['artist', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data as Artist | null;
    },
    enabled: !!slug,
  });

  const { data: eventArtists } = useQuery({
    queryKey: ['artist-events', artist?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_artists')
        .select('*, event:events(*, venue:venues(id,name,city,address,venue_image_url))')
        .eq('artist_id', artist!.id)
        .order('performance_order');
      if (error) throw error;
      return data as (EventArtist & { event: EventWithVenue })[];
    },
    enabled: !!artist?.id,
  });

  if (isLoading) return <PageLoader />;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!artist) return <ErrorState title="Artist not found" />;

  const coverImageUrl = safeImageUrl(artist.cover_image_url);
  const profileImageUrl = safeImageUrl(artist.profile_image_url);

  return (
    <div>
      <div className="relative h-[32vh] min-h-[220px] overflow-hidden">
        {coverImageUrl && (
          <img src={coverImageUrl} alt="" className="h-full w-full object-cover opacity-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute left-4 top-4 sm:left-8">
          <Button variant="ghost" size="sm" asChild className="glass text-white hover:text-white">
            <Link to="/artists">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to artists
            </Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
          {profileImageUrl && (
            <img
              src={profileImageUrl}
              alt={artist.name}
              className="h-28 w-28 rounded-2xl border-2 border-border object-cover sm:h-32 sm:w-32"
            />
          )}
          <div>
            {artist.category && <Badge variant="secondary">{artist.category}</Badge>}
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{artist.name}</h1>
          </div>
        </div>

        {artist.biography && (
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">{artist.biography}</p>
        )}

        <h2 className="mb-4 mt-10 text-xl font-bold">Upcoming events</h2>
        {!eventArtists || eventArtists.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming events.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {eventArtists.map((ea) => (
              <EventCard key={ea.id} event={ea.event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
