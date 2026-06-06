"use client";

import { useState, useTransition } from "react";
import {
  Wallet, Users, ArrowUpRight, Check, X, ChevronsRight,
  CircleDollarSign, Clock, BadgeCheck, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import {
  adminCreatePayout,
  processWithdrawal,
  markWithdrawalPaid,
  rejectWithdrawal,
  bulkAdminPayout,
} from "@/lib/admin/withdrawal-actions";

// ── Types ─────────────────────────────────────────────────────────────────────

type VendorBalance = {
  vendorId: string;
  storeName: string;
  ownerName: string;
  email: string;
  bankName: string | null;
  accountTitle: string | null;
  accountNumber: string | null;
  iban: string | null;
  grossEarnings: number;
  totalCommission: number;
  vendorEarnings: number;
  committed: number;
  available: number;
  pendingRequestCount: number;
  lastPaidAt: Date | null;
  lastPaidAmount: number | null;
};

type Withdrawal = {
  id: string;
  vendorId: string;
  amount: number;
  method: string;
  status: string;
  initiatedByAdmin: boolean;
  adminNote: string | null;
  rejectionReason: string | null;
  reference: string | null;
  requestedAt: Date;
  paidAt: Date | null;
  vendor: {
    user: { name: string | null; email: string };
    store: { name: string | null } | null;
  };
};

type Stats = {
  requested: number;
  processing: number;
  paid: number;
  rejected: number;
  pendingAmount: number;
  paidAmount: number;
};

// ── Tone helpers ──────────────────────────────────────────────────────────────

const STATUS_TONE: Record<string, "success" | "warning" | "accent" | "danger" | "muted"> = {
  REQUESTED: "warning",
  APPROVED: "accent",
  PROCESSING: "accent",
  PAID: "success",
  REJECTED: "danger",
  CANCELLED: "muted",
  REVERSED: "muted",
};

const METHODS = [
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "EASYPAISA", label: "EasyPaisa" },
  { value: "JAZZCASH", label: "JazzCash" },
];

// ── Create payout modal ───────────────────────────────────────────────────────

