import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { authOptions } from "@/lib/auth/config";
import { dashboardHomeFor } from "@/lib/auth/permissions";

// Force every auth-page request to the server — never serve from browser/CDN cache.
// This is the key that stops the back-button from showing a stale login page.
export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // If already authenticated, send the user straight to their portal.
  if (session?.user?.role) {
    redirect(dashboardHomeFor(session.user.role as "SUPER_ADMIN" | "VENDOR" | "CUSTOMER"));
  }

  return <>{children}</>;
}
