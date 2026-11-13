import { useRef, useEffect, useLayoutEffect } from 'react';
import { m } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Product } from '../../components/ProductCard';
import type { BrandFacet } from '../../hooks/useBrands';
import { setHeroSearchVisible } from '../../utils/heroSearch';
import { SearchBox } from '../../components/search/SearchBox';
import { DealDeck } from './DealDeck';
import { Card } from "../../components/Card";
import { PAGE_CONTAINER } from '../../components/layout';

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const, delay },
});

/*
 * Toza hero: bitta sarlavha, bitta qidiruv, ommabop brendlar va o'ng tomonda
 * haqiqiy takliflar dastasi. Raqamlar (mahsulot, do'kon) — /api/stats dan.
 */
export function Hero({ hasStats, fill, deck, dealsLoading, topBrands, updated }: {
  hasStats: boolean;
  updated: string | null;
  fill: (s: string) => string;
  deck: Product[];
  dealsLoading: boolean;
  topBrands: BrandFacet[];
}) {
  const { t } = useLanguage();
  const h = t.home;
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);

  // Hero qidiruvi ko'rinib turganda navbardagi qidiruv yashirin (utils/heroSearch).
  // Birinchi chizilishdan oldin "ko'rinadi" deb belgilanadi — navbar qidiruvi
  // bir lahzaga paydo bo'lib, yo'qolib qolmasin.
  useLayoutEffect(() => { setHeroSearchVisible(true); return () => setHeroSearchVisible(false); }, []);
  useEffect(() => {
    const el = formRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setHeroSearchVisible(e.isIntersecting), { rootMargin: '-64px 0px 0px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);


  return (
    <section aria-labelledby="hero-title" className={`${PAGE_CONTAINER} pt-10 pb-4 md:pt-20 md:pb-8`}>
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

          <m.div {...rise(0.15)} className="max-w-xl">
            <SearchBox variant="hero" formRef={formRef} placeholder={h.searchPlaceholder} globalShortcut
              onSubmit={(q) => navigate(q ? `/products?search=${encodeURIComponent(q)}` : '/products')} />
          </m.div>

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

          {/* Bitta ixcham qator: katalog hajmi va narxlar qachon yangilangani */}
          <m.p {...rise(0.25)} className="mt-7 text-xs text-gray-500 dark:text-gray-400">
            {hasStats ? fill(h.eyebrow) : <span className="inline-block w-36 h-3 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />}
            {updated && <> · {h.trustUpdated.replace('{{updated}}', updated)}</>}
          </m.p>
        </div>

        <m.div className="md:shrink-0" initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 22, delay: 0.15 }}>
          {deck.length > 0 ? (
            <DealDeck deals={deck}
              labels={{ label: h.showcaseLabel, cheapest: h.showcaseCheapest, gap: h.showcaseGap, cta: h.showcaseCta, next: h.showcaseNext }} />
          ) : dealsLoading ? (
            <Card radius="3xl" padding="none" className="w-full md:w-[360px] h-[290px] animate-pulse" aria-hidden="true" />
          ) : null}
        </m.div>
      </div>
    </section>
  );
}
