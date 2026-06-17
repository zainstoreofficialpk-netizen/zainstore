"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  Cpu,
  Shirt,
  Home,
  Sparkles,
  Trophy,
  BookOpen,
  Gamepad2,
  ShoppingBag,
  Utensils,
  Wrench,
  Baby,
  type LucideIcon,
} from "lucide-react";

// ─── Public types ─────────────────────────────────────────────

export type HeroSlide = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
};

export type HeroCategory = {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string }[];
};

// ─── Category icon map ────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  electronics: Cpu,
  fashion: Shirt,
  clothing: Shirt,
  home: Home,
  beauty: Sparkles,
  sports: Trophy,
  books: BookOpen,
  gaming: Gamepad2,
  food: Utensils,
  tools: Wrench,
  baby: Baby,
  toys: Gamepad2,
  bags: ShoppingBag,
};

function resolveIcon(name: string): LucideIcon {
  const lower = name.toLowerCase();
  for (const [key, Icon] of Object.entries(ICON_MAP)) {
    if (lower.includes(key)) return Icon;
  }
  return ShoppingBag;
}

// ─── Constants ────────────────────────────────────────────────

const GRADIENTS = [
  "from-brand-500 via-brand-400 to-amber-300",
  "from-zinc-800 via-zinc-700 to-zinc-600",
  "from-accent-500 via-red-500 to-orange-400",
  "from-violet-600 via-violet-500 to-purple-400",
  "from-blue-600 via-blue-500 to-cyan-400",
];

const AUTOPLAY_MS = 4000;
const TRANS_MS = 600;

// ─── Main component ───────────────────────────────────────────

