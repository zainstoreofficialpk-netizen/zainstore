"use client";

import { useState, useEffect } from "react";
import { X, Truck } from "lucide-react";

interface Props {
  message: string;
  id?: string;
}

export function AnnouncementBar({ message, id = "v1" }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(`zs_ann_${id}`)) setVisible(true);
  }, [id]);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(`zs_ann_${id}`, "1");
    setVisible(false);
  }

  return (
    <div className="bg-brand-500 text-white text-center text-xs py-2.5 px-4 relative w-full overflow-hidden">
      <div className="flex items-center justify-center gap-2">
        <Truck className="h-3.5 w-3.5 shrink-0" />
        <span className="font-medium">{message}</span>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-opacity"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
