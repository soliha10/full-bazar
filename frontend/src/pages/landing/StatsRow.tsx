import { Store, Smartphone, Clock, Layers } from 'lucide-react';
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
    { icon: Smartphone, label: h.statProducts, value: stats ? fmt(stats.products) : null },
    { icon: Store,      label: h.statStores,   value: stats ? fmt(stats.markets) : null },
    { icon: Layers,     label: h.statComparable, value: stats ? fmt(stats.comparableProducts) : null },
    { icon: Clock,      label: h.statUpdated,  value: stats ? (updated ?? '—') : null },
  ];

  return (
    <section aria-label={h.statProducts} className="px-4 max-w-7xl mx-auto -mt-px md:mt-5">
      {failed ? (
        <div className="mt-4"><LoadError text={h.loadError} retry={h.retry} onRetry={onRetry} /></div>
      ) : (
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4 mt-4 md:mt-0">
          {statTiles.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-violet-600 dark:text-violet-400" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <dd className="text-lg md:text-xl font-black text-gray-900 dark:text-white leading-tight truncate">
                  {value ?? <span className="inline-block w-14 h-5 rounded bg-gray-100 dark:bg-gray-800 animate-pulse align-middle" />}
                </dd>
                <dt className="text-[11px] md:text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">{label}</dt>
              </div>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
