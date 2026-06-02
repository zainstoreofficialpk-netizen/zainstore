"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, Image, Info,
  Package, Plus, Search, Tag, Trash2, X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createProductAction, type ProductFormData } from "@/lib/vendor/product-actions";
import { calculateShipping, type ShippingSettings } from "@/lib/shipping";

type Category = { id: string; name: string; parentId: string | null };
type Brand = { id: string; name: string };

// ── Slug generator ────────────────────────────────────────────────────────────

function toSlug(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── Step progress bar ─────────────────────────────────────────────────────────

const STEPS = [
  { num: 1, label: "Basic Info" },
  { num: 2, label: "Media" },
  { num: 3, label: "Pricing" },
  { num: 4, label: "Inventory" },
  { num: 5, label: "Variants" },
  { num: 6, label: "Shipping" },
  { num: 7, label: "SEO" },
  { num: 8, label: "Publish" },
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => (
          <div key={step.num} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div className={`flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                step.num < current
                  ? "bg-brand-500 text-white"
                  : step.num === current
                    ? "border-2 border-brand-500 text-brand-600"
                    : "border-2 border-zinc-200 text-zinc-400"
              }`}>
                {step.num < current ? <Check size={14} /> : step.num}
              </div>
              <span className={`mt-1.5 hidden text-[10px] font-medium sm:block ${step.num === current ? "text-brand-600" : "text-zinc-400"}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-1 h-0.5 flex-1 transition-colors ${step.num < current ? "bg-brand-500" : "bg-zinc-200"}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Default state ─────────────────────────────────────────────────────────────

const DEFAULT: ProductFormData = {
  name: "", slug: "", shortDescription: "", description: "", sku: "", barcode: "",
  brandId: "", categoryId: "", tags: [],
  images: [], videoUrl: "",
  price: "", salePrice: "", costPrice: "", taxRate: "",
  stock: "0", lowStockThreshold: "5", stockStatus: "IN_STOCK", trackInventory: true,
  variants: [],
  weight: "", length: "", width: "", height: "", shippingType: "paid",
  seoTitle: "", seoDescription: "", seoKeywords: "",
  status: "DRAFT",
};

// ── Step 1 — Basic Info ───────────────────────────────────────────────────────

function Step1({ form, setForm, categories, brands }: {
  form: ProductFormData;
  setForm: (f: ProductFormData) => void;
  categories: Category[];
  brands: Brand[];
}) {
  const [tagInput, setTagInput] = useState("");

  function addTag() {
    const tag = tagInput.trim().toLowerCase();
    if (!tag || form.tags.includes(tag)) { setTagInput(""); return; }
    setForm({ ...form, tags: [...form.tags, tag] });
    setTagInput("");
  }

  const parents = categories.filter((c) => !c.parentId);
  const children = (parentId: string) => categories.filter((c) => c.parentId === parentId);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Product Name <span className="text-rose-500">*</span></label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value, slug: toSlug(e.target.value) })}
            placeholder="e.g. Cotton Overshirt — Regular Fit"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Product Slug</label>
          <div className="flex gap-2">
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: toSlug(e.target.value) })}
              placeholder="auto-generated"
            />
            <Button type="button" size="sm" variant="outline" onClick={() => setForm({ ...form, slug: toSlug(form.name) })} className="shrink-0">
              Reset
            </Button>
          </div>
          <p className="mt-1 text-xs text-zinc-400">URL: /products/{form.slug || "your-slug"}</p>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Short Description</label>
          <textarea
            rows={2}
            value={form.shortDescription}
            onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
            placeholder="Brief summary shown in product listings…"
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Full Description <span className="text-rose-500">*</span></label>
          <textarea
            rows={6}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Detailed product description, features, specifications…"
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-y"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">SKU</label>
          <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="e.g. UL-COTTON-001" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Barcode (optional)</label>
          <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="EAN, UPC, ISBN…" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Category <span className="text-rose-500">*</span></label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="w-full h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:border-brand-400 focus:outline-none"
          >
            <option value="">Select category…</option>
            {parents.map((p) => (
              <optgroup key={p.id} label={p.name}>
                <option value={p.id}>{p.name}</option>
                {children(p.id).map((c) => (
                  <option key={c.id} value={c.id}>— {c.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Brand</label>
          <select
            value={form.brandId}
            onChange={(e) => setForm({ ...form, brandId: e.target.value })}
            className="w-full h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:border-brand-400 focus:outline-none"
          >
            <option value="">Select brand…</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Tags</label>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              placeholder="Add tag and press Enter"
            />
            <Button type="button" size="sm" variant="outline" onClick={addTag} className="shrink-0">Add</Button>
          </div>
          {form.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {form.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                  {tag}
                  <button onClick={() => setForm({ ...form, tags: form.tags.filter((t) => t !== tag) })} className="text-brand-400 hover:text-brand-700">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Step 2 — Media ────────────────────────────────────────────────────────────

function Step2({ form, setForm }: { form: ProductFormData; setForm: (f: ProductFormData) => void }) {
  const [urlInput, setUrlInput] = useState("");

  function addImage() {
    if (!urlInput.trim()) return;
    const newImg = { url: urlInput.trim(), alt: form.name, sortOrder: form.images.length };
    setForm({ ...form, images: [...form.images, newImg] });
    setUrlInput("");
  }

  function removeImage(i: number) {
    setForm({ ...form, images: form.images.filter((_, idx) => idx !== i).map((img, idx) => ({ ...img, sortOrder: idx })) });
  }

  function setPrimary(i: number) {
    const imgs = [...form.images];
    const [primary] = imgs.splice(i, 1);
    imgs.unshift(primary);
    setForm({ ...form, images: imgs.map((img, idx) => ({ ...img, sortOrder: idx })) });
  }

  return (
    <div className="space-y-6">
      {/* Images */}
      <Card>
        <CardHeader><CardTitle>Product Images</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImage())}
              placeholder="Paste image URL (JPG, PNG, WEBP)…"
            />
            <Button type="button" size="sm" variant="outline" onClick={addImage} className="shrink-0 gap-1.5">
              <Plus size={14} /> Add
            </Button>
          </div>
          <p className="text-xs text-zinc-400">Add up to 15 images. First image is the primary/featured image.</p>

          {form.images.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-zinc-200 py-10 text-center">
              <Image size={32} className="mx-auto mb-2 text-zinc-300" />
              <p className="text-sm text-zinc-400">No images added yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              {form.images.map((img, i) => (
                <div key={i} className={`group relative rounded-lg overflow-hidden border-2 ${i === 0 ? "border-brand-400" : "border-zinc-200"}`}>
                  <img src={img.url} alt={img.alt} className="aspect-square w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/150"; }} />
                  {i === 0 && (
                    <span className="absolute left-1 top-1 rounded-full bg-brand-500 px-1.5 py-0.5 text-[9px] font-bold text-white">Primary</span>
                  )}
                  <div className="absolute inset-0 hidden items-center justify-center gap-1 bg-black/40 group-hover:flex">
                    {i !== 0 && (
                      <button onClick={() => setPrimary(i)} className="rounded-md bg-white px-2 py-1 text-[10px] font-medium text-zinc-700 hover:bg-zinc-100">
                        Set primary
                      </button>
                    )}
                    <button onClick={() => removeImage(i)} className="grid size-6 place-items-center rounded-md bg-rose-500 text-white hover:bg-rose-600">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video */}
      <Card>
        <CardHeader>
          <CardTitle>Product Video</CardTitle>
          <p className="mt-0.5 text-xs text-zinc-400">Short demo video URL (MP4, max 10 seconds)</p>
        </CardHeader>
        <CardContent>
          <Input
            value={form.videoUrl}
            onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
            placeholder="https://example.com/product-demo.mp4"
          />
          {form.videoUrl && (
            <video src={form.videoUrl} controls className="mt-3 max-h-40 rounded-lg" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Step 3 — Pricing ──────────────────────────────────────────────────────────

function Step3({ form, setForm }: { form: ProductFormData; setForm: (f: ProductFormData) => void }) {
  const price = parseFloat(form.price) || 0;
  const salePrice = parseFloat(form.salePrice) || 0;
  const discount = price > 0 && salePrice > 0 && salePrice < price
    ? Math.round(((price - salePrice) / price) * 100)
    : 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Regular Price (PKR) <span className="text-rose-500">*</span></label>
          <Input type="number" min={0} step={1} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Sale Price (PKR)</label>
          <Input type="number" min={0} step={1} value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} placeholder="Leave blank for no sale" />
          {salePrice > 0 && salePrice >= price && (
            <p className="mt-1 text-xs text-rose-500">Sale price must be lower than regular price.</p>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Cost Price (PKR)</label>
          <Input type="number" min={0} step={1} value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} placeholder="Your cost (not shown to customers)" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Tax Rate (%)</label>
          <Input type="number" min={0} max={100} step={0.1} value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} placeholder="e.g. 17" />
        </div>
      </div>

      {/* Price preview */}
      {price > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
          <p className="mb-3 text-sm font-semibold text-zinc-700">Price Preview</p>
          <div className="flex items-center gap-4">
            {salePrice > 0 && salePrice < price ? (
              <>
                <span className="text-2xl font-bold text-zinc-950">PKR {salePrice.toLocaleString("en-PK")}</span>
                <span className="text-lg text-zinc-400 line-through">PKR {price.toLocaleString("en-PK")}</span>
                <Badge tone="danger" className="text-sm">{discount}% OFF</Badge>
              </>
            ) : (
              <span className="text-2xl font-bold text-zinc-950">PKR {price.toLocaleString("en-PK")}</span>
            )}
          </div>
          {form.costPrice && (
            <p className="mt-2 text-xs text-zinc-500">
              Margin: PKR {((salePrice || price) - parseFloat(form.costPrice)).toLocaleString("en-PK")} ({(((salePrice || price) - parseFloat(form.costPrice)) / (salePrice || price) * 100).toFixed(1)}%)
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Step 4 — Inventory ────────────────────────────────────────────────────────

function Step4({ form, setForm }: { form: ProductFormData; setForm: (f: ProductFormData) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Stock Quantity <span className="text-rose-500">*</span></label>
          <Input type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Low Stock Threshold</label>
          <Input type="number" min={0} value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} />
          <p className="mt-1 text-xs text-zinc-400">Alert when stock drops below this number.</p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">Stock Status</label>
          <select
            value={form.stockStatus}
            onChange={(e) => setForm({ ...form, stockStatus: e.target.value })}
            className="w-full h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:border-brand-400 focus:outline-none"
          >
            <option value="IN_STOCK">In Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
            <option value="BACKORDER">Backorder</option>
          </select>
        </div>
        <div className="flex items-center gap-3 self-end pb-1">
          <input
            type="checkbox"
            id="trackInventory"
            checked={form.trackInventory}
            onChange={(e) => setForm({ ...form, trackInventory: e.target.checked })}
            className="size-4 rounded border-zinc-300 text-brand-500 focus:ring-brand-500"
          />
          <label htmlFor="trackInventory" className="text-sm font-medium text-zinc-700">
            Track inventory for this product
          </label>
        </div>
      </div>

      {parseInt(form.stock) <= parseInt(form.lowStockThreshold) && parseInt(form.stock) >= 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">⚠️ Low stock warning</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Current stock ({form.stock}) is at or below your threshold ({form.lowStockThreshold}). Consider restocking.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Step 5 — Variants ─────────────────────────────────────────────────────────

type AttributeGroup = { name: string; values: string[] };

function Step5({ form, setForm }: { form: ProductFormData; setForm: (f: ProductFormData) => void }) {
  const [attrs, setAttrs] = useState<AttributeGroup[]>([]);
  const [attrName, setAttrName] = useState("");
  const [attrValue, setAttrValue] = useState("");
  const [selectedAttrIdx, setSelectedAttrIdx] = useState(0);
  const [generated, setGenerated] = useState(false);

  function addAttribute() {
    if (!attrName.trim()) return;
    setAttrs([...attrs, { name: attrName.trim(), values: [] }]);
    setAttrName("");
    setGenerated(false);
  }

  function addValue(attrIdx: number) {
    if (!attrValue.trim()) return;
    const updated = [...attrs];
    if (!updated[attrIdx].values.includes(attrValue.trim())) {
      updated[attrIdx].values.push(attrValue.trim());
    }
    setAttrs(updated);
    setAttrValue("");
    setGenerated(false);
  }

  function removeAttr(i: number) {
    setAttrs(attrs.filter((_, idx) => idx !== i));
    setGenerated(false);
  }

  function removeValue(attrIdx: number, valIdx: number) {
    const updated = [...attrs];
    updated[attrIdx].values.splice(valIdx, 1);
    setAttrs(updated);
    setGenerated(false);
  }

  function generateCombinations() {
    const validAttrs = attrs.filter((a) => a.values.length > 0);
    if (validAttrs.length === 0) { toast.error("Add at least one attribute with values."); return; }

    function cartesian(arrays: string[][]): string[][] {
      return arrays.reduce<string[][]>(
        (a, b) => a.flatMap((d) => b.map((e) => [...d, e])),
        [[]],
      );
    }

    const combos = cartesian(validAttrs.map((a) => a.values));
    const variants = combos.map((combo) => {
      const options: Record<string, string> = {};
      validAttrs.forEach((attr, i) => { options[attr.name] = combo[i]; });
      const name = combo.join(" / ");
      return {
        name,
        sku: "",
        price: form.price,
        salePrice: form.salePrice,
        stock: "0",
        imageUrl: "",
        options,
        isActive: true,
      };
    });

    setForm({ ...form, variants });
    setGenerated(true);
    toast.success(`Generated ${variants.length} variant combination${variants.length !== 1 ? "s" : ""}.`);
  }

  function updateVariant(i: number, field: string, value: string | boolean) {
    const updated = [...form.variants];
    updated[i] = { ...updated[i], [field]: value };
    setForm({ ...form, variants: updated });
  }

  function clearVariants() {
    setForm({ ...form, variants: [] });
    setAttrs([]);
    setGenerated(false);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm text-zinc-600">
          <strong>Optional.</strong> Use variants for products that come in different sizes, colors, etc. Skip this step for simple products.
        </p>
      </div>

      {/* Attribute builder */}
      <Card>
        <CardHeader><CardTitle>Define Variant Attributes</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* Add attribute */}
          <div className="flex gap-2">
            <Input
              value={attrName}
              onChange={(e) => setAttrName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAttribute())}
              placeholder="Attribute name (e.g. Size, Color, Storage)"
            />
            <Button type="button" size="sm" variant="outline" onClick={addAttribute} className="shrink-0 gap-1.5">
              <Plus size={14} /> Add
            </Button>
          </div>

          {attrs.length > 0 && (
            <div className="space-y-3">
              {/* Tab select */}
              <div className="flex gap-1 border-b border-zinc-100 pb-1">
                {attrs.map((attr, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedAttrIdx(i)}
                    className={`flex items-center gap-1.5 rounded-t-md px-3 py-1.5 text-sm font-medium ${selectedAttrIdx === i ? "border-b-2 border-brand-500 text-brand-600" : "text-zinc-500 hover:text-zinc-700"}`}
                  >
                    {attr.name}
                    <span className="rounded-full bg-zinc-100 px-1.5 text-xs">{attr.values.length}</span>
                    <button onClick={(e) => { e.stopPropagation(); removeAttr(i); }} className="ml-1 text-zinc-300 hover:text-rose-500">
                      <X size={12} />
                    </button>
                  </button>
                ))}
              </div>

              {/* Add value to selected attr */}
              <div className="flex gap-2">
                <Input
                  value={attrValue}
                  onChange={(e) => setAttrValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addValue(selectedAttrIdx))}
                  placeholder={`Add ${attrs[selectedAttrIdx]?.name ?? "value"}…`}
                />
                <Button type="button" size="sm" variant="outline" onClick={() => addValue(selectedAttrIdx)} className="shrink-0">Add</Button>
              </div>
              {attrs[selectedAttrIdx]?.values.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {attrs[selectedAttrIdx].values.map((val, vi) => (
                    <span key={vi} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                      {val}
                      <button onClick={() => removeValue(selectedAttrIdx, vi)} className="text-brand-400 hover:text-brand-700"><X size={11} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {attrs.length > 0 && (
            <div className="flex gap-3 pt-2">
              <Button type="button" onClick={generateCombinations} className="gap-2">
                Generate Combinations
              </Button>
              {form.variants.length > 0 && (
                <Button type="button" variant="outline" onClick={clearVariants}>Clear variants</Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated variants table */}
      {form.variants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{form.variants.length} Variant Combinations</CardTitle>
            <p className="mt-0.5 text-xs text-zinc-400">Set SKU, price, and stock for each combination.</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-100 bg-zinc-50/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Variant</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">SKU</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Price</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Sale Price</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Stock</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {form.variants.map((v, i) => (
                    <tr key={i}>
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
                        <input
                          type="checkbox"
                          checked={v.isActive}
                          onChange={(e) => updateVariant(i, "isActive", e.target.checked)}
                          className="size-4 rounded border-zinc-300 text-brand-500 focus:ring-brand-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Step 6 — Shipping ─────────────────────────────────────────────────────────

function Step6({
  form,
  setForm,
  shippingSettings,
}: {
  form: ProductFormData;
  setForm: (f: ProductFormData) => void;
  shippingSettings: ShippingSettings;
}) {
  // Weight stored as grams in the form (we convert to kg for DB)
  const weightG = parseInt(form.weight) || 0;
  const shipping = weightG > 0 ? calculateShipping(weightG, shippingSettings) : null;
  const price = form.price ? parseFloat(form.price) : 0;

  return (
    <div className="space-y-5">
      {/* COD info */}
      <div className="rounded-lg border border-brand-200 bg-brand-50 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Package size={15} className="text-brand-600" />
          <p className="text-sm font-semibold text-brand-800">Pakistan COD Shipping Only</p>
        </div>
        <p className="text-xs text-brand-700">
          Shipping charges are calculated automatically based on product weight. Cash on Delivery within Pakistan.
        </p>
      </div>

      {/* Weight — required, in grams */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
          Product Weight (grams) <span className="text-rose-500">*</span>
        </label>
        <Input
          type="number"
          min={1}
          step={1}
          value={form.weight}
          onChange={(e) => setForm({ ...form, weight: e.target.value })}
          placeholder="e.g. 750"
        />
        <p className="mt-1 text-xs text-zinc-400">
          Enter the total shipping weight in grams (product + packaging).
        </p>
      </div>

      {/* Live shipping cost preview */}
      {weightG > 0 && (
        <div className={`rounded-xl border p-4 ${shipping?.tier ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
            Calculated Shipping Cost
          </p>
          {shipping?.tier ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600">Weight: <strong>{weightG}g</strong> ({(weightG / 1000).toFixed(2)}kg)</span>
                <Badge tone="success">Tier matched</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600">Shipping tier: {shipping.tier.label}</span>
                <span className="text-lg font-bold text-zinc-900">PKR {shipping.price.toLocaleString("en-PK")}</span>
              </div>
              {price > 0 && (
                <div className="mt-3 border-t border-emerald-200 pt-3 space-y-1">
                  <div className="flex justify-between text-sm text-zinc-600">
                    <span>Product price</span>
                    <span>PKR {price.toLocaleString("en-PK")}</span>
                  </div>
                  <div className="flex justify-between text-sm text-zinc-600">
                    <span>Shipping (COD)</span>
                    <span>PKR {shipping.price.toLocaleString("en-PK")}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-zinc-900 border-t border-emerald-200 pt-1 mt-1">
                    <span>Customer pays</span>
                    <span>PKR {(price + shipping.price).toLocaleString("en-PK")}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-amber-700">
              No shipping rate configured for {weightG}g. Contact admin to add a rate tier.
            </p>
          )}
        </div>
      )}

      {/* Rate table reference */}
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700">Current Shipping Rates</p>
        <div className="overflow-hidden rounded-lg border border-zinc-200">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Weight Range</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500">Shipping Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {shippingSettings.tiers
                .sort((a, b) => a.minWeight - b.minWeight)
                .map((tier) => (
                  <tr
                    key={tier.id}
                    className={`${shipping?.tier?.id === tier.id ? "bg-brand-50" : ""}`}
                  >
                    <td className="px-4 py-2.5 text-zinc-700">
                      {shipping?.tier?.id === tier.id && (
                        <span className="mr-2 text-brand-500">●</span>
                      )}
                      {tier.minWeight}g – {tier.maxWeight}g
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-zinc-900">
                      PKR {tier.price.toLocaleString("en-PK")}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dimensions */}
      <div>
        <p className="mb-3 text-sm font-medium text-zinc-700">Dimensions (cm) — Optional</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Length", field: "length" },
            { label: "Width", field: "width" },
            { label: "Height", field: "height" },
          ].map(({ label, field }) => (
            <div key={field}>
              <label className="mb-1 block text-xs text-zinc-500">{label}</label>
              <Input
                type="number" min={0} step={0.1}
                value={(form as any)[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                placeholder="0"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 7 — SEO ──────────────────────────────────────────────────────────────

function Step7({ form, setForm }: { form: ProductFormData; setForm: (f: ProductFormData) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">SEO Title</label>
        <Input
          value={form.seoTitle}
          onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
          placeholder={form.name || "Product title for search engines"}
          maxLength={60}
        />
        <p className="mt-1 text-xs text-zinc-400">{form.seoTitle.length}/60 characters</p>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">Meta Description</label>
        <textarea
          rows={3}
          value={form.seoDescription}
          onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
          placeholder="Brief description for search engine results…"
          maxLength={160}
          className="w-full resize-none rounded-md border border-zinc-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        <p className="mt-1 text-xs text-zinc-400">{form.seoDescription.length}/160 characters</p>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">Meta Keywords</label>
        <Input
          value={form.seoKeywords}
          onChange={(e) => setForm({ ...form, seoKeywords: e.target.value })}
          placeholder="keyword1, keyword2, keyword3"
        />
      </div>

      {/* SEO Preview */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">Search Preview</p>
        <p className="text-lg font-medium text-blue-600 hover:underline cursor-pointer">
          {form.seoTitle || form.name || "Product Title"}
        </p>
        <p className="mt-0.5 text-sm text-green-700">zainstore.pk/products/{form.slug || "product-slug"}</p>
        <p className="mt-1 text-sm text-zinc-500">
          {form.seoDescription || form.shortDescription || "Product description will appear here in search results."}
        </p>
      </div>
    </div>
  );
}

// ── Step 8 — Status ───────────────────────────────────────────────────────────

function Step8({ form, setForm }: { form: ProductFormData; setForm: (f: ProductFormData) => void }) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <p className="text-sm font-semibold text-amber-800">⚠️ Vendor Note</p>
        <p className="mt-1 text-sm text-amber-700">
          Products submitted for review require <strong>Super Admin approval</strong> before becoming visible in the marketplace. You will receive a notification once reviewed.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          {
            value: "DRAFT",
            title: "Save as Draft",
            description: "Save now, submit for review later. Product is not visible to customers.",
            icon: "📝",
          },
          {
            value: "PENDING_REVIEW",
            title: "Submit for Review",
            description: "Send to Super Admin for approval. Product will go live after approval.",
            icon: "🚀",
          },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setForm({ ...form, status: opt.value as "DRAFT" | "PENDING_REVIEW" })}
            className={`rounded-xl border-2 p-5 text-left transition-all ${
              form.status === opt.value
                ? "border-brand-500 bg-brand-50"
                : "border-zinc-200 hover:border-zinc-300"
            }`}
          >
            <div className="mb-2 text-2xl">{opt.icon}</div>
            <p className="font-semibold text-zinc-900">{opt.title}</p>
            <p className="mt-1 text-sm text-zinc-500">{opt.description}</p>
            {form.status === opt.value && (
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-600">
                <Check size={12} /> Selected
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader><CardTitle>Product Summary</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[
            { label: "Name", value: form.name || "—" },
            { label: "SKU", value: form.sku || "—" },
            { label: "Price", value: form.price ? `PKR ${parseFloat(form.price).toLocaleString("en-PK")}` : "—" },
            { label: "Stock", value: form.stock },
            { label: "Images", value: `${form.images.length} image${form.images.length !== 1 ? "s" : ""}` },
            { label: "Variants", value: form.variants.length > 0 ? `${form.variants.length} combinations` : "No variants" },
          ].map((row) => (
            <div key={row.label} className="flex justify-between text-sm">
              <span className="text-zinc-500">{row.label}</span>
              <span className="font-medium text-zinc-800">{row.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Wizard ───────────────────────────────────────────────────────────────

export function ProductWizard({
  categories,
  brands,
  shippingSettings,
}: {
  categories: Category[];
  brands: Brand[];
  shippingSettings: ShippingSettings;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ProductFormData>(DEFAULT);
  const [isPending, startTransition] = useTransition();

  function validateStep(): string | null {
    if (step === 1) {
      if (!form.name.trim()) return "Product name is required.";
      if (!form.slug.trim()) return "Slug is required.";
      if (!form.description.trim()) return "Description is required.";
      if (!form.categoryId) return "Please select a category.";
    }
    if (step === 3) {
      if (!form.price || parseFloat(form.price) <= 0) return "Regular price is required.";
      if (form.salePrice && parseFloat(form.salePrice) >= parseFloat(form.price))
        return "Sale price must be lower than regular price.";
    }
    if (step === 6) {
      if (!form.weight || parseInt(form.weight) <= 0) return "Product weight in grams is required.";
    }
    return null;
  }

  function next() {
    const error = validateStep();
    if (error) { toast.error(error); return; }
    setStep((s) => Math.min(s + 1, 8));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function prev() {
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSubmit() {
    startTransition(async () => {
      const r = await createProductAction(form);
      if (r.success) {
        toast.success(r.message);
        router.push("/vendor/products");
      } else {
        toast.error(r.error);
      }
    });
  }

  const stepProps = { form, setForm };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-zinc-950">Add New Product</h2>
        <p className="mt-0.5 text-sm text-zinc-400">Fill in all details to create a product listing.</p>
      </div>

      <StepBar current={step} />

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step - 1].label}</CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && <Step1 {...stepProps} categories={categories} brands={brands} />}
          {step === 2 && <Step2 {...stepProps} />}
          {step === 3 && <Step3 {...stepProps} />}
          {step === 4 && <Step4 {...stepProps} />}
          {step === 5 && <Step5 {...stepProps} />}
          {step === 6 && <Step6 {...stepProps} shippingSettings={shippingSettings} />}
          {step === 7 && <Step7 {...stepProps} />}
          {step === 8 && <Step8 {...stepProps} />}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" onClick={prev} disabled={step === 1} className="gap-2">
          <ArrowLeft size={15} /> Previous
        </Button>
        <span className="text-xs text-zinc-400">Step {step} of 8</span>
        {step < 8 ? (
          <Button onClick={next} className="gap-2">
            Next <ArrowRight size={15} />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isPending} className="gap-2">
            {isPending ? "Creating…" : form.status === "PENDING_REVIEW" ? "Submit for Review" : "Save as Draft"}
          </Button>
        )}
      </div>
    </div>
  );
}
