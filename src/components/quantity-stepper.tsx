import { MinusIcon, PlusIcon } from 'lucide-react'
import { cn } from 'cn'

const button =
  'flex items-center justify-center bg-primary text-primary-foreground hover:bg-highlight focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-40'
const sizes = { round: 'size-8 rounded-full', square: 'size-6 rounded-sm' }

/** Minus/plus buttons around the value, bounded by min and max. */
export function QuantityStepper({
  value,
  max,
  min = 1,
  label,
  variant = 'round',
  disabled,
  onChange,
}: {
  value: number
  max: number
  min?: number
  label: string
  /** Round on the NFT page, small squares in the cart (as designed). */
  variant?: 'round' | 'square'
  disabled?: boolean
  onChange: (value: number) => void
}) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-3">
      <button
        type="button"
        className={cn(button, sizes[variant])}
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
        aria-label="Diminuir quantidade"
      >
        <MinusIcon className="size-4" />
      </button>
      <output aria-live="polite" className="min-w-6 text-center text-lg">
        {value}
      </output>
      <button
        type="button"
        className={cn(button, sizes[variant])}
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
        aria-label="Aumentar quantidade"
      >
        <PlusIcon className="size-4" />
      </button>
    </div>
  )
}
