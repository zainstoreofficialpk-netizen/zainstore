"use client";

import { useState, useTransition } from "react";
import {
  Wallet, Clock, CheckCircle2, XCircle, ArrowUpRight,
  Info, Ban, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { submitWithdrawalRequest, cancelWithdrawalRequest } from "@/lib/vendor/withdrawal-actions";

// ── Types ─────────────────────────────────────────────────────────────────────

type Balance = {
  grossEarnings: number;
  totalCommission: number;
  vendorEarnings: number;
  heldEarnings: number;
  paidOut: number;
  inProgress: number;
  committed: number;
  available: number;
};

type Withdrawal = {
  id: string;
  amount: number;
  method: string;
  status: string;
  initiatedByAdmin: boolean;
  adminNote: string | null;
  rejectionReason: string | null;
  reference: string | null;
  requestedAt: Date;
  paidAt: Date | null;
};

type EarningRow = {
  orderNumber: string;
  orderDate: Date;
  deliveredAt: Date;
  unlockDate: Date;
  isHeld: boolean;
  productName: string;
  quantity: number;
  lineTotal: number;
  commissionTotal: number;
  vendorEarning: number;
};

type BankInfo = {
  bankName: string | null;
  accountTitle: string | null;
  accountNumber: string | null;
  iban: string | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_TONE: Record<string, "success" | "warning" | "accent" | "danger" | "muted"> = {
  REQUESTED: "warning",
  APPROVED: "accent",
  PROCESSING: "accent",
  PAID: "success",
  REJECTED: "danger",
  REVERSED: "muted",
};

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Pending Review",
  APPROVED: "Approved",
  PROCESSING: "Processing",
  PAID: "Paid",
  REJECTED: "Rejected",
  REVERSED: "Cancelled by You",
};

const METHODS = [
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "EASYPAISA", label: "EasyPaisa" },
  { value: "JAZZCASH", label: "JazzCash" },
];

// ── Balance card ──────────────────────────────────────────────────────────────

function BalanceCard({ balance, bankInfo }: { balance: Balance; bankInfo: BankInfo }) {
  return (
    <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500">Available Balance</p>
          <p className="mt-1 text-5xl font-bold tracking-tight text-zinc-950">
            {formatCurrency(balance.available)}
          </p>
          <p className="mt-1.5 text-xs text-zinc-400">Ready for payout · updated in real time</p>
        </div>
        <div className="grid size-14 place-items-center rounded-2xl bg-brand-100 text-brand-600">
          <Wallet size={28} />
        </div>
      </div>

      {balance.heldEarnings > 0 && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <Info size={14} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-xs text-amber-700">
            <strong>{formatCurrency(balance.heldEarnings)}</strong> is under a 7-day holding period after delivery and will unlock soon.
          </p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { label: "Already Paid Out", value: formatCurrency(balance.paidOut), note: "Transferred to you" },
          { label: "Holding (7-day)", value: formatCurrency(balance.heldEarnings), note: "Unlocks automatically" },
          { label: "Pending Request", value: formatCurrency(balance.inProgress), note: "Under review" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white/80 p-3 ring-1 ring-zinc-100">
            <p className="text-[11px] font-medium text-zinc-500">{s.label}</p>
            <p className="mt-0.5 text-sm font-bold text-zinc-900">{s.value}</p>
            <p className="mt-0.5 text-[10px] text-zinc-400">{s.note}</p>
          </div>
        ))}
      </div>

      {!bankInfo.accountNumber && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <Info size={14} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-xs text-amber-700">
            Add bank account details in <strong>Profile → Bank Account</strong> so admin can process your transfers.
          </p>
        </div>
      )}
    </div>
  );
}

// ── How it works explainer ────────────────────────────────────────────────────

function HowItWorks() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-medium text-zinc-700">How payouts work</span>
        {open ? <ChevronUp size={15} className="text-zinc-400" /> : <ChevronDown size={15} className="text-zinc-400" />}
      </button>
      {open && (
        <div className="border-t border-zinc-200 px-4 pb-4 pt-3 text-xs text-zinc-600 space-y-2">
          <p>• Admin pays vendors automatically every week after receiving marketplace payments.</p>
          <p>• You can also request a withdrawal anytime — admin reviews and processes it manually.</p>
          <p>• Only earnings from <strong>delivered and fully paid orders</strong> count toward your balance.</p>
          <p>• Platform commission is automatically deducted before calculating your available amount.</p>
          <p>• Pending requests reduce your available balance to prevent double-requesting.</p>
          <p>• You can cancel a pending request anytime — balance is restored immediately.</p>
        </div>
      )}
    </div>
  );
}

