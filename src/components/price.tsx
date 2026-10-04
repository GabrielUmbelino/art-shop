import { formatEth } from '@/lib/money'
import { cn } from 'cn'

/** Price in ETH with the optional previous price struck through. */
export function Price({
  amount,
  compareAt,
  className,
}: {
  amount: string
  compareAt?: string | null
  className?: string
}) {
  return (
    <p
      className={cn(
        'flex flex-wrap items-baseline gap-x-2 font-bold tracking-wide text-highlight',
        className,
      )}
    >
      <span>{formatEth(amount, 2)}</span>
      {compareAt && (
        <>
          <s className="font-normal text-subtle" aria-hidden="true">
            {formatEth(compareAt, 2)}
          </s>
          <span className="sr-only">, antes {formatEth(compareAt, 2)}</span>
        </>
      )}
    </p>
  )
}
