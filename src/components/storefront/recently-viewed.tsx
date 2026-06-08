"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";

type RecentItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  imageUrl: string | null;
  viewedAt: number;
};

const STORAGE_KEY = "zainstore-recently-viewed";
const MAX_ITEMS = 8;

export function useRecentlyViewed() {
  function add(item: Omit<RecentItem, "viewedAt">) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const existing: RecentItem[] = raw ? JSON.parse(raw) : [];
      const filtered = existing.filter((i) => i.id !== item.id);
      const updated = [{ ...item, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  }

  function getAll(): RecentItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  return { add, getAll };
}

export function RecentlyViewedTracker(props: Omit<RecentItem, "viewedAt">) {
  const { add } = useRecentlyViewed();
  useEffect(() => {
    add(props);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.id]);
  return null;
}

export function RecentlyViewedList({ currentId }: { currentId: string }) {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const all: RecentItem[] = raw ? JSON.parse(raw) : [];
      setItems(all.filter((i) => i.id !== currentId).slice(0, 6));
    } catch {}
  }, [currentId]);

  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="text-base font-black text-zinc-900 mb-4">Recently Viewed</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {items.map((item) => {
          const displayPrice = item.salePrice ?? item.price;
          return (
            <Link
              key={item.id}
              href={`/shop/product/${item.slug}`}
              className="group block bg-white rounded-xl border border-zinc-100 hover:border-brand-200 hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              <div className="aspect-square bg-zinc-50 overflow-hidden">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-100">
                    <span className="text-xl font-black text-zinc-300">{item.name[0]}</span>
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-[11px] font-semibold text-zinc-700 line-clamp-2 leading-snug mb-1">
                  {item.name}
                </p>
                <p className="text-xs font-black text-zinc-900">{formatCurrency(displayPrice)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
