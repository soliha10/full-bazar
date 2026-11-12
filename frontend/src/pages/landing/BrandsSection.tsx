import { m } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import type { BrandFacet } from '../../hooks/useBrands';
import { fmt, reveal, SectionHeader } from './shared';

/** Brendlar — /api/brands; eng ko'p modelli 12 tasi yirik plitka bo'lib chiqadi. */
export function BrandsSection({ brands }: { brands: BrandFacet[] }) {
  const { t } = useLanguage();
  const h = t.home;
  if (brands.length === 0) return null;
  return (
    <m.section {...reveal} aria-labelledby="brands-title" className="mt-14 md:mt-24 px-4 max-w-7xl mx-auto">
      <SectionHeader id="brands-title" title={h.brandsTitle} subtitle={h.brandsSubtitle}
        linkTo="/products" linkLabel={t.landing.trending.viewAll} />
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {brands.slice(0, 12).map((b, i) => (
          <li key={b.key} className="card-rise" style={{ '--i': i } as React.CSSProperties}>
            <Link to={`/products?brand=${encodeURIComponent(b.key)}`}
              className="group glass glass-hover rounded-2xl px-4 py-4 flex items-center justify-between gap-2 h-full">
              <span className="min-w-0">
                <span className="block text-base font-semibold text-gray-900 dark:text-white truncate group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                  {b.name}
                </span>
                {b.count > 0 && (
                  <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {h.brandModels.replace('{{count}}', fmt(b.count))}
                  </span>
                )}
              </span>
              <span aria-hidden="true" className="text-gray-300 dark:text-gray-600 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </m.section>
  );
}
