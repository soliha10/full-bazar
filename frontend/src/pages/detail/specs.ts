/** /api/products/{ref}/specs javobi */
export interface Specs {
  displayName: string;
  display: string | null;
  chipset: string | null;
  ramOptions: string[];
  storageOptions: string[];
  mainCamera: string | null;
  selfieCamera: string | null;
  batteryMah: number | null;
  charging: string | null;
  os: string | null;
  body: string | null;
  releaseYear: number | null;
}

// Yorliqlar t.detailPage.specGroups / t.detailPage.specRows dan olinadi.
type SpecGroupKey = 'display' | 'performance' | 'camera' | 'battery' | 'other';
type SpecRowKey = 'display' | 'chipset' | 'ram' | 'storage' | 'mainCamera' | 'selfieCamera'
  | 'capacity' | 'charging' | 'body' | 'os' | 'releaseYear';

export const SPEC_GROUPS: { group: SpecGroupKey; rows: { key: keyof Specs; label: SpecRowKey }[] }[] = [
  { group: 'display',     rows: [{ key: 'display', label: 'display' }] },
  { group: 'performance', rows: [
    { key: 'chipset', label: 'chipset' },
    { key: 'ramOptions', label: 'ram' },
    { key: 'storageOptions', label: 'storage' },
  ]},
  { group: 'camera',      rows: [
    { key: 'mainCamera', label: 'mainCamera' },
    { key: 'selfieCamera', label: 'selfieCamera' },
  ]},
  { group: 'battery',     rows: [
    { key: 'batteryMah', label: 'capacity' },
    { key: 'charging', label: 'charging' },
  ]},
  { group: 'other',       rows: [
    { key: 'body', label: 'body' },
    { key: 'os', label: 'os' },
    { key: 'releaseYear', label: 'releaseYear' },
  ]},
];

/** Qiymat yo'q bo'lsa null — chaqiruvchi bunday qatorni ko'rsatmaydi. */
export function specValue(specs: Specs, key: keyof Specs): string | null {
  const value = specs[key];
  if (value == null || value === '') return null;
  if (Array.isArray(value)) return value.length ? value.join(' / ') : null;
  if (key === 'batteryMah') return `${value} mAh`;
  return String(value);
}
