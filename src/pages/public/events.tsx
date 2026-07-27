import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, X, LayoutGrid, List } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EventCard } from '@/components/common/event-card';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { PageLoader } from '@/components/common/page-loader';
import { cn } from '@/lib/utils';
import type { EventWithVenue } from '@/types/database';

const categories = ['Concerts', 'Theatre', 'Stand-up Comedy', 'Sports', 'College Events', 'Conferences', 'Festivals', 'Esports'];
const cities = ['Pune', 'Mumbai', 'Bengaluru'];
const sorts = [
  { value: 'date_asc', label: 'Date (earliest)' },
  { value: 'date_desc', label: 'Date (latest)' },
  { value: 'price_asc', label: 'Price (low to high)' },
  { value: 'price_desc', label: 'Price (high to low)' },
];

export default function EventsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [sort, setSort] = useState('date_asc');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const { data: events, isLoading, isError, refetch } = useQuery({
    queryKey: ['events-list', search, category, city, sort],
    queryFn: async () => {
      let q = supabase
        .from('events')
        .select('*, venue:venues(id,name,city,address,venue_image_url)')
        .eq('is_published', true);
      if (category) q = q.eq('category', category);
      if (city) q = q.eq('venue.city', city);
      if (sort === 'date_asc') q = q.order('event_date', { ascending: true });
      if (sort === 'date_desc') q = q.order('event_date', { ascending: false });
      if (sort === 'price_asc') q = q.order('minimum_ticket_price', { ascending: true });
      if (sort === 'price_desc') q = q.order('minimum_ticket_price', { ascending: false });
      const { data, error } = await q;
      if (error) throw error;
      let rows = data as EventWithVenue[];
      if (search.trim()) {
        const s = search.toLowerCase();
        rows = rows.filter(
          (e) =>
            e.title.toLowerCase().includes(s) ||
            e.short_description?.toLowerCase().includes(s) ||
            e.venue?.name.toLowerCase().includes(s)
        );
      }
      return rows;
    },
  });

  const activeFilters = useMemo(
    () => [category, city].filter(Boolean) as string[],
    [category, city]
  );

  const clearFilters = () => {
    setCategory(null);
    setCity(null);
    setSearch('');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Events</h1>
        <p className="mt-2 text-muted-foreground">Find your next live experience.</p>
      </div>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by event, venue or description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm text-foreground"
          >
            {sorts.map((s) => (
              <option key={s.value} value={s.value} className="bg-card">
                {s.label}
              </option>
            ))}
          </select>
          <div className="flex rounded-md border border-border">
            <button
              onClick={() => setView('grid')}
              className={cn('p-2', view === 'grid' ? 'bg-secondary text-primary' : 'text-muted-foreground')}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('list')}
              className={cn('p-2', view === 'list' ? 'bg-secondary text-primary' : 'text-muted-foreground')}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(category === c ? null : c)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              category === c
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {c}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-border" />
        {cities.map((c) => (
          <button
            key={c}
            onClick={() => setCity(city === c ? null : c)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              city === c
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {activeFilters.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {activeFilters.map((f) => (
            <Badge key={f} variant="secondary" className="gap-1">
              {f}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  if (f === category) setCategory(null);
                  if (f === city) setCity(null);
                }}
              />
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      )}

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : !events || events.length === 0 ? (
        <EmptyState
          title="No events found"
          description="Try adjusting your filters or search terms."
          action={
            <Button onClick={clearFilters} variant="outline">
              Clear filters
            </Button>
          }
        />
      ) : (
        <div
          className={cn(
            'grid gap-5',
            view === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
          )}
        >
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}
