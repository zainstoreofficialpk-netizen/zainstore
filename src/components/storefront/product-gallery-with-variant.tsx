"use client";

import { ProductGallery, type GalleryImage } from "./product-gallery";
import { useProductVariant } from "./product-variant-context";

export function ProductGalleryWithVariant({
  images,
  productName,
  videoUrl,
}: {
  images: GalleryImage[];
  productName: string;
  videoUrl?: string | null;
}) {
  const { selectedVariant } = useProductVariant();

  // Rule: if the selected variant has its own image, show it first; otherwise
  // fall back to the product's normal gallery, completely unchanged.
  const displayImages: GalleryImage[] = selectedVariant?.imageUrl
    ? [
        { id: `variant-${selectedVariant.id}`, url: selectedVariant.imageUrl, alt: productName },
        ...images.filter((img) => img.url !== selectedVariant.imageUrl),
      ]
    : images;

  return (
    <ProductGallery
      // Remounts (and resets zoom/active-index state) whenever the effective image set changes
      key={selectedVariant?.imageUrl ?? "base"}
      images={displayImages}
      productName={productName}
      videoUrl={videoUrl}
    />
  );
}
