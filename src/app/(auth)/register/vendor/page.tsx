"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Store } from "lucide-react";

import { registerVendor } from "@/lib/auth/actions";

type FormData = {
  // Step 1 – Account
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  // Step 2 – Store
  storeName: string;
  storeSlug: string;
  storeDescription: string;
  // Step 3 – Store Details
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  // Step 4 – Bank
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
};

const STEPS = ["Account", "Store", "Details", "Bank & Submit"];

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function VendorRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  const [form, setForm] = useState<FormData>({
    name: "", email: "", password: "", confirmPassword: "", phone: "",
    storeName: "", storeSlug: "", storeDescription: "",
    storeAddress: "", storePhone: "", storeEmail: "",
    bankName: "", accountTitle: "", accountNumber: "", iban: "",
  });

  function set(field: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setForm((f) => {
        const updated = { ...f, [field]: value };
        // Auto-generate slug from store name unless user has manually edited it
        if (field === "storeName" && !slugEdited) {
          updated.storeSlug = slugify(value);
        }
        return updated;
      });
    };
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (!form.name.trim() || form.name.length < 2) return "Enter your full name.";
      if (!form.email.includes("@")) return "Enter a valid email address.";
      if (form.password.length < 8) return "Password must be at least 8 characters.";
      if (form.password !== form.confirmPassword) return "Passwords do not match.";
      if (form.phone.length < 10) return "Enter a valid phone number.";
    }
    if (step === 1) {
      if (!form.storeName.trim() || form.storeName.length < 2) return "Enter your store name.";
      if (!form.storeSlug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.storeSlug)) {
        return "Store URL must contain only lowercase letters, numbers, and hyphens.";
      }
      if (form.storeDescription.length < 10) return "Store description must be at least 10 characters.";
    }
    return null;
  }

  function next() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    setStep((s) => s + 1);
  }

  function back() {
    setError("");
    setStep((s) => s - 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await registerVendor({
      name: form.name, email: form.email, password: form.password, phone: form.phone,
      storeName: form.storeName, storeSlug: form.storeSlug, storeDescription: form.storeDescription,
      storeAddress: form.storeAddress || undefined, storePhone: form.storePhone || undefined,
      storeEmail: form.storeEmail || undefined,
      bankName: form.bankName || undefined, accountTitle: form.accountTitle || undefined,
      accountNumber: form.accountNumber || undefined, iban: form.iban || undefined,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
    } else {
      setSuccess(result.message);
      setTimeout(() => router.push("/login"), 4000);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="grid size-12 place-items-center rounded-xl bg-teal-700 text-white">
            <Store size={24} aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-zinc-950">Apply as a Vendor</h1>
            <p className="mt-1 text-sm text-zinc-500">Start selling on ZainStore.pk</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-between">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={`grid size-8 place-items-center rounded-full text-xs font-bold transition ${
                  i < step ? "bg-teal-700 text-white" : i === step ? "bg-teal-700 text-white ring-4 ring-teal-100" : "bg-zinc-200 text-zinc-500"
                }`}>
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                <span className={`hidden text-xs sm:block ${i === step ? "font-semibold text-teal-700" : "text-zinc-400"}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`mx-2 h-0.5 flex-1 transition ${i < step ? "bg-teal-700" : "bg-zinc-200"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          {success ? (
            <div className="space-y-4 py-4 text-center">
              <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <Check size={28} />
              </div>
              <h2 className="text-lg font-semibold text-zinc-950">Application Submitted!</h2>
              <p className="text-sm text-zinc-500">{success}</p>
              <p className="text-xs text-zinc-400">Redirecting to sign in…</p>
            </div>
          ) : (
            <form onSubmit={step === STEPS.length - 1 ? handleSubmit : (e) => { e.preventDefault(); next(); }} className="space-y-4">

              {/* Step 0 – Account */}
              {step === 0 && (
                <>
                  <Field label="Full Name *" id="name" type="text" placeholder="Ayesha Khan" value={form.name} onChange={set("name")} autoComplete="name" />
                  <Field label="Email Address *" id="email" type="email" placeholder="ayesha@example.com" value={form.email} onChange={set("email")} autoComplete="email" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Password *" id="password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={set("password")} autoComplete="new-password" />
                    <Field label="Confirm Password *" id="confirmPassword" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={set("confirmPassword")} autoComplete="new-password" />
                  </div>
                  <Field label="Phone Number *" id="phone" type="tel" placeholder="+92 300 0000000" value={form.phone} onChange={set("phone")} autoComplete="tel" />
                </>
              )}

              {/* Step 1 – Store */}
              {step === 1 && (
                <>
                  <Field label="Store Name *" id="storeName" type="text" placeholder="Urban Loom" value={form.storeName} onChange={set("storeName")} />
                  <div>
                    <label htmlFor="storeSlug" className="mb-1.5 block text-sm font-medium text-zinc-700">
                      Store URL *{" "}
                      <span className="font-normal text-zinc-400">— zainstore.pk/store/<strong>{form.storeSlug || "your-store"}</strong></span>
                    </label>
                    <input
                      id="storeSlug"
                      type="text"
                      placeholder="urban-loom"
                      value={form.storeSlug}
                      onChange={(e) => { setSlugEdited(true); set("storeSlug")(e); }}
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="storeDescription" className="mb-1.5 block text-sm font-medium text-zinc-700">
                      Store Description *
                    </label>
                    <textarea
                      id="storeDescription"
                      rows={3}
                      placeholder="Tell customers what your store is about…"
                      value={form.storeDescription}
                      onChange={set("storeDescription")}
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </>
              )}

              {/* Step 2 – Store Details */}
              {step === 2 && (
                <>
                  <p className="text-sm text-zinc-500">All fields on this step are optional — you can update them from your store settings later.</p>
                  <Field label="Store Address" id="storeAddress" type="text" placeholder="Shop 5, Main Market, Karachi" value={form.storeAddress} onChange={set("storeAddress")} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Store Phone" id="storePhone" type="tel" placeholder="+92 300 0000000" value={form.storePhone} onChange={set("storePhone")} />
                    <Field label="Store Email" id="storeEmail" type="email" placeholder="store@example.com" value={form.storeEmail} onChange={set("storeEmail")} />
                  </div>
                </>
              )}

              {/* Step 3 – Bank Details */}
              {step === 3 && (
                <>
                  <p className="text-sm text-zinc-500">Bank details are used for withdrawal payouts. You can update these later from your vendor settings.</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Bank Name" id="bankName" type="text" placeholder="Meezan Bank" value={form.bankName} onChange={set("bankName")} />
                    <Field label="Account Title" id="accountTitle" type="text" placeholder="Ayesha Khan" value={form.accountTitle} onChange={set("accountTitle")} />
                  </div>
                  <Field label="Account Number" id="accountNumber" type="text" placeholder="00011223344" value={form.accountNumber} onChange={set("accountNumber")} />
                  <Field label="IBAN (optional)" id="iban" type="text" placeholder="PK00MEZN00011223344" value={form.iban} onChange={set("iban")} />

                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs leading-5 text-amber-800">
                      <strong>Note:</strong> Your vendor application will be reviewed by the ZainStore.pk team. You will receive an email once your account is approved. Approved vendors can immediately list products and start selling.
                    </p>
                  </div>
                </>
              )}

              {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

              {/* Navigation */}
              <div className="flex gap-3 pt-2">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={back}
                    className="flex-1 rounded-md border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                  >
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
                >
                  {step === STEPS.length - 1 ? (loading ? "Submitting…" : "Submit Application") : "Next →"}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-teal-700 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, id, ...props }: { label: string; id: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-700">{label}</label>
      <input
        id={id}
        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        {...props}
      />
    </div>
  );
}
