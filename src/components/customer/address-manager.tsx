"use client";

import { useState, useTransition } from "react";
import { MapPin, Plus, Pencil, Trash2, X, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createAddressAction, updateAddressAction, deleteAddressAction, type AddressInput } from "@/lib/customer/address-actions";

type Address = {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postalCode: string | null;
  country: string;
};

const EMPTY: AddressInput = { label: "", line1: "", line2: "", city: "", region: "", postalCode: "", country: "Pakistan" };

function AddressForm({ initial, onCancel, onSaved }: { initial: AddressInput; onCancel: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<AddressInput>(initial);
  const [isPending, start] = useTransition();

  function set(k: keyof AddressInput, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function handleSave(id?: string) {
    start(async () => {
      const r = id ? await updateAddressAction(id, form) : await createAddressAction(form);
      if (r.success) { toast.success(r.message); onSaved(); }
      else toast.error(r.error);
    });
  }

  const id = (initial as Address & AddressInput).id;

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-zinc-600 mb-1 block">Label (e.g. Home, Office)</label>
          <input value={form.label ?? ""} onChange={e => set("label", e.target.value)} placeholder="Home" className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400" />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-600 mb-1 block">City <span className="text-rose-500">*</span></label>
          <input value={form.city} onChange={e => set("city", e.target.value)} placeholder="Lahore" className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-zinc-600 mb-1 block">Address Line 1 <span className="text-rose-500">*</span></label>
        <input value={form.line1} onChange={e => set("line1", e.target.value)} placeholder="House No, Street, Area" className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400" />
      </div>
      <div>
        <label className="text-xs font-medium text-zinc-600 mb-1 block">Address Line 2 (optional)</label>
        <input value={form.line2 ?? ""} onChange={e => set("line2", e.target.value)} placeholder="Landmark, Near..." className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-zinc-600 mb-1 block">Province</label>
          <input value={form.region ?? ""} onChange={e => set("region", e.target.value)} placeholder="Punjab" className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400" />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-600 mb-1 block">Postal Code</label>
          <input value={form.postalCode ?? ""} onChange={e => set("postalCode", e.target.value)} placeholder="54000" className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400" />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={() => handleSave(id)} disabled={isPending} className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg disabled:opacity-60">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {id ? "Update" : "Save Address"}
        </button>
        <button onClick={onCancel} className="flex items-center gap-1.5 px-4 py-2 border border-zinc-200 text-zinc-600 text-sm font-medium rounded-lg hover:bg-zinc-100">
          <X className="w-4 h-4" /> Cancel
        </button>
      </div>
    </div>
  );
}

export function AddressManager({ addresses: initial }: { addresses: Address[] }) {
  const [addresses, setAddresses] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  function handleDelete(id: string) {
    setDeletingId(id);
    start(async () => {
      const r = await deleteAddressAction(id);
      if (r.success) {
        setAddresses(a => a.filter(x => x.id !== id));
        toast.success(r.message);
      } else {
        toast.error(r.error);
      }
      setDeletingId(null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">{addresses.length} saved address{addresses.length !== 1 ? "es" : ""}</p>
        {!adding && (
          <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg">
            <Plus className="w-4 h-4" /> Add Address
          </button>
        )}
      </div>

      {adding && (
        <AddressForm
          initial={EMPTY}
          onCancel={() => setAdding(false)}
          onSaved={() => { setAdding(false); window.location.reload(); }}
        />
      )}

      {addresses.length === 0 && !adding && (
        <div className="rounded-xl border-2 border-dashed border-zinc-200 py-16 text-center">
          <MapPin className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-zinc-500">No saved addresses</p>
          <p className="text-xs text-zinc-400 mt-1">Add an address to speed up checkout</p>
          <button onClick={() => setAdding(true)} className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-brand-500 text-white text-sm font-semibold rounded-lg mx-auto hover:bg-brand-600">
            <Plus className="w-4 h-4" /> Add First Address
          </button>
        </div>
      )}

      <div className="space-y-3">
        {addresses.map(addr => (
          <div key={addr.id}>
            {editingId === addr.id ? (
              <AddressForm
                initial={{ ...addr, label: addr.label ?? "", line2: addr.line2 ?? "", region: addr.region ?? "", postalCode: addr.postalCode ?? "" }}
                onCancel={() => setEditingId(null)}
                onSaved={() => { setEditingId(null); window.location.reload(); }}
              />
            ) : (
              <div className="rounded-xl border border-zinc-200 bg-white p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5 text-brand-500" />
                </div>
                <div className="flex-1 min-w-0">
                  {addr.label && <p className="text-xs font-bold text-brand-600 uppercase tracking-wide mb-0.5">{addr.label}</p>}
                  <p className="text-sm font-semibold text-zinc-900">{addr.line1}</p>
                  {addr.line2 && <p className="text-sm text-zinc-500">{addr.line2}</p>}
                  <p className="text-sm text-zinc-500">{[addr.city, addr.region, addr.postalCode].filter(Boolean).join(", ")}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{addr.country}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setEditingId(addr.id)} className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(addr.id)} disabled={isPending && deletingId === addr.id} className="p-2 rounded-lg hover:bg-rose-50 text-zinc-400 hover:text-rose-500 disabled:opacity-40">
                    {isPending && deletingId === addr.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
