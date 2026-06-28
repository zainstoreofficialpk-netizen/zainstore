import { NextResponse } from "next/server";
import { getMobileUser } from "@/lib/mobile/jwt";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const tokenUser = await getMobileUser(req);
  if (!tokenUser) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const user = await db.user.findUnique({
      where: { id: tokenUser.id },
      select: {
        id: true, name: true, email: true, role: true, image: true,
        phone: true, createdAt: true,
        addresses: { take: 5 },
      },
    });

    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

    return NextResponse.json({ user });
  } catch (e) {
    console.error("[mobile/me]", e);
    return NextResponse.json({ error: "Failed to fetch profile." }, { status: 500 });
  }
}
