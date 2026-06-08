"use client";

import { useState, useEffect } from "react";

function secondsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}

function TimeBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white/20 backdrop-blur-sm rounded-lg w-10 h-10 flex items-center justify-center">
        <span className="text-white font-black text-lg tabular-nums leading-none">{value}</span>
      </div>
      <span className="text-white/60 text-[9px] font-bold mt-0.5 tracking-widest uppercase">
        {label}
      </span>
    </div>
  );
}

export function CountdownTimer() {
  const [secs, setSecs] = useState<number | null>(null);

  useEffect(() => {
    setSecs(secondsUntilMidnight());
    const id = setInterval(() => setSecs(secondsUntilMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");
  const h = secs === null ? 0 : Math.floor(secs / 3600);
  const m = secs === null ? 0 : Math.floor((secs % 3600) / 60);
  const s = secs === null ? 0 : secs % 60;

  return (
    <div className="flex items-center gap-1">
      <TimeBlock value={pad(h)} label="hrs" />
      <span className="text-white/50 font-black text-xl pb-3">:</span>
      <TimeBlock value={pad(m)} label="min" />
      <span className="text-white/50 font-black text-xl pb-3">:</span>
      <TimeBlock value={pad(s)} label="sec" />
    </div>
  );
}
