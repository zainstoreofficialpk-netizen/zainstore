"use client";

import { useState } from "react";
import { ShoppingBag, ChevronRight } from "lucide-react";

import { ReviewForm } from "@/components/customer/review-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { getReviewableOrderItems } from "@/lib/customer/review-actions";

type Item = Awaited<ReturnType<typeof getReviewableOrderItems>>[number];

export function PendingReviewsPanel({ items }: { items: Item[] }) {
  const [writing, setWriting] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        if (writing === item.id) {
          return (
            <ReviewForm
              key={item.id}
              mode="submit"
              orderItem={{
                id: item.id,
                product: item.product,
                order: item.order,
              }}
              onDone={() => setWriting(null)}
            />
          );
        }

        return (
          <Card key={item.id} className="border-brand-100 bg-brand-50/30">
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                {item.product.images[0]?.url ? (
                  <img
                    src={item.product.images[0].url}
                    alt={item.product.name}
                    className="size-12 rounded-md object-cover border border-zinc-200"
                  />
                ) : (
                  <div className="grid size-12 place-items-center rounded-md bg-zinc-100">
                    <ShoppingBag size={18} className="text-zinc-400" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-zinc-900">{item.product.name}</p>
                  <p className="text-xs text-zinc-400">
                    Order #{item.order.orderNumber}
                    {item.order.deliveredAt && (
                      <> · Delivered {new Date(item.order.deliveredAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}</>
                    )}
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={() => setWriting(item.id)} className="gap-1 shrink-0">
                Write Review <ChevronRight size={13} />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
