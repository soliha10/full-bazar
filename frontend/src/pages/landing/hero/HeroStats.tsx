import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
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

/** Lentaning bitta ustuni: katta raqam va kichik yorliq (ikonkasiz — yorliq o'zi aytadi) */
function Stat({ value, unit = '', label, accent, live, tip }: {
  value: number; unit?: string; label: string;
  /** Qisqa yorliqning to'liq ma'nosi — data-tip */
  tip?: string;
  /** Tejash foizi — yashil (foydalanuvchi uchun asosiy xabar) */
  accent?: boolean;
  /** Yangilanish vaqti — raqam yonida yashil nuqta va data-tip */
  live?: string | null;
}) {
  const n = useCountUp(value);
  return (
    <div data-tip={live ?? tip} className="min-w-0 px-3 py-2.5 sm:py-3 text-center">
      <p className={`text-lg sm:text-xl font-semibold leading-tight tracking-tight tabular-nums ${
        accent ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
        {/* Nuqta raqam yonida absolyut — raqam ustun markazidan siljimaydi */}
        <span className="relative inline-block">
        {n.toLocaleString('ru-RU')}{unit}
        {live && (
          <span className="absolute -right-3 top-1/2 flex h-2 w-2 -translate-y-1/2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
        )}
        </span>
      </p>
      <p className="mt-0.5 text-[11px] sm:text-xs leading-tight text-gray-500 dark:text-gray-400">
        {label}{(live || tip) && <span className="sr-only">. {live ?? tip}</span>}
      </p>
    </div>
  );
}

/**
 * Jonli raqamlar lentasi — /api/stats: mahsulotlar, do'konlar, o'rtacha narx
 * farqi. Bitta glass panel, ustunlar ingichka chiziq bilan ajratilgan,
 * kengligi tepadagi qidiruv maydoni bilan bir xil.
 */
export function HeroStats({ stats, updated }: { stats: Stats | null; updated?: string | null }) {
  const { t } = useLanguage();
  const h = t.home;
  const live = updated ? h.trustUpdated.replace('{{updated}}', updated) : null;
  if (!stats) return <div className="h-14 w-full rounded-2xl glass-soft animate-pulse" aria-hidden="true" />;
  const gap = stats.medianPriceGap != null ? Math.round(stats.medianPriceGap * 100) : null;
  return (
    // Qidiruv maydoni bilan bir xil kenglik (Hero: max-w-xl) — chetlari bir chiziqda; ustunlar teng
    <div className={`grid w-full ${gap ? 'grid-cols-3' : 'grid-cols-2'} divide-x divide-gray-900/10 dark:divide-white/10 rounded-2xl glass-soft`}>
      <Stat value={stats.products} label={h.statProductsShort} />
      <Stat value={stats.markets} label={h.statStoresShort} live={live} />
      {gap ? <Stat value={gap} unit="%" label={h.statGapShort} tip={t.trends.insightText} accent /> : null}
    </div>
  );
}
