import { Star, Heart, Scale } from "lucide-react";
import type { Product } from "../../components/ProductCard";
import { useLanguage } from "../../contexts/LanguageContext";

/** Sarlavha va meta: kategoriya, mavjudlik, nom, solishtirish/sevimli tugmalari, reyting. */
export function ProductHeading({ product, liked, inCompare, onToggleLike, onToggleCompare }: {
  product: Product;
  liked: boolean;
  inCompare: boolean;
  onToggleLike: () => void;
  onToggleCompare: () => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-gray-500 dark:text-gray-400 text-xs">
          {(t.detail.categories as any)[(product.category ?? '').toLowerCase()] ?? product.category}
        </span>
        {product.inStock && (
          <span className="text-emerald-600 dark:text-emerald-400 text-xs">
            · {t.detail.inStock}
          </span>
        )}
      </div>

      <div className="flex items-start gap-3">
        <h1 className="flex-1 text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight leading-tight">
          {product.name}
        </h1>
        {/* Solishtirishga qo'shish — sayt oqimining markazi: avval
            xususiyatlarni yonma-yon ko'rib, keyin eng arzon do'konni
            tanlash. Ilgari bu tugma faqat katalogdagi kartada bor edi,
            ya'ni mahsulot sahifasiga kirgan odam oqimdan chiqib qolardi. */}
        <button
          onClick={onToggleCompare}
          title={inCompare ? t.detailPage.removeFromCompare : t.detailPage.addToCompare}
          className={`mt-1 w-10 h-10 shrink-0 flex items-center justify-center rounded-full border transition-colors ${
            inCompare
              ? 'border-violet-600 bg-violet-600'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
        >
          <Scale className={`w-5 h-5 ${inCompare ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
        </button>
        <button
          onClick={onToggleLike}
          className="hidden md:flex mt-1 w-10 h-10 shrink-0 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
        >
          <Heart className={`w-5 h-5 transition-all duration-200 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-500 dark:text-gray-400'}`} />
        </button>
      </div>

      {product.rating > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-gray-200 dark:text-gray-600"}`} />
            ))}
            <span className="ml-1.5 font-medium text-gray-900 dark:text-white text-sm">{product.rating}</span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {product.reviews} {t.detail.customerReviewsLabel}
          </span>
        </div>
      )}
    </div>
  );
}
