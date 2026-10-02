import { z } from 'zod'
import { isoDate } from './common'
import { nft } from './nft'
import { order } from './order'

/**
 * Socket.IO path shared by client and mock server. Not the default /socket.io/:
 * MSW strips that prefix before matching, which would collide with Vite's HMR socket on /.
 */
export const socketPath = '/realtime/'

const envelope = {
  /** Stable event identity, used to drop duplicates. */
  id: z.string(),
  resourceId: z.string(),
  /** Version of the resource after the change. Older or equal versions are stale. */
  version: z.number().int().min(1),
  occurredAt: isoDate,
}

export const nftUpdatedEvent = z.object({
  ...envelope,
  type: z.literal('nft.updated'),
  payload: nft,
})
export type NftUpdatedEvent = z.infer<typeof nftUpdatedEvent>

export const orderUpdatedEvent = z.object({
  ...envelope,
  type: z.literal('order.updated'),
  payload: order,
})
export type OrderUpdatedEvent = z.infer<typeof orderUpdatedEvent>

export const serverEvent = z.discriminatedUnion('type', [nftUpdatedEvent, orderUpdatedEvent])
export type ServerEvent = z.infer<typeof serverEvent>
