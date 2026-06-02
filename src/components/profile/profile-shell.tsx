"use client";

import { useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import {
  Bell,
  Building2,
  Camera,
  KeyRound,
  Landmark,
  Loader2,
  ShieldCheck,
  Trash2,
  User,
  UserPen,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  updatePersonalInfo,
  requestEmailChange,
  changePassword,
  updateVendorBank,
  updateVendorStore,
  updateCustomerAddress,
} from "@/lib/profile/actions";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ProfileData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  role: string;
  emailVerified: Date | null;
  createdAt: Date;
  vendorProfile?: {
    bankName: string | null;
    accountTitle: string | null;
    accountNumber: string | null;
    iban: string | null;
    store: {
      name: string;
      description: string | null;
      address: string | null;
      phone: string | null;
      email: string | null;
      logoUrl: string | null;
      bannerUrl: string | null;
    } | null;
  } | null;
  primaryAddress?: {
    id: string;
    label: string | null;
    line1: string;
    line2: string | null;
    city: string;
    region: string | null;
    postalCode: string | null;
  } | null;
};

type TabId = "profile" | "security" | "notifications" | "business" | "bank";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  VENDOR: "Vendor",
  CUSTOMER: "Customer",
};

const roleTones: Record<string, "default" | "accent" | "muted"> = {
  SUPER_ADMIN: "accent",
  VENDOR: "default",
  CUSTOMER: "muted",
};

