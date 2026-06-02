"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Copy, Edit2, MoreHorizontal,
  Plus, Search, Trash2, X, Archive, Send,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import {
  deleteProductAction,
  duplicateProductAction,
  bulkDeleteProductsAction,
  bulkArchiveProductsAction,
  changeProductStatusAction,
} from "@/lib/vendor/product-actions";
import type { getVendorProducts, getVendorProductStats } from "@/lib/vendor/product-data";

type ProductList = Awaited<ReturnType<typeof getVendorProducts>>;
type Product = ProductList["products"][number];
type Stats = Awaited<ReturnType<typeof getVendorProductStats>>;

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "muted" | "accent"> = {
  DRAFT: "muted",
  PENDING_REVIEW: "warning",
  ACTIVE: "success",
  REJECTED: "danger",
  ARCHIVED: "muted",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending Review",
  ACTIVE: "Active",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
};

const MENU_WIDTH = 180;

function RowMenu({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [isPending, startTransition] = useTransition();
  const btnRef = useRef<HTMLButtonElement>(null);

  function openMenu() {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuHeight = 220;
    let top = rect.bottom + 6;
    let left = rect.right - MENU_WIDTH;
    if (top + menuHeight > window.innerHeight - 16) top = rect.top - menuHeight - 6;
    if (left < 8) left = 8;
    if (left + MENU_WIDTH > window.innerWidth - 8) left = window.innerWidth - MENU_WIDTH - 8;
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

  function run(fn: () => Promise<{ success: boolean; message?: string; error?: string }>) {
    startTransition(async () => {
      const r = await fn();
      "success" in r && r.success && "message" in r ? toast.success(r.message) : toast.error((r as any).error);
      setOpen(false);
    });
  }

  const dropdown = open
    ? createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div
            style={{ top: coords.top, left: coords.left, width: MENU_WIDTH }}
            className="fixed z-[9999] rounded-lg border border-zinc-200 bg-white py-1 shadow-xl"
          >
            <Link
              href={`/vendor/products/${product.id}/edit`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              onClick={() => setOpen(false)}
            >
              <Edit2 size={14} /> Edit product
            </Link>
            <button
              onClick={() => run(() => duplicateProductAction(product.id))}
              disabled={isPending}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              <Copy size={14} /> Duplicate
            </button>
            {product.status === "DRAFT" && (
              <button
                onClick={() => run(() => changeProductStatusAction(product.id, "PENDING_REVIEW"))}
                disabled={isPending}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-brand-700 hover:bg-brand-50"
              >
                <Send size={14} /> Submit for review
              </button>
            )}
            {product.status === "PENDING_REVIEW" && (
              <button
                onClick={() => run(() => changeProductStatusAction(product.id, "DRAFT"))}
                disabled={isPending}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                <Archive size={14} /> Move to Draft
              </button>
            )}
            {product.status !== "ARCHIVED" && (
              <button
                onClick={() => run(() => changeProductStatusAction(product.id, "ARCHIVED"))}
                disabled={isPending}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
              >
                <Archive size={14} /> Archive
              </button>
            )}
            <hr className="my-1 border-zinc-100" />
            <button
              onClick={() => run(() => deleteProductAction(product.id))}
              disabled={isPending}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={openMenu}
        className="grid size-8 place-items-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        aria-label="Actions"
      >
        <MoreHorizontal size={16} />
      </button>
      {dropdown}
    </>
  );
}

export function ProductTable({
  data,
  stats,
}: {
  data: ProductList;
  stats: Stats;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkPending, startBulkTransition] = useTransition();

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      v === null ? params.delete(k) : params.set(k, v);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const currentSearch = searchParams.get("search") ?? "";
  const currentStatus = searchParams.get("status") ?? "ALL";
  const currentPage = Number(searchParams.get("page") ?? "1");

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    updateParams({ search: fd.get("search") as string, page: "1" });
  }

  const allIds = data.products.map((p) => p.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allIds));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function bulkDelete() {
    startBulkTransition(async () => {
      const r = await bulkDeleteProductsAction(Array.from(selected));
      r.success ? toast.success(r.message) : toast.error(r.error);
      setSelected(new Set());
    });
  }

  function bulkArchive() {
    startBulkTransition(async () => {
      const r = await bulkArchiveProductsAction(Array.from(selected));
      r.success ? toast.success(r.message) : toast.error(r.error);
      setSelected(new Set());
    });
  }

  const { products, total, page, totalPages } = data;

  const statCards = [
    { label: "Total", value: stats.total, color: "text-zinc-700" },
    { label: "Pending", value: stats.pending, color: "text-amber-600" },
    { label: "Active", value: stats.active, color: "text-emerald-600" },
    { label: "Rejected", value: stats.rejected, color: "text-rose-600" },
    { label: "Low Stock", value: stats.lowStock, color: "text-orange-600" },
  ];

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {statCards.map((s) => (
          <Card key={s.label}>
            <div className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                name="search"
                defaultValue={currentSearch}
                placeholder="Search products, SKU…"
                className="h-9 w-60 rounded-md border border-zinc-200 bg-white pl-8 pr-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <Button type="submit" size="sm" variant="outline" className="h-9">Search</Button>
            {currentSearch && (
              <button type="button" onClick={() => updateParams({ search: null, page: "1" })} className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600">
                <X size={12} /> Clear
              </button>
            )}
          </form>
          <select
            value={currentStatus}
            onChange={(e) => updateParams({ status: e.target.value, page: "1" })}
            className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:border-brand-400 focus:outline-none"
          >
            <option value="ALL">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="ACTIVE">Active</option>
            <option value="REJECTED">Rejected</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
        <Link href="/vendor/products/new">
          <Button className="gap-2"><Plus size={15} /> Add Product</Button>
        </Link>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5">
          <span className="text-sm font-medium text-brand-700">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={bulkArchive} disabled={isBulkPending} className="h-8 gap-1.5">
            <Archive size={13} /> Archive
          </Button>
          <Button size="sm" variant="danger" onClick={bulkDelete} disabled={isBulkPending} className="h-8 gap-1.5">
            <Trash2 size={13} /> Delete
          </Button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-brand-600 hover:text-brand-800">
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <Card className="overflow-hidden">
        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <span className="text-5xl">📦</span>
            <p className="font-medium text-zinc-700">No products found</p>
            <p className="text-sm text-zinc-400">Add your first product to start selling.</p>
            <Link href="/vendor/products/new">
              <Button className="mt-2 gap-2"><Plus size={15} /> Add Product</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/50">
                <tr>
                  <th className="px-4 py-3">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                      className="size-4 rounded border-zinc-300 text-brand-500 focus:ring-brand-500" />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Product</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">SKU</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Category</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Price</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Stock</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Sales</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Status</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Updated</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {products.map((product) => (
                  <tr key={product.id} className={`hover:bg-zinc-50/60 ${selected.has(product.id) ? "bg-brand-50/30" : ""}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(product.id)} onChange={() => toggleOne(product.id)}
                        className="size-4 rounded border-zinc-300 text-brand-500 focus:ring-brand-500" />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        {product.images[0] ? (
                          <img src={product.images[0].url} alt={product.name}
                            className="size-10 shrink-0 rounded-md object-cover border border-zinc-100" />
                        ) : (
                          <div className="size-10 shrink-0 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-300 text-lg">📷</div>
                        )}
                        <div className="min-w-0">
                          <Link href={`/vendor/products/${product.id}/edit`}
                            className="block truncate font-medium text-zinc-900 hover:text-brand-600 max-w-[200px]">
                            {product.name}
                          </Link>
                          {product.status === "REJECTED" && (
                            <p className="text-xs text-rose-500 mt-0.5">Review rejection reason</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-zinc-500">{product.sku ?? "—"}</td>
                    <td className="px-3 py-3 text-xs text-zinc-500">{product.category?.name ?? "—"}</td>
                    <td className="px-3 py-3">
                      <p className="text-sm font-medium text-zinc-800">{formatCurrency(Number(product.price))}</p>
                      {product.salePrice && (
                        <p className="text-xs text-emerald-600">{formatCurrency(Number(product.salePrice))}</p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-sm font-medium ${product.stock === 0 ? "text-rose-600" : product.stock <= 5 ? "text-amber-600" : "text-zinc-800"}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-zinc-500">{product._count.orderItems}</td>
                    <td className="px-3 py-3">
                      <Badge tone={STATUS_TONE[product.status] ?? "muted"}>
                        {STATUS_LABEL[product.status] ?? product.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-xs text-zinc-400">
                      {new Date(product.updatedAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-4 py-3"><RowMenu product={product} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400">Page {page} of {totalPages} · {total} products</p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8" disabled={page <= 1} onClick={() => updateParams({ page: String(page - 1) })}>
              <ChevronLeft size={14} />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button key={p} onClick={() => updateParams({ page: String(p) })}
                  className={`size-8 rounded-md text-xs font-medium ${p === page ? "bg-brand-500 text-white" : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}>
                  {p}
                </button>
              );
            })}
            <Button size="sm" variant="outline" className="h-8" disabled={page >= totalPages} onClick={() => updateParams({ page: String(page + 1) })}>
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
