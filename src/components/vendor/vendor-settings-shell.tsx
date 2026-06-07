"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Bell,
  Building2,
  CreditCard,
  Image,
  Lock,
  Package,
  Percent,
  User,
} from "lucide-react";
import { updatePersonalInfo, changePassword, updateVendorBank } from "@/lib/profile/actions";
import {
  saveVendorNotificationPreferences,
  updateVendorStoreInfo,
  updateVendorBranding,
  saveVendorShippingSettings,
  saveVendorTaxSettings,
} from "@/lib/settings/vendor-settings";

type Props = {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    image: string | null;
    emailVerified: string | null;
    notificationPreferences: Record<string, boolean> | null;
    createdAt: string;
  };
  vendor: {
    id: string;
    bankName: string | null;
    accountTitle: string | null;
    accountNumber: string | null;
    iban: string | null;
    shippingSettings: Record<string, unknown> | null;
    taxSettings: Record<string, unknown> | null;
  };
  store: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    shippingPolicy: string | null;
    returnPolicy: string | null;
  };
};

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "store", label: "Store Info", icon: Building2 },
  { id: "branding", label: "Branding", icon: Image },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "security", label: "Security", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "shipping", label: "Shipping", icon: Package },
  { id: "tax", label: "Tax", icon: Percent },
] as const;

