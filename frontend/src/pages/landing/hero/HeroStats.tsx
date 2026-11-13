import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Smartphone, Store, TrendingDown, type LucideIcon } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { Stats } from '../shared';

const DURATION_MS = 1200;

/** 0 dan qiymatgacha yumshoq sanash (ease-out); "kamroq harakat"da darhol qiymat */
function useCountUp(target: number): number {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? target : 0);
  useEffect(() => {
    if (reduce) { setValue(target); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION_MS);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reduce]);
  return value;
}

function Stat({ icon: Icon, value, template, tone, live }: {
  icon: LucideIcon; value: number; template: string; tone: string;
  /** Yangilanish vaqti — yashil nuqta va data-tip (alohida qator emas) */
  live?: string | null;
}) {
  const n = useCountUp(value);
  return (
    <span data-tip={live ?? undefined}
      className="relative inline-flex items-center gap-2 rounded-full glass-soft py-1.5 pl-1.5 pr-3.5 text-sm text-gray-700 dark:text-gray-200">
      {live && (
        <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-900" />
        </span>
      )}
      {live && <span className="sr-only">{live}. </span>}
      <span className={`flex h-7 w-7 items-center justify-center rounded-full ${tone}`}>
        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      </span>
      {template.split('{{count}}').map((part, i) => (
        <span key={i}>{i > 0 && <strong className="font-semibold tabular-nums text-gray-900 dark:text-white">{n.toLocaleString('ru-RU')}</strong>}{part}</span>
      ))}
    </span>
  );
}

/** Jonli raqamlar — /api/stats: mahsulotlar, do'konlar, o'rtacha narx farqi */
export function HeroStats({ stats, updated }: { stats: Stats | null; updated?: string | null }) {
  const { t } = useLanguage();
  const h = t.home;
  const live = updated ? h.trustUpdated.replace('{{updated}}', updated) : null;
  if (!stats) return <div className="h-10 w-80 max-w-full rounded-full glass-soft animate-pulse" aria-hidden="true" />;
  const gap = stats.medianPriceGap != null ? Math.round(stats.medianPriceGap * 100) : null;
  return (
    <div className="flex flex-wrap gap-2">
      <Stat icon={Smartphone} value={stats.products} template={h.statProducts} tone="bg-violet-600 text-white" />
      <Stat icon={Store} value={stats.markets} template={h.statStores} tone="bg-sky-500 text-white" live={live} />
      {gap ? <Stat icon={TrendingDown} value={gap} template={h.statGap} tone="bg-emerald-500 text-white" /> : null}
    </div>
  );
}
