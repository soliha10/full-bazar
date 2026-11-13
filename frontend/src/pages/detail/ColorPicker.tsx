import { useState } from "react";
import type { ProductVariant } from "../../components/ProductCard";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatSum } from "../../utils/productMapper";

// Namuna doirachasi uchun rang (faqat ko'rinish; nomi — tarjima fayllarida)
const SWATCH: Record<string, string> = {
  black: '#111827', white: '#f9fafb', silver: '#d1d5db', gray: '#6b7280', blue: '#2563eb',
  green: '#16a34a', purple: '#7c3aed', pink: '#ec4899', red: '#dc2626', orange: '#f97316',
  yellow: '#eab308', gold: '#d4a24c', brown: '#92400e', beige: '#e7d8bf', titanium: '#a8a29e',
};

// Yig'ilgan holatda shuncha chip (2 qator) — ranglar ko'p bo'lsa qator cho'zilib ketmasin
const COLLAPSED = 4;
// Faqat bitta chipni yashiradigan tugma o'sha chipning o'zidek joy oladi — yig'ilmaydi

/** Rang tanlovi: har rang — namuna, nomi va shu rangning eng arzon narxi. */
export function ColorPicker({ variants, active, cheapest, onSelect }: {
  variants: ProductVariant[];
  active: ProductVariant | null;
  /** Barcha ranglar ichida eng arzoni — katalog kartasidagi narx shu */
  cheapest: ProductVariant | null;
  onSelect: (color: string | null) => void;
}) {
  const { t } = useLanguage();
  const d = t.detailPage;
  const names = d.colors as Record<string, string>;
  const [expanded, setExpanded] = useState(false);
  if (variants.length === 0) return null;
  // Tanlangan rang yig'ilgan holatda ham doim ko'rinadi
  let shown = variants;
  const collapsible = variants.length > COLLAPSED + 1;
  if (!expanded && collapsible) {
    shown = variants.slice(0, COLLAPSED);
    if (active && !shown.includes(active)) shown = [...variants.slice(0, COLLAPSED - 1), active];
  }

  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
        {d.colorLabel}: <span className="font-medium text-gray-900 dark:text-white">{names[active?.color ?? 'other'] ?? active?.color}</span>
      </p>
      <div role="radiogroup" aria-label={d.colorLabel} className="grid grid-cols-2 gap-2">
        {shown.map(v => {
          const on = v === active;
          const key = v.color ?? 'other';
          return (
            <button key={key} type="button" role="radio" aria-checked={on} onClick={() => onSelect(v.color)}
              title={v.price != null ? `${names[key] ?? key} — ${d.colorFrom.replace('{{price}}', formatSum(v.price))}` : names[key] ?? key}
              className={`flex min-w-0 items-center gap-2 rounded-xl border py-1.5 pl-1.5 pr-3 text-left transition-colors ${
                on ? 'border-violet-600 ring-1 ring-violet-600 bg-violet-500/5'
                   : 'border-gray-900/10 dark:border-white/15 hover:border-gray-900/25 dark:hover:border-white/30'}`}>
              {v.images[0]
                ? <img src={v.images[0]} alt="" loading="lazy" className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-lg object-contain bg-white" />
                // Rasm bo'lmasa — rang namunasi (rasm bor bo'lsa rangni uning o'zi ko'rsatadi)
                : <span aria-hidden="true" className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-lg ring-1 ring-black/10 dark:ring-white/20"
                    style={{ background: (v.color && SWATCH[v.color]) || '#9ca3af' }} />}
              <span className="min-w-0">
                <span className="block truncate text-sm text-gray-900 dark:text-white">
                  {names[key] ?? key}
                </span>
                {v.price != null && (
                  <span className="block whitespace-nowrap text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                    {d.colorFrom.replace('{{price}}', formatSum(v.price))}
                    {v === cheapest && <span className="block font-medium text-emerald-600 dark:text-emerald-400">{d.cheapestTag}</span>}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      {collapsible && (
        <button type="button" onClick={() => setExpanded(v => !v)} aria-expanded={expanded}
          className="mt-2 mr-4 text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline">
          {expanded ? d.fewerColors : d.moreColors.replace('{{count}}', String(variants.length - COLLAPSED))}
        </button>
      )}
      {/* Boshqa rang tanlangan — kartadagi (eng arzon) narx qaysi rangda ekanini eslatamiz */}
      {cheapest && active && active !== cheapest && cheapest.price != null && (
        <button type="button" onClick={() => onSelect(cheapest.color)}
          className="mt-2 text-sm text-violet-600 dark:text-violet-400 hover:underline">
          {d.colorCheapestHint.replace('{{color}}', names[cheapest.color ?? 'other'] ?? '').replace('{{price}}', formatSum(cheapest.price))}
        </button>
      )}
    </div>
  );
}
