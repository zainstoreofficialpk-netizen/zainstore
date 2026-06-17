import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  imageUrl: string | null;
  storeName: string | null;
  storeId: string | null;
  vendorId: string | null;
  quantity: number;
  weightGrams: number; // product weight in grams, 0 if not set
};

type CartStore = {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, delta: number) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      addItem: (item) =>
        set((state) => {
          const hit = state.items.find((i) => i.id === item.id);
          if (hit) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        }),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      updateQty: (id, delta) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
            .filter((i) => i.quantity > 0),
        })),
      clearCart: () => set({ items: [] }),
    }),
    { name: "zainstore-cart" },
  ),
);

// Pure derived helpers (no hooks needed)
export const cartItemCount = (items: CartItem[]) =>
  items.reduce((s, i) => s + i.quantity, 0);

export const cartSubtotal = (items: CartItem[]) =>
  items.reduce((s, i) => s + (i.salePrice ?? i.price) * i.quantity, 0);
