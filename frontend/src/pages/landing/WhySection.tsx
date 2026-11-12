import { m } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { fmt, reveal, LoadError, SectionHeader, type Stats } from './shared';

/**
 * "Nega Bazarcom" — to'rtta katta raqam, har biri /api/stats dan:
 * do'konlar orasidagi narx farqi medianasi, solishtiriladigan modellar,
 * do'konlar soni va oxirgi yangilanish vaqti.
 */
export function WhySection({ stats, failed, updated, onRetry }: {
  stats: Stats | null;
  failed: boolean;
  updated: string | null;
  onRetry: () => void;
}) {
  const { t } = useLanguage();
  const h = t.home;
  const gap = stats?.medianPriceGap;

  const tiles = [
    { value: stats ? (typeof gap === 'number' ? `${Math.round(gap * 100)}%` : '—') : null, label: h.kpiGap, desc: h.kpiGapDesc, accent: true },
    { value: stats ? fmt(stats.comparableProducts) : null, label: h.kpiComparable, desc: h.kpiComparableDesc },
    { value: stats ? fmt(stats.markets) : null, label: h.kpiStores, desc: h.kpiStoresDesc },
    { value: stats ? (updated ?? '—') : null, label: h.kpiUpdated, desc: h.kpiUpdatedDesc, small: true },
  ];

  return (
    <m.section {...reveal} aria-labelledby="why-title" className="mt-14 md:mt-24 px-4 max-w-7xl mx-auto">
      <SectionHeader id="why-title" title={h.whyTitle} subtitle={h.whySubtitle} />
      {failed ? (
        <LoadError text={h.loadError} retry={h.retry} onRetry={onRetry} />
      ) : (
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {tiles.map((tile, i) => (
            <div key={tile.label} className="glass glass-hover card-rise rounded-3xl p-5 md:p-6 flex flex-col"
              style={{ '--i': i } as React.CSSProperties}>
              <dd className={`order-1 font-semibold tracking-tight leading-none tabular-nums ${tile.small ? 'text-2xl md:text-3xl' : 'text-3xl md:text-[2.6rem]'} ${
                tile.accent ? 'text-violet-600 dark:text-violet-400' : 'text-gray-900 dark:text-white'
              }`}>
                {tile.value !== null ? tile.value
                  : <span className="inline-block w-20 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />}
              </dd>
              <dt className="order-2 mt-3 text-sm font-medium text-gray-900 dark:text-white">{tile.label}</dt>
              <dd className="order-3 mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{tile.desc}</dd>
            </div>
          ))}
        </dl>
      )}
    </m.section>
  );
}
