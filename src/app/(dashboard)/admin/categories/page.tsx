import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { CategoriesManager } from "@/components/admin/categories-manager";

export default async function CategoriesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const categories = await db.category.findMany({
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { products: true, children: true } },
    },
  });

  return <CategoriesManager categories={categories} />;
}
