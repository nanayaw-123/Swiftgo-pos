/**
 * Custom image loader for Cloudflare Image Optimization
 * This enables automatic image resizing, format conversion, and optimization
 */

export default function cloudflareLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}): string {
  // If the source is an external URL (starts with http:// or https://), return it as-is
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src
  }

  const params = [`width=${width}`]

  if (quality) {
    params.push(`quality=${quality}`)
  }

  // Normalize the source URL
  const normalizedSrc = src.startsWith('/') ? src.slice(1) : src

  // In development, return original URL with params
  if (process.env.NODE_ENV === 'development') {
    return `${src}?${params.join('&')}`
  }

  // In production, use Cloudflare's image optimization CDN
  // Format: /cdn-cgi/image/width=800,quality=80/path/to/image.jpg
  return `/cdn-cgi/image/${params.join(',')}/${normalizedSrc}`
}