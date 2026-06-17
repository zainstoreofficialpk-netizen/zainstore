import Link from "next/link";
import { Store } from "lucide-react";
import { db } from "@/lib/db";

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token ?? "";

  let isSuccess = false;
  let message = "Missing confirmation token.";

  if (token) {
    const record = await db.verificationToken.findUnique({ where: { token } });

    if (!record) {
      message = "This confirmation link is invalid or has already been used.";
    } else if (record.expires < new Date()) {
      await db.verificationToken.delete({ where: { token } });
      message = "This link has expired. Please request a new email change from your profile.";
    } else if (!record.identifier.startsWith("email-change:")) {
      message = "Invalid token type.";
    } else {
      const parts = record.identifier.split(":");
      const userId = parts[1];
      const newEmail = parts.slice(2).join(":");

      const emailTaken = await db.user.findFirst({
        where: { email: newEmail, NOT: { id: userId } },
      });

      if (emailTaken) {
        message = "This email address is now in use by another account.";
      } else {
        await db.user.update({ where: { id: userId }, data: { email: newEmail, emailVerified: new Date() } });
        await db.verificationToken.delete({ where: { token } });
        isSuccess = true;
        message = `Your email has been updated to ${newEmail}.`;
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8 flex justify-center">
          {/* eslint-disable-next-line /next/no-img-element */}
          <img src="/logo-icon.svg" alt="ZainStore.pk" className="h-14 w-14 object-contain" />
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
          {isSuccess ? (
            <div className="space-y-4">
              <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-zinc-950">Email Updated!</h1>
              <p className="text-sm text-zinc-500">{message}</p>
              <p className="text-xs text-zinc-400">Please sign in again with your new email.</p>
              <Link href="/login" className="mt-2 inline-block w-full rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
                Sign in
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto grid size-14 place-items-center rounded-full bg-rose-50 text-rose-500">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-zinc-950">Confirmation Failed</h1>
              <p className="text-sm text-zinc-500">{message}</p>
              <Link href="/login" className="mt-2 inline-block w-full rounded-md border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
                Back to sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
