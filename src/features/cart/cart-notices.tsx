import { XIcon } from 'lucide-react'
import { cartNotices, useCartNotices } from './notices-store'

/** Price and availability changes received while the cart is open (also announced and toasted). */
export function CartNotices() {
  const notices = useCartNotices()
  if (!notices.length) return null
  return (
    <ul aria-label="Alterações no carrinho" className="flex flex-col gap-2">
      {notices.map((notice) => (
        <li
          key={notice.id}
          className="flex items-start justify-between gap-3 rounded-sm border border-primary bg-card px-4 py-3 text-sm"
        >
          <span>{notice.message}</span>
          <button
            type="button"
            onClick={() => cartNotices.dismiss(notice.id)}
            aria-label="Dispensar aviso"
            className="text-subtle hover:text-highlight focus-visible:outline-2 focus-visible:outline-ring"
          >
            <XIcon className="size-4" />
          </button>
        </li>
      ))}
    </ul>
  )
}
