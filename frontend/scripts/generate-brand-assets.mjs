/**
 * Brend rasmlarini yaratadi: og-image.jpg, favicon.ico/svg, apple-touch-icon.png
 *
 * Bu skript macOS `sips` ga tayanadi, shuning uchun LOKAL ishga tushiriladi va
 * natijasi public/ ichiga commit qilinadi. Netlify build'da ishlatilmaydi.
 *
 *   node scripts/generate-brand-assets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const TMP = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'brand-'));

// ── brend ranglari (tailwind violet) ────────────────────────────────────────
const V500 = [0.545, 0.361, 0.965]; // #8b5cf6
const V700 = [0.427, 0.157, 0.851]; // #6d28d9
const V900 = [0.294, 0.098, 0.588]; // #4b1a96

// ── minimal PDF yozuvchi ────────────────────────────────────────────────────
function buildPdf({ w, h, content, shadings = '' }) {
  const objs = [];
  objs[1] = '<</Type/Catalog/Pages 2 0 R>>';
  objs[2] = '<</Type/Pages/Kids[3 0 R]/Count 1>>';
  objs[3] =
    `<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${w} ${h}]` +
    `/Resources<</Font<</F1 5 0 R/F2 6 0 R>>${shadings}>>/Contents 4 0 R>>`;
  objs[4] = `<</Length ${Buffer.byteLength(content, 'latin1')}>>\nstream\n${content}\nendstream`;
  objs[5] = '<</Type/Font/Subtype/Type1/BaseFont/Helvetica-Bold/Encoding/WinAnsiEncoding>>';
  objs[6] = '<</Type/Font/Subtype/Type1/BaseFont/Helvetica/Encoding/WinAnsiEncoding>>';
  if (shadings) {
    objs[7] =
      `<</ShadingType 2/ColorSpace/DeviceRGB/Coords[0 ${h} ${w} 0]/Extend[true true]` +
      `/Function<</FunctionType 2/Domain[0 1]/C0[${V500.join(' ')}]/C1[${V900.join(' ')}]/N 1>>>>`;
  }

  let out = '%PDF-1.4\n';
  const offsets = [];
  for (let i = 1; i < objs.length; i++) {
    if (!objs[i]) continue;
    offsets[i] = Buffer.byteLength(out, 'latin1');
    out += `${i} 0 obj\n${objs[i]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(out, 'latin1');
  out += `xref\n0 ${objs.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objs.length; i++) {
    out += (offsets[i] != null ? String(offsets[i]).padStart(10, '0') + ' 00000 n \n' : '0000000000 65535 f \n');
  }
  out += `trailer\n<</Size ${objs.length}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

const esc = (s) => s.replace(/([()\\])/g, '\\$1');

/** Yumaloq burchakli to'rtburchak yo'li */
function roundRect(x, y, w, h, r) {
  const k = r * 0.5523;
  return [
    `${x + r} ${y} m`,
    `${x + w - r} ${y} l`,
    `${x + w - r + k} ${y} ${x + w} ${y + r - k} ${x + w} ${y + r} c`,
    `${x + w} ${y + h - r} l`,
    `${x + w} ${y + h - r + k} ${x + w - r + k} ${y + h} ${x + w - r} ${y + h} c`,
    `${x + r} ${y + h} l`,
    `${x + r - k} ${y + h} ${x} ${y + h - r + k} ${x} ${y + h - r} c`,
    `${x} ${y + r} l`,
    `${x} ${y + r - k} ${x + r - k} ${y} ${x + r} ${y} c`,
    'h',
  ].join('\n');
}

/** Xarid sumkasi belgisi — (cx,cy) markazi, s o'lchami */
function shoppingBag(cx, cy, s, lw) {
  const bw = s, bh = s * 0.86;
  const x = cx - bw / 2, y = cy - bh / 2 - s * 0.06;
  const hr = s * 0.2; // tutqich radiusi
  const k = hr * 0.5523;
  const hy = y + bh;
  return [
    `${lw} w 1 J 1 j`,
    roundRect(x, y, bw, bh, s * 0.14) + ' S',
    // tutqich: yarim doira
    `${cx - hr} ${hy} m`,
    `${cx - hr} ${hy + k} ${cx - k} ${hy + hr} ${cx} ${hy + hr} c`,
    `${cx + k} ${hy + hr} ${cx + hr} ${hy + k} ${cx + hr} ${hy} c`,
    'S',
  ].join('\n');
}

