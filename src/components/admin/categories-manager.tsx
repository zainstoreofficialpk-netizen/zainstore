"use client";

import { useState, useTransition, useRef } from "react";
import { ChevronRight, Edit2, FolderOpen, Plus, Trash2, X, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  uploadCategoryImage,
} from "@/lib/admin/category-actions";

type Category = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  parentId: string | null;
  commissionType: string | null;
  commissionValue: any;
  _count: { products: number; children: number };
};

function toSlug(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── Category form (create & edit) ─────────────────────────────────────────────

function CategoryForm({
  categories,
  editing,
  onClose,
}: {
  categories: Category[];
  editing?: Category | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    slug: editing?.slug ?? "",
    imageUrl: editing?.imageUrl ?? "",
    parentId: editing?.parentId ?? "",
    commissionType: editing?.commissionType ?? "",
    commissionValue: editing?.commissionValue ? String(editing.commissionValue) : "",
  });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const parents = categories.filter(
    (c) => !c.parentId && c.id !== editing?.id,
  );

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadCategoryImage(fd);
      if (res.success) {
        setForm((f) => ({ ...f, imageUrl: res.url }));
        toast.success("Image uploaded.");
      } else {
        toast.error(res.error);
      }
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit() {
    if (!form.name.trim()) { toast.error("Name is required."); return; }
    if (!form.slug.trim()) { toast.error("Slug is required."); return; }

    startTransition(async () => {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        imageUrl: form.imageUrl.trim() || null,
        parentId: form.parentId || null,
        commissionType: form.commissionType || null,
        commissionValue: form.commissionValue ? parseFloat(form.commissionValue) : null,
      };

      const r = editing
        ? await updateCategoryAction(editing.id, payload)
        : await createCategoryAction(payload);

      if (r.success) { toast.success(r.message); onClose(); }
      else toast.error(r.error);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 p-5">
          <h2 className="font-semibold text-zinc-900">
            {editing ? "Edit Category" : "New Category"}
          </h2>
          <button onClick={onClose}><X size={18} className="text-zinc-400" /></button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">Name *</label>
            <Input
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value, slug: toSlug(e.target.value) })
              }
              placeholder="e.g. Men's Clothing"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">Slug *</label>
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: toSlug(e.target.value) })}
              placeholder="mens-clothing"
            />
            <p className="mt-1 text-xs text-zinc-400">URL-friendly identifier, auto-generated from name.</p>
          </div>

          {/* Image upload */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">Thumbnail Image</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div
              onClick={() => !uploading && fileRef.current?.click()}
              className={`relative flex h-28 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
                uploading ? "cursor-wait opacity-60 border-zinc-200" : "border-zinc-200 hover:border-brand-400 hover:bg-brand-50/30"
              }`}
            >
              {form.imageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.imageUrl} alt="category thumbnail" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-xs font-semibold text-white">Click to change</span>
                  </div>
                </>
              ) : uploading ? (
                <div className="flex flex-col items-center gap-2 text-zinc-400">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-brand-500" />
                  <span className="text-xs">Uploading…</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-zinc-400">
                  <Upload size={20} />
                  <span className="text-xs font-medium">Click to upload image</span>
                  <span className="text-[10px] text-zinc-300">JPG, PNG, WebP · max 5 MB</span>
                </div>
              )}
            </div>
            {form.imageUrl && (
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                className="mt-1.5 text-xs text-zinc-400 hover:text-rose-500 transition-colors"
              >
                Remove image
              </button>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">Parent Category</label>
            <select
              value={form.parentId}
              onChange={(e) => setForm({ ...form, parentId: e.target.value })}
              className="w-full h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:border-brand-400 focus:outline-none"
            >
              <option value="">— Top-level category —</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Commission Type</label>
              <select
                value={form.commissionType}
                onChange={(e) => setForm({ ...form, commissionType: e.target.value })}
                className="w-full h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:border-brand-400 focus:outline-none"
              >
                <option value="">Use global rate</option>
                <option value="PERCENTAGE_OF_SALE">Percentage (%)</option>
                <option value="FIXED_AMOUNT">Fixed amount (PKR)</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                {form.commissionType === "FIXED_AMOUNT" ? "Amount (PKR)" : "Rate (%)"}
              </label>
              <Input
                type="number"
                min={0}
                step={form.commissionType === "FIXED_AMOUNT" ? 1 : 0.1}
                value={form.commissionValue}
                onChange={(e) => setForm({ ...form, commissionValue: e.target.value })}
                placeholder={form.commissionType ? "e.g. 12" : "—"}
                disabled={!form.commissionType}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSubmit} disabled={isPending} className="flex-1">
              {isPending ? "Saving…" : editing ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Category row ──────────────────────────────────────────────────────────────

function CategoryRow({
  category,
  isChild,
  allCategories,
  onEdit,
}: {
  category: Category;
  isChild: boolean;
  allCategories: Category[];
  onEdit: (c: Category) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete "${category.name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const r = await deleteCategoryAction(category.id);
      r.success ? toast.success(r.message) : toast.error(r.error);
    });
  }

  return (
    <div className={`flex items-center justify-between gap-4 rounded-lg px-4 py-3 hover:bg-zinc-50 ${isChild ? "ml-6 border-l-2 border-zinc-100" : ""}`}>
      <div className="flex items-center gap-3 min-w-0">
        {isChild
          ? <ChevronRight size={14} className="shrink-0 text-zinc-300" />
          : category.imageUrl
          ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={category.imageUrl} alt="" className="h-8 w-8 shrink-0 rounded-lg object-cover" />
          )
          : <FolderOpen size={16} className="shrink-0 text-brand-500" />
        }
        <div className="min-w-0">
          <p className="font-medium text-zinc-800">{category.name}</p>
          <p className="text-xs text-zinc-400">/{category.slug}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500">
          <span>{category._count.products} products</span>
          {category._count.children > 0 && (
            <span>· {category._count.children} sub-categories</span>
          )}
        </div>

        {category.commissionValue && (
          <Badge tone="accent" className="text-xs">
            {category.commissionType === "FIXED_AMOUNT"
              ? `PKR ${Number(category.commissionValue).toLocaleString()}`
              : `${category.commissionValue}%`}
          </Badge>
        )}

        <button
          onClick={() => onEdit(category)}
          className="grid size-7 place-items-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        >
          <Edit2 size={14} />
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending || category._count.children > 0 || category._count.products > 0}
          className="grid size-7 place-items-center rounded-md text-zinc-300 hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
          title={category._count.products > 0 ? "Has products — reassign first" : category._count.children > 0 ? "Has sub-categories — delete them first" : "Delete"}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Main manager ──────────────────────────────────────────────────────────────

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const parents = categories.filter((c) => !c.parentId);
  const children = (parentId: string) => categories.filter((c) => c.parentId === parentId);

  function openEdit(c: Category) {
    setEditingCategory(c);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingCategory(null);
  }

  return (
    <div className="space-y-6">
      {/* Modal */}
      {showForm && (
        <CategoryForm
          categories={categories}
          editing={editingCategory}
          onClose={closeForm}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-950">Categories</h2>
          <p className="mt-0.5 text-sm text-zinc-400">
            Manage product categories. Vendors select from these when listing products.
          </p>
        </div>
        <Button onClick={() => { setEditingCategory(null); setShowForm(true); }} className="gap-2">
          <Plus size={15} /> New Category
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Categories", value: categories.length },
          { label: "Top-level", value: parents.length },
          { label: "Sub-categories", value: categories.filter((c) => c.parentId).length },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-zinc-950">{s.value}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category tree */}
      <Card>
        <CardHeader>
          <CardTitle>Category Tree</CardTitle>
          <p className="mt-0.5 text-xs text-zinc-400">
            Click edit to modify. Delete is disabled if a category has products or sub-categories.
          </p>
        </CardHeader>
        <CardContent className="p-2">
          {categories.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <FolderOpen size={32} className="text-zinc-200" />
              <p className="text-sm text-zinc-400">No categories yet.</p>
              <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
                <Plus size={14} /> Create your first category
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {parents.map((parent) => (
                <div key={parent.id}>
                  <CategoryRow
                    category={parent}
                    isChild={false}
                    allCategories={categories}
                    onEdit={openEdit}
                  />
                  {children(parent.id).map((child) => (
                    <CategoryRow
                      key={child.id}
                      category={child}
                      isChild
                      allCategories={categories}
                      onEdit={openEdit}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
