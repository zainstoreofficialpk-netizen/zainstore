"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageIcon, CheckCircle, Loader2 } from "lucide-react";

export default function MigrateImagesPage() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult] = useState<{ updated: number; skipped: number; total: number } | null>(null);

  async function applyMap() {
    setStatus("running");
    try {
      const res = await fetch("/api/admin/apply-image-map", { method: "POST" });
      const data = await res.json();
      setResult(data);
      setStatus("done");
    } catch (e) {
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Fix Product Images</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Updates all product image URLs in the database to use Cloudinary.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon size={18} className="text-brand-500" />
            Apply Cloudinary Image URLs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            This will update <strong>7,607 product images</strong> in the database to point to
            Cloudinary instead of the old WordPress server. Takes about 30–60 seconds.
          </div>

          {status === "done" && result && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle size={16} /> Done!
              </div>
              <p>Updated: {result.updated} images</p>
              <p>Skipped (not in production): {result.skipped}</p>
              <p className="mt-2 font-medium">All product images now load from Cloudinary. You can safely delete WordPress hosting.</p>
            </div>
          )}

          {status === "error" && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              Something went wrong. Please try again.
            </div>
          )}

          <Button
            onClick={applyMap}
            disabled={status === "running" || status === "done"}
            className="w-full"
            size="lg"
          >
            {status === "running" ? (
              <><Loader2 size={16} className="mr-2 animate-spin" /> Updating database...</>
            ) : status === "done" ? (
              <><CheckCircle size={16} className="mr-2" /> Complete</>
            ) : (
              "Apply Cloudinary URLs to Database"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