const DEFAULT_NOTIFICATIONS: Record<string, boolean> = {
  orders: true,
  refunds: true,
  withdrawals: true,
  reviews: true,
  announcements: false,
  promotions: false,
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10";
const textareaCls =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 resize-none";

function SaveBtn({ pending }: { pending: boolean }) {
  return (
    <button
      type="button"
      disabled={pending}
      className="mt-4 px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
    >
      {pending ? "Saving…" : "Save Changes"}
    </button>
  );
}

export function VendorSettingsShell({ user, vendor, store }: Props) {
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [isPending, startTransition] = useTransition();

  // Profile
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [image, setImage] = useState(user.image ?? "");

  // Store
  const [storeDesc, setStoreDesc] = useState(store.description ?? "");
  const [storeAddr, setStoreAddr] = useState(store.address ?? "");
  const [storePhone, setStorePhone] = useState(store.phone ?? "");
  const [storeEmail, setStoreEmail] = useState(store.email ?? "");

  // Branding
  const [logoUrl, setLogoUrl] = useState(store.logoUrl ?? "");
  const [bannerUrl, setBannerUrl] = useState(store.bannerUrl ?? "");

  // Payment / Bank
  const [bankName, setBankName] = useState(vendor.bankName ?? "");
  const [accountTitle, setAccountTitle] = useState(vendor.accountTitle ?? "");
  const [accountNumber, setAccountNumber] = useState(vendor.accountNumber ?? "");
  const [iban, setIban] = useState(vendor.iban ?? "");

  // Security
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  // Notifications
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    ...DEFAULT_NOTIFICATIONS,
    ...(user.notificationPreferences ?? {}),
  });

  // Shipping
  const shipping = (vendor.shippingSettings ?? {}) as Record<string, unknown>;
  const [processingTime, setProcessingTime] = useState(String(shipping.processingTime ?? "1-2"));
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(String(shipping.freeShippingThreshold ?? "0"));
  const [defaultShippingCost, setDefaultShippingCost] = useState(String(shipping.defaultShippingCost ?? "150"));
  const [shippingPolicy, setShippingPolicy] = useState(String(shipping.shippingPolicy ?? store.shippingPolicy ?? ""));
  const [returnPolicy, setReturnPolicy] = useState(String(shipping.returnPolicy ?? store.returnPolicy ?? ""));

  // Tax
  const tax = (vendor.taxSettings ?? {}) as Record<string, unknown>;
  const [taxEnabled, setTaxEnabled] = useState(Boolean(tax.taxEnabled ?? false));
  const [taxRate, setTaxRate] = useState(String(tax.taxRate ?? "0"));
  const [taxIncluded, setTaxIncluded] = useState(Boolean(tax.taxIncluded ?? false));

  function run(fn: () => Promise<{ success: boolean; message?: string; error?: string }>) {
    startTransition(async () => {
      const res = await fn();
      if (res.success) toast.success(res.message ?? "Saved.");
      else toast.error((res as { error: string }).error);
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
        {/* Sidebar */}
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

        <main className="flex-1 min-w-0 space-y-4">

          {/* ── Profile ── */}
          {activeTab === "profile" && (
            <Section title="Profile Information" description="Update your personal details and avatar.">
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
                  <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label="Phone Number">
                  <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 1234567" />
                </Field>
                <Field label="Profile Picture URL">
                  <input className={inputCls} value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://…" />
                </Field>
                <div className="pt-1">
                  <p className="text-xs text-zinc-500 mb-1">Store</p>
                  <p className="text-sm font-medium text-zinc-800">{store.name}</p>
                  <p className="text-xs text-zinc-400">zainstore.pk/store/{store.slug}</p>
                </div>
                <button type="button" disabled={isPending}
                  onClick={() => run(() => updatePersonalInfo({ name, phone: phone || undefined, image: image || undefined }))}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                  {isPending ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </Section>
          )}

          {/* ── Store Info ── */}
          {activeTab === "store" && (
            <Section title="Store Information" description="Edit your store description and contact details.">
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                  <p className="text-xs text-zinc-500">Store Name (managed by admin)</p>
                  <p className="text-sm font-medium text-zinc-800 mt-0.5">{store.name}</p>
                </div>
                <Field label="Store Description">
                  <textarea rows={3} className={textareaCls} value={storeDesc} onChange={(e) => setStoreDesc(e.target.value)} placeholder="Tell customers about your store…" />
                </Field>
                <Field label="Store Address">
                  <input className={inputCls} value={storeAddr} onChange={(e) => setStoreAddr(e.target.value)} placeholder="City, Province" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Contact Phone">
                    <input className={inputCls} value={storePhone} onChange={(e) => setStorePhone(e.target.value)} placeholder="+92…" />
                  </Field>
                  <Field label="Contact Email">
                    <input className={inputCls} value={storeEmail} onChange={(e) => setStoreEmail(e.target.value)} placeholder="store@email.com" />
                  </Field>
                </div>
                <button type="button" disabled={isPending}
                  onClick={() => run(() => updateVendorStoreInfo({ description: storeDesc, address: storeAddr, phone: storePhone, email: storeEmail }))}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                  {isPending ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </Section>
          )}

          {/* ── Branding ── */}
          {activeTab === "branding" && (
            <Section title="Store Logo & Banner" description="Upload your store logo and banner image.">
              <div className="space-y-4">
                {logoUrl && (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoUrl} alt="Logo" className="h-16 w-16 rounded-xl object-cover border border-zinc-200" />
                    <div>
                      <p className="text-xs font-medium text-zinc-700">Current Logo</p>
                      <p className="text-xs text-zinc-400 truncate max-w-[200px]">{logoUrl}</p>
                    </div>
                  </div>
                )}
                {bannerUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bannerUrl} alt="Banner" className="w-full h-28 rounded-xl object-cover border border-zinc-200" />
                )}
                <Field label="Logo URL">
                  <input className={inputCls} value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://… (recommended: 200×200px square)" />
                </Field>
                <Field label="Banner URL">
                  <input className={inputCls} value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://… (recommended: 1200×300px)" />
                </Field>
                <button type="button" disabled={isPending}
                  onClick={() => run(() => updateVendorBranding({ logoUrl, bannerUrl }))}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                  {isPending ? "Saving…" : "Save Branding"}
                </button>
              </div>
            </Section>
          )}

          {/* ── Payment ── */}
          {activeTab === "payment" && (
            <Section title="Bank / Payment Information" description="Your payout bank account details.">
              <div className="space-y-4">
                <Field label="Bank Name">
                  <input className={inputCls} value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="HBL, UBL, Meezan…" />
                </Field>
                <Field label="Account Title">
                  <input className={inputCls} value={accountTitle} onChange={(e) => setAccountTitle(e.target.value)} placeholder="Full name as on account" />
                </Field>
                <Field label="Account Number">
                  <input className={inputCls} value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="XXXXXXXXXX" />
                </Field>
                <Field label="IBAN">
                  <input className={inputCls} value={iban} onChange={(e) => setIban(e.target.value)} placeholder="PK00XXXX0000000000000000" />
                </Field>
                <button type="button" disabled={isPending}
                  onClick={() => run(() => updateVendorBank({ bankName, accountTitle, accountNumber, iban }))}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                  {isPending ? "Saving…" : "Save Bank Details"}
                </button>
              </div>
            </Section>
          )}

          {/* ── Security ── */}
          {activeTab === "security" && (
            <Section title="Change Password" description="Use a strong password with at least 8 characters.">
              <div className="space-y-4">
                <Field label="Current Password">
                  <input type="password" className={inputCls} value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} placeholder="••••••••" />
                </Field>
                <Field label="New Password">
                  <input type="password" className={inputCls} value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="••••••••" />
                  {newPwd && (
                    <div className="mt-2 flex gap-1">
                      {[newPwd.length >= 8, /[A-Z]/.test(newPwd), /[0-9]/.test(newPwd), /[^A-Za-z0-9]/.test(newPwd)].map((ok, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full ${ok ? "bg-green-500" : "bg-zinc-200"}`} />
                      ))}
                    </div>
                  )}
                </Field>
                <Field label="Confirm New Password">
                  <input type="password" className={inputCls} value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} placeholder="••••••••" />
                </Field>
                <button type="button" disabled={isPending}
                  onClick={() => {
                    if (!newPwd || newPwd !== confirmPwd) { toast.error("Passwords do not match."); return; }
                    run(async () => {
                      const res = await changePassword(currentPwd, newPwd);
                      if (res.success) { setCurrentPwd(""); setNewPwd(""); setConfirmPwd(""); }
                      return res;
                    });
                  }}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                  {isPending ? "Updating…" : "Update Password"}
                </button>
              </div>
            </Section>
          )}

          {/* ── Notifications ── */}
          {activeTab === "notifications" && (
            <Section title="Notification Settings" description="Choose which notifications you want to receive.">
              <div className="space-y-4">
                {[
                  { key: "orders", label: "New Orders", description: "Alerts when you receive a new order" },
                  { key: "refunds", label: "Refund Requests", description: "When a customer requests a refund" },
                  { key: "withdrawals", label: "Withdrawal Updates", description: "Status changes on your withdrawal requests" },
                  { key: "reviews", label: "New Reviews", description: "When a customer leaves a review on your products" },
                  { key: "announcements", label: "Platform Announcements", description: "Important updates from ZainStore" },
                  { key: "promotions", label: "Promotions & Tips", description: "Tips to grow your store" },
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
                <button type="button" disabled={isPending}
                  onClick={() => run(() => saveVendorNotificationPreferences(notifPrefs))}
                  className="mt-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                  {isPending ? "Saving…" : "Save Preferences"}
                </button>
              </div>
            </Section>
          )}

          {/* ── Shipping ── */}
          {activeTab === "shipping" && (
            <>
              <Section title="Shipping Settings" description="Configure your default shipping options.">
                <div className="space-y-4">
                  <Field label="Processing Time (days)">
                    <select className={inputCls} value={processingTime} onChange={(e) => setProcessingTime(e.target.value)}>
                      <option value="same-day">Same Day</option>
                      <option value="1">1 Day</option>
                      <option value="1-2">1–2 Days</option>
                      <option value="2-3">2–3 Days</option>
                      <option value="3-5">3–5 Days</option>
                      <option value="5-7">5–7 Days</option>
                    </select>
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Default Shipping Cost (PKR)">
                      <input type="number" className={inputCls} value={defaultShippingCost} onChange={(e) => setDefaultShippingCost(e.target.value)} min="0" />
                    </Field>
                    <Field label="Free Shipping Over (PKR, 0 = disabled)">
                      <input type="number" className={inputCls} value={freeShippingThreshold} onChange={(e) => setFreeShippingThreshold(e.target.value)} min="0" />
                    </Field>
                  </div>
                </div>
              </Section>
              <Section title="Policies" description="Your shipping and return policy text shown to customers.">
                <div className="space-y-4">
                  <Field label="Shipping Policy">
                    <textarea rows={4} className={textareaCls} value={shippingPolicy} onChange={(e) => setShippingPolicy(e.target.value)} placeholder="Describe your shipping methods, delivery timeframes…" />
                  </Field>
                  <Field label="Return Policy">
                    <textarea rows={4} className={textareaCls} value={returnPolicy} onChange={(e) => setReturnPolicy(e.target.value)} placeholder="Describe your return and refund policy…" />
                  </Field>
                  <button type="button" disabled={isPending}
                    onClick={() => run(() => saveVendorShippingSettings({
                      processingTime,
                      freeShippingThreshold: Number(freeShippingThreshold),
                      defaultShippingCost: Number(defaultShippingCost),
                      shippingPolicy,
                      returnPolicy,
                    }))}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                    {isPending ? "Saving…" : "Save Shipping Settings"}
                  </button>
                </div>
              </Section>
            </>
          )}

          {/* ── Tax ── */}
          {activeTab === "tax" && (
            <Section title="Tax Settings" description="Configure how tax is applied to your products.">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-800">Enable Tax</p>
                    <p className="text-xs text-zinc-500">Collect tax on your product sales</p>
                  </div>
                  <Toggle checked={taxEnabled} onChange={setTaxEnabled} />
                </div>
                {taxEnabled && (
                  <>
                    <Field label="Tax Rate (%)">
                      <input type="number" className={inputCls} value={taxRate} onChange={(e) => setTaxRate(e.target.value)} min="0" max="100" step="0.1" placeholder="17" />
                    </Field>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-zinc-800">Tax Included in Price</p>
                        <p className="text-xs text-zinc-500">If on, prices already include tax</p>
                      </div>
                      <Toggle checked={taxIncluded} onChange={setTaxIncluded} />
                    </div>
                  </>
                )}
                <button type="button" disabled={isPending}
                  onClick={() => run(() => saveVendorTaxSettings({ taxEnabled, taxRate: Number(taxRate), taxIncluded }))}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                  {isPending ? "Saving…" : "Save Tax Settings"}
                </button>
              </div>
            </Section>
          )}

        </main>
      </div>
    </div>
  );
}
