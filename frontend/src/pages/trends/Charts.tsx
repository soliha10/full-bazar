import { formatSum } from '../../utils/productMapper';
import { useLanguage } from '../../contexts/LanguageContext';
import type { MarketStat } from './types';
import { StoreLogo } from '../../components/StoreLogo';
import { Card } from "../../components/Card";

/**
 * Do'konlar: mahsulotlar soni (ustun) va o'rtacha narx — bitta jadval.
 * Ilgari bu ma'lumot ikki marta chizilardi (recharts ustunli grafik + ulush
 * chiziqlari) va har ustun boshqa rangda edi: bitta ko'rsatkichni kamalak
 * ranglari bilan chizish hech narsani anglatmaydi. Endi — bitta rang,
 * ingichka ustun, qiymat ustun uchida (dataviz: marks & labels).
 */
export function StoresBoard({ markets }: { markets: MarketStat[] }) {
  const { t } = useLanguage();
  const tr = t.trends;
  const rows = [...markets].sort((a, b) => b.productCount - a.productCount);
  const max = Math.max(...rows.map(m => m.productCount), 1);
  if (rows.length === 0) return null;
  // Narx oralig'i — logarifmik shkala: narxlar 100 mingdan 100 mln gacha, chiziqli
  // shkalada arzon do'konlar bir nuqtaga yopishib qolardi
  const prices = rows.flatMap(m => [m.minPrice, m.maxPrice]).filter(v => v > 0);
  const lo = Math.log(Math.min(...prices)), hi = Math.log(Math.max(...prices));
  const pos = (v: number) => (hi > lo && v > 0 ? ((Math.log(v) - lo) / (hi - lo)) * 100 : 0);

  return (
    <section aria-labelledby="stores-board">
      <h2 id="stores-board" className="text-base font-semibold text-gray-900 dark:text-white mb-1">{tr.marketRanking}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{tr.marketRankingHint}</p>
      <Card padding="none" className="overflow-hidden">
        <table className="w-full table-fixed text-sm">
          <thead className="text-xs text-gray-500 dark:text-gray-400">
            <tr className="border-b border-gray-900/5 dark:border-white/10">
              <th scope="col" className="px-4 py-3 text-left font-normal sm:w-44">{tr.storeCol}</th>
              <th scope="col" className="hidden sm:table-cell px-4 py-3 text-left font-normal">{tr.productsCol}</th>
              <th scope="col" className="hidden md:table-cell px-4 py-3 text-left font-normal">{tr.rangeCol}</th>
              <th scope="col" className="px-4 py-3 text-right font-normal whitespace-nowrap w-32 md:w-40">{tr.avgPriceCol}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-900/5 dark:divide-white/5">
            {rows.map(m => (
              <tr key={m.source}>
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-2.5 font-medium text-gray-900 dark:text-white">
                    <StoreLogo name={m.source} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate">{m.source}</span>
                      {/* Mobilda ustun uchun joy yo'q — son matn bo'lib */}
                      <span className="sm:hidden block text-xs font-normal text-gray-500 dark:text-gray-400">
                        {tr.productsCount.replace('{{count}}', String(m.productCount))}
                      </span>
                    </span>
                  </span>
                </td>
                <td className="hidden sm:table-cell px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 rounded-r bg-linear-to-r from-violet-600 to-violet-400 min-w-[4px]"
                      style={{ width: `calc((100% - 3.5rem) * ${m.productCount / max})` }} />
                    <span className="text-xs tabular-nums text-gray-600 dark:text-gray-300">{m.productCount}</span>
                  </div>
                </td>
                <td className="hidden md:table-cell px-4 py-2.5">
                  {/* Eng arzon — eng qimmat chizig'i, nuqta — o'rtacha narx; raqamlar — data-tip */}
                  <div className="relative h-5 cursor-default" data-tip={tr.rangeTip
                    .replace('{{min}}', formatSum(m.minPrice)).replace('{{avg}}', formatSum(m.avgPrice)).replace('{{max}}', formatSum(m.maxPrice))}>
                    <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full glass-soft" />
                    <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-linear-to-r from-violet-400 to-fuchsia-500"
                      style={{ left: `${pos(m.minPrice)}%`, width: `${Math.max(pos(m.maxPrice) - pos(m.minPrice), 1)}%` }} />
                    <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white dark:border-gray-900 bg-violet-600 shadow"
                      style={{ left: `${pos(m.avgPrice)}%` }} />
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  {formatSum(m.avgPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </section>
  );
}
