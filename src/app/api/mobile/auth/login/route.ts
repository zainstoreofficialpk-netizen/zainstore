import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signMobileToken } from "@/lib/mobile/jwt";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, email: true, name: true, role: true, image: true, passwordHash: true, emailVerified: true, status: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json({ error: "Your account has been suspended. Please contact support." }, { status: 403 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const token = await signMobileToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      image: user.image,
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
      },
    });
  } catch (e) {
    console.error("[mobile/auth/login]", e);
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
