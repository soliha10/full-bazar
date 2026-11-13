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
    /** Y o'qi: barcha belgilar bir xil kasr xonasida ("2,52 / 2,54 / 2,56 mln") —
     *  xonalar soni qadamdan kelib chiqadi, 850 000 -> "850k" */
    axis: (v: number, step: number, withUnit = true) => {
      if (v < 1_000_000) return `${Math.round(v / 1000)}k`;
      const digits = step >= 1_000_000 ? 0 : step >= 100_000 ? 1 : 2;
      const n = (v / 1_000_000).toFixed(digits).replace('.', decimal);
      return withUnit ? `${n} ${f.millionShort}` : n;
    },
    unit: f.millionShort,
  };
}

/**
 * Y o'qi uchun "tekis" qadamlar (1, 2, 5 × 10^k; 2.5 emas — "2,625 mln" kabi yozuv chiqardi): 4,5 / 4,6 / 4,7 mln,
 * 4 517 091 kabi tasodifiy chegaralar emas. Ma'lumot ustidan va ostidan
 * kamida yarim qadam joy qoladi — chiziq chetga yopishmasin.
 */
export function niceTicks(lo: number, hi: number, target = 4, allowNegative = false): number[] {
  // Narx uchun span: kamida 2%; farq (manfiy bo'lishi mumkin) uchun — mutlaq qiymat
  const span = Math.max(hi - lo, Math.abs(hi) * 0.02, 1);
  const raw = span / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map(m => m * mag).find(s => s >= raw) ?? 10 * mag;
  const start = Math.floor((lo - step / 2) / step) * step;
  const end = Math.ceil((hi + step / 2) / step) * step;
  const ticks: number[] = [];
  for (let v = allowNegative ? start : Math.max(0, start); v <= end + step / 1000; v += step) ticks.push(Math.round(v));
  return ticks;
}
