import type { UserRole } from "@prisma/client";

export const permissions = {
  SUPER_ADMIN: ["*"],
  VENDOR: [
    "vendor:dashboard",
    "vendor:store",
    "vendor:products",
    "vendor:orders",
    "vendor:earnings",
    "vendor:withdrawals",
    "vendor:reviews",
  ],
  CUSTOMER: [
    "customer:dashboard",
    "customer:orders",
    "customer:addresses",
    "customer:wishlist",
    "customer:reviews",
  ],
} satisfies Record<UserRole, string[]>;

export function can(role: UserRole, permission: string) {
  return permissions[role].includes("*") || permissions[role].includes(permission);
}

export function dashboardHomeFor(role: UserRole) {
  if (role === "SUPER_ADMIN") return "/admin";
  if (role === "VENDOR") return "/vendor";
  return "/customer";
}
