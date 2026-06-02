import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;   // 10 MB
const MAX_VIDEO_BYTES = 30 * 1024 * 1024;   // 30 MB

const ALLOWED_IMAGE = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const ALLOWED_VIDEO = new Set(["video/mp4", "video/webm"]);

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "VENDOR" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const type = (formData.get("type") as string) ?? "image";

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (type === "image") {
    if (!ALLOWED_IMAGE.has(file.type)) {
      return NextResponse.json({ error: "Only JPG, PNG, and WEBP images are allowed." }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image must be under 10 MB." }, { status: 400 });
    }
  } else if (type === "video") {
    if (!ALLOWED_VIDEO.has(file.type)) {
      return NextResponse.json({ error: "Only MP4 and WEBM videos are allowed." }, { status: 400 });
    }
    if (file.size > MAX_VIDEO_BYTES) {
      return NextResponse.json({ error: "Video must be under 30 MB." }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: "Unknown upload type." }, { status: 400 });
  }

  // Build a unique filename: {timestamp}-{random}.{ext}
  const ext = extname(file.name).toLowerCase() || (type === "video" ? ".mp4" : ".jpg");
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const uploadDir = join(process.cwd(), "public", "uploads", "products");

  await mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  await writeFile(join(uploadDir, filename), Buffer.from(bytes));

  const url = `/uploads/products/${filename}`;
  return NextResponse.json({ url });
}
