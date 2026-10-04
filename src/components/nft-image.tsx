import { cn } from 'cn'

/**
 * Artwork with AVIF sources derived from the JPEG path (name-960.jpg -> name-480.avif, name-960.avif).
 * Width and height reserve the space, so loading never shifts the layout.
 */
export function NftImage({
  src,
  alt,
  sizes,
  priority,
  className,
}: {
  src: string
  alt: string
  sizes: string
  priority?: boolean
  className?: string
}) {
  const base = src.replace(/-960\.jpg$/, '')
  return (
    <picture>
      <source
        type="image/avif"
        srcSet={`${base}-480.avif 480w, ${base}-960.avif 960w`}
        sizes={sizes}
      />
      <img
        src={src}
        alt={alt}
        width={960}
        height={960}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className={cn('aspect-square h-auto w-full object-cover', className)}
      />
    </picture>
  )
}
