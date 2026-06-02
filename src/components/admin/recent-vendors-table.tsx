"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { approveVendor, rejectVendor } from "@/lib/admin/actions";
import type { getRecentVendors } from "@/lib/admin/dashboard-data";

type Vendors = Awaited<ReturnType<typeof getRecentVendors>>;

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "muted"> = {
  ACTIVE: "success",
  PENDING_APPROVAL: "warning",
  REJECTED: "danger",
  SUSPENDED: "muted",
};

function VendorRow({ vendor }: { vendor: Vendors[number] }) {
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(async () => {
      const result = await approveVendor(vendor.id);
      if (result.success) toast.success(result.message);
      else toast.error(result.error);
    });
  }

  function handleReject() {
    startTransition(async () => {
      const result = await rejectVendor(vendor.id, "Rejected from dashboard");
      if (result.success) toast.success(result.message);
      else toast.error(result.error);
    });
  }

  const isPending_ = vendor.status === "PENDING_APPROVAL";

  return (
    <tr className="hover:bg-zinc-50/60">
      <td className="px-6 py-3">
        <div className="flex items-center gap-2">
          <Avatar name={vendor.store?.name ?? vendor.user.name} size="xs" />
          <span className="text-sm font-medium text-zinc-800">
            {vendor.store?.name ?? "No store"}
          </span>
        </div>
      </td>
      <td className="px-3 py-3 text-xs text-zinc-600">{vendor.user.name}</td>
      <td className="px-3 py-3 text-xs text-zinc-500">{vendor._count.products}</td>
      <td className="px-3 py-3">
        <Badge tone={STATUS_TONE[vendor.status] ?? "muted"}>
          {vendor.status.replace("_", " ")}
        </Badge>
      </td>
      <td className="px-6 py-3">
        {isPending_ ? (
          <div className="flex items-center gap-2">
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
        ) : (
          <Link
            href={`/admin/vendors/${vendor.id}`}
            className="text-xs text-brand-600 hover:underline"
          >
            View
          </Link>
        )}
      </td>
    </tr>
  );
}

export function RecentVendorsTable({ vendors }: { vendors: Vendors }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Vendor Registrations</CardTitle>
            <p className="mt-0.5 text-xs text-zinc-400">Newest {vendors.length} applications</p>
          </div>
          <Link
            href="/admin/vendors"
            className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-500"
          >
            View all <ArrowRight size={13} />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {vendors.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-zinc-400">No vendors yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left">
                  <th className="px-6 py-3 text-xs font-medium text-zinc-500">Store</th>
                  <th className="px-3 py-3 text-xs font-medium text-zinc-500">Owner</th>
                  <th className="px-3 py-3 text-xs font-medium text-zinc-500">Products</th>
                  <th className="px-3 py-3 text-xs font-medium text-zinc-500">Status</th>
                  <th className="px-6 py-3 text-xs font-medium text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {vendors.map((v) => (
                  <VendorRow key={v.id} vendor={v} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
