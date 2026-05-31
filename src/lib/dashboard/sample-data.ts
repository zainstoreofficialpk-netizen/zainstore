import {
  BadgePercent,
  Boxes,
  CircleDollarSign,
  RefreshCcw,
  ShoppingCart,
  Store,
  Users,
  WalletCards,
} from "lucide-react";

export const adminStats = [
  { title: "Total Revenue", value: "PKR 18.4M", helper: "12.5% growth this month", icon: CircleDollarSign },
  { title: "Total Orders", value: "8,420", helper: "342 pending fulfillment", icon: ShoppingCart },
  { title: "Active Vendors", value: "286", helper: "14 pending approval", icon: Store },
  { title: "Products", value: "24,918", helper: "119 waiting review", icon: Boxes },
  { title: "Customers", value: "91,204", helper: "2,340 new this month", icon: Users },
  { title: "Commissions", value: "PKR 2.1M", helper: "Shipping/tax toggles enabled", icon: BadgePercent },
  { title: "Withdrawals", value: "PKR 860K", helper: "27 requests pending", icon: WalletCards },
  { title: "Refund Requests", value: "43", helper: "11 partial refunds", icon: RefreshCcw },
];

export const revenueSeries = [
  { label: "Jan", revenue: 980000, orders: 620, vendors: 180, customers: 7300 },
  { label: "Feb", revenue: 1210000, orders: 790, vendors: 194, customers: 8200 },
  { label: "Mar", revenue: 1460000, orders: 860, vendors: 208, customers: 9100 },
  { label: "Apr", revenue: 1720000, orders: 1080, vendors: 232, customers: 10400 },
  { label: "May", revenue: 2050000, orders: 1280, vendors: 286, customers: 12300 },
];

export const vendorRows = [
  ["Urban Loom", "Ayesha Khan", "42", "PKR 1.2M", "PKR 120K", "Active"],
  ["Gadget Yard", "Hamza Malik", "25", "PKR 920K", "PKR 92K", "Active"],
  ["Home Craft PK", "Sara Ali", "0", "PKR 0", "PKR 0", "Pending Review"],
  ["Metro Parts", "Bilal Ahmed", "318", "PKR 2.4M", "PKR 240K", "Suspended"],
];

export const orderRows = [
  ["ZS-10482", "Mina Shah", "Urban Loom", "PKR 8,499", "Paid", "Processing"],
  ["ZS-10481", "Omar Raza", "Gadget Yard", "PKR 12,999", "Paid", "Shipped"],
  ["ZS-10480", "Nida Khan", "Home Craft PK", "PKR 4,250", "Pending", "Pending"],
  ["ZS-10479", "Ali Noor", "Urban Loom", "PKR 2,999", "Refunded", "Refunded"],
];

export const refundRows = [
  ["RF-2201", "ZS-10479", "Urban Loom", "PKR 2,999", "Size issue", "Under Review"],
  ["RF-2200", "ZS-10451", "Gadget Yard", "PKR 1,500", "Partial refund", "Approved"],
  ["RF-2199", "ZS-10430", "Metro Parts", "PKR 7,400", "Damaged item", "Rejected"],
];

export const withdrawalRows = [
  ["WD-9182", "Urban Loom", "PKR 250,000", "Bank Transfer", "Weekly", "Requested"],
  ["WD-9181", "Gadget Yard", "PKR 180,000", "JazzCash", "Instant", "Paid"],
  ["WD-9180", "Metro Parts", "PKR 92,000", "EasyPaisa", "Monthly", "Rejected"],
];

export const couponRows = [
  ["WELCOME10", "Percentage", "10%", "5,000 uses", "All vendors", "Active"],
  ["FREESHIP", "Free Shipping", "PKR 0", "1,000 uses", "Karachi zone", "Active"],
  ["ELECTRO500", "Fixed", "PKR 500", "200 uses", "Gadget Yard", "Pending Review"],
];
