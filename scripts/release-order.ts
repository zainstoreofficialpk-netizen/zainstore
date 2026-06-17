import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  // Set deliveredAt to 8 days ago — past the 7-day hold window
  const eightDaysAgo = new Date();
  eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

  const order = await db.order.update({
    where: { orderNumber: "ZS-MQGN387G-JJI2" },
    data: { deliveredAt: eightDaysAgo },
    select: { orderNumber: true, status: true, paymentStatus: true, deliveredAt: true, grandTotal: true },
  });

  console.log("Updated order:");
  console.log(`  Order:       ${order.orderNumber}`);
  console.log(`  Status:      ${order.status}`);
  console.log(`  Payment:     ${order.paymentStatus}`);
  console.log(`  DeliveredAt: ${order.deliveredAt?.toISOString()} (8 days ago)`);
  console.log(`  Grand Total: PKR ${order.grandTotal}`);
  console.log("\n✅ Earnings are now past the 7-day hold — vendor can see available balance.");
  await db.$disconnect();
}

main().catch(console.error);
