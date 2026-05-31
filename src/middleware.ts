import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role as string | undefined;

    // Cross-role isolation: each role can only access its own portal
    if (pathname.startsWith("/admin") && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
    }

    if (pathname.startsWith("/vendor") && role !== "VENDOR") {
      return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
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
      // Only run the middleware function when a valid JWT exists
      authorized: ({ token }) => !!token,
    },
  },
);

export const config = {
  matcher: ["/admin/:path*", "/vendor/:path*", "/customer/:path*"],
};
