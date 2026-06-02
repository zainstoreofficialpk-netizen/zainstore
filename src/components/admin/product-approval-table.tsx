"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, MessageSquare, MoreHorizontal, Search, X, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { approveProduct, rejectProduct } from "@/lib/admin/actions";
import type { getProductsForApproval, getAdminProductStats } from "@/lib/admin/product-approval-data";

type ProductList = Awaited<ReturnType<typeof getProductsForApproval>>;
type Product = ProductList["products"][number];
type Stats = Awaited<ReturnType<typeof getAdminProductStats>>;

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "muted" | "accent"> = {
  DRAFT: "muted", PENDING_REVIEW: "warning", CHANGES_REQUESTED: "accent",
  ACTIVE: "success", REJECTED: "danger", ARCHIVED: "muted",
};

// ── Reject modal ──────────────────────────────────────────────────────────────

function RejectModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleReject() {
    if (!reason.trim()) { toast.error("Please provide a rejection reason."); return; }
    startTransition(async () => {
      const r = await rejectProduct(product.id, reason);
      if (r.success) { toast.success(r.message); onClose(); }
      else toast.error(r.error);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 p-5">
          <h2 className="font-semibold text-zinc-900">Reject Product</h2>
          <button onClick={onClose}><X size={18} className="text-zinc-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            {product.images[0] && <img src={product.images[0].url} alt={product.name} className="size-12 rounded-md object-cover" />}
            <div>
              <p className="font-medium text-zinc-800">{product.name}</p>
              <p className="text-xs text-zinc-500">{product.vendor?.store?.name}</p>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">Rejection reason (sent to vendor) *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Images are too low quality. Please upload at least 3 clear product photos."
              className="w-full resize-none rounded-md border border-zinc-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={handleReject} disabled={isPending} className="flex-1">
              {isPending ? "Rejecting…" : "Reject Product"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Row actions ───────────────────────────────────────────────────────────────

const MENU_W = 180;

function RowActions({ product, onReject }: { product: Product; onReject: () => void }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [isPending, startTransition] = useTransition();
  const btnRef = useRef<HTMLButtonElement>(null);

  function openMenu() {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    let top = rect.bottom + 6;
    let left = rect.right - MENU_W;
    if (top + 160 > window.innerHeight - 16) top = rect.top - 160 - 6;
    if (left < 8) left = 8;
    setCoords({ top, left });
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => { window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); };
  }, [open]);

  function handleApprove() {
    startTransition(async () => {
      const r = await approveProduct(product.id);
      r.success ? toast.success(r.message) : toast.error(r.error);
      setOpen(false);
    });
  }

  const dropdown = open
    ? createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div style={{ top: coords.top, left: coords.left, width: MENU_W }}
            className="fixed z-[9999] rounded-lg border border-zinc-200 bg-white py-1 shadow-xl">
            {product.status === "PENDING_REVIEW" && (
              <button onClick={handleApprove} disabled={isPending}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50">
                <Check size={14} /> Approve
              </button>
            )}
            {(product.status === "PENDING_REVIEW" || product.status === "ACTIVE") && (
              <button onClick={() => { setOpen(false); onReject(); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
                <XCircle size={14} /> Reject
              </button>
            )}
            {product.status === "REJECTED" && (
              <button onClick={handleApprove} disabled={isPending}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50">
                <Check size={14} /> Approve anyway
              </button>
            )}
          </div>
        </>,
        document.body,
      )
    : null;

  return (
    <>
      <button ref={btnRef} onClick={openMenu}
        className="grid size-8 place-items-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
        <MoreHorizontal size={16} />
      </button>
      {dropdown}
    </>
  );
}

// ── Main table ────────────────────────────────────────────────────────────────

export function ProductApprovalTable({
  data,
  stats,
}: {
  data: ProductList;
  stats: Stats;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [rejectProduct_, setRejectProduct] = useState<Product | null>(null);

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      v === null ? params.delete(k) : params.set(k, v);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const currentStatus = searchParams.get("status") ?? "PENDING_REVIEW";
  const currentSearch = searchParams.get("search") ?? "";
  const currentPage = Number(searchParams.get("page") ?? "1");

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    updateParams({ search: (new FormData(e.currentTarget).get("search") as string) || null, page: "1" });
  }

  const statCards = [
    { label: "Pending Review", value: stats.pending, status: "PENDING_REVIEW", color: "text-amber-600" },
    { label: "Changes Requested", value: stats.changesRequested, status: "CHANGES_REQUESTED", color: "text-brand-600" },
    { label: "Active / Live", value: stats.active, status: "ACTIVE", color: "text-emerald-600" },
    { label: "Rejected", value: stats.rejected, status: "REJECTED", color: "text-rose-600" },
    { label: "All Products", value: stats.total, status: "ALL", color: "text-zinc-700" },
  ];

  return (
    <div className="space-y-5">
      {rejectProduct_ && (
        <RejectModal product={rejectProduct_} onClose={() => setRejectProduct(null)} />
      )}

      <div>
        <h2 className="text-lg font-bold text-zinc-950">Product Management</h2>
        <p className="mt-0.5 text-sm text-zinc-400">Review and approve vendor product listings.</p>
      </div>

      {/* Stat filters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {statCards.map((s) => (
          <button
            key={s.status}
            onClick={() => updateParams({ status: s.status, page: "1" })}
            className={`rounded-xl border p-4 text-left transition-all ${currentStatus === s.status ? "border-brand-400 bg-brand-50" : "border-zinc-200 bg-white hover:border-zinc-300"}`}
          >
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input name="search" defaultValue={currentSearch} placeholder="Search products or vendors…"
            className="h-9 w-64 rounded-md border border-zinc-200 bg-white pl-8 pr-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
        </div>
        <Button type="submit" size="sm" variant="outline" className="h-9">Search</Button>
        {currentSearch && (
          <button type="button" onClick={() => updateParams({ search: null, page: "1" })} className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600">
            <X size={12} /> Clear
          </button>
        )}
      </form>

      {/* Table */}
      <Card className="overflow-hidden">
        {data.products.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-zinc-400">No products found for the selected filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500">Product</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Vendor</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Category</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Price</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Stock</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Submitted</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {data.products.map((product) => (
                  <tr key={product.id} className="hover:bg-zinc-50/60">
                    <td className="px-6 py-3">
                      <Link href={`/admin/products/${product.id}`} className="flex items-center gap-3 group">
                        {product.images[0] ? (
                          <img src={product.images[0].url} alt={product.name}
                            className="size-10 shrink-0 rounded-md object-cover border border-zinc-100 group-hover:ring-2 group-hover:ring-brand-400" />
                        ) : (
                          <div className="size-10 shrink-0 rounded-md bg-zinc-100 grid place-items-center text-zinc-300">📷</div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate max-w-[180px] font-medium text-zinc-800 group-hover:text-brand-600">{product.name}</p>
                          {(product.status === "REJECTED" || product.status === "CHANGES_REQUESTED") && product.rejectionReason && (
                            <p className="text-xs text-rose-500 truncate max-w-[180px]">{product.rejectionReason}</p>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-sm text-zinc-700">{product.vendor?.store?.name ?? "—"}</p>
                      <p className="text-xs text-zinc-400">{product.vendor?.user?.name}</p>
                    </td>
                    <td className="px-3 py-3 text-xs text-zinc-500">{product.category?.name ?? "—"}</td>
                    <td className="px-3 py-3 text-sm font-medium text-zinc-800">
                      {formatCurrency(Number(product.price))}
                      {product.salePrice && (
                        <p className="text-xs text-emerald-600">{formatCurrency(Number(product.salePrice))}</p>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-zinc-700">{product.stock}</td>
                    <td className="px-3 py-3 text-xs text-zinc-400">
                      {new Date(product.updatedAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={STATUS_TONE[product.status] ?? "muted"}>
                        {product.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <RowActions product={product} onReject={() => setRejectProduct(product)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400">Page {data.page} of {data.totalPages} · {data.total} products</p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8" disabled={data.page <= 1}
              onClick={() => updateParams({ page: String(data.page - 1) })}>
              <ChevronLeft size={14} />
            </Button>
            <Button size="sm" variant="outline" className="h-8" disabled={data.page >= data.totalPages}
              onClick={() => updateParams({ page: String(data.page + 1) })}>
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
