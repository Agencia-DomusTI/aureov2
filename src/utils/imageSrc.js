/** Ruta WebP equivalente a jpg/png en public */
export function webpSrc(src) {
  return src.replace(/\.(png|jpe?g)$/i, '.webp');
}
