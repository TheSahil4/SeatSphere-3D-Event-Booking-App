import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle2, XCircle, AlertTriangle, ShoppingBag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { useBookingStore } from '@/stores/booking-store';
import { PageLoader } from '@/components/common/page-loader';
import { ErrorState } from '@/components/common/error-state';
import { EmptyState } from '@/components/common/empty-state';
import { formatINR } from '@/lib/format';
import type { Event, EventFoodItem } from '@/types/database';

export default function CheckoutPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const store = useBookingStore();

  const [attendees, setAttendees] = useState<{ name: string; email: string; phone: string }[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentState, setPaymentState] = useState<string>('initial');
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);

  const { data: event, isLoading } = useQuery({
    queryKey: ['event-by-id', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*, venue:venues(*)')
        .eq('id', eventId)
        .maybeSingle();
      if (error) throw error;
      return data as Event & { venue: { name: string; address: string; city: string } | null };
    },
    enabled: !!eventId,
  });

  const { data: foodItems } = useQuery({
    queryKey: ['event-food-items', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_food_items')
        .select('*, food_item:food_items(*), stall:food_stalls(*)')
        .eq('event_id', eventId!)
        .eq('is_available', true);
      if (error) throw error;
      return data as EventFoodItem[];
    },
    enabled: !!eventId,
  });

  // Initialize attendees when seats change
  useEffect(() => {
    setAttendees(
      store.selectedSeats.map((s) => ({
        name: user?.email ?? '',
        email: user?.email ?? '',
        phone: '',
      }))
    );
  }, [store.selectedSeats.length, user?.email]);

  const subtotal = useMemo(
    () => store.selectedSeats.reduce((sum, s) => sum + Number(s.price), 0),
    [store.selectedSeats]
  );
  const foodTotal = useMemo(
    () => store.foodItems.reduce((sum, f) => sum + f.unitPrice * f.quantity, 0),
    [store.foodItems]
  );
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const fee = Math.round(subtotal * 0.02 * 100) / 100;
  const total = subtotal + tax + fee + foodTotal;

  const confirmMutation = useMutation({
    mutationFn: async (simulate: 'success' | 'fail' | 'cancel') => {
      if (simulate === 'fail') throw new Error('Payment failed (simulated)');
      if (simulate === 'cancel') throw new Error('Payment cancelled');

      const seatIds = store.selectedSeats.map((s) => s.id);
      const attendeeJson = attendees.map((a) => ({
        name: a.name,
        email: a.email,
        phone: a.phone,
      }));

      const { data, error } = await supabase.rpc('confirm_booking_from_holds', {
        p_event_id: eventId!,
        p_event_seat_ids: seatIds,
        p_attendees: attendeeJson,
        p_food_total: foodTotal,
        p_payment_mode: 'demo',
        p_is_demo: true,
        p_provider_payment_id: 'demo-' + Date.now(),
      });

      if (error) throw error;
      const result = data as { ok: boolean; error?: string; booking_id?: string; booking_reference?: string };
      if (!result.ok) throw new Error(result.error ?? 'Booking failed');
      return result;
    },
    onSuccess: (data) => {
      setPaymentState('confirmed');
      setConfirmedBookingId(data.booking_id ?? null);
      store.reset();
      toast.success('Booking confirmed!');
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : 'Booking failed';
      if (msg.includes('cancelled')) {
        setPaymentState('cancelled');
      } else {
        setPaymentState('failed');
      }
      toast.error(msg);
    },
  });

  if (isLoading) return <PageLoader />;
  if (!event) return <ErrorState title="Event not found" />;

  if (store.selectedSeats.length === 0 && paymentState !== 'confirmed') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="No seats selected"
          description="Go back to the seat map to pick your seats first."
          action={<Button asChild><Link to={`/events/${event.slug}/book`}>Choose seats</Link></Button>}
        />
      </div>
    );
  }

  // Confirmation screen
  if (paymentState === 'confirmed' && confirmedBookingId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-bold">Booking confirmed!</h1>
        <p className="mt-2 text-muted-foreground">Your tickets have been generated. A QR code is available for each seat.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button className="gradient-primary" onClick={() => navigate(`/booking/${confirmedBookingId}/confirmed`)}>
            View tickets
          </Button>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>Go to dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to={`/events/${event.slug}/book`}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to seats
        </Link>
      </Button>

      <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
      <p className="mt-1 text-muted-foreground">{event.title} · {event.venue?.name}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Attendee details */}
          <Card className="bg-card p-6">
            <h2 className="mb-4 text-lg font-bold">Attendee details</h2>
            <div className="space-y-4">
              {store.selectedSeats.map((seat, i) => (
                <div key={seat.id} className="rounded-lg border border-border p-4">
                  <p className="mb-3 text-sm font-semibold">
                    Seat {seat.venue_seat?.label} · {seat.category_name} · {formatINR(Number(seat.price))}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Input
                      placeholder="Attendee name"
                      value={attendees[i]?.name ?? ''}
                      onChange={(e) => {
                        const next = [...attendees];
                        next[i] = { ...next[i], name: e.target.value };
                        setAttendees(next);
                      }}
                    />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={attendees[i]?.email ?? ''}
                      onChange={(e) => {
                        const next = [...attendees];
                        next[i] = { ...next[i], email: e.target.value };
                        setAttendees(next);
                      }}
                    />
                    <Input
                      placeholder="Phone"
                      value={attendees[i]?.phone ?? ''}
                      onChange={(e) => {
                        const next = [...attendees];
                        next[i] = { ...next[i], phone: e.target.value };
                        setAttendees(next);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Food */}
          {foodItems && foodItems.length > 0 && (
            <Card className="bg-card p-6">
              <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
                <ShoppingBag className="h-5 w-5 text-primary" /> Pre-order food
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">Optional. Collect at the stall with your QR code.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {foodItems.map((efi) => {
                  const inCart = store.foodItems.find((f) => f.eventFoodItemId === efi.id);
                  return (
                    <div key={efi.id} className="flex gap-3 rounded-lg border border-border p-3">
                      {efi.food_item?.image_url && (
                        <img src={efi.food_item.image_url} alt="" className="h-16 w-16 rounded-md object-cover" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{efi.food_item?.name}</p>
                          <span className={`h-2 w-2 rounded-full ${efi.food_item?.is_vegetarian ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        </div>
                        <p className="text-xs text-muted-foreground">{formatINR(Number(efi.event_price))}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => store.updateFoodQuantity(efi.id, (inCart?.quantity ?? 0) - 1)}
                            disabled={!inCart}
                          >−</Button>
                          <span className="w-6 text-center text-sm">{inCart?.quantity ?? 0}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              store.addFood({
                                eventFoodItemId: efi.id,
                                name: efi.food_item?.name ?? '',
                                unitPrice: Number(efi.event_price),
                                quantity: 1,
                                isVegetarian: efi.food_item?.is_vegetarian ?? true,
                              })
                            }
                          >+</Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Payment */}
          <Card className="bg-card p-6">
            <h2 className="mb-4 text-lg font-bold">Payment</h2>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-amber-400">
                <AlertTriangle className="h-4 w-4" /> Demo Payment Mode
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                No real payment will be processed. Choose a simulation below.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                className="gradient-primary"
                disabled={!termsAccepted || confirmMutation.isPending || paymentState === 'processing'}
                onClick={() => { setPaymentState('processing'); confirmMutation.mutate('success'); }}
              >
                {confirmMutation.isPending && paymentState === 'processing' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Simulate success
              </Button>
              <Button
                variant="outline"
                disabled={confirmMutation.isPending}
                onClick={() => { setPaymentState('failed'); confirmMutation.mutate('fail'); }}
              >
                <XCircle className="mr-2 h-4 w-4" /> Simulate failure
              </Button>
              <Button
                variant="ghost"
                disabled={confirmMutation.isPending}
                onClick={() => { setPaymentState('cancelled'); confirmMutation.mutate('cancel'); }}
              >
                Cancel
              </Button>
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="h-4 w-4 rounded accent-primary"
              />
              I agree to the terms and conditions and cancellation policy.
            </label>
          </Card>
        </div>

        {/* Order summary */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card className="bg-card p-6">
            <h2 className="mb-4 text-lg font-bold">Order summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Seats ({store.selectedSeats.length})</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              {foodTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Food</span>
                  <span>{formatINR(foodTotal)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (5%)</span>
                <span>{formatINR(tax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Convenience fee (2%)</span>
                <span>{formatINR(fee)}</span>
              </div>
              <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-bold">
                <span>Total</span>
                <span className="text-primary">{formatINR(total)}</span>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {store.selectedSeats.map((s) => (
                <div key={s.id} className="flex justify-between text-xs text-muted-foreground">
                  <span>{s.venue_seat?.label} · {s.category_name}</span>
                  <span>{formatINR(Number(s.price))}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
