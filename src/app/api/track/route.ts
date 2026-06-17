import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, path } = await req.json();
    if (!sessionId || typeof sessionId !== "string") return NextResponse.json({ ok: false }, { status: 400 });

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null;
    const userAgent = req.headers.get("user-agent") ?? null;

    await db.pageVisit.create({
      data: { sessionId, path: path ?? "/", ip, userAgent },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
