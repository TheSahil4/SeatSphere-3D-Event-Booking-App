import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { VenueCard } from '@/components/common/venue-card';
import { PageLoader } from '@/components/common/page-loader';
import { ErrorState } from '@/components/common/error-state';
import { EmptyState } from '@/components/common/empty-state';

export default function VenuesPage() {
  const { data: venues, isLoading, isError, refetch } = useQuery({
    queryKey: ['venues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <PageLoader />;
  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Venues</h1>
      <p className="mt-2 text-muted-foreground">Explore our partner venues across India.</p>
      {!venues || venues.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No venues yet" description="Check back soon for new venues." />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((v) => (
            <VenueCard key={v.id} venue={v} />
          ))}
        </div>
      )}
    </div>
  );
}
