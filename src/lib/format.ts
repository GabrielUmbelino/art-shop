import type { Network } from '@/contracts/common'
import type { Category } from '@/contracts/nft'

export const categoryLabels: Record<Category, string> = {
  'digital-art': 'Arte digital',
  photography: 'Fotografia',
  music: 'Música',
  '3d': 'Arte 3D',
  collectibles: 'Colecionáveis',
  generative: 'Generativa',
  gaming: 'Jogos',
  subscriptions: 'Assinaturas',
  utility: 'Utilidade',
}

export const networkLabels: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
export const formatDate = (iso: string) => dateFormat.format(new Date(iso))

/** Shortens addresses and hashes: 0x7A42...19E8. */
export const shortHash = (value: string) => `${value.slice(0, 6)}...${value.slice(-4)}`
