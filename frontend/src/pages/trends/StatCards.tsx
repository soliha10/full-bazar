import { TrendingDown, BarChart2, Eye, ShoppingBag } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">{value}</p>
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
      <StatCard label={t.trends.totalProducts}   value={totalProducts.toLocaleString()}  icon={ShoppingBag} color="bg-violet-600" />
      <StatCard label={t.trends.marketplaces}     value={totalMarkets}                     icon={BarChart2}   color="bg-blue-500"   />
      <StatCard label={t.trends.weeklyActivity} value={weeklyEvents.toLocaleString()}   icon={Eye}         color="bg-emerald-500"/>
      <StatCard label={t.trends.priceDrops}   value={droppingCount}                    icon={TrendingDown} color="bg-rose-500"  />
    </div>
  );
}
