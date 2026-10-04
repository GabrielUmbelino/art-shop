import { z } from 'zod'
import { ethAmount, isoDate, network, networks, paginated } from './common'

export const categories = [
  'digital-art',
  'photography',
  'music',
  '3d',
  'collectibles',
  'generative',
  'gaming',
  'subscriptions',
  'utility',
] as const
export const category = z.enum(categories)
export type Category = z.infer<typeof category>

export const sortOptions = ['newest', 'price-asc', 'price-desc', 'name'] as const
export const tabs = ['all', 'new', 'trending'] as const

export const edition = z.object({
  id: z.string(),
  /** Label shown on the edition pill: "1/1", "1/10", "1/50" or "Aberta". */
  name: z.string(),
  price: ethAmount,
  /** Total units; null for an open edition. */
  supply: z.number().int().min(1).nullable(),
  available: z.number().int().min(0),
})
export type Edition = z.infer<typeof edition>

export const creator = z.object({
  id: z.string(),
  name: z.string(),
  avatarUrl: z.string(),
})

export const nftSummary = z.object({
  id: z.string(),
  name: z.string(),
  /** Display token id, e.g. "#0042". */
  tokenId: z.string(),
  image: z.string(),
  category,
  collection: z.string(),
  network,
  creator,
  /** Lowest price among available editions (or among all editions when sold out). */
  price: ethAmount,
  /** Previous price, shown struck through when set. */
  compareAtPrice: ethAmount.nullable(),
  /** Units available across all editions. */
  available: z.number().int().min(0),
  rare: z.boolean(),
  featured: z.boolean(),
  isNew: z.boolean(),
  trending: z.boolean(),
  createdAt: isoDate,
  version: z.number().int().min(1),
})
export type NftSummary = z.infer<typeof nftSummary>

export const review = z.object({
  id: z.string(),
  author: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string(),
  createdAt: isoDate,
})

export const nft = nftSummary.extend({
  description: z.string(),
  images: z.array(z.string()).min(1),
  editions: z.array(edition).min(1),
  /** Maximum quantity of one edition per order. */
  maxPerOrder: z.number().int().min(1),
  attributes: z.array(z.string()),
  contractAddress: z.string(),
  royaltyPercent: z.number(),
  rating: z.object({ average: z.number(), count: z.number().int() }),
  reviews: z.array(review),
})
export type Nft = z.infer<typeof nft>

export const nftListQuery = z.object({
  q: z.string().trim().optional(),
  category: z.array(category).optional(),
  network: z.array(network).optional(),
  collection: z.string().optional(),
  minPrice: ethAmount.optional(),
  maxPrice: ethAmount.optional(),
  availableOnly: z.boolean().optional(),
  tab: z.enum(tabs).default('all'),
  sort: z.enum(sortOptions).default('newest'),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(48).default(9),
})
export type NftListQuery = z.input<typeof nftListQuery>

export const nftList = paginated(nftSummary)
export type NftList = z.infer<typeof nftList>

/** Counts and price bounds for the catalog filters, over the whole catalog. */
export const nftFacets = z.object({
  categories: z.record(category, z.number().int()),
  networks: z.record(z.enum(networks), z.number().int()),
  price: z.object({ min: ethAmount, max: ethAmount }),
})
export type NftFacets = z.infer<typeof nftFacets>

export const favorites = z.object({ items: z.array(nftSummary) })
export type Favorites = z.infer<typeof favorites>
