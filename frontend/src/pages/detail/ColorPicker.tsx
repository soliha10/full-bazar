import type { ProductVariant } from "../../components/ProductCard";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatSum } from "../../utils/productMapper";

// Namuna doirachasi uchun rang (faqat ko'rinish; nomi — tarjima fayllarida)
const SWATCH: Record<string, string> = {
  black: '#111827', white: '#f9fafb', silver: '#d1d5db', gray: '#6b7280', blue: '#2563eb',
  green: '#16a34a', purple: '#7c3aed', pink: '#ec4899', red: '#dc2626', orange: '#f97316',
  yellow: '#eab308', gold: '#d4a24c', brown: '#92400e', beige: '#e7d8bf', titanium: '#a8a29e',
};

/** Rang tanlovi: har rang — namuna, nomi va shu rangning eng arzon narxi. */
export function ColorPicker({ variants, active, onSelect }: {
  variants: ProductVariant[];
  active: ProductVariant | null;
  onSelect: (color: string | null) => void;
}) {
  const { t } = useLanguage();
  const d = t.detailPage;
  const names = d.colors as Record<string, string>;
  if (variants.length === 0) return null;

  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
        {d.colorLabel}: <span className="font-medium text-gray-900 dark:text-white">{names[active?.color ?? 'other'] ?? active?.color}</span>
      </p>
      <div role="radiogroup" aria-label={d.colorLabel} className="flex flex-wrap gap-2">
        {variants.map(v => {
          const on = v === active;
          const key = v.color ?? 'other';
          return (
            <button key={key} type="button" role="radio" aria-checked={on} onClick={() => onSelect(v.color)}
              className={`flex items-center gap-2 rounded-xl border py-1.5 pl-1.5 pr-3 text-left transition-colors ${
                on ? 'border-violet-600 ring-1 ring-violet-600 bg-violet-500/5'
                   : 'border-gray-900/10 dark:border-white/15 hover:border-gray-900/25 dark:hover:border-white/30'}`}>
              {v.images[0]
                ? <img src={v.images[0]} alt="" loading="lazy" className="w-9 h-9 rounded-lg object-contain bg-white" />
                : <span className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800" />}
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-sm text-gray-900 dark:text-white">
                  {v.color && (
                    <span aria-hidden="true" className="w-3 h-3 rounded-full ring-1 ring-black/10 dark:ring-white/20"
                      style={{ background: SWATCH[v.color] ?? '#9ca3af' }} />
                  )}
                  {names[key] ?? key}
                </span>
                {v.price != null && (
                  <span className="block text-xs text-gray-500 dark:text-gray-400 tabular-nums">{d.colorFrom.replace('{{price}}', formatSum(v.price))}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
