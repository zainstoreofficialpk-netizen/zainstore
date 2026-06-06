import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { getWishlistCount, getWishlistProductIds } from "@/lib/customer/wishlist-actions";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ count: 0, productIds: [] });
  }

  const [count, productIds] = await Promise.all([
    getWishlistCount(session.user.id),
    getWishlistProductIds(session.user.id),
  ]);

  return NextResponse.json({ count, productIds });
}
