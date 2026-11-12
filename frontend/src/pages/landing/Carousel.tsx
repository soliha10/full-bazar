import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatSum } from '../../utils/productMapper';
import { productPath } from '../../utils/slug';
import type { Product } from '../../components/ProductCard';
import { PLACEHOLDER } from './shared';

export function Carousel({ children }: { children: React.ReactNode[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start', dragFree: true });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  const arrow = 'hidden md:flex absolute top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full shadow-md hover:border-violet-300 dark:hover:border-violet-700 transition-all z-10';
  return (
    <div className="relative">
      <div className="overflow-hidden -mx-4 px-4 md:mx-0 md:px-0" ref={emblaRef}>
        <div className="flex gap-3 md:gap-4">{children}</div>
      </div>
      {canPrev && (
        <button type="button" onClick={() => emblaApi?.scrollPrev()} className={`${arrow} left-0 -translate-x-5`} aria-label="Previous">
          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>
      )}
      {canNext && (
        <button type="button" onClick={() => emblaApi?.scrollNext()} className={`${arrow} right-0 translate-x-5`} aria-label="Next">
          <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>
      )}
    </div>
  );
}

/* ── Carousel card ── */
export function MiniProductCard({ product, badge, storesLabel }: {
  product: Pick<Product, 'id' | 'slug' | 'image' | 'name' | 'price'>;
  badge?: string;
  storesLabel?: string;
}) {
  return (
    <Link
      to={productPath(product)}
      className="shrink-0 w-[160px] md:w-[220px] group flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-1 hover:border-violet-200 dark:hover:border-violet-700/60 transition-all duration-200"
    >
      <div className="relative h-36 md:h-44 bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
        <img
          src={product.image || PLACEHOLDER} alt={product.name} loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
          className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500 mix-blend-multiply dark:mix-blend-normal"
        />
        {badge && (
          <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
            {badge}
          </span>
        )}
        {storesLabel && (
          <span className="absolute top-2 right-2 bg-white/90 dark:bg-gray-900/90 border border-gray-100 dark:border-gray-700 text-[10px] font-black text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded-lg">
            {storesLabel}
          </span>
        )}
      </div>
      <div className="p-3 md:p-3.5 flex flex-col flex-1 gap-2">
        <p className="text-[13px] md:text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug flex-1 min-h-[36px] md:min-h-[40px]">
          {product.name}
        </p>
        <p className="text-sm md:text-base font-black text-violet-600 dark:text-violet-400 leading-none">
          {formatSum(product.price)}
        </p>
      </div>
    </Link>
  );
}

export function SkeletonCard() {
  return (
    <div className="shrink-0 w-[160px] md:w-[220px] rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse overflow-hidden" aria-hidden="true">
      <div className="h-36 md:h-44 bg-gray-200 dark:bg-gray-700" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-4/5" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-3/5" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-2/5 mt-3" />
      </div>
    </div>
  );
}
