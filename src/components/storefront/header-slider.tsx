"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Slide = { id: string; title: string; imageUrl: string; linkUrl: string | null };

export function HeaderSlider({ slides }: { slides: Slide[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  const next = useCallback(() => setCurrent((c) => (c + 1) % count), [count]);
  const prev = () => setCurrent((c) => (c - 1 + count) % count);

  useEffect(() => {
    if (paused || count <= 1) return;
    const id = setInterval(next, 4500);
    return () => clearInterval(id);
  }, [paused, count, next]);

  if (count === 0) {
    return (
      <div className="relative h-[260px] sm:h-[380px] lg:h-[480px] bg-gradient-to-br from-brand-500 via-brand-400 to-accent-500 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]" />
        <div className="text-white text-center relative z-10 px-4">
          <p className="text-xs font-medium tracking-widest uppercase text-white/70 mb-2">Pakistan&apos;s Premier Marketplace</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">Shop the Best Deals</h2>
          <p className="text-white/80 text-sm mb-6">Thousands of products from trusted vendors</p>
          <Link href="/shop" className="inline-block px-7 py-3 bg-white text-brand-600 font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm">
            Explore Now →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden h-[260px] sm:h-[380px] lg:h-[480px] bg-zinc-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      <div
        className="flex h-full transition-transform duration-700 ease-in-out will-change-transform"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className="relative min-w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
              <h2 className="text-white text-2xl sm:text-3xl lg:text-4xl font-black drop-shadow-lg max-w-xl leading-tight">
                {slide.title}
              </h2>
              {slide.linkUrl && (
                <Link
                  href={slide.linkUrl}
                  className="mt-4 inline-block px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-full text-sm shadow transition-all hover:scale-105"
                >
                  Shop Now
                </Link>
              )}
            </div>
            {slide.linkUrl && <Link href={slide.linkUrl} className="absolute inset-0" aria-label={slide.title} />}
          </div>
        ))}
      </div>

      {/* Prev / Next */}
      {count > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); prev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110 z-10"
          >
            <ChevronLeft className="h-5 w-5 text-zinc-800" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); next(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110 z-10"
          >
            <ChevronRight className="h-5 w-5 text-zinc-800" />
          </button>
        </>
      )}

      {/* Dots */}
      {count > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
