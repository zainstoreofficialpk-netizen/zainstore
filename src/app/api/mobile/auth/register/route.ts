import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signMobileToken } from "@/lib/mobile/jwt";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash: hashed,
        role: "CUSTOMER",
        emailVerified: new Date(), // auto-verify mobile registrations
      },
      select: { id: true, email: true, name: true, role: true, image: true },
    });

    const token = await signMobileToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      image: user.image,
    });

    return NextResponse.json({ token, user }, { status: 201 });
  } catch (e) {
    console.error("[mobile/auth/register]", e);
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
