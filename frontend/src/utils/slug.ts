/**
 * Mahsulot URL lari uchun slug.
 *
 * Eski ko'rinish:  /product/prod-8fc7e81f5ca9aeb6051c
 * Yangi ko'rinish: /product/samsung-galaxy-s24-ultra-prod-8fc7e81f5ca9aeb6051c
 *
 * ID oxirida saqlanadi, chunki backendda slug ustuni yo'q — shu sababli
 * ma'lumotlar bazasiga tegmasdan ham URL dan ID ni aniq ajratib olamiz.
 * Barcha ID lar `prod-` + 20 ta hex belgidan iborat (butun baza tekshirilgan).
 */

const PRODUCT_ID_RE = /(prod-[0-9a-f]{20})$/i;

/** Kirill → lotin. Mahsulot nomlarining ko'pi ruscha ("Телефон Novey 108"). */
const CYRILLIC: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  // o'zbek kirillchasiga xos harflar
  ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h',
};

/** Matnni URL ga yaroqli slugga aylantiradi */
export function slugify(input: string): string {
  return (input || '')
    .toLowerCase()
    .replace(/[Ѐ-ӿ]/g, (ch) => CYRILLIC[ch] ?? '')
    // aksentlarni ajratib tashlaymiz (é → e)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
    .replace(/-+$/g, '');
}

/** Mahsulot uchun kanonik yo'l: /product/<slug>-<id> */
export function productPath(product: { id: string | number; name?: string; title?: string }): string {
  const id = String(product.id);
  const slug = slugify(product.title || product.name || '');
  return slug ? `/product/${slug}-${id}` : `/product/${id}`;
}

/**
 * URL parametridan mahsulot ID sini ajratadi.
 * Slug bilan ham, eski toza ID bilan ham ishlaydi.
 */
export function extractProductId(param: string | undefined): string {
  if (!param) return '';
  const match = param.match(PRODUCT_ID_RE);
  return match ? match[1].toLowerCase() : param;
}
