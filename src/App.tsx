import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/use-auth';
import { PublicLayout } from '@/components/layout/public-layout';
import { RoleGuard } from '@/components/common/role-guard';
import { ErrorBoundary } from '@/components/common/error-boundary';
import { lazy, Suspense } from 'react';
import { PageLoader } from '@/components/common/page-loader';

const DebugPage = lazy(() => import('@/pages/debug'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const HomePage = lazy(() => import('@/pages/public/home'));
const EventsPage = lazy(() => import('@/pages/public/events'));
const EventDetailsPage = lazy(() => import('@/pages/public/event-details'));
const VenuesPage = lazy(() => import('@/pages/public/venues'));
const VenueDetailsPage = lazy(() => import('@/pages/public/venue-details'));
const ArtistsPage = lazy(() => import('@/pages/public/artists'));
const ArtistDetailsPage = lazy(() => import('@/pages/public/artist-details'));
const AboutPage = lazy(() => import('@/pages/public/about'));
const ContactPage = lazy(() => import('@/pages/public/contact'));
const HelpPage = lazy(() => import('@/pages/public/help'));
const TermsPage = lazy(() => import('@/pages/public/terms'));
const PrivacyPage = lazy(() => import('@/pages/public/privacy'));
const RefundPage = lazy(() => import('@/pages/public/refund'));
const NotFoundPage = lazy(() => import('@/pages/public/not-found'));

const CustomerLogin = lazy(() => import('@/pages/auth/customer-login'));
const CustomerRegister = lazy(() => import('@/pages/auth/customer-register'));
const AdminLogin = lazy(() => import('@/pages/auth/admin-login'));
const ManagerLogin = lazy(() => import('@/pages/auth/manager-login'));
const StaffLogin = lazy(() => import('@/pages/auth/staff-login'));

const BookingPage = lazy(() => import('@/pages/booking/booking-page'));
const CheckoutPage = lazy(() => import('@/pages/booking/checkout-page'));
const BookingConfirmationPage = lazy(() => import('@/pages/booking/confirmation-page'));

const CustomerDashboard = lazy(() => import('@/pages/customer/dashboard'));
const CustomerTickets = lazy(() => import('@/pages/customer/tickets'));
const CustomerBookings = lazy(() => import('@/pages/customer/bookings'));
const CustomerProfile = lazy(() => import('@/pages/customer/profile'));
const CustomerFoodOrders = lazy(() => import('@/pages/customer/food-orders'));
const CustomerSupport = lazy(() => import('@/pages/customer/support'));
const CustomerNotifications = lazy(() => import('@/pages/customer/notifications'));

const AdminDashboard = lazy(() => import('@/pages/admin/dashboard'));
const AdminEvents = lazy(() => import('@/pages/admin/events'));
const AdminEventEditor = lazy(() => import('@/pages/admin/event-editor'));
const AdminVenues = lazy(() => import('@/pages/admin/venues'));
const AdminArtists = lazy(() => import('@/pages/admin/artists'));
const AdminManagers = lazy(() => import('@/pages/admin/managers'));
const AdminBookings = lazy(() => import('@/pages/admin/bookings'));
const AdminReports = lazy(() => import('@/pages/admin/reports'));

const ManagerDashboard = lazy(() => import('@/pages/manager/dashboard'));
const ManagerEvents = lazy(() => import('@/pages/manager/events'));
const ManagerBookings = lazy(() => import('@/pages/manager/bookings'));
const ManagerSeatControl = lazy(() => import('@/pages/manager/seat-control'));

const StaffScanner = lazy(() => import('@/pages/staff/scanner'));
const StaffHistory = lazy(() => import('@/pages/staff/history'));

function AdminApp() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/events" element={<AdminEvents />} />
        <Route path="/events/new" element={<AdminEventEditor />} />
        <Route path="/events/:id/edit" element={<AdminEventEditor />} />
        <Route path="/venues" element={<AdminVenues />} />
        <Route path="/artists" element={<AdminArtists />} />
        <Route path="/managers" element={<AdminManagers />} />
        <Route path="/bookings" element={<AdminBookings />} />
        <Route path="/reports" element={<AdminReports />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Suspense>
  );
}

function ManagerApp() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<ManagerDashboard />} />
        <Route path="/events" element={<ManagerEvents />} />
        <Route path="/bookings" element={<ManagerBookings />} />
        <Route path="/seat-control" element={<ManagerSeatControl />} />
        <Route path="*" element={<Navigate to="/manager" replace />} />
      </Routes>
    </Suspense>
  );
}

function StaffApp() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<StaffScanner />} />
        <Route path="/scanner" element={<StaffScanner />} />
        <Route path="/history" element={<StaffHistory />} />
        <Route path="*" element={<Navigate to="/staff" replace />} />
      </Routes>
    </Suspense>
  );
}

function CustomerDashboardApp() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<CustomerDashboard />} />
        <Route path="/tickets" element={<CustomerTickets />} />
        <Route path="/bookings" element={<CustomerBookings />} />
        <Route path="/profile" element={<CustomerProfile />} />
        <Route path="/food-orders" element={<CustomerFoodOrders />} />
        <Route path="/support" element={<CustomerSupport />} />
        <Route path="/notifications" element={<CustomerNotifications />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:slug" element={<EventDetailsPage />} />
                <Route path="/venues" element={<VenuesPage />} />
                <Route path="/venues/:slug" element={<VenueDetailsPage />} />
                <Route path="/artists" element={<ArtistsPage />} />
                <Route path="/artists/:slug" element={<ArtistDetailsPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/refund" element={<RefundPage />} />
                <Route path="/debug" element={<DebugPage />} />

                <Route path="/login" element={<CustomerLogin />} />
                <Route path="/register" element={<CustomerRegister />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/manager/login" element={<ManagerLogin />} />
                <Route path="/staff/login" element={<StaffLogin />} />

                <Route
                  path="/events/:slug/book"
                  element={
                    <RoleGuard roles={['customer']} fallback="/login">
                      <BookingPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/checkout/:eventId"
                  element={
                    <RoleGuard roles={['customer']} fallback="/login">
                      <CheckoutPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/booking/:bookingId/confirmed"
                  element={
                    <RoleGuard roles={['customer']} fallback="/login">
                      <BookingConfirmationPage />
                    </RoleGuard>
                  }
                />
              </Route>

              <Route
                path="/dashboard/*"
                element={
                  <RoleGuard roles={['customer']} fallback="/login">
                    <CustomerDashboardApp />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/*"
                element={
                  <RoleGuard roles={['admin']} fallback="/admin/login">
                    <AdminApp />
                  </RoleGuard>
                }
              />
              <Route
                path="/manager/*"
                element={
                  <RoleGuard roles={['manager']} fallback="/manager/login">
                    <ManagerApp />
                  </RoleGuard>
                }
              />
              <Route
                path="/staff/*"
                element={
                  <RoleGuard roles={['gate_staff']} fallback="/staff/login">
                    <StaffApp />
                  </RoleGuard>
                }
              />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
