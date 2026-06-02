import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { getCategoriesForSelect, getBrandsForSelect, getVendorStore } from "@/lib/vendor/product-data";
import { getShippingSettings } from "@/lib/shipping";
import { ProductWizard } from "@/components/vendor/product-wizard";

export default async function NewProductPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const vendorStore = await getVendorStore(session.user.id);
  if (!vendorStore?.store) redirect("/vendor/store");

  const [categories, brands, shippingSettings] = await Promise.all([
    getCategoriesForSelect(),
    getBrandsForSelect(),
    getShippingSettings(),
  ]);

  return <ProductWizard categories={categories} brands={brands} shippingSettings={shippingSettings} />;
}
