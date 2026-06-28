"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft, Check, X, MessageSquare, Package, Tag, Store,
  BarChart2, Truck, Search, Star, ChevronLeft, ChevronRight,
  AlertTriangle, BadgeCheck, Image as ImageIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { approveProductById, rejectProduct, requestProductChanges } from "@/lib/admin/actions";

// ── Types ─────────────────────────────────────────────────────────────────────

type Variant = {
  id: string; name: string; sku: string | null;
  price: number | null; salePrice: number | null;
  stock: number; imageUrl: string | null;
  isActive: boolean; options: Record<string, string>;
};

type Product = {
  id: string; name: string; slug: string; status: string;
  description: string; shortDescription: string | null;
  sku: string | null; barcode: string | null;
  price: number; salePrice: number | null; costPrice: number | null; taxRate: number | null;
  stock: number; lowStockThreshold: number; stockStatus: string; trackInventory: boolean;
  weight: number | null; length: number | null; width: number | null; height: number | null;
  shippingType: string; videoUrl: string | null;
  seoTitle: string | null; seoDescription: string | null; seoKeywords: string | null;
  tags: string[]; featured: boolean;
  rejectionReason: string | null; adminNote: string | null;
  commissionType: string | null; commissionValue: number | null;
  createdAt: Date; updatedAt: Date;
  images: { id: string; url: string; alt: string | null; sortOrder: number }[];
  category: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
  variants: Variant[];
  vendor: {
    user: { name: string | null; email: string; createdAt: Date };
    store: { name: string | null; slug: string; logoUrl: string | null } | null;
  };
  _count: { variants: number; reviews: number };
};

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "muted" | "accent"> = {
  DRAFT: "muted", PENDING_REVIEW: "warning", CHANGES_REQUESTED: "accent",
  ACTIVE: "success", REJECTED: "danger", ARCHIVED: "muted",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_REVIEW: "Pending Review",
  CHANGES_REQUESTED: "Changes Requested",
  ACTIVE: "Live",
  REJECTED: "Rejected",
  DRAFT: "Draft",
  ARCHIVED: "Archived",
};

// ── Image gallery ─────────────────────────────────────────────────────────────

