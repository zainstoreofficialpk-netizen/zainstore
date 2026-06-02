import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { Clock, LogOut, Mail, ShieldOff, XCircle } from "lucide-react";
import Link from "next/link";

import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ImpersonateBanner } from "@/components/dashboard/impersonate-banner";

// ── Status gate UIs (rendered inline — no redirect, no route conflict) ─────────

function PendingGate({
  storeName,
  email,
}: {
  storeName: string | null;
  email: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <span className="flex size-20 items-center justify-center rounded-full bg-amber-50">
            <Clock size={36} className="text-amber-500" />
          </span>
        </div>

        <h1 className="text-2xl font-bold text-zinc-950">Application Under Review</h1>
        <p className="mt-2 text-zinc-500">
          {storeName ? (
            <>
              <span className="font-medium text-zinc-700">{storeName}</span> has been submitted
              for review.
            </>
          ) : (
            "Your vendor application has been submitted."
          )}
        </p>

        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6 text-left space-y-4">
          {[
            {
              step: "1",
              done: true,
              title: "Application submitted ✓",
              desc: "Your account and store details have been received.",
            },
            {
              step: "2",
              done: true,
              active: true,
              title: "Under review (current step)",
              desc: "Our team is verifying your information. This typically takes up to 24 hours.",
            },
            {
              step: "3",
              done: false,
              title: "Approval & activation",
              desc: "Once approved you'll receive an email and can start listing products.",
            },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  s.active
                    ? "bg-amber-400 text-white"
                    : s.done
                      ? "bg-amber-200 text-amber-700"
                      : "bg-zinc-200 text-zinc-400"
                }`}
              >
                {s.step}
              </span>
              <div>
                <p
                  className={`text-sm font-semibold ${s.done ? "text-zinc-800" : "text-zinc-400"}`}
                >
                  {s.title}
                </p>
                <p className={`text-xs ${s.done ? "text-zinc-500" : "text-zinc-400"}`}>
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-zinc-500">
          <Mail size={15} />
          <span>
            We'll email <strong>{email}</strong> when your application is reviewed.
          </span>
        </div>

        <div className="mt-8">
          <Link
            href="/api/auth/signout"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-600"
          >
            <LogOut size={14} /> Sign out
          </Link>
        </div>
      </div>
    </div>
  );
}

function RejectedGate({
  storeName,
  reason,
}: {
  storeName: string | null;
  reason: string | null;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <span className="flex size-20 items-center justify-center rounded-full bg-rose-50">
            <XCircle size={36} className="text-rose-500" />
          </span>
        </div>

        <h1 className="text-2xl font-bold text-zinc-950">Application Not Approved</h1>
        <p className="mt-2 text-zinc-500">
          Unfortunately, your vendor application
          {storeName && (
            <>
              {" "}
              for <span className="font-medium text-zinc-700">{storeName}</span>
            </>
          )}{" "}
          was not approved at this time.
        </p>

        {reason && (
          <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
              Reason provided
            </p>
            <p className="mt-1.5 text-sm text-zinc-700">{reason}</p>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 text-left space-y-2">
          <p className="text-sm font-semibold text-zinc-800">What you can do next</p>
          {[
            "Review the reason above and address any issues.",
            "Contact our support team to discuss or appeal the decision.",
            "You may register a new application with updated information if eligible.",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm text-zinc-600">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-zinc-400" />
              {item}
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-zinc-500">
          <Mail size={15} />
          <span>
            Questions? Email <strong>support@zainstore.pk</strong>
          </span>
        </div>

        <div className="mt-8">
          <Link
            href="/api/auth/signout"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-600"
          >
            <LogOut size={14} /> Sign out
          </Link>
        </div>
      </div>
    </div>
  );
}

function SuspendedGate({
  storeName,
  reason,
  suspendedAt,
}: {
  storeName: string | null;
  reason: string | null;
  suspendedAt: Date | null;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <span className="flex size-20 items-center justify-center rounded-full bg-zinc-100">
            <ShieldOff size={36} className="text-zinc-500" />
          </span>
        </div>

        <h1 className="text-2xl font-bold text-zinc-950">Account Suspended</h1>
        <p className="mt-2 text-zinc-500">
          Your vendor account
          {storeName && (
            <>
              {" "}
              for <span className="font-medium text-zinc-700">{storeName}</span>
            </>
          )}{" "}
          has been temporarily suspended.
        </p>

        {reason && (
          <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Reason</p>
            <p className="mt-1.5 text-sm text-zinc-700">{reason}</p>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 text-left">
          <p className="text-sm text-zinc-600">
            While suspended, your store and products are not visible to customers. Contact our
            support team to resolve the issue and get reinstated.
          </p>
        </div>

        {suspendedAt && (
          <p className="mt-4 text-xs text-zinc-400">
            Suspended on{" "}
            {new Date(suspendedAt).toLocaleDateString("en-PK", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-zinc-500">
          <Mail size={15} />
          <span>
            Contact us at <strong>support@zainstore.pk</strong>
          </span>
        </div>

        <div className="mt-8">
          <Link
            href="/api/auth/signout"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-600"
          >
            <LogOut size={14} /> Sign out
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  // Super admin impersonating a vendor — skip the status gate entirely
  const isImpersonating = !!cookies().get("zs_impersonate_vendor")?.value;
  if (session.user.role === "SUPER_ADMIN" && isImpersonating) {
    return (
      <>
        <ImpersonateBanner />
        <DashboardShell
          portal="vendor"
          navTitle="Vendor Portal"
          title="Seller Workspace"
          subtitle="Manage store profile, catalog, orders, earnings, withdrawals, and reviews."
        >
          {children}
        </DashboardShell>
      </>
    );
  }

  // Real vendor — fetch approval status
  const vendor = await db.vendorProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      status: true,
      internalNotes: true,
      suspendedAt: true,
      store: { select: { name: true } },
    },
  });

  if (!vendor) redirect("/login");

  // Render status gate inline — no redirect, no routing conflict, no loop
  if (vendor.status === "PENDING_APPROVAL") {
    return (
      <PendingGate storeName={vendor.store?.name ?? null} email={session.user.email ?? ""} />
    );
  }

  if (vendor.status === "REJECTED") {
    return (
      <RejectedGate storeName={vendor.store?.name ?? null} reason={vendor.internalNotes ?? null} />
    );
  }

  if (vendor.status === "SUSPENDED") {
    return (
      <SuspendedGate
        storeName={vendor.store?.name ?? null}
        reason={vendor.internalNotes ?? null}
        suspendedAt={vendor.suspendedAt ?? null}
      />
    );
  }

  // ACTIVE — full dashboard
  return (
    <DashboardShell
      portal="vendor"
      navTitle="Vendor Portal"
      title="Seller Workspace"
      subtitle="Manage store profile, catalog, orders, earnings, withdrawals, and reviews."
    >
      {children}
    </DashboardShell>
  );
}
