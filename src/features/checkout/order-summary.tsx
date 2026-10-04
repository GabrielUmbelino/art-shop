import { Link } from '@tanstack/react-router'
import { NftImage } from '@/components/nft-image'
import { Skeleton } from '@/components/ui/skeleton'
import type { CartItem, Quote } from '@/contracts/cart'
import { formatEth } from '@/lib/money'

/** "Seus NFTs" lines and totals, all from the quote. */
export function OrderSummary({ items, quote }: { items: CartItem[]; quote: Quote | undefined }) {
  const row = 'flex items-center justify-between gap-4 tracking-wide'
  const value = (amount: string | undefined) =>
    amount === undefined ? <Skeleton className="h-6 w-24" /> : formatEth(amount)
  return (
    <section aria-labelledby="summary-nfts" className="flex flex-col gap-3">
      <h2 id="summary-nfts" className="text-lg font-bold tracking-wide">
        Seus NFTs
      </h2>
      <ul className="flex flex-col gap-3">
        {items.map((item) => {
          const line = quote?.lines.find((l) => l.itemId === item.id)
          return (
            <li key={item.id} className="flex items-center gap-3 bg-card">
              <NftImage src={item.image} alt="" sizes="70px" className="size-[70px]" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{item.name}</p>
                <p className="text-sm text-subtle">ID do token: {item.tokenId}</p>
              </div>
              <span className="text-sm text-subtle">(x {item.quantity})</span>
              <span className="pr-3 font-bold text-highlight">
                {line ? formatEth(line.lineTotal) : <Skeleton className="h-6 w-16" />}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="text-center text-sm">
        Tem um código promocional?{' '}
        <Link to="/cart" className="text-highlight hover:underline">
          Aplique aqui
        </Link>
      </p>
      <dl className="flex flex-col gap-2 text-[15px]" aria-live="polite">
        <div className={row}>
          <dt>Subtotal</dt>
          <dd className="text-lg">{value(quote?.subtotal)}</dd>
        </div>
        <div className={row}>
          <dt>Desconto do lançamento</dt>
          <dd>{quote ? `(-) ${formatEth(quote.discount)}` : value(undefined)}</dd>
        </div>
        <div className={row}>
          <dt>Taxa de rede</dt>
          <dd className="text-lg">{value(quote?.networkFee)}</dd>
        </div>
        <p className="text-center text-xs text-highlight">Taxa estimada</p>
        <div className={`${row} border-t border-border pt-3 font-bold`}>
          <dt>Total</dt>
          <dd className="text-lg text-highlight">{value(quote?.total)}</dd>
        </div>
      </dl>
    </section>
  )
}
