import { useId } from 'react'
import type { FieldError as RhfError } from 'react-hook-form'
import { FieldError } from '@/components/ui/field'
import { cn } from 'cn'

type Control = {
  id: string
  'aria-invalid': boolean
  'aria-describedby'?: string
  'aria-required'?: boolean
}

/** Labelled control with the design's required asterisk and an associated error message. */
export function LabeledField({
  label,
  required,
  error,
  className,
  children,
}: {
  label: string
  required?: boolean
  error?: RhfError
  className?: string
  children: (control: Control) => React.ReactNode
}) {
  const id = useId()
  const errorId = `${id}-error`
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-[15px] tracking-wide">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1 text-required">
            *
          </span>
        )}
      </label>
      {children({
        id,
        'aria-invalid': !!error,
        'aria-describedby': error ? errorId : undefined,
        'aria-required': required || undefined,
      })}
      <FieldError id={errorId} errors={[error]} />
    </div>
  )
}

export const inputClass =
  'h-10 w-full rounded-[2.5px] border border-input bg-background px-3 text-sm placeholder:text-subtle focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-ring aria-invalid:border-destructive disabled:opacity-70'
