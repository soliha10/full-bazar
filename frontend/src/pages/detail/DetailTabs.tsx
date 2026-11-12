import type { Product } from "../../components/ProductCard";
import { useLanguage } from "../../contexts/LanguageContext";
import type { PriceStats } from "./priceStats";
import type { Specs } from "./specs";
import { SpecsSection, type DetailTab } from "./SpecsSection";

/**
 * ── Tabs / Bottom Section ──
 * Mobilda tavsif, xususiyatlar va narx tarixi tablar orqali almashadi;
 * desktopda hammasi birga ko'rinadi (tab tugmalari yashiringan).
 */
export function DetailTabs({ product, specs, sortedMarkets, activeTab, onTabChange }: {
  product: Product;
  specs: Specs | null;
  sortedMarkets: PriceStats['sortedMarkets'];
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="mt-10 md:mt-16">
      {/* Mobile tabs */}
      <div className="md:hidden bg-white dark:bg-gray-900 rounded-2xl p-1 border border-gray-100 dark:border-gray-800 shadow-sm mb-6 flex">
        {(['overview', 'specs', 'priceHistory'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex-1 py-2.5 px-1 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all ${
              activeTab === tab
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            {tab === 'overview' ? t.detail.overview
              : tab === 'specs' ? t.detail.specs
              : t.detailPage.priceHistoryTab}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8 lg:gap-16">
        {/* Main content */}
        <div className={`lg:col-span-3 space-y-8 ${activeTab !== 'overview' && 'hidden md:block'}`}>
          {product.description && (
          <section id="overview" className="space-y-4">
            <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-1 h-6 bg-violet-600 rounded-full" />
              {t.detail.productStory}
            </h2>
            <p className="text-base text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
              {product.description}
            </p>
          </section>
          )}

          <SpecsSection specs={specs} sortedMarkets={sortedMarkets} activeTab={activeTab} />
        </div>

      </div>
    </div>
  );
}
