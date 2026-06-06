"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";

type ActionResult = { success: true; message: string; inWishlist?: boolean } | { success: false; error: string };

async function requireCustomer() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "CUSTOMER") throw new Error("Forbidden");
  return session.user;
}

// ── Toggle (add if absent, remove if present) ─────────────────────────────────

export async function toggleWishlistAction(productId: string): Promise<ActionResult> {
  try {
    const user = await requireCustomer();

    const existing = await db.wishlist.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });

    if (existing) {
      await db.wishlist.delete({ where: { userId_productId: { userId: user.id, productId } } });
      revalidatePath("/customer/wishlist");
      return { success: true, message: "Removed from wishlist.", inWishlist: false };
    } else {
      // Verify product exists and is active
      const product = await db.product.findFirst({
        where: { id: productId, status: "ACTIVE" },
        select: { id: true },
      });
      if (!product) return { success: false, error: "Product not available." };

      await db.wishlist.create({ data: { userId: user.id, productId } });
      revalidatePath("/customer/wishlist");
      return { success: true, message: "Added to wishlist.", inWishlist: true };
    }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update wishlist." };
  }
}

// ── Remove single item ────────────────────────────────────────────────────────

export async function removeFromWishlistAction(productId: string): Promise<ActionResult> {
  try {
    const user = await requireCustomer();
    await db.wishlist.deleteMany({ where: { userId: user.id, productId } });
    revalidatePath("/customer/wishlist");
    return { success: true, message: "Removed from wishlist.", inWishlist: false };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to remove." };
  }
}

// ── Clear entire wishlist ─────────────────────────────────────────────────────

export async function clearWishlistAction(): Promise<ActionResult> {
  try {
    const user = await requireCustomer();
    await db.wishlist.deleteMany({ where: { userId: user.id } });
    revalidatePath("/customer/wishlist");
    return { success: true, message: "Wishlist cleared." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to clear wishlist." };
  }
}

// ── Data queries ──────────────────────────────────────────────────────────────

export async function getWishlist(userId: string) {
  return db.wishlist.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          salePrice: true,
          status: true,
          stockStatus: true,
          stock: true,
          images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true, alt: true } },
          vendor: { select: { id: true, store: { select: { name: true } } } },
          category: { select: { name: true } },
        },
      },
    },
  });
}

export async function getWishlistProductIds(userId: string): Promise<string[]> {
  const items = await db.wishlist.findMany({
    where: { userId },
    select: { productId: true },
  });
  return items.map((i) => i.productId);
}

export async function getWishlistCount(userId: string): Promise<number> {
  return db.wishlist.count({ where: { userId } });
}

export async function isInWishlist(userId: string, productId: string): Promise<boolean> {
  const item = await db.wishlist.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { id: true },
  });
  return !!item;
}
