/**
 * Imagen con WebP (si existe) + fallback, lazy loading y prioridad configurable.
 */
export default function OptimizedImage({
  src,
  alt = '',
  className,
  loading = 'lazy',
  fetchPriority,
  sizes,
  width,
  height,
}) {
  const webpSrc = src.replace(/\.(png|jpe?g)$/i, '.webp');

  return (
    <picture>
      <source srcSet={webpSrc} type="image/webp" />
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        sizes={sizes}
        width={width}
        height={height}
      />
    </picture>
  );
}
