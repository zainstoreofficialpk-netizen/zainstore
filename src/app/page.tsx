import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { dashboardHomeFor } from "@/lib/auth/permissions";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role) {
    redirect(dashboardHomeFor(session.user.role as "SUPER_ADMIN" | "VENDOR" | "CUSTOMER"));
  }
  redirect("/login");
}
