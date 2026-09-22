import axios from 'axios';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

import type { ApiErrorShape } from '@/lib/api/client';

/**
 * Maps the backend's `errors: [{field, message}]` (422/400 validation shape, prompt.md §5) onto
 * react-hook-form fields. Returns true if at least one field error was applied — the caller
 * should still show a toast when this returns false (e.g. a non-field-level error).
 */
export function applyServerFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): boolean {
  if (!axios.isAxiosError<ApiErrorShape>(error)) return false;
  const fieldErrors = error.response?.data?.errors;
  if (!fieldErrors?.length) return false;

  for (const { field, message } of fieldErrors) {
    setError(field as Path<T>, { type: 'server', message });
  }
  return true;
}
