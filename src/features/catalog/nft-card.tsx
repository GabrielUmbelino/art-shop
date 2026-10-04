import { Link } from '@tanstack/react-router'
import { SearchIcon, ShoppingCartIcon } from 'lucide-react'
import { NftImage } from '@/components/nft-image'
import { Price } from '@/components/price'
import { Skeleton } from '@/components/ui/skeleton'
import type { NftSummary } from '@/contracts/nft'
import { useQuickAdd } from '@/features/cart/use-quick-add'
import { FavoriteButton } from '@/features/favorites/favorite-button'

const action =
  'relative z-10 flex size-8 items-center justify-center rounded-sm bg-background/90 text-foreground hover:text-highlight'

/**
 * Catalog card. The whole card links to the NFT (stretched link); the actions container needs its own
 * z-index because its hover fade (opacity) creates a stacking context below the link's overlay otherwise.
 */
export function NftCard({ nft, priority }: { nft: NftSummary; priority?: boolean }) {
  const quickAdd = useQuickAdd()
  return (
    <article className="group relative flex flex-col gap-2">
      <div className="relative bg-card p-1 md:p-2">
        <NftImage
          src={nft.image}
          alt=""
          priority={priority}
          sizes="(min-width: 1024px) 258px, (min-width: 768px) 33vw, 50vw"
          className="rounded-2xl"
        />
        {nft.rare && (
          <span className="absolute top-0 left-0 bg-primary px-3 py-1 text-xs font-bold text-primary-foreground md:text-sm">
            RARO
          </span>
        )}
        {nft.available === 0 && (
          <span className="absolute top-3 right-3 rounded-sm bg-background/90 px-2 py-1 text-xs font-bold">
            Esgotado
          </span>
        )}
        <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center gap-2 opacity-100 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100 max-md:top-3 max-md:right-3 max-md:bottom-auto max-md:left-auto">
          {nft.available > 0 && (
            <button
              type="button"
              onClick={() => void quickAdd(nft)}
              className={`${action} max-md:hidden`}
              aria-label={`Adicionar ${nft.name} ao carrinho`}
            >
              <ShoppingCartIcon className="size-5" />
            </button>
          )}
          <FavoriteButton nft={nft} className={`${action} max-md:rounded-full`} />
          <Link
            to="/nft/$id"
            params={{ id: nft.id }}
            className={`${action} max-md:hidden`}
            aria-label={`Ver detalhes de ${nft.name}`}
          >
            <SearchIcon className="size-5" />
          </Link>
        </div>
      </div>
      <h3 className="text-[15px] tracking-wide">
        <Link
          to="/nft/$id"
          params={{ id: nft.id }}
          className="after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-ring"
        >
          {nft.name}
        </Link>
      </h3>
      <Price amount={nft.price} compareAt={nft.compareAtPrice} className="text-base" />
    </article>
  )
}

export function NftCardSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      <div className="bg-card p-1 md:p-2">
        <Skeleton className="aspect-square w-full rounded-2xl" />
      </div>
      <Skeleton className="h-[22px] w-3/4" />
      <Skeleton className="h-6 w-1/3" />
    </div>
  )
}
