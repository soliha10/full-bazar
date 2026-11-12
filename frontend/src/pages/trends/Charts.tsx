// recharts og'ir (~400 KB) — faqat shu Tahlil bo'lagi ichida qoladi
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { formatSum } from '../../utils/productMapper';
import { useLanguage } from '../../contexts/LanguageContext';
import { MARKET_COLORS, type MarketStat } from './types';
import { StoreLogo } from '../../components/StoreLogo';

/* Marketplace chart */
export function MarketChart({ markets }: { markets: MarketStat[] }) {
  const { t } = useLanguage();
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t.trends.marketRanking}</h2>
      </div>
      <div className="glass rounded-2xl p-5">
        <ResponsiveContainer width="100%" height={Math.min(markets.length * 36, 400)}>
          <BarChart data={markets.slice(0, 12)} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category" dataKey="source" width={90}
              tick={{ fontSize: 11, fontWeight: 700, fill: 'currentColor' }}
              tickLine={false} axisLine={false}
            />
            <Tooltip
              formatter={(v: number) => [t.trends.productsCount.replace('{{count}}', v.toString()), t.trends.product]}
              contentStyle={{
                borderRadius: 12, border: '1px solid #e5e7eb',
                fontSize: 12, fontWeight: 700,
              }}
            />
            <Bar dataKey="productCount" radius={[0, 6, 6, 0]} maxBarSize={24}>
              {markets.slice(0, 12).map((_, i) => (
                <Cell key={i} fill={MARKET_COLORS[i % MARKET_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Avg price table */}
        <div className="mt-5 border-t border-gray-100 dark:border-gray-800 pt-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-3">{t.trends.avgPriceUzs}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {markets.slice(0, 8).map((m) => (
              <div key={m.source} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2">
                <StoreLogo name={m.source} size="md" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 truncate">{m.source}</p>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{formatSum(m.avgPrice)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* Market share visual */
export function MarketShare({ markets }: { markets: MarketStat[] }) {
  const { t } = useLanguage();
  const maxMarketCount = Math.max(...markets.map(m => m.productCount), 1);
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t.trends.marketShare}</h2>
      </div>
      <div className="glass rounded-2xl p-5 space-y-3">
        {markets.slice(0, 10).map((m, i) => (
          <div key={m.source} className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 w-28 shrink-0 truncate">
              <StoreLogo name={m.source} size="xs" />{m.source}
            </span>
            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(m.productCount / maxMarketCount) * 100}%`,
                  background: MARKET_COLORS[i % MARKET_COLORS.length],
                }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-12 text-right shrink-0">
              {m.productCount}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
