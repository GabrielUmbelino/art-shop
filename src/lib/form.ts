import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError } from '@/api/http'

/** Maps API field errors onto the form; anything else becomes a form-level error message. */
export function applyApiError<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>) {
  if (!(error instanceof ApiError)) throw error
  const entries = Object.entries(error.fieldErrors)
  for (const [field, message] of entries) setError(field as Path<T>, { message })
  if (!entries.length) setError('root.server' as Path<T>, { message: error.message })
}
