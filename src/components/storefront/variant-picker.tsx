"use client";

import { Check } from "lucide-react";
import { useProductVariant } from "./product-variant-context";

export function VariantPicker() {
  const { attributes, selectedOptions, setOption, variants, selectedVariant, hasVariants } = useProductVariant();

  if (!hasVariants || attributes.length === 0) return null;

  // For a given attribute value, is there at least one active variant that has
  // this value AND matches all *other currently selected* options?
  function isValueAvailable(attrName: string, value: string) {
    return variants.some((v) => {
      if (v.options?.[attrName] !== value) return false;
      return attributes
        .filter((a) => a.name !== attrName)
        .every((a) => v.options?.[a.name] === selectedOptions[a.name]);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {attributes.map((attr) => (
        <div key={attr.name}>
          <p className="mb-2 text-sm font-semibold text-zinc-700">
            {attr.name}
            {selectedOptions[attr.name] && (
              <span className="ml-1.5 font-normal text-zinc-400">— {selectedOptions[attr.name]}</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {attr.values.map((value) => {
              const active = selectedOptions[attr.name] === value;
              const available = isValueAvailable(attr.name, value);
              return (
                <button
                  key={value}
                  type="button"
                  disabled={!available}
                  onClick={() => setOption(attr.name, value)}
                  className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors
                    ${active
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : available
                      ? "border-zinc-200 text-zinc-700 hover:border-zinc-400"
                      : "cursor-not-allowed border-zinc-100 text-zinc-300 line-through"}`}
                >
                  {active && <Check className="h-3 w-3" />}
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {!selectedVariant && (
        <p className="text-xs font-medium text-amber-600">
          This exact combination isn&apos;t available. Please choose a different option.
        </p>
      )}
    </div>
  );
}
