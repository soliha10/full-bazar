import { useState, useEffect, useMemo, useRef } from "react";
import type { Product } from "../../components/ProductCard";

export const FALLBACK_IMAGE = 'https://placehold.co/600x600/f5f3ff/7c3aed?text=📱';

/**
 * Rasm galereyasi holati. Mobil ko'rinishda rasmlar gorizontal aylanadi —
 * qaysi rasm ko'rinib turganini IntersectionObserver aniqlaydi, nuqtalar va
 * desktopdagi miniatyuralar shu indeksga bog'langan.
 */
export function useImageGallery(product: Product | null) {
  const [selectedImage, setSelectedImage] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const images = useMemo(() => {
    if (!product) return [FALLBACK_IMAGE];
    const list = product.images && product.images.length > 0
      ? product.images.filter((img) => img && img !== "")
      : [product.image].filter((img) => img && img !== "");
    return list.length > 0 ? list : [FALLBACK_IMAGE];
  }, [product]);

  // Rang almashganda yangi galereya birinchi rasmdan boshlanadi
  useEffect(() => { setSelectedImage(0); }, [images]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = imageRefs.current.indexOf(entry.target as HTMLDivElement);
            if (idx !== -1) setSelectedImage(idx);
          }
        });
      },
      { root: scrollContainerRef.current, threshold: 0.5 },
    );
    imageRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [images]);

  const goToImage = (idx: number) => {
    const total = images.length;
    const next = ((idx % total) + total) % total;
    setSelectedImage(next);
    const el = imageRefs.current[next];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  return { images, selectedImage, setSelectedImage, goToImage, scrollContainerRef, imageRefs };
}

export type Gallery = ReturnType<typeof useImageGallery>;
