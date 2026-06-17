"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for non-HTTPS (local network testing)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getOrCreateSessionId(): string {
  let sid = sessionStorage.getItem("_vsid");
  if (!sid) {
    sid = uuid();
    sessionStorage.setItem("_vsid", sid);
  }
  return sid;
}

export function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const sessionId = getOrCreateSessionId();
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, path: pathname }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
