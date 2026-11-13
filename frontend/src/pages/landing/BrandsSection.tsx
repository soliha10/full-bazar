import { m } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import type { BrandFacet } from '../../hooks/useBrands';
import { fmt, reveal, SectionHeader } from './shared';
import { Card } from "../../components/Card";
import { PAGE_CONTAINER } from '../../components/layout';
import { FeaturedBrand } from './brands/FeaturedBrand';

// Eng ko'p modelli 3 brend — yirik kartalar; keyingi 9 tasi — ixcham plitkalar
// (9 — telefonda 3×3, katta ekranda bitta qator)
const FEATURED = 3;
const COMPACT = 9;

/** Ixcham brend plitkasi: rasm, nom, modellar soni */
function BrandTile({ b, index }: { b: BrandFacet; index: number }) {
  const { t } = useLanguage();
  return (
    <li className="card-rise" style={{ '--i': index } as React.CSSProperties}>
      <Card as={Link} interactive padding="none" to={`/brand/${encodeURIComponent(b.key)}`}
        className="group flex h-full flex-col items-center gap-2 px-2 py-3 text-center">
        <span className="flex w-12 h-12 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-black/5 dark:ring-white/10 shadow-sm transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105">
          {b.image
            ? <img src={b.image} alt="" loading="lazy" className="w-full h-full object-contain p-1" />
            // Rasm bo'lmasa — brend bosh harfi (rang/logo qo'lda yozilmaydi)
            : <span aria-hidden="true" className="text-lg font-semibold text-gray-400 dark:text-gray-500">{b.name.charAt(0)}</span>}
        </span>
        <span className="w-full min-w-0">
          <span className="block truncate text-sm font-semibold text-gray-900 dark:text-white group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
            {b.name}
          </span>
          <span className="block truncate text-[11px] text-gray-500 dark:text-gray-400">
            {t.home.brandModels.replace('{{count}}', fmt(b.count))}
          </span>
        </span>
      </Card>
    </li>
  );
}

/**
 * Brendlar vitrinasi — /api/brands (bazada haqiqatda mahsuloti bor brendlar).
 * Bento: chapda №1 brend (katta), o'ngda №2 va №3; ostida keyingi 9 tasi.
 * Ulush — brend modellarining barcha brendlar modellariga nisbati.
 */
export function BrandsSection({ brands }: { brands: BrandFacet[] }) {
  const { t } = useLanguage();
  const h = t.home;
  if (brands.length === 0) return null;
  const total = brands.reduce((s, b) => s + b.count, 0) || 1;
  const share = (b: BrandFacet) => Math.round((b.count / total) * 100);
  const featured = brands.slice(0, FEATURED);
  const rest = brands.slice(FEATURED, FEATURED + COMPACT);

  return (
    <m.section {...reveal} aria-labelledby="brands-title" className={`mt-14 md:mt-24 ${PAGE_CONTAINER}`}>
      <SectionHeader id="brands-title" title={h.brandsTitle} subtitle={h.brandsSubtitle}
        linkTo="/products" linkLabel={t.landing.trending.viewAll} />

      <div className="grid grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-3 md:gap-4">
        {featured.map((b, i) => (
          <FeaturedBrand key={b.key} b={b} rank={i + 1} share={share(b)} hero={i === 0}
            className={i === 0 ? 'col-span-2 lg:row-span-2' : 'col-span-1 lg:col-span-2'} />
        ))}
      </div>

      {rest.length > 0 && (
        <ul className="mt-3 md:mt-4 grid grid-cols-3 lg:grid-cols-9 gap-3 md:gap-4">
          {rest.map((b, i) => <BrandTile key={b.key} b={b} index={i} />)}
        </ul>
      )}
    </m.section>
  );
}
