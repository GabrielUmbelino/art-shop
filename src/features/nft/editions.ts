import type { Nft } from '@/contracts/nft'
import { compare } from '@/lib/money'

/** The edition chosen by default: the cheapest one still available (falls back to the first). */
export const defaultEdition = (nft: Nft) =>
  nft.editions.filter((e) => e.available > 0).sort((a, b) => compare(a.price, b.price))[0] ??
  nft.editions[0]
