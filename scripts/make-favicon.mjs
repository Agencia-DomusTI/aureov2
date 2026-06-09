import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
const src = path.join(publicDir, 'logosin.png');

const NAVY = { r: 14, g: 33, b: 56, alpha: 1 };

async function run() {
  const meta = await sharp(src).metadata();
  const W = meta.width;
  const H = meta.height;

  // Recorte cuadrado centrado en el emblema (parte superior del logo)
  const cx = Math.round(W * 0.5);
  const cy = Math.round(H * 0.27);
  const size = Math.round(H * 0.5);
  const left = Math.max(0, cx - Math.round(size / 2));
  const top = Math.max(0, cy - Math.round(size / 2));
  const cropW = Math.min(size, W - left);
  const cropH = Math.min(size, H - top);

  const emblem = await sharp(src)
    .extract({ left, top, width: cropW, height: cropH })
    .trim({ threshold: 10 })
    .resize(360, 360, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const makeIcon = async (px, pad, radiusRatio) => {
    const inner = px - pad * 2;
    const emblemResized = await sharp(emblem)
      .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    const radius = Math.round(px * radiusRatio);
    const mask = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}"><rect width="${px}" height="${px}" rx="${radius}" ry="${radius}"/></svg>`,
    );

    return sharp({
      create: { width: px, height: px, channels: 4, background: NAVY },
    })
      .composite([
        { input: emblemResized, top: pad, left: pad },
        { input: mask, blend: 'dest-in' },
      ])
      .png()
      .toBuffer();
  };

  const outputs = [
    { name: 'favicon-32.png', px: 32, pad: 4, radius: 0.22 },
    { name: 'favicon-192.png', px: 192, pad: 22, radius: 0.22 },
    { name: 'apple-touch-icon.png', px: 180, pad: 18, radius: 0 },
    { name: 'favicon-512.png', px: 512, pad: 60, radius: 0.22 },
  ];

  for (const o of outputs) {
    const buf = await makeIcon(o.px, o.pad, o.radius);
    await sharp(buf).toFile(path.join(publicDir, o.name));
    console.log(`  ✓ ${o.name}`);
  }
}

run();
