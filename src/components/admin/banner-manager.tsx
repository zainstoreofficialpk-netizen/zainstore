"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Eye, EyeOff, Pencil, X, ExternalLink, Image } from "lucide-react";
import { createBanner, updateBanner, toggleBannerActive, deleteBanner } from "@/lib/admin/banner-actions";

type Banner = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  placement: string;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
};

const PLACEMENTS = [
  { value: "slider", label: "Homepage Slider" },
  { value: "hero", label: "Hero Banner" },
  { value: "sidebar", label: "Sidebar Banner" },
  { value: "promo", label: "Promo Strip" },
];

const PLACEMENT_COLORS: Record<string, string> = {
  slider: "bg-brand-50 text-brand-700",
  hero: "bg-purple-50 text-purple-700",
  sidebar: "bg-blue-50 text-blue-700",
  promo: "bg-accent-50 text-accent-700",
};

const inputCls = "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10";

const EMPTY_FORM = { title: "", imageUrl: "", linkUrl: "", placement: "slider", startsAt: "", endsAt: "" };

export function BannerManager({ initialBanners }: { initialBanners: Banner[] }) {
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [preview, setPreview] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const displayed = filter === "all" ? banners : banners.filter((b) => b.placement === filter);

  function setField(k: keyof typeof EMPTY_FORM, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
    if (k === "imageUrl") setPreview(v || null);
  }

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setPreview(null);
    setShowForm(true);
  }

  function openEdit(b: Banner) {
    setEditingId(b.id);
    setForm({
      title: b.title,
      imageUrl: b.imageUrl,
      linkUrl: b.linkUrl ?? "",
      placement: b.placement,
      startsAt: b.startsAt ? b.startsAt.slice(0, 16) : "",
      endsAt: b.endsAt ? b.endsAt.slice(0, 16) : "",
    });
    setPreview(b.imageUrl || null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setPreview(null);
  }

  function run(fn: () => Promise<{ success: boolean; message?: string; error?: string }>) {
    startTransition(async () => {
      const res = await fn();
      if (res.success) toast.success(res.message ?? "Done.");
      else toast.error((res as { error: string }).error);
    });
  }

  function handleSubmit() {
    if (!form.title.trim()) { toast.error("Title is required."); return; }
    if (!form.imageUrl.trim()) { toast.error("Image URL is required."); return; }

    run(async () => {
      if (editingId) {
        const res = await updateBanner(editingId, { title: form.title, imageUrl: form.imageUrl, linkUrl: form.linkUrl, placement: form.placement });
        if (res.success) {
          setBanners((prev) => prev.map((b) => b.id === editingId ? { ...b, title: form.title, imageUrl: form.imageUrl, linkUrl: form.linkUrl || null, placement: form.placement } : b));
          closeForm();
        }
        return res;
      } else {
        const res = await createBanner({ title: form.title, imageUrl: form.imageUrl, linkUrl: form.linkUrl, placement: form.placement, startsAt: form.startsAt, endsAt: form.endsAt });
        if (res.success) {
          // Re-fetch would be ideal here; for now optimistically add placeholder
          closeForm();
          toast.info("Refresh to see new banner in list.");
        }
        return res;
      }
    });
  }

  function handleToggle(id: string, current: boolean) {
    run(async () => {
      const res = await toggleBannerActive(id, !current);
      if (res.success) setBanners((prev) => prev.map((b) => b.id === id ? { ...b, active: !current } : b));
      return res;
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this banner? This cannot be undone.")) return;
    run(async () => {
      const res = await deleteBanner(id);
      if (res.success) setBanners((prev) => prev.filter((b) => b.id !== id));
      return res;
    });
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {["all", ...PLACEMENTS.map((p) => p.value)].map((p) => (
            <button key={p} onClick={() => setFilter(p)}
              className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${filter === p ? "bg-brand-500 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
              {p === "all" ? "All" : PLACEMENTS.find((pl) => pl.value === p)?.label ?? p}
              <span className="ml-1.5 text-[10px] opacity-70">
                ({p === "all" ? banners.length : banners.filter((b) => b.placement === p).length})
              </span>
            </button>
          ))}
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-xl transition-colors">
          <Plus className="h-4 w-4" /> Add Banner
        </button>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-900">{editingId ? "Edit Banner" : "Add New Banner"}</h3>
            <button onClick={closeForm} className="text-zinc-400 hover:text-zinc-600"><X className="h-4 w-4" /></button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Title *</label>
              <input className={inputCls} value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="Summer Sale 2024" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Placement</label>
              <select className={inputCls} value={form.placement} onChange={(e) => setField("placement", e.target.value)}>
                {PLACEMENTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Image URL *</label>
              <input className={inputCls} value={form.imageUrl} onChange={(e) => setField("imageUrl", e.target.value)} placeholder="https://example.com/banner.jpg" />
              {preview && (
                <div className="mt-2 rounded-lg overflow-hidden border border-zinc-200 h-32 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" onError={() => setPreview(null)} />
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Link URL (optional)</label>
              <input className={inputCls} value={form.linkUrl} onChange={(e) => setField("linkUrl", e.target.value)} placeholder="/shop/sale" />
            </div>
            {!editingId && (
              <>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">Start Date (optional)</label>
                  <input type="datetime-local" className={inputCls} value={form.startsAt} onChange={(e) => setField("startsAt", e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">End Date (optional)</label>
                  <input type="datetime-local" className={inputCls} value={form.endsAt} onChange={(e) => setField("endsAt", e.target.value)} />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={handleSubmit} disabled={isPending}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
              {isPending ? "Saving…" : editingId ? "Update Banner" : "Create Banner"}
            </button>
            <button onClick={closeForm} className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900">Cancel</button>
          </div>
        </div>
      )}

      {/* Banner list */}
      {displayed.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 py-14 text-center">
          <Image className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm text-zinc-400 font-medium">No banners found</p>
          <p className="text-xs text-zinc-400 mt-1">Click &ldquo;Add Banner&rdquo; to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((banner) => (
            <div key={banner.id} className={`rounded-xl border bg-white overflow-hidden flex flex-col sm:flex-row gap-0 ${banner.active ? "border-zinc-100" : "border-zinc-100 opacity-60"}`}>
              {/* Image preview */}
              <div className="relative h-32 sm:h-auto sm:w-52 shrink-0 bg-zinc-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${PLACEMENT_COLORS[banner.placement] ?? "bg-zinc-100 text-zinc-600"}`}>
                  {PLACEMENTS.find((p) => p.value === banner.placement)?.label ?? banner.placement}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm text-zinc-900">{banner.title}</p>
                    {banner.linkUrl && (
                      <a href={banner.linkUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-brand-500 hover:underline mt-0.5">
                        <ExternalLink className="h-3 w-3" /> {banner.linkUrl}
                      </a>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-400">
                      {banner.startsAt && <span>From {new Date(banner.startsAt).toLocaleDateString("en-PK", { month: "short", day: "numeric" })}</span>}
                      {banner.endsAt && <span>Until {new Date(banner.endsAt).toLocaleDateString("en-PK", { month: "short", day: "numeric" })}</span>}
                      <span>Added {new Date(banner.createdAt).toLocaleDateString("en-PK", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleToggle(banner.id, banner.active)} disabled={isPending}
                      title={banner.active ? "Deactivate" : "Activate"}
                      className={`p-1.5 rounded-lg transition-colors ${banner.active ? "text-green-600 hover:bg-green-50" : "text-zinc-400 hover:bg-zinc-50"}`}>
                      {banner.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button onClick={() => openEdit(banner)} title="Edit"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-brand-500 hover:bg-brand-50 transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(banner.id)} disabled={isPending} title="Delete"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${banner.active ? "bg-green-50 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${banner.active ? "bg-green-500" : "bg-zinc-400"}`} />
                    {banner.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
