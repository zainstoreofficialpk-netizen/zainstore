"use client";

import { useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import {
  Activity,
  BadgePercent,
  Bell,
  Camera,
  CircleDollarSign,
  CreditCard,
  Lock,
  Settings,
  Shield,
  User,
} from "lucide-react";
import { updatePersonalInfo, changePassword, requestEmailChange } from "@/lib/profile/actions";
import { savePlatformSettings, saveAdminNotificationPreferences } from "@/lib/settings/admin-settings";

type PlatformSetting = { key: string; value: unknown; group: string; description?: string };

type ActivityLog = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  ipAddress: string | null;
  createdAt: string;
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
    twoFactorEnabled: boolean;
    createdAt: string;
  };
  platformSettings: PlatformSetting[];
  activityLogs: ActivityLog[];
};

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "system", label: "System", icon: Settings },
  { id: "commission", label: "Commission", icon: BadgePercent },
  { id: "financial", label: "Financial", icon: CircleDollarSign },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "activity", label: "Activity", icon: Activity },
] as const;

const DEFAULT_NOTIFICATIONS: Record<string, boolean> = {
  newVendors: true,
  newOrders: false,
  refunds: true,
  withdrawals: true,
  reviews: false,
  security: true,
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-colors ${checked ? "bg-brand-500" : "bg-zinc-200"}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
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

function getSetting(settings: PlatformSetting[], key: string, fallback: unknown = "") {
  return settings.find((s) => s.key === key)?.value ?? fallback;
}

export function AdminSettingsShell({ user, platformSettings, activityLogs }: Props) {
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [isPending, startTransition] = useTransition();

  // Profile
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [image, setImage] = useState(user.image ?? "");
  const [newEmail, setNewEmail] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Please select a JPG, PNG, or WEBP image."); return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB."); return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage(ev.target?.result as string);
      toast.success("Photo selected — click Save Changes to apply.");
    };
    reader.readAsDataURL(file);
  }

  // Security
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  // Notifications
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    ...DEFAULT_NOTIFICATIONS,
    ...(user.notificationPreferences ?? {}),
  });

  // System settings
  const [siteName, setSiteName] = useState(String(getSetting(platformSettings, "system.site_name", "ZainStore.pk")));
  const [maintenanceMode, setMaintenanceMode] = useState(Boolean(getSetting(platformSettings, "system.maintenance_mode", false)));
  const [supportEmail, setSupportEmail] = useState(String(getSetting(platformSettings, "system.support_email", "")));

  // Commission settings
  const [defaultCommissionRate, setDefaultCommissionRate] = useState(
    String(getSetting(platformSettings, "commission.default_rate", "10"))
  );
  const [commissionOnShipping, setCommissionOnShipping] = useState(
    Boolean(getSetting(platformSettings, "commission.on_shipping", false))
  );
  const [commissionOnTax, setCommissionOnTax] = useState(
    Boolean(getSetting(platformSettings, "commission.on_tax", false))
  );

  // Financial settings
  const [currency, setCurrency] = useState(String(getSetting(platformSettings, "financial.currency", "PKR")));
  const [taxRate, setTaxRate] = useState(String(getSetting(platformSettings, "financial.tax_rate", "17")));
  const [taxEnabled, setTaxEnabled] = useState(Boolean(getSetting(platformSettings, "financial.tax_enabled", false)));

  // Payment settings
  const [codEnabled, setCodEnabled] = useState(Boolean(getSetting(platformSettings, "payment.cod_enabled", true)));
  const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState(
    Boolean(getSetting(platformSettings, "payment.online_enabled", false))
  );
  const [minWithdrawal, setMinWithdrawal] = useState(
    String(getSetting(platformSettings, "payment.min_withdrawal", "500"))
  );

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
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              activeTab === tab.id ? "bg-brand-500 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}>
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
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-left transition-colors ${
                    activeTab === tab.id ? "bg-brand-50 text-brand-600 font-medium" : "text-zinc-600 hover:bg-zinc-50"
                  }`}>
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
            <>
              <Section title="Profile Information" description="Update your admin profile details.">
                <div className="space-y-4">
                  {/* Avatar upload */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt="" className="h-16 w-16 rounded-full object-cover border-2 border-zinc-200" />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xl font-black">
                          {name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-brand-500 hover:bg-brand-600 flex items-center justify-center border-2 border-white"
                      >
                        <Camera className="w-3 h-3 text-white" />
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoSelect} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-800">{user.name}</p>
                      <p className="text-xs text-zinc-500">{user.email}</p>
                      <span className="text-xs font-medium text-accent-500 bg-accent-50 px-2 py-0.5 rounded-full">Super Admin</span>
                      <p className="text-xs text-zinc-400 mt-1">JPG, PNG or WEBP · max 2MB</p>
                    </div>
                  </div>
                  <Field label="Full Name *">
                    <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
                  </Field>
                  <Field label="Phone Number">
                    <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 1234567" />
                  </Field>
                  <button type="button" disabled={isPending}
                    onClick={() => run(() => updatePersonalInfo({ name, phone: phone || undefined, image: image || undefined }))}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                    {isPending ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </Section>

              <Section title="Change Email" description="Send a verification link to a new email address.">
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                    <p className="text-xs text-zinc-500">Current email</p>
                    <p className="text-sm font-medium text-zinc-800">{user.email}</p>
                  </div>
                  <Field label="New Email Address">
                    <input type="email" className={inputCls} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="new@email.com" />
                  </Field>
                  <button type="button" disabled={isPending || !newEmail.includes("@")}
                    onClick={() => run(() => requestEmailChange(newEmail))}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                    {isPending ? "Sending…" : "Send Verification Link"}
                  </button>
                </div>
              </Section>
            </>
          )}

          {/* ── Security ── */}
          {activeTab === "security" && (
            <>
              <Section title="Change Password">
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

              <Section title="Two-Factor Authentication" description="Add an extra layer of security to your account.">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-800">Two-Factor Authentication</p>
                    <p className="text-xs text-zinc-500">Currently {user.twoFactorEnabled ? "enabled" : "disabled"}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-zinc-100 text-zinc-500">Coming Soon</span>
                </div>
              </Section>

              <Section title="Security & Access" description="Account access details.">
                <div className="space-y-3">
                  {[
                    { label: "Email Verified", value: user.emailVerified ? "Yes" : "No", ok: !!user.emailVerified },
                    { label: "Role", value: "Super Admin", ok: true },
                    { label: "Member Since", value: new Date(user.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "long" }), ok: true },
                  ].map(({ label, value, ok }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                      <span className="text-sm text-zinc-700">{label}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ok ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </Section>
            </>
          )}

          {/* ── Notifications ── */}
          {activeTab === "notifications" && (
            <Section title="Notification Settings" description="Configure which admin alerts you receive.">
              <div className="space-y-4">
                {[
                  { key: "newVendors", label: "New Vendor Applications", description: "When a new vendor registers and needs approval" },
                  { key: "newOrders", label: "New Orders", description: "When orders are placed on the platform" },
                  { key: "refunds", label: "Refund Requests", description: "New refund requests requiring review" },
                  { key: "withdrawals", label: "Withdrawal Requests", description: "New vendor withdrawal requests" },
                  { key: "reviews", label: "Flagged Reviews", description: "Reviews flagged for moderation" },
                  { key: "security", label: "Security Alerts", description: "Suspicious login activity" },
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
                  onClick={() => run(() => saveAdminNotificationPreferences(notifPrefs))}
                  className="mt-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                  {isPending ? "Saving…" : "Save Preferences"}
                </button>
              </div>
            </Section>
          )}

          {/* ── System ── */}
          {activeTab === "system" && (
            <Section title="System Preferences" description="Core platform configuration.">
              <div className="space-y-4">
                <Field label="Site Name">
                  <input className={inputCls} value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="ZainStore.pk" />
                </Field>
                <Field label="Support Email">
                  <input type="email" className={inputCls} value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} placeholder="support@zainstore.pk" />
                </Field>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-800">Maintenance Mode</p>
                    <p className="text-xs text-zinc-500">Takes the platform offline for all non-admin users</p>
                  </div>
                  <Toggle checked={maintenanceMode} onChange={setMaintenanceMode} />
                </div>
                <button type="button" disabled={isPending}
                  onClick={() => run(() => savePlatformSettings({
                    "system.site_name": { value: siteName, group: "system", description: "Platform display name" },
                    "system.maintenance_mode": { value: maintenanceMode, group: "system", description: "Put platform in maintenance mode" },
                    "system.support_email": { value: supportEmail, group: "system", description: "Support contact email" },
                  }))}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                  {isPending ? "Saving…" : "Save System Settings"}
                </button>
              </div>
            </Section>
          )}

          {/* ── Commission ── */}
          {activeTab === "commission" && (
            <Section title="Commission Settings" description="Default commission rates applied to vendor sales.">
              <div className="space-y-4">
                <Field label="Default Commission Rate (%)">
                  <input type="number" className={inputCls} value={defaultCommissionRate} onChange={(e) => setDefaultCommissionRate(e.target.value)} min="0" max="100" step="0.1" />
                  <p className="text-xs text-zinc-400 mt-1">Applied to vendors without a custom commission rate.</p>
                </Field>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-800">Commission on Shipping</p>
                    <p className="text-xs text-zinc-500">Include shipping cost in commission calculation</p>
                  </div>
                  <Toggle checked={commissionOnShipping} onChange={setCommissionOnShipping} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-800">Commission on Tax</p>
                    <p className="text-xs text-zinc-500">Include tax amount in commission calculation</p>
                  </div>
                  <Toggle checked={commissionOnTax} onChange={setCommissionOnTax} />
                </div>
                <button type="button" disabled={isPending}
                  onClick={() => run(() => savePlatformSettings({
                    "commission.default_rate": { value: Number(defaultCommissionRate), group: "commission", description: "Default vendor commission %" },
                    "commission.on_shipping": { value: commissionOnShipping, group: "commission", description: "Include shipping in commission" },
                    "commission.on_tax": { value: commissionOnTax, group: "commission", description: "Include tax in commission" },
                  }))}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                  {isPending ? "Saving…" : "Save Commission Settings"}
                </button>
              </div>
            </Section>
          )}

          {/* ── Financial ── */}
          {activeTab === "financial" && (
            <Section title="Tax & Currency Settings" description="Configure platform-wide tax and currency.">
              <div className="space-y-4">
                <Field label="Currency">
                  <select className={inputCls} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    <option value="PKR">PKR — Pakistani Rupee</option>
                    <option value="USD">USD — US Dollar</option>
                  </select>
                </Field>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-800">Platform Tax</p>
                    <p className="text-xs text-zinc-500">Apply tax to product prices</p>
                  </div>
                  <Toggle checked={taxEnabled} onChange={setTaxEnabled} />
                </div>
                {taxEnabled && (
                  <Field label="Default Tax Rate (%)">
                    <input type="number" className={inputCls} value={taxRate} onChange={(e) => setTaxRate(e.target.value)} min="0" max="100" step="0.1" placeholder="17" />
                    <p className="text-xs text-zinc-400 mt-1">Pakistan standard GST is 17%.</p>
                  </Field>
                )}
                <button type="button" disabled={isPending}
                  onClick={() => run(() => savePlatformSettings({
                    "financial.currency": { value: currency, group: "financial", description: "Platform currency code" },
                    "financial.tax_enabled": { value: taxEnabled, group: "financial", description: "Enable platform tax" },
                    "financial.tax_rate": { value: Number(taxRate), group: "financial", description: "Default tax rate %" },
                  }))}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                  {isPending ? "Saving…" : "Save Financial Settings"}
                </button>
              </div>
            </Section>
          )}

          {/* ── Payment Gateway ── */}
          {activeTab === "payment" && (
            <Section title="Payment Gateway Settings" description="Configure available payment methods for the platform.">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-800">Cash on Delivery (COD)</p>
                    <p className="text-xs text-zinc-500">Allow customers to pay on delivery</p>
                  </div>
                  <Toggle checked={codEnabled} onChange={setCodEnabled} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-800">Online Payments</p>
                    <p className="text-xs text-zinc-500">JazzCash, EasyPaisa, card payments</p>
                  </div>
                  <Toggle checked={onlinePaymentEnabled} onChange={setOnlinePaymentEnabled} />
                </div>
                <Field label="Minimum Withdrawal Amount (PKR)">
                  <input type="number" className={inputCls} value={minWithdrawal} onChange={(e) => setMinWithdrawal(e.target.value)} min="0" />
                  <p className="text-xs text-zinc-400 mt-1">Minimum balance required before a vendor can request a withdrawal.</p>
                </Field>
                <button type="button" disabled={isPending}
                  onClick={() => run(() => savePlatformSettings({
                    "payment.cod_enabled": { value: codEnabled, group: "payment", description: "Enable cash on delivery" },
                    "payment.online_enabled": { value: onlinePaymentEnabled, group: "payment", description: "Enable online payment gateway" },
                    "payment.min_withdrawal": { value: Number(minWithdrawal), group: "payment", description: "Minimum vendor withdrawal amount" },
                  }))}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                  {isPending ? "Saving…" : "Save Payment Settings"}
                </button>
              </div>
            </Section>
          )}

          {/* ── Activity Logs ── */}
          {activeTab === "activity" && (
            <Section title="Activity Logs" description="Recent admin actions recorded in the system.">
              {activityLogs.length === 0 ? (
                <p className="text-sm text-zinc-400 py-4 text-center">No activity recorded yet.</p>
              ) : (
                <div className="divide-y divide-zinc-50">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-800">
                          {log.action}{" "}
                          <span className="font-normal text-zinc-500">{log.entity}</span>
                          {log.entityId && <span className="text-xs text-zinc-400"> #{log.entityId.slice(0, 8)}</span>}
                        </p>
                        {log.ipAddress && <p className="text-xs text-zinc-400 mt-0.5">IP: {log.ipAddress}</p>}
                      </div>
                      <p className="shrink-0 text-xs text-zinc-400">
                        {new Date(log.createdAt).toLocaleDateString("en-PK", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}

        </main>
      </div>
    </div>
  );
}
