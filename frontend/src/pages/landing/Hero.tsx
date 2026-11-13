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
import type { Stats } from './shared';
import { HeroBackdrop } from './hero/HeroBackdrop';
import { HeroStats } from './hero/HeroStats';
import { StoreOrbit } from './hero/StoreOrbit';

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const, delay },
});

/** Sarlavhadagi kalit ibora (titleAccent) — gradient va qo'lda chizilgandek chiziq bilan */
function Title({ text, accent }: { text: string; accent: string }) {
  const at = accent ? text.indexOf(accent) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <span className="relative inline-block whitespace-nowrap">
        <span className="bg-linear-to-r from-violet-600 via-fuchsia-500 to-violet-600 bg-clip-text text-transparent">{accent}</span>
        <svg aria-hidden="true" viewBox="0 0 300 16" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-3 w-full text-fuchsia-500/70">
          <m.path d="M3 11 C 70 3, 150 3, 297 9" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, delay: 0.45, ease: 'easeInOut' }} />
        </svg>
      </span>
      {text.slice(at + accent.length)}
    </>
  );
}

/*
 * Hero: aurora fon, sarlavha (kalit ibora ajratilgan), qidiruv, ommabop
 * brendlar, jonli raqamlar va o'ngda — do'kon logolari orbitasidagi haqiqiy
 * takliflar dastasi. Hamma raqam va logo — API dan (/api/stats, /api/markets).
 */
export function Hero({ stats, hasStats, fill, deck, dealsLoading, topBrands, updated }: {
  stats: Stats | null;
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
    // overflow-x-clip: bezak (nurlar, logolar) sahifani yonga siljitmasin; clip — sticky ni buzmaydi
    <div className="relative isolate overflow-x-clip">
    <HeroBackdrop />
    <section aria-labelledby="hero-title" className={`${PAGE_CONTAINER} pt-10 pb-4 md:pt-20 md:pb-10`}>
      <div className="flex flex-col md:flex-row md:items-center gap-10 md:gap-16">
        <div className="flex-1 min-w-0">
          <m.h1 {...rise(0)} id="hero-title"
            className="text-gray-900 dark:text-white font-semibold leading-[1.08] tracking-tight mb-4 max-w-2xl"
            style={{ fontSize: 'clamp(2rem, 5.2vw, 3.4rem)' }}>
            <Title text={h.title} accent={h.titleAccent} />
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
                <Link key={b.key} to={`/brand/${encodeURIComponent(b.key)}`}
                  className="glass-soft text-xs text-gray-700 dark:text-gray-200 hover:text-violet-700 dark:hover:text-violet-300 rounded-full px-3 py-1.5 transition-colors">
                  {b.name}
                </Link>
              ))}
            </m.div>
          )}

          {/* Jonli raqamlar va narxlar qachon yangilangani */}
          <m.div {...rise(0.25)} className="mt-7">
            <HeroStats stats={stats} />
            {updated && (
              <p className="mt-3 inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                {h.trustUpdated.replace('{{updated}}', updated)}
              </p>
            )}
          </m.div>
        </div>

        <m.div className="md:shrink-0" initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 22, delay: 0.15 }}>
          {deck.length > 0 ? (
            <StoreOrbit>
              <DealDeck deals={deck}
                labels={{ label: h.showcaseLabel, cheapest: h.showcaseCheapest, gap: h.showcaseGap, cta: h.showcaseCta, next: h.showcaseNext }} />
            </StoreOrbit>
          ) : dealsLoading ? (
            <Card radius="3xl" padding="none" className="w-full md:w-[360px] h-[290px] animate-pulse" aria-hidden="true" />
          ) : null}
        </m.div>
      </div>
    </section>
    </div>
  );
}
