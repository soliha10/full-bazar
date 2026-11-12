import { useState, useRef, FormEvent } from 'react';
import { Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatSum } from '../../utils/productMapper';
import { productPath } from '../../utils/slug';
import type { Product } from '../../components/ProductCard';
import type { BrandFacet } from '../../hooks/useBrands';
import { PLACEHOLDER } from './shared';

/* ── Hero: haqiqiy mahsulotning haqiqiy narxlari ── */
function ShowcaseCard({ product, labels, compact = false }: {
  product: Product;
  labels: { label: string; cheapest: string; gap: string; cta: string };
  compact?: boolean;
}) {
  const offers = [...(product.markets ?? [])].sort((a, b) => a.price - b.price).slice(0, compact ? 3 : 4);
  if (offers.length < 2) return null;
  const all = (product.markets ?? []).map(m => m.price);
  const gap = Math.max(...all) - Math.min(...all);
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 md:p-5 w-full md:w-[340px] text-left">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{labels.label}</p>
      <Link to={productPath(product)} className="flex items-center gap-3 mb-3 group">
        <div className="w-14 h-14 rounded-lg bg-gray-50 dark:bg-white flex items-center justify-center shrink-0 overflow-hidden">
          <img src={product.image || PLACEHOLDER} alt="" className="w-full h-full object-contain p-1.5"
            onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
        </div>
        <p className="text-gray-900 dark:text-white text-sm font-medium leading-snug line-clamp-2 group-hover:underline">{product.name}</p>
      </Link>
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {offers.map((o, i) => (
          <li key={o.source} className="flex items-center justify-between gap-3 py-2">
            <span className={`text-sm truncate ${i === 0 ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
              {o.source}
              {i === 0 && <span className="sr-only"> — {labels.cheapest}</span>}
            </span>
            <span className={`text-sm shrink-0 tabular-nums ${i === 0 ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'}`}>{formatSum(o.price)}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-2 mt-2 pt-3 border-t border-gray-100 dark:border-gray-800">
        <span className="text-xs text-gray-500 dark:text-gray-400">{labels.gap.replace('{{amount}}', formatSum(gap))}</span>
        <Link to={productPath(product)} className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline">
          {labels.cta}
        </Link>
      </div>
    </div>
  );
}

export function Hero({ hasStats, fill, showcase, dealsLoading, topBrands }: {
  hasStats: boolean;
  fill: (s: string) => string;
  showcase: Product | undefined;
  dealsLoading: boolean;
  topBrands: BrandFacet[];
}) {
  const { t } = useLanguage();
  const h = t.home;
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) { searchRef.current?.focus(); return; }
    navigate(`/products?search=${encodeURIComponent(q)}`);
  };

  return (
    <section aria-labelledby="hero-title" className="md:px-4 md:pt-6 md:max-w-7xl md:mx-auto">
      <div className="md:rounded-2xl md:border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40">
        <div className="px-5 pt-8 pb-7 md:px-12 md:py-14 flex flex-col md:flex-row md:items-center gap-8 md:gap-12">
          <div className="flex-1 min-w-0">
            <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
              {hasStats ? fill(h.eyebrow) : <span className="inline-block w-40 h-3 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />}
            </p>
            <h1 id="hero-title" className="text-gray-900 dark:text-white font-semibold leading-[1.1] tracking-tight mb-3" style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)' }}>
              {h.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-lg leading-relaxed mb-6 max-w-xl">
              {hasStats ? fill(h.subtitle) : <span className="inline-block w-64 h-4 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />}
            </p>

            <form role="search" onSubmit={onSearch} className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-1.5 max-w-xl focus-within:border-violet-500 transition-colors">
              <label htmlFor="hero-search" className="sr-only">{h.searchButton}</label>
              <Search className="w-5 h-5 text-gray-400 ml-2 shrink-0" aria-hidden="true" />
              <input
                ref={searchRef} id="hero-search" type="search" value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={h.searchPlaceholder} enterKeyHint="search" autoComplete="off"
                className="flex-1 min-w-0 bg-transparent px-1 py-2.5 text-sm md:text-base text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
              />
              <button type="submit" className="shrink-0 bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm rounded-lg px-4 md:px-6 py-2.5 transition-colors">
                {h.searchButton}
              </button>
            </form>

            {topBrands.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span className="text-gray-500 dark:text-gray-400 text-xs">{h.popular}</span>
                {topBrands.map(b => (
                  <Link key={b.key} to={`/products?brand=${encodeURIComponent(b.key)}`}
                    className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-500 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1 transition-colors">
                    {b.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="md:shrink-0">
            {showcase ? (
              <ShowcaseCard product={showcase}
                labels={{ label: h.showcaseLabel, cheapest: h.showcaseCheapest, gap: h.showcaseGap, cta: h.showcaseCta }} />
            ) : dealsLoading ? (
              <div className="w-full md:w-[340px] h-64 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" aria-hidden="true" />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
