"use client";

import {
  createContext,
  useContext,
  useRef,
  useCallback,
  useState,
} from "react";

// ─── Types ────────────────────────────────────────────────────

type FlyItem = {
  id: string;
  x: number;       // viewport center-x of product image
  y: number;       // viewport center-y of product image
  tx: number;      // viewport center-x of cart button
  ty: number;      // viewport center-y of cart button
  imageUrl: string;
  launched: boolean;
};

type FlyContextType = {
  cartBtnRef: React.MutableRefObject<HTMLButtonElement | null>;
  triggerFly: (sourceRect: DOMRect, imageUrl: string) => void;
};

// ─── Context ──────────────────────────────────────────────────

const FlyCtx = createContext<FlyContextType | null>(null);

const FLY_SIZE = 54; // diameter of the flying disc (px)

// ─── Provider ─────────────────────────────────────────────────

export function CartFlyProvider({ children }: { children: React.ReactNode }) {
  const cartBtnRef = useRef<HTMLButtonElement | null>(null);
  const [flies, setFlies] = useState<FlyItem[]>([]);

  const triggerFly = useCallback((src: DOMRect, imageUrl: string) => {
    const btn = cartBtnRef.current;
    if (!btn) return;

    const cart = btn.getBoundingClientRect();
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

    const startX = src.left + src.width / 2;
    const startY = src.top + src.height / 2;
    const endX = cart.left + cart.width / 2;
    const endY = cart.top + cart.height / 2;

    // Insert at initial (non-launched) state first
    setFlies((prev) => [
      ...prev,
      { id, x: startX, y: startY, tx: endX, ty: endY, imageUrl, launched: false },
    ]);

    // Two rAF ticks: let React commit → then start CSS transition
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        setFlies((prev) =>
          prev.map((f) => (f.id === id ? { ...f, launched: true } : f)),
        ),
      ),
    );

    // Clean up after animation finishes
    setTimeout(() => setFlies((prev) => prev.filter((f) => f.id !== id)), 850);
  }, []);

  return (
    <FlyCtx.Provider value={{ cartBtnRef, triggerFly }}>
      {children}

      {/* Flying product discs — fixed-position, above everything */}
      {flies.map((fly) => (
        <div
          key={fly.id}
          className="pointer-events-none fixed z-[9999] rounded-full overflow-hidden border-[3px] border-white shadow-2xl"
          style={{
            width: FLY_SIZE,
            height: FLY_SIZE,
            left: fly.x - FLY_SIZE / 2,
            top: fly.y - FLY_SIZE / 2,
            transform: fly.launched
              ? `translate(${fly.tx - fly.x}px, ${fly.ty - fly.y}px) scale(0.12)`
              : "scale(1)",
            opacity: fly.launched ? 0 : 1,
            transition: fly.launched
              ? "transform 0.65s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.55s ease-in 0.15s"
              : "none",
          }}
        >
          {fly.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fly.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-brand-400" />
          )}
        </div>
      ))}
    </FlyCtx.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────

export function useFlyContext() {
  return useContext(FlyCtx);
}
