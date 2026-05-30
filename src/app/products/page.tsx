import { ProductCard } from "@/components/product-card";
import { getFeaturedProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await getFeaturedProducts();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Products</h1>
        <p className="mt-2 text-[var(--muted)]">Catalog items from approved marketplace vendors.</p>
      </div>
      {products.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-[var(--line)] bg-white p-8 text-center text-[var(--muted)]">
          No products found.
        </div>
      )}
    </main>
  );
}
