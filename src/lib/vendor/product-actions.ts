"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { ProductStatus, NotificationType } from "@prisma/client";
import { z } from "zod";

import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";

type ActionResult<T = void> =
  | { success: true; message: string; data?: T }
  | { success: false; error: string };

async function requireVendor() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "VENDOR") throw new Error("Forbidden");
  const vendor = await db.vendorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, store: { select: { id: true } } },
  });
  if (!vendor) throw new Error("Vendor profile not found");
  return { user: session.user, vendor };
}

// ── Schema ────────────────────────────────────────────────────────────────────

export type ProductFormData = {
  // Step 1
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  sku: string;
  barcode: string;
  brandId: string;
  categoryId: string;
  tags: string[];
  // Step 2
  images: { url: string; alt: string; sortOrder: number }[];
  videoUrl: string;
  // Step 3
  price: string;
  salePrice: string;
  costPrice: string;
  taxRate: string;
  // Step 4
  stock: string;
  lowStockThreshold: string;
  stockStatus: string;
  trackInventory: boolean;
  // Step 5 — variants
  variants: {
    name: string;
    sku: string;
    price: string;
    salePrice: string;
    stock: string;
    imageUrl: string;
    options: Record<string, string>;
    isActive: boolean;
  }[];
  // Step 6
  weight: string;
  length: string;
  width: string;
  height: string;
  shippingType: string;
  // Step 7
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  // Step 8
  status: "DRAFT" | "PENDING_REVIEW";
};

// ── Create product ────────────────────────────────────────────────────────────

