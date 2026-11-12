import { formatSum } from '../../utils/productMapper';
import { trackStoreClick } from '../../services/tracking';
import { useLanguage } from '../../contexts/LanguageContext';
import type { CompareItem } from './types';

/** Jadvalning oxirgi bo'limi: har bir mahsulotning do'konlardagi narxlari,
 *  arzonidan qimmatiga qarab (birinchisi yashil). */
export function StorePricesRows({ items }: { items: CompareItem[] }) {
  const { t } = useLanguage();
  return (
    <>
      <tr>
        <td
          colSpan={items.length + 1}
          className="sticky left-0 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400 bg-violet-50/60 dark:bg-violet-900/10 border-t border-gray-100 dark:border-gray-800"
        >
          {t.compare.storePricesGroup}
        </td>
      </tr>
      <tr>
        <td className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide align-top sticky left-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          {t.compare.prices}
        </td>
        {items.map((item) => (
          <td key={item.product.id} className="p-3 align-top border-t border-gray-100 dark:border-gray-800">
            <div className="flex flex-col gap-1.5">
              {[...item.product.markets].sort((a, b) => a.price - b.price).map((mkt, i) => (
                <a
                  key={`${mkt.source}-${i}`}
                  href={mkt.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackStoreClick(item.product.id, mkt.source, mkt.price)}
                  className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    i === 0
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-1 truncate">
                    {mkt.source}
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    {formatSum(mkt.price)}
                  </span>
                </a>
              ))}
            </div>
          </td>
        ))}
      </tr>
    </>
  );
}
