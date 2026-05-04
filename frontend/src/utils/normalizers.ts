/** Accepts a bare array or Laravel-style `{ data: [] }`. */
export function normalizeArray(input: unknown): unknown[] {
  if (Array.isArray(input)) return input
  if (
    input !== null &&
    typeof input === 'object' &&
    Array.isArray((input as { data?: unknown }).data)
  ) {
    return (input as { data: unknown[] }).data
  }
  return []
}

export function safeMap<T, R>(input: unknown, fn: (item: T, index: number) => R): R[] {
  return normalizeArray(input).map((item, index) => fn(item as T, index))
}
