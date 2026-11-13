import { Fragment } from 'react';
import { X, Trophy } from 'lucide-react';
import { formatSum } from '../../utils/productMapper';
import { useLanguage } from '../../contexts/LanguageContext';
import { SPEC_GROUPS, WINNER_ROW, specValue, type CompareItem, type Verdict } from './types';
import { StorePricesRows } from './StorePrices';
import { Card } from "../../components/Card";

export function SpecTable({ items, diffFields, verdict, onRemove, onOpen }: {
  items: CompareItem[];
  diffFields: Set<string>;
  verdict: Verdict | null;
  onRemove: (id: string) => void;
  onOpen: (item: CompareItem) => void;
}) {
  const { t } = useLanguage();

  // Qaysi qatorda qaysi mahsulot g'olib — serverdagi xulosadan olinadi, ya'ni
  // jadvaldagi kubok va yuqoridagi tavsiya bir xil hisobga tayanadi.
  const rowWinners = new Map<string, string>();
  for (const [metric, winner] of Object.entries(verdict?.winners ?? {})) {
    const rowKey = WINNER_ROW[metric];
    if (rowKey) rowWinners.set(rowKey, winner.productId);
  }

  const bestPrice = items.length > 0 ? Math.min(...items.map((it) => it.product.price)) : 0;
  const priceVaries = new Set(items.map((it) => it.product.price)).size > 1;

  return (
    <Card padding="none" className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0 min-w-[640px]">
        <thead>
          <tr>
            <th className="w-40 sticky left-0 z-10 bg-gray-50 dark:bg-gray-900" />
            {items.map((item) => (
              <th key={item.product.id} className="p-3 text-left align-top min-w-[180px] bg-gray-50 dark:bg-gray-900">
                <Card padding="sm" className="relative">
                  <button
                    onClick={() => onRemove(item.product.id)}
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <img
                    src={item.product.image || 'https://placehold.co/200x200/f5f3ff/7c3aed?text=📱'}
                    alt={item.product.name}
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/200x200/f5f3ff/7c3aed?text=📱'; }}
                    className="w-full h-28 object-contain mb-2 cursor-pointer"
                    onClick={() => onOpen(item)}
                  />
                  <p
                    onClick={() => onOpen(item)}
                    className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 mb-1 cursor-pointer hover:text-violet-600"
                  >
                    {item.product.name}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-base font-semibold text-violet-600">{formatSum(item.product.price)}</p>
                    {priceVaries && item.product.price === bestPrice && (
                      <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">
                        {t.compare.cheapestBadge}
                      </span>
                    )}
                  </div>
                  {!item.specs && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-1">
                      {t.compare.specsNotFound}
                    </p>
                  )}
                </Card>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SPEC_GROUPS.map((group) => (
            <Fragment key={group.label}>
              <tr>
                <td
                  colSpan={items.length + 1}
                  className="sticky left-0 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400 bg-violet-50/60 dark:bg-violet-900/10 border-t border-gray-100 dark:border-gray-800"
                >
                  {t.compare.groups[group.label]}
                </td>
              </tr>
              {group.rows.map((row) => (
                <tr key={row.key}>
                  <td className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide align-top sticky left-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                    {t.compare.specs[row.label]}
                  </td>
                  {items.map((item) => {
                    const isBest = rowWinners.get(row.key) === item.product.id;
                    return (
                      <td
                        key={item.product.id}
                        className={`p-3 text-sm font-semibold align-top border-t border-gray-100 dark:border-gray-800 ${
                          diffFields.has(row.key) ? 'bg-violet-50/40 dark:bg-violet-900/10 text-violet-700 dark:text-violet-300' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          {specValue(item.specs, row.key, t.compare.noData)}
                          {isBest && (
                            <span title={t.compare.bestInRow} className="text-emerald-600 shrink-0">
                              <Trophy className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </Fragment>
          ))}

          <StorePricesRows items={items} />
        </tbody>
      </table>
    </Card>
  );
}
