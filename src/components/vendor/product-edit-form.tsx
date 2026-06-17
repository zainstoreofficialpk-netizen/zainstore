"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle, Package } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { updateProductAction, type ProductFormData } from "@/lib/vendor/product-actions";
import { calculateShipping, type ShippingSettings } from "@/lib/shipping";

type Category = { id: string; name: string; parentId: string | null };
type Brand = { id: string; name: string };
type Product = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string;
  sku: string | null;
  barcode: string | null;
  tags: string[];
  brandId: string | null;
  categoryId: string | null;
  price: any;
  salePrice: any;
  costPrice: any;
  taxRate: any;
  stock: number;
  lowStockThreshold: number;
  stockStatus: string;
  trackInventory: boolean;
  weight: any;
  length: any;
  width: any;
  height: any;
  shippingType: string;
  videoUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  status: string;
  rejectionReason: string | null;
  adminNote: string | null;
  images: { url: string; alt: string | null; sortOrder: number }[];
  variants: { name: string; sku: string | null; options: any; price: any; salePrice: any; stock: number; imageUrl: string | null; isActive: boolean }[];
};

function toSlug(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "muted"> = {
  DRAFT: "muted", PENDING_REVIEW: "warning", ACTIVE: "success", REJECTED: "danger", ARCHIVED: "muted",
};

export function ProductEditForm({
  product,
  categories,
  brands,
  shippingSettings,
}: {
  product: Product;
  categories: Category[];
  brands: Brand[];
  shippingSettings: ShippingSettings;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tagInput, setTagInput] = useState("");

  const [form, setForm] = useState<ProductFormData>({
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription ?? "",
    description: product.description,
    sku: product.sku ?? "",
    barcode: product.barcode ?? "",
    tags: product.tags ?? [],
    brandId: product.brandId ?? "",
    categoryId: product.categoryId ?? "",
    images: product.images.map((img) => ({ url: img.url, alt: img.alt ?? "", sortOrder: img.sortOrder })),
    videoUrl: product.videoUrl ?? "",
    price: String(product.price ?? ""),
    salePrice: String(product.salePrice ?? ""),
    costPrice: String(product.costPrice ?? ""),
    taxRate: String(product.taxRate ?? ""),
    stock: String(product.stock),
    lowStockThreshold: String(product.lowStockThreshold),
    stockStatus: product.stockStatus ?? "IN_STOCK",
    trackInventory: product.trackInventory ?? true,
    variants: product.variants.map((v) => ({
      name: v.name,
      sku: v.sku ?? "",
      price: String(v.price ?? ""),
      salePrice: String(v.salePrice ?? ""),
      stock: String(v.stock),
      imageUrl: v.imageUrl ?? "",
      options: (v.options as Record<string, string>) ?? {},
      isActive: v.isActive ?? true,
    })),
    weight: String(product.weight ?? ""),
    length: String(product.length ?? ""),
    width: String(product.width ?? ""),
    height: String(product.height ?? ""),
    shippingType: product.shippingType ?? "paid",
    seoTitle: product.seoTitle ?? "",
    seoDescription: product.seoDescription ?? "",
    seoKeywords: product.seoKeywords ?? "",
    status: (product.status === "ACTIVE" || product.status === "REJECTED") ? "PENDING_REVIEW" : product.status as "DRAFT" | "PENDING_REVIEW",
  });

  const [weightError, setWeightError] = useState(false);

  function handleSubmit(targetStatus: "DRAFT" | "PENDING_REVIEW") {
    if (targetStatus === "PENDING_REVIEW" && (!form.weight || parseInt(form.weight) <= 0)) {
      setWeightError(true);
      toast.error("Product weight is required before submitting for review.");
      document.getElementById("product-weight-field")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setWeightError(false);
    startTransition(async () => {
      const r = await updateProductAction(product.id, { ...form, status: targetStatus });
      if (r.success) {
        toast.success(r.message);
        router.push("/vendor/products");
      } else {
        toast.error(r.error);
      }
    });
  }

  const parentCategories = categories.filter((c) => !c.parentId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/vendor/products" className="mb-2 flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700">
            <ArrowLeft size={14} /> Back to products
          </Link>
          <h2 className="text-xl font-bold text-zinc-950">Edit Product</h2>
        </div>
        <Badge tone={STATUS_TONE[product.status] ?? "muted"}>{product.status.replace("_", " ")}</Badge>
      </div>

      {/* Rejection notice */}
      {product.status === "REJECTED" && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-500" />
            <div>
              <p className="font-semibold text-rose-800">Product Rejected</p>
              {product.rejectionReason && <p className="mt-1 text-sm text-rose-700">Reason: {product.rejectionReason}</p>}
              {product.adminNote && <p className="mt-1 text-sm text-rose-600">Admin note: {product.adminNote}</p>}
              <p className="mt-2 text-xs text-rose-600">Update your product and resubmit for review.</p>
            </div>
          </div>
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">Product Name *</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Slug</label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: toSlug(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">SKU</label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Category</label>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:border-brand-400 focus:outline-none">
                <option value="">Select…</option>
                {parentCategories.map((p) => (
                  <optgroup key={p.id} label={p.name}>
                    <option value={p.id}>{p.name}</option>
                    {categories.filter((c) => c.parentId === p.id).map((c) => (
                      <option key={c.id} value={c.id}>— {c.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Brand</label>
              <select value={form.brandId} onChange={(e) => setForm({ ...form, brandId: e.target.value })}
                className="w-full h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:border-brand-400 focus:outline-none">
                <option value="">Select…</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">Description *</label>
            <textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full resize-y rounded-md border border-zinc-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Price (PKR) *</label>
              <Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Sale Price (PKR)</label>
              <Input type="number" min={0} value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory */}
      <Card>
        <CardHeader><CardTitle>Inventory</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Stock</label>
              <Input type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Low Stock Alert</label>
              <Input type="number" min={0} value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Stock Status</label>
              <select value={form.stockStatus} onChange={(e) => setForm({ ...form, stockStatus: e.target.value })}
                className="w-full h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:border-brand-400 focus:outline-none">
                <option value="IN_STOCK">In Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
                <option value="BACKORDER">Backorder</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader><CardTitle>Images</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {form.images.map((img, i) => (
            <div key={i} className="flex items-center gap-3">
              <img src={img.url} alt={img.alt} className="size-12 rounded-md object-cover border border-zinc-200" />
              <Input value={img.url} onChange={(e) => {
                const imgs = [...form.images];
                imgs[i] = { ...imgs[i], url: e.target.value };
                setForm({ ...form, images: imgs });
              }} placeholder="Image URL" className="flex-1" />
              <button onClick={() => setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) })}
                className="shrink-0 text-zinc-300 hover:text-rose-500">×</button>
            </div>
          ))}
          <Button type="button" size="sm" variant="outline" onClick={() => setForm({ ...form, images: [...form.images, { url: "", alt: form.name, sortOrder: form.images.length }] })}>
            + Add Image URL
          </Button>
        </CardContent>
      </Card>

      {/* Weight & Shipping */}
      <Card>
        <CardHeader>
          <CardTitle>Weight & Shipping</CardTitle>
          <p className="mt-0.5 text-xs text-zinc-400">Pakistan COD only — charge calculated from weight.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div id="product-weight-field">
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Product Weight (grams) <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              min={1}
              step={1}
              value={form.weight}
              onChange={(e) => { setForm({ ...form, weight: e.target.value }); setWeightError(false); }}
              placeholder="e.g. 750"
              className={weightError ? "border-rose-400 focus-visible:ring-rose-300" : ""}
            />
            {weightError && (
              <p className="mt-1.5 text-xs text-rose-500">
                Weight is required to calculate delivery charges for customers.
              </p>
            )}
            {!form.weight && !weightError && (
              <p className="mt-1.5 text-xs text-amber-600">
                ⚠️ Without weight, delivery charges cannot be calculated at checkout.
              </p>
            )}
          </div>

          {(() => {
            const weightG = parseInt(form.weight) || 0;
            const price = parseFloat(form.price) || 0;
            if (!weightG) return null;
            const shipping = calculateShipping(weightG, shippingSettings);
            if (!shipping.tier) return (
              <p className="text-sm text-amber-600">⚠️ No shipping rate for {weightG}g — contact admin.</p>
            );
            return (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-800">Shipping Cost</span>
                </div>
                <div className="flex justify-between text-sm text-zinc-700">
                  <span>Weight: {weightG}g · Tier: {shipping.tier.label}</span>
                  <span className="font-bold">{formatCurrency(shipping.price)}</span>
                </div>
                {price > 0 && (
                  <div className="border-t border-emerald-200 pt-2 space-y-1 text-sm">
                    <div className="flex justify-between text-zinc-600"><span>Product</span><span>{formatCurrency(price)}</span></div>
                    <div className="flex justify-between text-zinc-600"><span>Shipping</span><span>{formatCurrency(shipping.price)}</span></div>
                    <div className="flex justify-between font-bold text-zinc-900 border-t border-emerald-200 pt-1"><span>Customer pays</span><span>{formatCurrency(price + shipping.price)}</span></div>
                  </div>
                )}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Save actions */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <Button variant="outline" onClick={() => handleSubmit("DRAFT")} disabled={isPending}>
          {isPending ? "Saving…" : "Save as Draft"}
        </Button>
        <Button onClick={() => handleSubmit("PENDING_REVIEW")} disabled={isPending}>
          {isPending ? "Submitting…" : "Save & Submit for Review"}
        </Button>
        <Link href="/vendor/products" className="ml-auto text-sm text-zinc-400 hover:text-zinc-600">Cancel</Link>
      </div>
    </div>
  );
}
