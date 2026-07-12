"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type VariantData = {
  id: string;
  name: string;
  sku: string | null;
  options: Record<string, string>;
  price: number | null;
  salePrice: number | null;
  stock: number;
  stockStatus: string;
  imageUrl: string | null;
  isActive: boolean;
};

type ProductVariantContextValue = {
  variants: VariantData[];
  attributes: { name: string; values: string[] }[];
  selectedOptions: Record<string, string>;
  setOption: (name: string, value: string) => void;
  selectedVariant: VariantData | null;
  /** true only when this product actually has variants (context is "live") */
  hasVariants: boolean;
};

const ProductVariantContext = createContext<ProductVariantContextValue | null>(null);

export function ProductVariantProvider({
  variants,
  children,
}: {
  variants: VariantData[];
  children: React.ReactNode;
}) {
  const activeVariants = useMemo(() => variants.filter((v) => v.isActive), [variants]);

  // Derive attribute groups (e.g. Color: [Red, Blue], Size: [S, M, L]) from variant options
  const attributes = useMemo(() => {
    const groups = new Map<string, Set<string>>();
    for (const v of activeVariants) {
      for (const [key, value] of Object.entries(v.options ?? {})) {
        if (!groups.has(key)) groups.set(key, new Set());
        groups.get(key)!.add(value);
      }
    }
    return Array.from(groups.entries()).map(([name, values]) => ({ name, values: Array.from(values) }));
  }, [activeVariants]);

  // Default selection: first variant's options, if any exist
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    return activeVariants[0]?.options ?? {};
  });

  function setOption(name: string, value: string) {
    setSelectedOptions((prev) => ({ ...prev, [name]: value }));
  }

  const selectedVariant = useMemo(() => {
    if (activeVariants.length === 0) return null;
    return (
      activeVariants.find((v) =>
        attributes.every((attr) => v.options?.[attr.name] === selectedOptions[attr.name])
      ) ?? null
    );
  }, [activeVariants, attributes, selectedOptions]);

  return (
    <ProductVariantContext.Provider
      value={{
        variants: activeVariants,
        attributes,
        selectedOptions,
        setOption,
        selectedVariant,
        hasVariants: activeVariants.length > 0,
      }}
    >
      {children}
    </ProductVariantContext.Provider>
  );
}

const EMPTY: ProductVariantContextValue = {
  variants: [],
  attributes: [],
  selectedOptions: {},
  setOption: () => {},
  selectedVariant: null,
  hasVariants: false,
};

/** Safe to call even outside a Provider (e.g. non-variant product pages) — returns an empty/no-op default. */
export function useProductVariant(): ProductVariantContextValue {
  const ctx = useContext(ProductVariantContext);
  return ctx ?? EMPTY;
}
