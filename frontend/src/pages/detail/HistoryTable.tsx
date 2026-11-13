import { formatSum } from "../../utils/productMapper";
import { StoreLogo } from "../../components/StoreLogo";
import type { DayRow } from "./priceHistorySeries";

/**
 * Grafikning jadval ko'rinishi: eng arzon narx qaysi kuni, qaysi do'konda
 * va qanchaga o'zgargani. Grafikni ko'ra olmaydigan (yoki aniq raqam
 * kerak bo'lgan) foydalanuvchi uchun — har qiymat tooltipsiz ham o'qiladi.
 */
export function HistoryTable({ rows, fmtDate, labels }: {
  rows: DayRow[];
  fmtDate: (iso: string) => string;
  labels: { date: string; store: string; price: string; change: string; title: string };
}) {
  const changes = rows.filter((r, i) => i === 0 || r.min !== rows[i - 1].min || r.minSource !== rows[i - 1].minSource);
  const list = changes.map((r, i) => ({ ...r, delta: i === 0 ? null : r.min - changes[i - 1].min })).reverse();

  return (
    <details className="group mt-5 rounded-2xl border border-gray-900/5 dark:border-white/10">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 [&::-webkit-details-marker]:hidden">
        {labels.title} <span className="text-xs text-gray-400">{list.length}</span>
      </summary>
      <div className="max-h-72 overflow-y-auto border-t border-gray-900/5 dark:border-white/10">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur text-xs text-gray-500 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-4 py-2 text-left font-normal">{labels.date}</th>
              <th scope="col" className="px-4 py-2 text-left font-normal">{labels.store}</th>
              <th scope="col" className="px-4 py-2 text-right font-normal">{labels.price}</th>
              <th scope="col" className="px-4 py-2 text-right font-normal">{labels.change}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-900/5 dark:divide-white/5">
            {list.map(r => (
              <tr key={r.date}>
                <td className="px-4 py-2 text-gray-600 dark:text-gray-300 whitespace-nowrap">{fmtDate(r.date)}</td>
                <td className="px-4 py-2">
                  <span className="flex items-center gap-2 text-gray-800 dark:text-gray-100"><StoreLogo name={r.minSource} size="xs" />{r.minSource}</span>
                </td>
                <td className="px-4 py-2 text-right tabular-nums font-medium text-gray-900 dark:text-white whitespace-nowrap">{formatSum(r.min)}</td>
                <td className={`px-4 py-2 text-right tabular-nums whitespace-nowrap ${
                  r.delta === null || r.delta === 0 ? 'text-gray-400' : r.delta < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  {r.delta === null || r.delta === 0 ? '—' : `${r.delta > 0 ? '+' : '−'}${formatSum(Math.abs(r.delta))}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
