import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookie = cookies().get("zs_impersonate_vendor");
  return NextResponse.json({ active: !!cookie?.value });
}
