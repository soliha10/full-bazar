import { formatSum } from '../../utils/productMapper';
import { StoreLogo } from '../StoreLogo';

export interface LadderStep { source: string; price: number }

/**
 * Narx narvoni — bosqichma-bosqich (progressive) ustunlar: eng arzon do'kon
 * nolda, keyingilari undan qancha qimmat bo'lsa shuncha uzun. Bitta rang
 * (sequential: kattaroq — uzunroq), qiymat ustun uchida "+23 000 so'm".
 * Narvon ko'rinishi "qancha ortiqcha to'layman?" savoliga bir qarashda javob.
 */
export function PriceLadder({ steps, cheapestLabel }: { steps: LadderStep[]; cheapestLabel: string }) {
  const sorted = [...steps].sort((a, b) => a.price - b.price);
  const base = sorted[0]?.price ?? 0;
  const maxGap = Math.max(...sorted.map(s => s.price - base), 1);

  return (
    <ol className="divide-y divide-gray-900/5 dark:divide-white/5">
      {sorted.map((s, i) => {
        const gap = s.price - base;
        const pct = base > 0 ? (gap / base) * 100 : 0;
        return (
          // Mobil: 1-qator nom + narx, 2-qator butun kenglikdagi ustun; desktop: uch ustun
          <li key={s.source} className="grid grid-cols-[1fr_auto] sm:grid-cols-[11rem_1fr_8.5rem] items-center gap-x-4 gap-y-1.5 py-2.5">
            <span className="flex items-center gap-2.5 min-w-0 text-sm text-gray-900 dark:text-gray-100">
              <StoreLogo name={s.source} size="sm" /><span className="truncate">{s.source}</span>
            </span>
            <span className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-1 sm:col-start-2 flex items-center gap-2 min-w-0">
              {i === 0 ? (
                <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: 'var(--viz-seq-soft)', color: 'var(--viz-seq)' }}>{cheapestLabel}</span>
              ) : (
                <>
                  <span className="h-3 rounded-r-[4px] shrink-0"
                    style={{ width: `calc((100% - 10.5rem) * ${gap / maxGap})`, minWidth: 3, background: 'var(--viz-seq)' }} />
                  <span className="text-xs font-semibold tabular-nums text-gray-900 dark:text-white whitespace-nowrap">
                    +{formatSum(gap)} <span className="font-normal text-gray-500 dark:text-gray-400">+{pct.toFixed(1)}%</span>
                  </span>
                </>
              )}
            </span>
            <span className="row-start-1 col-start-2 sm:col-start-3 text-xs sm:text-sm text-right tabular-nums text-gray-600 dark:text-gray-300">{formatSum(s.price)}</span>
          </li>
        );
      })}
    </ol>
  );
}
