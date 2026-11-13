import { Activity, Smartphone, Store, Tags, type LucideIcon } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card } from "../../components/Card";

/** KPI plitkasi: ikonka, katta raqam, izoh. Raqam bo'lmasa — "—" (taxmin emas) */
function StatCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number | null }) {
  return (
    // Telefonda ikonka raqam ustida — yonma-yon bo'lganda yorliq tor kartaga sig'masdi
    <Card className="group flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
      <span className="flex w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 shrink-0 items-center justify-center rounded-xl bg-violet-600/10 text-violet-600 dark:text-violet-300 transition-transform duration-300 group-hover:scale-110">
        <Icon className="w-5 h-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xl md:text-2xl font-semibold tracking-tight tabular-nums text-gray-900 dark:text-white">
          {value == null ? '—' : value.toLocaleString('ru-RU')}
        </p>
        <p className="text-xs leading-snug text-gray-500 dark:text-gray-400 sm:truncate">{label}</p>
      </div>
    </Card>
  );
}

export function StatCards({ totalProducts, totalMarkets, offers, weeklyEvents }: {
  totalProducts: number; totalMarkets: number; offers: number | null; weeklyEvents: number;
}) {
  const { t } = useLanguage();
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      <StatCard icon={Smartphone} label={t.trends.totalProducts} value={totalProducts} />
      <StatCard icon={Store} label={t.trends.marketplaces} value={totalMarkets} />
      <StatCard icon={Tags} label={t.trends.offers} value={offers} />
      <StatCard icon={Activity} label={t.trends.weeklyActivity} value={weeklyEvents} />
    </div>
  );
}
