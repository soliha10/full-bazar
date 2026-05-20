import { useState, useCallback } from "react";
import { Product } from "../components/ProductCard";

const KEY = "bazar_favorites";

function read(): Product[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Product[]>(read);

  const toggle = useCallback((product: Product) => {
    setFavorites((prev) => {
      const next = prev.some((p) => p.id === product.id)
        ? prev.filter((p) => p.id !== product.id)
        : [product, ...prev];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isLiked = useCallback(
    (id: string | number) => favorites.some((p) => p.id === id),
    [favorites],
  );

  return { favorites, toggle, isLiked };
}
