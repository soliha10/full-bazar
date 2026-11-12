// Solishtirish sahifasi turlari va jadval tuzilishi (/api/compare javobi).

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

export interface CompareItem {
  product: {
    id: string;
    slug?: string | null;
    name: string;
    image: string;
    price: number;
    markets: { source: string; price: number; url: string }[];
  };
  specs: Specs | null;
}

/** /api/compare qaytaradigan xulosa — "qaysinisini olay va qayerdan?" */
export interface Verdict {
  scores: { productId: string; specScore: number; priceScore: number; overall: number }[];
  winners: Record<string, { productId: string; label: string; value: string }>;
  cheapest: {
    productId: string;
    slug: string | null;
    name: string;
    price: number;
    bestMarket: { source: string; price: number; url: string } | null;
    markets: { source: string; price: number; url: string }[];
    marketCount: number;
    maxSaving: number;
    vsMostExpensive: number;
  } | null;
  recommended: { productId: string; reasons: string[] };
}

/** Xulosadagi o'lchov nomi -> jadvaldagi qator kaliti */
export const WINNER_ROW: Record<string, keyof Specs> = {
  batteryMah: 'batteryMah',
  ramGb: 'ramOptions',
  storageGb: 'storageOptions',
  mainCameraMp: 'mainCamera',
  selfieCameraMp: 'selfieCamera',
  displayHz: 'display',
  chargingW: 'charging',
  releaseYear: 'releaseYear',
};

/** Yorliqlar t.compare.specs / t.compare.groups dan olinadi */
export type SpecLabelKey = 'chipset' | 'ram' | 'storage' | 'display' | 'mainCamera' | 'selfieCamera'
  | 'capacity' | 'charging' | 'body' | 'os' | 'releaseYear';
export type GroupLabelKey = 'performance' | 'display' | 'camera' | 'battery' | 'design';

export interface SpecRowDef { key: keyof Specs; label: SpecLabelKey }
export interface SpecGroup { label: GroupLabelKey; rows: SpecRowDef[] }

export const SPEC_GROUPS: SpecGroup[] = [
  { label: 'performance', rows: [
    { key: 'chipset', label: 'chipset' },
    { key: 'ramOptions', label: 'ram' },
    { key: 'storageOptions', label: 'storage' },
  ]},
  { label: 'display', rows: [
    { key: 'display', label: 'display' },
  ]},
  { label: 'camera', rows: [
    { key: 'mainCamera', label: 'mainCamera' },
    { key: 'selfieCamera', label: 'selfieCamera' },
  ]},
  { label: 'battery', rows: [
    { key: 'batteryMah', label: 'capacity' },
    { key: 'charging', label: 'charging' },
  ]},
  { label: 'design', rows: [
    { key: 'body', label: 'body' },
    { key: 'os', label: 'os' },
    { key: 'releaseYear', label: 'releaseYear' },
  ]},
];

export function specValue(specs: Specs | null, key: keyof Specs, noData: string): string {
  if (!specs) return noData;
  const v = specs[key];
  if (v == null || (Array.isArray(v) && v.length === 0)) return noData;
  if (key === 'batteryMah') return `${v} mAh`;
  if (Array.isArray(v)) return v.join(' / ');
  return String(v);
}
