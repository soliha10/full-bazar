import { useLanguage } from '../../../contexts/LanguageContext';
import type { ListingFilters } from '../useListingFilters';
import { Chip, ClearButton, Section } from './ui';

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

  const active = ramSel.length > 0 || storageSel.length > 0 || batterySel > 0;
  const groupLabel = 'text-xs text-gray-500 dark:text-gray-400 mb-1.5';

  return (
    <Section title={t.listing.specs} isMobile={isMobile}
      // Hech narsa tanlanmagan bo'lsa yopiq: bo'lim eng uzuni
      defaultOpen={active}
      action={active ? <ClearButton label={t.listing.clear} onClick={() => { setRam([]); setStorage([]); setBattery(0); }} /> : null}>
      {specFacets.ram.length > 0 && (
        <>
          <p className={groupLabel}>RAM</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {specFacets.ram.map(({ value, count }) => (
              <Chip key={value} on={ramSel.includes(value)} title={`${count}`}
                onClick={() => toggleSpec(ramSel, value, setRam)}>{value}</Chip>
            ))}
          </div>
        </>
      )}
      {specFacets.storage.length > 0 && (
        <>
          <p className={groupLabel}>{t.listing.storage}</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {specFacets.storage.map(({ value, count }) => (
              <Chip key={value} on={storageSel.includes(value)} title={`${count}`}
                onClick={() => toggleSpec(storageSel, value, setStorage)}>{value}</Chip>
            ))}
          </div>
        </>
      )}
      {specFacets.battery.length > 0 && (
        <>
          <p className={groupLabel}>{t.listing.battery}</p>
          <div className="flex flex-wrap gap-1.5">
            {[0, ...specFacets.battery.map(b => b.min)].map(v => (
              <Chip key={v} on={batterySel === v} onClick={() => setBattery(v)}>
                {v === 0 ? t.listing.allOption : `${v}+ mAh`}
              </Chip>
            ))}
          </div>
        </>
      )}
    </Section>
  );
}
