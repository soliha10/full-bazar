import { useLanguage } from '../../contexts/LanguageContext';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-xl font-semibold text-gray-900 dark:text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export function StatCards({ totalProducts, totalMarkets, weeklyEvents, droppingCount }: {
  totalProducts: number; totalMarkets: number; weeklyEvents: number; droppingCount: number;
}) {
  const { t } = useLanguage();
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard label={t.trends.totalProducts}   value={totalProducts.toLocaleString()} />
      <StatCard label={t.trends.marketplaces}     value={totalMarkets} />
      <StatCard label={t.trends.weeklyActivity} value={weeklyEvents.toLocaleString()} />
      <StatCard label={t.trends.priceDrops}   value={droppingCount} />
    </div>
  );
}
