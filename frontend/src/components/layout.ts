/**
 * Sahifa tartibining yagona o'lchamlari. Kartalar o'lchami sahifadan sahifaga
 * farq qilmasligi uchun hamma sahifa shu konteyner va shu ustunlar tizimida.
 *
 * Ustunlar: 2 / md:3 / lg:4 / xl:5, oraliq gap-3 / md:gap-4. Katalogdagi
 * filtr paneli shu tizimning bitta ustunini egallaydi, qolgan ustunlar —
 * mahsulotlar. Shuning uchun bir xil ekran kengligida bosh sahifadagi va
 * katalogdagi karta kengligi matematik jihatdan teng:
 *   (konteyner − (n−1)·gap) / n — ikkala sahifada bir xil n va gap.
 */
export const PAGE_CONTAINER = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';

/** Butun kenglikdagi mahsulot setkasi (bosh sahifa, sevimlilar) va sahifa ustunlari */
export const PAGE_COLUMNS = 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';

/** Filtr paneli bitta ustunni egallagandagi mahsulotlar qismi (katalog) */
export const COLUMNS_BESIDE_SIDEBAR = 'grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4';

/** Sahifa ustunlari orasidagi oraliq — setka ichida ham, panel bilan setka orasida ham */
export const PAGE_GAP = 'gap-3 md:gap-4';

/**
 * Faqat to'liq qatorlar ko'rinsin (bosh sahifa): har ustun sonida (2/3/4/5)
 * ko'rinadigan elementlar soni ustunlar soniga karrali. Klasslar to'liq
 * yozilgan — Tailwind ularni manbadan topishi kerak.
 */
export function fullRowsClass(index: number, total: number) {
  const fits = (cols: number) => index < Math.max(cols, Math.floor(total / cols) * cols);
  return [
    fits(2) ? 'block' : 'hidden',
    fits(3) ? 'md:block' : 'md:hidden',
    fits(4) ? 'lg:block' : 'lg:hidden',
    fits(5) ? 'xl:block' : 'xl:hidden',
  ].join(' ');
}
