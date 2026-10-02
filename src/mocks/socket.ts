import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws, type WebSocketHandlerConnection } from 'msw'
import { socketPath, type ServerEvent } from '@/contracts/events'
import { db, now, nextId } from './db/store'
import { userIdForToken } from './lib'

/**
 * Mock Socket.IO server on top of MSW's WebSocket interception.
 * socket.io-client must use the websocket transport; long-polling would bypass it.
 * The binding answers the handshake itself, so auth is read from the client's
 * CONNECT packet and only used to scope private events.
 */
type Connection = {
  raw: WebSocketHandlerConnection['client']
  io: ReturnType<typeof toSocketIo>
  token: string | null
}

const connections = new Set<Connection>()
const log: { event: ServerEvent; userId: string | null }[] = []

const socketUrl = `${location.origin.replace(/^http/, 'ws')}${socketPath}`

export const socketHandler = ws.link(socketUrl).addEventListener('connection', (connection) => {
  if (db.config.socketOffline) {
    connection.client.close()
    return
  }
  const conn: Connection = { raw: connection.client, io: toSocketIo(connection), token: null }
  connection.client.addEventListener('message', ({ data }) => {
    // Socket.IO CONNECT packet: "40" followed by the optional auth payload.
    if (typeof data === 'string' && data.startsWith('40')) {
      conn.token = (JSON.parse(data.slice(2) || '{}') as { token?: string }).token ?? null
    }
  })
  // The binding never pings; without it socket.io-client drops the connection after 30 s.
  const ping = setInterval(() => connection.client.send('2'), 25_000)
  connection.client.addEventListener('close', () => {
    clearInterval(ping)
    connections.delete(conn)
  })
  connections.add(conn)
})

function deliver(event: ServerEvent, userId: string | null) {
  for (const conn of connections) {
    if (userId && userIdForToken(conn.token) !== userId) continue
    conn.io.client.emit(event.type, event)
  }
}

/** Publishes an event. Private events (userId set) only reach that user's sockets. */
export function publish<T extends ServerEvent>(
  event: Omit<T, 'id' | 'occurredAt'>,
  userId: string | null = null,
) {
  const full = { ...event, id: nextId('evt'), occurredAt: now() } as ServerEvent
  log.push({ event: full, userId })
  deliver(full, userId)
  return full
}

export const events = () => log.map((entry) => entry.event)

/** Re-delivers a past event unchanged: a duplicate, or a stale one if newer events followed. */
export function replay(eventId: string) {
  const entry = log.find((e) => e.event.id === eventId)
  if (entry) deliver(entry.event, entry.userId)
}

/** Closes every socket; socket.io-client reconnects unless socketOffline is set. */
export function dropConnections() {
  for (const conn of connections) conn.raw.close()
}
