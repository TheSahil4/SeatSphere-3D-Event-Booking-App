import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Artist } from '@/types/database';

export function ArtistCard({ artist, eventCount = 0 }: { artist: Artist; eventCount?: number }) {
  return (
    <Link to={`/artists/${artist.slug}`} className="group block">
      <Card className="overflow-hidden border-border/60 bg-card p-0 transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5">
        <div className="relative aspect-square overflow-hidden">
          {artist.profile_image_url ? (
            <img
              src={artist.profile_image_url}
              alt={artist.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-secondary" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-lg font-bold text-white">{artist.name}</h3>
            {artist.category && (
              <Badge variant="secondary" className="mt-1 text-xs">
                {artist.category}
              </Badge>
            )}
          </div>
        </div>
        <div className="p-4 text-xs text-muted-foreground">
          {eventCount} upcoming event{eventCount !== 1 ? 's' : ''}
        </div>
      </Card>
    </Link>
  );
}
