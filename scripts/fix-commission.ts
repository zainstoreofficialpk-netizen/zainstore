import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  const order = await db.order.findUnique({
    where: { orderNumber: "ZS-MQGN387G-JJI2" },
    include: { items: true },
  });

  if (!order) { console.log("Order not found"); return; }

  for (const item of order.items) {
    const lineTotal = Number(item.lineTotal);
    const commission = Math.round(lineTotal * 10 / 100); // 10% global rate
    await db.orderItem.update({
      where: { id: item.id },
      data: { commissionTotal: commission },
    });
    console.log(`Item: ${item.name}`);
    console.log(`  Line Total:    PKR ${lineTotal.toLocaleString()}`);
    console.log(`  Commission:    PKR ${commission.toLocaleString()} (10%)`);
    console.log(`  Vendor Payout: PKR ${(lineTotal - commission).toLocaleString()}`);
  }

  console.log("\n✅ Commission applied to order ZS-MQGN387G-JJI2");
  await db.$disconnect();
}

main().catch(console.error);
