import { StarIcon } from 'lucide-react'
import { cn } from 'cn'

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span
      className={cn('flex gap-1', className)}
      role="img"
      aria-label={`Nota ${rating.toLocaleString('pt-BR')} de 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon
          key={n}
          className={cn(
            'size-4 fill-current',
            n <= Math.round(rating) ? 'text-primary' : 'text-subtle',
          )}
        />
      ))}
    </span>
  )
}
