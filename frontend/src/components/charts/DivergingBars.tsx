import { Link } from 'react-router-dom';
import { StoreLogo } from '../StoreLogo';

export interface DivergingItem {
  id: string;
  label: string;
  /** Ishorali qiymat: manfiy — chapga (arzonlashdi), musbat — o'ngga */
  value: number;
  /** Ustun uchidagi yozuv (masalan "−3,2%") */
  valueText: string;
  /** Yorliq ostidagi ikkinchi qator (masalan "2 600 000 → 2 549 000") */
  sub?: string;
  href?: string;
  logo?: string;
}

/**
 * Diverging ustunli grafik: markazdagi nol chizig'idan chapga manfiy,
 * o'ngga musbat qiymatlar. Ikki qarama-qarshi rang va neytral nol
 * (dataviz: diverging). Qiymat ustun uchida, ishorasi bilan — rang
 * yagona belgi emas. HTML da: uzun nomlar va havolalar uchun qulay.
 */
export function DivergingBars({ items, negLabel, posLabel }: {
  items: DivergingItem[];
  negLabel: string;
  posLabel: string;
}) {
  const max = Math.max(...items.map(i => Math.abs(i.value)), 1e-9);
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2 sm:pl-[40%]">
        <span className="flex items-center gap-1.5"><span aria-hidden="true" className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--viz-neg)' }} />← {negLabel}</span>
        <span className="flex items-center gap-1.5">{posLabel} →<span aria-hidden="true" className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--viz-pos)' }} /></span>
      </div>
      <ul className="divide-y divide-gray-900/5 dark:divide-white/5">
        {items.map(item => {
          // Yarim kenglikdan qiymat yozuvi uchun joy qoldiriladi — eng uzun ustun ham sig'adi
          const width = `calc((100% - 4.5rem) * ${Math.abs(item.value) / max})`;
          const neg = item.value < 0;
          const row = (
            <div className="grid grid-cols-1 sm:grid-cols-[40%_1fr] items-center gap-x-4 gap-y-1.5 py-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                {item.logo && <StoreLogo name={item.logo} size="sm" />}
                <span className="min-w-0">
                  <span className="block truncate text-sm text-gray-900 dark:text-gray-100">{item.label}</span>
                  {item.sub && <span className="block truncate text-xs text-gray-500 dark:text-gray-400 tabular-nums">{item.sub}</span>}
                </span>
              </div>
              {/* Ikki yarim: chap — manfiy, o'ng — musbat; o'rtada nol chizig'i */}
              <div className="grid grid-cols-2 items-center h-6">
                <div className="flex justify-end items-center gap-1.5 h-full pr-px">
                  {neg && <span className="text-xs font-semibold tabular-nums text-gray-900 dark:text-white whitespace-nowrap">{item.valueText}</span>}
                  {neg && <span className="h-3 rounded-l-[4px]" style={{ width, background: 'var(--viz-neg)', minWidth: 3 }} />}
                </div>
                <div className="flex items-center gap-1.5 h-full border-l" style={{ borderColor: 'var(--viz-zero)' }}>
                  {!neg && <span className="h-3 rounded-r-[4px]" style={{ width, background: 'var(--viz-pos)', minWidth: 3 }} />}
                  {!neg && <span className="text-xs font-semibold tabular-nums text-gray-900 dark:text-white whitespace-nowrap">{item.valueText}</span>}
                </div>
              </div>
            </div>
          );
          return (
            <li key={item.id}>
              {item.href
                ? <Link to={item.href} className="block rounded-lg -mx-2 px-2 hover:bg-gray-900/[0.03] dark:hover:bg-white/[0.04] transition-colors">{row}</Link>
                : row}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
