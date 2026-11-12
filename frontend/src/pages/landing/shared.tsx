import { ChevronRight, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

// Bosh sahifa bo'limlari umumiy foydalanadigan yordamchilar: animatsiya,
// raqam formati, bo'lim sarlavhasi va xato bloki.

export interface Stats {
  products: number;
  markets: number;
  offers: number;
  comparableProducts: number;
  lastUpdated: string | null;
}

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};
export const reveal = {
  variants: fadeUp, initial: 'hidden', whileInView: 'visible',
  transition: { duration: 0.5, ease: 'easeOut' }, viewport: { once: true, margin: '-60px' },
} as const;

// Raqam kelmagan bo'lsa (masalan, API eski versiyada) — "—", hech qachon taxmin emas
export const fmt = (n: number | null | undefined) => (typeof n === 'number' ? n.toLocaleString('ru-RU').replace(/,/g, ' ') : '—');

export const PLACEHOLDER = 'https://placehold.co/320x320/f5f3ff/7c3aed?text=📱';

/* ── Section header ── */
export function SectionHeader({
  title, subtitle, icon: Icon, linkTo, linkLabel, id,
}: {
  title: string; subtitle?: string; icon?: React.ElementType;
  linkTo?: string; linkLabel?: string; id?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4 md:mb-6">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-violet-600 dark:text-violet-400" aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0">
          <h2 id={id} className="text-lg md:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-1 max-w-2xl">{subtitle}</p>
          )}
        </div>
      </div>
      {linkTo && linkLabel && (
        <Link to={linkTo}
          className="flex items-center gap-1 text-xs md:text-sm font-bold text-violet-600 dark:text-violet-400 shrink-0 whitespace-nowrap hover:underline">
          {linkLabel}
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

export function LoadError({ text, retry, onRetry }: { text: string; retry: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 px-4 py-5 text-sm text-gray-500 dark:text-gray-400">
      {text}
      <button type="button" onClick={onRetry}
        className="inline-flex items-center gap-1.5 font-bold text-violet-600 dark:text-violet-400 hover:underline">
        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> {retry}
      </button>
    </div>
  );
}
