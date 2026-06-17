import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // Clear imageUrls that point to the old WordPress site (likely broken)
  const result = await db.category.updateMany({
    where: {
      imageUrl: {
        contains: "zainstore.pk/wp-content/",
      },
    },
    data: { imageUrl: null },
  });
  console.log(`Cleared ${result.count} broken WordPress image URLs.`);

  const remaining = await db.category.findMany({
    where: { imageUrl: { not: null } },
    select: { name: true, imageUrl: true },
  });
  console.log("\nCategories still with images:");
  remaining.forEach(c => console.log(`  ${c.name}: ${c.imageUrl}`));

  await db.$disconnect();
}

main().catch(console.error);
