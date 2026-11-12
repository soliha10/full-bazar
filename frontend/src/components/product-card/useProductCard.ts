import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useFavorites } from '../../hooks/useFavorites';
import { useAuth } from '../../contexts/AuthContext';
import { usePriceWatch } from '../../hooks/usePriceWatch';
import { useCompare, MAX_COMPARE } from '../../contexts/CompareContext';
import { productPath } from '../../utils/slug';
import type { Product } from './types';

/** Kartaning ikkala ko'rinishi (grid/list) uchun umumiy holat va hisob-kitob */
export function useProductCard(product: Product, activeMarkets: string[]) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toggle, isLiked } = useFavorites();
  const { user } = useAuth();
  const { toggle: toggleWatch, isWatched } = usePriceWatch();
  const { toggleCompare, isComparing, compareIds } = useCompare();
  const liked = isLiked(product.id);
  const watching = isWatched(product.id);
  const comparing = isComparing(product.id);
  const compareDisabled = !comparing && compareIds.length >= MAX_COMPARE;
  // Kartaning bosiladigan qismi <div onClick> edi — qidiruv robotlari bunday
  // "havola"ni ko'rmaydi, ya'ni katalogdan birorta mahsulot manzili ham
  // indeksga tushmaydi. Endi nom va CTA haqiqiy <a href> bo'ladi; karta
  // o'zining onClick'ini saqlab qoladi (butun karta bosiladigan bo'lib
  // qolishi uchun), lekin havola bosilganda hodisa yuqoriga chiqmaydi —
  // aks holda bir bosishda ikki marta navigatsiya bo'lardi.
  const href = productPath(product);
  const stop = (e: MouseEvent) => e.stopPropagation();

  const activeSet = new Set(activeMarkets.map(m => m.toLowerCase()));
  const sortedMarkets = [...(product.markets ?? [])].sort((a, b) => {
    const aActive = activeSet.has(a.source.toLowerCase()) ? 0 : 1;
    const bActive = activeSet.has(b.source.toLowerCase()) ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;
    return a.price - b.price;
  });
  const bestPrice = sortedMarkets[0]?.price ?? product.price;
  const worstPrice = sortedMarkets[sortedMarkets.length - 1]?.price;
  const savings = worstPrice && worstPrice > bestPrice ? worstPrice - bestPrice : 0;
  const bestMarket = sortedMarkets[0];
  const compareTitle = compareDisabled
    ? t.common.compareLimit.replace('{{max}}', String(MAX_COMPARE))
    : t.common.compare;

  return {
    t, user, href, stop, open: () => navigate(href),
    liked, watching, comparing, compareDisabled, compareTitle,
    toggleLike: () => toggle(product),
    toggleWatch: () => toggleWatch(product),
    toggleCompare: () => { if (!compareDisabled) toggleCompare(product.id); },
    sortedMarkets, bestPrice, savings, bestMarket,
  };
}

export type ProductCardState = ReturnType<typeof useProductCard>;
