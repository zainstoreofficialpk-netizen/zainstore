import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { XCircle, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function VendorRejectedPage() {
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
        <div className="w-20 h-20 rounded-full bg-rose-50 border-4 border-rose-100 flex items-center justify-center mx-auto">
          <XCircle className="w-10 h-10 text-rose-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-zinc-900">Application Rejected</h1>
          <p className="text-zinc-500">
            Unfortunately, <span className="font-semibold text-zinc-700">{storeName}</span> was not approved.
          </p>
        </div>

        {reason && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-left">
            <p className="text-sm font-semibold text-rose-800 mb-2">Reason from admin:</p>
            <p className="text-sm text-rose-700">{reason}</p>
          </div>
        )}

        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 text-left space-y-3">
          <p className="text-sm font-semibold text-zinc-800">What you can do:</p>
          <ul className="space-y-2 text-sm text-zinc-600">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-zinc-400">•</span>
              Contact support to understand the reason and discuss next steps.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-zinc-400">•</span>
              Update your store profile to address any issues, then reapply.
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href="mailto:support@zainstore.pk"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold rounded-xl"
          >
            <Mail className="w-4 h-4" /> Contact Support
          </a>
          <Link
            href="/vendor/profile"
            className="flex items-center justify-center gap-2 px-5 py-2.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-sm font-semibold rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" /> Update Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
