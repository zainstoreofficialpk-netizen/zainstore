import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const cats = await db.category.findMany({ 
    select: { id: true, name: true, slug: true, imageUrl: true },
    orderBy: { name: "asc" }
  });
  console.log(JSON.stringify(cats, null, 2));
  await db.$disconnect();
}

main().catch(console.error);
