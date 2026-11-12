import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import type { Product } from "../../components/ProductCard";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatSum } from "../../utils/productMapper";
import { productPath } from "../../utils/slug";
import { FALLBACK_IMAGE } from "./useImageGallery";

/** ── Saved (liked) products ── */
export function SavedProducts({ favorites, onToggle }: { favorites: Product[]; onToggle: (p: Product) => void }) {
  const { t } = useLanguage();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-2 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {t.detailPage.savedProducts}
        </h2>
        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
          {t.detailPage.itemsCount.replace('{{count}}', String(favorites.length))}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {favorites.map((p) => (
          <Link
            key={p.id}
            to={productPath(p)}
            className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
          >
            <div className="relative">
              <img
                src={p.image}
                alt={p.name}
                className="w-full aspect-square object-contain rounded-xl bg-gray-50 dark:bg-gray-800 p-2 mb-2"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=No+image'; }}
              />
              <button
                onClick={(e) => { e.preventDefault(); onToggle(p); }}
                className="absolute top-1.5 right-1.5 w-7 h-7 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity"
              >
                <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
              </button>
            </div>
            <p className="text-xs font-bold text-gray-800 dark:text-white line-clamp-2 mb-1 leading-snug">{p.name}</p>
            <p className="text-xs font-semibold text-gray-900 dark:text-white">{formatSum(p.price)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** ── Similar products ── shu brend va yaqin narxdagi modellar. */
export function SimilarProducts({ loading, products, bestPrice }: { loading: boolean; products: Product[]; bestPrice: number }) {
  const { t } = useLanguage();

  return (
    <section aria-labelledby="similar-title" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 mt-8">
      <h2 id="similar-title" className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
        {t.detailPage.similarProducts}
      </h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4">{t.detailPage.similarSubtitle}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {loading
          ? Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse h-56" aria-hidden="true" />
            ))
          : products.map((p) => {
              const diff = p.price - bestPrice;
              const stores = p.markets?.length ?? 0;
              return (
                <Link
                  key={p.id}
                  to={productPath(p)}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 hover:border-gray-300 dark:hover:border-gray-700 transition-colors flex flex-col"
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    className="w-full aspect-square object-contain rounded-xl bg-gray-50 dark:bg-gray-800 p-2 mb-2"
                    onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                  />
                  <p className="text-xs font-medium text-gray-800 dark:text-white line-clamp-2 mb-1.5 leading-snug flex-1">{p.name}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatSum(p.price)}</p>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[11px]">
                    {bestPrice > 0 && Math.abs(diff) >= 1000 ? (
                      <span className={diff < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}>
                        {(diff < 0 ? t.detailPage.similarCheaper : t.detailPage.similarPricier).replace('{{amount}}', formatSum(Math.abs(diff)))}
                      </span>
                    ) : <span />}
                    {stores > 1 && (
                      <span className="text-gray-400">{t.home.storesTag.replace('{{count}}', String(stores))}</span>
                    )}
                  </div>
                </Link>
              );
            })}
      </div>
    </section>
  );
}
