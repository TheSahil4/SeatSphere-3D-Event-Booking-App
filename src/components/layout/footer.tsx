import { Link } from 'react-router-dom';
import { Ticket, Twitter, Instagram, Facebook, Youtube } from 'lucide-react';

const productLinks = [
  { to: '/events', label: 'Events' },
  { to: '/venues', label: 'Venues' },
  { to: '/artists', label: 'Artists' },
  { to: '/about', label: 'About' },
];

const supportLinks = [
  { to: '/help', label: 'Help & FAQ' },
  { to: '/contact', label: 'Contact' },
  { to: '/refund', label: 'Refund Policy' },
];

const legalLinks = [
  { to: '/terms', label: 'Terms' },
  { to: '/privacy', label: 'Privacy' },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
                <Ticket className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                Seat<span className="gradient-text">Sphere</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Explore venues in 3D, preview your stage view and book the perfect seat with confidence.
            </p>
            <div className="mt-6 flex gap-3">
              {[Twitter, Instagram, Facebook, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-primary hover:text-white"
                  aria-label="Social link"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">Product</h4>
            <ul className="mt-4 space-y-2">
              {productLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-muted-foreground hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">Support</h4>
            <ul className="mt-4 space-y-2">
              {supportLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-muted-foreground hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">Legal</h4>
            <ul className="mt-4 space-y-2">
              {legalLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-muted-foreground hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} SeatSphere. Demo platform — all data is sample data.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with React, Three.js & Supabase
          </p>
        </div>
      </div>
    </footer>
  );
}
