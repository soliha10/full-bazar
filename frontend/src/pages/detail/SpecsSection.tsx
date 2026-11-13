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

  const groups = specs ? SPEC_GROUPS.map(group => ({
    key: group.group,
    rows: group.rows
      .map(row => ({ label: t.detailPage.specRows[row.label], value: specValue(specs, row.key) }))
      .filter((row): row is { label: string; value: string } => row.value !== null),
  })).filter(g => g.rows.length > 0) : [];

  // Ixcham jadval: chapda guruh nomi, o'ngda qatorlar — har guruh bitta
  // satr bloki, bo'sh guruh umuman chiqmaydi
  return (
    <section
      id="specs"
      className={`${activeTab !== 'specs' && 'hidden md:block'} glass rounded-2xl overflow-hidden`}
    >
      <header className="flex items-baseline justify-between gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">{t.detail.mainSpecifications}</h2>
        {specs?.displayName && <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{specs.displayName}</span>}
      </header>

      {/* Texnik xususiyatlar — GSMArena dan; mos model topilmasa — qisqa izoh */}
      {groups.length ? (
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {groups.map(group => (
            <div key={group.key} className="grid sm:grid-cols-[10rem_1fr] gap-x-6 px-5 py-3">
              <h3 className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 pt-0.5 mb-1.5 sm:mb-0">
                {t.detailPage.specGroups[group.key]}
              </h3>
              <dl className="grid md:grid-cols-2 gap-x-8 gap-y-1.5">
                {group.rows.map(row => (
                  <div key={row.label} className="grid grid-cols-[8rem_1fr] gap-3 text-sm min-w-0">
                    <dt className="text-gray-500 dark:text-gray-400">{row.label}</dt>
                    <dd className="text-gray-900 dark:text-white break-words min-w-0">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      ) : (
        <p className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{t.detailPage.specsUnavailable}</p>
      )}
    </section>
  );
}