export function HeroSection({
  slides,
  categories = [],
}: {
  slides: HeroSlide[];
  categories?: HeroCategory[];
}) {
  const n = slides.length;
  if (n === 0) return <EmptyHero hasSidebar={categories.length > 0} />;

  // For n > 1: extend with clones → [last, ...slides, first]
  const ext = n > 1 ? [slides[n - 1], ...slides, slides[0]] : slides;
  const extLen = ext.length;

  const [idx, setIdx] = useState(n > 1 ? 1 : 0);
  const [animated, setAnimated] = useState(true);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragPx, setDragPx] = useState(0);

  const jumping = useRef(false);
  const dragStart = useRef(0);
  const dragContainerW = useRef(0);

  // Real 0-based index (strips clones)
  const real = n > 1 ? Math.max(0, Math.min(idx - 1, n - 1)) : idx;

  // ── Navigation ───────────────────────────────────────────
  const doAdvance = useCallback(() => {
    if (jumping.current) return;
    setAnimated(true);
    setIdx((p) => p + 1);
  }, []);

  const doRetreat = useCallback(() => {
    if (jumping.current) return;
    setAnimated(true);
    setIdx((p) => p - 1);
  }, []);

  function jumpTo(realIndex: number) {
    const target = n > 1 ? realIndex + 1 : realIndex;
    setAnimated(true);
    setIdx(target);
  }

  // ── Infinite-loop snap ────────────────────────────────────
  const onTransEnd = useCallback(
    (e: React.TransitionEvent) => {
      if (e.target !== e.currentTarget || e.propertyName !== "transform") return;
      if (n <= 1 || jumping.current) return;
      if (idx >= n + 1) {
        jumping.current = true;
        setAnimated(false);
        setIdx(1);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            jumping.current = false;
            setAnimated(true);
          }),
        );
      } else if (idx <= 0) {
        jumping.current = true;
        setAnimated(false);
        setIdx(n);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            jumping.current = false;
            setAnimated(true);
          }),
        );
      }
    },
    [idx, n],
  );

  // ── Autoplay ─────────────────────────────────────────────
  useEffect(() => {
    if (n <= 1 || paused || dragging) return;
    const t = setInterval(doAdvance, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [n, paused, dragging, doAdvance]);

  // ── Pointer drag ──────────────────────────────────────────
  function onDown(e: React.PointerEvent<HTMLDivElement>) {
    dragStart.current = e.clientX;
    dragContainerW.current = e.currentTarget.offsetWidth;
    setDragging(true);
    setPaused(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    if (!dragging) return;
    setDragPx(e.clientX - dragStart.current);
  }
  function onUp(e: React.PointerEvent) {
    if (!dragging) return;
    const delta = e.clientX - dragStart.current;
    setDragging(false);
    setDragPx(0);
    setPaused(false);
    if (delta < -50) doAdvance();
    else if (delta > 50) doRetreat();
  }

  // CSS percentage-based transform + pixel drag overlay via calc()
  const basePct = -(idx / extLen) * 100;
  const transform =
    dragPx !== 0
      ? `translateX(calc(${basePct}% + ${dragPx}px))`
      : `translateX(${basePct}%)`;

  // ── Shared slider JSX ─────────────────────────────────────
  function renderSlider() {
    return (
      <>
        {/* Track — top/bottom/left only, no right:0 so width isn't over-constrained */}
        <div
          className="absolute top-0 bottom-0 left-0"
          style={{
            display: "flex",
            width: `${extLen * 100}%`,
            transform,
            transition:
              animated && !dragging
                ? `transform ${TRANS_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
                : "none",
            willChange: "transform",
          }}
          onTransitionEnd={onTransEnd}
        >
          {ext.map((slide, i) => {
            const active = i === idx;
            return (
              <div
                key={`${slide.id}-${i}`}
                className="relative overflow-hidden"
                style={{ width: `${100 / extLen}%`, height: "100%" }}
              >
                {/* Image */}
                {slide.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div
                    className={`w-full h-full bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]}`}
                  />
                )}


                {/* Shop Now button only */}
                {slide.linkUrl && (
                  <div
                    className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 md:bottom-10 md:left-12"
                    style={{
                      opacity: active ? 1 : 0,
                      transform: active ? "translateY(0)" : "translateY(10px)",
                      transition: `opacity ${TRANS_MS}ms, transform ${TRANS_MS}ms`,
                      pointerEvents: active ? "auto" : "none",
                    }}
                  >
                    <Link
                      href={slide.linkUrl}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:px-6 sm:py-2.5 sm:text-sm md:px-8 md:py-3.5 md:gap-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Shop Now
                      <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Prev / Next arrows */}
        {n > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                doRetreat();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 bg-black/30 hover:bg-black/55 backdrop-blur-sm border border-white/15 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110 shadow-xl"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                doAdvance();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 bg-black/30 hover:bg-black/55 backdrop-blur-sm border border-white/15 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110 shadow-xl"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {n > 1 && (
          <div className="absolute bottom-4 right-6 z-20 flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  jumpTo(i);
                }}
                className={`rounded-full transition-all duration-300 ${
                  i === real
                    ? "w-5 h-1.5 bg-white"
                    : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <section
      className="bg-zinc-50 py-3 w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container mx-auto px-4 max-w-7xl">

        {/* ── Desktop: sidebar + slider (flexbox so slider always gets remaining width) ── */}
        <div className="hidden lg:flex gap-3" style={{ height: "440px" }}>

          {/* Category sidebar — optional, fixed 220px */}
          {categories.length > 0 && (
            <aside
              className="shrink-0 bg-white rounded-2xl border border-zinc-100 shadow-sm flex flex-col overflow-hidden"
              style={{ width: "220px" }}
            >
              <div className="px-4 py-3 border-b border-zinc-100 shrink-0">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  All Categories
                </p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {categories.map((cat) => (
                  <CategoryRow key={cat.id} cat={cat} />
                ))}
              </div>
              <div className="border-t border-zinc-100 px-4 py-2.5 shrink-0">
                <Link
                  href="/shop/categories"
                  className="text-xs font-bold text-brand-500 hover:text-brand-600 flex items-center gap-1 transition-colors"
                >
                  View All <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </aside>
          )}

          {/* Slider — takes ALL remaining width via flex-1 */}
          <div
            className="flex-1 min-w-0 relative overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            {renderSlider()}
          </div>
        </div>

        {/* ── Mobile / Tablet: full-width slider ───────── */}
        <div
          className="relative overflow-hidden rounded-xl sm:rounded-2xl cursor-grab active:cursor-grabbing lg:hidden"
          style={{ aspectRatio: "16/9" }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          {renderSlider()}
        </div>

        {/* ── Thumbnail strip — offset by sidebar on desktop so it sits under the slider ── */}
        {n > 1 && (
          <div
            className={`hidden sm:flex items-center gap-2.5 mt-3 overflow-x-auto scrollbar-hide ${
              categories.length > 0 ? "lg:pl-[232px]" : "justify-center"
            }`}
          >
            {slides.map((slide, i) => {
              const active = i === real;
              return (
                <button
                  key={slide.id}
                  onClick={() => jumpTo(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`relative shrink-0 overflow-hidden rounded-md sm:rounded-lg transition-all duration-300 ${
                    active
                      ? "ring-2 ring-brand-500 ring-offset-1 sm:ring-offset-2 ring-offset-zinc-50 scale-110 opacity-100"
                      : "opacity-45 hover:opacity-75 hover:scale-105"
                  }`}
                  style={{ width: 52, height: 32 }}
                >
                  {slide.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={slide.imageUrl}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div
                      className={`w-full h-full bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]}`}
                    />
                  )}
                  {active && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-brand-500" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Category row with fixed-position flyout ──────────────────

function CategoryRow({ cat }: { cat: HeroCategory }) {
  const rowRef = useRef<HTMLAnchorElement>(null);
  const [flyPos, setFlyPos] = useState<{ top: number; left: number } | null>(null);
  const Icon = resolveIcon(cat.name);

  return (
    <div
      onMouseEnter={() => {
        if (!cat.children.length || !rowRef.current) return;
        const r = rowRef.current.getBoundingClientRect();
        setFlyPos({ top: r.top, left: r.right + 2 });
      }}
      onMouseLeave={() => setFlyPos(null)}
    >
      <Link
        ref={rowRef}
        href={`/shop/category/${cat.slug}`}
        className={`flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors ${
          flyPos
            ? "bg-brand-50 text-brand-700"
            : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
        }`}
      >
        <Icon
          className={`h-4 w-4 shrink-0 ${flyPos ? "text-brand-500" : "text-zinc-400"}`}
        />
        <span className="flex-1 truncate">{cat.name}</span>
        {cat.children.length > 0 && (
          <ChevronRight
            className={`h-3.5 w-3.5 shrink-0 ${flyPos ? "text-brand-400" : "text-zinc-300"}`}
          />
        )}
      </Link>

      {/* Flyout — fixed so it escapes overflow:hidden on any ancestor */}
      {flyPos && cat.children.length > 0 && (
        <div
          className="fixed z-[300] w-52 bg-white border border-zinc-100 shadow-2xl rounded-xl py-2"
          style={{ top: flyPos.top, left: flyPos.left }}
          onMouseEnter={() =>
            rowRef.current &&
            setFlyPos({
              top: rowRef.current.getBoundingClientRect().top,
              left: rowRef.current.getBoundingClientRect().right + 2,
            })
          }
          onMouseLeave={() => setFlyPos(null)}
        >
          <p className="px-4 py-1.5 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-50 mb-1">
            {cat.name}
          </p>
          {cat.children.map((sub) => (
            <Link
              key={sub.id}
              href={`/shop/category/${sub.slug}`}
              className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-zinc-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
            >
              <span className="h-1 w-1 rounded-full bg-zinc-300 shrink-0" />
              {sub.name}
            </Link>
          ))}
          <div className="border-t border-zinc-50 mt-1 pt-1.5 px-4">
            <Link
              href={`/shop/category/${cat.slug}`}
              className="text-xs font-bold text-brand-500 hover:text-brand-600 transition-colors"
            >
              See all in {cat.name} →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────

function EmptyHero({ hasSidebar }: { hasSidebar: boolean }) {
  return (
    <section className="bg-zinc-50 py-3 w-full overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl">
        <div
          className={`rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center ${hasSidebar ? "lg:ml-[252px]" : ""}`}
          style={{ height: "440px" }}
        >
          <div className="text-center text-white px-6">
            <Zap className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-xl font-black">Add Hero Banners</p>
            <p className="text-white/70 text-sm mt-1 max-w-xs">
              Go to Admin → Banner Management and set placement to{" "}
              <strong>Homepage Slider</strong>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
