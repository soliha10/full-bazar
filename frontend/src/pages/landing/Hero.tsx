import { useState, useRef, FormEvent } from 'react';
import { m } from 'framer-motion';
import { Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Product } from '../../components/ProductCard';
import type { BrandFacet } from '../../hooks/useBrands';
import type { MarketFacet } from '../../hooks/useMarkets';
import { StoreLogo } from '../../components/StoreLogo';
import { DealDeck } from './DealDeck';

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const, delay },
});

/*
 * Toza hero: bitta sarlavha, bitta qidiruv, ommabop brendlar va o'ng tomonda
 * haqiqiy takliflar dastasi. Raqamlar (mahsulot, do'kon) — /api/stats dan.
 */
export function Hero({ hasStats, fill, deck, dealsLoading, topBrands, markets, updated }: {
  hasStats: boolean;
  markets: MarketFacet[];
  updated: string | null;
  fill: (s: string) => string;
  deck: Product[];
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
    <section aria-labelledby="hero-title" className="px-4 pt-10 pb-4 md:pt-20 md:pb-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center gap-10 md:gap-14">
        <div className="flex-1 min-w-0">
          <m.h1 {...rise(0)} id="hero-title"
            className="text-gray-900 dark:text-white font-semibold leading-[1.08] tracking-tight mb-4 max-w-2xl"
            style={{ fontSize: 'clamp(2rem, 5.2vw, 3.4rem)' }}>
            {h.title}
          </m.h1>
          <m.p {...rise(0.1)} className="text-gray-600 dark:text-gray-400 text-base md:text-lg leading-relaxed mb-7 max-w-xl">
            {hasStats ? fill(h.subtitle) : <span className="inline-block w-64 h-4 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />}
          </m.p>

          <m.form {...rise(0.15)} role="search" onSubmit={onSearch}
            className="glass flex items-center gap-2 rounded-2xl p-1.5 max-w-xl focus-within:ring-2 focus-within:ring-violet-500/40 transition-shadow">
            <label htmlFor="hero-search" className="sr-only">{h.searchButton}</label>
            <Search className="w-5 h-5 text-gray-400 ml-2.5 shrink-0" aria-hidden="true" />
            <input
              ref={searchRef} id="hero-search" type="search" value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={h.searchPlaceholder} enterKeyHint="search" autoComplete="off"
              className="flex-1 min-w-0 bg-transparent px-1 py-3 text-sm md:text-base text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus-visible:outline-none"
            />
            <button type="submit" className="shrink-0 bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm rounded-xl px-5 md:px-6 py-3 transition-colors">
              {h.searchButton}
            </button>
          </m.form>

          {topBrands.length > 0 && (
            <m.div {...rise(0.2)} className="flex flex-wrap items-center gap-2 mt-5">
              <span className="text-gray-500 dark:text-gray-400 text-xs">{h.popular}</span>
              {topBrands.map(b => (
                <Link key={b.key} to={`/products?brand=${encodeURIComponent(b.key)}`}
                  className="glass-soft text-xs text-gray-700 dark:text-gray-200 hover:text-violet-700 dark:hover:text-violet-300 rounded-full px-3 py-1.5 transition-colors">
                  {b.name}
                </Link>
              ))}
            </m.div>
          )}

          {/* Ishonch qatori: haqiqiy do'konlar logotiplari va oxirgi yangilanish */}
          {markets.length > 0 && (
            <m.div {...rise(0.25)} className="mt-8 flex items-center gap-3">
              <span className="flex -space-x-2">
                {markets.slice(0, 5).map(mk => (
                  <StoreLogo key={mk.key} name={mk.key} size="md" className="!rounded-full ring-2 ring-white dark:ring-gray-950" />
                ))}
              </span>
              <span className="text-xs leading-snug text-gray-600 dark:text-gray-400">
                <span className="block font-medium text-gray-900 dark:text-white">
                  {hasStats ? fill(h.eyebrow) : <span className="inline-block w-36 h-3 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />}
                </span>
                {updated && h.trustUpdated.replace('{{updated}}', updated)}
              </span>
            </m.div>
          )}
        </div>

        <m.div className="md:shrink-0" initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 22, delay: 0.15 }}>
          {deck.length > 0 ? (
            <DealDeck deals={deck}
              labels={{ label: h.showcaseLabel, cheapest: h.showcaseCheapest, gap: h.showcaseGap, cta: h.showcaseCta, next: h.showcaseNext }} />
          ) : dealsLoading ? (
            <div className="w-full md:w-[360px] h-[290px] rounded-3xl glass animate-pulse" aria-hidden="true" />
          ) : null}
        </m.div>
      </div>
    </section>
  );
}
