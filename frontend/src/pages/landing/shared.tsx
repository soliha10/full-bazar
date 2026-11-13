import { Link } from 'react-router-dom';

// Bosh sahifa bo'limlari umumiy foydalanadigan yordamchilar: animatsiya,
// raqam formati, bo'lim sarlavhasi va xato bloki.

export interface Stats {
  products: number;
  markets: number;
  offers: number;
  comparableProducts: number;
  /** Bir model do'konlar orasidagi narx farqi medianasi, 0..1 */
  medianPriceGap?: number | null;
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
  title, subtitle, linkTo, linkLabel, id,
}: {
  title: string; subtitle?: string;
  linkTo?: string; linkLabel?: string; id?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4 md:mb-6">
      <div className="min-w-0">
        <div className="min-w-0">
          <h2 id={id} className="text-lg md:text-2xl font-semibold text-gray-900 dark:text-white tracking-tight leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-1 max-w-2xl">{subtitle}</p>
          )}
        </div>
      </div>
      {linkTo && linkLabel && (
        <Link to={linkTo}
          className="text-xs md:text-sm font-medium text-violet-600 dark:text-violet-400 shrink-0 whitespace-nowrap hover:underline">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

export function LoadError({ text, retry, onRetry }: { text: string; retry: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 px-4 py-5 text-sm text-gray-500 dark:text-gray-400">
      {text}
      <button type="button" onClick={onRetry}
        className="font-medium text-violet-600 dark:text-violet-400 hover:underline">
        {retry}
      </button>
    </div>
  );
}
