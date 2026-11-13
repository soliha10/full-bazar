import { useEffect, useMemo, useState } from "react";
import type { Product, ProductVariant } from "../../components/ProductCard";

/**
 * Tanlangan rang. Mahsulotning "ko'rinishi" (rasmlar, takliflar, narx) shu
 * rangga tegishli bo'ladi — qora telefon galereyasida ko'k rasmlar, ro'yxatida
 * faqat ko'k rangni sotayotgan do'kon chiqmaydi.
 *
 * Sukut bo'yicha — ENG ARZON rang (ro'yxatdagi birinchisi emas): katalog
 * kartasi mahsulotning barcha ranglar bo'yicha eng arzon narxini ko'rsatadi,
 * sahifa ochilganda ham aynan shu narx chiqishi kerak. Ilgari birinchi rang
 * tanlanardi va "boshqa ranglar" eng arzon bo'lsa narx kartadagidan farq qilardi.
 * Narx tarixi va do'konlar taqqoslanishi butun model bo'yicha qoladi.
 */
export function useColorVariant(product: Product | null) {
  const variants = useMemo<ProductVariant[]>(() => product?.variants ?? [], [product]);
  const [color, setColor] = useState<string | null | undefined>(undefined);

  // Boshqa mahsulotga o'tilganda tanlov tozalanadi
  useEffect(() => { setColor(undefined); }, [product?.id]);

  const cheapest = useMemo(() => variants.reduce<ProductVariant | null>(
    (best, v) => (v.price != null && (best?.price == null || v.price < best.price) ? v : best), null,
  ), [variants]);
  const active = variants.length
    ? (color !== undefined ? variants.find(v => v.color === color) : undefined) ?? cheapest ?? variants[0]
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
  return { variants: variants.length > 1 ? variants : [], active, cheapest, view, select: (c: string | null) => setColor(c) };
}
