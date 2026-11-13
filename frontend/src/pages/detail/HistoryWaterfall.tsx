import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "../../contexts/ThemeContext";
import { formatSum } from "../../utils/productMapper";
import type { DayRow } from "./priceHistorySeries";
import { niceTicks } from "./historyFormat";

// Diverging: ko'k — arzonlashdi, qizil — qimmatlashdi; jami — neytral (index.css: --viz-*)
const COLORS = {
  light: { neg: '#2a78d6', pos: '#e34948', total: '#6b7280', grid: '#eef0f3', muted: '#6b7280', zero: '#9ca3af' },
  dark: { neg: '#3987e5', pos: '#e66767', total: '#9ca3af', grid: '#1f2937', muted: '#9ca3af', zero: '#4b5563' },
};
const MAX_STEPS = 10;

interface Step { label: string; range: [number, number]; delta: number; kind: 'neg' | 'pos' | 'total'; from: number; to: number }

/**
 * Eng arzon narx o'zgarishlari — davr boshiga nisbatan qadam-baqadam
 * (waterfall). Har ustun bitta o'zgarish: oldingi jami → yangi jami;
 * oxirgisi — davr bo'yicha jami o'zgarish (noldan). O'zgarishlar 10 tadan
 * ko'p bo'lsa — haftalar bo'yicha yig'iladi, grafik o'qilishi uchun.
 */
function toSteps(rows: DayRow[], fmtShort: (iso: string) => string, totalLabel: string): Step[] {
  const changes: { date: string; from: number; to: number }[] = [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].min !== rows[i - 1].min) changes.push({ date: rows[i].date, from: rows[i - 1].min, to: rows[i].min });
  }
  let groups = changes;
  if (changes.length > MAX_STEPS) {
    const byWeek = new Map<string, { date: string; from: number; to: number }>();
    for (const c of changes) {
      const d = new Date(`${c.date}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); // dushanba
      const key = d.toISOString().slice(0, 10);
      const g = byWeek.get(key);
      if (g) g.to = c.to; else byWeek.set(key, { date: key, from: c.from, to: c.to });
    }
    groups = [...byWeek.values()].filter(g => g.from !== g.to);
  }
  const start = rows[0].min;
  const steps: Step[] = groups.map(g => {
    const a = g.from - start, b = g.to - start;
    return { label: fmtShort(g.date), range: [Math.min(a, b), Math.max(a, b)], delta: g.to - g.from, kind: g.to < g.from ? 'neg' : 'pos', from: g.from, to: g.to };
  });
  const net = rows[rows.length - 1].min - start;
  steps.push({ label: totalLabel, range: [Math.min(0, net), Math.max(0, net)], delta: net, kind: 'total', from: start, to: start + net });
  return steps;
}

const signed = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${formatSum(Math.abs(v))}`;

export function HistoryWaterfall({ rows, fmtShort, fmtAxis, labels, compact }: {
  rows: DayRow[];
  fmtShort: (iso: string) => string;
  fmtAxis: (v: number) => string;
  labels: { total: string; cheaper: string; pricier: string; none: string };
  compact: boolean;
}) {
  const dark = useTheme().resolvedTheme === 'dark';
  const c = COLORS[dark ? 'dark' : 'light'];
  const steps = toSteps(rows, fmtShort, labels.total);
  if (steps.length === 1 && steps[0].delta === 0) {
    return <p className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">{labels.none}</p>;
  }
  const ticks = niceTicks(Math.min(0, ...steps.map(s => s.range[0])), Math.max(0, ...steps.map(s => s.range[1])), 4, true);

  return (
    <>
      <div className="flex flex-wrap gap-x-5 gap-y-1 mb-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: c.neg }} />↓ {labels.cheaper}</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: c.pos }} />↑ {labels.pricier}</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: c.total }} />{labels.total}</span>
      </div>
      <div style={{ height: compact ? 240 : 300 }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={steps} margin={{ top: 20, right: 8, left: 0, bottom: 0 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke={c.grid} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: c.muted }} axisLine={false} tickLine={false} interval={compact ? 'preserveStartEnd' : 0} />
            <YAxis domain={[ticks[0], ticks[ticks.length - 1]]} ticks={ticks} tickFormatter={(v) => fmtAxis(Number(v))}
              tick={{ fontSize: 11, fill: c.muted }} axisLine={false} tickLine={false} width={compact ? 44 : 64} />
            <ReferenceLine y={0} stroke={c.zero} />
            <Tooltip cursor={{ fill: dark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)' }} isAnimationActive={false}
              content={({ active, payload }) => {
                const s = active && payload?.[0]?.payload as Step | undefined;
                if (!s) return null;
                return (
                  <div className="glass glass-solid rounded-xl px-3.5 py-3 text-xs">
                    <p className="text-gray-500 dark:text-gray-400">{s.label}</p>
                    <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white tabular-nums">{signed(s.delta)}</p>
                    <p className="text-gray-500 dark:text-gray-400 tabular-nums">{formatSum(s.from)} → {formatSum(s.to)}</p>
                  </div>
                );
              }} />
            <Bar dataKey="range" radius={4} maxBarSize={28} isAnimationActive animationDuration={500}>
              {steps.map((s, i) => <Cell key={i} fill={c[s.kind]} />)}
              {!compact && (
                // Yozuv yo'nalish tomonda: tushish — ustun ostida, ko'tarilish — ustida
                <LabelList dataKey="delta" content={(p: { x?: number | string; y?: number | string; width?: number | string; height?: number | string; value?: number | string }) => {
                  const v = Number(p.value), x = Number(p.x) + Number(p.width) / 2, y = Number(p.y), h = Number(p.height);
                  if (!Number.isFinite(v) || Math.abs(v) < 1000) return null;
                  return (
                    <text x={x} y={v < 0 ? y + h + 14 : y - 6} textAnchor="middle" fontSize={11} fill={dark ? '#e5e7eb' : '#374151'}>
                      {`${v > 0 ? '+' : '−'}${Math.round(Math.abs(v) / 1000)}k`}
                    </text>
                  );
                }} />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
