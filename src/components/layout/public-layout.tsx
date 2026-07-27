import { type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { PublicHeader } from '@/components/layout/public-header';
import { Footer } from '@/components/layout/footer';

export function PublicLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">{children ?? <Outlet />}</main>
      <Footer />
    </div>
  );
}
