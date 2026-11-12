import type { Product } from "../../components/ProductCard";
import { useLanguage } from "../../contexts/LanguageContext";
import type { Specs } from "./specs";
import { SpecsSection, type DetailTab } from "./SpecsSection";

/**
 * ── Tabs / Bottom Section ──
 * Mobilda tavsif, xususiyatlar va narx tarixi tablar orqali almashadi;
 * desktopda hammasi birga ko'rinadi (tab tugmalari yashiringan).
 */
export function DetailTabs({ product, specs, activeTab, onTabChange }: {
  product: Product;
  specs: Specs | null;
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="mt-10 md:mt-16">
      {/* Mobile tabs */}
      <div className="md:hidden border-b border-gray-200 dark:border-gray-800 mb-6 flex">
        {(['overview', 'specs', 'priceHistory'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex-1 py-2.5 px-1 -mb-px border-b-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'border-violet-600 text-gray-900 dark:text-white'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t.detail.productStory}
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              {product.description}
            </p>
          </section>
          )}

          <SpecsSection specs={specs} activeTab={activeTab} />
        </div>

      </div>
    </div>
  );
}
