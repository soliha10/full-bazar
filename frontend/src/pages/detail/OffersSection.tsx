import { useMemo, useState } from "react";
import { ExternalLink, TrendingDown, TrendingUp } from "lucide-react";
import type { Product } from "../../components/ProductCard";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatSum, formatCheckedAt } from "../../utils/productMapper";
import { trackStoreClick } from "../../services/tracking";
import { StoreLogo } from "../../components/StoreLogo";
import type { PriceStats } from "./priceStats";
import type { PricePoint } from "./useProductDetail";
import { storeChanges } from "./storeChanges";

// Sukut bo'yicha shuncha do'kon; qolgani tugma orqali (yashirilmaydi — yig'iladi)
const VISIBLE = 5;
const CHANGE_DAYS = 30;

/**
 * Takliflar — narx kartasi ostidagi tor ustunda (Google Shopping "narxlarni
 * solishtiring" kabi): logo, do'kon, narx, eng arzonidan farq, havola ikonkasi.
 * Bitta ro'yxat barcha ekranlar uchun. Har do'konning 30 kunlik o'zgarishi shu
 * qatorda kichik belgi (tafsiloti — title da): ilgari alohida "Do'konlar
 * taqqoslanishi" kartasi bor edi va kam ma'lumot bilan katta joy egallardi.
 */
export function OffersSection({ product, stats, history, allMarkets }: {
  product: Product;
  stats: PriceStats;
  history: PricePoint[] | null;
  /** Barcha ranglar bo'yicha do'kon narxlari — narx tarixi shu narxlar bo'yicha yuritiladi */
  allMarkets: { source: string; price: number }[];
}) {
  const { t } = useLanguage();
  const d = t.detailPage;
  const [showAll, setShowAll] = useState(false);
  const { sortedMarkets } = stats;
  // Tarix rang bo'yicha emas, do'kon bo'yicha: o'zgarish do'konning umumiy narxidan
  // hisoblanadi va faqat shu qatordagi narx o'sha narx bo'lsa ko'rsatiladi
  // (aks holda tanlangan rang narxi bilan eski umumiy narx solishtirilib qolardi)
  const changes = useMemo(() => storeChanges(history, allMarkets, CHANGE_DAYS), [history, allMarkets]);
  if (!sortedMarkets.length) return null;
  const best = sortedMarkets[0].price;
  // Bitta qatorni yashirish uchun tugma shart emas — u ham shuncha joy oladi
  const collapsible = sortedMarkets.length > VISIBLE + 1;

  return (
    <section id="offers" aria-labelledby="offers-title" className="flex-1 flex flex-col glass rounded-2xl p-4">
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <h2 id="offers-title" className="text-sm font-semibold text-gray-900 dark:text-white">{d.navOffers}</h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">{d.offersCount.replace('{{count}}', String(sortedMarkets.length))}</span>
      </div>
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {(showAll || !collapsible ? sortedMarkets : sortedMarkets.slice(0, VISIBLE)).map((m, idx) => {
          const checked = formatCheckedAt(m.checkedAt, t.checkedAt);
          const go = d.goToStore.replace('{{store}}', m.source);
          const ch = changes[m.source];
          const moved = ch && ch.now === m.price && Math.abs(ch.pct) >= 0.05;
          return (
            <li key={`${m.source}-${idx}`} className="flex items-center gap-2.5 py-2">
              <StoreLogo name={m.source} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-gray-900 dark:text-white" title={checked ? `${m.source} · ${checked}` : m.source}>{m.source}</p>
                <p className="flex flex-wrap items-center gap-x-2 text-xs whitespace-nowrap">
                  {idx === 0 && sortedMarkets.length > 1 && <span className="text-emerald-600 dark:text-emerald-400">{d.cheapestBadge}</span>}
                  {moved && (
                    <span title={`${d.changeTab.replace('{{n}}', String(CHANGE_DAYS))}: ${formatSum(ch.first)} → ${formatSum(ch.now)}`}
                      className={`inline-flex items-center gap-0.5 tabular-nums cursor-default ${ch.pct < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                      {ch.pct < 0 ? <TrendingDown className="w-3 h-3" aria-hidden="true" /> : <TrendingUp className="w-3 h-3" aria-hidden="true" />}
                      {Math.abs(ch.pct).toFixed(1)}%
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="whitespace-nowrap text-sm font-semibold tabular-nums text-gray-900 dark:text-white">{formatSum(m.price)}</p>
                {m.price > best && <p className="whitespace-nowrap text-xs text-gray-400 dark:text-gray-500 tabular-nums">+{formatSum(m.price - best)}</p>}
              </div>
              <a href={m.url} target="_blank" rel="noopener noreferrer" title={go} aria-label={go}
                onClick={() => trackStoreClick(product.id, m.source, m.price)}
                className="flex w-8 h-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </li>
          );
        })}
      </ul>
      {collapsible && (
        <button type="button" onClick={() => setShowAll(v => !v)} aria-expanded={showAll}
          className="mt-auto w-full pt-2 text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline">
          {showAll ? d.showFewerStores : d.showMoreStores.replace('{{count}}', String(sortedMarkets.length - VISIBLE))}
        </button>
      )}
    </section>
  );
}
