import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { getProductForReview } from "@/lib/admin/product-approval-data";
import { ProductReviewPanel } from "@/components/admin/product-review-panel";

export default async function AdminProductReviewPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const product = await getProductForReview(params.id);
  if (!product) notFound();

  return (
    <ProductReviewPanel
      product={{
        ...product,
        price: Number(product.price),
        salePrice: product.salePrice ? Number(product.salePrice) : null,
        costPrice: product.costPrice ? Number(product.costPrice) : null,
        taxRate: product.taxRate ? Number(product.taxRate) : null,
        weight: product.weight ? Number(product.weight) : null,
        length: product.length ? Number(product.length) : null,
        width: product.width ? Number(product.width) : null,
        height: product.height ? Number(product.height) : null,
        commissionValue: product.commissionValue ? Number(product.commissionValue) : null,
        variants: product.variants.map((v) => ({
          ...v,
          price: v.price ? Number(v.price) : null,
          salePrice: v.salePrice ? Number(v.salePrice) : null,
          options: v.options as Record<string, string>,
        })),
      }}
    />
  );
}
