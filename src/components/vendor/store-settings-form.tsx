"use client";

import { useState, useTransition } from "react";
import { Save, Loader2, Store, Globe, FileText, Moon } from "lucide-react";
import { toast } from "sonner";
import { updateStoreSettingsAction, type StoreSettingsInput } from "@/lib/vendor/store-actions";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StoreSettingsForm({ store }: { store: StoreSettingsInput & { slug: string } }) {
  const [form, setForm] = useState<StoreSettingsInput>({
    name: store.name,
    description: store.description ?? "",
    logoUrl: store.logoUrl ?? "",
    bannerUrl: store.bannerUrl ?? "",
    address: store.address ?? "",
    phone: store.phone ?? "",
    email: store.email ?? "",
    seoTitle: store.seoTitle ?? "",
    seoDescription: store.seoDescription ?? "",
    returnPolicy: store.returnPolicy ?? "",
    shippingPolicy: store.shippingPolicy ?? "",
    vacationMode: store.vacationMode ?? false,
  });
  const [isPending, start] = useTransition();

  function set(k: keyof StoreSettingsInput, v: string | boolean) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function handleSave() {
    start(async () => {
      const r = await updateStoreSettingsAction(form);
      if (r.success) toast.success(r.message);
      else toast.error(r.error);
    });
  }

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Vacation Mode Banner */}
      {form.vacationMode && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <Moon className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Vacation Mode is ON</p>
            <p className="text-xs text-amber-700">Your store is hidden from the storefront. Turn it off to go live again.</p>
          </div>
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Store className="w-4 h-4" /> Store Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-zinc-600 mb-1.5 block">Store Name <span className="text-rose-500">*</span></label>
              <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="My Awesome Store" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600 mb-1.5 block">Store URL</label>
              <div className="flex items-center h-9 px-3 border border-zinc-200 rounded-lg bg-zinc-50 text-sm text-zinc-400">
                zainstore.pk/shop/store/{store.slug}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600 mb-1.5 block">Store Description</label>
            <textarea
              value={form.description ?? ""}
              onChange={e => set("description", e.target.value)}
              rows={3}
              placeholder="Tell customers what you sell and why they should choose your store..."
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-zinc-600 mb-1.5 block">Phone</label>
              <Input value={form.phone ?? ""} onChange={e => set("phone", e.target.value)} placeholder="0300-1234567" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600 mb-1.5 block">Email</label>
              <Input value={form.email ?? ""} onChange={e => set("email", e.target.value)} placeholder="store@email.com" type="email" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600 mb-1.5 block">Store Address / City</label>
            <Input value={form.address ?? ""} onChange={e => set("address", e.target.value)} placeholder="Lahore, Punjab" />
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader><CardTitle>Store Logo</CardTitle></CardHeader>
        <CardContent>
          <div>
            <label className="text-xs font-medium text-zinc-600 mb-1.5 block">Logo URL</label>
            <Input value={form.logoUrl ?? ""} onChange={e => set("logoUrl", e.target.value)} placeholder="https://..." />
            {form.logoUrl && (
              <img src={form.logoUrl} alt="Logo preview" className="mt-2 w-16 h-16 rounded-xl object-cover border border-zinc-200" onError={e => (e.currentTarget.style.display = "none")} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* SEO */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="w-4 h-4" /> SEO Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-600 mb-1.5 block">SEO Title</label>
            <Input value={form.seoTitle ?? ""} onChange={e => set("seoTitle", e.target.value)} placeholder="Best online store for..." maxLength={60} />
            <p className="text-xs text-zinc-400 mt-1">{(form.seoTitle ?? "").length}/60 characters</p>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600 mb-1.5 block">SEO Description</label>
            <textarea
              value={form.seoDescription ?? ""}
              onChange={e => set("seoDescription", e.target.value)}
              rows={2}
              maxLength={160}
              placeholder="A brief description for search engines..."
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
            <p className="text-xs text-zinc-400">{(form.seoDescription ?? "").length}/160 characters</p>
          </div>
        </CardContent>
      </Card>

      {/* Policies */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-4 h-4" /> Store Policies</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-600 mb-1.5 block">Return Policy</label>
            <textarea
              value={form.returnPolicy ?? ""}
              onChange={e => set("returnPolicy", e.target.value)}
              rows={3}
              placeholder="Describe your return/exchange policy..."
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600 mb-1.5 block">Shipping Policy</label>
            <textarea
              value={form.shippingPolicy ?? ""}
              onChange={e => set("shippingPolicy", e.target.value)}
              rows={3}
              placeholder="Describe your shipping details and timelines..."
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vacation Mode */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Moon className="w-4 h-4" /> Vacation Mode</CardTitle></CardHeader>
        <CardContent>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => set("vacationMode", !form.vacationMode)}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.vacationMode ? "bg-amber-500" : "bg-zinc-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.vacationMode ? "translate-x-5" : "translate-x-0"}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-800">Temporarily close your store</p>
              <p className="text-xs text-zinc-400">Your store will be hidden from customers while vacation mode is on</p>
            </div>
          </label>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={isPending} className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-xl disabled:opacity-60">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isPending ? "Saving…" : "Save Store Settings"}
        </button>
      </div>
    </div>
  );
}
