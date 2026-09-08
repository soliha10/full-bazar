import { Fragment, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, X, ExternalLink, Store, Plus, Search, Trophy, BatteryCharging, Scale } from 'lucide-react';
import { fetchCompare, fetchProducts } from '../services/api';
import { formatSum } from '../utils/productMapper';
import { trackStoreClick } from '../services/tracking';
import { useCompare, MAX_COMPARE } from '../contexts/CompareContext';
import { SEO, SITE_URL } from '../components/SEO';
import { productPath } from '../utils/slug';

interface Specs {
  displayName: string;
  display: string | null;
  chipset: string | null;
  ramOptions: string[];
  storageOptions: string[];
  mainCamera: string | null;
  selfieCamera: string | null;
  batteryMah: number | null;
  charging: string | null;
  os: string | null;
  body: string | null;
  releaseYear: number | null;
}

interface CompareItem {
  product: {
    id: string;
    name: string;
    image: string;
    price: number;
    markets: { source: string; price: number; url: string }[];
  };
  specs: Specs | null;
}

interface SpecRowDef { key: keyof Specs; label: string }
interface SpecGroup { label: string; rows: SpecRowDef[] }

const SPEC_GROUPS: SpecGroup[] = [
  { label: 'Ishlash va xotira', rows: [
    { key: 'chipset', label: 'Protsessor' },
    { key: 'ramOptions', label: 'RAM' },
    { key: 'storageOptions', label: 'Xotira' },
  ]},
  { label: 'Ekran', rows: [
    { key: 'display', label: 'Ekran' },
  ]},
  { label: 'Kamera', rows: [
    { key: 'mainCamera', label: 'Asosiy kamera' },
    { key: 'selfieCamera', label: 'Old kamera' },
  ]},
  { label: 'Batareya', rows: [
    { key: 'batteryMah', label: 'Sig\'im' },
    { key: 'charging', label: 'Zaryadlash' },
  ]},
  { label: "Dizayn va boshqa", rows: [
    { key: 'body', label: 'Korpus' },
    { key: 'os', label: 'OS' },
    { key: 'releaseYear', label: 'Chiqarilgan yili' },
  ]},
];

function specValue(specs: Specs | null, key: keyof Specs): string {
  if (!specs) return "Ma'lumot yo'q";
  const v = specs[key];
  if (v == null || (Array.isArray(v) && v.length === 0)) return "Ma'lumot yo'q";
  if (key === 'batteryMah') return `${v} mAh`;
  if (Array.isArray(v)) return v.join(' / ');
  return String(v);
}

