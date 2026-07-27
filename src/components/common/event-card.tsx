import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatINR, formatDate, formatTime } from '@/lib/format';
import { safeImageUrl } from '@/lib/media';
import type { EventWithVenue } from '@/types/database';

export function EventCard({ event }: { event: EventWithVenue }) {
  const remaining = event.capacity_limit > 0;
  const bannerUrl = safeImageUrl(event.banner_url);

  return (
    <Link to={`/events/${event.slug}`} className="group block">
      <Card className="overflow-hidden border-border/60 bg-card p-0 transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5">
        <div className="relative aspect-[16/9] overflow-hidden">
          {bannerUrl ? (
            <img
              src={bannerUrl}
              alt={event.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-secondary" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          {event.is_featured && (
            <Badge className="absolute left-3 top-3 gradient-primary text-white border-0">
              Featured
            </Badge>
          )}
          <div className="absolute bottom-3 left-3 right-3">
            <p className="text-xs font-medium text-white/80">{event.category}</p>
            <h3 className="line-clamp-1 text-lg font-bold text-white">{event.title}</h3>
          </div>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> {formatDate(event.event_date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {formatTime(event.start_time)}
            </span>
          </div>
          {event.venue && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {event.venue.name}, {event.venue.city}
            </p>
          )}
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-xs text-muted-foreground">From</p>
              <p className="text-sm font-bold text-foreground">
                {formatINR(event.minimum_ticket_price)}
              </p>
            </div>
            <Badge variant={remaining ? 'secondary' : 'destructive'} className="text-xs">
              {remaining ? 'Tickets available' : 'Sold out'}
            </Badge>
          </div>
        </div>
      </Card>
    </Link>
  );
}
