import { cn } from 'cn'

/** ENS name typed without the suffix; the value includes ".eth" (empty when nothing is typed). */
export function EnsInput({
  value,
  onChange,
  onBlur,
  className,
  ...control
}: {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  className: string
  id?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
  'aria-required'?: boolean
}) {
  return (
    <div className="flex gap-2">
      <span
        className="flex h-10 items-center rounded-[2.5px] border border-input px-3 text-sm"
        aria-hidden="true"
      >
        .eth
      </span>
      <input
        {...control}
        value={value.replace(/\.eth$/, '')}
        onChange={(e) => onChange(e.target.value.trim() ? `${e.target.value.trim()}.eth` : '')}
        onBlur={onBlur}
        placeholder="nome"
        autoCapitalize="none"
        className={cn(className)}
      />
    </div>
  )
}
