import { MinusIcon, PlusIcon } from 'lucide-react'

const button =
  'flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-highlight focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-40'

/** Round minus/plus buttons around the value, bounded by min and max. */
export function QuantityStepper({
  value,
  max,
  min = 1,
  label,
  onChange,
}: {
  value: number
  max: number
  min?: number
  label: string
  onChange: (value: number) => void
}) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-3">
      <button
        type="button"
        className={button}
        disabled={value <= min}
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
        className={button}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        aria-label="Aumentar quantidade"
      >
        <PlusIcon className="size-4" />
      </button>
    </div>
  )
}
