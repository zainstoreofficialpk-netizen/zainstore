import { randomBytes } from "crypto";
import { db } from "@/lib/db";

export function generateToken() {
  return randomBytes(32).toString("hex");
}

export async function createVerificationToken(email: string) {
  const token = generateToken();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db.verificationToken.deleteMany({ where: { identifier: `verify:${email}` } });
  await db.verificationToken.create({
    data: { identifier: `verify:${email}`, token, expires },
  });

  return token;
}

export async function createPasswordResetToken(email: string) {
  const token = generateToken();
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.verificationToken.deleteMany({ where: { identifier: `reset:${email}` } });
  await db.verificationToken.create({
    data: { identifier: `reset:${email}`, token, expires },
  });

  return token;
}

export async function consumeToken(token: string) {
  const record = await db.verificationToken.findUnique({ where: { token } });
  if (!record) return null;

  if (record.expires < new Date()) {
    await db.verificationToken.delete({ where: { token } });
    return null;
  }

  await db.verificationToken.delete({ where: { token } });
  return record;
}
