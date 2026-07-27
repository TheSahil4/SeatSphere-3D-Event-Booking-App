import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ArtistCard } from '@/components/common/artist-card';
import { PageLoader } from '@/components/common/page-loader';
import { ErrorState } from '@/components/common/error-state';
import { EmptyState } from '@/components/common/empty-state';

export default function ArtistsPage() {
  const { data: artists, isLoading, isError, refetch } = useQuery({
    queryKey: ['artists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artists')
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
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Artists</h1>
      <p className="mt-2 text-muted-foreground">Discover performers, speakers and creators.</p>
      {!artists || artists.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No artists yet" />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {artists.map((a) => (
            <ArtistCard key={a.id} artist={a} />
          ))}
        </div>
      )}
    </div>
  );
}
