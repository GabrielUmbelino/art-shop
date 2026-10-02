import type { NetworkInfo } from '@/contracts/cart'
import type { Category } from '@/contracts/nft'
import { mul } from '@/lib/money'
import type { Db, NftRecord } from './store'

const BASE_DATE = Date.parse('2026-09-01T12:00:00.000Z')
const DAY = 86_400_000

const creators = [
  { id: 'creator-1', name: 'Lena Ortiz' },
  { id: 'creator-2', name: 'Kofi Mensah' },
  { id: 'creator-3', name: 'Mira Takahashi' },
  { id: 'creator-4', name: 'Theo Laurent' },
  { id: 'creator-5', name: 'Sana Iqbal' },
  { id: 'creator-6', name: 'Rafael Lima' },
].map((c, i) => ({ ...c, avatarUrl: `/assets/creators/creator-${i + 1}.svg` }))

const collections = [
  'Kurio Apes',
  'Kurio Editions',
  'Nomad Club',
  'Golden Hour',
  'Ivory Court',
  'Jade Society',
]
const categories: Category[] = ['art', 'photography', 'music', 'gaming', 'collectibles', '3d']
/** The four artworks from the design, with names matching each character as the design does. */
const families = [
  { image: 'ape-emerald', names: ['Emerald Ape', 'Jade Rebel', 'Verdant Ape'] },
  { image: 'ape-nomad', names: ['Sage Nomad', 'Violet Nomad', 'Cosmic Bloom'] },
  { image: 'ape-ivory', names: ['Ivory Baron', 'Neon Vessel', 'Onyx Regent'] },
  { image: 'ape-golden', names: ['Golden Beat', 'Golden Signal', 'Golden Frequency'] },
]
const prices = ['0.08', '0.15', '0.32', '0.45', '0.75', '1.2', '1.85', '2.5', '3.75', '5']
const editionNames = ['Standard', 'Limited', 'Artist Proof']
const featured = new Set([3, 8, 15, 21])

function nftRecord(i: number): NftRecord {
  const id = `nft-${String(i).padStart(3, '0')}`
  const family = families[i % families.length]
  const token = String(((i * 37) % 900) + 1).padStart(3, '0')
  const name = `${family.names[Math.floor(i / families.length) % family.names.length]} #${token}`
  const basePrice = prices[(i * 7) % prices.length]
  const editionCount = (i % 3) + 1
  const editions = editionNames.slice(0, editionCount).map((editionName, e) => {
    const supply = [25, 10, 3][e]
    // Every 7th NFT is fully sold out; every 5th has its last edition sold out.
    const soldOut = i % 7 === 0 || (i % 5 === 0 && e === editionCount - 1)
    return {
      id: `${id}-e${e + 1}`,
      name: editionName,
      price: e === 0 ? basePrice : mul(basePrice, e + 1.5),
      supply,
      available: soldOut ? 0 : supply - ((i + e) % supply),
    }
  })
  // The UI derives the AVIF srcset (-480.avif, -960.avif) from this JPEG path.
  const image = `/assets/nfts/${family.image}-960.jpg`
  return {
    id,
    name,
    image,
    images: [image, image, image, image],
    category: categories[i % categories.length],
    collection: collections[i % collections.length],
    creator: creators[i % creators.length],
    description: `${name} is part of the ${collections[i % collections.length]} collection. A generative study of colour and form, minted as a limited series.`,
    editions,
    maxPerOrder: 5,
    featured: featured.has(i),
    createdAt: new Date(BASE_DATE - i * DAY).toISOString(),
    version: 1,
  }
}

const networks: NetworkInfo[] = [
  { id: 'ethereum', name: 'Ethereum', fee: '0.0024' },
  { id: 'polygon', name: 'Polygon', fee: '0.0002' },
  { id: 'base', name: 'Base', fee: '0.0004' },
]

/** Password for both seed users: Collector123 (stored as salted SHA-256). */
export function seed(): Omit<Db, 'scenario' | 'config'> {
  const createdAt = new Date(BASE_DATE - 90 * DAY).toISOString()
  return {
    schemaVersion: 1,
    seq: 0,
    users: [
      {
        id: 'user-ana',
        name: 'Ana Souza',
        username: 'ana',
        email: 'ana@example.com',
        bio: 'Collector of generative art.',
        avatarUrl: null,
        createdAt,
        passwordSalt: 'salt-ana',
        passwordHash: 'b38fc563cd8c43af253c51d0bb0d59659d0303ea993f832e5a58edcbc5493b03',
      },
      {
        id: 'user-bruno',
        name: 'Bruno Costa',
        username: 'bruno',
        email: 'bruno@example.com',
        bio: '',
        avatarUrl: null,
        createdAt,
        passwordSalt: 'salt-bruno',
        passwordHash: 'b0cee91a4899e51e7b443d41ca50019a16b20875570f4ba6d6e7c0ff6d7b89d3',
      },
    ],
    sessions: [],
    nfts: Array.from({ length: 48 }, (_, i) => nftRecord(i + 1)),
    favorites: { 'user-ana': ['nft-003', 'nft-012'], 'user-bruno': [] },
    carts: {},
    coupons: [
      { code: 'WELCOME10', percentOff: 10, expiresAt: '2099-12-31T23:59:59.000Z' },
      { code: 'COLLECTOR25', percentOff: 25, expiresAt: '2099-12-31T23:59:59.000Z' },
      { code: 'SUMMER20', percentOff: 20, expiresAt: '2025-09-01T00:00:00.000Z' },
    ],
    orders: [],
    wallets: [
      {
        id: 'wallet-ana-1',
        userId: 'user-ana',
        slot: 'primary',
        label: 'Main wallet',
        provider: 'metamask',
        address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
        updatedAt: createdAt,
      },
      {
        id: 'wallet-bruno-1',
        userId: 'user-bruno',
        slot: 'primary',
        label: 'Daily',
        provider: 'coinbase',
        address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        updatedAt: createdAt,
      },
      {
        id: 'wallet-bruno-2',
        userId: 'user-bruno',
        slot: 'secondary',
        label: 'Vault',
        provider: 'walletconnect',
        address: '0xFABB0ac9d68B0B445fB7357272Ff202C5651694a',
        updatedAt: createdAt,
      },
    ],
    walletConnections: {},
    networks,
  }
}