export function Compare() {
  const navigate = useNavigate();
  const { compareIds, removeFromCompare, toggleCompare } = useCompare();
  const [items, setItems] = useState<CompareItem[]>([]);
  const [diffFields, setDiffFields] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showPicker, setShowPicker] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; name: string; image: string; price: number }[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (compareIds.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchCompare(compareIds)
      .then((data) => {
        if (cancelled) return;
        setItems(data.items ?? []);
        setDiffFields(new Set(data.diffFields ?? []));
        setError(null);
      })
      .catch(() => { if (!cancelled) setError("Ma'lumotlarni yuklab bo'lmadi"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [compareIds]);

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

  const bestBatteryMah = Math.max(
    0,
    ...items.map((it) => it.specs?.batteryMah ?? 0).filter((v) => v > 0),
  );
  const batteryVaries = new Set(items.map((it) => it.specs?.batteryMah ?? null)).size > 1;

  const bestPrice = items.length > 0 ? Math.min(...items.map((it) => it.product.price)) : 0;
  const priceVaries = new Set(items.map((it) => it.product.price)).size > 1;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <SEO
        title="Smartfonlarni solishtirish"
        description="Ikki yoki uchta smartfonni texnik xususiyatlari va do'konlardagi narxlari bo'yicha yonma-yon solishtiring."
        noindex
        canonicalUrl={`${SITE_URL}/compare`}
      />

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-violet-600 mb-4 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Orqaga
      </button>

      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Mahsulotlarni solishtirish</h1>
        {items.length < MAX_COMPARE && (
          <button
            onClick={() => setShowPicker((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-bold text-violet-600 bg-violet-50 dark:bg-violet-900/30 hover:bg-violet-100 dark:hover:bg-violet-900/50 px-3 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Mahsulot qo'shish
          </button>
        )}
      </div>

      {showPicker && (
        <div className="mb-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2 mb-3">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Mahsulot nomini kiriting..."
              className="flex-1 bg-transparent outline-none text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400"
            />
          </div>
          {searching && <p className="text-xs text-gray-400 font-bold px-1">Qidirilmoqda...</p>}
          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <p className="text-xs text-gray-400 font-bold px-1">Hech narsa topilmadi</p>
          )}
          <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => { toggleCompare(p.id); setQuery(''); setResults([]); setShowPicker(false); }}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors"
              >
                <img
                  src={p.image || 'https://placehold.co/80x80/f5f3ff/7c3aed?text=📱'}
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/80x80/f5f3ff/7c3aed?text=📱'; }}
                  alt={p.name}
                  className="w-10 h-10 object-contain shrink-0"
                />
                <span className="flex-1 text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{p.name}</span>
                <span className="text-xs font-black text-violet-600 shrink-0">{formatSum(p.price)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <div className="text-center py-16 text-gray-400 font-bold">Yuklanmoqda...</div>}
      {error && <div className="text-center py-16 text-red-500 font-bold">{error}</div>}

      {/* Bo'sh holat. Taqqoslash endi headerdan ochiladi, ya'ni bu yerga hech
          narsa tanlamagan foydalanuvchi ham tushadi — shuning uchun bu ekran
          boshi berk ko'cha bo'lmasligi va davom etish yo'lini ko'rsatishi kerak. */}
      {!loading && !error && items.length === 0 && (
        <div className="text-center py-16 px-4">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
            <Scale className="w-6 h-6 text-violet-500" />
          </div>
          <p className="text-lg font-black text-gray-900 dark:text-white mb-1.5">
            Hali hech narsa tanlanmagan
          </p>
          <p className="text-sm font-semibold text-gray-400 max-w-md mx-auto mb-6">
            Bir vaqtda {MAX_COMPARE} tagacha mahsulotni yonma-yon qo'yib, narxi va
            xususiyatlarini solishtirishingiz mumkin.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setShowPicker(true)}
              className="flex items-center gap-1.5 text-sm font-black text-white bg-violet-600 hover:bg-violet-700 px-4 py-2.5 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> Mahsulot qo'shish
            </button>
            <button
              onClick={() => navigate('/products')}
              className="flex items-center gap-1.5 text-sm font-black text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2.5 rounded-xl transition-colors"
            >
              <Store className="w-4 h-4" /> Katalogni ko'rish
            </button>
          </div>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
          <table className="w-full border-separate border-spacing-0 min-w-[640px]">
            <thead>
              <tr>
                <th className="w-40 sticky left-0 z-10 bg-gray-50 dark:bg-gray-900" />
                {items.map((item) => (
                  <th key={item.product.id} className="p-3 text-left align-top min-w-[180px] bg-gray-50 dark:bg-gray-900">
                    <div className="relative bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-3">
                      <button
                        onClick={() => removeFromCompare(item.product.id)}
                        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <img
                        src={item.product.image || 'https://placehold.co/200x200/f5f3ff/7c3aed?text=📱'}
                        alt={item.product.name}
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/200x200/f5f3ff/7c3aed?text=📱'; }}
                        className="w-full h-28 object-contain mb-2 cursor-pointer"
                        onClick={() => navigate(productPath(item.product))}
                      />
                      <p
                        onClick={() => navigate(productPath(item.product))}
                        className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 mb-1 cursor-pointer hover:text-violet-600"
                      >
                        {item.product.name}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <p className="text-base font-black text-violet-600">{formatSum(item.product.price)}</p>
                        {priceVaries && item.product.price === bestPrice && (
                          <span className="flex items-center gap-0.5 text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">
                            <Trophy className="w-2.5 h-2.5" /> Eng arzon
                          </span>
                        )}
                      </div>
                      {!item.specs && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-1">
                          Texnik xususiyatlar topilmadi
                        </p>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SPEC_GROUPS.map((group) => (
                <Fragment key={group.label}>
                  <tr>
                    <td
                      colSpan={items.length + 1}
                      className="sticky left-0 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-400 bg-violet-50/60 dark:bg-violet-900/10 border-t border-gray-100 dark:border-gray-800"
                    >
                      {group.label}
                    </td>
                  </tr>
                  {group.rows.map((row) => (
                    <tr key={row.key}>
                      <td className="p-3 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wide align-top sticky left-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                        {row.label}
                      </td>
                      {items.map((item) => {
                        const isBattery = row.key === 'batteryMah';
                        const isBest = isBattery && batteryVaries && (item.specs?.batteryMah ?? 0) === bestBatteryMah && bestBatteryMah > 0;
                        return (
                          <td
                            key={item.product.id}
                            className={`p-3 text-sm font-semibold align-top border-t border-gray-100 dark:border-gray-800 ${
                              diffFields.has(row.key) ? 'bg-violet-50/40 dark:bg-violet-900/10 text-violet-700 dark:text-violet-300' : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              {specValue(item.specs, row.key)}
                              {isBest && (
                                <span title="Eng katta batareya" className="text-emerald-600 shrink-0">
                                  <BatteryCharging className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}

              <tr>
                <td
                  colSpan={items.length + 1}
                  className="sticky left-0 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-400 bg-violet-50/60 dark:bg-violet-900/10 border-t border-gray-100 dark:border-gray-800"
                >
                  Do'konlardagi narxlar
                </td>
              </tr>
              <tr>
                <td className="p-3 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wide align-top sticky left-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                  Narxlar
                </td>
                {items.map((item) => (
                  <td key={item.product.id} className="p-3 align-top border-t border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col gap-1.5">
                      {[...item.product.markets].sort((a, b) => a.price - b.price).map((mkt, i) => (
                        <a
                          key={`${mkt.source}-${i}`}
                          href={mkt.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackStoreClick(item.product.id, mkt.source, mkt.price)}
                          className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            i === 0
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                              : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <span className="flex items-center gap-1 truncate">
                            <Store className="w-3 h-3 shrink-0" /> {mkt.source}
                          </span>
                          <span className="flex items-center gap-1 shrink-0">
                            {formatSum(mkt.price)} <ExternalLink className="w-3 h-3" />
                          </span>
                        </a>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
