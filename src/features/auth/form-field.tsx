import { useId } from 'react'
import type { FieldError as RhfError } from 'react-hook-form'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'

/**
 * Label + control + error, wired for assistive technology. The auth designs show no visible
 * labels (placeholders only), so `hideLabel` keeps the label for screen readers only.
 */
export function FormField({
  label,
  error,
  hideLabel,
  children,
}: {
  label: string
  error?: RhfError
  hideLabel?: boolean
  children: (control: {
    id: string
    'aria-invalid': boolean
    'aria-describedby'?: string
  }) => React.ReactNode
}) {
  const id = useId()
  const errorId = `${id}-error`
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id} className={hideLabel ? 'sr-only' : undefined}>
        {label}
      </FieldLabel>
      {children({ id, 'aria-invalid': !!error, 'aria-describedby': error ? errorId : undefined })}
      <FieldError id={errorId} errors={[error]} />
    </Field>
  )
}
