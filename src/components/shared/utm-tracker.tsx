"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

export const UTM_KEY = "zs_utm";

export type StoredUtm = {
  source: string;   // raw utm_source value or inferred from referrer
  reference: string | null; // utm_id, utm_campaign, or fbclid
};

function mapSource(raw: string): string {
  const s = raw.toLowerCase().trim();
  if (s === "facebook" || s === "fb" || s === "facebook.com") return "FACEBOOK";
  if (s === "instagram" || s === "ig") return "INSTAGRAM";
  if (s === "whatsapp" || s === "wa") return "WHATSAPP";
  if (s === "google" || s === "google.com" || s === "cpc" || s === "ppc") return "GOOGLE";
  return "OTHER";
}

function inferFromReferrer(ref: string): string | null {
  try {
    const host = new URL(ref).hostname.replace("www.", "");
    if (host.includes("facebook.com") || host.includes("fb.com")) return "FACEBOOK";
    if (host.includes("instagram.com")) return "INSTAGRAM";
    if (host.includes("google.")) return "GOOGLE";
    if (host.includes("whatsapp.com")) return "WHATSAPP";
    return null;
  } catch {
    return null;
  }
}

function UtmlTrackerInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only capture on first landing (don't overwrite an already-stored UTM this session)
    if (sessionStorage.getItem(UTM_KEY)) return;

    const utmSource = searchParams.get("utm_source");
    const utmCampaign = searchParams.get("utm_campaign");
    const utmId = searchParams.get("utm_id");
    const fbclid = searchParams.get("fbclid");
    const gclid = searchParams.get("gclid");

    let source: string | null = null;
    let reference: string | null = utmId ?? utmCampaign ?? fbclid ?? gclid ?? null;

    if (utmSource) {
      source = mapSource(utmSource);
    } else if (fbclid) {
      source = "FACEBOOK";
      reference = fbclid;
    } else if (gclid) {
      source = "GOOGLE";
      reference = gclid;
    } else {
      // Fall back to document.referrer
      const ref = document.referrer;
      if (ref) source = inferFromReferrer(ref);
    }

    if (source) {
      const utm: StoredUtm = { source, reference };
      sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
    }
  }, [searchParams]);

  return null;
}

export function UtmTracker() {
  return (
    <Suspense>
      <UtmlTrackerInner />
    </Suspense>
  );
}

export function readStoredUtm(): StoredUtm | null {
  try {
    const raw = sessionStorage.getItem(UTM_KEY);
    return raw ? (JSON.parse(raw) as StoredUtm) : null;
  } catch {
    return null;
  }
}
