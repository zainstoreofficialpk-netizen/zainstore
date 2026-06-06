import {
  BadgePercent,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  CircleDollarSign,
  FileBarChart,
  FolderTree,
  Home,
  LifeBuoy,
  MessageSquare,
  PackageCheck,
  RefreshCcw,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  Tag,
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
  { title: "Categories", href: "/admin/categories", icon: FolderTree },
  { title: "Brands", href: "/admin/brands", icon: Tag },
  { title: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { title: "Refunds", href: "/admin/refunds", icon: RefreshCcw },
  { title: "Commissions", href: "/admin/commissions", icon: BadgePercent },
  { title: "Withdrawals", href: "/admin/withdrawals", icon: WalletCards },
  { title: "Coupons", href: "/admin/coupons", icon: TicketPercent },
  { title: "Reviews", href: "/admin/reviews", icon: ShieldCheck },
  { title: "Shipping", href: "/admin/shipping", icon: Truck },
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
  { title: "Coupons", href: "/vendor/coupons", icon: TicketPercent },
  { title: "Earnings", href: "/vendor/earnings", icon: CircleDollarSign },
  { title: "Withdrawals", href: "/vendor/withdrawals", icon: WalletCards },
  { title: "Reviews", href: "/vendor/reviews", icon: ShieldCheck },
  { title: "Analytics", href: "/vendor/analytics", icon: BarChart3 },
  { title: "Messages", href: "/vendor/messages", icon: MessageSquare },
  { title: "Notifications", href: "/vendor/notifications", icon: Bell },
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
