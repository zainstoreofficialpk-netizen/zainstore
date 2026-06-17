"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Store } from "lucide-react";

import { registerCustomer } from "@/lib/auth/actions";

export default function CustomerRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", phone: "", city: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const result = await registerCustomer({
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone || undefined,
      city: form.city || undefined,
    });
    setLoading(false);

    if (!result.success) {
      setError(result.error);
    } else {
      setSuccess(result.message);
      setTimeout(() => router.push("/login"), 3000);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-md">

        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          {/* eslint-disable-next-line /next/no-img-element */}
          <img src="/logo-icon.svg" alt="ZainStore.pk" className="h-14 w-14 object-contain" />
          <div>
            <h1 className="text-2xl font-bold text-zinc-950">Create your account</h1>
            <p className="mt-1 text-sm text-zinc-500">Shop on ZainStore.pk</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          {success ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-medium text-zinc-800">{success}</p>
              <p className="text-xs text-zinc-500">Redirecting to sign in…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Full Name" id="name" type="text" required placeholder="Mina Shah" value={form.name} onChange={set("name")} autoComplete="name" />
              <Field label="Email Address" id="email" type="email" required placeholder="mina@example.com" value={form.email} onChange={set("email")} autoComplete="email" />
              <Field label="Password" id="password" type="password" required placeholder="Min. 8 characters" value={form.password} onChange={set("password")} autoComplete="new-password" />
              <Field label="Confirm Password" id="confirmPassword" type="password" required placeholder="Repeat password" value={form.confirmPassword} onChange={set("confirmPassword")} autoComplete="new-password" />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Phone (optional)" id="phone" type="tel" placeholder="+92 300 0000000" value={form.phone} onChange={set("phone")} autoComplete="tel" />
                <Field label="City (optional)" id="city" type="text" placeholder="Karachi" value={form.city} onChange={set("city")} autoComplete="address-level2" />
              </div>

              {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {loading ? "Creating account…" : "Create account"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:underline">Sign in</Link>
        </p>
        <p className="mt-2 text-center text-sm text-zinc-500">
          Want to sell?{" "}
          <Link href="/register/vendor" className="font-medium text-brand-600 hover:underline">Apply as a vendor</Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label, id, ...props
}: { label: string; id: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-700">
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        {...props}
      />
    </div>
  );
}
