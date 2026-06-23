import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { v2 as cloudinary } from "cloudinary";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const WP_IP = "77.37.79.214";

async function uploadUrl(url: string): Promise<string> {
  // Fetch image ourselves with Host header (shared hosting requires it)
  const pathname = new URL(url).pathname;
  const res = await fetch(`http://${WP_IP}${pathname}`, {
    headers: { Host: "zainstore.pk" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "zainstore/products", resource_type: "image" },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error("Upload failed"));
        resolve(result.secure_url);
      },
    ).end(buffer);
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const total = await db.productImage.count({
    where: { url: { contains: "/wp-content/" } },
  });

  return NextResponse.json({ total });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { offset = 0, batchSize = 20 } = await req.json();

  const images = await db.productImage.findMany({
    where: { url: { contains: "/wp-content/" } },
    select: { id: true, url: true },
    skip: offset,
    take: batchSize,
  });

  let success = 0;
  let failed = 0;

  for (const img of images) {
    try {
      const newUrl = await uploadUrl(img.url);
      await db.productImage.update({ where: { id: img.id }, data: { url: newUrl } });
      success++;
    } catch {
      failed++;
    }
  }

  const remaining = await db.productImage.count({
    where: { url: { contains: "/wp-content/" } },
  });

  return NextResponse.json({ success, failed, remaining, done: remaining === 0 });
}
