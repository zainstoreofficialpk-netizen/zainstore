import {
  BadgePercent,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  CircleDollarSign,
  CreditCard,
  FileBarChart,
  Home,
  LifeBuoy,
  PackageCheck,
  RefreshCcw,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  TicketPercent,
  Truck,
  Users,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const adminNavigation: NavItem[] = [
  { title: "Overview", href: "/admin", icon: Home },
  { title: "Vendors", href: "/admin/vendors", icon: Store },
  { title: "Customers", href: "/admin/customers", icon: Users },
  { title: "Products", href: "/admin/products", icon: Boxes },
  { title: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { title: "Refunds", href: "/admin/refunds", icon: RefreshCcw },
  { title: "Commissions", href: "/admin/commissions", icon: BadgePercent },
  { title: "Withdrawals", href: "/admin/withdrawals", icon: WalletCards },
  { title: "Coupons", href: "/admin/coupons", icon: TicketPercent },
  { title: "Shipping", href: "/admin/shipping", icon: Truck },
  { title: "Memberships", href: "/admin/memberships", icon: CreditCard },
  { title: "Reports", href: "/admin/reports", icon: FileBarChart },
  { title: "Notifications", href: "/admin/notifications", icon: Bell },
  { title: "Support", href: "/admin/support", icon: LifeBuoy },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

export const vendorNavigation: NavItem[] = [
  { title: "Overview", href: "/vendor", icon: Home },
  { title: "Store Profile", href: "/vendor/store", icon: Building2 },
  { title: "Products", href: "/vendor/products", icon: PackageCheck },
  { title: "Orders", href: "/vendor/orders", icon: ShoppingCart },
  { title: "Earnings", href: "/vendor/earnings", icon: CircleDollarSign },
  { title: "Withdrawals", href: "/vendor/withdrawals", icon: WalletCards },
  { title: "Reviews", href: "/vendor/reviews", icon: ShieldCheck },
  { title: "Analytics", href: "/vendor/analytics", icon: BarChart3 },
];

export const customerNavigation: NavItem[] = [
  { title: "Overview", href: "/customer", icon: Home },
  { title: "Orders", href: "/customer/orders", icon: ShoppingCart },
  { title: "Addresses", href: "/customer/addresses", icon: Building2 },
  { title: "Wishlist", href: "/customer/wishlist", icon: PackageCheck },
  { title: "Reviews", href: "/customer/reviews", icon: ShieldCheck },
  { title: "Notifications", href: "/customer/notifications", icon: Bell },
  { title: "Settings", href: "/customer/settings", icon: Settings },
];