// ── Request form ──────────────────────────────────────────────────────────────

function RequestForm({
  balance,
  openRequest,
}: {
  balance: Balance;
  openRequest: Withdrawal | null;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const num = Number(amount);
    if (!num || num <= 0) { setError("Enter a valid amount."); return; }
    if (num > balance.available) {
      setError(`Amount exceeds your available balance of ${formatCurrency(balance.available)}.`);
      return;
    }
    const fd = new FormData();
    fd.set("amount", amount);
    fd.set("method", method);
    startTransition(async () => {
      const r = await submitWithdrawalRequest(fd);
      if (r.success) {
        toast.success(r.message);
        setAmount("");
      } else {
        setError(r.error);
      }
    });
  }

  function handleCancel() {
    if (!openRequest) return;
    startTransition(async () => {
      const r = await cancelWithdrawalRequest(openRequest.id);
      if (r.success) toast.success(r.message);
      else toast.error(r.error);
    });
  }

  // ── Pending request already exists ────────────────────────────────────────

  if (openRequest) {
    return (
      <Card className="border-amber-200 bg-amber-50/40">
        <CardContent className="pt-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-amber-600" />
                <p className="font-semibold text-zinc-900">Request Under Review</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-zinc-950">{formatCurrency(openRequest.amount)}</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                via {openRequest.method.replace(/_/g, " ")} ·{" "}
                Submitted {new Date(openRequest.requestedAt).toLocaleDateString("en-PK", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                This amount is reserved from your balance.
                Cancel below to restore it to your available balance.
              </p>
            </div>
            <Badge tone="warning">Pending</Badge>
          </div>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isPending}
              className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              <Ban size={13} />
              {isPending ? "Cancelling…" : "Cancel This Request"}
            </Button>
            <p className="mt-1.5 text-[10px] text-zinc-400">
              Cancelling will immediately restore {formatCurrency(openRequest.amount)} to your available balance.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── No open request — show form ───────────────────────────────────────────

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpRight size={17} className="text-brand-600" />
          Request a Withdrawal
        </CardTitle>
        <p className="mt-0.5 text-xs text-zinc-400">
          Optional — admin processes weekly payouts automatically. Requests are reviewed manually.
        </p>
      </CardHeader>
      <CardContent>
        {balance.available <= 0 ? (
          <div className="rounded-xl border-2 border-dashed border-zinc-200 p-6 text-center">
            <Wallet size={28} className="mx-auto mb-2 text-zinc-300" />
            <p className="text-sm font-medium text-zinc-500">No available balance</p>
            <p className="mt-1 text-xs text-zinc-400">
              Your balance builds from delivered, paid orders after platform commission is deducted.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 border border-rose-200">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Amount (PKR) *</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={Math.floor(balance.available)}
                  step={1}
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setError(null); }}
                  placeholder="Enter amount"
                  required
                  className="w-44"
                />
                <button
                  type="button"
                  onClick={() => setAmount(String(Math.floor(balance.available)))}
                  className="text-xs text-brand-600 hover:underline whitespace-nowrap"
                >
                  Use max ({formatCurrency(Math.floor(balance.available))})
                </button>
              </div>
              {amount && Number(amount) > 0 && Number(amount) <= balance.available && (
                <p className="mt-1 text-xs text-zinc-400">
                  After request: Available = {formatCurrency(balance.available - Number(amount))} · In Progress = {formatCurrency(balance.committed + Number(amount))}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Payout Method *</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <Button type="submit" disabled={isPending} className="w-full gap-2">
              <ArrowUpRight size={16} />
              {isPending ? "Submitting…" : "Submit Withdrawal Request"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

// ── Earnings breakdown ────────────────────────────────────────────────────────

function EarningsBreakdown({ rows }: { rows: EarningRow[] }) {
  const [expanded, setExpanded] = useState(false);
  if (rows.length === 0) return null;
  const visible = expanded ? rows : rows.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Earnings Breakdown</CardTitle>
        <p className="mt-0.5 text-xs text-zinc-400">Completed orders contributing to your balance (after commission)</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50/50">
              <tr>
                {["Order #", "Product", "Qty", "Sale Total", "Commission", "Earning", "Status"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {visible.map((row, i) => (
                <tr key={i} className={`hover:bg-zinc-50/50 ${row.isHeld ? "opacity-70" : ""}`}>
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-500">{row.orderNumber}</td>
                  <td className="px-4 py-2.5 text-xs text-zinc-700 max-w-[140px] truncate">{row.productName}</td>
                  <td className="px-4 py-2.5 text-xs text-zinc-500">{row.quantity}</td>
                  <td className="px-4 py-2.5 text-xs text-zinc-800">{formatCurrency(row.lineTotal)}</td>
                  <td className="px-4 py-2.5 text-xs text-accent-600">−{formatCurrency(row.commissionTotal)}</td>
                  <td className="px-4 py-2.5 text-xs font-semibold text-emerald-700">{formatCurrency(row.vendorEarning)}</td>
                  <td className="px-4 py-2.5 text-xs">
                    {row.isHeld ? (
                      <span className="text-amber-600">
                        Held · unlocks {new Date(row.unlockDate).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-medium">Available</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > 5 && (
          <div className="border-t border-zinc-100 p-3 text-center">
            <button onClick={() => setExpanded((v) => !v)} className="text-xs text-brand-600 hover:underline">
              {expanded ? "Show less" : `Show all ${rows.length} orders`}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Payout history ────────────────────────────────────────────────────────────

function PayoutHistory({ withdrawals }: { withdrawals: Withdrawal[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payout History</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {withdrawals.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-400">
            No payout history yet. Completed payouts will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/50">
                <tr>
                  {["Date", "Amount", "Method", "Status", "Reference", "Note"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {withdrawals.map((w) => (
                  <tr key={w.id} className={`hover:bg-zinc-50/50 ${w.status === "REVERSED" ? "opacity-60" : ""}`}>
                    <td className="px-4 py-2.5 text-xs text-zinc-500">
                      {new Date(w.requestedAt).toLocaleDateString("en-PK", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-2.5 text-sm font-semibold text-zinc-900">
                      {formatCurrency(w.amount)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-500">
                      {w.method.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone={STATUS_TONE[w.status] ?? "muted"}>
                        {STATUS_LABEL[w.status] ?? w.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">
                      {w.reference ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs max-w-[160px] truncate">
                      {w.status === "REJECTED"
                        ? <span className="text-rose-500">{w.rejectionReason}</span>
                        : w.adminNote
                        ? <span className="text-zinc-500">{w.adminNote}</span>
                        : w.initiatedByAdmin
                        ? <span className="text-zinc-400">Admin payout</span>
                        : <span className="text-zinc-300">—</span>}
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

// ── Main export ───────────────────────────────────────────────────────────────

export function WithdrawalPanel({
  balance,
  withdrawals,
  earningsBreakdown,
  openRequest,
  bankInfo,
}: {
  balance: Balance;
  withdrawals: Withdrawal[];
  earningsBreakdown: EarningRow[];
  openRequest: Withdrawal | null;
  bankInfo: BankInfo;
}) {
  const totalPaid = balance.paidOut;
  const inProgress = balance.inProgress;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-950">Withdrawals & Payouts</h2>
        <p className="mt-0.5 text-sm text-zinc-400">
          Admin pays weekly automatically. Submit a request below if you need an earlier payout.
        </p>
      </div>

      {/* Big balance card */}
      <BalanceCard balance={balance} bankInfo={bankInfo} />

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: CheckCircle2, label: "Total Paid Out", value: formatCurrency(totalPaid), color: "bg-emerald-50 text-emerald-600" },
          { icon: Clock, label: "In Progress", value: formatCurrency(inProgress), color: "bg-amber-50 text-amber-600" },
          { icon: XCircle, label: "Requests Made", value: withdrawals.length.toString(), color: "bg-zinc-100 text-zinc-500" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 pt-4 pb-4">
              <div className={`grid size-9 shrink-0 place-items-center rounded-lg ${s.color}`}>
                <s.icon size={16} />
              </div>
              <div>
                <p className="text-[11px] text-zinc-500">{s.label}</p>
                <p className="text-sm font-bold text-zinc-900">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Withdrawal request form */}
      <RequestForm balance={balance} openRequest={openRequest} />

      {/* How it works */}
      <HowItWorks />

      {/* Earnings breakdown */}
      <EarningsBreakdown rows={earningsBreakdown} />

      {/* History */}
      <PayoutHistory withdrawals={withdrawals} />
    </div>
  );
}
