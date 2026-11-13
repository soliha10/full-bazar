import { useEffect, useState } from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { formatSum } from '../../utils/productMapper';
import { productPath } from '../../utils/slug';
import type { Product } from '../../components/ProductCard';
import { StoreLogo } from '../../components/StoreLogo';
import { PLACEHOLDER } from './shared';
import { Card } from "../../components/Card";

export interface DeckLabels { label: string; cheapest: string; gap: string; cta: string; next: string }

const ROTATE_MS = 4500;

/** Bitta karta: haqiqiy mahsulot, uning eng arzon 3 ta do'kon narxi va farq. */
function DealCard({ product, labels, back }: { product: Product; labels: DeckLabels; back: boolean }) {
  const offers = [...(product.markets ?? [])].sort((a, b) => a.price - b.price);
  const gap = offers.length > 1 ? offers[offers.length - 1].price - offers[0].price : 0;
  return (
    <Card solid radius="3xl" className="md:p-5 h-full">
      {/* Orqadagi kartalar — bo'sh "qog'oz": ularning matni tepadagisi ostidan ko'rinib qolmasin */}
      <div className={`h-full flex flex-col transition-opacity duration-300 ${back ? 'opacity-0' : 'opacity-100'}`}>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{labels.label}</p>
      <Link to={productPath(product)} className="flex items-center gap-3 mb-3 group">
        <span className="w-16 h-16 rounded-2xl glass-soft flex items-center justify-center shrink-0 overflow-hidden">
          <img src={product.image || PLACEHOLDER} alt="" className="w-full h-full object-contain p-1.5 mix-blend-multiply dark:mix-blend-normal"
            onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
        </span>
        <span className="text-gray-900 dark:text-white text-sm font-medium leading-snug line-clamp-2 group-hover:underline">
          {product.name}
        </span>
      </Link>
      <ul className="divide-y divide-gray-900/5 dark:divide-white/10 flex-1">
        {offers.slice(0, 3).map((o, i) => (
          <li key={o.source} className="flex items-center justify-between gap-3 py-2">
            <span className={`flex items-center gap-2 text-sm truncate ${i === 0 ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
              <StoreLogo name={o.source} size="sm" />
              {o.source}
              {i === 0 && <span className="sr-only"> — {labels.cheapest}</span>}
            </span>
            <span className={`text-sm shrink-0 tabular-nums ${i === 0 ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'}`}>
              {formatSum(o.price)}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-2 mt-2 pt-3 border-t border-gray-900/5 dark:border-white/10">
        <span className="min-w-0 truncate text-xs text-gray-500 dark:text-gray-400">{labels.gap.replace('{{amount}}', formatSum(gap))}</span>
        {/* Eng tor telefonda (<380px) — strelka: to'liq matn narx farqini siqib qo'yardi */}
        <Link to={productPath(product)} aria-label={labels.cta} data-tip={labels.cta}
          className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline">
          <span className="hidden min-[380px]:inline">{labels.cta}</span>
          <ArrowRight className="w-4 h-4 min-[380px]:hidden" aria-hidden="true" />
        </Link>
      </div>
      </div>
    </Card>
  );
}

/**
 * Ustma-ust taxlangan kartalar: tepadagisi — hozirgi taklif, ortidagilari
 * biroz pastroq va kichikroq. Har 4.5 soniyada (yoki tugma bosilganda)
 * tepadagi karta dastaning ostiga o'tadi. Sichqoncha ustida turganda va
 * "kamroq harakat" sozlamasida aylanmaydi.
 */
export function DealDeck({ deals, labels }: { deals: Product[]; labels: DeckLabels }) {
  const [order, setOrder] = useState(() => deals.map((_, i) => i));
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => { setOrder(deals.map((_, i) => i)); }, [deals]);
  const next = () => setOrder(o => [...o.slice(1), o[0]]);

  useEffect(() => {
    if (paused || reduce || deals.length < 2) return;
    const id = window.setInterval(next, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [paused, reduce, deals.length]);

  if (deals.length === 0) return null;
  return (
    <div className="relative w-full md:w-[360px]" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      {/* Balandlikni tepadagi karta belgilaydi; qolganlari uning ustida absolyut */}
      <div className="relative h-[334px]">
        {/* Hamma karta doim chiziladi (z-index chuqurlikka qarab) — tepadagisi
            ortga o'tganda yo'qolib qolmaydi, animatsiya bilan dastaning ostiga tushadi */}
        {deals.map((deal, idx) => {
          const depth = order.indexOf(idx);
          return (
            <m.div key={deal.id} className="absolute inset-x-0 top-0 h-[290px]"
              style={{ zIndex: 10 - depth, pointerEvents: depth === 0 ? 'auto' : 'none', transformOrigin: 'bottom center' }}
              initial={false}
              animate={{ y: depth * 20, scale: 1 - depth * 0.06, opacity: depth > 2 ? 0 : 1 - depth * 0.3 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              aria-hidden={depth !== 0}>
              <DealCard product={deal} labels={labels} back={depth !== 0} />
            </m.div>
          );
        })}
      </div>
      {deals.length > 1 && (
        <div className="flex items-center justify-center gap-3 mt-1">
          <div className="flex gap-1.5" aria-hidden="true">
            {deals.map((d, i) => (
              <span key={d.id} className={`h-1.5 rounded-full transition-all ${order[0] === i ? 'w-5 bg-violet-600' : 'w-1.5 bg-gray-300 dark:bg-gray-600'}`} />
            ))}
          </div>
          <button type="button" onClick={next}
            className="glass-soft rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:text-violet-700 dark:hover:text-violet-300 transition-colors">
            {labels.next}
          </button>
        </div>
      )}
    </div>
  );
}
