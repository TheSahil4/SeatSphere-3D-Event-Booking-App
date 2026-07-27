import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Calendar,
  MapPin,
  Ticket,
  Eye,
  ShieldCheck,
  UtensilsCrossed,
  ArrowRight,
  Star,
  Sparkles,
  Boxes,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EventCard } from '@/components/common/event-card';
import { VenueCard } from '@/components/common/venue-card';
import { ArtistCard } from '@/components/common/artist-card';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatINR } from '@/lib/format';
import type { EventWithVenue, Venue, Artist } from '@/types/database';

const categories = [
  { name: 'Concerts', icon: '🎵', color: 'from-violet-500 to-fuchsia-500' },
  { name: 'Theatre', icon: '🎭', color: 'from-amber-500 to-orange-500' },
  { name: 'Stand-up Comedy', icon: '🎤', color: 'from-emerald-500 to-teal-500' },
  { name: 'Sports', icon: '⚽', color: 'from-blue-500 to-cyan-500' },
  { name: 'College Events', icon: '🎓', color: 'from-rose-500 to-pink-500' },
  { name: 'Conferences', icon: '💡', color: 'from-indigo-500 to-violet-500' },
  { name: 'Festivals', icon: '🎪', color: 'from-orange-500 to-red-500' },
  { name: 'Esports', icon: '🎮', color: 'from-cyan-500 to-blue-500' },
];

const testimonials = [
  {
    name: 'Ananya R.',
    role: 'Concertgoer',
    text: 'The 3D seat preview is a game-changer. I knew exactly what my view would be before paying — no more guessing.',
    rating: 5,
  },
  {
    name: 'Karthik M.',
    role: 'Festival organiser',
    text: 'We managed check-ins for 4,000 guests without a single queue. The gate scanner was instant and reliable.',
    rating: 5,
  },
  {
    name: 'Priya S.',
    role: 'Theatre fan',
    text: 'Being able to see the nearest emergency exit from my seat made me feel safe bringing my kids. Thoughtful design.',
    rating: 4,
  },
];

