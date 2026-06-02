"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Edit2,
  LogIn,
  MessageSquare,
  Send,
  Trash2,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import {
  approveVendorAction,
  rejectVendorAction,
  suspendVendorAction,
  reactivateVendorAction,
  deleteVendorAction,
  editVendorAction,
  sendMessageToVendorAction,
} from "@/lib/admin/vendor-actions";
import type { getVendorDetail, getVendorMessages, getVendorActivityLog, getVendorRevenue } from "@/lib/admin/vendor-data";

type Vendor = NonNullable<Awaited<ReturnType<typeof getVendorDetail>>>;
type Messages = Awaited<ReturnType<typeof getVendorMessages>>;
type ActivityLog = Awaited<ReturnType<typeof getVendorActivityLog>>;
type Revenue = Awaited<ReturnType<typeof getVendorRevenue>>;

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "muted"> = {
  ACTIVE: "success",
  PENDING_APPROVAL: "warning",
  REJECTED: "danger",
  SUSPENDED: "muted",
};

type Tab = "overview" | "inbox" | "activity";

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditVendorModal({ vendor, onClose }: { vendor: Vendor; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await editVendorAction(vendor.id, {
        name: fd.get("name") as string,
        email: fd.get("email") as string,
        phone: fd.get("phone") as string,
        storeName: fd.get("storeName") as string,
        internalNotes: fd.get("internalNotes") as string,
        commissionValue: fd.get("commissionValue") ? Number(fd.get("commissionValue")) : undefined,
      });
      if (r.success) { toast.success(r.message); onClose(); }
      else toast.error(r.error);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 p-5">
          <h2 className="font-semibold text-zinc-900">Edit Vendor</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-600">Owner Name</label>
              <Input name="name" defaultValue={vendor.user.name} required />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-600">Email</label>
              <Input name="email" type="email" defaultValue={vendor.user.email} required />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-600">Phone</label>
              <Input name="phone" defaultValue={vendor.user.phone ?? ""} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-600">Store Name</label>
              <Input name="storeName" defaultValue={vendor.store?.name ?? ""} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-600">Commission Override (%)</label>
              <Input
                name="commissionValue"
                type="number"
                min={0}
                max={100}
                step={0.1}
                defaultValue={vendor.commissionValue ? String(vendor.commissionValue) : ""}
                placeholder="e.g. 12.5"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-600">Internal Notes</label>
            <textarea
              name="internalNotes"
              defaultValue={vendor.internalNotes ?? ""}
              rows={3}
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              placeholder="Internal notes (not visible to vendor)"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Saving…" : "Save changes"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteConfirmModal({ vendor, onClose }: { vendor: Vendor; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const r = await deleteVendorAction(vendor.id);
      if (r.success) { toast.success(r.message); window.location.href = "/admin/vendors"; }
      else toast.error(r.error);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="p-6 text-center">
          <div className="mb-3 flex justify-center">
            <span className="grid size-14 place-items-center rounded-full bg-rose-50 text-rose-600">
              <Trash2 size={24} />
            </span>
          </div>
          <h2 className="font-semibold text-zinc-900">Delete {vendor.store?.name ?? vendor.user.name}?</h2>
          <p className="mt-2 text-sm text-zinc-500">
            This permanently deletes the vendor, their store, all products, and all associated data. This action <strong>cannot be undone</strong>.
          </p>
          <div className="mt-5 flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={isPending} className="flex-1">
              {isPending ? "Deleting…" : "Delete permanently"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Reject / Suspend reason modal ─────────────────────────────────────────────

function ReasonModal({
  title,
  onConfirm,
  onClose,
}: {
  title: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 p-5">
          <h2 className="font-semibold text-zinc-900">{title}</h2>
          <button onClick={onClose}><X size={18} className="text-zinc-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Provide a reason (sent to vendor)"
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={() => onConfirm(reason)} disabled={!reason.trim()} className="flex-1">Confirm</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inbox Tab ─────────────────────────────────────────────────────────────────

function InboxTab({
  vendor,
  messages,
  adminId,
}: {
  vendor: Vendor;
  messages: Messages;
  adminId: string;
}) {
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleSend() {
    if (!body.trim()) return;
    startTransition(async () => {
      const r = await sendMessageToVendorAction(vendor.user.id, body.trim());
      if (r.success) { toast.success("Message sent"); setBody(""); }
      else toast.error(r.error);
    });
  }

  return (
    <div className="flex h-[500px] flex-col">
      <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-zinc-50/50 rounded-lg border border-zinc-100">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-zinc-400">
            <MessageSquare size={32} className="opacity-30" />
            <p className="text-sm">No messages yet. Start the conversation below.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAdmin = msg.senderId === adminId;
            return (
              <div key={msg.id} className={`flex gap-3 ${isAdmin ? "flex-row-reverse" : ""}`}>
                <Avatar
                  name={msg.sender.name}
                  image={msg.sender.image}
                  size="sm"
                />
                <div className={`max-w-[70%] rounded-xl px-4 py-2.5 ${
                  isAdmin
                    ? "bg-brand-500 text-white"
                    : "bg-white border border-zinc-200 text-zinc-800"
                }`}>
                  <p className="text-sm leading-relaxed">{msg.body}</p>
                  <p className={`mt-1 text-xs ${isAdmin ? "text-brand-100" : "text-zinc-400"}`}>
                    {new Date(msg.createdAt).toLocaleString("en-PK", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "numeric",
                      month: "short",
                    })}
                    {!isAdmin && !msg.readAt && (
                      <span className="ml-1 text-amber-500">● Unread</span>
                    )}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 flex gap-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={`Message ${vendor.store?.name ?? vendor.user.name}…`}
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
          }}
          className="flex-1 rounded-md border border-zinc-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
        />
        <Button onClick={handleSend} disabled={isPending || !body.trim()} className="self-end">
          <Send size={16} />
          Send
        </Button>
      </div>
      <p className="mt-1 text-xs text-zinc-400">Ctrl+Enter to send</p>
    </div>
  );
}

// ── Activity Tab ──────────────────────────────────────────────────────────────

function ActivityTab({ log }: { log: ActivityLog }) {
  const ACTION_LABELS: Record<string, string> = {
    "vendor.approved": "✅ Approved",
    "vendor.rejected": "❌ Rejected",
    "vendor.suspended": "⏸ Suspended",
    "vendor.reactivated": "▶️ Reactivated",
    "vendor.edited": "✏️ Details edited",
    "vendor.deleted": "🗑 Deleted",
    "vendor.subscription.assigned": "💳 Subscription assigned",
    "vendor.bulk.approve": "✅ Bulk approved",
    "vendor.bulk.reject": "❌ Bulk rejected",
    "vendor.bulk.suspend": "⏸ Bulk suspended",
  };

  return (
    <div className="space-y-1">
      {log.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-400">No activity recorded yet.</p>
      ) : (
        log.map((entry) => (
          <div key={entry.id} className="flex items-start gap-3 rounded-lg px-4 py-3 hover:bg-zinc-50">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-zinc-800">
                {ACTION_LABELS[entry.action] ?? entry.action}
              </p>
              {entry.metadata && typeof entry.metadata === "object" && Object.keys(entry.metadata).length > 0 && (
                <p className="mt-0.5 text-xs text-zinc-500">
                  {JSON.stringify(entry.metadata)}
                </p>
              )}
              <p className="mt-0.5 text-xs text-zinc-400">
                by {entry.actor?.name ?? "System"} ·{" "}
                {new Date(entry.createdAt).toLocaleString("en-PK")}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function VendorDetailTabs({
  vendor,
  messages,
  activityLog,
  revenue,
  adminId,
}: {
  vendor: Vendor;
  messages: Messages;
  activityLog: ActivityLog;
  revenue: Revenue;
  adminId: string;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState<"reject" | "suspend" | null>(null);
  const [isPending, startTransition] = useTransition();

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "inbox", label: "Inbox" },
    { key: "activity", label: "Activity Log" },
  ];

  function runAction(fn: () => Promise<{ success: boolean; message?: string; error?: string }>) {
    startTransition(async () => {
      const r = await fn();
      if ("success" in r && r.success && "message" in r) toast.success(r.message);
      else if ("error" in r) toast.error(r.error);
    });
  }

  // Impersonate as vendor — sets cookie then navigates
  function handleImpersonate() {
    fetch("/api/admin/impersonate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorUserId: vendor.user.id }),
    }).then(() => {
      window.location.href = "/vendor";
    });
  }

  return (
    <>
      {/* Modals */}
      {showEdit && <EditVendorModal vendor={vendor} onClose={() => setShowEdit(false)} />}
      {showDelete && <DeleteConfirmModal vendor={vendor} onClose={() => setShowDelete(false)} />}
      {showReasonModal === "reject" && (
        <ReasonModal
          title="Reject Vendor"
          onConfirm={(reason) => {
            runAction(() => rejectVendorAction(vendor.id, reason));
            setShowReasonModal(null);
          }}
          onClose={() => setShowReasonModal(null)}
        />
      )}
      {showReasonModal === "suspend" && (
        <ReasonModal
          title="Suspend Vendor"
          onConfirm={(reason) => {
            runAction(() => suspendVendorAction(vendor.id, reason));
            setShowReasonModal(null);
          }}
          onClose={() => setShowReasonModal(null)}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/vendors" className="mb-4 flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700">
          <ArrowLeft size={14} /> Back to vendors
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar
              name={vendor.store?.name ?? vendor.user.name}
              image={vendor.store?.logoUrl ?? vendor.user.image}
              size="lg"
            />
            <div>
              <h1 className="text-xl font-bold text-zinc-950">
                {vendor.store?.name ?? "No store"}
              </h1>
              <p className="text-sm text-zinc-500">{vendor.user.name} · {vendor.user.email}</p>
              <div className="mt-1.5">
                <Badge tone={STATUS_TONE[vendor.status] ?? "muted"}>
                  {vendor.status.replace("_", " ")}
                </Badge>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={handleImpersonate} className="gap-1.5">
              <LogIn size={14} /> View as Vendor
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowEdit(true)} className="gap-1.5">
              <Edit2 size={14} /> Edit
            </Button>
            {vendor.status === "PENDING_APPROVAL" && (
              <>
                <Button size="sm" onClick={() => runAction(() => approveVendorAction(vendor.id))} disabled={isPending}>
                  <Check size={14} /> Approve
                </Button>
                <Button size="sm" variant="danger" onClick={() => setShowReasonModal("reject")} disabled={isPending}>
                  <UserX size={14} /> Reject
                </Button>
              </>
            )}
            {vendor.status === "ACTIVE" && (
              <Button size="sm" variant="outline" onClick={() => setShowReasonModal("suspend")} disabled={isPending} className="text-amber-600 hover:bg-amber-50">
                <UserX size={14} /> Suspend
              </Button>
            )}
            {vendor.status === "SUSPENDED" && (
              <Button size="sm" onClick={() => runAction(() => reactivateVendorAction(vendor.id))} disabled={isPending}>
                <UserCheck size={14} /> Reactivate
              </Button>
            )}
            <Button size="sm" variant="danger" onClick={() => setShowDelete(true)}>
              <Trash2 size={14} /> Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Revenue", value: formatCurrency(revenue.totalRevenue) },
          { label: "Commission Earned", value: formatCurrency(revenue.totalCommission) },
          { label: "Total Orders", value: revenue.totalOrders.toLocaleString() },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent>
              <p className="text-xs text-zinc-500">{s.label}</p>
              <p className="mt-1 text-xl font-bold text-zinc-900">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 border-b border-zinc-100">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-b-2 border-brand-500 text-brand-600"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Vendor Information</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Owner", value: vendor.user.name },
                { label: "Email", value: vendor.user.email },
                { label: "Phone", value: vendor.user.phone ?? "—" },
                { label: "Status", value: vendor.status.replace("_", " ") },
                { label: "Products", value: String(vendor._count.products) },
                { label: "Orders", value: String(vendor._count.orders) },
                {
                  label: "Registered",
                  value: new Date(vendor.createdAt).toLocaleDateString("en-PK", {
                    day: "numeric", month: "long", year: "numeric",
                  }),
                },
                {
                  label: "Approved",
                  value: vendor.approvedAt
                    ? new Date(vendor.approvedAt).toLocaleDateString("en-PK")
                    : "—",
                },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-zinc-500">{row.label}</span>
                  <span className="font-medium text-zinc-800">{row.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Store Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Store Name", value: vendor.store?.name ?? "—" },
                { label: "Slug", value: vendor.store?.slug ?? "—" },
                { label: "Email", value: vendor.store?.email ?? "—" },
                { label: "Phone", value: vendor.store?.phone ?? "—" },
                { label: "Vacation Mode", value: vendor.store?.vacationMode ? "On" : "Off" },
                { label: "Bank", value: vendor.bankName ?? "—" },
                { label: "Account #", value: vendor.accountNumber ?? "—" },
                { label: "Commission Override", value: vendor.commissionValue ? `${vendor.commissionValue}%` : "Default" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-zinc-500">{row.label}</span>
                  <span className="font-medium text-zinc-800">{row.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {vendor.internalNotes && (
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Internal Notes</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-700 whitespace-pre-wrap">{vendor.internalNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {tab === "inbox" && (
        <Card>
          <CardHeader>
            <CardTitle>Direct Messages — {vendor.store?.name ?? vendor.user.name}</CardTitle>
            <p className="mt-0.5 text-xs text-zinc-400">Messages are visible only to you and this vendor.</p>
          </CardHeader>
          <CardContent>
            <InboxTab vendor={vendor} messages={messages} adminId={adminId} />
          </CardContent>
        </Card>
      )}

      {tab === "activity" && (
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <p className="mt-0.5 text-xs text-zinc-400">All admin actions on this vendor account.</p>
          </CardHeader>
          <CardContent className="p-0">
            <ActivityTab log={activityLog} />
          </CardContent>
        </Card>
      )}

    </>
  );
}
