import { AppWindow, BatteryFull, CalendarDays, Camera, Cpu, HardDrive, MemoryStick, ScanFace, Shield, Smartphone, Zap, type LucideIcon } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { SPEC_GROUPS, specValue, type Specs } from "./specs";

// Har xususiyat — bitta ixcham plitka: ikonka, nom, qiymat
const ICONS: Record<string, LucideIcon> = {
  display: Smartphone, chipset: Cpu, ram: MemoryStick, storage: HardDrive,
  mainCamera: Camera, selfieCamera: ScanFace, capacity: BatteryFull, charging: Zap,
  body: Shield, os: AppWindow, releaseYear: CalendarDays,
};

// Do'kon narxlari bu yerda takrorlanmaydi — ular takliflar bo'limida.
export function SpecsSection({ specs }: { specs: Specs | null }) {
  const { t } = useLanguage();
  const rows = specs ? SPEC_GROUPS.flatMap(g => g.rows)
    .map(row => ({ key: row.label, label: t.detailPage.specRows[row.label], value: specValue(specs, row.key) }))
    .filter((row): row is { key: typeof row.key; label: string; value: string } => row.value !== null) : [];

  return (
    <section id="specs" aria-labelledby="specs-title" className="scroll-mt-24 glass rounded-2xl p-4 md:p-5">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h2 id="specs-title" className="text-base font-semibold text-gray-900 dark:text-white">{t.detail.mainSpecifications}</h2>
        {specs?.displayName && <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{specs.displayName}</span>}
      </div>

      {/* GSMArena dan; mos model topilmasa — qisqa izoh */}
      {rows.length ? (
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {rows.map(row => {
            const Icon = ICONS[row.key] ?? Smartphone;
            return (
              <div key={row.key} className="flex items-start gap-2.5 rounded-xl bg-gray-900/[0.03] dark:bg-white/[0.04] px-3 py-2.5 min-w-0">
                <Icon className="mt-0.5 w-4 h-4 shrink-0 text-violet-500" aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="text-[11px] text-gray-500 dark:text-gray-400">{row.label}</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white leading-snug line-clamp-2" title={row.value}>{row.value}</dd>
                </div>
              </div>
            );
          })}
        </dl>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t.detailPage.specsUnavailable}</p>
      )}
    </section>
  );
}
