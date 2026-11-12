import { m } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import type { BrandFacet } from '../../hooks/useBrands';
import { fmt, reveal, SectionHeader } from './shared';

export function BrandsSection({ brands }: { brands: BrandFacet[] }) {
  const { t } = useLanguage();
  const h = t.home;
  if (brands.length === 0) return null;
  return (
    <m.section {...reveal} aria-labelledby="brands-title" className="mt-10 md:mt-14 px-4 max-w-7xl mx-auto">
      <SectionHeader id="brands-title" title={h.brandsTitle} subtitle={h.brandsSubtitle}
        linkTo="/products" linkLabel={t.landing.trending.viewAll} />
      <ul className="flex flex-wrap gap-2">
        {brands.map(b => (
          <li key={b.key}>
            <Link to={`/products?brand=${encodeURIComponent(b.key)}`}
              className="flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm text-gray-800 dark:text-gray-100 hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
              {b.name}
              {b.count > 0 && <span className="text-xs text-gray-400">{fmt(b.count)}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </m.section>
  );
}
