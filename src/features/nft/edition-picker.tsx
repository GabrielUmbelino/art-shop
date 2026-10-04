import type { Edition } from '@/contracts/nft'
import { cn } from 'cn'

/** Edition pills as a radio group; sold-out editions stay visible but cannot be chosen. */
export function EditionPicker({
  editions,
  value,
  onChange,
}: {
  editions: Edition[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-bold">Edição:</legend>
      <div className="flex flex-wrap gap-2">
        {editions.map((edition) => {
          const soldOut = edition.available === 0
          return (
            <label
              key={edition.id}
              className={cn(
                'flex h-7 cursor-pointer items-center rounded-full border border-border px-3 text-sm text-muted-foreground uppercase has-checked:border-highlight has-checked:text-highlight has-focus-visible:outline-2 has-focus-visible:outline-ring',
                soldOut && 'cursor-not-allowed line-through opacity-50',
              )}
            >
              <input
                type="radio"
                name="edition"
                value={edition.id}
                checked={edition.id === value}
                disabled={soldOut}
                onChange={() => onChange(edition.id)}
                className="sr-only"
              />
              {edition.name}
              {soldOut && <span className="sr-only"> (esgotada)</span>}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
