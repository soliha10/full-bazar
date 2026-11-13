import { AppWindow, BatteryFull, CalendarDays, Camera, Cpu, HardDrive, MemoryStick, ScanFace, Shield, Smartphone, Zap, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { SPEC_GROUPS, specValue, type Specs } from "./specs";
import { Card, CardHeader } from "../../components/Card";

// Har xususiyat — ixcham plitka: ikonka, kichik nom va qiymat. Nom ko'rinib turadi:
// "6GB" va "128GB" ning qaysi biri RAM, qaysi biri xotira ekani bir qarashda bilinsin
const ICONS: Record<string, LucideIcon> = {
  display: Smartphone, chipset: Cpu, ram: MemoryStick, storage: HardDrive,
  mainCamera: Camera, selfieCamera: ScanFace, capacity: BatteryFull, charging: Zap,
  body: Shield, os: AppWindow, releaseYear: CalendarDays,
};

// Yig'ilgan holatda shuncha plitka (4 qator) — qolgani tugma orqali; aks holda
// xususiyati ko'p modelda yuqori qator cho'zilib, qo'shni ustunlarda bo'sh joy qolardi
const COLLAPSED = 8;

// Do'kon narxlari bu yerda takrorlanmaydi — ular takliflar bo'limida.
export function SpecsSection({ specs }: { specs: Specs | null }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const rows = specs ? SPEC_GROUPS.flatMap(g => g.rows)
    .map(row => ({ key: row.label, label: t.detailPage.specRows[row.label], value: specValue(specs, row.key) }))
    .filter((row): row is { key: typeof row.key; label: string; value: string } => row.value !== null) : [];
  // Bitta plitkani yashirish uchun tugma shart emas
  const collapsible = rows.length > COLLAPSED + 1;

  return (
    <Card as="section" id="specs" aria-labelledby="specs-title" className="flex-1 flex flex-col">
      <CardHeader id="specs-title" title={t.detail.mainSpecifications} className="mb-2.5" />

      {/* GSMArena dan; mos model topilmasa — qisqa izoh. Plitkalar teng balandlikda
          va karta qo'shni ustun bilan bir xil bo'lsa — teng cho'ziladi */}
      {rows.length ? (
        <dl className="flex-1 grid grid-cols-2 auto-rows-fr gap-1.5">
          {(expanded || !collapsible ? rows : rows.slice(0, COLLAPSED)).map(row => {
            const Icon = ICONS[row.key] ?? Smartphone;
            return (
              <div key={row.key} data-tip={`${row.label}: ${row.value}`} className="flex items-center gap-2.5 rounded-lg bg-gray-900/[0.03] dark:bg-white/[0.04] px-2.5 py-1.5 min-w-0 cursor-default">
                <Icon className="w-4 h-4 shrink-0 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="line-clamp-2 text-[11px] leading-tight text-gray-500 dark:text-gray-400">{row.label}</dt>
                  <dd className="line-clamp-2 text-sm font-medium text-gray-900 dark:text-white leading-snug">{row.value}</dd>
                </div>
              </div>
            );
          })}
        </dl>
      ) : null}
      {collapsible && (
        <button type="button" onClick={() => setExpanded(v => !v)} aria-expanded={expanded}
          className="pt-2 text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline">
          {expanded ? t.detailPage.fewerSpecs : t.detailPage.moreSpecs.replace('{{count}}', String(rows.length - COLLAPSED))}
        </button>
      )}
      {!rows.length && (
        <p className="flex-1 flex items-center justify-center text-center text-sm text-gray-500 dark:text-gray-400">{t.detailPage.specsUnavailable}</p>
      )}
    </Card>
  );
}
