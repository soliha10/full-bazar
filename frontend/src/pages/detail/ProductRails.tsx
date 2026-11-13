import { Heart } from "lucide-react";
import type { Product } from "../../components/ProductCard";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatSum } from "../../utils/productMapper";
import { productPath } from "../../utils/slug";
import { ProductTile, ProductTileSkeleton, TileAction } from "../../components/product-card/ProductTile";

// Gorizontal qatordagi karta kengligi: mobilda 160px, lg da 6 tasi bir qatorda
const RAIL_ITEM = "w-40 lg:w-[calc((100%-50px)/6)] shrink-0";

/** ── Saved (liked) products ── */
export function SavedProducts({ favorites, onToggle }: { favorites: Product[]; onToggle: (p: Product) => void }) {
  const { t } = useLanguage();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-2 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {t.detailPage.savedProducts}
        </h2>
        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 glass-soft px-2.5 py-1 rounded-full">
          {t.detailPage.itemsCount.replace('{{count}}', String(favorites.length))}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {favorites.map((p) => (
          <ProductTile key={p.id} size="sm" to={productPath(p)} name={p.name} image={p.image} price={formatSum(p.price)}
            actions={(
              <TileAction on label={t.detailPage.actionUnfavorite} onClick={() => onToggle(p)}>
                <Heart className="w-3.5 h-3.5 fill-current" />
              </TileAction>
            )} />
        ))}
      </div>
    </div>
  );
}

/** ── Similar products ── shu brend va yaqin narxdagi modellar. */
export function SimilarProducts({ loading, products, bestPrice }: { loading: boolean; products: Product[]; bestPrice: number }) {
  const { t } = useLanguage();

  return (
    <section id="similar" aria-labelledby="similar-title" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 mt-6">
      <h2 id="similar-title" className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
        {t.detailPage.similarProducts}
      </h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-3">{t.detailPage.similarSubtitle}</p>
      {/* Bitta qator, gorizontal aylantiriladi — soni ustunlarga bo'linmasa ham "yetim" kartalar qolmaydi */}
      <div className="flex gap-2.5 overflow-x-auto snap-x pb-1 [scrollbar-width:thin]">
        {loading
          ? Array.from({ length: 6 }, (_, i) => <ProductTileSkeleton key={i} size="sm" ratio="wide" className={RAIL_ITEM} />)
          : products.map((p) => {
              const diff = p.price - bestPrice;
              const stores = p.markets?.length ?? 0;
              return (
                <ProductTile key={p.id} size="sm" ratio="wide" className={`${RAIL_ITEM} snap-start`}
                  to={productPath(p)} name={p.name} image={p.image} price={formatSum(p.price)}
                  meta={(
                    <span className="flex w-full items-center justify-between gap-2">
                      {bestPrice > 0 && Math.abs(diff) >= 1000 ? (
                        <span className={diff < 0 ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                          {(diff < 0 ? t.detailPage.similarCheaper : t.detailPage.similarPricier).replace('{{amount}}', formatSum(Math.abs(diff)))}
                        </span>
                      ) : <span />}
                      {stores > 1 && <span className="text-gray-400">{t.home.storesTag.replace('{{count}}', String(stores))}</span>}
                    </span>
                  )} />
              );
            })}
      </div>
    </section>
  );
}
