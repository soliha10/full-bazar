import { useLanguage } from '../../../contexts/LanguageContext';
import type { ListingFilters } from '../useListingFilters';
import { SLabel } from './ui';

/**
 * Xususiyatlar — RAM, xotira, batareya.
 * Xalqaro agregatorlarda bu asosiy filtrlardan biri: foydalanuvchi
 * "8GB RAM va 256GB xotirali telefon" deb qidiradi, brend bo'yicha
 * emas. Qiymatlar /api/spec-facets dan keladi, shuning uchun ro'yxatda
 * faqat haqiqatan mavjud variantlar chiqadi.
 */
export function SpecsFilter({ f, isMobile }: { f: ListingFilters; isMobile: boolean }) {
  const { t } = useLanguage();
  const { specFacets } = f;

  // Xususiyat filtrlari — mobil rejimda draft, desktopda darhol qo'llanadi
  const ramSel     = isMobile ? f.draftRam : f.selectedRam;
  const storageSel = isMobile ? f.draftStorage : f.selectedStorage;
  const batterySel = isMobile ? f.draftBattery : f.minBattery;
  const toggleSpec = (list: string[], value: string, set: (v: string[]) => void) =>
    set(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
  const setRam     = (v: string[]) => (isMobile ? f.setDraftRam : f.setSelectedRam)(v);
  const setStorage = (v: string[]) => (isMobile ? f.setDraftStorage : f.setSelectedStorage)(v);
  const setBattery = (v: number)   => (isMobile ? f.setDraftBattery : f.setMinBattery)(v);

  return (
    <div className={isMobile ? "py-1" : "py-3"}>
      <div className="flex items-center justify-between mb-2">
        <SLabel>{t.listing.specs}</SLabel>
        {(ramSel.length > 0 || storageSel.length > 0 || batterySel > 0) && (
          <button
            onClick={() => { setRam([]); setStorage([]); setBattery(0); }}
            className="text-[11px] text-violet-500 hover:underline leading-none"
          >
            {t.listing.clear}
          </button>
        )}
      </div>

      {specFacets.ram.length > 0 && (
        <>
          <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5">RAM</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {specFacets.ram.map(({ value, count }) => {
              const on = ramSel.includes(value);
              return (
                <button key={value} type="button"
                  onClick={() => toggleSpec(ramSel, value, setRam)}
                  aria-pressed={on} title={`${count}`}
                  className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold border transition-colors ${
                    on ? 'bg-violet-600 border-violet-600 text-white'
                       : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-400'
                  }`}>
                  {value}
                </button>
              );
            })}
          </div>
        </>
      )}

      {specFacets.storage.length > 0 && (
        <>
          <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5">{t.listing.storage}</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {specFacets.storage.map(({ value, count }) => {
              const on = storageSel.includes(value);
              return (
                <button key={value} type="button"
                  onClick={() => toggleSpec(storageSel, value, setStorage)}
                  aria-pressed={on} title={`${count}`}
                  className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold border transition-colors ${
                    on ? 'bg-violet-600 border-violet-600 text-white'
                       : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-400'
                  }`}>
                  {value}
                </button>
              );
            })}
          </div>
        </>
      )}

      {specFacets.battery.length > 0 && (
        <>
          <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5">{t.listing.battery}</p>
          <div className="flex flex-wrap gap-1.5">
            {[0, ...specFacets.battery.map(b => b.min)].map(v => (
              <button key={v} type="button"
                onClick={() => setBattery(v)}
                aria-pressed={batterySel === v}
                className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold border transition-colors ${
                  batterySel === v ? 'bg-violet-600 border-violet-600 text-white'
                                   : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-400'
                }`}>
                {v === 0 ? t.listing.allOption : `${v}+ mAh`}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
