import Image from "next/image";
import Link from "next/link";
import { Store } from "lucide-react";

import { formatCurrency } from "@/lib/format";

type ProductCardProps = {
  product: {
    name: string;
    slug: string;
    description: string;
    price: { toString(): string } | string | number;
    compareAt?: { toString(): string } | string | number | null;
    vendor: { storeName: string; slug: string };
    images: { url: string; alt: string | null }[];
  };
};

export function ProductCard({ product }: ProductCardProps) {
  const image = product.images[0];

  return (
    <article className="overflow-hidden rounded-md border border-[var(--line)] bg-white">
      <Link className="block" href={`/products/${product.slug}`}>
        <div className="relative aspect-[4/3] bg-[#ece7dc]">
          {image ? (
            <Image
              alt={image.alt ?? product.name}
              className="object-cover"
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              src={image.url}
            />
          ) : null}
        </div>
      </Link>
      <div className="space-y-3 p-4">
        <div>
          <Link className="line-clamp-1 font-semibold" href={`/products/${product.slug}`}>
            {product.name}
          </Link>
          <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{product.description}</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-bold">{formatCurrency(product.price.toString())}</p>
            {product.compareAt ? (
              <p className="text-xs text-[var(--muted)] line-through">
                {formatCurrency(product.compareAt.toString())}
              </p>
            ) : null}
          </div>
          <Link className="flex items-center gap-1 rounded-md bg-[#ecfdf5] px-2 py-1 text-xs font-medium text-[var(--brand-strong)]" href={`/vendors/${product.vendor.slug}`}>
            <Store size={13} aria-hidden />
            {product.vendor.storeName}
          </Link>
        </div>
      </div>
    </article>
  );
}
