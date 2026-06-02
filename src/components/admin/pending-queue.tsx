"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/format";
import {
  approveVendor,
  rejectVendor,
  approveWithdrawal,
  rejectWithdrawal,
  approveRefund,
  rejectRefund,
} from "@/lib/admin/actions";
import type {
  getPendingVendors,
  getPendingWithdrawals,
  getPendingRefunds,
} from "@/lib/admin/dashboard-data";

type PendingVendors = Awaited<ReturnType<typeof getPendingVendors>>;
type PendingWithdrawals = Awaited<ReturnType<typeof getPendingWithdrawals>>;
type PendingRefunds = Awaited<ReturnType<typeof getPendingRefunds>>;

// ── Vendor Queue ──────────────────────────────────────────────────────────────

function VendorQueueRow({ vendor }: { vendor: PendingVendors[number] }) {
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(async () => {
      const r = await approveVendor(vendor.id);
      r.success ? toast.success(r.message) : toast.error(r.error);
    });
  }

  function handleReject() {
    startTransition(async () => {
      const r = await rejectVendor(vendor.id, "Rejected from pending queue");
      r.success ? toast.success(r.message) : toast.error(r.error);
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-100 p-3">
      <Avatar name={vendor.store?.name ?? vendor.user.name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-800">
          {vendor.store?.name ?? "No store yet"}
        </p>
        <p className="text-xs text-zinc-400">{vendor.user.email}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          size="sm"
          variant="default"
          onClick={handleApprove}
          disabled={isPending}
          className="h-7 px-3 text-xs"
        >
          Approve
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={handleReject}
          disabled={isPending}
          className="h-7 px-3 text-xs"
        >
          Reject
        </Button>
      </div>
    </div>
  );
}

// ── Withdrawal Queue ──────────────────────────────────────────────────────────

function WithdrawalQueueRow({ withdrawal }: { withdrawal: PendingWithdrawals[number] }) {
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(async () => {
      const r = await approveWithdrawal(withdrawal.id);
      r.success ? toast.success(r.message) : toast.error(r.error);
    });
  }

  function handleReject() {
    startTransition(async () => {
      const r = await rejectWithdrawal(withdrawal.id, "Rejected from dashboard");
      r.success ? toast.success(r.message) : toast.error(r.error);
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-100 p-3">
      <Avatar name={withdrawal.vendor?.store?.name ?? withdrawal.vendor?.user?.name ?? "?"} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-800">
          {withdrawal.vendor?.store?.name ?? "Unknown vendor"}
        </p>
        <p className="text-xs text-zinc-400">
          {formatCurrency(Number(withdrawal.amount))} · {withdrawal.method.replace("_", " ")}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          size="sm"
          variant="default"
          onClick={handleApprove}
          disabled={isPending}
          className="h-7 px-3 text-xs"
        >
          Approve
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={handleReject}
          disabled={isPending}
          className="h-7 px-3 text-xs"
        >
          Reject
        </Button>
      </div>
    </div>
  );
}

// ── Refund Queue ──────────────────────────────────────────────────────────────

function RefundQueueRow({ refund }: { refund: PendingRefunds[number] }) {
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(async () => {
      const r = await approveRefund(refund.id);
      r.success ? toast.success(r.message) : toast.error(r.error);
    });
  }

  function handleReject() {
    startTransition(async () => {
      const r = await rejectRefund(refund.id, "Rejected from dashboard");
      r.success ? toast.success(r.message) : toast.error(r.error);
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-100 p-3">
      <Avatar name={refund.customer.name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-800">{refund.customer.name}</p>
        <p className="text-xs text-zinc-400">
          {refund.order.orderNumber} · {formatCurrency(Number(refund.amount))}
        </p>
        <p className="mt-0.5 text-xs text-zinc-300 italic">{refund.reason}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          size="sm"
          variant="default"
          onClick={handleApprove}
          disabled={isPending}
          className="h-7 px-3 text-xs"
        >
          Approve
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={handleReject}
          disabled={isPending}
          className="h-7 px-3 text-xs"
        >
          Reject
        </Button>
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

export function PendingQueue({
  pendingVendors,
  pendingWithdrawals,
  pendingRefunds,
}: {
  pendingVendors: PendingVendors;
  pendingWithdrawals: PendingWithdrawals;
  pendingRefunds: PendingRefunds;
}) {
  const hasVendors = pendingVendors.length > 0;
  const hasWithdrawals = pendingWithdrawals.length > 0;
  const hasRefunds = pendingRefunds.length > 0;
  const hasAny = hasVendors || hasWithdrawals || hasRefunds;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Vendor approvals */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Vendor Approvals</CardTitle>
            {hasVendors && (
              <Badge tone="warning">{pendingVendors.length}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!hasVendors ? (
            <p className="py-4 text-center text-sm text-zinc-400">All caught up ✓</p>
          ) : (
            pendingVendors.map((v) => <VendorQueueRow key={v.id} vendor={v} />)
          )}
        </CardContent>
      </Card>

      {/* Withdrawal requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Withdrawal Requests</CardTitle>
            {hasWithdrawals && (
              <Badge tone="accent">{pendingWithdrawals.length}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!hasWithdrawals ? (
            <p className="py-4 text-center text-sm text-zinc-400">All caught up ✓</p>
          ) : (
            pendingWithdrawals.map((w) => <WithdrawalQueueRow key={w.id} withdrawal={w} />)
          )}
        </CardContent>
      </Card>

      {/* Refund requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Refund Requests</CardTitle>
            {hasRefunds && (
              <Badge tone="danger">{pendingRefunds.length}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!hasRefunds ? (
            <p className="py-4 text-center text-sm text-zinc-400">All caught up ✓</p>
          ) : (
            pendingRefunds.map((r) => <RefundQueueRow key={r.id} refund={r} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
