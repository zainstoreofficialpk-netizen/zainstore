"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { toggleWishlistAction } from "@/lib/customer/wishlist-actions";

type Props = {
  productId: string;
  initialInWishlist?: boolean;
  size?: number;
  className?: string;
  showLabel?: boolean;
};

export function WishlistButton({
  productId,
  initialInWishlist = false,
  size = 18,
  className,
  showLabel = false,
}: Props) {
  const [inWishlist, setInWishlist] = useState(initialInWishlist);
  const [isPending, startTransition] = useTransition();

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      const result = await toggleWishlistAction(productId);
      if (result.success) {
        setInWishlist(result.inWishlist ?? !inWishlist);
        toast(result.message, {
          icon: result.inWishlist ? "❤️" : "🤍",
          duration: 2000,
        });
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
      title={inWishlist ? "Remove from wishlist" : "Save to wishlist"}
      className={cn(
        "flex items-center gap-1.5 transition-all duration-150 disabled:opacity-50",
        inWishlist
          ? "text-rose-500 hover:text-rose-600"
          : "text-zinc-400 hover:text-rose-500",
        isPending && "scale-90",
        className,
      )}
    >
      <Heart
        size={size}
        className={cn(
          "transition-all duration-150",
          inWishlist ? "fill-rose-500 stroke-rose-500" : "fill-none stroke-current",
          isPending && "animate-pulse",
        )}
      />
      {showLabel && (
        <span className="text-xs font-medium">
          {inWishlist ? "Saved" : "Save"}
        </span>
      )}
    </button>
  );
}
