import type { Cart, NetworkInfo, Network } from '@/contracts/cart'
import type { Nft } from '@/contracts/nft'
import type { Order } from '@/contracts/order'
import type { User } from '@/contracts/user'
import type { Wallet } from '@/contracts/wallet'
import { min } from '@/lib/money'
import { scenarios, type MockConfig, type ScenarioName } from '../scenarios'
import { seed } from './seed'

export type UserRecord = User & { passwordSalt: string; passwordHash: string }
export type SessionRecord = { token: string; userId: string; expiresAt: string }
/** Price and availability are derived from editions, see toNft(). */
export type NftRecord = Omit<Nft, 'price' | 'available'>
export type CartRecord = {
  id: string
  userId: string | null
  items: { id: string; nftId: string; editionId: string; quantity: number }[]
  couponCode: Cart['couponCode']
}
export type CouponRecord = { code: string; percentOff: number; expiresAt: string }
export type OrderRecord = Order & { userId: string; idempotencyKey: string; fingerprint: string }
export type WalletRecord = Wallet & { userId: string }

export type Db = {
  schemaVersion: 1
  scenario: ScenarioName
  config: MockConfig
  seq: number
  users: UserRecord[]
  sessions: SessionRecord[]
  nfts: NftRecord[]
  favorites: Record<string, string[]>
  carts: Record<string, CartRecord>
  coupons: CouponRecord[]
  orders: OrderRecord[]
  wallets: WalletRecord[]
  walletConnections: Record<string, { network: Network; connectedAt: string }>
  networks: NetworkInfo[]
}

const DB_KEY = 'nft-mock:db'

function create(scenario: ScenarioName): Db {
  const config = structuredClone(scenarios[scenario].config)
  const data = seed()
  if (config.emptyCatalog) data.nfts = []
  return { ...data, scenario, config }
}

function load(): Db | null {
  try {
    const stored = JSON.parse(localStorage.getItem(DB_KEY) ?? 'null') as Db | null
    return stored?.schemaVersion === 1 ? stored : null
  } catch {
    return null
  }
}

export let db: Db = load() ?? create('default')

export function save() {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

/** Restores the seed data and the scenario's configuration. */
export function reset(scenario: ScenarioName = db.scenario) {
  db = create(scenario)
  save()
}

/** Deterministic ids, so receipts and screenshots are stable. */
export function nextId(prefix: string) {
  db.seq += 1
  return `${prefix}-${db.seq}`
}

export const now = () => new Date().toISOString()

export function toNft(record: NftRecord): Nft {
  const available = record.editions.reduce((sum, e) => sum + e.available, 0)
  const open = record.editions.filter((e) => e.available > 0)
  return {
    ...record,
    price: min((open.length ? open : record.editions).map((e) => e.price)),
    available,
  }
}

export const findNft = (id: string) => db.nfts.find((n) => n.id === id)
