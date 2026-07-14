"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle, Package, Upload, Loader2 } from "lucide-react";
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
  variants: { name: string; sku: string | null; options: any; price: any; salePrice: any; stock: number; stockStatus: string; imageUrl: string | null; isActive: boolean }[];
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
      stockStatus: v.stockStatus ?? "IN_STOCK",
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
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingSlot, setPendingSlot] = useState<number | null>(null);

  // ── Variant handlers ─────────────────────────────────────────
  const [variantImgUploading, setVariantImgUploading] = useState<number | null>(null);
  const variantFileInputRef = useRef<HTMLInputElement>(null);
  const [pendingVariantSlot, setPendingVariantSlot] = useState<number | null>(null);

  function updateVariant(i: number, field: string, value: string | boolean) {
    const updated = [...form.variants];
    updated[i] = { ...updated[i], [field]: value };
    setForm({ ...form, variants: updated });
  }

  function removeVariant(i: number) {
    setForm({ ...form, variants: form.variants.filter((_, idx) => idx !== i) });
  }

  async function uploadVariantImage(file: File, index: number) {
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      toast.error("Only JPG, PNG, WEBP or GIF allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }
    setVariantImgUploading(index);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "image");
      const res = await fetch("/api/vendor/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        updateVariant(index, "imageUrl", data.url);
        toast.success("Variant image uploaded.");
      } else {
        toast.error(data.error ?? "Upload failed.");
      }
    } catch {
      toast.error("Upload failed.");
    } finally {
      setVariantImgUploading(null);
      setPendingVariantSlot(null);
    }
  }

  async function uploadImage(file: File, slotIndex: number) {
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      toast.error("Only JPG, PNG, WEBP or GIF allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }
    setUploadingIdx(slotIndex);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "image");
      const res = await fetch("/api/vendor/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        const imgs = [...form.images];
        if (slotIndex < imgs.length) {
          imgs[slotIndex] = { ...imgs[slotIndex], url: data.url };
        } else {
          imgs.push({ url: data.url, alt: form.name, sortOrder: imgs.length });
        }
        setForm({ ...form, images: imgs });
        toast.success("Image uploaded.");
      } else {
        toast.error(data.error ?? "Upload failed.");
      }
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploadingIdx(null);
      setPendingSlot(null);
    }
  }

  function validate(): string | null {
    if (!form.name.trim()) return "Product name is required.";
    if (!form.description.trim()) return "Full description is required.";
    if (!form.categoryId) return "Please select a category.";
    if (!form.price || parseFloat(form.price) <= 0) return "Regular price is required.";
    if (form.salePrice && parseFloat(form.salePrice) >= parseFloat(form.price))
      return "Sale price must be lower than regular price.";
    if (!form.weight || parseInt(form.weight) <= 0) return "Product weight (grams) is required.";
    if (form.images.filter((img) => img.url).length === 0)
      return "At least one product image is required.";
    return null;
  }

  function handleSubmit(targetStatus: "DRAFT" | "PENDING_REVIEW" | "KEEP") {
    if (targetStatus === "PENDING_REVIEW") {
      const error = validate();
      if (error) {
        const isWeightError = error.includes("weight");
        setWeightError(isWeightError);
        toast.error(error);
        if (isWeightError) {
          document.getElementById("product-weight-field")?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }
    }
    setWeightError(false);
    const resolvedStatus = targetStatus === "KEEP"
      ? (product.status as "DRAFT" | "PENDING_REVIEW" | "ACTIVE")
      : targetStatus;
    startTransition(async () => {
      const r = await updateProductAction(product.id, { ...form, status: resolvedStatus });
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
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && pendingSlot !== null) uploadImage(file, pendingSlot);
              e.target.value = "";
            }}
          />
          {form.images.map((img, i) => (
            <div key={i} className="flex items-center gap-3">
              {/* Thumbnail / upload slot */}
              <button
                type="button"
                title="Click to replace image"
                onClick={() => { setPendingSlot(i); fileInputRef.current?.click(); }}
                className="relative size-12 shrink-0 rounded-md overflow-hidden border border-zinc-200 bg-zinc-50 hover:border-brand-400 transition-colors"
              >
                {uploadingIdx === i ? (
                  <span className="flex items-center justify-center h-full">
                    <Loader2 size={16} className="animate-spin text-brand-500" />
                  </span>
                ) : img.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                ) : (
                  <span className="flex items-center justify-center h-full">
                    <Upload size={14} className="text-zinc-400" />
                  </span>
                )}
              </button>
              <Input value={img.url} onChange={(e) => {
                const imgs = [...form.images];
                imgs[i] = { ...imgs[i], url: e.target.value };
                setForm({ ...form, images: imgs });
              }} placeholder="Image URL or click thumbnail to upload" className="flex-1" />
              <button
                type="button"
                onClick={() => setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) })}
                className="shrink-0 text-zinc-300 hover:text-rose-500 text-lg leading-none"
              >×</button>
            </div>
          ))}
          <div className="flex gap-2 flex-wrap">
            <Button type="button" size="sm" variant="outline" onClick={() => {
              setPendingSlot(form.images.length);
              fileInputRef.current?.click();
            }}>
              <Upload size={13} className="mr-1" /> Upload Image
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setForm({ ...form, images: [...form.images, { url: "", alt: form.name, sortOrder: form.images.length }] })}>
              + Add by URL
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Variants */}
      {form.variants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Variants</CardTitle>
            <p className="mt-0.5 text-xs text-zinc-400">
              Set a specific image, price, sale price, stock, SKU, and availability for each variation.
              Customers will see this exact image and price when they select it. To add brand-new
              variation combinations (e.g. a new color), recreate them from the &ldquo;New Product&rdquo;
              attribute builder — here you can edit or remove the existing ones.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {/* Hidden file input for variant images */}
            <input
              ref={variantFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && pendingVariantSlot !== null) uploadVariantImage(file, pendingVariantSlot);
                e.target.value = "";
              }}
            />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-100 bg-zinc-50/50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Image</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Variant</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">SKU</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Price</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Sale Price</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Stock</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Availability</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Active</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {form.variants.map((v, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          title="Click to upload variant image"
                          onClick={() => { setPendingVariantSlot(i); variantFileInputRef.current?.click(); }}
                          className="relative size-12 shrink-0 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50 hover:border-brand-400 transition-colors"
                        >
                          {variantImgUploading === i ? (
                            <span className="flex items-center justify-center h-full">
                              <Loader2 size={16} className="animate-spin text-brand-500" />
                            </span>
                          ) : v.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={v.imageUrl} alt={v.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="flex items-center justify-center h-full">
                              <Upload size={14} className="text-zinc-400" />
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-medium text-zinc-800">{v.name}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          value={v.sku}
                          onChange={(e) => updateVariant(i, "sku", e.target.value)}
                          className="h-8 w-28 rounded border border-zinc-200 px-2 text-xs focus:border-brand-400 focus:outline-none"
                          placeholder="SKU-001"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          value={v.price}
                          onChange={(e) => updateVariant(i, "price", e.target.value)}
                          className="h-8 w-24 rounded border border-zinc-200 px-2 text-xs focus:border-brand-400 focus:outline-none"
                          placeholder={form.price}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          value={v.salePrice}
                          onChange={(e) => updateVariant(i, "salePrice", e.target.value)}
                          className="h-8 w-24 rounded border border-zinc-200 px-2 text-xs focus:border-brand-400 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          min={0}
                          value={v.stock}
                          onChange={(e) => updateVariant(i, "stock", e.target.value)}
                          className="h-8 w-20 rounded border border-zinc-200 px-2 text-xs focus:border-brand-400 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <select
                          value={v.stockStatus}
                          onChange={(e) => updateVariant(i, "stockStatus", e.target.value)}
                          className="h-8 rounded border border-zinc-200 px-2 text-xs focus:border-brand-400 focus:outline-none"
                        >
                          <option value="IN_STOCK">In Stock</option>
                          <option value="OUT_OF_STOCK">Out of Stock</option>
                          <option value="BACKORDER">Backorder</option>
                        </select>
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={v.isActive}
                          onChange={(e) => updateVariant(i, "isActive", e.target.checked)}
                          className="size-4 rounded border-zinc-300 text-brand-500 focus:ring-brand-500"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => removeVariant(i)}
                          className="text-zinc-300 hover:text-rose-500 text-lg leading-none"
                          title="Remove variant"
                        >×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

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
        {product.status === "ACTIVE" ? (
          <>
            <Button onClick={() => handleSubmit("KEEP")} disabled={isPending}>
              {isPending ? "Saving…" : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={() => handleSubmit("DRAFT")} disabled={isPending}>
              {isPending ? "Saving…" : "Unpublish (Save as Draft)"}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => handleSubmit("DRAFT")} disabled={isPending}>
              {isPending ? "Saving…" : "Save as Draft"}
            </Button>
            <Button onClick={() => handleSubmit("PENDING_REVIEW")} disabled={isPending}>
              {isPending ? "Submitting…" : "Save & Submit for Review"}
            </Button>
          </>
        )}
        <Link href="/vendor/products" className="ml-auto text-sm text-zinc-400 hover:text-zinc-600">Cancel</Link>
      </div>
    </div>
  );
}
