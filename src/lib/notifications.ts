"use server";

import { db } from "@/lib/db";
import { NotificationType } from "@prisma/client";

export async function createNotification({
  userId,
  type,
  title,
  body,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  url?: string;
}) {
  return db.notification.create({
    data: { userId, type, title, body },
  });
}
