"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";

type ActionResult = { success: true; message: string } | { success: false; error: string };

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  return session.user;
}

function toSlug(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── Category actions ──────────────────────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
  parentId: z.string().optional().nullable(),
  commissionType: z.enum(["PERCENTAGE_OF_SALE", "FIXED_AMOUNT"]).optional().nullable(),
  commissionValue: z.coerce.number().min(0).optional().nullable(),
});

export async function createCategoryAction(data: {
  name: string;
  slug: string;
  parentId?: string | null;
  commissionType?: string | null;
  commissionValue?: number | null;
}): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = categorySchema.safeParse(data);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const slugTaken = await db.category.findUnique({ where: { slug: parsed.data.slug } });
    if (slugTaken) return { success: false, error: "This slug is already in use." };

    await db.category.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        parentId: parsed.data.parentId || null,
        commissionType: (parsed.data.commissionType as any) || null,
        commissionValue: parsed.data.commissionValue ?? null,
      },
    });

    revalidatePath("/admin/categories");
    return { success: true, message: `Category "${parsed.data.name}" created.` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create category." };
  }
}

export async function updateCategoryAction(
  id: string,
  data: {
    name: string;
    slug: string;
    parentId?: string | null;
    commissionType?: string | null;
    commissionValue?: number | null;
  },
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = categorySchema.safeParse(data);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    // Prevent circular parent (can't set own id as parent or a child as parent)
    if (parsed.data.parentId === id) return { success: false, error: "A category cannot be its own parent." };

    const slugConflict = await db.category.findFirst({
      where: { slug: parsed.data.slug, id: { not: id } },
    });
    if (slugConflict) return { success: false, error: "This slug is already in use." };

    await db.category.update({
      where: { id },
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        parentId: parsed.data.parentId || null,
        commissionType: (parsed.data.commissionType as any) || null,
        commissionValue: parsed.data.commissionValue ?? null,
      },
    });

    revalidatePath("/admin/categories");
    return { success: true, message: `Category "${parsed.data.name}" updated.` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update category." };
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const category = await db.category.findUnique({
      where: { id },
      include: { _count: { select: { children: true, products: true } } },
    });
    if (!category) return { success: false, error: "Category not found." };
    if (category._count.children > 0)
      return { success: false, error: "Remove sub-categories first before deleting this category." };
    if (category._count.products > 0)
      return { success: false, error: `This category has ${category._count.products} product(s). Reassign them first.` };

    await db.category.delete({ where: { id } });
    revalidatePath("/admin/categories");
    return { success: true, message: `Category "${category.name}" deleted.` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete category." };
  }
}

// ── Brand actions ─────────────────────────────────────────────────────────────

const brandSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
  logoUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export async function createBrandAction(data: {
  name: string;
  slug: string;
  logoUrl?: string;
}): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = brandSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const slugTaken = await db.brand.findUnique({ where: { slug: parsed.data.slug } });
    if (slugTaken) return { success: false, error: "This slug is already in use." };

    await db.brand.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        logoUrl: parsed.data.logoUrl || null,
      },
    });

    revalidatePath("/admin/brands");
    revalidatePath("/admin/categories");
    return { success: true, message: `Brand "${parsed.data.name}" created.` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create brand." };
  }
}

export async function updateBrandAction(
  id: string,
  data: { name: string; slug: string; logoUrl?: string },
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = brandSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const conflict = await db.brand.findFirst({ where: { slug: parsed.data.slug, id: { not: id } } });
    if (conflict) return { success: false, error: "This slug is already in use." };

    await db.brand.update({
      where: { id },
      data: { name: parsed.data.name, slug: parsed.data.slug, logoUrl: parsed.data.logoUrl || null },
    });

    revalidatePath("/admin/brands");
    return { success: true, message: `Brand "${parsed.data.name}" updated.` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update brand." };
  }
}

export async function deleteBrandAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const brand = await db.brand.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!brand) return { success: false, error: "Brand not found." };
    if (brand._count.products > 0)
      return { success: false, error: `This brand has ${brand._count.products} product(s). Reassign them first.` };

    await db.brand.delete({ where: { id } });
    revalidatePath("/admin/brands");
    return { success: true, message: `Brand "${brand.name}" deleted.` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete brand." };
  }
}
