import { NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

// Public endpoint — no auth required.
// Used during vendor registration (before the account exists).
// Accepts: CNIC front, CNIC back, bank cheque images.
export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, or WEBP images allowed." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File must be under 8 MB." }, { status: 400 });
  }

  try {
    const url = await uploadToCloudinary(file, "vendor-docs");
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
