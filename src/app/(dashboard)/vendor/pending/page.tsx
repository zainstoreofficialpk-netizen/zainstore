import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { Clock, Mail, RefreshCw } from "lucide-react";
import Link from "next/link";

export default async function VendorPendingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "VENDOR") redirect("/vendor");

  const vendor = await db.vendorProfile.findUnique({
    where: { userId: session.user.id },
    select: { status: true, store: { select: { name: true } } },
  });

  if (vendor?.status === "ACTIVE") redirect("/vendor");

  const storeName = vendor?.store?.name ?? "Your Store";

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-amber-50 border-4 border-amber-100 flex items-center justify-center mx-auto">
          <Clock className="w-10 h-10 text-amber-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-zinc-900">Under Review</h1>
          <p className="text-zinc-500">
            <span className="font-semibold text-zinc-700">{storeName}</span> is pending admin approval.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left space-y-3">
          <p className="text-sm font-semibold text-amber-800">What happens next?</p>
          <ul className="space-y-2 text-sm text-amber-700">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-amber-500">1.</span>
              Our team reviews your store details and business information.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-amber-500">2.</span>
              You&apos;ll receive an email notification once your store is approved or if we need more information.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-amber-500">3.</span>
              Once approved, you can start listing products and receiving orders.
            </li>
          </ul>
        </div>

        <p className="text-xs text-zinc-400">
          Usually takes 24–48 hours. Contact support if you haven&apos;t heard back in 3 days.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href="mailto:support@zainstore.pk"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-xl"
          >
            <Mail className="w-4 h-4" /> Contact Support
          </a>
          <Link
            href="/vendor"
            className="flex items-center justify-center gap-2 px-5 py-2.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-sm font-semibold rounded-xl"
          >
            <RefreshCw className="w-4 h-4" /> Check Status
          </Link>
        </div>
      </div>
    </div>
  );
}
