"use client";

import { useState, useTransition } from "react";
import { Edit2, Package, Plus, Tag, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { createBrandAction, updateBrandAction, deleteBrandAction } from "@/lib/admin/category-actions";

type Brand = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  _count: { products: number };
};

function toSlug(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── Brand form modal ──────────────────────────────────────────────────────────

function BrandForm({ editing, onClose }: { editing?: Brand | null; onClose: () => void }) {
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    slug: editing?.slug ?? "",
    logoUrl: editing?.logoUrl ?? "",
  });
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!form.name.trim()) { toast.error("Brand name is required."); return; }
    if (!form.slug.trim()) { toast.error("Slug is required."); return; }

    startTransition(async () => {
      const r = editing
        ? await updateBrandAction(editing.id, form)
        : await createBrandAction(form);

      if (r.success) { toast.success(r.message); onClose(); }
      else toast.error(r.error);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 p-5">
          <h2 className="font-semibold text-zinc-900">{editing ? "Edit Brand" : "New Brand"}</h2>
          <button onClick={onClose}><X size={18} className="text-zinc-400" /></button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">Brand Name *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value, slug: toSlug(e.target.value) })}
              placeholder="e.g. Nike, Samsung, Gul Ahmed"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">Slug *</label>
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: toSlug(e.target.value) })}
              placeholder="nike"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">Logo URL (optional)</label>
            <Input
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
            {form.logoUrl && (
              <img
                src={form.logoUrl}
                alt="Logo preview"
                className="mt-2 h-10 rounded object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSubmit} disabled={isPending} className="flex-1">
              {isPending ? "Saving…" : editing ? "Save Changes" : "Create Brand"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main manager ──────────────────────────────────────────────────────────────

export function BrandsManager({ brands }: { brands: Brand[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [isPending, startTransition] = useTransition();

  function openEdit(b: Brand) {
    setEditingBrand(b);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingBrand(null);
  }

  function handleDelete(brand: Brand) {
    if (!confirm(`Delete brand "${brand.name}"?`)) return;
    startTransition(async () => {
      const r = await deleteBrandAction(brand.id);
      r.success ? toast.success(r.message) : toast.error(r.error);
    });
  }

  return (
    <div className="space-y-6">
      {showForm && <BrandForm editing={editingBrand} onClose={closeForm} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-950">Brand Management</h2>
          <p className="mt-0.5 text-sm text-zinc-400">
            Only Super Admin can create brands. Vendors select from this list when adding products.
          </p>
        </div>
        <Button onClick={() => { setEditingBrand(null); setShowForm(true); }} className="gap-2">
          <Plus size={15} /> New Brand
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-zinc-950">{brands.length}</p>
            <p className="mt-0.5 text-xs text-zinc-500">Total Brands</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-zinc-950">
              {brands.reduce((s, b) => s + b._count.products, 0)}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">Products Assigned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-zinc-950">
              {brands.filter((b) => b._count.products === 0).length}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">Unused Brands</p>
          </CardContent>
        </Card>
      </div>

      {/* Brands grid */}
      {brands.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Tag size={32} className="text-zinc-200" />
            <p className="text-sm font-medium text-zinc-600">No brands yet</p>
            <p className="text-xs text-zinc-400">Create brands so vendors can tag their products.</p>
            <Button size="sm" onClick={() => setShowForm(true)} className="mt-2 gap-1.5">
              <Plus size={14} /> Create First Brand
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Card key={brand.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 min-w-0">
                {brand.logoUrl ? (
                  <img
                    src={brand.logoUrl}
                    alt={brand.name}
                    className="size-10 shrink-0 rounded-md object-contain border border-zinc-100 bg-zinc-50 p-1"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="size-10 shrink-0 rounded-md bg-brand-50 grid place-items-center">
                    <Tag size={18} className="text-brand-500" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-800 truncate">{brand.name}</p>
                  <p className="text-xs text-zinc-400">
                    {brand._count.products} product{brand._count.products !== 1 ? "s" : ""}
                    {" · "}/{brand.slug}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1 ml-2">
                <button
                  onClick={() => openEdit(brand)}
                  className="grid size-7 place-items-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(brand)}
                  disabled={isPending || brand._count.products > 0}
                  className="grid size-7 place-items-center rounded-md text-zinc-300 hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
                  title={brand._count.products > 0 ? "Has products — reassign them first" : "Delete brand"}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
