import { useState } from "react";
import type { Product } from "../../components/ProductCard";
import { useLanguage } from "../../contexts/LanguageContext";
import type { PriceStats } from "./priceStats";
import { OffersTable } from "./OffersTable";
import { MobileOffers } from "./MobileOffers";

/** Takliflar bo'limi — sahifaning asosiy qismi, to'liq kenglikda. */
export function OffersSection({ product, stats }: { product: Product; stats: PriceStats }) {
  const { t } = useLanguage();
  const d = t.detailPage;
  const [showAll, setShowAll] = useState(false);
  const { sortedMarkets } = stats;
  if (!sortedMarkets.length) return null;

  return (
    <section id="offers" aria-labelledby="offers-title" className="h-full scroll-mt-24 glass rounded-2xl p-4 md:p-5">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <h2 id="offers-title" className="text-base font-semibold text-gray-900 dark:text-white">{d.navOffers}</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">{d.offersCount.replace('{{count}}', String(sortedMarkets.length))}</span>
      </div>
      <OffersTable product={product} sortedMarkets={sortedMarkets} showAll={showAll} onToggleShowAll={() => setShowAll(v => !v)} />
      <MobileOffers product={product} sortedMarkets={sortedMarkets} showAllMarkets={showAll} onToggleShowAll={() => setShowAll(v => !v)} />
    </section>
  );
}
