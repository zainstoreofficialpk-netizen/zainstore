"use client";

import { useState } from "react";
import { Package, Truck, FileText } from "lucide-react";

type Tab = "description" | "specs" | "shipping";

export function ProductDetailTabs({
  description,
  weight,
  length,
  width,
  height,
  shippingType,
  sku,
}: {
  description: string | null;
  weight: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  shippingType: string;
  sku: string | null;
}) {
  const [tab, setTab] = useState<Tab>("description");

  const tabs: { id: Tab; label: string; icon: typeof FileText }[] = [
    { id: "description", label: "Description", icon: FileText },
    { id: "specs", label: "Specifications", icon: Package },
    { id: "shipping", label: "Shipping & Returns", icon: Truck },
  ];

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
      {/* Tab nav */}
      <div className="flex border-b border-zinc-100">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold transition-all duration-150 ${
              tab === id
                ? "text-brand-600 border-b-2 border-brand-500 bg-brand-50/50"
                : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0 hidden sm:block" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-5 md:p-6 min-h-[160px]">
        {tab === "description" && (
          <div>
            {description ? (
              <div
                className="prose prose-sm max-w-none text-zinc-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: description.replace(/\n/g, "<br/>") }}
              />
            ) : (
              <p className="text-zinc-400 text-sm italic">No description available for this product.</p>
            )}
          </div>
        )}

        {tab === "specs" && (
          <div>
            {weight || length || width || height || sku ? (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-zinc-50">
                  {sku && (
                    <SpecRow label="SKU / Model" value={sku} />
                  )}
                  {weight && (
                    <SpecRow label="Weight" value={`${weight} kg`} />
                  )}
                  {(length || width || height) && (
                    <SpecRow
                      label="Dimensions (L × W × H)"
                      value={[length, width, height].filter(Boolean).join(" × ") + " cm"}
                    />
                  )}
                </tbody>
              </table>
            ) : (
              <p className="text-zinc-400 text-sm italic">No specifications available for this product.</p>
            )}
          </div>
        )}

        {tab === "shipping" && (
          <div className="space-y-4 text-sm text-zinc-600">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
              <Truck className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-green-800 mb-0.5">Delivery</p>
                <p>
                  {shippingType === "FREE"
                    ? "Free delivery on this item. Estimated 3-5 business days."
                    : shippingType === "STANDARD"
                    ? "Standard delivery: PKR 150. Estimated 3-5 business days."
                    : shippingType === "EXPRESS"
                    ? "Express delivery available. Estimated 1-2 business days."
                    : "Shipping charges apply. Contact seller for details."}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-zinc-600">
              <p className="font-semibold text-zinc-800">Return Policy</p>
              <ul className="space-y-1.5 list-none">
                {[
                  "7-day easy return on all eligible products",
                  "Item must be unused and in original packaging",
                  "Refund processed within 3-5 business days",
                  "Contact seller or ZainStore support to initiate return",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-green-500 font-bold shrink-0 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="hover:bg-zinc-50 transition-colors">
      <td className="py-2.5 pr-4 text-zinc-500 font-medium w-1/3">{label}</td>
      <td className="py-2.5 text-zinc-800">{value}</td>
    </tr>
  );
}
