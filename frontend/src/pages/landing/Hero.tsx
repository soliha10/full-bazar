import { useState, useRef, FormEvent } from 'react';
import { ArrowRight, Search, Sparkles, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatSum } from '../../utils/productMapper';
import { productPath } from '../../utils/slug';
import type { Product } from '../../components/ProductCard';
import type { BrandFacet } from '../../hooks/useBrands';
import { PLACEHOLDER } from './shared';

/* ── Hero: haqiqiy mahsulotning haqiqiy narxlari ── */
function ShowcaseCard({ product, labels, compact = false }: {
  product: Product;
  labels: { label: string; cheapest: string; gap: string; cta: string };
  compact?: boolean;
}) {
  const offers = [...(product.markets ?? [])].sort((a, b) => a.price - b.price).slice(0, compact ? 3 : 4);
  if (offers.length < 2) return null;
  const all = (product.markets ?? []).map(m => m.price);
  const gap = Math.max(...all) - Math.min(...all);
  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-4 md:p-5 w-full md:w-[340px] text-left">
      <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5">
        <span className="relative flex w-2 h-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" />
        </span>
        {labels.label}
      </p>
      <Link to={productPath(product)} className="flex items-center gap-3 mb-3 group">
        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shrink-0 overflow-hidden">
          <img src={product.image || PLACEHOLDER} alt="" className="w-full h-full object-contain p-1.5"
            onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
        </div>
        <p className="text-white text-sm font-bold leading-snug line-clamp-2 group-hover:underline">{product.name}</p>
      </Link>
      <ul className="space-y-1.5">
        {offers.map((o, i) => (
          <li key={o.source} className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 ${i === 0 ? 'bg-emerald-400/20 border border-emerald-300/30' : 'bg-white/5'}`}>
            <span className="text-sm font-semibold text-white/90 truncate flex items-center gap-1.5">
              {i === 0 && <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0" aria-hidden="true" />}
              {o.source}
              {i === 0 && <span className="sr-only"> — {labels.cheapest}</span>}
            </span>
            <span className={`text-sm font-black shrink-0 ${i === 0 ? 'text-emerald-200' : 'text-white/70'}`}>{formatSum(o.price)}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-white/10">
        <span className="text-xs font-bold text-emerald-200">{labels.gap.replace('{{amount}}', formatSum(gap))}</span>
        <Link to={productPath(product)} className="text-xs font-black text-white hover:underline flex items-center gap-1">
          {labels.cta} <ArrowRight className="w-3 h-3" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

export function Hero({ hasStats, fill, showcase, dealsLoading, topBrands }: {
  hasStats: boolean;
  fill: (s: string) => string;
  showcase: Product | undefined;
  dealsLoading: boolean;
  topBrands: BrandFacet[];
}) {
  const { t } = useLanguage();
  const h = t.home;
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) { searchRef.current?.focus(); return; }
    navigate(`/products?search=${encodeURIComponent(q)}`);
  };

  return (
    <section aria-labelledby="hero-title" className="md:px-4 md:pt-6 md:max-w-7xl md:mx-auto">
      <div className="relative md:rounded-[2rem] overflow-hidden bg-linear-to-br from-violet-600 via-violet-700 to-indigo-900 shadow-2xl shadow-violet-500/25">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/[0.06]" />
          <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-fuchsia-400/10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_45%)]" />
        </div>

        <div className="relative z-10 px-5 pt-7 pb-6 md:px-12 md:py-14 flex flex-col md:flex-row md:items-center gap-8 md:gap-12">
          <div className="flex-1 min-w-0">
            <p className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-3 py-1 mb-4 text-white/90 text-[11px] font-bold uppercase tracking-widest">
              <Sparkles className="w-3 h-3 text-yellow-300" aria-hidden="true" />
              {hasStats ? fill(h.eyebrow) : <span className="inline-block w-40 h-3 rounded-full bg-white/20 animate-pulse" />}
            </p>
            <h1 id="hero-title" className="text-white font-black leading-[1.08] tracking-tight mb-3" style={{ fontSize: 'clamp(1.9rem, 6vw, 3.4rem)' }}>
              {h.title}
            </h1>
            <p className="text-white/75 text-sm md:text-lg leading-relaxed mb-6 max-w-xl">
              {hasStats ? fill(h.subtitle) : <span className="inline-block w-64 h-4 rounded-full bg-white/15 animate-pulse" />}
            </p>

            <form role="search" onSubmit={onSearch} className="flex items-center gap-2 bg-white rounded-2xl p-1.5 shadow-xl shadow-black/20 max-w-xl">
              <label htmlFor="hero-search" className="sr-only">{h.searchButton}</label>
              <Search className="w-5 h-5 text-gray-400 ml-2 shrink-0" aria-hidden="true" />
              <input
                ref={searchRef} id="hero-search" type="search" value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={h.searchPlaceholder} enterKeyHint="search" autoComplete="off"
                className="flex-1 min-w-0 bg-transparent px-1 py-2.5 text-sm md:text-base text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
              <button type="submit" className="shrink-0 bg-violet-600 hover:bg-violet-700 text-white font-black text-sm rounded-xl px-4 md:px-6 py-2.5 transition-colors">
                {h.searchButton}
              </button>
            </form>

            {topBrands.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span className="text-white/60 text-xs font-semibold">{h.popular}</span>
                {topBrands.map(b => (
                  <Link key={b.key} to={`/products?brand=${encodeURIComponent(b.key)}`}
                    className="text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-full px-3 py-1 transition-colors">
                    {b.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="md:shrink-0">
            {showcase ? (
              <ShowcaseCard product={showcase}
                labels={{ label: h.showcaseLabel, cheapest: h.showcaseCheapest, gap: h.showcaseGap, cta: h.showcaseCta }} />
            ) : dealsLoading ? (
              <div className="w-full md:w-[340px] h-64 rounded-3xl bg-white/10 animate-pulse" aria-hidden="true" />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
