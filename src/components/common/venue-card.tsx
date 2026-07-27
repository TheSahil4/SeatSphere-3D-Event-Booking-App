import { Link } from 'react-router-dom';
import { MapPin, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { Venue } from '@/types/database';

export function VenueCard({ venue, eventCount = 0 }: { venue: Venue; eventCount?: number }) {
  return (
    <Link to={`/venues/${venue.slug}`} className="group block">
      <Card className="overflow-hidden border-border/60 bg-card p-0 transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5">
        <div className="relative aspect-[16/10] overflow-hidden">
          {venue.venue_image_url ? (
            <img
              src={venue.venue_image_url}
              alt={venue.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-secondary" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-lg font-bold text-white">{venue.name}</h3>
            <p className="flex items-center gap-1 text-xs text-white/80">
              <MapPin className="h-3.5 w-3.5" /> {venue.city}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between p-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> Capacity {venue.total_capacity.toLocaleString('en-IN')}
          </span>
          <span>{eventCount} upcoming events</span>
        </div>
      </Card>
    </Link>
  );
}
