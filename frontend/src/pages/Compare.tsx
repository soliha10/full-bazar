import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { fetchCompare } from '../services/api';
import { useCompare, MAX_COMPARE } from '../contexts/CompareContext';
import { SEO, SITE_URL } from '../components/SEO';
import { productPath } from '../utils/slug';
import { useLanguage } from '../contexts/LanguageContext';
import type { CompareItem, Verdict } from './compare/types';
import { VerdictPanel } from './compare/VerdictPanel';
import { AddProductPanel, useCompareSearch } from './compare/AddProductPanel';
import { EmptyState } from './compare/EmptyState';
import { SpecTable } from './compare/SpecTable';

export function Compare() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { compareIds, removeFromCompare, toggleCompare } = useCompare();
  const [items, setItems] = useState<CompareItem[]>([]);
  const [diffFields, setDiffFields] = useState<Set<string>>(new Set());
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [showPicker, setShowPicker] = useState(false);
  const search = useCompareSearch(showPicker, compareIds);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (compareIds.length === 0) {
      setItems([]);
      setVerdict(null);
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
        setVerdict(data.verdict ?? null);
        setError(false);
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [compareIds]);

  const openProduct = (it: CompareItem) => navigate(productPath(it.product));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <SEO
        title={t.compare.seoTitle}
        description={t.compare.seoDescription}
        noindex
        canonicalUrl={`${SITE_URL}/compare`}
      />

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-violet-600 mb-4 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> {t.common.back}
      </button>

      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t.compare.title}</h1>
        {items.length < MAX_COMPARE && (
          <button
            onClick={() => setShowPicker((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-bold text-violet-600 bg-violet-50 dark:bg-violet-900/30 hover:bg-violet-100 dark:hover:bg-violet-900/50 px-3 py-2 rounded-xl transition-colors"
          >
            {t.compare.addProduct}
          </button>
        )}
      </div>

      {showPicker && (
        <AddProductPanel search={search}
          onPick={(id) => { toggleCompare(id); setShowPicker(false); }} />
      )}

      {loading && <div className="text-center py-16 text-gray-400 font-bold">{t.common.loading}</div>}
      {error && <div className="text-center py-16 text-red-500 font-bold">{t.compare.loadError}</div>}

      {!loading && !error && items.length === 0 && (
        <EmptyState onAdd={() => setShowPicker(true)} onBrowse={() => navigate('/products')} />
      )}

      {!loading && !error && verdict && items.length > 1 && (
        <VerdictPanel verdict={verdict} items={items} onOpen={openProduct} />
      )}

      {!loading && !error && items.length > 0 && (
        <SpecTable items={items} diffFields={diffFields} verdict={verdict}
          onRemove={removeFromCompare} onOpen={openProduct} />
      )}
    </div>
  );
}
