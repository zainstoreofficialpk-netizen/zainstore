"use client";

import { CartFlyProvider } from "./cart-fly-context";
import { FloatingCart } from "./floating-cart";
import { CartDrawer } from "./cart-drawer";

export function StorefrontProviders({ children }: { children: React.ReactNode }) {
  return (
    <CartFlyProvider>
      {children}
      <FloatingCart />
      <CartDrawer />
    </CartFlyProvider>
  );
}
