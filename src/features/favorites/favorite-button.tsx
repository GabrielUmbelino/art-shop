import { HeartIcon } from 'lucide-react'
import type { NftSummary } from '@/contracts/nft'
import { cn } from 'cn'
import { useIsFavorite, useToggleFavorite } from './use-favorites'

/** Heart toggle. `label` renders the text variant used on the details page ("Favoritar"). */
export function FavoriteButton({
  nft,
  className,
  label,
}: {
  nft: NftSummary
  className?: string
  label?: boolean
}) {
  const isFavorite = useIsFavorite(nft.id)
  const toggle = useToggleFavorite()
  return (
    <button
      type="button"
      aria-pressed={isFavorite}
      aria-label={
        label
          ? undefined
          : isFavorite
            ? `Remover ${nft.name} da lista de interesse`
            : `Favoritar ${nft.name}`
      }
      onClick={(e) => {
        e.preventDefault()
        toggle(nft, !isFavorite)
      }}
      className={cn('focus-visible:outline-2 focus-visible:outline-ring', className)}
    >
      <HeartIcon className={cn('size-5', isFavorite && 'fill-current')} />
      {label && (isFavorite ? 'Favoritado' : 'Favoritar')}
    </button>
  )
}
