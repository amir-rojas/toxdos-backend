import { BadRequestError } from './errors'

/**
 * Parses a route param or query string value as a positive integer.
 * Throws BadRequestError (400) if the value is not a valid positive integer.
 */
export function parseId(value: string | string[] | undefined, label = 'id'): number {
  const raw = Array.isArray(value) ? value[0] : value
  const n = Number(raw)
  if (!Number.isInteger(n) || n <= 0) {
    throw new BadRequestError(`Invalid ${label}: must be a positive integer`, 'VALIDATION_ERROR')
  }
  return n
}
