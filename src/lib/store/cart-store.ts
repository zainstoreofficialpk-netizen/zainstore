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
  variantId?: string | null;
  variantName?: string | null;
  sku?: string | null;
};

function sameLine(a: { id: string; variantId?: string | null }, b: { id: string; variantId?: string | null }) {
  return a.id === b.id && (a.variantId ?? null) === (b.variantId ?? null);
}

type CartStore = {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string, variantId?: string | null) => void;
  updateQty: (id: string, delta: number, variantId?: string | null) => void;
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
          const hit = state.items.find((i) => sameLine(i, item));
          if (hit) {
            return {
              items: state.items.map((i) =>
                sameLine(i, item) ? { ...i, quantity: i.quantity + 1 } : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        }),
      removeItem: (id, variantId = null) =>
        set((state) => ({ items: state.items.filter((i) => !sameLine(i, { id, variantId })) })),
      updateQty: (id, delta, variantId = null) =>
        set((state) => ({
          items: state.items
            .map((i) => (sameLine(i, { id, variantId }) ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
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
