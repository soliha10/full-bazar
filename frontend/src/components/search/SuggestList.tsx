import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatSum } from '../../utils/productMapper';
import { productPath } from '../../utils/slug';
import type { Suggestions } from '../../hooks/useSearchSuggest';

export type SuggestItem =
  | { kind: 'brand'; id: string; href: string; label: string; count: number }
  | { kind: 'product'; id: string; href: string; label: string; image: string; price: number; stores: number }
  | { kind: 'all'; id: string; href: string; label: string };

/** Takliflarni klaviatura bilan yuriladigan bitta tekis ro'yxatga aylantiradi. */
export function toItems(data: Suggestions | null, q: string): SuggestItem[] {
  if (!q) return [];
  const items: SuggestItem[] = [];
  for (const b of data?.brands ?? []) {
    items.push({ kind: 'brand', id: `b-${b.key}`, href: `/products?brand=${encodeURIComponent(b.key)}`, label: b.name, count: b.count });
  }
  for (const p of data?.products ?? []) {
    items.push({ kind: 'product', id: `p-${p.id}`, href: productPath(p), label: p.name, image: p.image, price: p.price, stores: p.stores });
  }
  items.push({ kind: 'all', id: 'all', href: `/products?search=${encodeURIComponent(q)}`, label: q });
  return items;
}

/** Ochiladigan ro'yxat: brendlar, mahsulotlar (rasm, narx, do'konlar), "barcha natijalar". */
export function SuggestList({ listId, items, active, loading, onPick, onHover, fixedTop }: {
  listId: string;
  /** Mobil: maydon tor — ro'yxat ekran kengligida, shu balandlikdan ochiladi */
  fixedTop?: number;
  items: SuggestItem[];
  active: number;
  loading: boolean;
  onPick: (item: SuggestItem) => void;
  onHover: (index: number) => void;
}) {
  const { t } = useLanguage();
  const s = t.searchBox;
  const hasProducts = items.some(i => i.kind === 'product');
  const firstOf = (kind: SuggestItem['kind']) => items.findIndex(i => i.kind === kind);

  return (
    <ul id={listId} role="listbox" style={fixedTop !== undefined ? { top: fixedTop } : undefined}
      className={`glass glass-solid z-50 rounded-2xl p-1.5 max-h-[70vh] overflow-y-auto text-left ${
        fixedTop !== undefined ? 'fixed left-3 right-3' : 'absolute left-0 right-0 top-full mt-2'}`}>
      {items.map((item, i) => (
        <li key={item.id} role="presentation">
          {i === firstOf('brand') && <p className="px-3 pt-2 pb-1 text-[11px] text-gray-500 dark:text-gray-400">{s.suggestBrands}</p>}
          {i === firstOf('product') && <p className="px-3 pt-2 pb-1 text-[11px] text-gray-500 dark:text-gray-400">{s.suggestProducts}</p>}
          {item.kind === 'all' && !hasProducts && !loading && (
            <p className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">{s.noResults}</p>
          )}
          <Link id={`${listId}-${i}`} to={item.href} role="option" aria-selected={i === active} tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()} onClick={() => onPick(item)} onMouseEnter={() => onHover(i)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
              i === active ? 'bg-violet-600/10 text-violet-800 dark:text-violet-200' : 'text-gray-800 dark:text-gray-100'
            } ${item.kind === 'all' ? 'border-t border-gray-900/5 dark:border-white/10 mt-1 pt-2.5' : ''}`}>
            {item.kind === 'product' && (
              <>
                <span className="w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden shrink-0">
                  {item.image && <img src={item.image} alt="" loading="lazy" className="w-full h-full object-contain p-0.5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{item.label}</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    {formatSum(item.price)}{item.stores > 1 && ` · ${s.stores.replace('{{count}}', String(item.stores))}`}
                  </span>
                </span>
              </>
            )}
            {item.kind === 'brand' && (
              <>
                <span className="font-medium">{item.label}</span>
                <span className="ml-auto text-xs text-gray-400">{item.count}</span>
              </>
            )}
            {item.kind === 'all' && (
              <>
                <Search className="w-4 h-4 text-gray-400 shrink-0" aria-hidden="true" />
                <span className="truncate">{s.allResults.replace('{{q}}', item.label)}</span>
              </>
            )}
          </Link>
        </li>
      ))}
      {loading && !hasProducts && <li role="presentation" className="px-3 py-2 text-xs text-gray-400">{s.searching}</li>}
    </ul>
  );
}
