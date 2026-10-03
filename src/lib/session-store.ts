/**
 * The session token, persisted so the session survives a refresh.
 * Listeners run on every change; `reason` tells why a session ended.
 */
export type SessionEnd = 'logout' | 'expired' | 'unauthenticated'

const KEY = 'kurio:token'
const listeners = new Set<(reason?: SessionEnd) => void>()

let token = localStorage.getItem(KEY)

export const getToken = () => token

export function setToken(next: string | null, reason?: SessionEnd) {
  if (next === token) return
  token = next
  if (next) localStorage.setItem(KEY, next)
  else localStorage.removeItem(KEY)
  for (const listener of listeners) listener(reason)
}

export function subscribeToken(listener: (reason?: SessionEnd) => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
