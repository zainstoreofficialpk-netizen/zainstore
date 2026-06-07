"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Bell,
  Lock,
  MapPin,
  RefreshCcw,
  Shield,
  Trash2,
  User,
  Plus,
  Pencil,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { updatePersonalInfo, changePassword } from "@/lib/profile/actions";
import {
  saveNotificationPreferences,
  savePrivacySettings,
  createCustomerAddress,
  updateCustomerAddressById,
  deleteCustomerAddress,
} from "@/lib/settings/customer-settings";

type Address = {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postalCode: string | null;
};

type Refund = {
  id: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
  orderNumber: string;
};

type Props = {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    image: string | null;
    emailVerified: string | null;
    notificationPreferences: Record<string, boolean> | null;
    privacySettings: Record<string, boolean> | null;
    createdAt: string;
  };
  addresses: Address[];
  refunds: Refund[];
};

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "refunds", label: "Refunds", icon: RefreshCcw },
] as const;

const DEFAULT_NOTIFICATIONS: Record<string, boolean> = {
  orders: true,
  refunds: true,
  announcements: false,
  promotions: false,
  support: true,
  security: true,
};

const DEFAULT_PRIVACY: Record<string, boolean> = {
  profileVisible: true,
  shareDataWithVendors: false,
  marketingEmails: false,
};

