import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { uploadToCloudinary } from "@/lib/cloudinary";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 30 * 1024 * 1024;

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

  try {
    const url = await uploadToCloudinary(file, "products");
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
