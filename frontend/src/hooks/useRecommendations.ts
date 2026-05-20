import { useMemo } from 'react';
import { Product } from '../components/ProductCard';
import { useFavorites } from './useFavorites';
import { useAuth } from '../contexts/AuthContext';

/**
 * Content-based recommendation engine (frontend-only, no backend needed).
 *
 * Scoring formula per product:
 *   brand_match      × 0.30
 *   price_proximity  × 0.30  (gaussian decay around user's avg liked price)
 *   rating_score     × 0.20
 *   market_overlap   × 0.10
 *   profile_category × 0.10  (matches user's preferred categories)
 *
 * Returns `candidates` sorted by score descending, excluding already-liked products.
 * Falls back to top-rated products when no liked items or profile data exist.
 */
export function useRecommendations(allProducts: Product[], limit = 8): Product[] {
  const { favorites } = useFavorites();
  const { user } = useAuth();

  return useMemo(() => {
    const likedIds = new Set(favorites.map(p => String(p.id)));
    const candidates = allProducts.filter(p => !likedIds.has(String(p.id)));

    if (candidates.length === 0) return [];

    // ── Build user signal from liked products + profile ──────────────────────
    const likedBrands = new Map<string, number>();
    const likedMarkets = new Map<string, number>();
    let totalPrice = 0;
    let priceCount = 0;

    for (const p of favorites) {
      const brand = extractBrand(p.name);
      if (brand) likedBrands.set(brand, (likedBrands.get(brand) ?? 0) + 1);
      for (const m of p.markets ?? []) {
        likedMarkets.set(m.source.toLowerCase(), (likedMarkets.get(m.source.toLowerCase()) ?? 0) + 1);
      }
      totalPrice += p.price;
      priceCount++;
    }

    // Merge profile preferred brands into signal
    for (const b of user?.profile.preferredBrands ?? []) {
      likedBrands.set(b, (likedBrands.get(b) ?? 0) + 0.5);
    }

    const avgPrice = priceCount > 0 ? totalPrice / priceCount : 0;

    // Budget level price anchor when no liked products
    const budgetAnchor: Record<string, number> = {
      budget: 2_000_000,
      mid: 5_000_000,
      premium: 12_000_000,
    };
    const priceAnchor = avgPrice > 0
      ? avgPrice
      : budgetAnchor[user?.profile.budgetLevel ?? 'mid'];

    const preferredCategories = new Set(
      (user?.profile.preferredCategories ?? []).map(c => c.toLowerCase()),
    );

    const hasFavorites = favorites.length > 0;
    const hasProfile = (user?.profile.preferredBrands.length ?? 0) > 0
      || (user?.profile.preferredCategories.length ?? 0) > 0;

    // No signal at all — return top-rated
    if (!hasFavorites && !hasProfile) {
      return [...candidates].sort((a, b) => b.rating - a.rating).slice(0, limit);
    }

    // ── Score each candidate ──────────────────────────────────────────────────
    const scored = candidates.map(p => {
      // 1. Brand match (0–1)
      const brand = extractBrand(p.name);
      const brandCount = brand ? (likedBrands.get(brand) ?? 0) : 0;
      const maxBrandCount = Math.max(...likedBrands.values(), 1);
      const brandScore = brandCount / maxBrandCount;

      // 2. Price proximity — gaussian decay: score=1 at exact match, 0.5 at ±50%
      const priceDelta = Math.abs(p.price - priceAnchor) / (priceAnchor || 1);
      const priceScore = Math.exp(-2 * priceDelta * priceDelta);

      // 3. Rating (0–1, normalised from 0–5)
      const ratingScore = Math.min(p.rating / 5, 1);

      // 4. Market overlap (0–1)
      const productMarkets = new Set((p.markets ?? []).map(m => m.source.toLowerCase()));
      let marketOverlap = 0;
      if (likedMarkets.size > 0) {
        for (const m of productMarkets) {
          if (likedMarkets.has(m)) marketOverlap++;
        }
        marketOverlap = Math.min(marketOverlap / likedMarkets.size, 1);
      }

      // 5. Category preference (0 or 1)
      const cat = (p.category ?? '').toLowerCase();
      const catScore = preferredCategories.size > 0
        ? (preferredCategories.has(cat) || preferredCategories.has(normCat(cat)) ? 1 : 0)
        : 0.5; // neutral when no preference set

      const total =
        brandScore  * 0.30 +
        priceScore  * 0.30 +
        ratingScore * 0.20 +
        marketOverlap * 0.10 +
        catScore    * 0.10;

      return { product: p, score: total };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.product);
  }, [allProducts, favorites, user]);
}

function extractBrand(name: string): string | null {
  const brands = [
    'Apple', 'Samsung', 'Xiaomi', 'Redmi', 'Poco', 'Honor',
    'Vivo', 'Oppo', 'Realme', 'Tecno', 'Infinix',
  ];
  const lower = name.toLowerCase();
  return brands.find(b => lower.includes(b.toLowerCase())) ?? null;
}

function normCat(cat: string): string {
  if (cat === 'smartphones') return 'telefonlar';
  if (cat === 'phones') return 'telefonlar';
  return cat;
}
