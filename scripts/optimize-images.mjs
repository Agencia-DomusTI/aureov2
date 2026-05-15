import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

/** Genera .webp junto al original para carga más rápida en el navegador */
async function toWebp(filePath, maxWidth, quality = 82) {
  const ext = path.extname(filePath).toLowerCase();
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) return;

  const outPath = filePath.replace(/\.(jpe?g|png)$/i, '.webp');
  const image = sharp(filePath).rotate();

  const meta = await image.metadata();
  const pipeline =
    meta.width && meta.width > maxWidth
      ? image.resize({ width: maxWidth, withoutEnlargement: true })
      : image;

  await pipeline.webp({ quality, effort: 4 }).toFile(outPath);

  const { size: originalSize } = await stat(filePath);
  const { size: webpSize } = await stat(outPath);
  const saved = ((1 - webpSize / originalSize) * 100).toFixed(0);
  console.log(`  ✓ ${path.basename(outPath)} (−${saved}% vs original)`);
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

const rules = [
  { match: (f) => f.endsWith('AUREO.png'), maxWidth: 1920, quality: 80 },
  { match: (f) => f.endsWith('doctor_official.png'), maxWidth: 800, quality: 82 },
  { match: (f) => f.endsWith('logosin.png'), maxWidth: 280, quality: 85 },
  { match: (f) => /multimedia[/\\]fondo3\.jpg$/i.test(f), maxWidth: 1920, quality: 82 },
  { match: (f) => /multimedia[/\\].+\.jpe?g$/i.test(f), maxWidth: 720, quality: 82 },
];

console.log('Optimizando imágenes → WebP en public/…\n');

const allFiles = await walk(publicDir);
let count = 0;

for (const file of allFiles) {
  const rule = rules.find((r) => r.match(file));
  if (!rule) continue;
  await toWebp(file, rule.maxWidth, rule.quality);
  count += 1;
}

console.log(`\nListo: ${count} imagen(es) optimizada(s).`);
