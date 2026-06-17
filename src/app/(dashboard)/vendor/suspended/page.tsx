import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { ShieldAlert, Mail } from "lucide-react";

export default async function VendorSuspendedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "VENDOR") redirect("/vendor");

  const vendor = await db.vendorProfile.findUnique({
    where: { userId: session.user.id },
    select: { status: true, internalNotes: true, store: { select: { name: true } } },
  });

  if (vendor?.status === "ACTIVE") redirect("/vendor");

  const storeName = vendor?.store?.name ?? "Your Store";
  const reason = vendor?.internalNotes;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-zinc-100 border-4 border-zinc-200 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-10 h-10 text-zinc-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-zinc-900">Account Suspended</h1>
          <p className="text-zinc-500">
            <span className="font-semibold text-zinc-700">{storeName}</span> has been temporarily suspended.
          </p>
        </div>

        {reason && (
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 text-left">
            <p className="text-sm font-semibold text-zinc-700 mb-2">Reason:</p>
            <p className="text-sm text-zinc-600">{reason}</p>
          </div>
        )}

        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 text-left space-y-3">
          <p className="text-sm font-semibold text-zinc-800">Important information:</p>
          <ul className="space-y-2 text-sm text-zinc-600">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-zinc-400">•</span>
              Your store is currently hidden from customers. No new orders can be placed.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-zinc-400">•</span>
              Existing orders are still being processed and earnings are held until suspension is lifted.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-zinc-400">•</span>
              Contact support to resolve the issue and get your store reactivated.
            </li>
          </ul>
        </div>

        <a
          href="mailto:support@zainstore.pk"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-xl"
        >
          <Mail className="w-4 h-4" /> Contact Support
        </a>
      </div>
    </div>
  );
}
