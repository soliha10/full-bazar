import { TrendingDown } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatSum } from "../../utils/productMapper";
import type { PricePoint } from "./useProductDetail";
import type { DetailTab } from "./SpecsSection";

const HISTORY_COLORS = ['#7c3aed', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

/** Har bir sana uchun bitta qator, har bir do'kon — alohida chiziq. */
function toChartData(priceHistory: PricePoint[]) {
  const sources = [...new Set(priceHistory.map(h => h.source))];
  const byDate: Record<string, Record<string, number>> = {};
  priceHistory.forEach(h => {
    const d = h.date.slice(0, 10);
    if (!byDate[d]) byDate[d] = {};
    byDate[d][h.source] = h.price;
  });
  const data = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({ date, ...vals }));
  return { data, sources };
}

/** ── Price History Chart ── */
export function PriceHistoryChart({ priceHistory, activeTab }: { priceHistory: PricePoint[]; activeTab: DetailTab }) {
  const { t } = useLanguage();
  const historyChartData = toChartData(priceHistory);

  return (
    <div className={`${activeTab !== 'priceHistory' && 'hidden lg:block'} mt-10`}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl md:rounded-3xl p-6 md:p-10 border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-1 h-6 bg-violet-600 rounded-full" />
            {t.detailPage.priceHistoryTitle}
          </h2>
          {priceHistory.length === 0 && (
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
              {t.detailPage.collectingData}
            </span>
          )}
        </div>

        {priceHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
              <TrendingDown className="w-7 h-7 text-violet-400" />
            </div>
            <p className="text-sm font-bold text-gray-400 dark:text-gray-500 text-center max-w-xs">
              {t.detailPage.noPriceHistory}
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historyChartData.data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fontWeight: 700 }}
                tickFormatter={v => String(v).slice(5)}
              />
              <YAxis
                tick={{ fontSize: 11, fontWeight: 700 }}
                tickFormatter={v => `${(Number(v) / 1_000_000).toFixed(1)}M`}
                width={52}
              />
              <Tooltip
                formatter={(v, name) => [formatSum(Number(v)), String(name)]}
                labelFormatter={l => t.detailPage.chartDate.replace('{{date}}', String(l))}
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontWeight: 700, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
              {historyChartData.sources.map((src, i) => (
                <Line
                  key={src}
                  type="monotone"
                  dataKey={src}
                  stroke={HISTORY_COLORS[i % HISTORY_COLORS.length]}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
