"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Play } from "lucide-react";

export type GalleryImage = { id: string; url: string; alt: string | null };

type GalleryItem =
  | { kind: "image"; id: string; url: string; alt: string | null }
  | { kind: "video"; id: string; url: string };

export function ProductGallery({
  images,
  productName,
  videoUrl,
}: {
  images: GalleryImage[];
  productName: string;
  videoUrl?: string | null;
}) {
  const items: GalleryItem[] = [
    ...(images.length > 0
      ? images.map((img) => ({ kind: "image" as const, ...img }))
      : [{ kind: "image" as const, id: "ph", url: "", alt: productName }]),
    ...(videoUrl ? [{ kind: "video" as const, id: "video", url: videoUrl }] : []),
  ];

  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [lightbox, setLightbox] = useState(false);
  const [lbIdx, setLbIdx] = useState(0);

  const cur = items[active];

  const prev = useCallback(() => { setActive((a) => (a - 1 + items.length) % items.length); setZoomed(false); }, [items.length]);
  const next = useCallback(() => { setActive((a) => (a + 1) % items.length); setZoomed(false); }, [items.length]);
  const lbPrev = () => setLbIdx((i) => (i - 1 + items.length) % items.length);
  const lbNext = () => setLbIdx((i) => (i + 1) % items.length);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!zoomed || cur.kind === "video") return;
    const r = e.currentTarget.getBoundingClientRect();
    setZoomPos({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
  }

  function openLightbox(i: number) {
    setLbIdx(i);
    setLightbox(true);
  }

  const lbItem = items[lbIdx];

  return (
    <>
      <div className="flex flex-col-reverse md:flex-row gap-3">
        {/* Thumbnail strip */}
        {items.length > 1 && (
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto shrink-0 md:max-h-[520px] pb-0.5 md:pb-0 md:pr-0.5">
            {items.map((item, i) => (
              <button
                key={item.id}
                onClick={() => { setActive(i); setZoomed(false); }}
                className={`shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-150 ${
                  i === active
                    ? "border-brand-500 ring-1 ring-brand-300 shadow-sm"
                    : "border-zinc-100 hover:border-zinc-300 opacity-70 hover:opacity-100"
                }`}
                style={{ width: 64, height: 64 }}
              >
                {item.kind === "video" ? (
                  <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                    <Play className="h-5 w-5 text-white fill-white" />
                  </div>
                ) : item.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={item.alt ?? productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
                    <span className="text-lg font-black text-zinc-300">{productName[0]}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Main view */}
        <div className="flex-1">
          <div
            id="product-main-image"
            className={`relative aspect-square rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-100 select-none ${
              cur.kind === "video" ? "cursor-default" : zoomed ? "cursor-zoom-out" : "cursor-zoom-in"
            }`}
            onMouseMove={onMouseMove}
            onMouseLeave={() => { setZoomed(false); setZoomPos({ x: 50, y: 50 }); }}
            onClick={() => { if (cur.kind !== "video") { if (zoomed) setZoomed(false); else setZoomed(true); } }}
          >
            {cur.kind === "video" ? (
              <video
                src={cur.url}
                controls
                className="w-full h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            ) : cur.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cur.url}
                alt={"alt" in cur ? (cur.alt ?? productName) : productName}
                className="w-full h-full object-cover"
                style={{
                  transform: zoomed ? "scale(2.4)" : "scale(1)",
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  transition: zoomed ? "none" : "transform 0.25s ease-out",
                  pointerEvents: "none",
                }}
                draggable={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200">
                <span className="text-7xl font-black text-zinc-200 select-none">{productName[0]}</span>
              </div>
            )}

            {/* Zoom / expand button — only for images */}
            {cur.kind === "image" && cur.url && (
              <button
                onClick={(e) => { e.stopPropagation(); openLightbox(active); }}
                className="absolute bottom-3 right-3 h-9 w-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors z-10"
                title="Open full screen"
                onMouseEnter={(e) => e.stopPropagation()}
              >
                {zoomed ? (
                  <ZoomOut className="h-4 w-4 text-zinc-600" />
                ) : (
                  <ZoomIn className="h-4 w-4 text-zinc-600" />
                )}
              </button>
            )}

            {/* Mobile swipe arrows */}
            {items.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 bg-white/85 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md z-10 md:hidden"
                >
                  <ChevronLeft className="h-4 w-4 text-zinc-700" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 bg-white/85 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md z-10 md:hidden"
                >
                  <ChevronRight className="h-4 w-4 text-zinc-700" />
                </button>
              </>
            )}
          </div>

          {/* Mobile dots */}
          {items.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-3 md:hidden">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`rounded-full transition-all duration-200 ${
                    i === active ? "w-5 h-1.5 bg-brand-500" : "w-1.5 h-1.5 bg-zinc-300"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Lightbox (images only) ─────────────────────────────── */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/92 z-[500] flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          {/* Close */}
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 h-10 w-10 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className="relative max-w-3xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {lbItem.kind === "video" ? (
              <video
                src={lbItem.url}
                controls
                autoPlay
                className="w-full max-h-[80vh] rounded-xl"
              />
            ) : lbItem.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={lbItem.url}
                alt={lbItem.alt ?? productName}
                className="w-full max-h-[80vh] object-contain rounded-xl"
              />
            ) : (
              <div className="aspect-square bg-zinc-800 rounded-xl flex items-center justify-center">
                <span className="text-7xl font-black text-zinc-600">{productName[0]}</span>
              </div>
            )}

            {/* Arrows */}
            {items.length > 1 && (
              <>
                <button
                  onClick={lbPrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 bg-black/50 hover:bg-black/75 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={lbNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 bg-black/50 hover:bg-black/75 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {/* Counter */}
          {items.length > 1 && (
            <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/60 text-sm">
              {lbIdx + 1} / {items.length}
            </p>
          )}
        </div>
      )}
    </>
  );
}
