import { Heart, Share2, ChevronLeft } from "lucide-react";
import type { Product } from "../../components/ProductCard";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatSum } from "../../utils/productMapper";
import { trackStoreClick } from "../../services/tracking";
import type { PriceStats } from "./priceStats";

/** Mobil tepadagi panel: orqaga, sevimlilarga qo'shish, ulashish. */
export function MobileTopBar({ product, liked, onBack, onToggleLike }: {
  product: Product;
  liked: boolean;
  onBack: () => void;
  onToggleLike: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-4 py-3 sticky top-0 z-50 flex items-center justify-between">
      <button
        onClick={onBack}
        data-tip={t.detailPage.actionBack} aria-label={t.detailPage.actionBack}
        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 active:scale-90 transition-all"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <span className="font-bold text-gray-900 dark:text-white text-sm truncate max-w-[200px]">
        {t.detail.productDetails}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleLike}
          data-tip={liked ? t.detailPage.actionUnfavorite : t.detailPage.actionFavorite}
          aria-label={liked ? t.detailPage.actionUnfavorite : t.detailPage.actionFavorite}
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 active:scale-90 transition-all"
        >
          <Heart className={`w-4.5 h-4.5 transition-all duration-200 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-500 dark:text-gray-400'}`} />
        </button>
        <button
          onClick={() => navigator.share?.({ title: product?.name, url: window.location.href })}
          data-tip={t.detailPage.actionShare} aria-label={t.detailPage.actionShare}
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 active:scale-90 transition-all"
        >
          <Share2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
    </div>
  );
}

/** Mobil pastki yopishqoq panel: tanlangan do'kon narxi va do'konga o'tish. */
export function MobileBuyBar({ product, selectedMarket }: { product: Product; selectedMarket: PriceStats['sortedMarkets'][number] | undefined }) {
  const { t } = useLanguage();
  return (
    <div
      className="md:hidden fixed bottom-[60px] left-0 right-0 bg-white/97 dark:bg-gray-900/97 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 px-4 py-3 z-40 flex items-center gap-4"
      style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}
    >
      <div className="flex flex-col flex-1">
        <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide leading-none mb-1">
          {t.detail.fromPrice}
        </span>
        <span className="text-xl font-semibold text-gray-900 dark:text-white leading-none">
          {formatSum(selectedMarket?.price || product.price)}
        </span>
      </div>
      <a
        href={selectedMarket?.url}
        target="_blank"
        onClick={() => { if (selectedMarket) trackStoreClick(product.id, selectedMarket.source, selectedMarket.price); }}
        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-7 py-3.5 rounded-xl font-medium text-sm transition-colors whitespace-nowrap"
      >
        {t.detail.goToShop}
      </a>
    </div>
  );
}
