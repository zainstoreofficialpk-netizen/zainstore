import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const order = await db.order.findUnique({
    where: { orderNumber: "ZS-MQGN387G-JJI2" },
    include: {
      items: { include: { product: { select: { name: true } } } },
      customer: { select: { name: true, email: true } },
    },
  });
  console.log(JSON.stringify(order, null, 2));
  await db.$disconnect();
}
main().catch(console.error);
