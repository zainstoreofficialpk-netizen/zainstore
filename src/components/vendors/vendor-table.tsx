"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
  Search,
  Trash2,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { bulkVendorAction, type BulkAction } from "@/lib/admin/vendor-actions";
import { formatCurrency } from "@/lib/format";
import type { getVendorList } from "@/lib/admin/vendor-data";

type VendorList = Awaited<ReturnType<typeof getVendorList>>;
type Vendor = VendorList["vendors"][number];

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "muted"> = {
  ACTIVE: "success",
  PENDING_APPROVAL: "warning",
  REJECTED: "danger",
  SUSPENDED: "muted",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  PENDING_APPROVAL: "Pending",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
};

// ── Row dropdown menu ─────────────────────────────────────────────────────────
// Uses a fixed-position portal so overflow:auto/hidden on parent containers
// cannot clip the dropdown.

const MENU_WIDTH = 176; // w-44 = 176px

function RowMenu({ vendor }: { vendor: Vendor }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [isPending, startTransition] = useTransition();
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function openMenu() {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuHeight = 180; // approximate

    // Default: open below-right of button
    let top = rect.bottom + 6;
    let left = rect.right - MENU_WIDTH;

    // Flip above if not enough space below
    if (top + menuHeight > viewportHeight - 16) {
      top = rect.top - menuHeight - 6;
    }
    // Clamp horizontally inside viewport
    if (left < 8) left = 8;
    if (left + MENU_WIDTH > viewportWidth - 8) left = viewportWidth - MENU_WIDTH - 8;

    setCoords({ top, left });
    setOpen(true);
  }

  // Close on scroll or resize (button position shifts)
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  function runBulk(action: BulkAction) {
    startTransition(async () => {
      const r = await bulkVendorAction([vendor.id], action);
      r.success ? toast.success(r.message) : toast.error(r.error);
      setOpen(false);
    });
  }

  const dropdown = open
    ? createPortal(
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          {/* Menu — rendered at fixed screen coords, always above table overflow */}
          <div
            ref={menuRef}
            style={{ top: coords.top, left: coords.left, width: MENU_WIDTH }}
            className="fixed z-[9999] rounded-lg border border-zinc-200 bg-white py-1 shadow-xl"
          >
            <Link
              href={`/admin/vendors/${vendor.id}`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              onClick={() => setOpen(false)}
            >
              <Eye size={14} /> View profile
            </Link>
            {vendor.status === "PENDING_APPROVAL" && (
              <button
                onClick={() => runBulk("approve")}
                disabled={isPending}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50"
              >
                <Check size={14} /> Approve
              </button>
            )}
            {(vendor.status === "PENDING_APPROVAL" || vendor.status === "ACTIVE") && (
              <button
                onClick={() => runBulk(vendor.status === "ACTIVE" ? "suspend" : "reject")}
                disabled={isPending}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50"
              >
                <UserX size={14} /> {vendor.status === "ACTIVE" ? "Suspend" : "Reject"}
              </button>
            )}
            {vendor.status === "SUSPENDED" && (
              <button
                onClick={() => runBulk("activate")}
                disabled={isPending}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50"
              >
                <UserCheck size={14} /> Reactivate
              </button>
            )}
            <hr className="my-1 border-zinc-100" />
            <button
              onClick={() => runBulk("delete")}
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
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreHorizontal size={16} />
      </button>
      {dropdown}
    </>
  );
}

// ── Main table component ──────────────────────────────────────────────────────

export function VendorTable({
  data,
}: {
  data: VendorList;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<BulkAction>("approve");
  const [isBulkPending, startBulkTransition] = useTransition();

  // ── URL param helpers ──

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null) params.delete(k);
      else params.set(k, v);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const currentSearch = searchParams.get("search") ?? "";
  const currentStatus = searchParams.get("status") ?? "ALL";
  const currentPage = Number(searchParams.get("page") ?? "1");

  // ── Search (debounce via router.push on submit) ──

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    updateParams({ search: fd.get("search") as string, page: "1" });
  }

  // ── Selection ──

  const allIds = data.vendors.map((v) => v.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allIds));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Bulk submit ──

  function handleBulkSubmit() {
    startBulkTransition(async () => {
      const r = await bulkVendorAction(Array.from(selected), bulkAction);
      if (r.success) {
        toast.success(r.message);
        setSelected(new Set());
      } else {
        toast.error(r.error);
      }
    });
  }

  const { vendors, total, page, totalPages } = data;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                name="search"
                defaultValue={currentSearch}
                placeholder="Search vendors, stores, email…"
                className="h-9 rounded-md border border-zinc-200 bg-white pl-8 pr-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 w-64"
              />
            </div>
            <Button type="submit" size="sm" variant="outline" className="h-9">
              Search
            </Button>
            {currentSearch && (
              <button
                type="button"
                onClick={() => updateParams({ search: null, page: "1" })}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600"
              >
                <X size={12} /> Clear
              </button>
            )}
          </form>

          {/* Status filter */}
          <select
            value={currentStatus}
            onChange={(e) => updateParams({ status: e.target.value, page: "1" })}
            className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="ACTIVE">Active</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        <p className="text-xs text-zinc-400">{total.toLocaleString()} vendors total</p>
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5">
          <span className="text-sm font-medium text-brand-700">
            {selected.size} selected
          </span>
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value as BulkAction)}
            className="h-8 rounded-md border border-brand-200 bg-white px-2 text-sm"
          >
            <option value="approve">Approve</option>
            <option value="reject">Reject</option>
            <option value="suspend">Suspend</option>
            <option value="activate">Activate</option>
            <option value="delete">Delete</option>
          </select>
          <Button
            size="sm"
            onClick={handleBulkSubmit}
            disabled={isBulkPending}
            className="h-8"
          >
            {isBulkPending ? "Running…" : "Apply"}
          </Button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-brand-600 hover:text-brand-800"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      <Card className="overflow-hidden">
        {vendors.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <span className="text-4xl">🏪</span>
            <p className="text-sm font-medium text-zinc-600">No vendors found</p>
            <p className="text-xs text-zinc-400">Try a different search or filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/50">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="size-4 rounded border-zinc-300 text-brand-500 focus:ring-brand-500"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Store / Owner</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Status</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Products</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Orders</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">Registered</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {vendors.map((vendor) => (
                  <tr
                    key={vendor.id}
                    className={`hover:bg-zinc-50/60 ${selected.has(vendor.id) ? "bg-brand-50/30" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(vendor.id)}
                        onChange={() => toggleOne(vendor.id)}
                        className="size-4 rounded border-zinc-300 text-brand-500 focus:ring-brand-500"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={vendor.store?.name ?? vendor.user.name}
                          image={vendor.store?.logoUrl ?? vendor.user.image}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/admin/vendors/${vendor.id}`}
                            className="block truncate font-medium text-zinc-900 hover:text-brand-600"
                          >
                            {vendor.store?.name ?? "—"}
                          </Link>
                          <p className="truncate text-xs text-zinc-400">{vendor.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={STATUS_TONE[vendor.status] ?? "muted"}>
                        {STATUS_LABEL[vendor.status] ?? vendor.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-xs text-zinc-700">
                      {vendor._count.products}
                    </td>
                    <td className="px-3 py-3 text-xs text-zinc-700">
                      {vendor._count.orders}
                    </td>
                    <td className="px-3 py-3 text-xs text-zinc-500">
                      {new Date(vendor.createdAt).toLocaleDateString("en-PK", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <RowMenu vendor={vendor} />
                    </td>
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
          <p className="text-xs text-zinc-400">
            Page {page} of {totalPages} · {total} vendors
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
            >
              <ChevronLeft size={14} />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button
                  key={p}
                  onClick={() => updateParams({ page: String(p) })}
                  className={`size-8 rounded-md text-xs font-medium ${
                    p === page
                      ? "bg-brand-500 text-white"
                      : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