export async function createProductAction(
  data: ProductFormData,
): Promise<ActionResult<{ productId: string }>> {
  try {
    const { vendor } = await requireVendor();
    if (!vendor.store?.id) return { success: false, error: "You must have a store to create products." };

    // Check slug uniqueness
    const slugExists = await db.product.findUnique({ where: { slug: data.slug } });
    if (slugExists) return { success: false, error: "This slug is already in use. Please modify it." };

    // Check SKU uniqueness
    if (data.sku) {
      const skuExists = await db.product.findUnique({ where: { sku: data.sku } });
      if (skuExists) return { success: false, error: "This SKU is already taken." };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createData: any = {
      vendorId: vendor.id,
      storeId: vendor.store.id,
      name: data.name,
      slug: data.slug,
      shortDescription: data.shortDescription || null,
      description: data.description,
      sku: data.sku || null,
      barcode: data.barcode || null,
      tags: data.tags,
      brandId: data.brandId || null,
      categoryId: data.categoryId || null,
      price: data.price,
      salePrice: data.salePrice || null,
      costPrice: data.costPrice || null,
      taxRate: data.taxRate || null,
      stock: parseInt(data.stock) || 0,
      lowStockThreshold: parseInt(data.lowStockThreshold) || 5,
      stockStatus: data.stockStatus || "IN_STOCK",
      trackInventory: data.trackInventory,
      weight: data.weight || null,
      length: data.length || null,
      width: data.width || null,
      height: data.height || null,
      shippingType: data.shippingType || "paid",
      videoUrl: data.videoUrl || null,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      seoKeywords: data.seoKeywords || null,
      status: data.status as ProductStatus,
      images: {
        create: data.images.map((img) => ({
          url: img.url,
          alt: img.alt || data.name,
          sortOrder: img.sortOrder,
        })),
      },
      variants: data.variants.length > 0
        ? {
            create: data.variants.map((v) => ({
              name: v.name,
              sku: v.sku || null,
              options: v.options as any,
              price: v.price || null,
              salePrice: v.salePrice || null,
              stock: parseInt(v.stock) || 0,
              imageUrl: v.imageUrl || null,
              isActive: v.isActive,
            })),
          }
        : undefined,
    };

    const product = await db.product.create({
      data: createData,
    });

    // If pending review, notify admin
    if (data.status === "PENDING_REVIEW") {
      const admin = await db.user.findFirst({ where: { role: "SUPER_ADMIN" }, select: { id: true } });
      if (admin) {
        await db.notification.create({
          data: {
            userId: admin.id,
            type: NotificationType.VENDOR,
            title: "New Product Pending Review",
            body: `"${data.name}" has been submitted for approval.`,
            data: { productId: product.id },
          },
        });
      }
    }

    revalidatePath("/vendor/products");
    return { success: true, message: "Product created successfully.", data: { productId: product.id } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create product." };
  }
}

// ── Update product ────────────────────────────────────────────────────────────

export async function updateProductAction(
  productId: string,
  data: ProductFormData,
): Promise<ActionResult> {
  try {
    const { vendor } = await requireVendor();

    const existing = await db.product.findFirst({ where: { id: productId, vendorId: vendor.id } });
    if (!existing) return { success: false, error: "Product not found." };

    // Check slug uniqueness (excluding this product)
    const slugConflict = await db.product.findFirst({
      where: { slug: data.slug, id: { not: productId } },
    });
    if (slugConflict) return { success: false, error: "This slug is already in use." };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      name: data.name,
      slug: data.slug,
      shortDescription: data.shortDescription || null,
      description: data.description,
      sku: data.sku || null,
      barcode: data.barcode || null,
      tags: data.tags,
      brandId: data.brandId || null,
      categoryId: data.categoryId || null,
      price: data.price,
      salePrice: data.salePrice || null,
      costPrice: data.costPrice || null,
      taxRate: data.taxRate || null,
      stock: parseInt(data.stock) || 0,
      lowStockThreshold: parseInt(data.lowStockThreshold) || 5,
      stockStatus: data.stockStatus,
      trackInventory: data.trackInventory,
      weight: data.weight || null,
      length: data.length || null,
      width: data.width || null,
      height: data.height || null,
      shippingType: data.shippingType,
      videoUrl: data.videoUrl || null,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      seoKeywords: data.seoKeywords || null,
      status: data.status as ProductStatus,
      rejectionReason: data.status === "PENDING_REVIEW" ? null : existing.rejectionReason,
      adminNote: data.status === "PENDING_REVIEW" ? null : (existing as any).adminNote,
    };

    await db.product.update({ where: { id: productId }, data: updateData });

    // Sync images: delete all, recreate
    await db.productImage.deleteMany({ where: { productId } });
    if (data.images.length > 0) {
      await db.productImage.createMany({
        data: data.images.map((img) => ({
          productId,
          url: img.url,
          alt: img.alt || data.name,
          sortOrder: img.sortOrder,
        })),
      });
    }

    // Sync variants: delete all, recreate
    await db.productVariant.deleteMany({ where: { productId } });
    if (data.variants.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db.productVariant.createMany as any)({
        data: data.variants.map((v) => ({
          productId,
          name: v.name,
          sku: v.sku || null,
          options: v.options as any,
          price: v.price || null,
          salePrice: v.salePrice || null,
          stock: parseInt(v.stock) || 0,
          imageUrl: v.imageUrl || null,
          isActive: v.isActive,
        })),
      });
    }

    revalidatePath("/vendor/products");
    revalidatePath(`/vendor/products/${productId}/edit`);
    return { success: true, message: "Product updated successfully." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update product." };
  }
}

// ── Delete product ────────────────────────────────────────────────────────────

export async function deleteProductAction(productId: string): Promise<ActionResult> {
  try {
    const { vendor } = await requireVendor();
    const product = await db.product.findFirst({ where: { id: productId, vendorId: vendor.id } });
    if (!product) return { success: false, error: "Product not found." };
    await db.product.delete({ where: { id: productId } });
    revalidatePath("/vendor/products");
    return { success: true, message: "Product deleted." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete product." };
  }
}

// ── Bulk delete ───────────────────────────────────────────────────────────────

export async function bulkDeleteProductsAction(productIds: string[]): Promise<ActionResult> {
  try {
    const { vendor } = await requireVendor();
    await db.product.deleteMany({ where: { id: { in: productIds }, vendorId: vendor.id } });
    revalidatePath("/vendor/products");
    return { success: true, message: `${productIds.length} products deleted.` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed." };
  }
}

// ── Bulk archive ──────────────────────────────────────────────────────────────

export async function bulkArchiveProductsAction(productIds: string[]): Promise<ActionResult> {
  try {
    const { vendor } = await requireVendor();
    await db.product.updateMany({
      where: { id: { in: productIds }, vendorId: vendor.id },
      data: { status: ProductStatus.ARCHIVED },
    });
    revalidatePath("/vendor/products");
    return { success: true, message: `${productIds.length} products archived.` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed." };
  }
}

// ── Duplicate product ─────────────────────────────────────────────────────────

export async function duplicateProductAction(productId: string): Promise<ActionResult<{ productId: string }>> {
  try {
    const { vendor } = await requireVendor();
    const original = await db.product.findFirst({
      where: { id: productId, vendorId: vendor.id },
      include: { images: true, variants: true },
    });
    if (!original) return { success: false, error: "Product not found." };

    const newSlug = `${original.slug}-copy-${Date.now().toString(36)}`;
    const newSku = original.sku ? `${original.sku}-COPY` : null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { id, createdAt, updatedAt, slug, sku, status, ...rest } = original as any;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const copy = await (db.product.create as any)({
      data: {
        ...rest,
        slug: newSlug,
        sku: newSku,
        name: `${original.name} (Copy)`,
        status: ProductStatus.DRAFT,
        viewCount: 0,
        images: {
          create: original.images.map(({ id: _, productId: __, ...img }: any) => img),
        },
        variants: {
          create: original.variants.map(({ id: _, productId: __, createdAt: _c, updatedAt: _u, ...v }: any) => ({
            ...v,
            options: v.options as any,
            sku: v.sku ? `${v.sku}-COPY` : null,
          })),
        },
      },
    });

    revalidatePath("/vendor/products");
    return { success: true, message: "Product duplicated as Draft.", data: { productId: copy.id } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to duplicate." };
  }
}

// ── Change status (vendor: DRAFT ↔ PENDING_REVIEW) ──────────────────────────

export async function changeProductStatusAction(
  productId: string,
  status: "DRAFT" | "PENDING_REVIEW" | "ARCHIVED",
): Promise<ActionResult> {
  try {
    const { vendor } = await requireVendor();
    const product = await db.product.findFirst({ where: { id: productId, vendorId: vendor.id } });
    if (!product) return { success: false, error: "Product not found." };
    await db.product.update({ where: { id: productId }, data: { status: status as ProductStatus } });
    revalidatePath("/vendor/products");
    return { success: true, message: `Product ${status === "PENDING_REVIEW" ? "submitted for review" : status.toLowerCase()}.` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed." };
  }
}
