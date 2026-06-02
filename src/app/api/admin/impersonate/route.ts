import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";

const COOKIE_NAME = "zs_impersonate_vendor";

// POST — start impersonation

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { vendorUserId } = await request.json();
  if (!vendorUserId) return NextResponse.json({ error: "Missing vendorUserId" }, { status: 400 });

  // Verify the user exists and is a VENDOR
  const target = await db.user.findUnique({
    where: { id: vendorUserId },
    select: { id: true, role: true },
  });
  if (!target || target.role !== "VENDOR") {
    return NextResponse.json({ error: "Target is not a vendor" }, { status: 400 });
  }

  cookies().set(COOKIE_NAME, vendorUserId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 hour max impersonation session
  });

  return NextResponse.json({ ok: true });
}

// DELETE — end impersonation

export async function DELETE() {
  cookies().delete(COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
