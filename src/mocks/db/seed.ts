import type { NetworkInfo } from '@/contracts/cart'
import type { Network } from '@/contracts/common'
import type { Category } from '@/contracts/nft'
import { compare, mul, roundTo } from '@/lib/money'
import type { Db, NftRecord } from './store'

const BASE_DATE = Date.parse('2026-09-01T12:00:00.000Z')
const DAY = 86_400_000

const creators = [
  { id: 'creator-1', name: 'Nova Sato' },
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
const categories: Category[] = [
  'digital-art',
  'photography',
  'music',
  '3d',
  'collectibles',
  'generative',
  'gaming',
  'subscriptions',
  'utility',
]
const networkCycle: Network[] = ['ethereum', 'ethereum', 'polygon', 'ethereum', 'solana', 'polygon']
const networkNames: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

/** The four artworks from the design, with names and attributes matching each character. */
const families = {
  emerald: {
    image: 'ape-emerald',
    names: ['Emerald Ape', 'Jade Rebel', 'Verdant Ape'],
    attributes: ['Óculos', 'Esmeralda'],
  },
  nomad: {
    image: 'ape-nomad',
    names: ['Sage Nomad', 'Violet Nomad', 'Cosmic Bloom'],
    attributes: ['Chapéu', 'Moletom'],
  },
  ivory: {
    image: 'ape-ivory',
    names: ['Ivory Baron', 'Neon Vessel', 'Onyx Regent'],
    attributes: ['Blazer', 'Gola alta'],
  },
  golden: {
    image: 'ape-golden',
    names: ['Golden Beat', 'Golden Signal', 'Golden Frequency'],
    attributes: ['Fones', 'Jaqueta'],
  },
}
type Family = keyof typeof families
const familyCycle: Family[] = ['emerald', 'nomad', 'ivory', 'golden']

/** The first nine NFTs reproduce the catalog grid of the design, in order. */
const designed: {
  family: Family
  name: string
  token: string
  price: string
  compareAt?: string
}[] = [
  { family: 'emerald', name: 'Emerald Ape', token: '042', price: '1.19' },
  { family: 'nomad', name: 'Sage Nomad', token: '009', price: '1.69' },
  { family: 'ivory', name: 'Neon Vessel', token: '552', price: '1.99', compareAt: '2.29' },
  { family: 'nomad', name: 'Cosmic Bloom', token: '118', price: '1.29' },
  { family: 'nomad', name: 'Violet Nomad', token: '314', price: '1.39' },
  { family: 'ivory', name: 'Ivory Baron', token: '088', price: '1.79' },
  { family: 'golden', name: 'Golden Beat', token: '207', price: '0.99' },
  { family: 'golden', name: 'Golden Frequency', token: '071', price: '0.59' },
  { family: 'golden', name: 'Golden Signal', token: '160', price: '0.39' },
]
const prices = [
  '0.02',
  '0.08',
  '0.15',
  '0.39',
  '0.59',
  '0.99',
  '1.19',
  '1.49',
  '2.25',
  '3.4',
  '5.8',
  '8.9',
  '12.3',
]
/** Hero carousel: featured without a discount; sidebar "oferta limitada": featured with one. */
const featured = new Set([1, 6, 7, 13])

const reviewers = [
  'Lia M.',
  'Caio R.',
  'Bea T.',
  'Duda F.',
  'Igor P.',
  'Nina S.',
  'Otto V.',
  'Rui A.',
]
const comments = [
  'Arte impecável, as cores ficam ainda melhores em alta resolução.',
  'Compra tranquila e procedência verificada. Recomendo.',
  'Uma das peças mais fortes da coleção.',
  'Detalhes incríveis, vale cada ETH.',
  'Gostei muito do acesso exclusivo para colecionadores.',
  'Ótima entrada para quem está começando a colecionar.',
]
const ratings = [5, 5, 4, 5, 4, 5, 3, 5]

const hex = (seed: number) =>
  ((seed * 2654435761) >>> 0).toString(16).padStart(8, '0').toUpperCase()

function nftRecord(i: number): NftRecord {
  const id = `nft-${String(i).padStart(3, '0')}`
  const design = designed[i - 1]
  const familyKey = design?.family ?? familyCycle[i % familyCycle.length]
  const family = families[familyKey]
  const token = design?.token ?? String(((i * 37) % 900) + 1).padStart(3, '0')
  const name = `${design?.name ?? family.names[Math.floor(i / 4) % family.names.length]} #${token}`
  const price = design?.price ?? prices[(i * 7) % prices.length]
  // Generated discounts only on prices high enough for the old price to differ visibly.
  const compareAtPrice = design
    ? (design.compareAt ?? null)
    : i % 8 === 5 && compare(price, '0.5') >= 0
      ? roundTo(mul(price, '1.2'), 2)
      : null
  const network = networkCycle[i % networkCycle.length]
  const collection = collections[i % collections.length]
  const rare = compareAtPrice !== null || (!design && i % 6 === 0)

  // From item 10 on: every 7th NFT is sold out, every 5th has its 1/10 edition sold out.
  const soldOut = i > 9 && i % 7 === 0
  const editions = [
    {
      id: `${id}-e1`,
      name: '1/1',
      price: mul(price, 4),
      supply: 1,
      available: soldOut ? 0 : i % 2,
    },
    {
      id: `${id}-e10`,
      name: '1/10',
      price: mul(price, 2),
      supply: 10,
      available: soldOut || i % 5 === 0 ? 0 : 10 - (i % 4),
    },
    {
      id: `${id}-e50`,
      name: '1/50',
      price,
      supply: 50,
      available: soldOut ? 0 : 50 - ((i * 3) % 20),
    },
    ...(soldOut || i % 3 === 0
      ? []
      : [{ id: `${id}-open`, name: 'Aberta', price, supply: null, available: 1000 }]),
  ]

  const reviewCount = i === 1 ? 19 : 2 + (i % 6)
  const reviews = Array.from({ length: reviewCount }, (_, r) => ({
    id: `${id}-r${r + 1}`,
    author: reviewers[(i + r) % reviewers.length],
    rating: ratings[(i + r) % ratings.length],
    comment: comments[(i * 3 + r) % comments.length],
    createdAt: new Date(BASE_DATE - (i + r) * DAY).toISOString(),
  }))
  const average =
    Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10

  // The UI derives the AVIF srcset (-480.avif, -960.avif) from this JPEG path.
  const image = `/assets/nfts/${family.image}-960.jpg`
  return {
    id,
    name,
    tokenId: `#0${token}`,
    image,
    images: [image, image, image, image],
    category: categories[i % categories.length],
    collection,
    network,
    creator: creators[i % creators.length],
    compareAtPrice,
    rare,
    featured: featured.has(i),
    isNew: i <= 12,
    trending: i % 3 === 2,
    description: `Um colecionável digital finalizado à mão da coleção ${collection}, verificado na ${networkNames[network]}, com arte desbloqueável e acesso para colecionadores.`,
    editions,
    maxPerOrder: 10,
    attributes: [...family.attributes, ...(rare ? ['Raro'] : [])],
    contractAddress: `0x${hex(i)}${hex(i + 1)}${hex(i + 2)}${hex(i + 3)}${hex(i + 4)}`,
    royaltyPercent: 5,
    rating: { average, count: reviewCount },
    reviews,
    createdAt: new Date(BASE_DATE - i * DAY).toISOString(),
    version: 1,
  }
}

const networks: NetworkInfo[] = [
  { id: 'ethereum', name: 'Ethereum', fee: '0.016' },
  { id: 'polygon', name: 'Polygon', fee: '0.002' },
  { id: 'solana', name: 'Solana', fee: '0.001' },
]

/** Password for both seed users: Collector123 (stored as salted SHA-256). */
export function seed(): Omit<Db, 'scenario' | 'config'> {
  const createdAt = new Date(BASE_DATE - 90 * DAY).toISOString()
  return {
    schemaVersion: 3,
    seq: 0,
    users: [
      {
        id: 'user-ana',
        name: 'Ana Souza',
        username: 'ana',
        email: 'ana@example.com',
        ensName: 'ana.eth',
        walletNickname: 'Ana principal',
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
        ensName: 'bruno.eth',
        walletNickname: 'Bruno diário',
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
    // Same shape as the wallets layout: each wallet carries the collector profile used to pay with it.
    wallets: [
      {
        id: 'wallet-ana-1',
        userId: 'user-ana',
        slot: 'primary',
        label: 'Principal',
        provider: 'metamask',
        address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
        network: 'ethereum',
        displayName: 'Ana Souza',
        profileName: 'Ana Coleções',
        email: 'ana@example.com',
        ensName: 'ana.eth',
        referralCode: 'KURIO2026',
        secondaryAddress: '',
        updatedAt: createdAt,
      },
      {
        id: 'wallet-bruno-1',
        userId: 'user-bruno',
        slot: 'primary',
        label: 'Principal',
        provider: 'coinbase',
        address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        network: 'ethereum',
        displayName: 'Bruno Costa',
        profileName: 'Bruno Arte',
        email: 'bruno@example.com',
        ensName: 'bruno.eth',
        referralCode: 'KURIO2026',
        secondaryAddress: '',
        updatedAt: createdAt,
      },
      {
        id: 'wallet-bruno-2',
        userId: 'user-bruno',
        slot: 'secondary',
        label: 'Reserva',
        provider: 'walletconnect',
        address: '0xFABB0ac9d68B0B445fB7357272Ff202C5651694a',
        network: 'polygon',
        displayName: 'Bruno Costa',
        profileName: 'Bruno Arte',
        email: 'bruno@example.com',
        ensName: 'nova.kurio.eth',
        referralCode: 'KURIO2026',
        secondaryAddress: '',
        updatedAt: createdAt,
      },
    ],
    walletConnections: {},
    networks,
  }
}
