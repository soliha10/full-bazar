import type { ProductVariant } from "../../components/ProductCard";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatSum } from "../../utils/productMapper";

// Namuna doirachasi uchun rang (faqat ko'rinish; nomi — tarjima fayllarida)
const SWATCH: Record<string, string> = {
  black: '#111827', white: '#f9fafb', silver: '#d1d5db', gray: '#6b7280', blue: '#2563eb',
  green: '#16a34a', purple: '#7c3aed', pink: '#ec4899', red: '#dc2626', orange: '#f97316',
  yellow: '#eab308', gold: '#d4a24c', brown: '#92400e', beige: '#e7d8bf', titanium: '#a8a29e',
};

/**
 * Rang tanlovi: sarlavhada tanlangan rang nomi, ostida bir qatorda kichik plitkalar
 * (rasm, rasm bo'lmasa — rang namunasi). Har plitka nomi va narxi — title da;
 * tanlangan rang narxi narx kartasida chiqadi, bu yerda takrorlanmaydi.
 * Plitkalar kichik: 10 ta rang ham ko'pi bilan 2 qator — yig'ish shart emas.
 */
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
  if (variants.length === 0) return null;
  const name = (v: ProductVariant | null) => names[v?.color ?? 'other'] ?? v?.color ?? '';

  return (
    <div>
      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
        {d.colorLabel}: <span className="font-medium text-gray-900 dark:text-white">{name(active)}</span>
      </p>
      <div role="radiogroup" aria-label={d.colorLabel} className="flex flex-wrap gap-2">
        {variants.map(v => {
          const on = v === active;
          const label = v.price != null
            ? `${name(v)} — ${d.colorFrom.replace('{{price}}', formatSum(v.price))}${v === cheapest && variants.length > 1 ? ` · ${d.cheapestTag}` : ''}`
            : name(v);
          return (
            <button key={v.color ?? 'other'} type="button" role="radio" aria-checked={on} aria-label={label} title={label}
              onClick={() => onSelect(v.color)}
              className={`w-11 h-11 shrink-0 overflow-hidden rounded-lg border p-0.5 transition-colors ${
                on ? 'border-violet-600 ring-1 ring-violet-600'
                   : 'border-gray-900/10 dark:border-white/15 hover:border-gray-900/30 dark:hover:border-white/40'}`}>
              {v.images[0]
                ? <img src={v.images[0]} alt="" loading="lazy" className="w-full h-full rounded-md object-contain bg-white" />
                : <span aria-hidden="true" className="block w-full h-full rounded-md ring-1 ring-inset ring-black/10 dark:ring-white/20"
                    style={{ background: (v.color && SWATCH[v.color]) || '#9ca3af' }} />}
            </button>
          );
        })}
      </div>
      {/* Boshqa rang tanlangan — kartadagi (eng arzon) narx qaysi rangda ekanini eslatamiz */}
      {cheapest && active && active !== cheapest && cheapest.price != null && (
        <button type="button" onClick={() => onSelect(cheapest.color)}
          className="mt-2 text-sm text-violet-600 dark:text-violet-400 hover:underline">
          {d.colorCheapestHint.replace('{{color}}', name(cheapest)).replace('{{price}}', formatSum(cheapest.price))}
        </button>
      )}
    </div>
  );
}
