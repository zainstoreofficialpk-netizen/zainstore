import { ModulePage } from "@/components/dashboard/module-page";

const rows = [
  ["TCK-2001", "Mina Shah", "Urban Loom", "Refund dispute", "High", "Open"],
  ["TCK-2000", "Gadget Yard", "Admin", "Payout method", "Normal", "Pending Vendor"],
  ["TCK-1999", "Omar Raza", "Gadget Yard", "Delivery delay", "Normal", "Resolved"],
];

export default function SupportPage() {
  return (
    <ModulePage
      title="Support & Communication"
      description="Central inbox for vendor communication, customer support, announcements, message history, and read/unread tracking."
      columns={["Ticket", "Requester", "Vendor", "Subject", "Priority", "Status"]}
      rows={rows}
      capabilities={["Inbox", "Chat", "Announcements", "Read Receipts"]}
    />
  );
}