const REFUND_STATUS_STYLES: Record<string, string> = {
  REQUESTED: "bg-yellow-50 text-yellow-700",
  UNDER_REVIEW: "bg-blue-50 text-blue-700",
  APPROVED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
  PROCESSED: "bg-zinc-50 text-zinc-600",
};

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-colors ${checked ? "bg-brand-500" : "bg-zinc-200"}`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`}
      />
    </button>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-50">
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
        {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10";

function SaveButton({ pending, label = "Save Changes" }: { pending: boolean; label?: string }) {
  return (
    <button
      type="button"
      disabled={pending}
      className="mt-4 px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

function AddressForm({
  initial,
  onSave,
  onCancel,
  pending,
}: {
  initial?: Address;
  onSave: (data: {
    label: string;
    line1: string;
    line2: string;
    city: string;
    region: string;
    postalCode: string;
  }) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [form, setForm] = useState({
    label: initial?.label ?? "Home",
    line1: initial?.line1 ?? "",
    line2: initial?.line2 ?? "",
    city: initial?.city ?? "",
    region: initial?.region ?? "",
    postalCode: initial?.postalCode ?? "",
  });

  function set(k: string, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  return (
    <div className="rounded-lg border border-zinc-200 p-4 space-y-3 bg-zinc-50/50">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Label">
          <input className={inputCls} value={form.label} onChange={(e) => set("label", e.target.value)} placeholder="Home, Office…" />
        </Field>
        <Field label="City *">
          <input className={inputCls} value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Karachi" />
        </Field>
      </div>
      <Field label="Address Line 1 *">
        <input className={inputCls} value={form.line1} onChange={(e) => set("line1", e.target.value)} placeholder="House / flat number, street" />
      </Field>
      <Field label="Address Line 2">
        <input className={inputCls} value={form.line2} onChange={(e) => set("line2", e.target.value)} placeholder="Area, landmark (optional)" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Province">
          <input className={inputCls} value={form.region} onChange={(e) => set("region", e.target.value)} placeholder="Sindh" />
        </Field>
        <Field label="Postal Code">
          <input className={inputCls} value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} placeholder="74200" />
        </Field>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          disabled={pending}
          onClick={() => onSave(form)}
          className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
        >
          {pending ? "Saving…" : "Save Address"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function CustomerSettingsShell({ user, addresses: initialAddresses, refunds }: Props) {
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [isPending, startTransition] = useTransition();

  // Profile state
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [image, setImage] = useState(user.image ?? "");

  // Security state
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  // Notifications state
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    ...DEFAULT_NOTIFICATIONS,
    ...(user.notificationPreferences ?? {}),
  });

  // Privacy state
  const [privacy, setPrivacy] = useState<Record<string, boolean>>({
    ...DEFAULT_PRIVACY,
    ...(user.privacySettings ?? {}),
  });

  // Address state
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function run(fn: () => Promise<{ success: boolean; message?: string; error?: string }>) {
    startTransition(async () => {
      const res = await fn();
      if (res.success) toast.success(res.message ?? "Saved.");
      else toast.error((res as { error: string }).error);
    });
  }

  function handleSaveProfile() {
    run(() => updatePersonalInfo({ name, phone: phone || undefined, image: image || undefined }));
  }

  function handleChangePassword() {
    if (!newPwd || newPwd !== confirmPwd) {
      toast.error("New passwords do not match.");
      return;
    }
    run(async () => {
      const res = await changePassword(currentPwd, newPwd);
      if (res.success) {
        setCurrentPwd("");
        setNewPwd("");
        setConfirmPwd("");
      }
      return res;
    });
  }

  function handleSaveNotifications() {
    run(() => saveNotificationPreferences(notifPrefs));
  }

  function handleSavePrivacy() {
    run(() => savePrivacySettings(privacy));
  }

  function handleAddAddress(data: Parameters<typeof createCustomerAddress>[0]) {
    startTransition(async () => {
      const res = await createCustomerAddress(data);
      if (res.success) {
        toast.success("Address added.");
        setShowAddForm(false);
        // optimistic: let server revalidation handle refresh
      } else {
        toast.error((res as { error: string }).error);
      }
    });
  }

  function handleUpdateAddress(id: string, data: Parameters<typeof updateCustomerAddressById>[1]) {
    startTransition(async () => {
      const res = await updateCustomerAddressById(id, data);
      if (res.success) {
        toast.success("Address updated.");
        setEditingId(null);
      } else {
        toast.error((res as { error: string }).error);
      }
    });
  }

  function handleDeleteAddress(id: string) {
    startTransition(async () => {
      const res = await deleteCustomerAddress(id);
      if (res.success) {
        toast.success("Address deleted.");
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      } else {
        toast.error((res as { error: string }).error);
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Mobile tab bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 md:hidden">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              activeTab === tab.id ? "bg-brand-500 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <aside className="hidden md:block w-44 shrink-0">
          <nav className="space-y-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? "bg-brand-50 text-brand-600 font-medium"
                      : "text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 space-y-4">

          {/* ── Profile ─────────────────────────────────────── */}
          {activeTab === "profile" && (
            <>
              <Section title="Profile Information" description="Update your name, phone number, and avatar.">
                <div className="space-y-4">
                  {user.image && (
                    <div className="flex items-center gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={user.image} alt="Avatar" className="h-14 w-14 rounded-full object-cover border border-zinc-200" />
                      <div>
                        <p className="text-sm font-medium text-zinc-800">{user.name}</p>
                        <p className="text-xs text-zinc-500">{user.email}</p>
                      </div>
                    </div>
                  )}
                  <Field label="Full Name *">
                    <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                  </Field>
                  <Field label="Phone Number">
                    <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 1234567" />
                  </Field>
                  <Field label="Profile Picture URL">
                    <input className={inputCls} value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://…" />
                  </Field>
                  <button type="button" disabled={isPending} onClick={handleSaveProfile}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                    {isPending ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </Section>

              <Section title="Email Address" description="Your current verified email address.">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-800">{user.email}</p>
                    <p className="text-xs mt-0.5 flex items-center gap-1">
                      {user.emailVerified
                        ? <><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /><span className="text-green-600">Verified</span></>
                        : <><AlertCircle className="h-3.5 w-3.5 text-yellow-500" /><span className="text-yellow-600">Not verified</span></>
                      }
                    </p>
                  </div>
                  <span className="text-xs text-zinc-400">Email change available in Profile → Security</span>
                </div>
              </Section>
            </>
          )}

          {/* ── Security ─────────────────────────────────────── */}
          {activeTab === "security" && (
            <>
              <Section title="Change Password" description="Use a strong password with at least 8 characters.">
                <div className="space-y-4">
                  <Field label="Current Password">
                    <input type="password" className={inputCls} value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} placeholder="••••••••" />
                  </Field>
                  <Field label="New Password">
                    <input type="password" className={inputCls} value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="••••••••" />
                    {newPwd && (
                      <div className="mt-2 flex gap-1">
                        {[
                          newPwd.length >= 8,
                          /[A-Z]/.test(newPwd),
                          /[0-9]/.test(newPwd),
                          /[^A-Za-z0-9]/.test(newPwd),
                        ].map((ok, i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full ${ok ? "bg-green-500" : "bg-zinc-200"}`} />
                        ))}
                      </div>
                    )}
                  </Field>
                  <Field label="Confirm New Password">
                    <input type="password" className={inputCls} value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} placeholder="••••••••" />
                  </Field>
                  <button type="button" disabled={isPending} onClick={handleChangePassword}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                    {isPending ? "Updating…" : "Update Password"}
                  </button>
                </div>
              </Section>

              <Section title="Account Security" description="Your account status and security details.">
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-zinc-50">
                    <span className="text-sm text-zinc-700">Account Status</span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">Active</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-zinc-50">
                    <span className="text-sm text-zinc-700">Email Verified</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.emailVerified ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                      {user.emailVerified ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-zinc-700">Member Since</span>
                    <span className="text-xs text-zinc-500">
                      {new Date(user.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })}
                    </span>
                  </div>
                </div>
              </Section>
            </>
          )}

          {/* ── Addresses ─────────────────────────────────────── */}
          {activeTab === "addresses" && (
            <Section title="Address Management" description="Manage your saved delivery addresses.">
              <div className="space-y-3">
                {addresses.map((addr) =>
                  editingId === addr.id ? (
                    <AddressForm
                      key={addr.id}
                      initial={addr}
                      pending={isPending}
                      onCancel={() => setEditingId(null)}
                      onSave={(data) => handleUpdateAddress(addr.id, data)}
                    />
                  ) : (
                    <div key={addr.id} className="flex items-start justify-between rounded-lg border border-zinc-100 p-3 bg-zinc-50/50">
                      <div>
                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{addr.label ?? "Home"}</p>
                        <p className="text-sm text-zinc-800 mt-0.5">{addr.line1}</p>
                        {addr.line2 && <p className="text-sm text-zinc-600">{addr.line2}</p>}
                        <p className="text-sm text-zinc-600">{[addr.city, addr.region, addr.postalCode].filter(Boolean).join(", ")}</p>
                      </div>
                      <div className="flex gap-1 ml-3">
                        <button onClick={() => setEditingId(addr.id)} className="p-1.5 text-zinc-400 hover:text-brand-500 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDeleteAddress(addr.id)} disabled={isPending} className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                )}

                {addresses.length === 0 && !showAddForm && (
                  <p className="text-sm text-zinc-400 py-4 text-center">No addresses saved yet.</p>
                )}

                {showAddForm ? (
                  <AddressForm
                    pending={isPending}
                    onCancel={() => setShowAddForm(false)}
                    onSave={handleAddAddress}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-brand-500 hover:text-brand-600 font-medium transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add New Address
                  </button>
                )}
              </div>
            </Section>
          )}

          {/* ── Notifications ─────────────────────────────────── */}
          {activeTab === "notifications" && (
            <Section title="Notification Preferences" description="Choose which notifications you want to receive.">
              <div className="space-y-4">
                {[
                  { key: "orders", label: "Order Updates", description: "Shipping, delivery, and status changes" },
                  { key: "refunds", label: "Refund Updates", description: "Refund approvals and status changes" },
                  { key: "announcements", label: "Announcements", description: "Platform news and updates" },
                  { key: "promotions", label: "Promotions", description: "Deals, discounts, and offers" },
                  { key: "support", label: "Support Replies", description: "Responses to your support tickets" },
                  { key: "security", label: "Security Alerts", description: "Login attempts and account activity" },
                ].map(({ key, label, description }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-800">{label}</p>
                      <p className="text-xs text-zinc-500">{description}</p>
                    </div>
                    <Toggle
                      checked={notifPrefs[key] ?? DEFAULT_NOTIFICATIONS[key]}
                      onChange={(v) => setNotifPrefs((p) => ({ ...p, [key]: v }))}
                    />
                  </div>
                ))}
                <button type="button" disabled={isPending} onClick={handleSaveNotifications}
                  className="mt-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                  {isPending ? "Saving…" : "Save Preferences"}
                </button>
              </div>
            </Section>
          )}

          {/* ── Privacy ───────────────────────────────────────── */}
          {activeTab === "privacy" && (
            <Section title="Privacy Settings" description="Control how your information is used and displayed.">
              <div className="space-y-4">
                {[
                  { key: "profileVisible", label: "Public Profile", description: "Allow vendors to view your profile when you write reviews" },
                  { key: "shareDataWithVendors", label: "Share Data with Vendors", description: "Allow vendors to see your purchase history for better recommendations" },
                  { key: "marketingEmails", label: "Marketing Emails", description: "Receive promotional emails and newsletters" },
                ].map(({ key, label, description }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-800">{label}</p>
                      <p className="text-xs text-zinc-500">{description}</p>
                    </div>
                    <Toggle
                      checked={privacy[key] ?? DEFAULT_PRIVACY[key]}
                      onChange={(v) => setPrivacy((p) => ({ ...p, [key]: v }))}
                    />
                  </div>
                ))}
                <button type="button" disabled={isPending} onClick={handleSavePrivacy}
                  className="mt-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                  {isPending ? "Saving…" : "Save Settings"}
                </button>
              </div>
            </Section>
          )}

          {/* ── Refunds ───────────────────────────────────────── */}
          {activeTab === "refunds" && (
            <>
              <Section title="Refund History" description="Track all your refund requests.">
                {refunds.length === 0 ? (
                  <p className="text-sm text-zinc-400 py-4 text-center">No refund requests found.</p>
                ) : (
                  <div className="divide-y divide-zinc-50">
                    {refunds.map((r) => (
                      <div key={r.id} className="py-3 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-800">Order #{r.orderNumber}</p>
                          <p className="text-xs text-zinc-500 mt-0.5 truncate">{r.reason}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {new Date(r.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-medium text-zinc-800">PKR {r.amount.toLocaleString()}</p>
                          <span className={`mt-1 inline-block text-xs font-medium px-2 py-0.5 rounded-full ${REFUND_STATUS_STYLES[r.status] ?? "bg-zinc-50 text-zinc-600"}`}>
                            {r.status.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="Request a Refund" description="To request a refund, please visit your order details page and select the item to refund.">
                <p className="text-sm text-zinc-500">
                  Go to{" "}
                  <a href="/customer/orders" className="text-brand-500 hover:underline font-medium">
                    My Orders
                  </a>{" "}
                  → select an order → click <strong>Request Refund</strong> on the item you want to return.
                </p>
              </Section>
            </>
          )}

        </main>
      </div>
    </div>
  );
}
