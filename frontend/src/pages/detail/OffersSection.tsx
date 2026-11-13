import { useState } from "react";
import { ExternalLink } from "lucide-react";
import type { Product } from "../../components/ProductCard";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatSum, formatCheckedAt } from "../../utils/productMapper";
import { trackStoreClick } from "../../services/tracking";
import { StoreLogo } from "../../components/StoreLogo";
import type { PriceStats } from "./priceStats";
import { Card, CardHeader } from "../../components/Card";

// Sukut bo'yicha shuncha do'kon; qolgani tugma orqali (yashirilmaydi — yig'iladi)
const VISIBLE = 5;

/**
 * Takliflar: logo, do'kon, narx, havola — boshqa hech narsa. Ro'yxat narx bo'yicha
 * tartiblangan (birinchisi — eng arzon, u narx kartasida ham), farq va o'zgarishlar
 * raqamlar yonma-yon turgani uchun alohida yozilmaydi; tekshirilgan vaqt — title da.
 */
export function OffersSection({ product, stats }: { product: Product; stats: PriceStats }) {
  const { t } = useLanguage();
  const d = t.detailPage;
  const [showAll, setShowAll] = useState(false);
  const { sortedMarkets } = stats;
  if (!sortedMarkets.length) return null;
  // Bitta qatorni yashirish uchun tugma shart emas — u ham shuncha joy oladi
  const collapsible = sortedMarkets.length > VISIBLE + 1;

  return (
    <Card as="section" id="offers" aria-labelledby="offers-title" className="flex-1 flex flex-col">
      <CardHeader id="offers-title" title={d.navOffers} aside={d.offersCount.replace('{{count}}', String(sortedMarkets.length))} className="mb-1.5" />
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {(showAll || !collapsible ? sortedMarkets : sortedMarkets.slice(0, VISIBLE)).map((m, idx) => {
          const checked = formatCheckedAt(m.checkedAt, t.checkedAt);
          const go = d.goToStore.replace('{{store}}', m.source);
          return (
            <li key={`${m.source}-${idx}`} className="flex items-center gap-2.5 py-2">
              <StoreLogo name={m.source} size="sm" />
              <p className="min-w-0 flex-1 truncate text-sm text-gray-900 dark:text-white" data-tip={checked ? `${m.source} · ${checked}` : m.source}>{m.source}</p>
              <p className="whitespace-nowrap text-sm font-semibold tabular-nums text-gray-900 dark:text-white">{formatSum(m.price)}</p>
              <a href={m.url} target="_blank" rel="noopener noreferrer" data-tip={go} aria-label={go}
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
    </Card>
  );
}
