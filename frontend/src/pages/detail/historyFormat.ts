/*
 * Narx tarixi uchun sana va son formati. Intl ga tayanmaymiz: Chrome da
 * o'zbek tili uchun oy nomlari yo'q va "M11 12", "7.3M" chiqaradi.
 * Oy nomlari va naqshlar — tarjima fayllarida (locales/<til>/tracking.ts).
 */
export interface HistoryFormatText {
  monthsShort: string[];
  monthsLong: string[];
  dateShort: string;
  dateLong: string;
  millionShort: string;
}

export function historyFormatters(f: HistoryFormatText, decimal: string) {
  const parts = (iso: string) => {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    return { y: String(y), m: m - 1, d: String(d) };
  };
  const fill = (pattern: string, iso: string, months: string[]) => {
    const p = parts(iso);
    return pattern.replace('{{d}}', p.d).replace('{{m}}', months[p.m]).replace('{{y}}', p.y);
  };
  return {
    short: (iso: string) => fill(f.dateShort, iso, f.monthsShort),
    long: (iso: string) => fill(f.dateLong, iso, f.monthsLong),
    /** Y o'qi: 5 240 000 -> "5,2 mln", 12 400 000 -> "12 mln", 850 000 -> "850k" */
    axis: (v: number) => (v >= 1_000_000
      ? `${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1).replace('.', decimal).replace(`${decimal}0`, '')} ${f.millionShort}`
      : `${Math.round(v / 1000)}k`),
  };
}
