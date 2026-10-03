import { io, type Socket } from 'socket.io-client'
import { socketPath } from '@/contracts/events'

/**
 * One socket per session. A new token (login, user switch) replaces the socket, so events from
 * the previous session can never reach the new one; logout leaves an anonymous socket for public events.
 */
let socket: Socket | null = null

export function connectRealtime(token: string | null) {
  socket?.disconnect()
  socket = io({ path: socketPath, transports: ['websocket'], auth: { token } })
  return socket
}

export function disconnectRealtime() {
  socket?.disconnect()
  socket = null
}
