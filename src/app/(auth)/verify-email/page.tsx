import Link from "next/link";
import { Store } from "lucide-react";

import { verifyEmail } from "@/lib/auth/actions";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token ?? "";

  let isSuccess: boolean;
  let statusMessage: string;

  if (token) {
    const result = await verifyEmail(token);
    isSuccess = result.success;
    statusMessage = result.success ? result.message : result.error;
  } else {
    isSuccess = false;
    statusMessage = "Missing verification token.";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm text-center">

        <div className="mb-8 flex justify-center">
          <span className="grid size-12 place-items-center rounded-xl bg-brand-500 text-white">
            <Store size={24} aria-hidden />
          </span>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
          {isSuccess ? (
            <div className="space-y-4">
              <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-zinc-950">Email Verified!</h1>
              <p className="text-sm text-zinc-500">{statusMessage}</p>
              <Link
                href="/login"
                className="mt-2 inline-block w-full rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
              >
                Sign in to your account
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto grid size-14 place-items-center rounded-full bg-rose-50 text-rose-500">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-zinc-950">Verification Failed</h1>
              <p className="text-sm text-zinc-500">{statusMessage}</p>
              <Link
                href="/login"
                className="mt-2 inline-block w-full rounded-md border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Back to sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