export default function HomePage() {
  const { data: events } = useQuery({
    queryKey: ['featured-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*, venue:venues(id,name,city,address,venue_image_url)')
        .eq('is_published', true)
        .order('event_date', { ascending: true })
        .limit(6);
      if (error) throw error;
      return data as EventWithVenue[];
    },
  });

  const { data: venues } = useQuery({
    queryKey: ['home-venues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('is_active', true)
        .limit(3);
      if (error) throw error;
      return data as Venue[];
    },
  });

  const { data: artists } = useQuery({
    queryKey: ['home-artists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .eq('is_active', true)
        .limit(4);
      if (error) throw error;
      return data as Artist[];
    },
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/167636/pexels-photo-167636.jpeg"
            alt=""
            className="h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <Badge className="mb-5 border-primary/30 bg-primary/10 text-primary">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> 3D seat booking, reimagined
            </Badge>
            <h1 className="text-balance text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Choose More Than a Seat. <span className="gradient-text">Choose Your View.</span>
            </h1>
            <p className="mt-5 max-w-xl text-balance text-lg text-muted-foreground">
              Explore venues in 3D, preview your stage view and book the perfect seat with confidence.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-10"
          >
            <Card className="glass max-w-3xl p-4 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search events" className="pl-9" aria-label="Search events" />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="City" className="pl-9" aria-label="City" />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="date" className="pl-9" aria-label="Date" />
                </div>
                <Button asChild className="gradient-primary">
                  <Link to="/events">
                    Search Events <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/events/neon-pulse-live-2026/book">
                    <Boxes className="mr-1.5 h-4 w-4" /> Explore 3D Seats
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/events">Browse all events</Link>
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Featured Events</h2>
            <p className="mt-1 text-sm text-muted-foreground">Live and upcoming, straight from the stage.</p>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/events">
              View all <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events?.map((e) => <EventCard key={e.id} event={e} />)}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">Browse by Category</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((c) => (
            <Link
              key={c.name}
              to={`/events?category=${encodeURIComponent(c.name)}`}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card p-5 text-center transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} text-2xl`}
              >
                {c.icon}
              </div>
              <span className="text-xs font-medium text-foreground">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3D Experience */}
      <section className="relative overflow-hidden border-y border-border bg-card/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge className="mb-4 border-accent/30 bg-accent/10 text-accent">
                <Boxes className="mr-1.5 h-3.5 w-3.5" /> 3D Experience
              </Badge>
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Walk the venue before you walk in.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Explore the complete venue in 3D, preview the stage from any section, compare views,
                and find emergency exits — all before you book.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  { icon: Eye, text: 'Preview the stage view from any section' },
                  { icon: Boxes, text: 'Rotate, zoom and pan the full 3D venue' },
                  { icon: ShieldCheck, text: 'See emergency exits and facilities at a glance' },
                  { icon: Ticket, text: 'Pick your seat on the 3D map and hold it instantly' },
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-foreground">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <f.icon className="h-4 w-4" />
                    </div>
                    {f.text}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-8 gradient-primary">
                <Link to="/events/neon-pulse-live-2026/book">
                  Try the 3D demo <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/20 via-accent/10 to-background">
                <img
                  src="https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg"
                  alt="3D venue preview"
                  className="h-full w-full object-cover opacity-60"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="glass-strong rounded-2xl px-6 py-4 text-center">
                    <Boxes className="mx-auto h-10 w-10 text-primary" />
                    <p className="mt-2 text-sm font-medium text-foreground">
                      Interactive 3D venue
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Venues */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">Popular Venues</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {venues?.map((v) => <VenueCard key={v.id} venue={v} />)}
        </div>
      </section>

      {/* Popular Artists */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">Popular Artists</h2>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {artists?.map((a) => <ArtistCard key={a.id} artist={a} />)}
        </div>
      </section>

      {/* Safety */}
      <section className="border-y border-border bg-card/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, title: 'Emergency exit mapping', text: 'Every exit is visible from your seat on the 3D map.' },
              { icon: Eye, title: 'Medical assistance', text: 'Medical rooms and first-aid points shown clearly.' },
              { icon: Ticket, title: 'Security contacts', text: 'One-tap access to venue security and safety desks.' },
              { icon: MapPin, title: 'Accessible routes', text: 'Accessible seating, washrooms and entry routes marked.' },
            ].map((f, i) => (
              <Card key={i} className="border-border/60 bg-card p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Food Pre-Order */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <img
              src="https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg"
              alt="Food pre-order"
              className="aspect-[4/3] w-full rounded-2xl border border-border object-cover"
            />
          </div>
          <div className="order-1 lg:order-2">
            <Badge className="mb-4 border-amber-500/30 bg-amber-500/10 text-amber-400">
              <UtensilsCrossed className="mr-1.5 h-3.5 w-3.5" /> Food Pre-Order
            </Badge>
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Skip the interval queue.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Browse the food menu, order before the show, and collect using a QR code at your
              chosen stall. Your order is ready when you are.
            </p>
            <Button asChild className="mt-8">
              <Link to="/events/neon-pulse-live-2026">See food menu</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-border bg-card/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Loved by guests and organisers
          </h2>
          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Card key={i} className="border-border/60 bg-card p-6">
                <div className="mb-3 flex gap-1">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      className={`h-4 w-4 ${s < t.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`}
                    />
                  ))}
                </div>
                <p className="text-sm text-foreground">"{t.text}"</p>
                <div className="mt-4">
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-accent/10 to-background p-10 text-center sm:p-16">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to choose your view?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Browse live events and book your seat in minutes.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="gradient-primary">
              <Link to="/events">Browse events</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/register">Create account</Link>
            </Button>
          </div>
          {events && events.length > 0 && (
            <p className="mt-6 text-xs text-muted-foreground">
              Tickets from {formatINR(Math.min(...events.map((e) => e.minimum_ticket_price)))}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
