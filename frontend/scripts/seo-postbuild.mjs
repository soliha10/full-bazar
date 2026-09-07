/**
 * Build'dan keyingi SEO bosqichi.
 *
 *  1. Statik marshrutlar uchun haqiqiy HTML fayl yaratadi (build/products/index.html
 *     va h.k.) — har birida o'z <title>, description, canonical va og: teglari bilan.
 *     Bu JavaScript ishlatmaydigan botlar (Telegram, Facebook, WhatsApp, Twitter)
 *     uchun yagona ishlaydigan yo'l.
 *
 *  2. sitemap.xml ni API'dagi barcha mahsulot sahifalari bilan to'ldiradi.
 *     API javob bermasa build to'xtamaydi — statik marshrutlar bilan cheklanadi.
 *
 * `vite build` dan keyin avtomatik ishlaydi (package.json → "build").
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * slug.ts ni ilova bilan bir xil manbadan yuklaymiz — slug mantig'i ikki
 * joyda takrorlanib, vaqt o'tishi bilan bir-biridan ajralib ketmasligi uchun.
 * esbuild vite bilan birga keladi, qo'shimcha bog'liqlik kerak emas.
 */
async function loadTs(relPath) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, relPath)],
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    write: false,
  });
  const code = result.outputFiles[0].text;
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}

const { productPath } = await loadTs('src/utils/slug.ts');
const DIST = path.join(ROOT, 'build');
const SITE = 'https://bazarcom.online';
const API = process.env.SEO_API_URL || 'https://full-bazar-api.onrender.com';

const BRAND = 'Bazarcom';

// ── Prerender qilinadigan statik marshrutlar ────────────────────────────────
const ROUTES = [
  {
    path: '/',
    title: `${BRAND} — O'zbekistondagi smartfon narxlarini solishtirish`,
    description:
      "Bazarcom — Asaxiy, Texnomart, Olcha, Mediapark va boshqa O'zbekiston do'konlaridagi smartfon narxlarini bir joyda solishtiring. Eng arzon narxni toping, narx tushishini kuzating.",
    changefreq: 'daily',
    priority: '1.0',
  },
  {
    path: '/products',
    title: `Smartfonlar katalogi — narxlarni solishtirish | ${BRAND}`,
    description:
      "O'zbekistondagi barcha internet do'konlaridagi smartfonlar katalogi. Samsung, Apple, Xiaomi, Redmi, Infinix va boshqa brendlar narxlarini solishtiring.",
    changefreq: 'daily',
    priority: '0.9',
  },
  {
    path: '/trends',
    title: `Trendlar va bozor tahlili | ${BRAND}`,
    description:
      "O'zbekiston smartfon bozoridagi trendlar: eng ko'p qidirilgan telefonlar, narxi tushgan mahsulotlar va do'konlar bo'yicha tahlil.",
    changefreq: 'daily',
    priority: '0.8',
  },
  {
    path: '/feedback',
    title: `Fikr-mulohaza | ${BRAND}`,
    description:
      'Bazarcom haqidagi fikringizni bildiring, xatolik haqida xabar bering yoki yangi imkoniyat taklif qiling.',
    changefreq: 'monthly',
    priority: '0.4',
  },
  // Quyidagilar indekslanmaydi, lekin to'g'ri meta bilan render qilinadi
  { path: '/compare', title: `Smartfonlarni solishtirish | ${BRAND}`,
    description: "Ikki yoki uchta smartfonni texnik xususiyatlari va do'konlardagi narxlari bo'yicha yonma-yon solishtiring.",
    noindex: true },
  { path: '/wishlist', title: `Saqlanganlar | ${BRAND}`,
    description: 'Siz saqlagan smartfonlar ro’yxati.', noindex: true },
  { path: '/watchlist', title: `Narx kuzatuvi | ${BRAND}`,
    description: 'Narxi tushishini kuzatayotgan smartfonlaringiz.', noindex: true },
  { path: '/profile', title: `Profil | ${BRAND}`,
    description: 'Bazarcom hisobingiz va sozlamalaringiz.', noindex: true },
];

// ── HTML yordamchilari ─────────────────────────────────────────────────────
const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** <title> yoki meta/link teg qiymatini almashtiradi; teg bo'lmasa qo'shadi */
function setTag(html, { selector, attr, value }) {
  const re = new RegExp(`(<${selector}[^>]*\\b${attr}=")([^"]*)(")`, 'i');
  if (re.test(html)) return html.replace(re, `$1${escapeHtml(value)}$3`);
  return html;
}

