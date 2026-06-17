import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const IMAGES: Record<string, string> = {
  "beauty":                        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80",
  "body-massage-oils":             "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&q=80",
  "chocolates":                    "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&q=80",
  "clothing":                      "https://images.unsplash.com/photo-1558171813-80283e1de24c?w=600&q=80",
  "dry-fruits-nuts":               "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&q=80",
  "electric-insect-killers":       "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
  "electronics":                   "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80",
  "hair-care":                     "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80",
  "hair-removal":                  "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&q=80",
  "health":                        "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&q=80",
  "kids-babies":                   "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=80",
  "kitchen":                       "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80",
  "kitchen-dining":                "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80",
  "laundry":                       "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=600&q=80",
  "mens-fashion-and-clothes":      "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=600&q=80",
  "perfumes":                      "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&q=80",
  "readymade":                     "https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=80",
  "skin-care":                     "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=600&q=80",
  "stationery-items":              "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80",
  "supplements":                   "https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80",
  "suppplement":                   "https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80",
  "toys":                          "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=600&q=80",
  "womens-fashion-and-clothes":    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80",
  "wood-decor":                    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80",
  "uncategorized":                 "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80",
  "batroom":                       "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80",
  "coffeetea":                     "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80",
  "make-up-make-up":               "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80",
};

async function main() {
  let updated = 0;
  for (const [slug, url] of Object.entries(IMAGES)) {
    const r = await db.category.updateMany({
      where: { slug, imageUrl: null },
      data: { imageUrl: url },
    });
    if (r.count > 0) { console.log(`✓ ${slug}`); updated++; }
  }
  console.log(`\nDone — ${updated} categories updated.`);
  await db.$disconnect();
}

main().catch(console.error);
