import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { fetchProducts } from '../../services/api';
import { formatSum } from '../../utils/productMapper';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card } from "../../components/Card";

export interface SearchResult { id: string; name: string; image: string; price: number }

/** "Mahsulot qo'shish" qidiruvi. Holat sahifada turadi (panel yopilib
 *  qayta ochilganda yozilgan so'rov saqlanib qoladi — avvalgidek). */
export function useCompareSearch(showPicker: boolean, compareIds: string[]) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!showPicker || query.trim().length < 2) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearching(true);
      fetchProducts(1, 6, query.trim())
        .then((data) => setResults((data.products ?? []).filter((p: { id: string }) => !compareIds.includes(String(p.id)))))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, showPicker, compareIds]);

  return { query, setQuery, results, setResults, searching };
}

export function AddProductPanel({ search, onPick }: {
  search: ReturnType<typeof useCompareSearch>;
  onPick: (id: string) => void;
}) {
  const { t } = useLanguage();
  const { query, setQuery, results, setResults, searching } = search;
  return (
    <Card className="mb-6">
      <div className="flex items-center gap-2 glass-soft rounded-xl px-3 py-2 mb-3">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.compare.searchPlaceholder}
          className="flex-1 bg-transparent outline-none text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400"
        />
      </div>
      {searching && <p className="text-xs text-gray-400 font-bold px-1">{t.compare.searching}</p>}
      {!searching && query.trim().length >= 2 && results.length === 0 && (
        <p className="text-xs text-gray-400 font-bold px-1">{t.compare.noResults}</p>
      )}
      <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
        {results.map((p) => (
          <button
            key={p.id}
            onClick={() => { onPick(p.id); setQuery(''); setResults([]); }}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors"
          >
            <img
              src={p.image || 'https://placehold.co/80x80/f5f3ff/7c3aed?text=📱'}
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/80x80/f5f3ff/7c3aed?text=📱'; }}
              alt={p.name}
              className="w-10 h-10 object-contain shrink-0"
            />
            <span className="flex-1 text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{p.name}</span>
            <span className="text-xs font-semibold text-violet-600 shrink-0">{formatSum(p.price)}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
