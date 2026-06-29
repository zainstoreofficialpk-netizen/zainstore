"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { ProductCard, type ProductCardData } from "./product-card";

type Variant = "new-arrivals" | "popular";

const VARIANT_CONFIG: Record<Variant, { Icon: React.ElementType; iconBg: string }> = {
  "new-arrivals": { Icon: Sparkles,   iconBg: "bg-brand-50 text-brand-500"  },
  "popular":      { Icon: TrendingUp, iconBg: "bg-violet-50 text-violet-600" },
};

type Props = {
  title: string;
  subtitle: string;
  variant: Variant;
  products: ProductCardData[];
  seeAllHref: string;
};

export function ProductStripSection({ title, subtitle, variant, products, seeAllHref }: Props) {
  if (products.length === 0) return null;

  const { Icon, iconBg } = VARIANT_CONFIG[variant];

  return (
    <section className="container mx-auto px-4 max-w-7xl py-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-0.5">
              {subtitle}
            </p>
            <h2 className="text-xl font-black text-zinc-900 leading-none">{title}</h2>
          </div>
        </div>
        <Link
          href={seeAllHref}
          className="flex items-center gap-1.5 text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors shrink-0"
        >
          See all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* 2 rows × 6 cols grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {products.slice(0, 12).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
