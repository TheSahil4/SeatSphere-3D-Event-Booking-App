import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="gradient-text text-7xl font-extrabold sm:text-9xl">404</p>
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Page not found</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        The page you are looking for may have been moved or no longer exists.
      </p>
      <Button asChild className="mt-8 gradient-primary">
        <Link to="/">
          <Home className="mr-2 h-4 w-4" /> Back to home
        </Link>
      </Button>
    </div>
  );
}
