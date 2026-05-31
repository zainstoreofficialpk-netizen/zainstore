import { ModulePage } from "@/components/dashboard/module-page";

const rows = [
  ["Mina Shah", "mina@example.com", "18", "PKR 142,000", "3", "Active"],
  ["Omar Raza", "omar@example.com", "9", "PKR 88,400", "1", "Active"],
  ["Nida Khan", "nida@example.com", "1", "PKR 4,250", "0", "Pending Review"],
];

export default function CustomersPage() {
  return (
    <ModulePage
      title="Customer Management"
      description="Review customer activity, orders, addresses, wishlists, reviews, notifications, and support history."
      columns={["Customer", "Email", "Orders", "Spend", "Tickets", "Status"]}
      rows={rows}
      capabilities={["Customer Activity", "Address Book", "Wishlist", "Support History"]}
    />
  );
}
