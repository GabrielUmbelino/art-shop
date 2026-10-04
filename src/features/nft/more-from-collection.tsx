import { useQuery } from '@tanstack/react-query'
import { nftListQuery } from '@/api/nfts'
import { NftCard, NftCardSkeleton } from '@/features/catalog/nft-card'

/** Horizontal, scroll-snapping row of other NFTs from the same collection. */
export function MoreFromCollection({ nftId, collection }: { nftId: string; collection: string }) {
  const list = useQuery(nftListQuery({ collection, pageSize: 6 }))
  const items = list.data?.items.filter((n) => n.id !== nftId).slice(0, 5)
  if (items?.length === 0) return null
  return (
    <section aria-labelledby="more-title" className="flex flex-col gap-6">
      <h2
        id="more-title"
        className="border-b border-border pb-2 font-bold tracking-wide text-highlight"
      >
        Mais desta coleção
      </h2>
      <ul className="-mx-[18px] flex snap-x snap-mandatory gap-6 overflow-x-auto px-[18px] pb-2">
        {(items ?? Array.from({ length: 5 }, () => null)).map((nft, i) => (
          <li
            key={nft?.id ?? i}
            className="w-[60%] shrink-0 snap-start sm:w-[calc((100%-4*24px)/5)] sm:min-w-[180px]"
          >
            {nft ? <NftCard nft={nft} /> : <NftCardSkeleton />}
          </li>
        ))}
      </ul>
    </section>
  )
}
