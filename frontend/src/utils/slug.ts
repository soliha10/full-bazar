/**
 * Mahsulot URL lari.
 *
 * Eski ko'rinish:  /product/samsung-galaxy-s24-ultra-prod-8fc7e81f5ca9aeb6051c
 * Yangi ko'rinish: /product/samsung-galaxy-s24-ultra
 *
 * Manzilda endi na `prod-`, na ID bor — faqat mahsulot nomi. Buni mumkin
 * qilgan narsa: `products` jadvalidagi `slug` ustuni (python/sync_csv.py
 * to'ldiradi, unikal indeks bilan himoyalangan). API `/api/products/{ref}` ni
 * slug bilan ham, ID bilan ham qabul qiladi, shuning uchun tashqarida
 * tarqalgan eski havolalar ishlashda davom etadi — netlify edge funksiyasi
 * ularni kanonik manzilga 301 bilan yo'naltiradi.
 */

/** Eski manzillarda slugdan keyin turgan ID: ...-prod-8fc7e81f5ca9aeb6051c */
const LEGACY_ID_RE = /(prod-[0-9a-f]{20})$/i;

/** Kirill → lotin. Mahsulot nomlarining ko'pi ruscha ("Телефон Novey 108"). */
const CYRILLIC: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  // o'zbek kirillchasiga xos harflar
  ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h',
};

/**
 * Matnni URL ga yaroqli slugga aylantiradi.
 * python/sync_csv.py dagi `_slugify` bilan bir xil natija berishi SHART —
 * slug bazada saqlanadi, bu yerdagi nusxa faqat ko'rsatish uchun.
 */
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

export interface ProductRef {
  id: string | number;
  slug?: string | null;
  name?: string;
  title?: string;
}

/**
 * Mahsulot uchun kanonik yo'l: /product/<slug>
 *
 * Slug kelmagan bo'lsa (eski keshdagi javob yoki qisqartirilgan ma'lumot),
 * ID ga qaytamiz. Nomdan slug YASAMAYMIZ: u bazadagisidan farq qilishi va
 * 404 berishi mumkin, ID esa har doim ishlaydi va sahifa ochilgach manzil
 * kanonik ko'rinishga almashtiriladi.
 */
export function productPath(product: ProductRef): string {
  const slug = (product.slug || '').trim();
  if (slug) return `/product/${slug}`;
  return `/product/${encodeURIComponent(String(product.id))}`;
}

/**
 * URL parametridan API ga yuboriladigan murojaat kalitini oladi.
 *
 * Yangi manzilda bu slugning o'zi. Eski manzilda esa slugdan keyin ID turadi —
 * o'shanda ID ni ajratib olamiz, chunki eski slug bazadagisiga to'g'ri
 * kelmasligi mumkin.
 */
export function productRef(param: string | undefined): string {
  if (!param) return '';
  // Manzil katta harf yoki yopuvchi chiziqcha bilan kelishi mumkin
  // (/Product/IPhone-15/ — tashqi saytlar, qo'lda yozilgan havolalar).
  // Sluglar bazada faqat kichik harfda saqlanadi, ID lar esa kichik
  // o'n oltilik — normallashtirmasak bunday manzil 404 beradi. Normallashtirsak
  // API mahsulotni topadi va edge funksiyasi kanonik manzilga 301 qiladi.
  // Noto'g'ri kodlangan manzil (%E0 kabi) decodeURIComponent'ni yiqitadi —
  // edge funksiyasida bu butun sahifani 500 qilardi.
  let raw = param;
  try { raw = decodeURIComponent(param); } catch { /* xom holicha ishlataveramiz */ }
  const clean = raw.trim().replace(/\/+$/, '').toLowerCase();
  const match = clean.match(LEGACY_ID_RE);
  return match ? match[1] : clean;
}
