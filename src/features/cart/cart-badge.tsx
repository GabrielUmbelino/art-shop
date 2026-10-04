import { ShoppingCartIcon } from 'lucide-react'
import { cn } from 'cn'
import { useCart } from './use-cart'

/** Cart icon with the number of items, as in the design's header and tab bar. */
export function CartIcon({ className, filled }: { className?: string; filled?: boolean }) {
  const count = useCart().data?.items.length ?? 0
  return (
    <span className="relative inline-flex">
      <ShoppingCartIcon className={cn('size-6', filled && 'fill-current', className)} />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
        >
          {count}
        </span>
      )}
      <span className="sr-only">{count === 1 ? ', 1 item' : `, ${count} itens`}</span>
    </span>
  )
}
