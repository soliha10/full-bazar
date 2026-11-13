import type { PricePoint } from "./useProductDetail";

/*
 * Narx tarixini grafik uchun kunlik qatorlarga aylantirish.
 *
 * price_history jadvali narxni faqat O'ZGARGANDA yozadi: Alif dagi narx
 * 1-oktabrda yozilib, 20-oktabrgacha o'zgarmagan bo'lsa, oradagi 19 kunda
 * yozuv yo'q. Shuning uchun:
 *   · har kun uchun do'konning shu kungacha bo'lgan OXIRGI narxi olinadi
 *     (pog'onali chiziq — nuqtalar orasini egri chiziq bilan "to'ldirish"
 *     hech qachon bo'lmagan narxlarni ko'rsatardi);
 *   · bugungi kun — mahsulotning joriy takliflari (eng yangi narx);
 *   · hozir sotuvda yo'q do'kon oxirgi yozuvidan keyin chizilmaydi.
 */

export interface DayRow {
  /** YYYY-MM-DD */
  date: string;
  min: number;
  /** Do'konlar narxining medianasi — bitta do'konning g'alati narxi
   *  (masalan, bir kunlik 7 mln) shkalani buzmasligi uchun max emas */
  median: number;
  max: number;
  /** [min, median] — recharts oraliq sohasi uchun */
  band: [number, number];
  minSource: string;
  count: number;
  /** Do'kon nomi -> o'sha kundagi narx */
  stores: Record<string, number>;
}

export interface HistorySummary {
  current: { price: number; source: string } | null;
  low: { price: number; date: string } | null;
  high: { price: number; date: string } | null;
  /** Davr boshidagi eng arzon narxga nisbatan, % (manfiy — arzonlashgan) */
  changePct: number | null;
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export function buildSeries(
  history: PricePoint[],
  current: { source: string; price: number }[],
  days: number,
  now: Date = new Date(),
): { rows: DayRow[]; sources: string[]; summary: HistorySummary } {
  const today = dayKey(now);
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  // Do'kon bo'yicha o'zgarishlar, vaqt tartibida. Bir mahsulotda bir do'konning
  // bir nechta e'loni bo'lishi mumkin (ranglar): ular AYNI bir vaqtda turli narx
  // bilan yoziladi va API ularni tasodifiy tartibda beradi. Sayt do'konning eng
  // arzon taklifini ko'rsatadi — shu vaqtdagi eng kichik narx olinadi.
  const atMoment = new Map<string, PricePoint>();
  for (const h of history) {
    const key = `${h.source}|${h.date}`;
    const prev = atMoment.get(key);
    if (!prev || h.price < prev.price) atMoment.set(key, h);
  }
  const events = new Map<string, { day: string; price: number }[]>();
  for (const h of [...atMoment.values()].sort((a, b) => a.date.localeCompare(b.date))) {
    const list = events.get(h.source) ?? [];
    list.push({ day: h.date.slice(0, 10), price: h.price });
    events.set(h.source, list);
  }
  const live = new Map(current.map(m => [m.source, m.price]));
  const sources = [...new Set([...events.keys(), ...live.keys()])];

  // Grafik birinchi yozuv kunidan boshlanadi (davr boshidan oldin emas)
  const firstDay = [...events.values()].flat().map(e => e.day).sort()[0];
  const from = firstDay && firstDay > dayKey(start) ? firstDay : dayKey(start);

  const rows: DayRow[] = [];
  const cursor = new Map<string, number>(); // do'kon -> events dagi indeks
  for (const d = new Date(`${from}T00:00:00Z`); dayKey(d) <= today; d.setUTCDate(d.getUTCDate() + 1)) {
    const day = dayKey(d);
    const stores: Record<string, number> = {};
    for (const src of sources) {
      const list = events.get(src) ?? [];
      let i = cursor.get(src) ?? -1;
      while (i + 1 < list.length && list[i + 1].day <= day) i++;
      cursor.set(src, i);
      if (day === today && live.has(src)) { stores[src] = live.get(src)!; continue; }
      if (i < 0) continue;
      // Hozir sotuvda yo'q do'kon — faqat oxirgi yozuvigacha
      if (!live.has(src) && day > list[list.length - 1].day) continue;
      stores[src] = list[i].price;
    }
    const entries = Object.entries(stores);
    if (!entries.length) continue;
    const [minSource, min] = entries.reduce((a, b) => (b[1] < a[1] ? b : a));
    const sorted = entries.map(e => e[1]).sort((a, b) => a - b);
    const mid = sorted.length >> 1;
    const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    rows.push({ date: day, min, median, max: sorted[sorted.length - 1], band: [min, median], minSource, count: entries.length, stores });
  }

  const last = rows[rows.length - 1];
  const low = rows.reduce<DayRow | null>((a, r) => (!a || r.min < a.min ? r : a), null);
  // Eng yuqori — ENG ARZON narxning davrdagi eng yuqori qiymati (xaridor uchun
  // ma'noli): bitta do'konning qimmat taklifi emas
  const high = rows.reduce<DayRow | null>((a, r) => (!a || r.min > a.min ? r : a), null);
  const summary: HistorySummary = {
    current: last ? { price: last.min, source: last.minSource } : null,
    low: low ? { price: low.min, date: low.date } : null,
    high: high ? { price: high.min, date: high.date } : null,
    changePct: rows.length > 1 && rows[0].min > 0 ? ((last.min - rows[0].min) / rows[0].min) * 100 : null,
  };
  // Tanlov chiplari uchun: hozirgi narxi arzonidan qimmatiga
  sources.sort((a, b) => (last?.stores[a] ?? Infinity) - (last?.stores[b] ?? Infinity));
  return { rows, sources, summary };
}

export type PriceVerdict = 'low' | 'typical' | 'high';

/**
 * "Odatiy narx" — 90 kunlik kunlik eng arzon narxlarning 25–75 foizli
 * oralig'i (Google Shopping "price insights" g'oyasi). Hozirgi narx undan
 * past bo'lsa — "past", yuqori bo'lsa — "yuqori". 14 kundan kam ma'lumot
 * bilan xulosa chiqarilmaydi: oraliq tasodifiy bo'lib qoladi.
 */
export function typicalRange(rows: DayRow[]): { low: number; high: number; median: number; point: boolean; verdict: PriceVerdict } | null {
  if (rows.length < 14) return null;
  const mins = rows.map(r => r.min).sort((a, b) => a - b);
  const q = (p: number) => {
    const i = (mins.length - 1) * p;
    const lo = Math.floor(i), hi = Math.ceil(i);
    return mins[lo] + (mins[hi] - mins[lo]) * (i - lo);
  };
  const low = q(0.25), high = q(0.75);
  const now = rows[rows.length - 1].min;
  // 1% dan kichik farq — "odatiy": 4 517 000 va 4 540 000 xaridor uchun bir xil
  const tol = 0.01;
  return {
    low, high, median: q(0.5),
    // Narx davrning ko'p qismida o'zgarmagan — oraliq emas, bitta qiymat
    point: (high - low) / Math.max(1, (high + low) / 2) < tol,
    verdict: now < low * (1 - tol) ? 'low' : now > high * (1 + tol) ? 'high' : 'typical',
  };
}
