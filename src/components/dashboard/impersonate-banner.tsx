"use client";

import { useEffect, useState } from "react";
import { Eye, X } from "lucide-react";

export function ImpersonateBanner() {
  const [visible, setVisible] = useState(false);

  // Check if the impersonation cookie is present (readable as non-HttpOnly via document.cookie won't work
  // for HttpOnly, so we use a small API ping instead)
  useEffect(() => {
    fetch("/api/admin/impersonate/check")
      .then((r) => r.json())
      .then((data) => setVisible(data.active === true))
      .catch(() => {});
  }, []);

  function exitImpersonation() {
    fetch("/api/admin/impersonate", { method: "DELETE" }).then(() => {
      window.location.href = "/admin/vendors";
    });
  }

  if (!visible) return null;

  return (
    <div className="flex items-center justify-between bg-amber-500 px-4 py-2 text-sm font-medium text-white">
      <div className="flex items-center gap-2">
        <Eye size={16} />
        <span>You are viewing as a Vendor (impersonation mode)</span>
      </div>
      <button
        onClick={exitImpersonation}
        className="flex items-center gap-1.5 rounded-md bg-white/20 px-3 py-1 hover:bg-white/30 transition-colors"
      >
        <X size={14} /> Exit Vendor View
      </button>
    </div>
  );
}
