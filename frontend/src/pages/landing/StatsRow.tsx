import { useLanguage } from '../../contexts/LanguageContext';
import { fmt, LoadError, type Stats } from './shared';

export function StatsRow({ stats, failed, updated, onRetry }: {
  stats: Stats | null;
  failed: boolean;
  updated: string | null;
  onRetry: () => void;
}) {
  const { t } = useLanguage();
  const h = t.home;

  const statTiles = [
    { label: h.statProducts,   value: stats ? fmt(stats.products) : null },
    { label: h.statStores,     value: stats ? fmt(stats.markets) : null },
    { label: h.statComparable, value: stats ? fmt(stats.comparableProducts) : null },
    { label: h.statUpdated,    value: stats ? (updated ?? '—') : null },
  ];

  return (
    <section aria-label={h.statProducts} className="px-4 max-w-7xl mx-auto -mt-px md:mt-5">
      {failed ? (
        <div className="mt-4"><LoadError text={h.loadError} retry={h.retry} onRetry={onRetry} /></div>
      ) : (
        <dl className="glass rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-y-4 mt-6 md:mt-2 py-4 px-2">
          {statTiles.map(({ label, value }) => (
            <div key={label} className="flex flex-col-reverse px-1 md:px-4 md:border-l first:border-l-0 border-gray-200 dark:border-gray-800">
              <div className="min-w-0">
                <dd className="text-lg md:text-2xl font-semibold text-gray-900 dark:text-white leading-tight truncate tabular-nums">
                  {value ?? <span className="inline-block w-14 h-5 rounded bg-gray-100 dark:bg-gray-800 animate-pulse align-middle" />}
                </dd>
                <dt className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</dt>
              </div>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
