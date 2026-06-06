import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const IMPERSONATE_COOKIE = "zs_impersonate_vendor";

// Auth pages that logged-in users must never see
const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/confirm-email"];

function dashboardFor(role: string) {
  if (role === "SUPER_ADMIN") return "/admin";
  if (role === "VENDOR") return "/vendor";
  return "/customer";
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role as string | undefined;
    const impersonateCookie = req.cookies.get(IMPERSONATE_COOKIE)?.value;

    // ── Authenticated users must not see auth pages (fixes back-button bug) ────
    // withAuth only calls this function when authorized() returns true (i.e. token exists).
    // So if we're here and on an auth path, the user is logged in → redirect to dashboard.
    if (AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      return NextResponse.redirect(new URL(dashboardFor(role ?? ""), req.url));
    }

    // ── Cross-role isolation ──────────────────────────────────────────────────

    if (pathname.startsWith("/admin") && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
    }

    // Vendor routes: allow VENDOR, OR SUPER_ADMIN with active impersonation cookie
    if (pathname.startsWith("/vendor")) {
      if (role === "VENDOR") {
        // Normal vendor — pass through
      } else if (role === "SUPER_ADMIN" && impersonateCookie) {
        const res = NextResponse.next();
        res.headers.set("x-impersonating", impersonateCookie);
        return res;
      } else {
        return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
      }
    }

    if (pathname.startsWith("/customer") && role !== "CUSTOMER") {
      return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    pages: { signIn: "/login" },
    callbacks: {
      // Return true only when a JWT token exists (i.e. user is authenticated).
      // For unauthenticated users on dashboard routes, withAuth redirects to /login automatically.
      // For authenticated users on auth routes, our middleware function above handles the redirect.
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Auth pages: always let the request through so our middleware function above
        // can inspect the token and redirect if needed. If there's no token, just render the page.
        if (AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
          return true;
        }

        // Dashboard routes: require a token
        return !!token;
      },
    },
  },
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/vendor/:path*",
    "/customer/:path*",
    "/login",
    "/register/:path*",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/confirm-email",
  ],
};
