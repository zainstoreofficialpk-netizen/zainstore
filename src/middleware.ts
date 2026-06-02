import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const IMPERSONATE_COOKIE = "zs_impersonate_vendor";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role as string | undefined;
    const impersonateCookie = req.cookies.get(IMPERSONATE_COOKIE)?.value;

    // ── Cross-role isolation ──────────────────────────────────────────────────

    if (pathname.startsWith("/admin") && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
    }

    // Vendor routes: allow VENDOR, OR allow SUPER_ADMIN who has an active impersonation cookie
    if (pathname.startsWith("/vendor")) {
      if (role === "VENDOR") {
        // Normal vendor — pass through
      } else if (role === "SUPER_ADMIN" && impersonateCookie) {
        // Admin impersonating a vendor — allow but inject header for the banner
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
    pages: {
      signIn: "/login",
    },
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
);

export const config = {
  matcher: ["/admin/:path*", "/vendor/:path*", "/customer/:path*"],
};
