import { useLanguage } from "../../contexts/LanguageContext";
import { SPEC_GROUPS, specValue, type Specs } from "./specs";

export type DetailTab = 'overview' | 'specs' | 'priceHistory';

// Do'kon narxlari bu yerda takrorlanmaydi — ular sahifa tepasidagi
// takliflar jadvalida bor (ilgari bir sahifada uch marta chiqardi).
export function SpecsSection({ specs, activeTab }: {
  specs: Specs | null;
  activeTab: DetailTab;
}) {
  const { t } = useLanguage();

  return (
    <section
      id="specs"
      className={`${activeTab !== 'specs' && 'hidden md:block'} space-y-6 bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-800`}
    >
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">{t.detail.mainSpecifications}</h2>

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
                <h3 className="text-sm font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
                  {t.detailPage.specGroups[group.group]}
                </h3>
                <dl className="space-y-2.5">
                  {rows.map(row => (
                    <div key={row.label} className="flex justify-between gap-4 text-sm">
                      <dt className="text-gray-500 dark:text-gray-400 shrink-0">{row.label}</dt>
                      <dd className="text-gray-900 dark:text-white text-right">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t.detailPage.specsUnavailable}
        </p>
      )}

    </section>
  );
}
