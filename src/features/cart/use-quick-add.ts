import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { nftQuery } from '@/api/nfts'
import type { NftSummary } from '@/contracts/nft'
import { defaultEdition } from '@/features/nft/editions'
import { useAddToCart } from './use-cart'

/** Adds an item and confirms with a toast linking to the cart. */
export function useAddWithToast() {
  const add = useAddToCart()
  const navigate = useNavigate()
  return (body: { nftId: string; editionId: string; quantity: number }, name: string) =>
    add.mutate(body, {
      onSuccess: () =>
        toast.success(`${name} adicionado ao carrinho`, {
          action: { label: 'Ver carrinho', onClick: () => void navigate({ to: '/cart' }) },
        }),
    })
}

/** Card action: one unit of the default edition (the summary has no editions, so load the NFT first). */
export function useQuickAdd() {
  const queryClient = useQueryClient()
  const addWithToast = useAddWithToast()
  return async (summary: NftSummary) => {
    const nft = await queryClient.fetchQuery(nftQuery(summary.id))
    addWithToast({ nftId: nft.id, editionId: defaultEdition(nft).id, quantity: 1 }, nft.name)
  }
}