function CreatePayoutModal({
  vendor,
  onClose,
}: {
  vendor: VendorBalance;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("vendorId", vendor.vendorId);
    startTransition(async () => {
      const r = await adminCreatePayout(fd);
      if (r.success) { toast.success(r.message); onClose(); }
      else toast.error(r.error);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <h3 className="font-semibold text-zinc-900">Create Payout</h3>
            <p className="text-xs text-zinc-500">{vendor.storeName} · {vendor.ownerName}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* Balance info */}
          <div className="rounded-xl bg-brand-50 p-4">
            <p className="text-xs text-zinc-500">Available Balance</p>
            <p className="text-2xl font-bold text-zinc-950">{formatCurrency(vendor.available)}</p>
            <p className="mt-1 text-xs text-zinc-400">
              Earnings: {formatCurrency(vendor.vendorEarnings)} · Commission paid: {formatCurrency(vendor.totalCommission)}
            </p>
          </div>

          {/* Bank details */}
          {vendor.accountNumber && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 space-y-0.5">
              <p><span className="text-zinc-400">Bank:</span> {vendor.bankName ?? "—"}</p>
              <p><span className="text-zinc-400">Account:</span> {vendor.accountTitle} · {vendor.accountNumber}</p>
              {vendor.iban && <p><span className="text-zinc-400">IBAN:</span> {vendor.iban}</p>}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">Amount (PKR) *</label>
            <div className="flex items-center gap-2">
              <Input
                name="amount"
                type="number"
                min={1}
                max={vendor.available}
                defaultValue={Math.floor(vendor.available)}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">Method *</label>
            <select
              name="method"
              defaultValue="BANK_TRANSFER"
              className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Reference / Txn ID
              <span className="ml-1 text-xs text-zinc-400">(leave blank to set Processing first)</span>
            </label>
            <Input name="reference" placeholder="e.g. TXN123456789" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">Note (optional)</label>
            <Input name="note" placeholder="e.g. Weekly payout — June W1" />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isPending || vendor.available <= 0} className="flex-1 gap-1.5">
              <ArrowUpRight size={15} />
              {isPending ? "Creating…" : "Create Payout"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Mark Paid modal ───────────────────────────────────────────────────────────

function MarkPaidModal({
  withdrawal,
  onClose,
}: {
  withdrawal: Withdrawal;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await markWithdrawalPaid(withdrawal.id, fd);
      if (r.success) { toast.success(r.message); onClose(); }
      else toast.error(r.error);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h3 className="font-semibold text-zinc-900">Mark as Paid</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-xs text-zinc-500">{withdrawal.vendor.store?.name ?? withdrawal.vendor.user.name}</p>
            <p className="text-2xl font-bold text-zinc-950">{formatCurrency(withdrawal.amount)}</p>
            <p className="mt-0.5 text-xs text-zinc-400">{withdrawal.method.replace(/_/g, " ")}</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Reference / Transaction ID *
            </label>
            <Input name="reference" placeholder="e.g. TXN123456789" required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">Note (optional)</label>
            <Input name="note" placeholder="Optional note for vendor" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isPending} className="flex-1 gap-1.5">
              <BadgeCheck size={15} />
              {isPending ? "Marking…" : "Mark Paid & Notify Vendor"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Reject modal ──────────────────────────────────────────────────────────────

function RejectModal({
  withdrawal,
  onClose,
}: {
  withdrawal: Withdrawal;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await rejectWithdrawal(withdrawal.id, reason);
      if (r.success) { toast.success(r.message); onClose(); }
      else toast.error(r.error);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h3 className="font-semibold text-zinc-900">Reject Withdrawal</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <p className="text-sm text-zinc-600">
            Rejecting {formatCurrency(withdrawal.amount)} for{" "}
            <strong>{withdrawal.vendor.store?.name ?? withdrawal.vendor.user.name}</strong>.
            The vendor will be notified.
          </p>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">Reason *</label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Incomplete bank details"
              required
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isPending || !reason.trim()}
              className="flex-1 gap-1.5 bg-rose-500 hover:bg-rose-600 text-white"
            >
              <X size={14} />
              {isPending ? "Rejecting…" : "Reject & Notify"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Bulk payout panel ─────────────────────────────────────────────────────────

function BulkPayoutPanel({ vendors }: { vendors: VendorBalance[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [note, setNote] = useState("Weekly payout");
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const eligible = vendors.filter((v) => v.available > 0);
  const selectedVendors = eligible.filter((v) => selected.has(v.vendorId));
  const totalSelected = selectedVendors.reduce((s, v) => s + v.available, 0);

  function toggleAll() {
    if (selected.size === eligible.length) setSelected(new Set());
    else setSelected(new Set(eligible.map((v) => v.vendorId)));
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleBulk() {
    if (!selected.size) { toast.error("Select at least one vendor."); return; }
    startTransition(async () => {
      const r = await bulkAdminPayout(Array.from(selected), method as any, note);
      if (r.success) {
        toast.success(r.message);
        setSelected(new Set());
      } else {
        toast.error(r.error);
      }
    });
  }

  if (eligible.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users size={16} className="text-brand-600" />
              Bulk Payout
            </CardTitle>
            <p className="mt-0.5 text-xs text-zinc-400">
              Select multiple vendors and create payouts in one step ({eligible.length} eligible)
            </p>
          </div>
          {expanded ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
        </button>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-600">Payout Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-600">Note</label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} className="h-9" />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-4 py-2.5">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-zinc-600">
                <input
                  type="checkbox"
                  checked={selected.size === eligible.length && eligible.length > 0}
                  onChange={toggleAll}
                  className="rounded"
                />
                Select All ({eligible.length})
              </label>
              {selected.size > 0 && (
                <span className="text-xs text-brand-600 font-medium">
                  {selected.size} selected · {formatCurrency(totalSelected)}
                </span>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-zinc-50">
              {eligible.map((v) => (
                <label
                  key={v.vendorId}
                  className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-zinc-50"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(v.vendorId)}
                    onChange={() => toggle(v.vendorId)}
                    className="rounded"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-800 truncate">{v.storeName}</p>
                    <p className="text-xs text-zinc-400">{v.ownerName}</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-700 shrink-0">
                    {formatCurrency(v.available)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleBulk}
              disabled={isPending || selected.size === 0}
              className="gap-2"
            >
              <ArrowUpRight size={15} />
              {isPending ? "Creating…" : `Create ${selected.size} Payout${selected.size !== 1 ? "s" : ""}`}
            </Button>
            {selected.size > 0 && (
              <span className="text-sm text-zinc-500">
                Total: <strong className="text-zinc-900">{formatCurrency(totalSelected)}</strong>
              </span>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ── Vendor balance table ──────────────────────────────────────────────────────

function VendorBalanceTable({
  vendors,
  onPayout,
}: {
  vendors: VendorBalance[];
  onPayout: (v: VendorBalance) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Balances</CardTitle>
        <p className="mt-0.5 text-xs text-zinc-400">
          Available = earnings from delivered orders minus commission minus prior payouts
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {vendors.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-400">No active vendors found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/50">
                <tr>
                  {["Vendor", "Gross Revenue", "Commission", "Net Earnings", "In Progress", "Available", "Last Paid", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {vendors.map((v) => (
                  <tr key={v.vendorId} className="hover:bg-zinc-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-800">{v.storeName}</p>
                      <p className="text-xs text-zinc-400">{v.ownerName}</p>
                      {v.pendingRequestCount > 0 && (
                        <Badge tone="warning" className="mt-1 text-[10px]">
                          {v.pendingRequestCount} request{v.pendingRequestCount > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-600">{formatCurrency(v.grossEarnings)}</td>
                    <td className="px-4 py-3 text-xs text-accent-600">−{formatCurrency(v.totalCommission)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-zinc-800">{formatCurrency(v.vendorEarnings)}</td>
                    <td className="px-4 py-3 text-xs text-amber-600">{formatCurrency(v.committed)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${v.available > 0 ? "text-emerald-700" : "text-zinc-400"}`}>
                        {formatCurrency(v.available)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400">
                      {v.lastPaidAt
                        ? new Date(v.lastPaidAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })
                        : "Never"}
                      {v.lastPaidAmount && (
                        <span className="block text-[10px] text-zinc-300">{formatCurrency(v.lastPaidAmount)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onPayout(v)}
                        disabled={v.available <= 0}
                        className="gap-1 text-xs"
                      >
                        <ArrowUpRight size={12} /> Pay Out
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Withdrawal queue ──────────────────────────────────────────────────────────

function WithdrawalQueue({
  withdrawals,
  filter,
  onFilterChange,
}: {
  withdrawals: Withdrawal[];
  filter: string;
  onFilterChange: (f: string) => void;
}) {
  const [markPaidTarget, setMarkPaidTarget] = useState<Withdrawal | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Withdrawal | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleProcess(id: string) {
    startTransition(async () => {
      const r = await processWithdrawal(id);
      if (r.success) toast.success(r.message);
      else toast.error(r.error);
    });
  }

  const filters = ["ALL", "REQUESTED", "PROCESSING", "PAID", "REJECTED", "CANCELLED", "REVERSED"];

  return (
    <>
      {markPaidTarget && (
        <MarkPaidModal withdrawal={markPaidTarget} onClose={() => setMarkPaidTarget(null)} />
      )}
      {rejectTarget && (
        <RejectModal withdrawal={rejectTarget} onClose={() => setRejectTarget(null)} />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle>Withdrawal Queue</CardTitle>
              <p className="mt-0.5 text-xs text-zinc-400">
                Vendor requests and admin-initiated payouts
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => onFilterChange(f)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    filter === f
                      ? "bg-brand-500 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {f === "ALL" ? "All" : f === "REVERSED" ? "Reversed" : f === "CANCELLED" ? "Cancelled" : f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {withdrawals.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-400">
              No withdrawals match this filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-100 bg-zinc-50/50">
                  <tr>
                    {["Vendor", "Amount", "Method", "Type", "Status", "Date", "Reference", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-zinc-50/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-800">
                          {w.vendor.store?.name ?? w.vendor.user.name ?? "—"}
                        </p>
                        <p className="text-xs text-zinc-400">{w.vendor.user.email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-zinc-900">
                        {formatCurrency(w.amount)}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {w.method.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={w.initiatedByAdmin ? "accent" : "muted"}>
                          {w.initiatedByAdmin ? "Admin" : "Vendor"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={STATUS_TONE[w.status] ?? "muted"}>
                          {w.status === "CANCELLED" ? "Cancelled" : w.status === "REVERSED" ? "Reversed" : w.status}
                        </Badge>
                        {w.rejectionReason && (
                          <p className="mt-0.5 text-[10px] text-rose-500 max-w-[140px] truncate" title={w.rejectionReason}>
                            {w.rejectionReason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400">
                        {new Date(w.requestedAt).toLocaleDateString("en-PK", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                        {w.reference ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {w.status === "REQUESTED" && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleProcess(w.id)}
                              disabled={isPending}
                              title="Move to Processing"
                              className="flex items-center gap-1 rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
                            >
                              <ChevronsRight size={12} /> Process
                            </button>
                            <button
                              onClick={() => setMarkPaidTarget(w)}
                              title="Mark as Paid"
                              className="flex items-center gap-1 rounded-md border border-emerald-200 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
                            >
                              <Check size={12} /> Pay
                            </button>
                            <button
                              onClick={() => setRejectTarget(w)}
                              title="Reject"
                              className="flex items-center gap-1 rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        )}
                        {w.status === "PROCESSING" && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setMarkPaidTarget(w)}
                              className="flex items-center gap-1 rounded-md border border-emerald-200 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
                            >
                              <BadgeCheck size={12} /> Mark Paid
                            </button>
                            <button
                              onClick={() => setRejectTarget(w)}
                              className="flex items-center gap-1 rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        )}
                        {["PAID", "REJECTED", "CANCELLED", "REVERSED"].includes(w.status) && (
                          <span className="text-xs text-zinc-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function WithdrawalManager({
  vendors,
  withdrawals,
  stats,
}: {
  vendors: VendorBalance[];
  withdrawals: Withdrawal[];
  stats: Stats;
}) {
  const [payoutTarget, setPayoutTarget] = useState<VendorBalance | null>(null);
  const [queueFilter, setQueueFilter] = useState("ALL");

  const filteredWithdrawals =
    queueFilter === "ALL"
      ? withdrawals
      : withdrawals.filter((w) => w.status === queueFilter);

  const statCards = [
    { icon: Clock, label: "Pending Requests", value: stats.requested, sub: formatCurrency(stats.pendingAmount), tone: "warning" },
    { icon: ChevronsRight, label: "Processing", value: stats.processing, sub: "Being transferred", tone: "accent" },
    { icon: BadgeCheck, label: "Paid This Period", value: stats.paid, sub: formatCurrency(stats.paidAmount), tone: "success" },
    { icon: X, label: "Rejected", value: stats.rejected, sub: "View queue for details", tone: "danger" },
  ];

  return (
    <>
      {payoutTarget && (
        <CreatePayoutModal vendor={payoutTarget} onClose={() => setPayoutTarget(null)} />
      )}

      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-bold text-zinc-950">Withdrawals & Payouts</h2>
          <p className="mt-0.5 text-sm text-zinc-400">
            Manage vendor payouts. Admin pays weekly after receiving marketplace funds — vendors may also submit requests.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="flex items-start justify-between gap-4 pt-5">
                <div>
                  <p className="text-sm text-zinc-500">{s.label}</p>
                  <p className="mt-1 text-2xl font-bold text-zinc-950">{s.value}</p>
                  <p className="mt-1 text-xs text-zinc-400">{s.sub}</p>
                </div>
                <div className={`grid size-10 shrink-0 place-items-center rounded-lg ${
                  s.tone === "warning" ? "bg-amber-50 text-amber-600" :
                  s.tone === "accent" ? "bg-brand-50 text-brand-600" :
                  s.tone === "success" ? "bg-emerald-50 text-emerald-600" :
                  "bg-rose-50 text-rose-500"
                }`}>
                  <s.icon size={18} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payout flow explainer */}
        <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          {[
            { label: "Order Delivered", color: "bg-zinc-200 text-zinc-700" },
            { label: "Commission Deducted", color: "bg-accent-50 text-accent-700" },
            { label: "Balance Updated", color: "bg-brand-50 text-brand-700" },
            { label: "Admin Pays Vendor", color: "bg-amber-50 text-amber-700" },
            { label: "Reference Added", color: "bg-emerald-50 text-emerald-700" },
            { label: "Vendor Notified", color: "bg-emerald-100 text-emerald-800" },
          ].map((step, i, arr) => (
            <div key={step.label} className="flex shrink-0 items-center gap-2">
              <div className={`rounded-lg px-3 py-1.5 text-xs font-medium ${step.color}`}>
                {step.label}
              </div>
              {i < arr.length - 1 && <ArrowUpRight size={12} className="text-zinc-300 shrink-0 rotate-45" />}
            </div>
          ))}
        </div>

        {/* Bulk payout */}
        <BulkPayoutPanel vendors={vendors} />

        {/* Vendor balance table */}
        <VendorBalanceTable vendors={vendors} onPayout={setPayoutTarget} />

        {/* Withdrawal queue */}
        <WithdrawalQueue
          withdrawals={filteredWithdrawals}
          filter={queueFilter}
          onFilterChange={setQueueFilter}
        />
      </div>
    </>
  );
}