function renderRoute(baseHtml, route) {
  const url = SITE + (route.path === '/' ? '/' : route.path);
  let html = baseHtml;

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(route.title)}</title>`);
  html = setTag(html, { selector: 'meta[^>]*name="description"', attr: 'content', value: route.description });
  html = setTag(html, { selector: 'meta[^>]*property="og:title"', attr: 'content', value: route.title });
  html = setTag(html, { selector: 'meta[^>]*property="og:description"', attr: 'content', value: route.description });
  html = setTag(html, { selector: 'meta[^>]*property="og:url"', attr: 'content', value: url });
  html = setTag(html, { selector: 'meta[^>]*name="twitter:title"', attr: 'content', value: route.title });
  html = setTag(html, { selector: 'meta[^>]*name="twitter:description"', attr: 'content', value: route.description });
  html = setTag(html, { selector: 'link[^>]*rel="canonical"', attr: 'href', value: url });

  if (route.noindex) {
    html = setTag(html, { selector: 'meta[^>]*name="robots"', attr: 'content', value: 'noindex, follow' });
  }
  return html;
}

// ── 1-bosqich: statik marshrutlarni prerender qilish ────────────────────────
const indexPath = path.join(DIST, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('[seo] build/index.html topilmadi — vite build ishga tushdimi?');
  process.exit(1);
}
const baseHtml = fs.readFileSync(indexPath, 'utf8');

for (const route of ROUTES) {
  const html = renderRoute(baseHtml, route);
  if (route.path === '/') {
    fs.writeFileSync(indexPath, html);
  } else {
    // <route>/index.html emas, <route>.html — Netlify birinchisida /products ni
    // /products/ ga 301 qiladi, bu esa canonical (/products) bilan ziddiyatga
    // tushadi. .html fayl bilan /products to'g'ridan-to'g'ri 200 qaytaradi.
    fs.writeFileSync(path.join(DIST, `${route.path.replace(/^\//, '')}.html`), html);
  }
}
// Netlify 404 javoblarida shu faylni ko'rsatadi (_redirects dagi 404 qoidalari
// va mavjud bo'lmagan yo'llar uchun) — Netlify ning oddiy sahifasi o'rniga
// brendlangan sahifa chiqadi.
fs.writeFileSync(
  path.join(DIST, '404.html'),
  renderRoute(baseHtml, {
    path: '/404',
    title: `Sahifa topilmadi | ${BRAND}`,
    description: "Siz qidirayotgan sahifa mavjud emas yoki ko'chirilgan.",
    noindex: true,
  }),
);

console.log(`[seo] ${ROUTES.length} ta statik marshrut + 404.html prerender qilindi`);

// ── 2-bosqich: mahsulotlarni olib sitemap yaratish ─────────────────────────
async function fetchAllProducts() {
  const LIMIT = 200;
  const items = [];
  const take = (data) => {
    for (const p of data?.products || []) {
      if (p?.id) items.push({ id: p.id, name: p.name, title: p.title });
    }
  };

  const first = await fetchJson(`${API}/api/products?page=1&limit=${LIMIT}`);
  if (!first) return null;
  take(first);

  const pages = Math.ceil((Number(first.total) || 0) / LIMIT);
  for (let page = 2; page <= pages; page++) {
    const data = await fetchJson(`${API}/api/products?page=${page}&limit=${LIMIT}`);
    if (!data) break;
    take(data);
  }
  return items;
}

async function fetchJson(url, attempt = 1) {
  try {
    // Render bepul planida "cold start" bo'lishi mumkin — birinchi so'rov sekin
    const res = await fetch(url, { signal: AbortSignal.timeout(attempt === 1 ? 90_000 : 30_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    if (attempt < 3) return fetchJson(url, attempt + 1);
    console.warn(`[seo] ${url} olinmadi: ${err.message}`);
    return null;
  }
}

function buildSitemap(products) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = ROUTES.filter((r) => !r.noindex).map(
    (r) => `  <url>
    <loc>${SITE}${r.path === '/' ? '/' : r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
  );

  for (const product of products) {
    urls.push(`  <url>
    <loc>${SITE}${productPath(product)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
}

const products = await fetchAllProducts();
if (products && products.length > 0) {
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), buildSitemap(products));
  console.log(`[seo] sitemap.xml: ${ROUTES.filter((r) => !r.noindex).length} statik + ${products.length} mahsulot URL (slug bilan)`);
} else {
  // API yetib bo'lmadi — sayt baribir deploy bo'lsin, faqat statik sitemap bilan
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), buildSitemap([]));
  console.warn('[seo] API javob bermadi — sitemap faqat statik marshrutlar bilan yozildi');
}
