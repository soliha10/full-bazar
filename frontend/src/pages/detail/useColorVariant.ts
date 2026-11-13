import { useEffect, useMemo, useState } from "react";
import type { Product, ProductVariant } from "../../components/ProductCard";

/**
 * Tanlangan rang. Mahsulotning "ko'rinishi" (rasmlar, takliflar, narx) shu
 * rangga tegishli bo'ladi — qora telefon galereyasida ko'k rasmlar, ro'yxatida
 * faqat ko'k rangni sotayotgan do'kon chiqmaydi. Sukut bo'yicha — eng arzon rang.
 * Narx tarixi va do'konlar taqqoslanishi butun model bo'yicha qoladi.
 */
export function useColorVariant(product: Product | null) {
  const variants = useMemo<ProductVariant[]>(() => product?.variants ?? [], [product]);
  const [color, setColor] = useState<string | null | undefined>(undefined);

  // Boshqa mahsulotga o'tilganda tanlov tozalanadi
  useEffect(() => { setColor(undefined); }, [product?.id]);

  const active = variants.length
    ? variants.find(v => v.color === color) ?? variants[0]
    : null;

  const view = useMemo<Product | null>(() => {
    if (!product || !active) return product;
    return {
      ...product,
      images: active.images.length ? active.images : product.images,
      image: active.images[0] || product.image,
      markets: active.offers.length ? active.offers : product.markets,
      price: active.price ?? product.price,
    };
  }, [product, active]);

  // Bitta variant bo'lsa tanlov ko'rsatilmaydi
  return { variants: variants.length > 1 ? variants : [], active, view, select: (c: string | null) => setColor(c) };
}
