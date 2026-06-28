import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET ?? "fallback-secret");

export type MobileTokenPayload = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  image: string | null;
};

export async function signMobileToken(payload: MobileTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyMobileToken(token: string): Promise<MobileTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as MobileTokenPayload;
  } catch {
    return null;
  }
}

export async function getMobileUser(req: Request): Promise<MobileTokenPayload | null> {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  return verifyMobileToken(auth.slice(7));
}
