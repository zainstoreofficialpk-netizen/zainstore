"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";

type ActionResult = { success: true; message: string } | { success: false; error: string };

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized");
}

export async function uploadBannerImage(formData: FormData): Promise<{ success: true; url: string } | { success: false; error: string }> {
  await requireAdmin();
  const file = formData.get("file") as File | null;
  if (!file || !file.size) return { success: false, error: "No file provided." };
  if (!file.type.startsWith("image/")) return { success: false, error: "File must be an image." };
  if (file.size > 5 * 1024 * 1024) return { success: false, error: "Image must be under 5 MB." };

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const allowed = ["jpg", "jpeg", "png", "webp", "gif"];
  if (!allowed.includes(ext)) return { success: false, error: "Only JPG, PNG, WebP or GIF allowed." };

  const name = `banner-${randomBytes(8).toString("hex")}.${ext}`;
  const dir = join(process.cwd(), "public", "banners");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), Buffer.from(await file.arrayBuffer()));

  return { success: true, url: `/banners/${name}` };
}

export async function createBanner(data: {
  title: string;
  imageUrl: string;
  linkUrl?: string;
  placement: string;
  startsAt?: string;
  endsAt?: string;
}): Promise<ActionResult> {
  await requireAdmin();
  if (!data.title?.trim()) return { success: false, error: "Title is required." };
  if (!data.imageUrl?.trim()) return { success: false, error: "Image URL is required." };

  await db.banner.create({
    data: {
      title: data.title.trim(),
      imageUrl: data.imageUrl.trim(),
      linkUrl: data.linkUrl?.trim() || null,
      placement: data.placement || "slider",
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
    },
  });

  revalidatePath("/admin/banners");
  return { success: true, message: "Banner created." };
}

export async function updateBanner(
  id: string,
  data: { title?: string; imageUrl?: string; linkUrl?: string; placement?: string },
): Promise<ActionResult> {
  await requireAdmin();
  await db.banner.update({
    where: { id },
    data: {
      title: data.title?.trim(),
      imageUrl: data.imageUrl?.trim(),
      linkUrl: data.linkUrl?.trim() || null,
      placement: data.placement,
    },
  });
  revalidatePath("/admin/banners");
  return { success: true, message: "Banner updated." };
}

export async function toggleBannerActive(id: string, active: boolean): Promise<ActionResult> {
  await requireAdmin();
  await db.banner.update({ where: { id }, data: { active } });
  revalidatePath("/admin/banners");
  return { success: true, message: active ? "Banner activated." : "Banner deactivated." };
}

export async function deleteBanner(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.banner.delete({ where: { id } });
  revalidatePath("/admin/banners");
  return { success: true, message: "Banner deleted." };
}
