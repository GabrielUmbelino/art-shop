import { z } from 'zod'
import { ethAmount, isoDate, paginated } from './common'

export const categories = ['art', 'photography', 'music', 'gaming', 'collectibles', '3d'] as const
export const category = z.enum(categories)
export type Category = z.infer<typeof category>

export const sortOptions = ['newest', 'price-asc', 'price-desc', 'name'] as const

export const edition = z.object({
  id: z.string(),
  name: z.string(),
  price: ethAmount,
  supply: z.number().int().min(1),
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
  image: z.string(),
  category,
  collection: z.string(),
  creator,
  /** Lowest edition price. */
  price: ethAmount,
  /** Units available across all editions. */
  available: z.number().int().min(0),
  featured: z.boolean(),
  createdAt: isoDate,
  version: z.number().int().min(1),
})
export type NftSummary = z.infer<typeof nftSummary>

export const nft = nftSummary.extend({
  description: z.string(),
  images: z.array(z.string()).min(1),
  editions: z.array(edition).min(1),
  /** Maximum quantity of one edition per order. */
  maxPerOrder: z.number().int().min(1),
})
export type Nft = z.infer<typeof nft>

export const nftListQuery = z.object({
  q: z.string().trim().optional(),
  category: z.array(category).optional(),
  minPrice: ethAmount.optional(),
  maxPrice: ethAmount.optional(),
  availableOnly: z.boolean().optional(),
  sort: z.enum(sortOptions).default('newest'),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(48).default(12),
})
export type NftListQuery = z.infer<typeof nftListQuery>

export const nftList = paginated(nftSummary)
export type NftList = z.infer<typeof nftList>

export const favorites = z.object({ items: z.array(nftSummary) })
export type Favorites = z.infer<typeof favorites>
