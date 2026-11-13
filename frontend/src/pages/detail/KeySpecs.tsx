import { useLanguage } from "../../contexts/LanguageContext";
import { specValue, type Specs } from "./specs";

// Sarlavha ostidagi qisqa xulosa — xaridor birinchi qaraydigan 5 ta xususiyat
const KEYS: (keyof Specs)[] = ['display', 'chipset', 'storageOptions', 'mainCamera', 'batteryMah'];

/** Asosiy xususiyatlar chiplari; to'liq jadval pastdagi "Xususiyatlar" bo'limida. */
export function KeySpecs({ specs }: { specs: Specs | null }) {
  const { t } = useLanguage();
  if (!specs) return null;
  const items = KEYS
    .map(key => {
      const v = specValue(specs, key);
      // "48MP + 12MP (dual, wide + ultrawide)" -> "48MP + 12MP"
      return key === 'mainCamera' && v ? v.split('(')[0].trim() : v;
    })
    .filter((v): v is string => !!v);
  if (!items.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map(v => (
        <span key={v} className="rounded-lg bg-gray-900/5 dark:bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-200">
          {v}
        </span>
      ))}
      <a href="#specs" className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline">
        {t.detailPage.allSpecs} →
      </a>
    </div>
  );
}
