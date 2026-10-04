import type { Socket } from 'socket.io-client'
import { socketPath } from '@/contracts/events'

/**
 * One socket per session. A new token (login, user switch) replaces the socket, so events from
 * the previous session can never reach the new one; logout leaves an anonymous socket for public events.
 *
 * socket.io-client is imported on first use: engine.io-client reads globalThis.WebSocket when its
 * module is evaluated, and by then the mock layer (when enabled) has already patched WebSocket.
 */
let socket: Socket | null = null
let generation = 0

export async function connectRealtime(token: string | null, onConnect: (socket: Socket) => void) {
  disconnectRealtime()
  const current = ++generation
  const { io } = await import('socket.io-client')
  // A newer session started while the client was loading.
  if (current !== generation) return
  socket = io({ path: socketPath, transports: ['websocket'], auth: { token } })
  onConnect(socket)
}

/** Listeners are released with the socket, so nothing from an ended session keeps running. */
export function disconnectRealtime() {
  generation++
  socket?.off()
  socket?.disconnect()
  socket = null
}