function pdfToRaster(pdfBuf, out, { format, width, height }) {
  const p = path.join(TMP, 'src.pdf');
  fs.writeFileSync(p, pdfBuf);
  execFileSync('sips', ['-s', 'format', format, p, '--out', out], { stdio: 'ignore' });
  if (width) {
    execFileSync('sips', ['-z', String(height), String(width), out], { stdio: 'ignore' });
  }
  return out;
}

// ── 1. og-image.jpg (1200x630) ──────────────────────────────────────────────
{
  const W = 1200, H = 630;
  const content = [
    // gradient fon
    'q 0 0 1200 630 re W n /Sh0 sh Q',
    // logo katakchasi
    '1 1 1 rg',
    roundRect(90, 400, 92, 92, 26) + ' f',
    // sumka belgisi (violet)
    `${V700.join(' ')} RG`,
    shoppingBag(136, 446, 44, 7),
    // sarlavha
    '1 1 1 rg',
    `BT /F1 104 Tf 90 268 Td (${esc('BAZARCOM')}) Tj ET`,
    // tagline
    '1 1 1 rg 0.92 0.92 1 rg',
    `BT /F2 38 Tf 92 202 Td (${esc("O'zbekistondagi smartfon narxlari - bir joyda")}) Tj ET`,
    // pastki chiziq + domen
    '1 1 1 RG 3 w 0.35 0.35 0.35 RG',
    `${V500.join(' ')} RG 5 w 92 160 m 320 160 l S`,
    '0.86 0.84 0.98 rg',
    `BT /F1 30 Tf 92 96 Td (${esc('bazarcom.online')}) Tj ET`,
  ].join('\n');

  const pdf = buildPdf({ w: W, h: H, content, shadings: '/Shading<</Sh0 7 0 R>>' });
  const png = pdfToRaster(pdf, path.join(TMP, 'og.png'), { format: 'png' });
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '88', png,
    '--out', path.join(PUBLIC, 'og-image.jpg')], { stdio: 'ignore' });
  console.log('✓ public/og-image.jpg');
}

// ── 2. apple-touch-icon.png (180x180) + ikonka rasteri ──────────────────────
function iconPdf(size) {
  const content = [
    `${V700.join(' ')} rg`,
    roundRect(0, 0, size, size, size * 0.22) + ' f',
    '1 1 1 RG',
    shoppingBag(size / 2, size / 2, size * 0.46, size * 0.075),
  ].join('\n');
  return buildPdf({ w: size, h: size, content });
}
{
  const png = pdfToRaster(iconPdf(512), path.join(PUBLIC, 'apple-touch-icon.png'),
    { format: 'png', width: 180, height: 180 });
  console.log('✓ public/apple-touch-icon.png');

  // PWA ikonkalari
  for (const s of [192, 512]) {
    pdfToRaster(iconPdf(512), path.join(PUBLIC, `icon-${s}.png`), { format: 'png', width: s, height: s });
    console.log(`✓ public/icon-${s}.png`);
  }

  // ── 3. favicon.ico — ichiga PNG joylangan ICO (Vista+ qo'llab-quvvatlaydi) ──
  const p32 = pdfToRaster(iconPdf(512), path.join(TMP, 'i32.png'), { format: 'png', width: 32, height: 32 });
  const pngBytes = fs.readFileSync(p32);
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry[0] = 32; entry[1] = 32; entry[2] = 0; entry[3] = 0;
  entry.writeUInt16LE(1, 4); entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngBytes.length, 8); entry.writeUInt32LE(22, 12);
  fs.writeFileSync(path.join(PUBLIC, 'favicon.ico'), Buffer.concat([header, entry, pngBytes]));
  console.log('✓ public/favicon.ico');
  void png;
}

// ── 4. favicon.svg — vektor, zamonaviy brauzerlar shuni afzal ko'radi ───────
{
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Bazarcom">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8b5cf6"/>
      <stop offset="1" stop-color="#6d28d9"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#g)"/>
  <path d="M20 26h24v18a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4V26Z"
        fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>
  <path d="M26 26v-3a6 6 0 0 1 12 0v3"
        fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
</svg>
`;
  fs.writeFileSync(path.join(PUBLIC, 'favicon.svg'), svg);
  console.log('✓ public/favicon.svg');
}

fs.rmSync(TMP, { recursive: true, force: true });
console.log('\nTayyor.');
