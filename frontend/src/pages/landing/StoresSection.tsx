import { m } from 'framer-motion';
import { Store } from 'lucide-react';
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
      <SectionHeader id="stores-title" title={h.storesTitle} subtitle={h.storesSubtitle} icon={Store} />
      {status === 'error' ? (
        <LoadError text={h.loadError} retry={h.retry} onRetry={onRetry} />
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {status === 'loading'
            ? Array.from({ length: 12 }, (_, i) => <li key={i} className="h-[62px] rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)
            : markets.map(mk => (
                <li key={mk.key}>
                  <Link to={`/products?market=${encodeURIComponent(mk.key)}`}
                    className="flex items-center gap-2.5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-3 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: mk.color }} aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block text-sm font-black text-gray-900 dark:text-white truncate">{mk.name}</span>
                      <span className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400">
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
