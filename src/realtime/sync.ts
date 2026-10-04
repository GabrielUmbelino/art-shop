import type { QueryClient } from '@tanstack/react-query'
import type { Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { nftKeys } from '@/api/nfts'
import type { Cart } from '@/contracts/cart'
import { nftUpdatedEvent } from '@/contracts/events'
import { nftSummary, type Nft, type NftList, type NftSummary } from '@/contracts/nft'
import { cartNotices } from '@/features/cart/notices-store'
import { announce } from '@/lib/announce'
import { compare, formatEth } from '@/lib/money'

const isCartKey = (key: readonly unknown[]) =>
  (key[0] === 'cart' && key[1] === 'guest' && key.length === 2) ||
  (key[0] === 'private' && key[2] === 'cart' && key.length === 3)

/** What changed for each cart line of this NFT, in words. */
function describeChanges(cart: Cart, nft: Nft) {
  return cart.items.flatMap((item) => {
    if (item.nftId !== nft.id) return []
    const edition = nft.editions.find((e) => e.id === item.editionId)
    if (!edition) return []
    const label = `${item.name} (${item.editionName})`
    const messages: string[] = []
    if (compare(edition.price, item.unitPrice) !== 0)
      messages.push(
        `O preço de ${label} mudou de ${formatEth(item.unitPrice)} para ${formatEth(edition.price)}.`,
      )
    const max = Math.min(edition.available, nft.maxPerOrder)
    if (edition.available === 0) messages.push(`${label} esgotou.`)
    else if (max < item.quantity)
      messages.push(`Restam apenas ${edition.available} unidades de ${label}.`)
    return messages
  })
}

/**
 * Applies realtime events to the query cache. Duplicates (same event id) and stale events
 * (version not newer than the last applied one) are ignored, so effects never repeat or regress.
 */
export function bindRealtime(socket: Socket, queryClient: QueryClient) {
  const seen: string[] = []
  const versions = new Map<string, number>()
  let connectedBefore = false

  const applyNft = (nft: Nft) => {
    const summary: NftSummary = nftSummary.parse(nft)
    if (queryClient.getQueryData(nftKeys.detail(nft.id)))
      queryClient.setQueryData(nftKeys.detail(nft.id), nft)
    queryClient.setQueriesData<NftList>(
      { queryKey: ['nfts', 'list'] },
      (list) =>
        list && { ...list, items: list.items.map((item) => (item.id === nft.id ? summary : item)) },
    )
    queryClient.setQueryData<NftSummary[]>(nftKeys.featured, (items) =>
      items?.map((item) => (item.id === nft.id ? summary : item)),
    )
    // Filters and counts may no longer match; refresh them on next use, not now.
    void queryClient.invalidateQueries({ queryKey: nftKeys.all, refetchType: 'none' })

    for (const [key, cart] of queryClient.getQueriesData<Cart>({
      predicate: (q) => isCartKey(q.queryKey),
    })) {
      if (!cart?.items.some((item) => item.nftId === nft.id)) continue
      const messages = describeChanges(cart, nft)
      if (messages.length) {
        cartNotices.add(
          messages.map((message, i) => ({ id: `${nft.id}-${nft.version}-${i}`, message })),
        )
        announce(messages.join(' '))
        toast.info('Um item do seu carrinho foi atualizado.', { description: messages.join(' ') })
      }
      void queryClient.invalidateQueries({ queryKey: key })
    }
  }

  socket.on('nft.updated', (raw: unknown) => {
    const parsed = nftUpdatedEvent.safeParse(raw)
    if (!parsed.success) return
    const event = parsed.data
    if (seen.includes(event.id)) return
    seen.push(event.id)
    if (seen.length > 500) seen.shift()

    const cachedVersion =
      queryClient.getQueryData<Nft>(nftKeys.detail(event.resourceId))?.version ?? 0
    if (event.version <= Math.max(versions.get(event.resourceId) ?? 0, cachedVersion)) return
    versions.set(event.resourceId, event.version)
    applyNft(event.payload)
  })

  // Events may have been missed while disconnected: reconcile active data with the API.
  socket.on('connect', () => {
    if (connectedBefore) {
      void queryClient.invalidateQueries({ queryKey: nftKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
      void queryClient.invalidateQueries({ queryKey: ['private'] })
    }
    connectedBefore = true
  })
}