function Field({
  label,
  id,
  hint,
  ...props
}: { label: string; id: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-700">
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-zinc-50 disabled:text-zinc-400"
        {...props}
      />
      {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}

function TextareaField({
  label,
  id,
  ...props
}: { label: string; id: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-700">
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        {...props}
      />
    </div>
  );
}

function SaveButton({ pending, label = "Save changes" }: { pending: boolean; label?: string }) {
  return (
    <Button type="submit" disabled={pending} className="min-w-[120px]">
      {pending ? <Loader2 size={16} className="animate-spin" /> : label}
    </Button>
  );
}

// ─── Password strength ─────────────────────────────────────────────────────────

function passwordStrength(pw: string) {
  const checks = {
    length:    pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    number:    /[0-9]/.test(pw),
    special:   /[^A-Za-z0-9]/.test(pw),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const labels = ["", "Weak", "Weak", "Fair", "Strong"];
  const colors = ["", "bg-rose-500", "bg-rose-500", "bg-amber-400", "bg-emerald-500"];
  return { checks, score, label: labels[score] ?? "", color: colors[score] ?? "" };
}

// ─── Tab: Personal Info ────────────────────────────────────────────────────────

function PersonalTab({ user }: { user: ProfileData }) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone ?? "",
    image: user.image ?? "",
  });
  const [newEmail, setNewEmail] = useState("");
  const [emailPending, startEmailTransition] = useTransition();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      toast.error("Please select a JPG, PNG, WEBP, or GIF image.");
      return;
    }

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB.");
      return;
    }

    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setForm((f) => ({ ...f, image: dataUrl }));
      setUploadingPhoto(false);
      toast.success("Photo selected — click Save changes to apply.");
    };
    reader.onerror = () => {
      toast.error("Failed to read image file.");
      setUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updatePersonalInfo(form);
      if (res.success) toast.success(res.message);
      else toast.error(res.error);
    });
  }

  function handleEmailChange(e: React.FormEvent) {
    e.preventDefault();
    startEmailTransition(async () => {
      const res = await requestEmailChange(newEmail);
      if (res.success) { toast.success(res.message); setNewEmail(""); }
      else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-6">
      {/* Profile info form */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <p className="text-sm text-zinc-400">Update your name, phone number, and profile picture.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">

            {/* Photo upload widget */}
            <div className="flex items-center gap-5">
              {/* Avatar with camera overlay */}
              <div className="relative shrink-0">
                <Avatar name={form.name || user.name} image={form.image || null} size="xl" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity hover:opacity-100"
                  aria-label="Change photo"
                >
                  {uploadingPhoto
                    ? <Loader2 size={20} className="animate-spin text-white" />
                    : <Camera size={20} className="text-white" />
                  }
                </button>
              </div>

              {/* Upload controls */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-700">Profile Photo</p>
                <p className="text-xs text-zinc-400">JPG, PNG, WEBP or GIF · Max 2MB</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="gap-1.5"
                  >
                    {uploadingPhoto
                      ? <><Loader2 size={13} className="animate-spin" /> Processing…</>
                      : <><Camera size={13} /> Upload Photo</>
                    }
                  </Button>
                  {form.image && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => { setForm((f) => ({ ...f, image: "" })); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="gap-1.5 text-rose-500 hover:border-rose-200 hover:bg-rose-50"
                    >
                      <Trash2 size={13} /> Remove
                    </Button>
                  )}
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handlePhotoSelect}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name *" id="name" type="text" required value={form.name} onChange={set("name")} autoComplete="name" />
              <Field label="Phone Number" id="phone" type="tel" value={form.phone} onChange={set("phone")} placeholder="+92 300 0000000" autoComplete="tel" />
            </div>

            <div className="flex justify-end">
              <SaveButton pending={isPending} />
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Email change */}
      <Card>
        <CardHeader>
          <CardTitle>Email Address</CardTitle>
          <p className="text-sm text-zinc-400">
            Current:{" "}
            <span className="font-medium text-zinc-700">{user.email}</span>
            {user.emailVerified ? (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-600">
                <ShieldCheck size={12} /> Verified
              </span>
            ) : (
              <span className="ml-2 text-xs text-amber-600">Unverified</span>
            )}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailChange} className="space-y-4">
            <Field
              label="New Email Address"
              id="newEmail"
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new@example.com"
              hint="A confirmation link will be sent to your new email. You must click it to complete the change."
            />
            <div className="flex justify-end">
              <Button type="submit" variant="outline" disabled={emailPending || !newEmail} className="min-w-[160px]">
                {emailPending ? <Loader2 size={16} className="animate-spin" /> : "Send confirmation"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account info (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2 text-sm">
            {[
              { label: "User ID", value: user.id },
              { label: "Role", value: roleLabels[user.role] ?? user.role },
              { label: "Member since", value: new Date(user.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" }) },
              { label: "Email status", value: user.emailVerified ? "Verified" : "Unverified" },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</dt>
                <dd className="mt-1 text-zinc-700 font-medium truncate">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab: Security ─────────────────────────────────────────────────────────────

function SecurityTab() {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });

  const strength = passwordStrength(form.next);

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.next !== form.confirm) { toast.error("New passwords do not match."); return; }
    if (strength.score < 2) { toast.error("Please choose a stronger password."); return; }

    startTransition(async () => {
      const res = await changePassword(form.current, form.next);
      if (res.success) {
        toast.success(res.message);
        setForm({ current: "", next: "", confirm: "" });
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <p className="text-sm text-zinc-400">Use a strong, unique password you don't use elsewhere.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <Field label="Current Password *" id="current" type="password" required value={form.current} onChange={set("current")} autoComplete="current-password" />
          <div>
            <Field label="New Password *" id="next" type="password" required value={form.next} onChange={set("next")} autoComplete="new-password" />
            {form.next && (
              <div className="mt-2 space-y-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : "bg-zinc-200"}`} />
                  ))}
                </div>
                <p className={`text-xs font-medium ${strength.score < 2 ? "text-rose-500" : strength.score < 4 ? "text-amber-600" : "text-emerald-600"}`}>
                  {strength.label || "Enter a password"}
                </p>
                <ul className="space-y-1 text-xs text-zinc-500">
                  {[
                    { check: strength.checks.length,    text: "At least 8 characters" },
                    { check: strength.checks.uppercase, text: "One uppercase letter" },
                    { check: strength.checks.number,    text: "One number" },
                    { check: strength.checks.special,   text: "One special character (!@#$…)" },
                  ].map(({ check, text }) => (
                    <li key={text} className={`flex items-center gap-1.5 ${check ? "text-emerald-600" : ""}`}>
                      <span className={`inline-block size-3.5 rounded-full text-center text-[10px] leading-3.5 ${check ? "bg-emerald-100 text-emerald-600" : "bg-zinc-100 text-zinc-400"}`}>
                        {check ? "✓" : "·"}
                      </span>
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <Field label="Confirm New Password *" id="confirm" type="password" required value={form.confirm} onChange={set("confirm")} autoComplete="new-password" />
          <div className="flex justify-end pt-2">
            <SaveButton pending={isPending} label="Update password" />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Tab: Notifications ────────────────────────────────────────────────────────

const notifSettings = [
  { id: "order_updates",  label: "Order Updates",        desc: "Status changes, shipment, delivery" },
  { id: "refunds",        label: "Refund Notifications", desc: "Approvals, rejections, and processing" },
  { id: "vendor_news",    label: "Vendor Announcements",  desc: "Platform updates and news" },
  { id: "promotions",     label: "Promotions & Offers",  desc: "Coupons and special deals" },
  { id: "support",        label: "Support Messages",     desc: "Replies to your support tickets" },
  { id: "security",       label: "Security Alerts",      desc: "Login and account activity" },
];

function NotificationsTab() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(notifSettings.map((s) => [s.id, true])),
  );
  const [isPending, startTransition] = useTransition();

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await new Promise((r) => setTimeout(r, 500));
      toast.success("Notification preferences saved.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <p className="text-sm text-zinc-400">Choose which notifications you'd like to receive.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="divide-y divide-zinc-100">
            {notifSettings.map((s) => (
              <label key={s.id} className="flex cursor-pointer items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-zinc-800">{s.label}</p>
                  <p className="text-xs text-zinc-400">{s.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs[s.id]}
                  onChange={(e) => setPrefs((p) => ({ ...p, [s.id]: e.target.checked }))}
                  className="size-4 rounded accent-brand-500"
                />
              </label>
            ))}
          </div>
          <div className="flex justify-end border-t border-zinc-100 pt-4">
            <SaveButton pending={isPending} label="Save preferences" />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Tab: Vendor Business ──────────────────────────────────────────────────────

function BusinessTab({ user }: { user: ProfileData }) {
  const store = user.vendorProfile?.store;
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    description: store?.description ?? "",
    address:     store?.address ?? "",
    phone:       store?.phone ?? "",
    email:       store?.email ?? "",
    logoUrl:     store?.logoUrl ?? "",
    bannerUrl:   store?.bannerUrl ?? "",
  });

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateVendorStore(form);
      if (res.success) toast.success(res.message);
      else toast.error(res.error);
    });
  }

  const [bankPending, startBankTransition] = useTransition();
  const [bank, setBank] = useState({
    bankName:      user.vendorProfile?.bankName ?? "",
    accountTitle:  user.vendorProfile?.accountTitle ?? "",
    accountNumber: user.vendorProfile?.accountNumber ?? "",
    iban:          user.vendorProfile?.iban ?? "",
  });

  function setB(k: keyof typeof bank) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setBank((b) => ({ ...b, [k]: e.target.value }));
  }

  function handleBankSave(e: React.FormEvent) {
    e.preventDefault();
    startBankTransition(async () => {
      const res = await updateVendorBank(bank);
      if (res.success) toast.success(res.message);
      else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-6">
      {/* Store info */}
      <Card>
        <CardHeader>
          <CardTitle>Store Information</CardTitle>
          <p className="text-sm text-zinc-400">
            Store: <span className="font-medium text-zinc-700">{store?.name ?? "—"}</span>
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <TextareaField label="Store Description" id="description" value={form.description} onChange={set("description")} placeholder="Describe your store…" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Store Address" id="s-address" type="text" value={form.address} onChange={set("address")} placeholder="Shop 5, Main Market, Karachi" />
              <Field label="Store Phone" id="s-phone" type="tel" value={form.phone} onChange={set("phone")} placeholder="+92 300 0000000" />
            </div>
            <Field label="Store Email" id="s-email" type="email" value={form.email} onChange={set("email")} placeholder="store@example.com" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Logo URL" id="logoUrl" type="url" value={form.logoUrl} onChange={set("logoUrl")} placeholder="https://…/logo.png" />
              <Field label="Banner URL" id="bannerUrl" type="url" value={form.bannerUrl} onChange={set("bannerUrl")} placeholder="https://…/banner.jpg" />
            </div>
            <div className="flex justify-end">
              <SaveButton pending={isPending} />
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Bank details */}
      <Card>
        <CardHeader>
          <CardTitle>Bank &amp; Payout Details</CardTitle>
          <p className="text-sm text-zinc-400">Used for withdrawal payouts. Kept confidential.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBankSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Bank Name" id="bankName" type="text" value={bank.bankName} onChange={setB("bankName")} placeholder="Meezan Bank" />
              <Field label="Account Title" id="accountTitle" type="text" value={bank.accountTitle} onChange={setB("accountTitle")} placeholder="Your Name" />
            </div>
            <Field label="Account Number" id="accountNumber" type="text" value={bank.accountNumber} onChange={setB("accountNumber")} placeholder="00011223344" />
            <Field label="IBAN (optional)" id="iban" type="text" value={bank.iban} onChange={setB("iban")} placeholder="PK00MEZN00011223344" />
            <div className="flex justify-end">
              <SaveButton pending={bankPending} label="Save bank details" />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab: Customer Address ─────────────────────────────────────────────────────

function AddressTab({ user }: { user: ProfileData }) {
  const addr = user.primaryAddress;
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    label:      addr?.label ?? "Home",
    line1:      addr?.line1 ?? "",
    line2:      addr?.line2 ?? "",
    city:       addr?.city ?? "",
    region:     addr?.region ?? "",
    postalCode: addr?.postalCode ?? "",
  });

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateCustomerAddress(addr?.id ?? null, form);
      if (res.success) toast.success(res.message);
      else toast.error(res.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Primary Shipping Address</CardTitle>
        <p className="text-sm text-zinc-400">Used as your default delivery address.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Label" id="label" type="text" value={form.label} onChange={set("label")} placeholder="Home / Office / Other" />
          <Field label="Address Line 1 *" id="line1" type="text" required value={form.line1} onChange={set("line1")} placeholder="House 12, Street 4" />
          <Field label="Address Line 2" id="line2" type="text" value={form.line2} onChange={set("line2")} placeholder="Near landmark (optional)" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="City *" id="city" type="text" required value={form.city} onChange={set("city")} placeholder="Karachi" />
            <Field label="Province" id="region" type="text" value={form.region} onChange={set("region")} placeholder="Sindh" />
            <Field label="Postal Code" id="postalCode" type="text" value={form.postalCode} onChange={set("postalCode")} placeholder="75500" />
          </div>
          <div className="flex justify-end">
            <SaveButton pending={isPending} />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Main ProfileShell ─────────────────────────────────────────────────────────

type TabConfig = { id: TabId; label: string; icon: React.ElementType };

export function ProfileShell({ user, initialTab = "profile" }: { user: ProfileData; initialTab?: string }) {
  const isVendor   = user.role === "VENDOR";
  const isCustomer = user.role === "CUSTOMER";

  const tabs: TabConfig[] = [
    { id: "profile",       label: "Profile",        icon: User },
    ...(isVendor   ? [{ id: "business" as TabId, label: "Business",     icon: Building2 }] : []),
    ...(isCustomer ? [{ id: "bank"     as TabId, label: "Address",      icon: Landmark  }] : []),
    { id: "security",      label: "Security",       icon: KeyRound },
    { id: "notifications", label: "Notifications",  icon: Bell },
  ];

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const valid = tabs.map((t) => t.id);
    return (valid.includes(initialTab as TabId) ? initialTab : "profile") as TabId;
  });

  return (
    <div className="space-y-6">
      {/* Profile header card */}
      <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} image={user.image} size="xl" />
          <div>
            <h2 className="text-xl font-bold text-zinc-950">{user.name}</h2>
            <p className="text-sm text-zinc-500">{user.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone={roleTones[user.role] ?? "muted"}>{roleLabels[user.role] ?? user.role}</Badge>
              {user.emailVerified ? (
                <span className="flex items-center gap-1 text-xs text-emerald-600">
                  <ShieldCheck size={12} /> Email verified
                </span>
              ) : (
                <span className="text-xs text-amber-500">Email unverified</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
          <div className="rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2">
            <p className="font-semibold text-zinc-700">Member since</p>
            <p>{new Date(user.createdAt).toLocaleDateString("en-PK", { month: "short", year: "numeric" })}</p>
          </div>
          {isVendor && user.vendorProfile?.store && (
            <div className="rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2">
              <p className="font-semibold text-zinc-700">Store</p>
              <p className="max-w-[120px] truncate">{user.vendorProfile.store.name}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-zinc-200 bg-white p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-brand-500 text-white shadow-sm"
                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
            }`}
          >
            <tab.icon size={15} aria-hidden />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "profile"       && <PersonalTab      user={user} />}
        {activeTab === "business"      && <BusinessTab      user={user} />}
        {activeTab === "bank"          && <AddressTab       user={user} />}
        {activeTab === "security"      && <SecurityTab />}
        {activeTab === "notifications" && <NotificationsTab />}
      </div>
    </div>
  );
}
