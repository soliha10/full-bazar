import { m } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import type { MarketFacet } from '../../hooks/useMarkets';
import { fmt, reveal, SectionHeader, LoadError } from './shared';

export function StoresSection({ markets, status, onRetry }: {
  markets: MarketFacet[];
  status: 'loading' | 'ready' | 'error';
  onRetry: () => void;
}) {
  const { t } = useLanguage();
  const h = t.home;
  return (
    <m.section {...reveal} aria-labelledby="stores-title" className="mt-10 md:mt-14 px-4 max-w-7xl mx-auto">
      <SectionHeader id="stores-title" title={h.storesTitle} subtitle={h.storesSubtitle} />
      {status === 'error' ? (
        <LoadError text={h.loadError} retry={h.retry} onRetry={onRetry} />
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {status === 'loading'
            ? Array.from({ length: 12 }, (_, i) => <li key={i} className="h-[62px] rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)
            : markets.map(mk => (
                <li key={mk.key}>
                  <Link to={`/products?market=${encodeURIComponent(mk.key)}`}
                    className="block rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-3 hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-gray-900 dark:text-white truncate">{mk.name}</span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">
                        {h.storeOffers.replace('{{count}}', fmt(mk.count))}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
        </ul>
      )}
    </m.section>
  );
}
