import { useLanguage } from "../../contexts/LanguageContext";
import { formatSum } from "../../utils/productMapper";
import type { PriceStats } from "./priceStats";
import { SPEC_GROUPS, specValue, type Specs } from "./specs";

export type DetailTab = 'overview' | 'specs' | 'priceHistory';

export function SpecsSection({ specs, sortedMarkets, activeTab }: {
  specs: Specs | null;
  sortedMarkets: PriceStats['sortedMarkets'];
  activeTab: DetailTab;
}) {
  const { t } = useLanguage();

  return (
    <section
      id="specs"
      className={`${activeTab !== 'specs' && 'hidden md:block'} space-y-6 bg-white dark:bg-gray-900 rounded-2xl md:rounded-3xl p-6 md:p-10 border border-gray-100 dark:border-gray-800 shadow-sm`}
    >
      <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{t.detail.mainSpecifications}</h2>

      {/* Texnik xususiyatlar — GSMArena dan. Mos model topilmasa
          bo'limni umuman ko'rsatmaymiz: bo'sh jadval "ma'lumot yo'q"
          degan taassurotdan ham yomonroq. */}
      {specs ? (
        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-6">
          {SPEC_GROUPS.map(group => {
            const rows = group.rows
              .map(row => ({ label: t.detailPage.specRows[row.label], value: specValue(specs, row.key) }))
              .filter(row => row.value !== null);
            if (rows.length === 0) return null;
            return (
              <div key={group.group} className="space-y-3">
                <h3 className="text-xs font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest border-b border-violet-100 dark:border-violet-900/30 pb-2">
                  {t.detailPage.specGroups[group.group]}
                </h3>
                <dl className="space-y-2.5">
                  {rows.map(row => (
                    <div key={row.label} className="flex justify-between gap-4 text-sm">
                      <dt className="font-bold text-gray-400 dark:text-gray-500 shrink-0">{row.label}</dt>
                      <dd className="font-bold text-gray-900 dark:text-white text-right">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm font-bold text-gray-400 dark:text-gray-500">
          {t.detailPage.specsUnavailable}
        </p>
      )}

      {/* Do'kon narxlari — xususiyatlarni ko'rgandan keyingi keyingi
          qadam: "qaysi do'kondan olsam arzon bo'ladi?" */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest border-b border-violet-100 dark:border-violet-900/30 pb-2">
          {t.detail.compareStores}
        </h3>
        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-2.5">
          {sortedMarkets.map((market, i) => (
            <div key={`${market.source}-${i}`} className="flex justify-between items-center text-sm">
              <span className="font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                {market.source}
                {i === 0 && sortedMarkets.length > 1 && (
                  <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">
                    {t.detailPage.cheapestBadge}
                  </span>
                )}
              </span>
              <span className="font-black text-gray-900 dark:text-white">{formatSum(market.price)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
