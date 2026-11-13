/** "N daqiqa/soat/kun oldin" — narxlar qachon yangilangani (bosh sahifa, tahlil sahifasi). */
export function relativeUpdated(
  iso: string | null | undefined,
  s: { updatedJustNow: string; updatedMinutes: string; updatedHours: string; updatedDays: string },
): string | null {
  if (!iso) return null;
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (Number.isNaN(mins)) return null;
  if (mins < 2) return s.updatedJustNow;
  if (mins < 60) return s.updatedMinutes.replace('{{count}}', String(mins));
  if (mins < 48 * 60) return s.updatedHours.replace('{{count}}', String(Math.floor(mins / 60)));
  return s.updatedDays.replace('{{count}}', String(Math.floor(mins / 1440)));
}