function ImageGallery({ images, videoUrl }: { images: Product["images"]; videoUrl: string | null }) {
  const [active, setActive] = useState(0);

  if (images.length === 0 && !videoUrl) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50">
        <div className="text-center text-zinc-400">
          <ImageIcon size={32} className="mx-auto mb-2" />
          <p className="text-sm">No images uploaded</p>
        </div>
      </div>
    );
  }

  const media = [
    ...images.map((img) => ({ type: "image" as const, url: img.url, alt: img.alt ?? "" })),
    ...(videoUrl ? [{ type: "video" as const, url: videoUrl, alt: "Product video" }] : []),
  ];
  const current = media[active];

  return (
    <div className="space-y-3">
      {/* Main viewer */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
        {current.type === "image" ? (
          <img src={current.url} alt={current.alt} className="h-full w-full object-contain" />
        ) : (
          <video src={current.url} controls className="h-full w-full object-contain" />
        )}
        {/* Primary badge */}
        {active === 0 && images.length > 0 && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-brand-500 px-2.5 py-1 text-[11px] font-bold text-white shadow">
            <Star size={9} fill="white" /> Primary
          </span>
        )}
        {/* Nav arrows */}
        {media.length > 1 && (
          <>
            <button
              onClick={() => setActive((a) => (a - 1 + media.length) % media.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 grid size-8 place-items-center rounded-full bg-white/90 shadow hover:bg-white"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setActive((a) => (a + 1) % media.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 grid size-8 place-items-center rounded-full bg-white/90 shadow hover:bg-white"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {media.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {media.map((m, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative shrink-0 size-16 overflow-hidden rounded-lg border-2 transition-colors ${
                i === active ? "border-brand-500" : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              {m.type === "image" ? (
                <img src={m.url} alt={m.alt} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-white text-[10px]">
                  ▶ Video
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ icon: Icon, title, children }: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon size={16} className="text-brand-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="shrink-0 text-zinc-500">{label}</span>
      <span className="text-right font-medium text-zinc-900">{value ?? <span className="text-zinc-300">—</span>}</span>
    </div>
  );
}

// ── Action modals ─────────────────────────────────────────────────────────────

function ActionModal({
  title, color, onClose, onConfirm, requireNote, notePlaceholder, confirmLabel, isPending,
}: {
  title: string;
  color: "danger" | "warning" | "success";
  onClose: () => void;
  onConfirm: (note: string) => void;
  requireNote: boolean;
  notePlaceholder: string;
  confirmLabel: string;
  isPending: boolean;
}) {
  const [note, setNote] = useState("");

  const btnClass = {
    danger: "bg-rose-500 hover:bg-rose-600 text-white",
    warning: "bg-amber-500 hover:bg-amber-600 text-white",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white",
  }[color];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h3 className="font-semibold text-zinc-900">{title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              {requireNote ? "Note to vendor *" : "Note to vendor (optional)"}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder={notePlaceholder}
              className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onConfirm(note)}
              disabled={isPending || (requireNote && !note.trim())}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${btnClass}`}
            >
              {isPending ? "Processing…" : confirmLabel}
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function ProductReviewPanel({ product }: { product: Product }) {
  const [modal, setModal] = useState<"approve" | "reject" | "changes" | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleApprove(note: string) {
    startTransition(async () => {
      const r = await approveProductById(product.id);
      if (r.success) { toast.success(r.message); setModal(null); }
      else toast.error(r.error);
    });
  }

  function handleReject(note: string) {
    startTransition(async () => {
      const r = await rejectProduct(product.id, note);
      if (r.success) { toast.success(r.message); setModal(null); }
      else toast.error(r.error);
    });
  }

  function handleChanges(note: string) {
    startTransition(async () => {
      const r = await requestProductChanges(product.id, note);
      if (r.success) { toast.success(r.message); setModal(null); }
      else toast.error(r.error);
    });
  }

  const canApprove = ["PENDING_REVIEW", "CHANGES_REQUESTED", "REJECTED"].includes(product.status);
  const canReject = ["PENDING_REVIEW", "CHANGES_REQUESTED", "ACTIVE"].includes(product.status);
  const canRequestChanges = ["PENDING_REVIEW", "CHANGES_REQUESTED"].includes(product.status);

  return (
    <>
      {modal === "approve" && (
        <ActionModal
          title="Approve Product"
          color="success"
          onClose={() => setModal(null)}
          onConfirm={handleApprove}
          requireNote={false}
          notePlaceholder="Optional approval message to vendor…"
          confirmLabel="Approve & Notify Vendor"
          isPending={isPending}
        />
      )}
      {modal === "reject" && (
        <ActionModal
          title="Reject Product"
          color="danger"
          onClose={() => setModal(null)}
          onConfirm={handleReject}
          requireNote={true}
          notePlaceholder="e.g. Images are low quality. Please upload at least 3 clear photos."
          confirmLabel="Reject & Notify Vendor"
          isPending={isPending}
        />
      )}
      {modal === "changes" && (
        <ActionModal
          title="Request Changes"
          color="warning"
          onClose={() => setModal(null)}
          onConfirm={handleChanges}
          requireNote={true}
          notePlaceholder="e.g. Please add a more detailed description and fix the pricing — sale price is higher than regular price."
          confirmLabel="Send Feedback to Vendor"
          isPending={isPending}
        />
      )}

      <div className="space-y-6">
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex items-start gap-3">
            <Link
              href="/admin/products"
              className="mt-1 grid size-8 shrink-0 place-items-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-zinc-950">{product.name}</h1>
                <Badge tone={STATUS_TONE[product.status] ?? "muted"}>
                  {STATUS_LABEL[product.status] ?? product.status}
                </Badge>
              </div>
              <p className="mt-0.5 text-sm text-zinc-500">
                {product.vendor.store?.name ?? "—"} ·{" "}
                Submitted {new Date(product.createdAt).toLocaleDateString("en-PK", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 sm:shrink-0">
            {canRequestChanges && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setModal("changes")}
                className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <MessageSquare size={14} /> Request Changes
              </Button>
            )}
            {canReject && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setModal("reject")}
                className="gap-1.5 border-rose-300 text-rose-600 hover:bg-rose-50"
              >
                <X size={14} /> Reject
              </Button>
            )}
            {canApprove && (
              <Button
                size="sm"
                onClick={() => setModal("approve")}
                className="gap-1.5"
              >
                <Check size={14} /> Approve
              </Button>
            )}
            {product.status === "ACTIVE" && (
              <Badge tone="success" className="px-3 py-1.5">
                <BadgeCheck size={13} className="mr-1" /> Live on store
              </Badge>
            )}
          </div>
        </div>

        {/* ── Admin notes / rejection reason banner ─────────────────── */}
        {(product.rejectionReason || product.adminNote) && (
          <div className={`flex items-start gap-3 rounded-xl border p-4 ${
            product.status === "REJECTED"
              ? "border-rose-200 bg-rose-50"
              : "border-amber-200 bg-amber-50"
          }`}>
            <AlertTriangle size={16} className={`mt-0.5 shrink-0 ${product.status === "REJECTED" ? "text-rose-500" : "text-amber-600"}`} />
            <div>
              <p className={`text-sm font-semibold ${product.status === "REJECTED" ? "text-rose-800" : "text-amber-800"}`}>
                {product.status === "REJECTED" ? "Rejection reason" : "Changes requested"}
              </p>
              <p className={`mt-0.5 text-sm ${product.status === "REJECTED" ? "text-rose-700" : "text-amber-700"}`}>
                {product.rejectionReason ?? product.adminNote}
              </p>
            </div>
          </div>
        )}

        {/* ── Main two-column layout ────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          {/* Left — media */}
          <div className="space-y-6">
            <ImageGallery images={product.images} videoUrl={product.videoUrl} />

            {/* Vendor info */}
            <Section icon={Store} title="Vendor Information">
              <div className="divide-y divide-zinc-100">
                <Row label="Store" value={product.vendor.store?.name ?? "—"} />
                <Row label="Owner" value={product.vendor.user.name ?? "—"} />
                <Row label="Email" value={product.vendor.user.email} />
                <Row label="Member since" value={new Date(product.vendor.user.createdAt).toLocaleDateString("en-PK", { month: "long", year: "numeric" })} />
              </div>
            </Section>
          </div>

          {/* Right — all product details */}
          <div className="space-y-5">
            {/* ── Basic info ── */}
            <Section icon={Package} title="Product Details">
              <div className="divide-y divide-zinc-100">
                <Row label="Product Name" value={product.name} />
                <Row label="Slug / URL" value={<span className="font-mono text-xs text-zinc-500">/{product.slug}</span>} />
                <Row label="Category" value={product.category?.name ?? "—"} />
                <Row label="Brand" value={product.brand?.name ?? "—"} />
                <Row label="SKU" value={product.sku ?? "—"} />
                <Row label="Barcode" value={product.barcode ?? "—"} />
                <Row label="Tags" value={
                  product.tags.length > 0
                    ? <div className="flex flex-wrap justify-end gap-1">{product.tags.map((t) => <span key={t} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">{t}</span>)}</div>
                    : null
                } />
                <Row label="Submission date" value={new Date(product.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })} />
                <Row label="Last updated" value={new Date(product.updatedAt).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })} />
              </div>

              {product.shortDescription && (
                <div className="mt-4 border-t border-zinc-100 pt-4">
                  <p className="mb-1 text-xs font-medium text-zinc-500 uppercase tracking-wide">Short Description</p>
                  <p className="text-sm text-zinc-700">{product.shortDescription}</p>
                </div>
              )}

              <div className="mt-4 border-t border-zinc-100 pt-4">
                <p className="mb-1 text-xs font-medium text-zinc-500 uppercase tracking-wide">Full Description</p>
                <p className="whitespace-pre-wrap text-sm text-zinc-700">{product.description}</p>
              </div>
            </Section>

            {/* ── Pricing ── */}
            <Section icon={Tag} title="Pricing">
              <div className="divide-y divide-zinc-100">
                <Row label="Regular Price" value={<span className="text-lg font-bold text-zinc-950">{formatCurrency(product.price)}</span>} />
                <Row label="Sale Price" value={product.salePrice ? <span className="text-emerald-600 font-semibold">{formatCurrency(product.salePrice)}</span> : null} />
                <Row label="Cost Price" value={product.costPrice ? formatCurrency(product.costPrice) : null} />
                <Row label="Tax Rate" value={product.taxRate ? `${product.taxRate}%` : null} />
                {product.salePrice && product.salePrice < product.price && (
                  <Row label="Discount" value={
                    <span className="text-emerald-600">
                      {Math.round(((product.price - product.salePrice) / product.price) * 100)}% off
                    </span>
                  } />
                )}
                {product.salePrice && product.salePrice >= product.price && (
                  <div className="py-2 flex items-center gap-2 text-rose-600 text-xs">
                    <AlertTriangle size={13} /> Sale price is higher than or equal to regular price
                  </div>
                )}
              </div>
            </Section>

            {/* ── Inventory ── */}
            <Section icon={BarChart2} title="Inventory">
              <div className="divide-y divide-zinc-100">
                <Row label="Stock Qty" value={product.stock} />
                <Row label="Stock Status" value={<Badge tone={product.stockStatus === "IN_STOCK" ? "success" : product.stockStatus === "BACKORDER" ? "warning" : "danger"}>{product.stockStatus.replace("_", " ")}</Badge>} />
                <Row label="Low Stock Alert" value={`Below ${product.lowStockThreshold} units`} />
                <Row label="Track Inventory" value={product.trackInventory ? "Yes" : "No"} />
                <Row label="Variants" value={product._count.variants > 0 ? `${product._count.variants} variant${product._count.variants > 1 ? "s" : ""}` : "No variants"} />
              </div>
            </Section>

            {/* ── Variants ── */}
            {product.variants.length > 0 && (
              <Section icon={Package} title="Variants">
                <div className="overflow-x-auto -mx-6 px-6">
                  <table className="w-full text-sm">
                    <thead className="border-b border-zinc-100">
                      <tr>
                        {["Variant", "SKU", "Options", "Price", "Stock", "Active"].map((h) => (
                          <th key={h} className="pb-2 text-left text-xs font-medium text-zinc-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {product.variants.map((v) => (
                        <tr key={v.id}>
                          <td className="py-2 font-medium text-zinc-800">{v.name}</td>
                          <td className="py-2 font-mono text-xs text-zinc-500">{v.sku ?? "—"}</td>
                          <td className="py-2 text-xs text-zinc-600">
                            {Object.entries(v.options).map(([k, val]) => `${k}: ${val}`).join(", ") || "—"}
                          </td>
                          <td className="py-2 text-zinc-800">
                            {v.price ? formatCurrency(v.price) : "—"}
                            {v.salePrice && <p className="text-xs text-emerald-600">{formatCurrency(v.salePrice)}</p>}
                          </td>
                          <td className="py-2 text-zinc-700">{v.stock}</td>
                          <td className="py-2">
                            <Badge tone={v.isActive ? "success" : "muted"}>{v.isActive ? "Yes" : "No"}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            )}

            {/* ── Shipping ── */}
            <Section icon={Truck} title="Shipping Details">
              <div className="divide-y divide-zinc-100">
                <Row label="Shipping Type" value={product.shippingType.replace("_", " ")} />
                <Row label="Weight" value={product.weight ? `${product.weight}g` : null} />
                <Row label="Dimensions (L×W×H)" value={
                  product.length && product.width && product.height
                    ? `${product.length}×${product.width}×${product.height} cm`
                    : null
                } />
              </div>
            </Section>

            {/* ── SEO ── */}
            <Section icon={Search} title="SEO Details">
              <div className="divide-y divide-zinc-100">
                <Row label="SEO Title" value={product.seoTitle ?? null} />
                <Row label="SEO Description" value={product.seoDescription ?? null} />
                <Row label="SEO Keywords" value={product.seoKeywords ?? null} />
              </div>
            </Section>

            {/* ── Commission ── */}
            {(product.commissionType || product.commissionValue) && (
              <Section icon={Star} title="Commission Override">
                <div className="divide-y divide-zinc-100">
                  <Row label="Type" value={product.commissionType ?? "—"} />
                  <Row label="Value" value={product.commissionValue != null ? `${product.commissionValue}` : "—"} />
                </div>
              </Section>
            )}
          </div>
        </div>

        {/* ── Bottom action bar ─────────────────────────────────────── */}
        <div className="sticky bottom-0 -mx-6 border-t border-zinc-200 bg-white/95 backdrop-blur px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <p className="text-sm text-zinc-500">
              Review all sections above, then take an action. Vendor will be notified immediately.
            </p>
            <div className="flex flex-wrap gap-2 sm:shrink-0">
              {canRequestChanges && (
                <Button variant="outline" onClick={() => setModal("changes")} className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50">
                  <MessageSquare size={14} /> Request Changes
                </Button>
              )}
              {canReject && (
                <Button variant="outline" onClick={() => setModal("reject")} className="gap-1.5 border-rose-300 text-rose-600 hover:bg-rose-50">
                  <X size={14} /> Reject
                </Button>
              )}
              {canApprove && (
                <Button onClick={() => setModal("approve")} className="gap-1.5">
                  <Check size={14} /> Approve Product
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
