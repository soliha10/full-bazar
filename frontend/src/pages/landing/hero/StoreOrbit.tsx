import type { ReactNode } from 'react';
import { useMarkets } from '../../../hooks/useMarkets';

// Orbitadagi o'rinlar (foizda, logo markazi): dastadan tashqarida — chap va o'ng
// ustunlar va tepada; pastdagi boshqaruv (nuqtalar, "Keyingi taklif") zonasiga tegmaydi
const SLOTS = [
  { x: -16, y: 10 }, { x: 116, y: 6 }, { x: -22, y: 42 }, { x: 120, y: 38 },
  { x: -14, y: 72 }, { x: 114, y: 70 }, { x: 22, y: -12 }, { x: 80, y: -14 },
];

/**
 * Takliflar dastasi atrofida haqiqiy do'kon logolari suzib turadi (/api/markets,
 * eng ko'p taklifli do'konlar) — "barcha do'konlar narxi bir joyda". Bezak:
 * ekran o'quvchidan yashirin, faqat xl ekranda — torroq ekranda yon tomonda joy yo'q.
 */
export function StoreOrbit({ children }: { children: ReactNode }) {
  const { markets } = useMarkets();
  const logos = markets.filter(m => m.logo).sort((a, b) => b.count - a.count).slice(0, SLOTS.length);
  return (
    <div className="relative">
      {children}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden xl:block">
        {logos.map((m, i) => (
          <span key={m.key} className="float-y absolute" style={{ left: `${SLOTS[i].x}%`, top: `${SLOTS[i].y}%`, ['--i' as string]: i }}>
            <span className="flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-lg shadow-violet-500/10 ring-1 ring-black/5 dark:ring-white/10">
              <img src={m.logo!} alt="" loading="lazy" className="h-full w-full object-contain" />
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
