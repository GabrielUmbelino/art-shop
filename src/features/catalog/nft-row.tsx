import { useQuery } from '@tanstack/react-query'
import { useId } from 'react'
import { nftListQuery } from '@/api/nfts'
import type { NftListQuery } from '@/contracts/nft'
import { NftCard, NftCardSkeleton } from './nft-card'

/** Horizontal, scroll-snapping row of up to 5 NFTs ("Mais desta coleção", "Colecionadores também viram"). */
export function NftRow({
  title,
  query,
  excludeId,
}: {
  title: string
  query: NftListQuery
  excludeId?: string
}) {
  const titleId = useId()
  const list = useQuery(nftListQuery({ ...query, pageSize: 6 }))
  const items = list.data?.items.filter((n) => n.id !== excludeId).slice(0, 5)
  if (items?.length === 0) return null
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-6">
      <h2
        id={titleId}
        className="border-b border-border pb-2 font-bold tracking-wide text-highlight"
      >
        {title}
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
