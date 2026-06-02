import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { getProductForEdit, getCategoriesForSelect, getBrandsForSelect, getVendorStore } from "@/lib/vendor/product-data";
import { getShippingSettings } from "@/lib/shipping";
import { ProductEditForm } from "@/components/vendor/product-edit-form";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const vendorStore = await getVendorStore(session.user.id);
  if (!vendorStore) redirect("/vendor");

  const [product, categories, brands, shippingSettings] = await Promise.all([
    getProductForEdit(params.id, vendorStore.id),
    getCategoriesForSelect(),
    getBrandsForSelect(),
    getShippingSettings(),
  ]);

  if (!product) notFound();

  return (
    <ProductEditForm
      product={product as any}
      categories={categories}
      brands={brands}
      shippingSettings={shippingSettings}
    />
  );
}
