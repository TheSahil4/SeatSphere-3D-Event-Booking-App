import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EventSeatWithSeat } from '@/types/database';

export interface CartFoodItem {
  eventFoodItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  isVegetarian: boolean;
}

interface BookingState {
  eventId: string | null;
  selectedSeats: EventSeatWithSeat[];
  foodItems: CartFoodItem[];
  holdExpiresAt: string | null;
  setEventId: (id: string | null) => void;
  addSeat: (seat: EventSeatWithSeat) => void;
  removeSeat: (eventSeatId: string) => void;
  clearSeats: () => void;
  setHoldExpiresAt: (iso: string | null) => void;
  addFood: (item: CartFoodItem) => void;
  updateFoodQuantity: (eventFoodItemId: string, quantity: number) => void;
  removeFood: (eventFoodItemId: string) => void;
  clearFood: () => void;
  reset: () => void;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      eventId: null,
      selectedSeats: [],
      foodItems: [],
      holdExpiresAt: null,
      setEventId: (id) => set({ eventId: id }),
      addSeat: (seat) =>
        set((s) => {
          if (s.selectedSeats.find((x) => x.id === seat.id)) return s;
          return { selectedSeats: [...s.selectedSeats, seat] };
        }),
      removeSeat: (eventSeatId) =>
        set((s) => ({
          selectedSeats: s.selectedSeats.filter((x) => x.id !== eventSeatId),
        })),
      clearSeats: () => set({ selectedSeats: [], holdExpiresAt: null }),
      setHoldExpiresAt: (iso) => set({ holdExpiresAt: iso }),
      addFood: (item) =>
        set((s) => {
          const existing = s.foodItems.find((x) => x.eventFoodItemId === item.eventFoodItemId);
          if (existing) {
            return {
              foodItems: s.foodItems.map((x) =>
                x.eventFoodItemId === item.eventFoodItemId
                  ? { ...x, quantity: x.quantity + item.quantity }
                  : x
              ),
            };
          }
          return { foodItems: [...s.foodItems, item] };
        }),
      updateFoodQuantity: (eventFoodItemId, quantity) =>
        set((s) => ({
          foodItems:
            quantity <= 0
              ? s.foodItems.filter((x) => x.eventFoodItemId !== eventFoodItemId)
              : s.foodItems.map((x) =>
                  x.eventFoodItemId === eventFoodItemId ? { ...x, quantity } : x
                ),
        })),
      removeFood: (eventFoodItemId) =>
        set((s) => ({
          foodItems: s.foodItems.filter((x) => x.eventFoodItemId !== eventFoodItemId),
        })),
      clearFood: () => set({ foodItems: [] }),
      reset: () => set({ eventId: null, selectedSeats: [], foodItems: [], holdExpiresAt: null }),
    }),
    { name: 'seatsphere-booking' }
  )
);
