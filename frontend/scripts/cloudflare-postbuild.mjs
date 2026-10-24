/**
 * `npm run build` natijasini Cloudflare Pages uchun moslaydi.
 *
 *   npm run build:cf   (Cloudflare Pages build buyrug'i)
 *
 * Netlify fayllari (public/_redirects, netlify.toml) qaytish varianti sifatida
 * repoda qoladi — bu skript faqat build/ ichini o'zgartiradi:
 *
 *  · _redirects o'chiriladi: undagi tashqi proksilarni Cloudflare qo'llamaydi,
 *    ularning ishini functions/ bajaradi.
 *  · 404.html → 404-page.html: Cloudflare ildizda 404.html ni ko'rsa SPA
 *    rejimini o'chirib, /product/... kabi har bir dinamik manzilga 404 beradi.
 *    Sahifaning o'zi functions/[[path]].ts da eski WordPress yo'llari uchun
 *    ishlatiladi.
 *  · _routes.json: funksiyalar FAQAT shu yo'llarda ishga tushadi — qolgan
 *    hamma narsa (JS, CSS, sahifalar) bepul va cheksiz statik xizmatdan
 *    beriladi, funksiya chaqiruvlari limitiga (kuniga 100 ming) kirmaydi.
 *  · _headers: netlify.toml dagi kesh va xavfsizlik sarlavhalari.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'build');

fs.rmSync(path.join(DIST, '_redirects'), { force: true });

const notFound = path.join(DIST, '404.html');
if (fs.existsSync(notFound)) fs.renameSync(notFound, path.join(DIST, '404-page.html'));

// Eski WordPress sayti qoldiqlari — functions/[[path]].ts 404 qaytaradi
const WORDPRESS = [
  '/sample-page', '/sample-page-2', '/sample-page-3',
  '/wp-admin/*', '/wp-content/*', '/wp-includes/*', '/wp-json/*',
  '/wp-login.php', '/wp-cron.php', '/xmlrpc.php',
  '/feed', '/feed/*', '/comments/feed/*',
  '/category/*', '/tag/*', '/author/*', '/2025/*', '/2026/*',
];

fs.writeFileSync(path.join(DIST, '_routes.json'), JSON.stringify({
  version: 1,
  include: ['/api/*', '/sitemap.xml', '/product/*', ...WORDPRESS],
  exclude: [],
}, null, 2));

fs.writeFileSync(path.join(DIST, '_headers'), `\
/assets/*
  Cache-Control: public, max-age=31536000, immutable

/robots.txt
  Cache-Control: public, max-age=3600

/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=(), interest-cohort=()
`);

console.log('[cloudflare] build/ Cloudflare Pages uchun tayyor');
