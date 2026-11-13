import { useLanguage } from '../../contexts/LanguageContext';
import { useFavorites } from '../../hooks/useFavorites';
import { useAuth } from '../../contexts/AuthContext';
import { usePriceWatch } from '../../hooks/usePriceWatch';
import { useCompare, MAX_COMPARE } from '../../contexts/CompareContext';
import { productPath } from '../../utils/slug';
import type { Product } from './types';

/** Kartaning ikkala ko'rinishi (grid/list) uchun umumiy holat va hisob-kitob */
export function useProductCard(product: Product, activeMarkets: string[]) {
  const { t } = useLanguage();
  const { toggle, isLiked } = useFavorites();
  const { user } = useAuth();
  const { toggle: toggleWatch, isWatched } = usePriceWatch();
  const { toggleCompare, isComparing, compareIds } = useCompare();
  const liked = isLiked(product.id);
  const watching = isWatched(product.id);
  const comparing = isComparing(product.id);
  const compareDisabled = !comparing && compareIds.length >= MAX_COMPARE;
  // Karta — bitta haqiqiy <a href> (ProductTile: nomdagi havola butun kartani
  // qoplaydi), qidiruv robotlari ham ko'radi; onClick navigatsiyasi shart emas.
  const href = productPath(product);

  const activeSet = new Set(activeMarkets.map(m => m.toLowerCase()));
  const sortedMarkets = [...(product.markets ?? [])].sort((a, b) => {
    const aActive = activeSet.has(a.source.toLowerCase()) ? 0 : 1;
    const bActive = activeSet.has(b.source.toLowerCase()) ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;
    return a.price - b.price;
  });
  const bestPrice = sortedMarkets[0]?.price ?? product.price;
  // Do'konlar orasidagi farq — haqiqiy eng arzon va eng qimmat narx bo'yicha
  // (sortedMarkets da filtrdagi do'konlar oldinda, tartib narx bo'yicha emas)
  const prices = (product.markets ?? []).map(m => m.price).filter(p => p > 0);
  const low = prices.length ? Math.min(...prices) : bestPrice;
  const high = prices.length ? Math.max(...prices) : bestPrice;
  const savings = high > low ? high - low : 0;
  const savingsPct = high > 0 ? Math.round((savings / high) * 100) : 0;
  const bestMarket = sortedMarkets[0];
  const compareTitle = compareDisabled
    ? t.common.compareLimit.replace('{{max}}', String(MAX_COMPARE))
    : t.common.compare;

  return {
    t, user, href,
    liked, watching, comparing, compareDisabled, compareTitle,
    toggleLike: () => toggle(product),
    toggleWatch: () => toggleWatch(product),
    toggleCompare: () => { if (!compareDisabled) toggleCompare(product.id); },
    sortedMarkets, bestPrice, savings, savingsPct, bestMarket,
  };
}

export type ProductCardState = ReturnType<typeof useProductCard>;
