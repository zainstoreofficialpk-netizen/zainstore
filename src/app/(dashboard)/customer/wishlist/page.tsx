import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Heart } from "lucide-react";

import { authOptions } from "@/lib/auth/config";
import { getWishlist } from "@/lib/customer/wishlist-actions";
import { WishlistView } from "@/components/customer/wishlist-view";

export default async function CustomerWishlistPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "CUSTOMER") redirect("/login");

  const items = await getWishlist(session.user.id);

  // Serialize Decimal → number for client component
  const serialized = items.map((item) => ({
    ...item,
    product: {
      ...item.product,
      price: Number(item.product.price),
      salePrice: item.product.salePrice ? Number(item.product.salePrice) : null,
    },
  }));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Heart size={18} className="fill-rose-400 stroke-rose-400" />
          <h2 className="text-lg font-bold text-zinc-950">My Wishlist</h2>
        </div>
        <p className="mt-0.5 text-sm text-zinc-400">
          Products you've saved. Items persist across sessions.
        </p>
      </div>
      <WishlistView items={serialized} />
    </div>
  );
}
