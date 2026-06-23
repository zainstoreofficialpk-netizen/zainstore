"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageIcon, CheckCircle, Loader2, AlertTriangle } from "lucide-react";

export default function MigrateImagesPage() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [total, setTotal] = useState(0);
  const [migrated, setMigrated] = useState(0);
  const [failed, setFailed] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  async function startMigration() {
    setStatus("running");
    setMigrated(0);
    setFailed(0);
    setLog([]);

    try {
      const res = await fetch("/api/admin/migrate-images");
      const { total: t } = await res.json();
      setTotal(t);

      if (t === 0) {
        setLog(["No WordPress images found — all images are already on Cloudinary!"]);
        setStatus("done");
        return;
      }

      setLog([`Found ${t} images to migrate...`]);

      let totalSuccess = 0;
      let totalFailed = 0;
      let done = false;

      while (!done) {
        const r = await fetch("/api/admin/migrate-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offset: 0, batchSize: 20 }),
        });
        const data = await r.json();

        totalSuccess += data.success;
        totalFailed += data.failed;
        done = data.done;

        setMigrated(totalSuccess);
        setFailed(totalFailed);
        setLog((prev) => [
          ...prev,
          `Batch: ${data.success} uploaded, ${data.failed} failed — ${data.remaining} remaining`,
        ]);
      }

      setStatus("done");
      setLog((prev) => [...prev, `✓ Migration complete! ${totalSuccess} images moved to Cloudinary.`]);
    } catch (e) {
      setStatus("error");
      setLog((prev) => [...prev, `Error: ${e instanceof Error ? e.message : String(e)}`]);
    }
  }

  const percent = total > 0 ? Math.round((migrated / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Migrate Images to Cloudinary</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Moves all product images from the old WordPress server to Cloudinary permanently.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon size={18} className="text-brand-500" />
            Image Migration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "idle" && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold">Before you start:</p>
              <ul className="mt-1 list-disc pl-4 space-y-1">
                <li>This will upload all WordPress product images to Cloudinary</li>
                <li>The process may take 10–30 minutes for 5,000 products</li>
                <li>Do not close this tab while running</li>
                <li>After completion, you can safely delete WordPress hosting</li>
              </ul>
            </div>
          )}

          {status !== "idle" && total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium text-zinc-700">
                <span>{migrated} of {total} images migrated</span>
                <span>{percent}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-zinc-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
              {failed > 0 && (
                <p className="text-xs text-rose-500">{failed} images failed to upload</p>
              )}
            </div>
          )}

          {status === "done" && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <CheckCircle size={16} className="shrink-0" />
              <span>All images migrated successfully! You can now delete WordPress hosting.</span>
            </div>
          )}

          {status === "error" && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertTriangle size={16} className="shrink-0" />
              <span>An error occurred. Check the log below and try again.</span>
            </div>
          )}

          <Button
            onClick={startMigration}
            disabled={status === "running" || status === "done"}
            className="w-full"
          >
            {status === "running" ? (
              <><Loader2 size={16} className="mr-2 animate-spin" /> Migrating...</>
            ) : status === "done" ? (
              <><CheckCircle size={16} className="mr-2" /> Migration Complete</>
            ) : (
              "Start Migration"
            )}
          </Button>

          {log.length > 0 && (
            <div className="rounded-lg bg-zinc-950 p-4 font-mono text-xs text-zinc-300 max-h-60 overflow-y-auto space-y-1">
              {log.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
