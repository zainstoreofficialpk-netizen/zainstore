import { StorefrontProviders } from "@/components/storefront/storefront-providers";

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <StorefrontProviders>
      {children}
    </StorefrontProviders>
  );
}
