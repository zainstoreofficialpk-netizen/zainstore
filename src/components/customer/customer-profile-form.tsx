"use client";

import { useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Camera, Save, KeyRound, Mail, MapPin, User } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  updatePersonalInfo,
  requestEmailChange,
  changePassword,
  updateCustomerAddress,
} from "@/lib/profile/actions";

type Address = {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postalCode: string | null;
} | null;

type CustomerProfileData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  primaryAddress: Address;
};

function passwordStrength(pw: string) {
  const score = [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
  return {
    score,
    label: ["", "Weak", "Weak", "Fair", "Strong"][score] ?? "",
    color: ["", "bg-rose-500", "bg-rose-500", "bg-amber-400", "bg-emerald-500"][score] ?? "",
  };
}

export function CustomerProfileForm({ user }: { user: CustomerProfileData }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Personal info
  const [info, setInfo] = useState({ name: user.name, phone: user.phone ?? "", image: user.image ?? "" });
  const [infoP, startInfoP] = useTransition();

  // Email change
  const [newEmail, setNewEmail] = useState("");
  const [emailP, startEmailP] = useTransition();

  // Password change
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwP, startPwP] = useTransition();
  const pwStrength = passwordStrength(pwForm.next);

  // Address
  const addr = user.primaryAddress;
  const [addrForm, setAddrForm] = useState({
    label: addr?.label ?? "Home",
    line1: addr?.line1 ?? "",
    line2: addr?.line2 ?? "",
    city: addr?.city ?? "",
    region: addr?.region ?? "",
    postalCode: addr?.postalCode ?? "",
  });
  const [addrP, startAddrP] = useTransition();

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Please select a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setInfo(f => ({ ...f, image: ev.target?.result as string }));
      toast.success("Photo selected — click Save to apply.");
    };
    reader.readAsDataURL(file);
  }

  function saveInfo(e: React.FormEvent) {
    e.preventDefault();
    startInfoP(async () => {
      const res = await updatePersonalInfo(info);
      if (res.success) toast.success(res.message);
      else toast.error(res.error);
    });
  }

  function requestEmail(e: React.FormEvent) {
    e.preventDefault();
    startEmailP(async () => {
      const res = await requestEmailChange(newEmail);
      if (res.success) { toast.success(res.message); setNewEmail(""); }
      else toast.error(res.error);
    });
  }

  function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { toast.error("Passwords do not match."); return; }
    startPwP(async () => {
      const res = await changePassword(pwForm.current, pwForm.next);
      if (res.success) { toast.success(res.message); setPwForm({ current: "", next: "", confirm: "" }); }
      else toast.error(res.error);
    });
  }

  function saveAddress(e: React.FormEvent) {
    e.preventDefault();
    startAddrP(async () => {
      const res = await updateCustomerAddress(addr?.id ?? null, addrForm);
      if (res.success) toast.success(res.message);
      else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Header card */}
      <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="relative">
          <Avatar name={user.name} image={info.image || null} size="xl" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-brand-500 hover:bg-brand-600 flex items-center justify-center shadow-sm border-2 border-white"
          >
            <Camera className="w-3.5 h-3.5 text-white" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoSelect} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-zinc-900">{user.name}</h3>
          <p className="text-sm text-zinc-500">{user.email}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge tone="muted">Customer</Badge>
            {user.emailVerified
              ? <span className="text-xs text-emerald-600 font-medium">✓ Email verified</span>
              : <span className="text-xs text-amber-500">Email unverified</span>
            }
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="w-4 h-4" /> Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveInfo} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-zinc-600 mb-1.5 block">Full Name <span className="text-rose-500">*</span></label>
                <Input required value={info.name} onChange={e => setInfo(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 mb-1.5 block">Phone Number</label>
                <Input value={info.phone} onChange={e => setInfo(f => ({ ...f, phone: e.target.value }))} placeholder="0300-1234567" type="tel" />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={infoP} className="flex items-center gap-2 px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-xl disabled:opacity-60">
                {infoP ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {infoP ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Primary Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Primary Shipping Address</CardTitle>
          <p className="text-xs text-zinc-400 mt-0.5">Used as your default delivery address at checkout</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveAddress} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-zinc-600 mb-1.5 block">Label</label>
                <Input value={addrForm.label} onChange={e => setAddrForm(f => ({ ...f, label: e.target.value }))} placeholder="Home / Office" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 mb-1.5 block">City <span className="text-rose-500">*</span></label>
                <Input required value={addrForm.city} onChange={e => setAddrForm(f => ({ ...f, city: e.target.value }))} placeholder="Karachi" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600 mb-1.5 block">Address Line 1 <span className="text-rose-500">*</span></label>
              <Input required value={addrForm.line1} onChange={e => setAddrForm(f => ({ ...f, line1: e.target.value }))} placeholder="House 12, Street 4, DHA Phase 6" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600 mb-1.5 block">Address Line 2</label>
              <Input value={addrForm.line2} onChange={e => setAddrForm(f => ({ ...f, line2: e.target.value }))} placeholder="Near mosque, opposite petrol pump (optional)" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-zinc-600 mb-1.5 block">Province</label>
                <Input value={addrForm.region} onChange={e => setAddrForm(f => ({ ...f, region: e.target.value }))} placeholder="Sindh" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 mb-1.5 block">Postal Code</label>
                <Input value={addrForm.postalCode} onChange={e => setAddrForm(f => ({ ...f, postalCode: e.target.value }))} placeholder="75500" />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={addrP} className="flex items-center gap-2 px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-xl disabled:opacity-60">
                {addrP ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {addrP ? "Saving…" : "Save Address"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="w-4 h-4" /> Change Email Address</CardTitle>
          <p className="text-xs text-zinc-400 mt-0.5">Current: <span className="font-medium text-zinc-600">{user.email}</span> — a verification link will be sent to your new email</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={requestEmail} className="flex gap-3">
            <Input
              type="email"
              required
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="new@email.com"
              className="flex-1"
            />
            <button type="submit" disabled={emailP} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-900 text-white text-sm font-bold rounded-xl disabled:opacity-60 whitespace-nowrap">
              {emailP ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Verification"}
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="w-4 h-4" /> Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={savePassword} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-600 mb-1.5 block">Current Password</label>
              <Input type="password" required value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} placeholder="••••••••" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600 mb-1.5 block">New Password</label>
              <Input type="password" required value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} placeholder="••••••••" />
              {pwForm.next && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${pwStrength.color}`} style={{ width: `${pwStrength.score * 25}%` }} />
                  </div>
                  <span className="text-xs text-zinc-500">{pwStrength.label}</span>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600 mb-1.5 block">Confirm New Password</label>
              <Input type="password" required value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} placeholder="••••••••" />
              {pwForm.confirm && pwForm.next !== pwForm.confirm && (
                <p className="text-xs text-rose-500 mt-1">Passwords do not match</p>
              )}
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={pwP} className="flex items-center gap-2 px-5 py-2 bg-zinc-800 hover:bg-zinc-900 text-white text-sm font-bold rounded-xl disabled:opacity-60">
                {pwP ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                {pwP ? "Updating…" : "Update Password"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

    </div>
  );
}
