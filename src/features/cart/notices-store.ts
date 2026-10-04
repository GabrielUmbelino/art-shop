import { useSyncExternalStore } from 'react'

/** Realtime changes to items in the cart, shown on the cart page until dismissed. */
export type CartNotice = { id: string; message: string }

let notices: CartNotice[] = []
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export const cartNotices = {
  add(added: CartNotice[]) {
    notices = [...notices, ...added]
    emit()
  },
  dismiss(id: string) {
    notices = notices.filter((n) => n.id !== id)
    emit()
  },
  clear() {
    notices = []
    emit()
  },
}

export function useCartNotices() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => notices,
  )
}
