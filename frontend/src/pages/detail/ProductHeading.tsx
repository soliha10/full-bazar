import { Star, Heart, CheckCircle2, Scale } from "lucide-react";
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
        <span className="text-violet-600 dark:text-violet-400 font-black text-xs uppercase tracking-widest bg-violet-50 dark:bg-violet-900/20 px-2.5 py-1 rounded-full">
          {(t.detail.categories as any)[(product.category ?? '').toLowerCase()] ?? product.category}
        </span>
        {product.inStock && (
          <span className="text-emerald-600 font-bold text-xs flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> {t.detail.inStock}
          </span>
        )}
      </div>

      <div className="flex items-start gap-3">
        <h1 className="flex-1 text-2xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
          {product.name}
        </h1>
        {/* Solishtirishga qo'shish — sayt oqimining markazi: avval
            xususiyatlarni yonma-yon ko'rib, keyin eng arzon do'konni
            tanlash. Ilgari bu tugma faqat katalogdagi kartada bor edi,
            ya'ni mahsulot sahifasiga kirgan odam oqimdan chiqib qolardi. */}
        <button
          onClick={onToggleCompare}
          title={inCompare ? t.detailPage.removeFromCompare : t.detailPage.addToCompare}
          className={`mt-1 w-11 h-11 shrink-0 flex items-center justify-center rounded-2xl border active:scale-90 transition-all shadow-sm ${
            inCompare
              ? 'border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/30'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-violet-300 dark:hover:border-violet-800'
          }`}
        >
          <Scale className={`w-5 h-5 ${inCompare ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400 dark:text-gray-500'}`} />
        </button>
        <button
          onClick={onToggleLike}
          className="hidden md:flex mt-1 w-11 h-11 shrink-0 items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-red-300 dark:hover:border-red-800 active:scale-90 transition-all shadow-sm"
        >
          <Heart className={`w-5 h-5 transition-all duration-200 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-400 dark:text-gray-500'}`} />
        </button>
      </div>

      {product.rating > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-3 py-1.5 rounded-xl shadow-sm">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-gray-200 dark:text-gray-600"}`} />
            ))}
            <span className="ml-1.5 font-black text-gray-900 dark:text-white text-sm">{product.rating}</span>
          </div>
          <span className="text-xs font-bold text-gray-400 dark:text-gray-500">
            {product.reviews} {t.detail.customerReviewsLabel}
          </span>
        </div>
      )}
    </div>
  );
}
