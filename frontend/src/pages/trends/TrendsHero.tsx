import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card } from '../../components/Card';
import { relativeUpdated } from '../../utils/relativeUpdated';
import type { TrendsStats } from './types';

/**
 * Tahlil sahifasining bosh kartasi: sarlavha, "jonli" yangilanish belgisi va
 * bozorning asosiy xulosasi — bir model do'konlar orasida o'rtacha qancha farq
 * qiladi (/api/stats: medianPriceGap, comparableProducts).
 */
export function TrendsHero({ stats }: { stats: TrendsStats | null }) {
  const { t } = useLanguage();
  const tr = t.trends;
  const updated = relativeUpdated(stats?.lastUpdated, t.home);
  const gap = stats?.medianPriceGap != null ? Math.round(stats.medianPriceGap * 100) : null;

  return (
    <Card as="section" aria-labelledby="trends-title" padding="none"
      className="relative isolate overflow-hidden p-5 md:p-8 grid gap-6 md:grid-cols-[1.3fr_1fr] md:items-center">
      {/* Bezak: sayt aksentidagi ikki nur */}
      <span aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-28 right-0 -z-10 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />

      <div>
        {updated && (
          <span className="inline-flex items-center gap-2 rounded-full glass-soft px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {t.home.trustUpdated.replace('{{updated}}', updated)}
          </span>
        )}
        <h1 id="trends-title" className="mt-3 text-2xl md:text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
          {tr.title}
        </h1>
        <p className="mt-2 max-w-lg text-sm md:text-base text-gray-600 dark:text-gray-300">{tr.subtitle}</p>
      </div>

      {gap !== null && (
        <div className="rounded-2xl glass-soft p-5">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{tr.insightLabel}</p>
          <p className="mt-1 text-5xl md:text-6xl font-semibold tracking-tight tabular-nums bg-linear-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
            {gap}%
          </p>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">{tr.insightText}</p>
          {stats && stats.comparableProducts > 0 && (
            <Link to="/products" className="group mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 dark:text-violet-300">
              {tr.insightComparable.replace('{{count}}', stats.comparableProducts.toLocaleString('ru-RU'))}
              <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          )}
        </div>
      )}
    </Card>
  );
}
